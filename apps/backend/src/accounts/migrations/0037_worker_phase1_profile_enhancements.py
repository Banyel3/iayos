# Generated manually for Worker Phase 1
# Date: 2025-11-13

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0036_job_inviterejectionreason_job_inviterespondedat_and_more'),
    ]

    operations = [
        # Add Worker Phase 1 fields to WorkerProfile
        migrations.AddField(
            model_name='workerprofile',
            name='bio',
            field=models.CharField(blank=True, default='', help_text='Short bio/tagline (max 200 chars)', max_length=200),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='hourly_rate',
            field=models.DecimalField(blank=True, decimal_places=2, help_text="Worker's hourly rate in PHP", max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='profile_completion_percentage',
            field=models.IntegerField(default=0, help_text='Profile completion percentage (0-100)'),
        ),
        
        # Create WorkerCertification model
        migrations.CreateModel(
            name='WorkerCertification',
            fields=[
                ('certificationID', models.BigAutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(help_text="Certificate name (e.g., 'TESDA Plumbing NC II')", max_length=255)),
                ('issuing_organization', models.CharField(blank=True, default='', help_text="Organization that issued the certificate (e.g., 'TESDA')", max_length=255)),
                ('issue_date', models.DateField(blank=True, help_text='Date when certification was issued', null=True)),
                ('expiry_date', models.DateField(blank=True, help_text='Expiration date (null if does not expire)', null=True)),
                ('certificate_url', models.CharField(blank=True, default='', help_text='Supabase URL to certificate image/PDF', max_length=1000)),
                ('is_verified', models.BooleanField(default=False, help_text='Whether admin has verified this certification')),
                ('verified_at', models.DateTimeField(blank=True, help_text='When certification was verified by admin', null=True)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('verified_by', models.ForeignKey(blank=True, help_text='Admin who verified the certification', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_certifications', to=settings.AUTH_USER_MODEL)),
                ('workerID', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='certifications', to='accounts.workerprofile')),
            ],
            options={
                'db_table': 'worker_certifications',
                'ordering': ['-issue_date', '-createdAt'],
            },
        ),
        
        # Create WorkerPortfolio model
        migrations.CreateModel(
            name='WorkerPortfolio',
            fields=[
                ('portfolioID', models.BigAutoField(primary_key=True, serialize=False)),
                ('image_url', models.CharField(help_text='Supabase URL to portfolio image', max_length=1000)),
                ('caption', models.TextField(blank=True, default='', help_text='Description of the work shown (max 500 chars)', max_length=500)),
                ('display_order', models.IntegerField(default=0, help_text='Order in which to display (0 = first)')),
                ('file_name', models.CharField(blank=True, default='', max_length=255)),
                ('file_size', models.IntegerField(blank=True, help_text='File size in bytes', null=True)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('workerID', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='portfolio', to='accounts.workerprofile')),
            ],
            options={
                'db_table': 'worker_portfolio',
                'ordering': ['display_order', '-createdAt'],
            },
        ),
        
        # Add indexes
        migrations.AddIndex(
            model_name='workercertification',
            index=models.Index(fields=['workerID', '-issue_date'], name='worker_cert_worker_date_idx'),
        ),
        migrations.AddIndex(
            model_name='workercertification',
            index=models.Index(fields=['expiry_date'], name='worker_cert_expiry_idx'),
        ),
        migrations.AddIndex(
            model_name='workerportfolio',
            index=models.Index(fields=['workerID', 'display_order'], name='worker_port_worker_order_idx'),
        ),
    ]
