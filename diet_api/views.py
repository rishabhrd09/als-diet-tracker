# diet_api/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction, models as db_models
from django.shortcuts import get_object_or_404
from .models import FoodFormula, ScheduledItemTemplate, DietItem
from .serializers import FoodFormulaSerializer, ScheduledItemTemplateSerializer, DietItemSerializer
import datetime

# --- FoodFormulaViewSet and ScheduledItemTemplateViewSet remain the same ---
class FoodFormulaViewSet(viewsets.ModelViewSet):
    queryset = FoodFormula.objects.all().order_by('name')
    serializer_class = FoodFormulaSerializer

class ScheduledItemTemplateViewSet(viewsets.ModelViewSet):
    queryset = ScheduledItemTemplate.objects.all().order_by('timing')
    serializer_class = ScheduledItemTemplateSerializer


# # --- DietItemViewSet with Smart Sync ---
# class DietItemViewSet(viewsets.ModelViewSet):
#     serializer_class = DietItemSerializer

#     def get_queryset(self):
#         queryset = DietItem.objects.all()
#         date_param = self.request.query_params.get('date')

#         if not date_param: return DietItem.objects.none()
#         try: target_date = datetime.datetime.strptime(date_param, '%Y-%m-%d').date()
#         except ValueError: return DietItem.objects.none()

#         # --- Synchronization Logic for Today/Future Dates ---
#         today = timezone.now().date()
#         if target_date >= today:
#             try:
#                 with transaction.atomic():
#                     self._synchronize_template_items(target_date)
#             except Exception as e:
#                 print(f"Error during template sync for {target_date}: {e}")
#                 # Consider how to handle sync errors - log and continue for now
#         # --- End Synchronization Logic ---

#         queryset = queryset.filter(scheduled_date=target_date)
#         return queryset.order_by('timing')

