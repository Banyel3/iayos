# Generated migration for payment method tracking and proof of payment

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0027_add_remaining_payment_tracking'),
    ]

    operations = [
        # Add payment method choice for final payment
        migrations.AddField(
            model_name='job',
            name='finalPaymentMethod',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('GCASH', 'GCash'),
                    ('CASH', 'Cash'),
                ],
                null=True,
                blank=True,
                help_text="Payment method chosen for final 50% payment"
            ),
        ),
        # Add proof of payment image URL (for cash payments)
        migrations.AddField(
            model_name='job',
            name='cashPaymentProofUrl',
            field=models.CharField(
                max_length=500,
                null=True,
                blank=True,
                help_text="URL to proof of payment image (for cash payments)"
            ),
        ),
        # Add timestamp when payment method was selected
        migrations.AddField(
            model_name='job',
            name='paymentMethodSelectedAt',
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text="When the client selected payment method"
            ),
        ),
        # Add timestamp when cash proof was uploaded
        migrations.AddField(
            model_name='job',
            name='cashProofUploadedAt',
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text="When cash payment proof was uploaded"
            ),
        ),
        # Add admin approval for cash payments
        migrations.AddField(
            model_name='job',
            name='cashPaymentApproved',
            field=models.BooleanField(
                default=False,
                help_text="Whether admin has verified cash payment proof"
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='cashPaymentApprovedAt',
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text="When admin approved cash payment"
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='cashPaymentApprovedBy',
            field=models.ForeignKey(
                'accounts.Accounts',
                on_delete=models.SET_NULL,
                null=True,
                blank=True,
                related_name='approved_cash_payments',
                help_text="Admin who approved the cash payment"
            ),
        ),
    ]
