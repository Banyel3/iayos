from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0113_worker_default_available'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='paymongoTransferId',
            field=models.CharField(
                blank=True,
                help_text='PayMongo transfer ID (trf_xxx) for BANK withdrawal processing',
                max_length=100,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='transaction',
            name='paymongoTransferStatus',
            field=models.CharField(
                blank=True,
                help_text='Latest PayMongo transfer status for BANK withdrawals',
                max_length=30,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='userpaymentmethod',
            name='bankCode',
            field=models.CharField(
                blank=True,
                help_text='PayMongo institution code (BANK only)',
                max_length=50,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='userpaymentmethod',
            name='paymongoRecipientId',
            field=models.CharField(
                blank=True,
                help_text='Cached recipient for Transfer V2',
                max_length=100,
                null=True,
            ),
        ),
    ]
