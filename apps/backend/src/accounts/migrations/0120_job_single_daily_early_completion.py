from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0119_price_negotiation"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="is_early_completed",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="job",
            name="early_completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="job",
            name="early_completion_payout",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
    ]
