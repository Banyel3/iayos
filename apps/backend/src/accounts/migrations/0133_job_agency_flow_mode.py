from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0132_jobskillslot_last_agency_rejection_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="agency_flow_mode",
            field=models.CharField(
                blank=True,
                choices=[
                    ("DIRECT", "Direct agency hire"),
                    ("TEAM_SLOT", "Team slot agency workflow"),
                ],
                help_text="Agency flow mode: DIRECT for single-agency runtime, TEAM_SLOT for slot-based team workflow",
                max_length=20,
                null=True,
            ),
        ),
    ]
