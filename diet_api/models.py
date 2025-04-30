from django.db import models
from django.utils import timezone

class DietItem(models.Model):
    food_name = models.CharField(max_length=200)
    scheduled_date = models.DateField(default=timezone.now) # Date for the schedule item
    timing = models.TimeField()
    quantity_ml = models.PositiveIntegerField()
    calories = models.PositiveIntegerField(null=True, blank=True)
    protein_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    carbs_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    fat_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='diet_images/', null=True, blank=True) # Store images in media/diet_images/
    is_administered = models.BooleanField(default=False) # Track if given
    administered_at = models.DateTimeField(null=True, blank=True) # Timestamp when administered
    is_skipped = models.BooleanField(default=False) # Track if skipped
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.food_name} at {self.timing.strftime('%I:%M %p')} on {self.scheduled_date}"

    class Meta:
        ordering = ['scheduled_date', 'timing'] # Default ordering