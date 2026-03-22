from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0131_jobapplication_client_rejection_reason"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobskillslot",
            name="last_rejected_agency_id",
            field=models.BigIntegerField(
                blank=True,
                help_text="Most recent agency ID that rejected this slot invite",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="jobskillslot",
            name="last_rejected_agency_name",
            field=models.CharField(
                blank=True,
                help_text="Most recent agency name that rejected this slot invite",
                max_length=255,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="jobskillslot",
            name="last_rejected_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Timestamp when the latest agency rejection was recorded",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="jobskillslot",
            name="last_rejection_reason",
            field=models.TextField(
                blank=True,
                help_text="Most recent rejection reason provided by agency for this slot",
                null=True,
            ),
        ),
    ]
