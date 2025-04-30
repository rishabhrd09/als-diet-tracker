from rest_framework import serializers
from .models import DietItem

class DietItemSerializer(serializers.ModelSerializer):
    # Make image field return the full URL
    image = serializers.ImageField(max_length=None, use_url=True, required=False, allow_null=True)
    # Format time for better readability in frontend if needed (optional)
    timing_display = serializers.SerializerMethodField()

    class Meta:
        model = DietItem
        fields = [
            'id', 
            'food_name', 
            'scheduled_date', 
            'timing', 
            'timing_display', # Add formatted time
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
            'updated_at'
        ]
        read_only_fields = ['administered_at', 'created_at', 'updated_at', 'timing_display'] # Fields computed or set by server

    def get_timing_display(self, obj):
        return obj.timing.strftime('%I:%M %p') # Format as HH:MM AM/PM
        
    # Add validation if needed, e.g., ensure not both administered and skipped
    def validate(self, data):
        if data.get('is_administered', False) and data.get('is_skipped', False):
            raise serializers.ValidationError("An item cannot be both administered and skipped.")
        return data