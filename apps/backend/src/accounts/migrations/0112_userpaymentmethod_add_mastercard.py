from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0111_daily_attendance_payment_method_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userpaymentmethod',
            name='methodType',
            field=models.CharField(
                choices=[
                    ('GCASH', 'GCash'),
                    ('BANK', 'Bank Account'),
                    ('PAYPAL', 'PayPal'),
                    ('VISA', 'Visa/Credit Card'),
                    ('MASTERCARD', 'Mastercard/Credit Card'),
                    ('GRABPAY', 'GrabPay'),
                    ('MAYA', 'Maya'),
                ],
                max_length=10,
            ),
        ),
    ]
