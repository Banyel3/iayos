from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0130_merge_specializations_worker_and_shift_backfill"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobapplication",
            name="clientRejectionReason",
            field=models.TextField(blank=True, null=True),
        ),
    ]
