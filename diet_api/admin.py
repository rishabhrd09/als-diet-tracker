from django.contrib import admin
from .models import DietItem

@admin.register(DietItem)
class DietItemAdmin(admin.ModelAdmin):
    list_display = ('food_name', 'scheduled_date', 'timing', 'quantity_ml', 'calories', 'is_administered', 'is_skipped')
    list_filter = ('scheduled_date', 'is_administered', 'is_skipped')
    search_fields = ('food_name', 'description')
    readonly_fields = ('administered_at', 'created_at', 'updated_at')