# diet_api/admin.py
from django.contrib import admin
from .models import FoodFormula, ScheduledItemTemplate, DietItem

@admin.register(FoodFormula)
class FoodFormulaAdmin(admin.ModelAdmin):
    list_display = ('name', 'default_quantity_ml', 'default_calories', 'default_protein_g', 'updated_at')
    search_fields = ('name', 'default_description')

@admin.register(ScheduledItemTemplate)
class ScheduledItemTemplateAdmin(admin.ModelAdmin):
    list_display = ('timing', 'get_display_name', 'quantity_ml', 'food_formula')
    list_filter = ('timing',)
    autocomplete_fields = ['food_formula'] # Makes selecting formula easier if many exist
    search_fields = ('custom_food_name', 'food_formula__name', 'description')

    def get_display_name(self, obj):
        # Helper to display name consistently in admin
        return obj.get_display_name()
    get_display_name.short_description = 'Food/Formula Name'


@admin.register(DietItem)
class DietItemAdmin(admin.ModelAdmin):
    list_display = ('food_name', 'scheduled_date', 'timing', 'quantity_ml', 'is_administered', 'is_skipped', 'source_template')
    list_filter = ('scheduled_date', 'is_administered', 'is_skipped', 'timing')
    search_fields = ('food_name', 'description', 'source_template__custom_food_name', 'source_formula__name')
    readonly_fields = ('administered_at', 'created_at', 'updated_at')
    list_editable = ('is_administered', 'is_skipped') # Allow quick status changes in admin list view
    date_hierarchy = 'scheduled_date' # Add date navigation bar
    autocomplete_fields = ['source_template', 'source_formula']