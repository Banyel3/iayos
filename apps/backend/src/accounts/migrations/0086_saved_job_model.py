# Generated manually for SavedJob model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0085_populate_dole_minimum_rates'),
    ]

    operations = [
        migrations.CreateModel(
            name='SavedJob',
            fields=[
                ('savedJobID', models.BigAutoField(primary_key=True, serialize=False)),
                ('savedAt', models.DateTimeField(auto_now_add=True)),
                ('jobID', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_by_workers', to='accounts.job')),
                ('workerID', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_jobs', to='accounts.workerprofile')),
            ],
            options={
                'db_table': 'saved_jobs',
                'ordering': ['-savedAt'],
            },
        ),
        migrations.AddIndex(
            model_name='savedjob',
            index=models.Index(fields=['workerID', '-savedAt'], name='saved_jobs_workerI_e86f42_idx'),
        ),
        migrations.AddIndex(
            model_name='savedjob',
            index=models.Index(fields=['jobID'], name='saved_jobs_jobID_4d8c21_idx'),
        ),
        migrations.AddConstraint(
            model_name='savedjob',
            constraint=models.UniqueConstraint(fields=('jobID', 'workerID'), name='unique_saved_job'),
        ),
    ]
