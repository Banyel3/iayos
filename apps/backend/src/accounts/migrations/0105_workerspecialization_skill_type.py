from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0104_jobdispute_worker_schedule_confirmation"),
    ]

    operations = [
        migrations.AddField(
            model_name="workerspecialization",
            name="skillType",
            field=models.CharField(
                choices=[("PRIMARY", "Primary"), ("SECONDARY", "Secondary")],
                default="SECONDARY",
                max_length=10,
            ),
        ),
        migrations.AddIndex(
            model_name="workerspecialization",
            index=models.Index(
                fields=["workerID", "skillType"],
                name="accounts_wo_workeri_2ee86d_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="workerspecialization",
            constraint=models.UniqueConstraint(
                condition=models.Q(skillType="PRIMARY"),
                fields=("workerID",),
                name="unique_primary_skill_per_worker",
            ),
        ),
    ]
