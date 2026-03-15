from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0110_wallet_non_negative_guardrails'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailyattendance',
            name='cash_payment_proof_url',
            field=models.CharField(
                blank=True,
                help_text='Cash proof image URL for CASH confirmations',
                max_length=500,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='dailyattendance',
            name='cash_payment_verified',
            field=models.BooleanField(
                default=False,
                help_text='True when CASH proof has been accepted and payout released',
            ),
        ),
        migrations.AddField(
            model_name='dailyattendance',
            name='cash_payment_verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dailyattendance',
            name='cash_proof_uploaded_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dailyattendance',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('WALLET', 'Wallet'),
                    ('GCASH', 'GCash'),
                    ('MAYA', 'Maya'),
                    ('CARD', 'Credit/Debit Card'),
                    ('BANK_TRANSFER', 'Bank Transfer'),
                    ('CASH', 'Cash'),
                ],
                default='WALLET',
                help_text='Payment method used when processing this attendance row',
                max_length=20,
            ),
        ),
        migrations.AddIndex(
            model_name='dailyattendance',
            index=models.Index(fields=['payment_method'], name='daily_att_method_idx'),
        ),
    ]
