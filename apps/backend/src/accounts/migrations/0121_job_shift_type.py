from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0120_job_single_daily_early_completion"),
    ]

    operations = [
        # Add shift_type to Job model
        migrations.AddField(
            model_name="job",
            name="shift_type",
            field=models.CharField(
                max_length=10,
                choices=[
                    ("ANY", "Any shift (worker chooses)"),
                    ("MORNING", "Morning shift (~6 AM – 2 PM)"),
                    ("NIGHT", "Night shift (~6 PM – 2 AM)"),
                ],
                default="ANY",
                help_text="Shift type for DAILY jobs. ANY = worker picks; MORNING/NIGHT = fixed shift.",
            ),
        ),
        # Add applied_shift to JobApplication model
        migrations.AddField(
            model_name="jobapplication",
            name="applied_shift",
            field=models.CharField(
                max_length=10,
                null=True,
                blank=True,
                help_text="Shift the worker chose when applying: MORNING or NIGHT. Null for legacy/PROJECT jobs.",
            ),
        ),
        # Add assigned_shift to JobWorkerAssignment model
        migrations.AddField(
            model_name="jobworkerassignment",
            name="assigned_shift",
            field=models.CharField(
                max_length=10,
                null=True,
                blank=True,
                help_text="Shift this worker is assigned to: MORNING or NIGHT. Null for legacy/PROJECT assignments.",
            ),
        ),
    ]
