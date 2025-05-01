# diet_api/serializers.py
from rest_framework import serializers
from .models import FoodFormula, ScheduledItemTemplate, DietItem
from django.core.exceptions import ValidationError # Import ValidationError for model's clean method

class FoodFormulaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodFormula
        fields = '__all__' # Include all fields for now

class ScheduledItemTemplateSerializer(serializers.ModelSerializer):
    # Optionally include nested FoodFormula details
    # food_formula_details = FoodFormulaSerializer(source='food_formula', read_only=True)
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = ScheduledItemTemplate
        fields = [
            'id',
            'timing',
            'food_formula', # ID for selection
            # 'food_formula_details', # Read-only nested object
            'custom_food_name',
            'display_name', # Read-only display name
            'quantity_ml',
            'calories',
            'protein_g',
            'carbs_g',
            'fat_g',
            'description',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ('display_name', 'created_at', 'updated_at')

    def get_display_name(self, obj):
        return obj.get_display_name()

    def validate(self, data):
        # Manual validation matching the model's clean method
        instance = ScheduledItemTemplate(**data)
        try:
            instance.clean()
        except ValidationError as e:
            raise serializers.ValidationError(e.args[0])
        return data

class DietItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(max_length=None, use_url=True, required=False, allow_null=True)
    timing_display = serializers.SerializerMethodField()
    # Optionally include nested source details
    # source_template_details = ScheduledItemTemplateSerializer(source='source_template', read_only=True)
    # source_formula_details = FoodFormulaSerializer(source='source_formula', read_only=True)

    class Meta:
        model = DietItem
        fields = [
            'id',
            'source_template', # ID only
            'source_formula',  # ID only
            'scheduled_date',
            'food_name',
            'timing',
            'timing_display',
            'quantity_ml',
            'calories',
            'protein_g',
            'carbs_g',
            'fat_g',
            'description',
            'image',
            'is_administered',
            'administered_at',
            'is_skipped',
            'created_at',
            'updated_at',
            # Optional nested details:
            # 'source_template_details',
            # 'source_formula_details',
        ]
        read_only_fields = [
            'administered_at',
            'created_at',
            'updated_at',
            'timing_display',
            # 'source_template_details',
            # 'source_formula_details',
        ]

    def get_timing_display(self, obj):
        return obj.timing.strftime('%I:%M %p')

    def validate(self, data):
        # Existing validation
        if data.get('is_administered', False) and data.get('is_skipped', False):
            raise serializers.ValidationError("An item cannot be both administered and skipped.")
        # Add any new validation if needed
        return data