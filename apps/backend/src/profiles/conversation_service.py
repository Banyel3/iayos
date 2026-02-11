"""
Conversation Archive/Unarchive Service Layer
Handles conversation archiving for both 1:1 and team conversations.
"""
from profiles.models import Conversation, ConversationParticipant
from django.db import transaction


def archive_conversation(conversation: Conversation, requester_profile=None):
    """
    Archive a conversation for all participants.
    
    For 1:1 conversations: Sets archivedByClient and archivedByWorker to True
    For team conversations: Sets is_archived=True for all ConversationParticipant records
    
    Args:
        conversation: The Conversation instance to archive
        requester_profile: Optional Profile instance of the requester (unused, for consistency)
    
    Returns:
        dict: Success status and message
    """
    with transaction.atomic():
        # Check if this is a team conversation (multiple participants)
        is_team_conversation = ConversationParticipant.objects.filter(
            conversation=conversation
        ).exists()
        
        if is_team_conversation:
            # Team conversation: Archive for all participants
            ConversationParticipant.objects.filter(
                conversation=conversation
            ).update(is_archived=True)
            
            return {
                'success': True,
                'message': f'Team conversation {conversation.conversationID} archived for all participants'
            }
        else:
            # 1:1 conversation: Archive for both client and worker
            conversation.archivedByClient = True
            conversation.archivedByWorker = True
            conversation.save(update_fields=['archivedByClient', 'archivedByWorker'])
            
            return {
                'success': True,
                'message': f'Conversation {conversation.conversationID} archived for both parties'
            }


def unarchive_conversation(conversation: Conversation, requester_profile=None):
    """
    Unarchive a conversation for all participants.
    
    For 1:1 conversations: Sets archivedByClient and archivedByWorker to False
    For team conversations: Sets is_archived=False for all ConversationParticipant records
    
    Args:
        conversation: The Conversation instance to unarchive
        requester_profile: Optional Profile instance of the requester (unused, for consistency)
    
    Returns:
        dict: Success status and message
    """
    with transaction.atomic():
        # Check if this is a team conversation (multiple participants)
        is_team_conversation = ConversationParticipant.objects.filter(
            conversation=conversation
        ).exists()
        
        if is_team_conversation:
            # Team conversation: Unarchive for all participants
            ConversationParticipant.objects.filter(
                conversation=conversation
            ).update(is_archived=False)
            
            return {
                'success': True,
                'message': f'Team conversation {conversation.conversationID} unarchived for all participants'
            }
        else:
            # 1:1 conversation: Unarchive for both client and worker
            conversation.archivedByClient = False
            conversation.archivedByWorker = False
            conversation.save(update_fields=['archivedByClient', 'archivedByWorker'])
            
            return {
                'success': True,
                'message': f'Conversation {conversation.conversationID} unarchived for both parties'
            }


def should_auto_archive(conversation: Conversation) -> bool:
    """
    Check if a conversation should be auto-archived based on job completion and reviews.
    
    A conversation should be archived when:
    - Job status is COMPLETED
    - Both client and worker have reviewed each other
    
    Args:
        conversation: The Conversation instance to check
    
    Returns:
        bool: True if conversation should be archived, False otherwise
    """
    from accounts.models import JobReview
    
    job = conversation.relatedJobPosting
    if not job or job.status != 'COMPLETED':
        return False
    
    # Check if both parties have reviewed
    client_reviewed = JobReview.objects.filter(
        reviewedJobID=job,
        reviewerProfile=job.clientID
    ).exists()
    
    worker_reviewed = JobReview.objects.filter(
        reviewedJobID=job,
        reviewedProfile=job.assignedWorkerID
    ).exists()
    
    return client_reviewed and worker_reviewed
