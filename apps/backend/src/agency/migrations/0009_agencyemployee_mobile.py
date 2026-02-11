# Generated migration for AgencyEmployee mobile field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agency', '0008_agencyemployee_daily_rate'),
    ]

    operations = [
        migrations.AddField(
            model_name='agencyemployee',
            name='mobile',
            field=models.CharField(blank=True, default='', help_text='Employee mobile number', max_length=15),
        ),
    ]
