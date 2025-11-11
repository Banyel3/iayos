# Generated migration for adding agency acceptance fields to Job model
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0031_add_account_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='acceptedByAgency',
            field=models.ForeignKey(
                blank=True,
                help_text='Agency that accepted this job (if applicable)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='accepted_jobs',
                to='accounts.agency'
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='agencyAcceptedAt',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp when agency accepted the job',
                null=True
            ),
        ),

    ]
