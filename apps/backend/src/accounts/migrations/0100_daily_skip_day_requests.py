from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0099_accounts_verification_level'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailySkipDayRequest',
            fields=[
                ('skipRequestID', models.BigAutoField(primary_key=True, serialize=False)),
                ('request_date', models.DateField(help_text='Date being requested to skip')),
                ('status', models.CharField(choices=[('PENDING', 'Pending review'), ('APPROVED', 'Approved by client'), ('REJECTED', 'Rejected by client')], default='PENDING', max_length=15)),
                ('requested_by', models.CharField(choices=[('WORKER', 'Worker'), ('AGENCY', 'Agency')], default='WORKER', max_length=10)),
                ('requested_account_ids', models.JSONField(blank=True, default=list, help_text='Account IDs that requested/joined this skip-day request')),
                ('requested_count', models.PositiveIntegerField(default=1)),
                ('total_required', models.PositiveIntegerField(default=1)),
                ('requires_all_team_workers', models.BooleanField(default=False)),
                ('all_workers_requested', models.BooleanField(default=True)),
                ('reviewedAt', models.DateTimeField(blank=True, null=True)),
                ('client_rejection_reason', models.TextField(blank=True, null=True)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('jobID', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='daily_skip_requests', to='accounts.job')),
                ('requestedByUser', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='daily_skip_requests_created', to='accounts.accounts')),
                ('reviewedByUser', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='daily_skip_requests_reviewed', to='accounts.accounts')),
            ],
            options={
                'db_table': 'daily_skip_day_requests',
                'ordering': ['-request_date', '-createdAt'],
            },
        ),
        migrations.AddIndex(
            model_name='dailyskipdayrequest',
            index=models.Index(fields=['jobID', 'request_date'], name='skip_req_job_date_idx'),
        ),
        migrations.AddIndex(
            model_name='dailyskipdayrequest',
            index=models.Index(fields=['status'], name='skip_req_status_idx'),
        ),
        migrations.AddConstraint(
            model_name='dailyskipdayrequest',
            constraint=models.UniqueConstraint(fields=('jobID', 'request_date'), name='unique_daily_skip_request_per_job_date'),
        ),
    ]
