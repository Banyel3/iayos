# Generated migration for multi-employee job assignment
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0050_agency_job_review_fields'),
        ('agency', '0003_agencyemployee_employeeofthemonth_and_more'),
    ]

    operations = [
        # Create the through table for many-to-many relationship
        migrations.CreateModel(
            name='JobEmployeeAssignment',
            fields=[
                ('assignmentID', models.BigAutoField(primary_key=True, serialize=False)),
                ('assignedAt', models.DateTimeField(auto_now_add=True)),
                ('notes', models.TextField(blank=True, default='')),
                ('isPrimaryContact', models.BooleanField(default=False, help_text='If true, this employee is the team lead/primary contact for this job')),
                ('status', models.CharField(choices=[('ASSIGNED', 'Assigned'), ('IN_PROGRESS', 'In Progress'), ('COMPLETED', 'Completed'), ('REMOVED', 'Removed from job')], default='ASSIGNED', max_length=15)),
                ('employeeMarkedComplete', models.BooleanField(default=False)),
                ('employeeMarkedCompleteAt', models.DateTimeField(blank=True, null=True)),
                ('completionNotes', models.TextField(blank=True, default='')),
                ('assignedBy', models.ForeignKey(blank=True, help_text='The agency owner who made this assignment', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='employee_assignments_made', to=settings.AUTH_USER_MODEL)),
                ('employee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='job_assignments', to='agency.agencyemployee')),
                ('job', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='employee_assignments', to='accounts.job')),
            ],
            options={
                'db_table': 'job_employee_assignments',
                'ordering': ['-isPrimaryContact', 'assignedAt'],
                'unique_together': {('job', 'employee')},
            },
        ),
        # Add indexes
        migrations.AddIndex(
            model_name='jobemployeeassignment',
            index=models.Index(fields=['job', 'status'], name='job_employe_job_id_f1c2e3_idx'),
        ),
        migrations.AddIndex(
            model_name='jobemployeeassignment',
            index=models.Index(fields=['employee', 'status'], name='job_employe_employe_d4e5f6_idx'),
        ),
        # Update the legacy field's related_name
        migrations.AlterField(
            model_name='job',
            name='assignedEmployeeID',
            field=models.ForeignKey(blank=True, help_text='LEGACY: Single employee assignment. Use assignedEmployees for new jobs.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='legacy_assigned_jobs', to='agency.agencyemployee'),
        ),
        # Add the ManyToMany field
        migrations.AddField(
            model_name='job',
            name='assignedEmployees',
            field=models.ManyToManyField(blank=True, help_text='Multiple agency employees assigned to this job', related_name='assigned_jobs_multi', through='accounts.JobEmployeeAssignment', to='agency.agencyemployee'),
        ),
    ]
