from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0126_specializations_created_by_agency"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobemployeeassignment",
            name="early_completed",
            field=models.BooleanField(
                default=False,
                help_text="Whether this employee was finished early by the client",
            ),
        ),
        migrations.AddField(
            model_name="jobemployeeassignment",
            name="early_completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="jobemployeeassignment",
            name="early_completion_payout",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Payout amount sent to agency ledger on early completion",
                max_digits=12,
                null=True,
            ),
        ),
    ]
