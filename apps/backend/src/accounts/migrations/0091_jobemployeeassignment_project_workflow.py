# Generated migration for agency project job workflow tracking
# Adds workflow fields to JobEmployeeAssignment model:
# - dispatched / dispatchedAt (Agency dispatches employee)
# - clientConfirmedArrival / clientConfirmedArrivalAt (Client confirms arrival)
# - agencyMarkedComplete / agencyMarkedCompleteAt (Agency marks work complete)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0090_add_dispatched_status_and_employee_constraint'),
    ]

    operations = [
        # Dispatch tracking - Agency marks employee as "on the way"
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='dispatched',
            field=models.BooleanField(default=False, help_text='Agency has dispatched this employee (on the way to client)'),
        ),
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='dispatchedAt',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Arrival confirmation - Client confirms employee arrived
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='clientConfirmedArrival',
            field=models.BooleanField(default=False, help_text='Client has confirmed this employee arrived on site'),
        ),
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='clientConfirmedArrivalAt',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Agency marks complete - Agency confirms work is done
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='agencyMarkedComplete',
            field=models.BooleanField(default=False, help_text='Agency has marked this employee\'s work as complete'),
        ),
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='agencyMarkedCompleteAt',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Add index for efficient workflow state queries
        migrations.AddIndex(
            model_name='jobemployeeassignment',
            index=models.Index(fields=['job', 'dispatched', 'clientConfirmedArrival', 'agencyMarkedComplete'], name='jea_workflow_state_idx'),
        ),
    ]
