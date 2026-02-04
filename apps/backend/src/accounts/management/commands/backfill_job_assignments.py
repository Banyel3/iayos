"""
Backfill script to ensure all IN_PROGRESS jobs have assignedEmployeeID set.

This script fixes data inconsistency where jobs had their status changed to IN_PROGRESS
but didn't get assigned to any employee, causing them to appear incorrectly in the
"Accepted Jobs" tab instead of "In Progress" tab.

The fix ensures:
1. Jobs with status=IN_PROGRESS should have assignedEmployeeID set
2. If no employee is assigned, revert status to ACTIVE
3. For team jobs, check if at least one worker is assigned via JobWorkerAssignment
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import Job, JobWorkerAssignment


class Command(BaseCommand):
    help = 'Backfill jobs - ensure IN_PROGRESS jobs have assigned employees'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without applying them',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 DRY RUN MODE - No changes will be saved\n'))
        
        # Find all IN_PROGRESS jobs
        in_progress_jobs = Job.objects.filter(status=Job.JobStatus.IN_PROGRESS)
        total_jobs = in_progress_jobs.count()
        
        self.stdout.write(f'📊 Found {total_jobs} jobs with status IN_PROGRESS\n')
        
        if total_jobs == 0:
            self.stdout.write(self.style.SUCCESS('✅ No jobs to backfill. All good!'))
            return
        
        fixed_regular_jobs = 0
        fixed_team_jobs = 0
        reverted_jobs = 0
        already_correct = 0
        
        for job in in_progress_jobs:
            job_type = 'TEAM' if job.is_team_job else 'REGULAR'
            
            if job.is_team_job:
                # For team jobs, check JobWorkerAssignment
                assigned_workers = JobWorkerAssignment.objects.filter(
                    jobID=job,
                    assignment_status='ACTIVE'
                ).count()
                
                if assigned_workers > 0:
                    self.stdout.write(
                        f'✅ {job_type} Job #{job.jobID} "{job.title}" - '
                        f'{assigned_workers} workers assigned (correct)'
                    )
                    already_correct += 1
                else:
                    # No workers assigned, should revert to ACTIVE
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠️  {job_type} Job #{job.jobID} "{job.title}" - '
                            f'IN_PROGRESS but no workers assigned, reverting to ACTIVE'
                        )
                    )
                    if not dry_run:
                        with transaction.atomic():
                            job.status = Job.JobStatus.ACTIVE
                            job.save()
                    reverted_jobs += 1
            
            else:
                # For regular jobs, check assignedEmployeeID
                if job.assignedEmployeeID:
                    self.stdout.write(
                        f'✅ {job_type} Job #{job.jobID} "{job.title}" - '
                        f'Assigned to employee #{job.assignedEmployeeID.employeeID} (correct)'
                    )
                    already_correct += 1
                else:
                    # No employee assigned, should revert to ACTIVE
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠️  {job_type} Job #{job.jobID} "{job.title}" - '
                            f'IN_PROGRESS but no employee assigned, reverting to ACTIVE'
                        )
                    )
                    if not dry_run:
                        with transaction.atomic():
                            job.status = Job.JobStatus.ACTIVE
                            job.save()
                    reverted_jobs += 1
        
        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'\n📊 BACKFILL SUMMARY:\n'))
        self.stdout.write(f'   Total IN_PROGRESS jobs: {total_jobs}')
        self.stdout.write(f'   Already correct: {already_correct}')
        self.stdout.write(f'   Reverted to ACTIVE: {reverted_jobs}')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'\n⚠️  DRY RUN - No changes were saved. '
                    f'Run without --dry-run to apply changes.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✅ Backfill complete! {reverted_jobs} jobs fixed.')
            )
