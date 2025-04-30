from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import DietItem
from .serializers import DietItemSerializer

class DietItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Diet Items to be viewed or edited.
    Supports filtering by date using query parameter: ?date=YYYY-MM-DD
    """
    serializer_class = DietItemSerializer
    queryset = DietItem.objects.all() # Base queryset

    def get_queryset(self):
        """
        Optionally restricts the returned diet items to a given date,
        by filtering against a `date` query parameter in the URL.
        """
        queryset = DietItem.objects.all().order_by('scheduled_date', 'timing') # Ensure sorting
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                # Validate date format if needed
                queryset = queryset.filter(scheduled_date=date_param)
            except ValueError:
                # Handle invalid date format if necessary
                pass 
        return queryset

    # Custom action to mark an item as administered
    @action(detail=True, methods=['post'], url_path='mark-administered')
    def mark_administered(self, request, pk=None):
        item = self.get_object()
        if not item.is_skipped:
            item.is_administered = True
            item.administered_at = timezone.now()
            item.is_skipped = False # Ensure skipped is false
            item.save()
            serializer = self.get_serializer(item)
            return Response(serializer.data)
        else:
            return Response({'status': 'failed', 'message': 'Item is already marked as skipped.'}, status=status.HTTP_400_BAD_REQUEST)

    # Custom action to mark an item as skipped
    @action(detail=True, methods=['post'], url_path='mark-skipped')
    def mark_skipped(self, request, pk=None):
        item = self.get_object()
        if not item.is_administered:
            item.is_skipped = True
            item.is_administered = False # Ensure administered is false
            item.administered_at = None # Clear timestamp if previously set somehow
            item.save()
            serializer = self.get_serializer(item)
            return Response(serializer.data)
        else:
            return Response({'status': 'failed', 'message': 'Item is already marked as administered.'}, status=status.HTTP_400_BAD_REQUEST)
            
    # Custom action to reset status (mark as pending)
    @action(detail=True, methods=['post'], url_path='mark-pending')
    def mark_pending(self, request, pk=None):
        item = self.get_object()
        item.is_skipped = False
        item.is_administered = False 
        item.administered_at = None 
        item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data)