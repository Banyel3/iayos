from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0125_specializations_is_custom"),
    ]

    operations = [
        migrations.AddField(
            model_name="specializations",
            name="created_by_agency",
            field=models.ForeignKey(
                blank=True,
                help_text="The agency that created this custom specialization (None = global/admin-seeded)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="custom_specializations",
                to="accounts.agency",
            ),
        ),
    ]
