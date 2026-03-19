from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0114_paymongo_transfer_v2_fields"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="workerspecialization",
            name="unique_primary_skill_per_worker",
        ),
        migrations.AddField(
            model_name="workerspecialization",
            name="displayOrder",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Manual ordering for worker skills in profile lists",
            ),
        ),
        migrations.AddIndex(
            model_name="workerspecialization",
            index=models.Index(
                fields=["workerID", "displayOrder"],
                name="accounts_wor_workerI_e2ec45_idx",
            ),
        ),
    ]
