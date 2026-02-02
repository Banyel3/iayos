# Generated migration for notification profile_type field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0087_job_employee_assignment_skill_slot'),
    ]

    operations = [
        # Add profile_type field to Notification model
        migrations.AddField(
            model_name='notification',
            name='profile_type',
            field=models.CharField(
                blank=True,
                choices=[('WORKER', 'Worker'), ('CLIENT', 'Client')],
                max_length=20,
                null=True,
            ),
        ),
        # Add index for faster filtering by profile_type
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(
                fields=['accountFK', 'profile_type', '-createdAt'],
                name='accounts_no_account_ab04a2_idx',
            ),
        ),
    ]
