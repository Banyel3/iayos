import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0104_jobdispute_worker_schedule_confirmation"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobskillslot",
            name="invited_agency",
            field=models.ForeignKey(
                blank=True,
                help_text="Agency invited to fill this skill slot (null = open for freelance workers)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="invited_skill_slots",
                to="accounts.agency",
            ),
        ),
        migrations.AddField(
            model_name="jobskillslot",
            name="agency_invite_status",
            field=models.CharField(
                blank=True,
                choices=[
                    ("PENDING", "Pending Agency Response"),
                    ("ACCEPTED", "Agency Accepted"),
                    ("REJECTED", "Agency Rejected"),
                ],
                help_text="Status of agency invite for this slot (null if no agency invited)",
                max_length=10,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="jobskillslot",
            name="agency_invite_responded_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Timestamp when agency responded to slot invite",
                null=True,
            ),
        ),
    ]
