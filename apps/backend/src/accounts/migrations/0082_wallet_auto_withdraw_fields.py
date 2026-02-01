# Generated manually for wallet auto-withdrawal fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0081_support_ticket_agency_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='wallet',
            name='autoWithdrawEnabled',
            field=models.BooleanField(
                default=False,
                help_text='If True, wallet balance will be automatically withdrawn every Friday'
            ),
        ),
        migrations.AddField(
            model_name='wallet',
            name='preferredPaymentMethodID',
            field=models.ForeignKey(
                blank=True,
                help_text='Preferred payment method for auto-withdrawals',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='preferred_for_wallets',
                to='accounts.userpaymentmethod'
            ),
        ),
        migrations.AddField(
            model_name='wallet',
            name='lastAutoWithdrawAt',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp of last auto-withdrawal',
                null=True
            ),
        ),
        migrations.AddIndex(
            model_name='wallet',
            index=models.Index(fields=['autoWithdrawEnabled'], name='accounts_wa_autoWit_idx'),
        ),
    ]
