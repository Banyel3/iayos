from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0097_backjob_negotiation"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="scheduled_end_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]
