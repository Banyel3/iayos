from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0096_backfill_agency_reviews'),
    ]

    operations = [
        # 1. Add IN_NEGOTIATION to JobDispute.status choices
        migrations.AlterField(
            model_name='jobdispute',
            name='status',
            field=models.CharField(
                choices=[
                    ('OPEN', 'Open'),
                    ('IN_NEGOTIATION', 'In Negotiation'),
                    ('UNDER_REVIEW', 'Under Review'),
                    ('RESOLVED', 'Resolved'),
                    ('CLOSED', 'Closed'),
                ],
                default='OPEN',
                max_length=20,
            ),
        ),
        # 2. Add in_negotiation_at timestamp to JobDispute
        migrations.AddField(
            model_name='jobdispute',
            name='in_negotiation_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='When admin accepted this dispute into negotiation',
            ),
        ),
        # 3. Add BACKJOB_NEGOTIATION to Notification.notificationType choices
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
                    ('PAYMENT_REFUNDED', 'Payment Refunded'),
                    ('MESSAGE', 'New Message'),
                    ('REVIEW_RECEIVED', 'Review Received'),
                    ('BACKJOB_REQUESTED', 'Backjob Requested'),
                    ('BACKJOB_APPROVED', 'Backjob Approved'),
                    ('BACKJOB_REJECTED', 'Backjob Rejected'),
                    ('BACKJOB_COMPLETED', 'Backjob Completed'),
                    ('BACKJOB_NEGOTIATION', 'Backjob In Negotiation'),
                    ('CERTIFICATION_APPROVED', 'Certification Approved'),
                    ('CERTIFICATION_REJECTED', 'Certification Rejected'),
                    ('JOB_UPDATED', 'Job Updated'),
                    ('JOB_INVITATION', 'Job Invitation'),
                    ('SYSTEM', 'System'),
                ],
                default='SYSTEM',
                max_length=50,
            ),
        ),
        # 4. Add backjob_edit_deadline to JobReview
        migrations.AddField(
            model_name='jobreview',
            name='backjob_edit_deadline',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='Deadline for client to edit review after backjob resolution',
            ),
        ),
    ]
