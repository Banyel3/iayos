# Generated manually for invite status tracking
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0035_remove_job_agenciesonly_remove_job_agenciespreferred_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='inviteStatus',
            field=models.CharField(
                blank=True,
                choices=[
                    ('PENDING', 'Pending Agency Response'),
                    ('ACCEPTED', 'Agency Accepted'),
                    ('REJECTED', 'Agency Rejected')
                ],
                help_text='Status of agency/worker invite (only for INVITE-type jobs)',
                max_length=10,
                null=True
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='inviteRejectionReason',
            field=models.TextField(
                blank=True,
                help_text='Reason provided by agency/worker for rejecting the invite',
                null=True
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='inviteRespondedAt',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp when agency/worker responded to invite',
                null=True
            ),
        ),
    ]
