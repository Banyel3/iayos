"""
Migration: Allow workers to be assigned to multiple skill slots on the same team job.

Changes:
1. JobWorkerAssignment: Remove unique_worker_per_job constraint (jobID, workerID),
   add unique_worker_per_slot constraint (skillSlotID, workerID).
2. DailyAttendance: Modify unique_worker_attendance_per_day to only apply when
   assignmentID IS NULL (non-team freelance flow). Add unique_assignment_attendance_per_day
   for team job attendance (one row per assignment per day).
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0114_paymongo_transfer_v2_fields"),
    ]

    operations = [
        # 1. Remove the old unique_worker_per_job constraint
        migrations.RemoveConstraint(
            model_name="jobworkerassignment",
            name="unique_worker_per_job",
        ),
        # 2. Add new unique_worker_per_slot constraint
        #    A worker can only be assigned to a specific slot once,
        #    but CAN be assigned to multiple different slots on the same job.
        migrations.AddConstraint(
            model_name="jobworkerassignment",
            constraint=models.UniqueConstraint(
                fields=["skillSlotID", "workerID"],
                name="unique_worker_per_slot",
            ),
        ),
        # 3. Remove old unique_worker_attendance_per_day constraint
        migrations.RemoveConstraint(
            model_name="dailyattendance",
            name="unique_worker_attendance_per_day",
        ),
        # 4. Re-add it with condition: only for non-team jobs (assignmentID IS NULL)
        migrations.AddConstraint(
            model_name="dailyattendance",
            constraint=models.UniqueConstraint(
                fields=["jobID", "workerID", "date"],
                condition=models.Q(
                    workerID__isnull=False,
                    assignmentID__isnull=True,
                ),
                name="unique_worker_attendance_per_day",
            ),
        ),
        # 5. Add new constraint for team job attendance: one row per assignment per day
        migrations.AddConstraint(
            model_name="dailyattendance",
            constraint=models.UniqueConstraint(
                fields=["assignmentID", "date"],
                condition=models.Q(assignmentID__isnull=False),
                name="unique_assignment_attendance_per_day",
            ),
        ),
    ]
