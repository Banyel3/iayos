import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import JobPosting

# Verify the job budget
job = JobPosting.objects.get(title='Fix Table')

print('✅ Verification:')
print(f'Job: {job.title}')
print(f'Budget: ₱{job.budget}')
print(f'Status: {job.status}')

# Check if there's a conversation for this job
from profiles.models import Conversation
conv = Conversation.objects.filter(relatedJobPosting=job).first()
if conv:
    print(f'\nConversation exists:')
    print(f'  Client: {conv.client.firstName} {conv.client.lastName}')
    print(f'  Worker: {conv.worker.firstName} {conv.worker.lastName}')
    print(f'  Job Budget (shown in chat): ₱{conv.relatedJobPosting.budget}')
else:
    print('\nNo conversation found for this job yet')
