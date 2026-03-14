from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0108_job_worker_timeline_markers'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailyattendance',
            name='absent_penalty_amount',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0.00'),
                help_text='Penalty amount deducted from expected earnings for ABSENT day',
                max_digits=10,
            ),
        ),
        migrations.AddField(
            model_name='dailyattendance',
            name='absent_penalty_applied',
            field=models.BooleanField(
                default=False,
                help_text='Whether absent penalty was already computed/applied for this attendance row',
            ),
        ),
        migrations.AddField(
            model_name='dailyattendance',
            name='absent_penalty_applied_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dailyattendance',
            name='absent_penalty_percent',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('10.00'),
                help_text='Penalty percent applied when day is marked ABSENT',
                max_digits=5,
            ),
        ),
    ]
