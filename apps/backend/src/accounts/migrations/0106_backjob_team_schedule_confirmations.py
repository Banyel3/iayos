from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0105_workerspecialization_skill_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="BackjobScheduleConfirmation",
            fields=[
                ("confirmationID", models.BigAutoField(primary_key=True, serialize=False)),
                ("confirmed", models.BooleanField(default=True)),
                ("confirmedAt", models.DateTimeField(auto_now_add=True)),
                ("createdAt", models.DateTimeField(auto_now_add=True)),
                ("updatedAt", models.DateTimeField(auto_now=True)),
                (
                    "assignmentID",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="backjob_schedule_confirmations",
                        to="accounts.jobworkerassignment",
                    ),
                ),
                (
                    "confirmedBy",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="backjob_schedule_confirmations",
                        to="accounts.accounts",
                    ),
                ),
                (
                    "disputeID",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="team_schedule_confirmations",
                        to="accounts.jobdispute",
                    ),
                ),
            ],
            options={
                "db_table": "backjob_schedule_confirmations",
                "ordering": ["-confirmedAt"],
            },
        ),
        migrations.AddIndex(
            model_name="backjobscheduleconfirmation",
            index=models.Index(
                fields=["disputeID", "-confirmedAt"],
                name="accounts_ba_dispute_43c0a2_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="backjobscheduleconfirmation",
            index=models.Index(
                fields=["assignmentID"],
                name="accounts_ba_assignm_95eb3c_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="backjobscheduleconfirmation",
            constraint=models.UniqueConstraint(
                fields=("disputeID", "assignmentID"),
                name="unique_backjob_confirmation_per_assignment",
            ),
        ),
    ]