class DietItemViewSet(viewsets.ModelViewSet):
    serializer_class = DietItemSerializer

    def get_queryset(self):
        # Handle LIST action separately with date filtering and sync
        if self.action == 'list':
            date_param = self.request.query_params.get('date')
            
            if not date_param:
                return DietItem.objects.none()
            
            try:
                target_date = datetime.datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                return DietItem.objects.none()

            # Sync logic only for today/future dates
            today = timezone.now().date()
            if target_date >= today:
                try:
                    with transaction.atomic():
                        self._synchronize_template_items(target_date)
                except Exception as e:
                    print(f"Sync error: {e}")

            return DietItem.objects.filter(
                scheduled_date=target_date
            ).order_by('timing')

        # For all other actions (retrieve, update, partial_update, destroy)
        # Return full queryset without date filtering
        return DietItem.objects.all()


    def _synchronize_template_items(self, target_date):
        """
        Synchronizes PENDING DietItems for a given date with the current
        ScheduledItemTemplate. Adds missing, updates specific fields if changed
        in template, removes orphaned pending items.
        Does NOT touch administered/skipped items or manually added items.
        Does NOT overwrite manually edited descriptions/nutrients/images on pending items.
        """
        print(f"--- Syncing template items for {target_date} ---")
        current_templates = ScheduledItemTemplate.objects.all()
        # Fetch only PENDING items originating from a template for potential modification/deletion
        pending_template_items = DietItem.objects.filter(
            scheduled_date=target_date,
            source_template__isnull=False,
            is_administered=False,
            is_skipped=False
        )
        # Fetch IDs of non-pending items to avoid regenerating them
        non_pending_template_ids = set(
            DietItem.objects.filter(
                scheduled_date=target_date,
                source_template__isnull=False
            ).exclude(
                is_administered=False, is_skipped=False # Exclude pending items
            ).values_list('source_template_id', flat=True)
        )

        templates_dict = {template.id: template for template in current_templates}
        pending_items_dict = {item.source_template_id: item for item in pending_template_items}

        items_to_create = []
        items_to_update = []
        ids_to_delete = []

        # 1. Process current templates: Add missing or identify updates for PENDING items
        for template_id, template in templates_dict.items():
            pending_item = pending_items_dict.get(template_id)

            # Skip if an item from this template exists and is NOT pending
            if template_id in non_pending_template_ids:
                continue

            # Determine current details from template
            # Use get_display_name() for consistency
            food_name = template.get_display_name()
            quantity = template.quantity_ml
            # Get other details primarily from template, fallback to formula only if template field is null/blank
            calories = template.calories if template.calories is not None else (template.food_formula.default_calories if template.food_formula else None)
            protein = template.protein_g if template.protein_g is not None else (template.food_formula.default_protein_g if template.food_formula else None)
            carbs = template.carbs_g if template.carbs_g is not None else (template.food_formula.default_carbs_g if template.food_formula else None)
            fat = template.fat_g if template.fat_g is not None else (template.food_formula.default_fat_g if template.food_formula else None)
            # Template description takes priority if present
            description = template.description if template.description else (template.food_formula.default_description if template.food_formula else '')


            if pending_item:
                # Template exists, corresponding PENDING item exists: Check for updates to CORE fields
                needs_update = False
                # Check fields that should reflect the template directly
                if pending_item.timing != template.timing: pending_item.timing = template.timing; needs_update = True
                if pending_item.food_name != food_name: pending_item.food_name = food_name; needs_update = True # Update name based on template logic
                if pending_item.quantity_ml != quantity: pending_item.quantity_ml = quantity; needs_update = True
                if pending_item.source_formula != template.food_formula: pending_item.source_formula = template.food_formula; needs_update = True

                # Check optional fields ONLY if the user hasn't likely edited them
                # Heuristic: If the pending item's value matches the OLD template/formula value, update it.
                # This is complex. Simpler: ONLY update core fields above, leave nutrients/desc alone.
                # Let's stick to updating core fields only for now.
                # if pending_item.calories != calories: pending_item.calories = calories; needs_update = True
                # if pending_item.protein_g != protein: pending_item.protein_g = protein; needs_update = True
                # if pending_item.carbs_g != carbs: pending_item.carbs_g = carbs; needs_update = True
                # if pending_item.fat_g != fat: pending_item.fat_g = fat; needs_update = True
                # if pending_item.description != description: pending_item.description = description; needs_update = True


                if needs_update:
                    print(f"Sync: Marking item ID {pending_item.id} (from template {template_id}) for update.")
                    items_to_update.append(pending_item)
            else:
                # Template exists, but no corresponding item (pending or otherwise) exists: Create it
                 print(f"Sync: Marking item from template {template_id} for creation.")
                 items_to_create.append(
                    DietItem(
                        source_template=template, source_formula=template.food_formula,
                        scheduled_date=target_date, timing=template.timing,
                        food_name=food_name, quantity_ml=quantity, calories=calories,
                        protein_g=protein, carbs_g=carbs, fat_g=fat, description=description,
                        is_administered=False, is_skipped=False
                    )
                )

        # 2. Process existing PENDING items: Identify deletions if template is gone
        for template_id, pending_item in pending_items_dict.items():
            if template_id not in templates_dict:
                # This pending item's template no longer exists: Delete the PENDING item
                print(f"Sync: Marking PENDING item ID {pending_item.id} (from template {template_id}) for deletion.")
                ids_to_delete.append(pending_item.id)

        # 3. Perform database operations
        if ids_to_delete:
            deleted_count, _ = DietItem.objects.filter(id__in=ids_to_delete).delete()
            print(f"Sync deleted {deleted_count} orphaned pending items.")
        if items_to_create:
            created_items = DietItem.objects.bulk_create(items_to_create, ignore_conflicts=True)
            print(f"Sync created {len(created_items)} new items from template.")
        if items_to_update:
            # Define ONLY the core fields to update during sync
            update_fields = ['timing', 'food_name', 'quantity_ml', 'source_formula']
            updated_count = DietItem.objects.bulk_update(items_to_update, update_fields)
            print(f"Sync updated {updated_count} pending items from template.")
        print(f"--- Sync complete for {target_date} ---")

    # --- Standard Actions (Create, Update, Destroy, Status Changes) ---
    # These operate on specific DietItem instances via their PK

    def perform_create(self, serializer):
        # For adding Ad-hoc items
        print(f"--- Creating Ad-hoc DietItem ---")
        serializer.save()

    def perform_update(self, serializer):
        # For PUT/PATCH requests (editing a specific daily item)
        instance = serializer.instance
        print(f"--- Updating DietItem pk={instance.pk} ---")
        # Add logic here if you want to mark an item as 'manually_modified'
        # instance.manually_modified = True # If you add such a field
        serializer.save()

    def perform_destroy(self, instance):
        # For DELETE requests
        print(f"--- Deleting DietItem pk={instance.pk} ---")
        instance.delete()

    # Status change actions
    @action(detail=True, methods=['post'], url_path='mark-administered')
    def mark_administered(self, request, pk=None):
        print(f"--- Attempting mark_administered for DietItem pk={pk} ---")
        item = get_object_or_404(DietItem, pk=pk)
        if not item.is_skipped:
            item.is_administered = True; item.administered_at = timezone.now(); item.is_skipped = False; item.save()
            print(f"Marked pk={pk} as administered.")
            return Response(self.get_serializer(item).data)
        else: return Response({'status': 'failed', 'message': 'Item is already marked as skipped.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='mark-skipped')
    def mark_skipped(self, request, pk=None):
        print(f"--- Attempting mark_skipped for DietItem pk={pk} ---")
        item = get_object_or_404(DietItem, pk=pk)
        if not item.is_administered:
            item.is_skipped = True; item.is_administered = False; item.administered_at = None; item.save()
            print(f"Marked pk={pk} as skipped.")
            return Response(self.get_serializer(item).data)
        else: return Response({'status': 'failed', 'message': 'Item is already marked as administered.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='mark-pending')
    def mark_pending(self, request, pk=None):
        print(f"--- Attempting mark_pending for DietItem pk={pk} ---")
        item = get_object_or_404(DietItem, pk=pk)
        item.is_skipped = False; item.is_administered = False; item.administered_at = None; item.save()
        print(f"Marked pk={pk} as pending.")
        return Response(self.get_serializer(item).data)

