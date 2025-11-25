from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0037_worker_phase1_profile_enhancements'),
        ('agency', '0003_agencyemployee_employeeofthemonth_and_more'),
    ]

    operations = [
        # Add assigned employee field for agency job assignments
        migrations.AddField(
            model_name='job',
            name='assignedEmployeeID',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='assigned_jobs',
                to='agency.agencyemployee',
                help_text='Specific agency employee assigned to this job'
            ),
        ),

        # Add assignment timestamp
        migrations.AddField(
            model_name='job',
            name='employeeAssignedAt',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='When employee was assigned by agency'
            ),
        ),

        # Add assignment notes
        migrations.AddField(
            model_name='job',
            name='assignmentNotes',
            field=models.TextField(
                blank=True,
                null=True,
                help_text='Notes from agency about this assignment'
            ),
        ),

        # Add index for performance
        migrations.AddIndex(
            model_name='job',
            index=models.Index(
                fields=['assignedEmployeeID', 'status'],
                name='job_assigned_employee_status_idx'
            ),
        ),
    ]
