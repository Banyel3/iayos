from django.core.management.base import BaseCommand
from accounts.models import Job, JobWorkerAssignment, JobSkillSlot


class Command(BaseCommand):
    help = 'Fix FIX CAR AT HOME job - update status to IN_PROGRESS if all slots filled'

    def handle(self, *args, **options):
        job = Job.objects.get(title='FIX CAR AT HOME')
        
        self.stdout.write(f"Job: {job.title}")
        self.stdout.write(f"Current Status: {job.status}")
        self.stdout.write(f"Is Team Job: {job.is_team_job}")
        self.stdout.write(f"Can Start: {job.can_start_team_job}")
        
        assignments = JobWorkerAssignment.objects.filter(jobID=job, assignment_status='ACTIVE')
        self.stdout.write(f"Active Assignments: {assignments.count()}")
        
        slots = JobSkillSlot.objects.filter(jobID=job)
        total_needed = sum(slot.workers_needed for slot in slots)
        total_assigned = assignments.count()
        
        self.stdout.write(f"Total Workers Needed: {total_needed}")
        self.stdout.write(f"Total Workers Assigned: {total_assigned}")
        self.stdout.write(f"All Slots Filled: {total_needed == total_assigned}")
        
        if job.can_start_team_job and job.status == 'ACTIVE':
            self.stdout.write(self.style.WARNING("\n⚠ Job should be IN_PROGRESS but is still ACTIVE"))
            self.stdout.write("Updating job status to IN_PROGRESS...")
            job.status = 'IN_PROGRESS'
            job.save()
            self.stdout.write(self.style.SUCCESS(f"✓ Updated job {job.jobID} status to IN_PROGRESS"))
        elif job.status == 'IN_PROGRESS':
            self.stdout.write(self.style.SUCCESS("\n✓ Job is already IN_PROGRESS"))
        else:
            self.stdout.write(self.style.WARNING(f"\n⚠ Job status is {job.status} but can_start is {job.can_start_team_job}"))
