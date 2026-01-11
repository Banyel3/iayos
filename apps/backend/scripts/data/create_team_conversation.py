"""
Script to add participants to the conversation for Job 117
"""
from accounts.models import Job, JobWorkerAssignment, Notification
from profiles.models import Conversation, ConversationParticipant

job = Job.objects.get(jobID=117)
print(f'Job: {job.jobID} - {job.title}')

conversation = Conversation.objects.filter(relatedJobPosting=job).first()
print(f'Conversation: {conversation.conversationID}')

if job.clientID:
    cp, created = ConversationParticipant.objects.get_or_create(
        conversation=conversation,
        profile=job.clientID.profileID,
        defaults={'participant_type': 'CLIENT'}
    )
    print(f'Added client: {created}')

assignments = JobWorkerAssignment.objects.filter(jobID=job, assignment_status='ACTIVE').select_related('workerID__profileID', 'skillSlotID')
for assign in assignments:
    cp, created = ConversationParticipant.objects.get_or_create(
        conversation=conversation,
        profile=assign.workerID.profileID,
        defaults={'participant_type': 'WORKER', 'skill_slot': assign.skillSlotID}
    )
    print(f'Added worker {assign.workerID.profileID.firstName}: {created}')

Notification.objects.create(
    accountFK=job.clientID.profileID.accountFK,
    notificationType='TEAM_JOB_READY',
    title='Team Ready!',
    message='All positions have been filled. Your team is ready to start!',
    relatedJobID=job.jobID
)
print('Done! Participants added and client notified.')
