from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0103_transaction_paymongo_payment_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobdispute",
            name="workerScheduleConfirmed",
            field=models.BooleanField(
                default=False,
                help_text="True when the assigned worker/agency confirms the proposed backjob schedule",
            ),
        ),
        migrations.AddField(
            model_name="jobdispute",
            name="workerScheduleConfirmedAt",
            field=models.DateTimeField(
                blank=True,
                help_text="Timestamp when worker/agency confirmed the proposed backjob schedule",
                null=True,
            ),
        ),
    ]
