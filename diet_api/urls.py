from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DietItemViewSet

router = DefaultRouter()
router.register(r'diet-items', DietItemViewSet, basename='dietitem')

urlpatterns = [
    path('', include(router.urls)),
]