"""
Fix Job #20 - Set back to IN_PROGRESS because it has an active conversation.
The previous backfill script incorrectly reverted it to ACTIVE.
"""

from django.core.management.base import BaseCommand
from accounts.models import Job
from profiles.models import Conversation


class Command(BaseCommand):
    help = 'Fix Job #20 - Set back to IN_PROGRESS if it has an active conversation'

    def handle(self, *args, **options):
        try:
            job = Job.objects.get(jobID=20)
            conv = Conversation.objects.filter(relatedJobPosting=job).first()
            
            self.stdout.write(f'Job #{job.jobID}: "{job.title}"')
            self.stdout.write(f'Current status: {job.status}')
            self.stdout.write(f'Conversation exists: {conv is not None}')
            if conv:
                self.stdout.write(f'Conversation ID: {conv.conversationID}')
                self.stdout.write(f'Conversation status: {conv.status}')
            
            if conv and conv.status == 'ACTIVE' and job.status == 'ACTIVE':
                job.status = 'IN_PROGRESS'
                job.save()
                self.stdout.write(self.style.SUCCESS('\n✅ FIXED: Set job back to IN_PROGRESS because active conversation exists'))
            elif job.status == 'IN_PROGRESS':
                self.stdout.write(self.style.SUCCESS('\n✅ Job is already IN_PROGRESS - no fix needed'))
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'\n⚠️  Job status is {job.status}, '
                        f'conversation status is {conv.status if conv else "N/A"} - no action taken'
                    )
                )
        
        except Job.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Job #20 not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
