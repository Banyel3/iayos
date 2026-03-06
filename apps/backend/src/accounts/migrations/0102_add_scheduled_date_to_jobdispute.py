from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0101_job_qa_day_offset'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobdispute',
            name='scheduled_date',
            field=models.DateField(
                blank=True,
                null=True,
                help_text='Admin-set date for when the backjob will be completed, as agreed in negotiations'
            ),
        ),
    ]
