# Generated manually for Daily Payment Model - Agency Employee Daily Rate
# Migration: 0008_agencyemployee_daily_rate

from django.db import migrations, models
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('agency', '0007_agencyemployee_name_breakdown_specializations'),
    ]

    operations = [
        # Add daily_rate to AgencyEmployee
        migrations.AddField(
            model_name='agencyemployee',
            name='daily_rate',
            field=models.DecimalField(
                max_digits=10,
                decimal_places=2,
                null=True,
                blank=True,
                help_text="Employee's daily rate in PHP"
            ),
        ),
        migrations.AddField(
            model_name='agencyemployee',
            name='hourly_rate',
            field=models.DecimalField(
                max_digits=10,
                decimal_places=2,
                null=True,
                blank=True,
                help_text="Employee's hourly rate in PHP"
            ),
        ),
        migrations.AddField(
            model_name='agencyemployee',
            name='is_available_daily_jobs',
            field=models.BooleanField(
                default=True,
                help_text="Whether employee accepts daily rate jobs"
            ),
        ),
    ]
