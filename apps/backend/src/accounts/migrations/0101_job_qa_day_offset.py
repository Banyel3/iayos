from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0100_daily_skip_day_requests"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="qa_day_offset",
            field=models.IntegerField(
                default=0,
                help_text="TESTING-only day offset for QA fast-forward on DAILY jobs",
            ),
        ),
    ]
