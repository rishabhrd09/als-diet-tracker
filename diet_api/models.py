# diet_api/models.py
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError # Import for clean method

# Represents a reusable food/formula definition
class FoodFormula(models.Model):
    name = models.CharField(max_length=200, unique=True, help_text="Unique name for the food/formula")
    default_quantity_ml = models.PositiveIntegerField(null=True, blank=True, help_text="Optional default quantity in ml")
    default_calories = models.PositiveIntegerField(null=True, blank=True)
    default_protein_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    default_carbs_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    default_fat_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    default_description = models.TextField(blank=True, help_text="Optional default notes or ingredients")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


# Represents an item in the default daily schedule template
class ScheduledItemTemplate(models.Model):
    timing = models.TimeField(help_text="Scheduled time for this item in the default day")
    food_formula = models.ForeignKey(
        FoodFormula,
        on_delete=models.CASCADE, # <<< CHANGE: Delete template if formula is deleted
        null=True, # Still allow template without formula (using custom_name)
        blank=True,
        help_text="Select a pre-defined formula (optional)"
    )
    custom_food_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Custom name if not using a pre-defined formula"
    )
    quantity_ml = models.PositiveIntegerField(help_text="Quantity in ml for this schedule slot (overrides formula default if set)")
    calories = models.PositiveIntegerField(null=True, blank=True, help_text="Calories for this slot (overrides formula default if set)")
    protein_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Protein(g) for this slot (overrides formula default if set)")
    carbs_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Carbs(g) for this slot (overrides formula default if set)")
    fat_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Fat(g) for this slot (overrides formula default if set)")
    description = models.TextField(blank=True, help_text="Specific notes for this time slot (supplements formula description)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_display_name(self):
        return self.food_formula.name if self.food_formula else self.custom_food_name

    def clean(self):
        if not self.food_formula and not self.custom_food_name:
            raise ValidationError('Must select a Food Formula or provide a Custom Food Name.')

    def __str__(self):
        return f"{self.timing.strftime('%I:%M %p')} - {self.get_display_name()}"

    class Meta:
        ordering = ['timing']
        # Consider unique constraint for timing if needed:
        # constraints = [
        #     models.UniqueConstraint(fields=['timing'], name='unique_template_timing')
        # ]


# Represents the actual tracked item for a specific day
class DietItem(models.Model):
    source_template = models.ForeignKey(
        ScheduledItemTemplate,
        on_delete=models.CASCADE, # <<< CHANGE: Delete daily item if its template is deleted
        null=True, # Still allow ad-hoc items not linked to a template
        blank=True,
        related_name='daily_items'
    )
    # Keep source_formula as SET_NULL: Deleting a formula shouldn't delete
    # ad-hoc daily items that might have used it. Only items generated
    # via a template (which is now CASCADE linked to formula) will be deleted.
    source_formula = models.ForeignKey(
        FoodFormula,
        on_delete=models.SET_NULL, # <<< KEEP AS SET_NULL
        null=True,
        blank=True,
        related_name='daily_items'
    )
    scheduled_date = models.DateField(default=timezone.now, db_index=True)
    food_name = models.CharField(max_length=200)
    timing = models.TimeField()
    quantity_ml = models.PositiveIntegerField()
    calories = models.PositiveIntegerField(null=True, blank=True)
    protein_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    carbs_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    fat_g = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='diet_images/', null=True, blank=True)
    is_administered = models.BooleanField(default=False, db_index=True)
    administered_at = models.DateTimeField(null=True, blank=True)
    is_skipped = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = "Administered" if self.is_administered else ("Skipped" if self.is_skipped else "Pending")
        return f"{self.food_name} at {self.timing.strftime('%I:%M %p')} on {self.scheduled_date} ({status})"

    class Meta:
        ordering = ['scheduled_date', 'timing']
        # Removed the unique constraint based on source_template as CASCADE handles deletion.
        # If you need to prevent manual re-creation, add checks elsewhere.
        # constraints = [
        #     models.UniqueConstraint(fields=['scheduled_date', 'source_template'], name='unique_daily_item_from_template')
        # ]

