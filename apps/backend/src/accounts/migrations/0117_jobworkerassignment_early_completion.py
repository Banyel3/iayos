"""
Migration: Add early completion fields to JobWorkerAssignment.

Panelist #2: Per-worker early completion with full pay on DAILY team jobs.
When a client marks a worker as done early, the worker receives the full
contracted amount (daily_rate × total_days) as a lump-sum payout for
remaining days.
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0116_jobapplication_daily_rate_negotiation"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobworkerassignment",
            name="early_completed",
            field=models.BooleanField(
                default=False,
                help_text="Whether this worker was completed early with full pay",
            ),
        ),
        migrations.AddField(
            model_name="jobworkerassignment",
            name="early_completed_at",
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text="When the worker was early-completed",
            ),
        ),
        migrations.AddField(
            model_name="jobworkerassignment",
            name="early_completion_payout",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=10,
                null=True,
                help_text="Lump-sum payout for remaining days on early completion",
            ),
        ),
    ]
