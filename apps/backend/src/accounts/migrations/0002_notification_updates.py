# Generated migration for notification system enhancements

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        # Update notificationType field to allow longer values
        migrations.AlterField(
            model_name='notification',
            name='notificationType',
            field=models.CharField(
                choices=[
                    ('KYC_APPROVED', 'KYC Approved'),
                    ('KYC_REJECTED', 'KYC Rejected'),
                    ('AGENCY_KYC_APPROVED', 'Agency KYC Approved'),
                    ('AGENCY_KYC_REJECTED', 'Agency KYC Rejected'),
                    ('APPLICATION_RECEIVED', 'Application Received'),
                    ('APPLICATION_ACCEPTED', 'Application Accepted'),
                    ('APPLICATION_REJECTED', 'Application Rejected'),
                    ('JOB_STARTED', 'Job Started'),
                    ('JOB_COMPLETED_WORKER', 'Job Marked Complete by Worker'),
                    ('JOB_COMPLETED_CLIENT', 'Job Approved by Client'),
                    ('JOB_CANCELLED', 'Job Cancelled'),
                    ('PAYMENT_RECEIVED', 'Payment Received'),
                    ('ESCROW_PAID', 'Escrow Payment Confirmed'),
                    ('REMAINING_PAYMENT_PAID', 'Final Payment Confirmed'),
                    ('PAYMENT_RELEASED', 'Payment Released'),
                    ('MESSAGE', 'New Message'),
                    ('REVIEW_RECEIVED', 'Review Received'),
                    ('SYSTEM', 'System')
                ],
                default='SYSTEM',
                max_length=50
            ),
        ),
        # Add relatedJobID field
        migrations.AddField(
            model_name='notification',
            name='relatedJobID',
            field=models.BigIntegerField(blank=True, null=True),
        ),
        # Add relatedApplicationID field
        migrations.AddField(
            model_name='notification',
            name='relatedApplicationID',
            field=models.BigIntegerField(blank=True, null=True),
        ),
    ]
