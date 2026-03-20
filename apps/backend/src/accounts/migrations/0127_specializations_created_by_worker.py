from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0126_specializations_created_by_agency"),
    ]

    operations = [
        migrations.AddField(
            model_name="specializations",
            name="created_by_worker",
            field=models.ForeignKey(
                blank=True,
                help_text="The worker account that created this custom specialization (None = not worker-owned)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="custom_worker_specializations",
                to="accounts.accounts",
            ),
        ),
    ]
