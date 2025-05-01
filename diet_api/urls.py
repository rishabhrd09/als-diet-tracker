# diet_api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DietItemViewSet,
    FoodFormulaViewSet,         # Import new viewset
    ScheduledItemTemplateViewSet # Import new viewset
)

router = DefaultRouter()
router.register(r'diet-items', DietItemViewSet, basename='dietitem')
router.register(r'food-formulas', FoodFormulaViewSet, basename='foodformula') # Register new viewset
router.register(r'schedule-templates', ScheduledItemTemplateViewSet, basename='scheduletemplate') # Register new viewset

urlpatterns = [
    path('', include(router.urls)),
]