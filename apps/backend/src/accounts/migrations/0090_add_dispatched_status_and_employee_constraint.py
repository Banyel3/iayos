# Generated migration for daily attendance flow redesign
# Adds DISPATCHED status and conditional unique constraints

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0089_daily_payment_model'),
    ]

    operations = [
        # Step 1: Alter status field to include DISPATCHED option
        migrations.AlterField(
            model_name='dailyattendance',
            name='status',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('DISPATCHED', 'Dispatched (on the way)'),
                    ('PENDING', 'Pending'),
                    ('PRESENT', 'Present'),
                    ('HALF_DAY', 'Half Day'),
                    ('ABSENT', 'Absent'),
                    ('DISPUTED', 'Disputed'),
                ],
                default='PENDING',
            ),
        ),

        # Step 2: Remove the old constraint (if it exists)
        # Note: This will only work if the constraint exists
        # If it doesn't exist, Django will handle gracefully in most databases
        migrations.RemoveConstraint(
            model_name='dailyattendance',
            name='unique_worker_attendance_per_day',
        ),

        # Step 3: Add conditional constraint for workers (workerID not null)
        migrations.AddConstraint(
            model_name='dailyattendance',
            constraint=models.UniqueConstraint(
                fields=['jobID', 'workerID', 'date'],
                condition=models.Q(workerID__isnull=False),
                name='unique_worker_attendance_per_day',
            ),
        ),

        # Step 4: Add conditional constraint for employees (employeeID not null)
        migrations.AddConstraint(
            model_name='dailyattendance',
            constraint=models.UniqueConstraint(
                fields=['jobID', 'employeeID', 'date'],
                condition=models.Q(employeeID__isnull=False),
                name='unique_employee_attendance_per_day',
            ),
        ),
    ]
