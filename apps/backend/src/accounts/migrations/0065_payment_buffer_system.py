# Generated migration for 7-day payment buffer system
# This migration adds fields for:
# 1. Job payment buffer tracking (paymentReleaseDate, paymentReleasedToWorker, etc.)
# 2. Wallet pending earnings (Due Balance)
# 3. Transaction type for pending earnings
# 4. JobDispute admin rejection tracking

from django.db import migrations, models
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0064_rename_job_app_skill_slot_status_idx_job_applica_applied_237261_idx_and_more'),
    ]

    operations = [
        # ========================================
        # Job Payment Buffer Fields
        # ========================================
        migrations.AddField(
            model_name='job',
            name='paymentReleaseDate',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='Date when payment will be released to worker (completedAt + buffer days)'
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='paymentReleasedToWorker',
            field=models.BooleanField(
                default=False,
                help_text='Whether the payment has been released to worker\'s wallet'
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='paymentReleasedAt',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='Timestamp when payment was released to worker'
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='paymentHeldReason',
            field=models.CharField(
                blank=True,
                null=True,
                choices=[
                    ('BUFFER_PERIOD', 'Within buffer period (7 days)'),
                    ('BACKJOB_PENDING', 'Backjob request pending'),
                    ('ADMIN_HOLD', 'Admin manually holding payment'),
                    ('RELEASED', 'Payment released to worker')
                ],
                default='BUFFER_PERIOD',
                help_text='Reason why payment is being held',
                max_length=20
            ),
        ),
        
        # ========================================
        # Wallet Pending Earnings (Due Balance)
        # ========================================
        migrations.AddField(
            model_name='wallet',
            name='pendingEarnings',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0.00'),
                help_text='Earnings from completed jobs pending release (7-day buffer)',
                max_digits=10
            ),
        ),
        
        # ========================================
        # Transaction Type Update
        # ========================================
        migrations.AlterField(
            model_name='transaction',
            name='transactionType',
            field=models.CharField(
                choices=[
                    ('DEPOSIT', 'Deposit'),
                    ('WITHDRAWAL', 'Withdrawal'),
                    ('PAYMENT', 'Payment'),
                    ('REFUND', 'Refund'),
                    ('EARNING', 'Earning'),
                    ('PENDING_EARNING', 'Pending Earning (7-day buffer)'),
                    ('FEE', 'Platform Fee')
                ],
                max_length=20
            ),
        ),
        
        # ========================================
        # JobDispute Admin Rejection Tracking
        # ========================================
        migrations.AddField(
            model_name='jobdispute',
            name='adminRejectedAt',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='When admin rejected this backjob request (used for cooldown)'
            ),
        ),
        migrations.AddField(
            model_name='jobdispute',
            name='adminRejectionReason',
            field=models.TextField(
                blank=True,
                null=True,
                help_text='Reason for admin rejection'
            ),
        ),
        
        # ========================================
        # Indexes for Performance
        # ========================================
        migrations.AddIndex(
            model_name='job',
            index=models.Index(
                fields=['paymentReleasedToWorker', 'paymentReleaseDate'],
                name='job_payment_release_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='job',
            index=models.Index(
                fields=['status', 'paymentReleasedToWorker'],
                name='job_status_payment_idx'
            ),
        ),
    ]
