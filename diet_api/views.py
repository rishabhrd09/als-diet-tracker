# diet_api/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction # Import transaction
from .models import FoodFormula, ScheduledItemTemplate, DietItem
from .serializers import FoodFormulaSerializer, ScheduledItemTemplateSerializer, DietItemSerializer
import datetime # Import datetime

# --- New ViewSets ---
class FoodFormulaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing the Food Formula library.
    """
    queryset = FoodFormula.objects.all()
    serializer_class = FoodFormulaSerializer
    # Add filtering/search if needed
    # filter_backends = [filters.SearchFilter]
    # search_fields = ['name', 'default_description']

class ScheduledItemTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing the default Fixed Diet Schedule template.
    """
    queryset = ScheduledItemTemplate.objects.all().order_by('timing') # Ensure sorted by time
    serializer_class = ScheduledItemTemplateSerializer


# --- Modified ViewSet ---
class DietItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and modifying daily diet items.
    - GET /api/diet-items/?date=YYYY-MM-DD : Retrieves items for the specified date.
      If no items exist for that date, it generates them from the schedule template.
    - POST /api/diet-items/ : Creates an ad-hoc item for a specific date.
    """
    serializer_class = DietItemSerializer

    def get_queryset(self):
        """
        Filters DietItems based on the 'date' query parameter.
        """
        queryset = DietItem.objects.all()
        date_param = self.request.query_params.get('date')

        if date_param:
            try:
                target_date = datetime.datetime.strptime(date_param, '%Y-%m-%d').date()
                # Check if items exist for this date
                items_exist = DietItem.objects.filter(scheduled_date=target_date).exists()

                if not items_exist:
                    # If no items exist, generate them from the template
                    self.generate_items_for_date(target_date)

                queryset = queryset.filter(scheduled_date=target_date)
            except ValueError:
                # Handle invalid date format - return empty queryset or raise error
                return DietItem.objects.none()
        else:
            # Optional: Return today's items if no date specified, or none
            # today = timezone.now().date()
            # queryset = queryset.filter(scheduled_date=today)
            # For now, require a date parameter
             return DietItem.objects.none()


        return queryset.order_by('timing') # Ensure results are sorted

    @transaction.atomic # Ensure all items are created or none are
    def generate_items_for_date(self, target_date):
        """
        Generates DietItem records for a given date based on ScheduledItemTemplate.
        This is called automatically by get_queryset if items for the date don't exist.
        """
        templates = ScheduledItemTemplate.objects.all()
        items_to_create = []

        for template in templates:
            # Determine details, prioritizing template overrides, then formula defaults
            food_name = template.custom_food_name or (template.food_formula.name if template.food_formula else 'Unnamed Item')
            quantity = template.quantity_ml # Template quantity is mandatory per model now
            calories = template.calories if template.calories is not None else (template.food_formula.default_calories if template.food_formula else None)
            protein = template.protein_g if template.protein_g is not None else (template.food_formula.default_protein_g if template.food_formula else None)
            carbs = template.carbs_g if template.carbs_g is not None else (template.food_formula.default_carbs_g if template.food_formula else None)
            fat = template.fat_g if template.fat_g is not None else (template.food_formula.default_fat_g if template.food_formula else None)
            description = template.description or (template.food_formula.default_description if template.food_formula else '')
            # Image handling - maybe copy formula image if template doesn't specify one? More complex. Start without image copy.

            items_to_create.append(
                DietItem(
                    source_template=template,
                    source_formula=template.food_formula,
                    scheduled_date=target_date,
                    timing=template.timing,
                    food_name=food_name,
                    quantity_ml=quantity,
                    calories=calories,
                    protein_g=protein,
                    carbs_g=carbs,
                    fat_g=fat,
                    description=description,
                    # Set initial status
                    is_administered=False,
                    is_skipped=False
                )
            )
        
        # Bulk create for efficiency
        if items_to_create:
            DietItem.objects.bulk_create(items_to_create, ignore_conflicts=True) # ignore_conflicts handles potential race conditions if called twice

    # Override create to ensure date is provided for ad-hoc items
    def perform_create(self, serializer):
        # You might want validation to ensure scheduled_date is present in request data
        serializer.save()

    # Custom actions remain the same
    @action(detail=True, methods=['post'], url_path='mark-administered')
    def mark_administered(self, request, pk=None):
        item = self.get_object()
        # ... (rest of the action logic is unchanged) ...
        if not item.is_skipped:
            item.is_administered = True
            item.administered_at = timezone.now()
            item.is_skipped = False
            item.save()
            serializer = self.get_serializer(item)
            return Response(serializer.data)
        else:
            return Response({'status': 'failed', 'message': 'Item is already marked as skipped.'}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['post'], url_path='mark-skipped')
    def mark_skipped(self, request, pk=None):
        item = self.get_object()
        # ... (rest of the action logic is unchanged) ...
        if not item.is_administered:
            item.is_skipped = True
            item.is_administered = False
            item.administered_at = None
            item.save()
            serializer = self.get_serializer(item)
            return Response(serializer.data)
        else:
            return Response({'status': 'failed', 'message': 'Item is already marked as administered.'}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['post'], url_path='mark-pending')
    def mark_pending(self, request, pk=None):
        item = self.get_object()
        # ... (rest of the action logic is unchanged) ...
        item.is_skipped = False
        item.is_administered = False
        item.administered_at = None
        item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data)