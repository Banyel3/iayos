# Generated migration for agency multi-employee hiring mode

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0086_saved_job_model'),
    ]

    operations = [
        # Add skill_slot FK to JobEmployeeAssignment (nullable for backwards compatibility)
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='skill_slot',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='employee_slot_assignments',
                to='accounts.jobskillslot',
                help_text='The skill slot this employee is assigned to (for multi-employee INVITE jobs)'
            ),
        ),
        # Add index for performance
        migrations.AddIndex(
            model_name='jobemployeeassignment',
            index=models.Index(fields=['job', 'skill_slot'], name='job_emp_job_slot_idx'),
        ),
    ]
