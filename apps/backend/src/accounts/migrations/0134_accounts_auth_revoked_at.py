from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0133_job_agency_flow_mode"),
    ]

    operations = [
        migrations.AddField(
            model_name="accounts",
            name="auth_revoked_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Invalidate access/refresh tokens issued before this time",
                null=True,
            ),
        ),
    ]
