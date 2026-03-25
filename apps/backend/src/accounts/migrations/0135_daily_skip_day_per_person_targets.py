from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("agency", "0012_alter_agencyemployee_email"),
        ("accounts", "0134_accounts_auth_revoked_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="dailyskipdayrequest",
            name="target_employee",
            field=models.ForeignKey(
                blank=True,
                help_text="Target agency employee (for hybrid/team agency requests)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="daily_skip_requests_as_target_employee",
                to="agency.agencyemployee",
            ),
        ),
        migrations.AddField(
            model_name="dailyskipdayrequest",
            name="target_type",
            field=models.CharField(
                choices=[
                    ("WORKER", "Freelance worker"),
                    ("EMPLOYEE", "Agency employee"),
                ],
                default="WORKER",
                help_text="Entity whose attendance is affected when approved",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="dailyskipdayrequest",
            name="target_worker_account",
            field=models.ForeignKey(
                blank=True,
                help_text="Target worker account (for freelancer/team-worker requests)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="daily_skip_requests_as_target_worker",
                to="accounts.accounts",
            ),
        ),
        migrations.RemoveConstraint(
            model_name="dailyskipdayrequest",
            name="unique_daily_skip_request_per_job_date",
        ),
        migrations.AddConstraint(
            model_name="dailyskipdayrequest",
            constraint=models.UniqueConstraint(
                condition=models.Q(target_worker_account__isnull=False),
                fields=("jobID", "request_date", "target_worker_account"),
                name="uniq_skip_req_worker_target_per_day",
            ),
        ),
        migrations.AddConstraint(
            model_name="dailyskipdayrequest",
            constraint=models.UniqueConstraint(
                condition=models.Q(target_employee__isnull=False),
                fields=("jobID", "request_date", "target_employee"),
                name="uniq_skip_req_employee_target_per_day",
            ),
        ),
    ]
