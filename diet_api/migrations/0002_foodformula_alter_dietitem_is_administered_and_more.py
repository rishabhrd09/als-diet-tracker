# Generated by Django 5.2 on 2025-05-01 01:27

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('diet_api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FoodFormula',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Unique name for the food/formula', max_length=200, unique=True)),
                ('default_quantity_ml', models.PositiveIntegerField(blank=True, help_text='Optional default quantity in ml', null=True)),
                ('default_calories', models.PositiveIntegerField(blank=True, null=True)),
                ('default_protein_g', models.DecimalField(blank=True, decimal_places=1, max_digits=5, null=True)),
                ('default_carbs_g', models.DecimalField(blank=True, decimal_places=1, max_digits=5, null=True)),
                ('default_fat_g', models.DecimalField(blank=True, decimal_places=1, max_digits=5, null=True)),
                ('default_description', models.TextField(blank=True, help_text='Optional default notes or ingredients')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.AlterField(
            model_name='dietitem',
            name='is_administered',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name='dietitem',
            name='scheduled_date',
            field=models.DateField(db_index=True, default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name='dietitem',
            name='source_formula',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='daily_items', to='diet_api.foodformula'),
        ),
        migrations.CreateModel(
            name='ScheduledItemTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timing', models.TimeField(help_text='Scheduled time for this item in the default day')),
                ('custom_food_name', models.CharField(blank=True, help_text='Custom name if not using a pre-defined formula', max_length=200)),
                ('quantity_ml', models.PositiveIntegerField(help_text='Quantity in ml for this schedule slot (overrides formula default if set)')),
                ('calories', models.PositiveIntegerField(blank=True, help_text='Calories for this slot (overrides formula default if set)', null=True)),
                ('protein_g', models.DecimalField(blank=True, decimal_places=1, help_text='Protein(g) for this slot (overrides formula default if set)', max_digits=5, null=True)),
                ('carbs_g', models.DecimalField(blank=True, decimal_places=1, help_text='Carbs(g) for this slot (overrides formula default if set)', max_digits=5, null=True)),
                ('fat_g', models.DecimalField(blank=True, decimal_places=1, help_text='Fat(g) for this slot (overrides formula default if set)', max_digits=5, null=True)),
                ('description', models.TextField(blank=True, help_text='Specific notes for this time slot (supplements formula description)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('food_formula', models.ForeignKey(blank=True, help_text='Select a pre-defined formula (optional)', null=True, on_delete=django.db.models.deletion.SET_NULL, to='diet_api.foodformula')),
            ],
            options={
                'ordering': ['timing'],
            },
        ),
        migrations.AddField(
            model_name='dietitem',
            name='source_template',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='daily_items', to='diet_api.scheduleditemtemplate'),
        ),
        migrations.AddConstraint(
            model_name='dietitem',
            constraint=models.UniqueConstraint(fields=('scheduled_date', 'source_template'), name='unique_daily_item_from_template'),
        ),
    ]
