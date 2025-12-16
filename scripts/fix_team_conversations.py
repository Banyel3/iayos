#!/usr/bin/env python
"""
Fix existing team conversations: Change 'TEAM' to 'TEAM_GROUP'
This script updates all team conversations to use the correct conversation_type.
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'backend', 'src'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from profiles.models import Conversation
from accounts.models import Job

def fix_team_conversations():
    """Update all team conversations to use TEAM_GROUP instead of TEAM"""
    
    print("=" * 60)
    print("FIXING TEAM CONVERSATION TYPES")
    print("=" * 60)
    
    # Find all conversations with type 'TEAM' (incorrect)
    wrong_type_conversations = Conversation.objects.filter(conversation_type='TEAM')
    count = wrong_type_conversations.count()
    
    print(f"\n✓ Found {count} conversations with incorrect type 'TEAM'")
    
    if count == 0:
        print("✓ All team conversations already have correct type!")
        return
    
    # Update to TEAM_GROUP (correct)
    updated_count = wrong_type_conversations.update(conversation_type='TEAM_GROUP')
    
    print(f"✓ Updated {updated_count} conversations to 'TEAM_GROUP'\n")
    
    # Verify and display results
    print("=" * 60)
    print("VERIFICATION - ALL TEAM JOB CONVERSATIONS")
    print("=" * 60)
    
    team_jobs = Job.objects.filter(is_team_job=True).order_by('-createdAt')
    
    for job in team_jobs:
        conversation = Conversation.objects.filter(relatedJobPosting=job).first()
        if conversation:
            print(f"\nJob ID: {job.jobID}")
            print(f"  Title: {job.title}")
            print(f"  Status: {job.status}")
            print(f"  Conversation ID: {conversation.conversationID}")
            print(f"  Conversation Type: {conversation.conversation_type} {'✓' if conversation.conversation_type == 'TEAM_GROUP' else '✗'}")
            
            # Check participants
            participants_count = conversation.participants.count()
            print(f"  Participants: {participants_count}")
        else:
            print(f"\nJob ID: {job.jobID}")
            print(f"  Title: {job.title}")
            print(f"  Status: {job.status}")
            print(f"  Conversation: NOT CREATED YET")
    
    print("\n" + "=" * 60)
    print("FIX COMPLETE!")
    print("=" * 60)
    print("\nAll team conversations now use 'TEAM_GROUP' type.")
    print("The mobile app should now display team_worker_assignments correctly.\n")

if __name__ == '__main__':
    try:
        fix_team_conversations()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
