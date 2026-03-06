from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0102_add_scheduled_date_to_jobdispute'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='paymongoPaymentId',
            field=models.CharField(
                blank=True,
                help_text='PayMongo pay_xxx payment ID (from webhook payments[] or lazy-fetched via checkout session)',
                max_length=100,
                null=True,
            ),
        ),
    ]
