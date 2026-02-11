"""
Backfill script to ensure all IN_PROGRESS jobs have proper assignments OR conversations.

This script fixes data inconsistency where jobs had their status changed to IN_PROGRESS
but didn't get assigned to any employee AND didn't have a conversation created.

The fix ensures:
1. Jobs with status=IN_PROGRESS should have assignedEmployeeID set OR active conversation
2. If no employee AND no conversation → revert status to ACTIVE (orphaned state)
3. For team jobs, check if workers assigned OR conversation exists (team slots filled)
4. For agency jobs, check if employee assigned OR conversation exists (accepted invite flow)
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import Job, JobWorkerAssignment
from profiles.models import Conversation


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
                # For team jobs, check JobWorkerAssignment AND conversation
                assigned_workers = JobWorkerAssignment.objects.filter(
                    jobID=job,
                    assignment_status='ACTIVE'
                ).count()
                
                # Check if conversation exists (team slots filled creates conversation + IN_PROGRESS together)
                has_conversation = Conversation.objects.filter(
                    relatedJobPosting=job,
                    status=Conversation.ConversationStatus.ACTIVE
                ).exists()
                
                if assigned_workers > 0 or has_conversation:
                    reason = f'{assigned_workers} workers assigned' if assigned_workers > 0 else 'conversation exists (team slots filled)'
                    self.stdout.write(
                        f'✅ {job_type} Job #{job.jobID} "{job.title}" - {reason} (correct)'
                    )
                    already_correct += 1
                else:
                    # No workers AND no conversation = orphaned, should revert to ACTIVE
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠️  {job_type} Job #{job.jobID} "{job.title}" - '
                            f'IN_PROGRESS but no workers assigned AND no conversation, reverting to ACTIVE'
                        )
                    )
                    if not dry_run:
                        with transaction.atomic():
                            job.status = Job.JobStatus.ACTIVE
                            job.save()
                    reverted_jobs += 1
            
            else:
                # For regular jobs, check assignedEmployeeID AND conversation
                # (Agency INVITE jobs create conversation on acceptance, before employee assignment)
                has_conversation = Conversation.objects.filter(
                    relatedJobPosting=job,
                    status=Conversation.ConversationStatus.ACTIVE
                ).exists()
                
                if job.assignedEmployeeID or has_conversation:
                    reason = f'assigned to employee #{job.assignedEmployeeID.employeeID}' if job.assignedEmployeeID else 'conversation exists (invite accepted)'
                    self.stdout.write(
                        f'✅ {job_type} Job #{job.jobID} "{job.title}" - {reason} (correct)'
                    )
                    already_correct += 1
                else:
                    # No employee AND no conversation = orphaned, should revert to ACTIVE
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠️  {job_type} Job #{job.jobID} "{job.title}" - '
                            f'IN_PROGRESS but no employee assigned AND no conversation, reverting to ACTIVE'
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
