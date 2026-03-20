"""
Migration 0116: Add daily rate negotiation fields to JobApplication.

Panelist #1: Allow workers to negotiate number of days + daily rate during application.
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0115_multi_slot_worker_assignments"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobapplication",
            name="proposed_daily_rate",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Worker's proposed daily rate (only for DAILY payment_model jobs)",
                max_digits=10,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="proposed_days",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Worker's proposed number of work days (only for DAILY payment_model jobs)",
                null=True,
            ),
        ),
    ]
