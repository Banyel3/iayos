from django.core.management.base import BaseCommand
from profiles.models import Conversation
from accounts.models import Job


class Command(BaseCommand):
    help = 'Fix existing team conversations: Change TEAM to TEAM_GROUP'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("FIXING TEAM CONVERSATION TYPES")
        self.stdout.write("=" * 60)
        
        # Find all conversations with type 'TEAM' (incorrect)
        wrong_type_conversations = Conversation.objects.filter(conversation_type='TEAM')
        count = wrong_type_conversations.count()
        
        self.stdout.write(f"\n✓ Found {count} conversations with incorrect type 'TEAM'")
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS("✓ All team conversations already have correct type!"))
            return
        
        # Update to TEAM_GROUP (correct)
        updated_count = wrong_type_conversations.update(conversation_type='TEAM_GROUP')
        
        self.stdout.write(self.style.SUCCESS(f"✓ Updated {updated_count} conversations to 'TEAM_GROUP'\n"))
        
        # Verify and display results
        self.stdout.write("=" * 60)
        self.stdout.write("VERIFICATION - ALL TEAM JOB CONVERSATIONS")
        self.stdout.write("=" * 60)
        
        team_jobs = Job.objects.filter(is_team_job=True).order_by('-createdAt')
        
        for job in team_jobs:
            conversation = Conversation.objects.filter(relatedJobPosting=job).first()
            if conversation:
                self.stdout.write(f"\nJob ID: {job.jobID}")
                self.stdout.write(f"  Title: {job.title}")
                self.stdout.write(f"  Status: {job.status}")
                self.stdout.write(f"  Conversation ID: {conversation.conversationID}")
                status = '✓' if conversation.conversation_type == 'TEAM_GROUP' else '✗'
                self.stdout.write(f"  Conversation Type: {conversation.conversation_type} {status}")
                
                # Check participants
                participants_count = conversation.participants.count()
                self.stdout.write(f"  Participants: {participants_count}")
            else:
                self.stdout.write(f"\nJob ID: {job.jobID}")
                self.stdout.write(f"  Title: {job.title}")
                self.stdout.write(f"  Status: {job.status}")
                self.stdout.write(f"  Conversation: NOT CREATED YET")
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("FIX COMPLETE!"))
        self.stdout.write("=" * 60)
        self.stdout.write("\nAll team conversations now use 'TEAM_GROUP' type.")
        self.stdout.write("The mobile app should now display team_worker_assignments correctly.\n")
