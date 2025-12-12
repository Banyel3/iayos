import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message, Profile
from accounts.models import Job, JobReview, Agency

User = get_user_model()


class InboxConsumer(AsyncWebsocketConsumer):
    """
    Single WebSocket consumer for ALL conversations belonging to a user.
    Handles message routing based on conversation_id in the message payload.
    Supports both regular users (with Profile) and agency users (with Agency).
    """
    async def connect(self):
        self.user = self.scope.get('user')
        self.is_agency = False
        
        print(f"[InboxWS] Connection attempt for user: {self.user}")
        print(f"[InboxWS] Is authenticated: {self.user.is_authenticated if self.user else 'No user'}")
        
        if not self.user or not self.user.is_authenticated:
            print(f"[InboxWS] REJECTED: User not authenticated")
            await self.close()
            return
        
        # Check if user is an agency or has a profile
        self.profile = await self.get_user_profile()
        self.agency = await self.get_user_agency()
        
        if not self.profile and not self.agency:
            print(f"[InboxWS] REJECTED: Neither Profile nor Agency found for user")
            await self.close()
            return
        
        self.is_agency = self.agency is not None
        print(f"[InboxWS] User type: {'Agency' if self.is_agency else 'Profile'}")
        
        # Get ALL conversations this user is part of
        conversation_ids = await self.get_user_conversations()
        print(f"[InboxWS] User has {len(conversation_ids)} conversations: {conversation_ids}")
        
        # Subscribe to ALL conversation groups
        self.conversation_groups = []
        for conv_id in conversation_ids:
            group_name = f'chat_{conv_id}'
            await self.channel_layer.group_add(group_name, self.channel_name)
            self.conversation_groups.append(group_name)
        
        await self.accept()
        print(f"[InboxWS] ✅ Connection accepted for user {self.user.email}")
        print(f"[InboxWS] ✅ Subscribed to {len(self.conversation_groups)} conversation groups")

    async def disconnect(self, close_code):
        # Unsubscribe from all conversation groups
        if hasattr(self, 'conversation_groups'):
            for group_name in self.conversation_groups:
                await self.channel_layer.group_discard(group_name, self.channel_name)
            print(f"[InboxWS] Disconnected, unsubscribed from {len(self.conversation_groups)} groups")

    async def receive(self, text_data):
        try:
            print(f"[InboxWS] 📩 Received data: {text_data}")
            data = json.loads(text_data)

            # Check if this is a message history request
            action = data.get('action')
            if action == 'get_messages':
                await self.handle_get_messages(data)
                return

            # Check if this is a typing indicator
            if action == 'typing':
                await self.handle_typing_indicator(data)
                return

            conversation_id = data.get('conversation_id')
            message_text = data.get('message', '')
            message_type = data.get('type', 'TEXT')

            print(f"[InboxWS] Conversation: {conversation_id}, Message: '{message_text}', Type: {message_type}")

            if not conversation_id:
                print("[InboxWS] ⚠️ No conversation_id provided, skipping")
                return

            if not message_text:
                print("[InboxWS] ⚠️ Empty message, skipping")
                return

            # Verify user has access to this conversation
            has_access = await self.verify_conversation_access(conversation_id)
            if not has_access:
                print(f"[InboxWS] ⚠️ User does not have access to conversation {conversation_id}")
                return

            print(f"[InboxWS] 💾 Saving message to database...")
            message = await self.save_message(conversation_id, message_text, message_type)
            print(f"[InboxWS] ✅ Message saved with ID: {message.messageID}")

            # Determine sender info (works for both Profile and Agency senders)
            sender_name = message.get_sender_name()
            sender_avatar = None
            if message.sender and hasattr(message.sender, 'profileImg') and message.sender.profileImg:
                sender_avatar = message.sender.profileImg  # profileImg is a CharField (URL string), not FileField

            # Broadcast to conversation group
            room_group_name = f'chat_{conversation_id}'
            await self.channel_layer.group_send(
                room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'conversation_id': int(conversation_id),
                        'sender_name': sender_name,
                        'sender_avatar': sender_avatar,
                        'message': message.messageText,
                        'type': message.messageType,
                        'created_at': message.createdAt.isoformat(),
                        'is_mine': False,  # Frontend will determine this based on current user
                    }
                }
            )
            print(f"[InboxWS] 📤 Message broadcasted to group {room_group_name}")
        except json.JSONDecodeError as e:
            print(f"[InboxWS] ❌ JSON decode error: {str(e)}")
        except Exception as e:
            print(f'[InboxWS] ❌ Error in receive: {str(e)}')
            import traceback
            traceback.print_exc()

    async def chat_message(self, event):
        """Send message to WebSocket - all subscribers will receive, frontend filters"""
        message = event['message']
        print(f"[InboxWS] 📤 Sending message for conversation {message.get('conversation_id')}")
        await self.send(text_data=json.dumps(message))

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket"""
        data = event['data']
        print(f"[InboxWS] 📤 Sending typing indicator for conversation {data.get('conversation_id')}")
        await self.send(text_data=json.dumps({
            'action': 'typing',
            'conversation_id': data['conversation_id'],
            'user_id': data['user_id'],
            'user_name': data['user_name'],
            'is_typing': data['is_typing']
        }))

    async def handle_typing_indicator(self, data):
        """Handle typing indicator events"""
        conversation_id = data.get('conversation_id')
        is_typing = data.get('is_typing', True)

        if not conversation_id:
            print("[InboxWS] ⚠️ No conversation_id in typing event")
            return

        # Verify access
        has_access = await self.verify_conversation_access(conversation_id)
        if not has_access:
            print(f"[InboxWS] ⚠️ User does not have access to conversation {conversation_id}")
            return

        # Get user info
        user_info = await self.get_user_info()

        print(f"[InboxWS] 👀 Broadcasting typing indicator: User {user_info['name']} {'is' if is_typing else 'stopped'} typing")

        # Broadcast typing indicator to conversation group
        room_group_name = f'chat_{conversation_id}'
        await self.channel_layer.group_send(
            room_group_name,
            {
                'type': 'typing_indicator',
                'data': {
                    'conversation_id': int(conversation_id),
                    'user_id': user_info['id'],
                    'user_name': user_info['name'],
                    'is_typing': is_typing
                }
            }
        )

    @database_sync_to_async
    def get_user_info(self):
        """Get current user's profile information"""
        try:
            profile = Profile.objects.get(accountFK=self.user)
            return {
                'id': profile.profileID,
                'name': f"{profile.firstName} {profile.lastName}"
            }
        except Profile.DoesNotExist:
            return {
                'id': 0,
                'name': 'Unknown'
            }

    @database_sync_to_async
    def get_user_profile(self):
        try:
            return Profile.objects.get(accountFK=self.user)
        except Profile.DoesNotExist:
            return None

    @database_sync_to_async
    def get_user_agency(self):
        """Get agency record for user if they are an agency owner"""
        try:
            return Agency.objects.get(accountFK=self.user)
        except Agency.DoesNotExist:
            return None

    @database_sync_to_async
    def get_user_conversations(self):
        """Get all conversation IDs the user is part of (supports both Profile and Agency users)"""
        try:
            conversations = Conversation.objects.none()
            
            # Check for Profile-based conversations (client or worker)
            try:
                profile = Profile.objects.get(accountFK=self.user)
                conversations = Conversation.objects.filter(
                    client=profile
                ) | Conversation.objects.filter(
                    worker=profile
                )
            except Profile.DoesNotExist:
                pass
            
            # Check for Agency-based conversations (directly via agency field)
            try:
                agency = Agency.objects.get(accountFK=self.user)
                agency_conversations = Conversation.objects.filter(agency=agency)
                conversations = conversations | agency_conversations
                print(f"[InboxWS] Found {agency_conversations.count()} agency conversations")
            except Agency.DoesNotExist:
                pass
            
            result = list(conversations.distinct().values_list('conversationID', flat=True))
            print(f"[InboxWS] Total conversations: {len(result)}")
            return result
        except Exception as e:
            print(f"[InboxWS] ERROR getting conversations: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    @database_sync_to_async
    def verify_conversation_access(self, conversation_id):
        """Verify user has access to conversation (supports both Profile and Agency)"""
        try:
            conversation = Conversation.objects.get(conversationID=conversation_id)
            
            # Check Profile-based access (client or worker)
            try:
                profile = Profile.objects.get(accountFK=self.user)
                if conversation.client.profileID == profile.profileID:
                    print(f"[InboxWS] Client access granted for conv {conversation_id}")
                    return True
                if conversation.worker and conversation.worker.profileID == profile.profileID:
                    print(f"[InboxWS] Worker access granted for conv {conversation_id}")
                    return True
            except Profile.DoesNotExist:
                pass
            
            # Check Agency-based access (directly via agency field)
            try:
                agency = Agency.objects.get(accountFK=self.user)
                if conversation.agency and conversation.agency.agencyId == agency.agencyId:
                    print(f"[InboxWS] Agency access granted for conv {conversation_id}")
                    return True
            except Agency.DoesNotExist:
                pass
            
            print(f"[InboxWS] Access DENIED for conv {conversation_id}")
            return False
        except Conversation.DoesNotExist as e:
            print(f"[InboxWS] ERROR: Conversation {conversation_id} not found")
            return False

    @database_sync_to_async
    def save_message(self, conversation_id, message_text, message_type):
        """Save a message - supports both Profile and Agency senders"""
        try:
            conversation = Conversation.objects.get(conversationID=conversation_id)
            
            # Try to get profile for sender
            profile = None
            agency = None
            try:
                profile = Profile.objects.get(accountFK=self.user)
                print(f"[InboxWS] ✅ Sender profile: {profile.profileID}")
            except Profile.DoesNotExist:
                # For agency users without profile, get their agency
                print(f"[InboxWS] ⚠️ No profile for user {self.user.email}, checking if agency...")
                try:
                    agency = Agency.objects.get(accountFK=self.user)
                    print(f"[InboxWS] ✅ Sender agency: {agency.agencyId} ({agency.businessName})")
                except Agency.DoesNotExist:
                    print(f"[InboxWS] ❌ No profile or agency found for user!")
                    raise Exception("User has no profile or agency")
            
            print(f"[InboxWS] 🔍 Looking up conversation: {conversation_id}")
            
            print(f"[InboxWS] 💾 Creating message...")
            message = Message.objects.create(
                conversationID=conversation, 
                sender=profile,  # None if agency user
                senderAgency=agency,  # None if profile user
                messageText=message_text, 
                messageType=message_type, 
                isRead=False
            )
            print(f"[InboxWS] ✅ Message created with ID: {message.messageID}")
            return message
        except Exception as e:
            print(f"[InboxWS] ❌ Error saving message: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    async def handle_get_messages(self, data):
        """Handle WebSocket request for message history"""
        conversation_id = data.get('conversation_id')
        
        if not conversation_id:
            await self.send(text_data=json.dumps({
                'action': 'messages_response',
                'error': 'No conversation_id provided'
            }))
            return
        
        # Verify access
        has_access = await self.verify_conversation_access(conversation_id)
        if not has_access:
            await self.send(text_data=json.dumps({
                'action': 'messages_response',
                'error': 'Access denied'
            }))
            return
        
        print(f"[InboxWS] 📖 Fetching message history for conversation {conversation_id}")
        
        # Get messages and conversation data
        messages_data = await self.get_conversation_messages(conversation_id)
        
        # Send response back to this client only
        await self.send(text_data=json.dumps({
            'action': 'messages_response',
            'conversation_id': conversation_id,
            'messages': messages_data['messages'],
            'conversation': messages_data['conversation']
        }))
        
        print(f"[InboxWS] ✅ Sent {len(messages_data['messages'])} messages for conversation {conversation_id}")

    @database_sync_to_async
    def get_conversation_messages(self, conversation_id):
        """Fetch all messages for a conversation (same as REST API). Supports agencies."""
        try:
            conversation = Conversation.objects.get(conversationID=conversation_id)
            messages = Message.objects.filter(conversationID=conversation).order_by('createdAt')
            
            # Try to get profile or agency for this user
            profile = None
            agency = None
            is_client = False
            my_role = 'UNKNOWN'
            
            try:
                profile = Profile.objects.get(accountFK=self.user)
                if conversation.client == profile:
                    conversation.unreadCountClient = 0
                    is_client = True
                    my_role = 'CLIENT'
                else:
                    conversation.unreadCountWorker = 0
                    my_role = 'WORKER'
                conversation.save(update_fields=['unreadCountClient' if is_client else 'unreadCountWorker'])
            except Profile.DoesNotExist:
                # Check if agency user
                try:
                    agency = Agency.objects.get(accountFK=self.user)
                    # Agency user viewing - clear their unread
                    conversation.unreadCountWorker = 0
                    conversation.save(update_fields=['unreadCountWorker'])
                    my_role = 'AGENCY'
                except Agency.DoesNotExist:
                    pass
            
            # Format messages
            formatted_messages = []
            for msg in messages:
                # Determine if this is my message
                is_mine = False
                if profile and msg.sender == profile:
                    is_mine = True
                elif agency and msg.senderAgency == agency:
                    is_mine = True
                
                formatted_messages.append({
                    'sender_name': msg.get_sender_name(),
                    'sender_avatar': msg.sender.profileImg if msg.sender else "/agency-default.jpg",
                    'message_text': msg.messageText,
                    'message_type': msg.messageType,
                    'is_read': msg.isRead,
                    'created_at': msg.createdAt.isoformat(),
                    'is_mine': is_mine
                })
            
            # Get job data
            job = conversation.relatedJobPosting
            
            # Get review status
            worker_account = None
            if job.assignedWorkerID:
                worker_account = job.assignedWorkerID.profileID.accountFK
            elif job.assignedAgencyFK:
                worker_account = job.assignedAgencyFK.accountFK
            client_account = job.clientID.profileID.accountFK
            
            worker_reviewed = False
            client_reviewed = False
            
            if worker_account and client_account:
                worker_reviewed = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=worker_account
                ).exists()
                
                client_reviewed = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=client_account
                ).exists()
            
            conversation_data = {
                'my_role': my_role,
                'job': {
                    'id': job.jobID,
                    'title': job.title,
                    'status': job.status,
                    'budget': float(job.budget),
                    'location': job.location,
                    'workerMarkedComplete': job.workerMarkedComplete,
                    'clientMarkedComplete': job.clientMarkedComplete,
                    'workerReviewed': worker_reviewed,
                    'clientReviewed': client_reviewed,
                    'remainingPaymentPaid': job.remainingPaymentPaid
                }
            }
            
            return {
                'messages': formatted_messages,
                'conversation': conversation_data
            }
        except Exception as e:
            print(f"[InboxWS] ❌ Error getting messages: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'messages': [], 'conversation': {}}


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        self.user = self.scope.get('user')
        
        # Debug logging
        print(f"[WebSocket] Connection attempt to conversation {self.conversation_id}")
        print(f"[WebSocket] User: {self.user}")
        print(f"[WebSocket] Is authenticated: {self.user.is_authenticated if self.user else 'No user'}")
        
        if not self.user or not self.user.is_authenticated:
            print(f"[WebSocket] REJECTED: User not authenticated")
            await self.close()
            return
        
        has_access = await self.verify_conversation_access()
        print(f"[WebSocket] Has access: {has_access}")
        
        if not has_access:
            print(f"[WebSocket] REJECTED: User does not have access to conversation")
            await self.close()
            return
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"[WebSocket] ✅ Connection accepted for user {self.user.email}")

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            print(f"[WebSocket] 📩 Received data: {text_data}")
            data = json.loads(text_data)
            message_text = data.get('message', '')
            message_type = data.get('type', 'TEXT')
            print(f"[WebSocket] Message text: '{message_text}', type: {message_type}")
            
            if not message_text:
                print("[WebSocket] ⚠️ Empty message, skipping")
                return
            
            print(f"[WebSocket] 💾 Saving message to database...")
            message = await self.save_message(message_text, message_type)
            print(f"[WebSocket] ✅ Message saved with ID: {message.messageID}")
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': message.messageID,
                        'conversation_id': self.conversation_id,
                        'sender_id': str(message.sender.profileID),
                        'sender_name': f"{message.sender.firstName} {message.sender.lastName}",
                        'message_text': message.messageText,
                        'message_type': message.messageType,
                        'timestamp': message.createdAt.isoformat(),
                        'is_read': message.isRead,
                    }
                }
            )
            print(f"[WebSocket] 📤 Message broadcasted to group")
        except json.JSONDecodeError as e:
            print(f"[WebSocket] ❌ JSON decode error: {str(e)}")
        except Exception as e:
            print(f'[WebSocket] ❌ Error in receive: {str(e)}')
            import traceback
            traceback.print_exc()

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({'type': 'message', 'message': message}))

    @database_sync_to_async
    def verify_conversation_access(self):
        try:
            print(f"[WebSocket] Checking access for user: {self.user}")
            profile = Profile.objects.get(accountFK=self.user)
            print(f"[WebSocket] Found profile: {profile.profileID}")
            
            conversation = Conversation.objects.get(conversationID=self.conversation_id)
            print(f"[WebSocket] Found conversation: {conversation.conversationID}")
            print(f"[WebSocket] Client: {conversation.client.profileID}, Worker: {conversation.worker.profileID}")
            
            has_access = (conversation.client.profileID == profile.profileID or 
                         conversation.worker.profileID == profile.profileID)
            print(f"[WebSocket] Access result: {has_access}")
            return has_access
        except Profile.DoesNotExist:
            print(f"[WebSocket] ERROR: Profile not found for user {self.user}")
            return False
        except Conversation.DoesNotExist:
            print(f"[WebSocket] ERROR: Conversation {self.conversation_id} not found")
            return False
        except Exception as e:
            print(f"[WebSocket] ERROR: {str(e)}")
            return False

    @database_sync_to_async
    def save_message(self, message_text, message_type):
        try:
            print(f"[WebSocket] 🔍 Looking up profile for user: {self.user.email}")
            profile = Profile.objects.get(accountFK=self.user)
            print(f"[WebSocket] ✅ Found profile: {profile.profileID}")
            
            print(f"[WebSocket] 🔍 Looking up conversation: {self.conversation_id}")
            conversation = Conversation.objects.get(conversationID=self.conversation_id)
            print(f"[WebSocket] ✅ Found conversation: {conversation.conversationID}")
            
            print(f"[WebSocket] 💾 Creating message...")
            message = Message.objects.create(
                conversationID=conversation, 
                sender=profile, 
                messageText=message_text, 
                messageType=message_type, 
                isRead=False
            )
            print(f"[WebSocket] ✅ Message created with ID: {message.messageID}")
            return message
        except Exception as e:
            print(f"[WebSocket] ❌ Error saving message: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


class JobStatusConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for job status updates
    Allows clients and workers to receive real-time job status changes
    """
    async def connect(self):
        self.job_id = self.scope['url_route']['kwargs']['job_id']
        self.room_group_name = f'job_{self.job_id}'
        self.user = self.scope.get('user')
        
        print(f"[JobWS] Connection attempt to job {self.job_id}")
        print(f"[JobWS] User: {self.user}")
        
        if not self.user or not self.user.is_authenticated:
            print(f"[JobWS] REJECTED: User not authenticated")
            await self.close()
            return
        
        has_access = await self.verify_job_access()
        print(f"[JobWS] Has access: {has_access}")
        
        if not has_access:
            print(f"[JobWS] REJECTED: User does not have access to job")
            await self.close()
            return
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"[JobWS] ✅ Connection accepted for user {self.user.email}")

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            print(f"[JobWS] Disconnected from job {self.job_id}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            print(f"[JobWS] 📩 Received data: {text_data}")
            data = json.loads(text_data)
            # Currently no client-to-server messages needed
            # Job status updates are sent from the API endpoints
        except Exception as e:
            print(f'[JobWS] ❌ Error in receive: {str(e)}')

    async def job_status_update(self, event):
        """Send job status update to WebSocket"""
        print(f"[JobWS] 📤 Broadcasting job status update: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'job_status_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def verify_job_access(self):
        """Verify user has access to this job"""
        try:
            from accounts.models import Job
            from profiles.models import ClientProfile, WorkerProfile
            
            profile = Profile.objects.get(accountFK=self.user)
            job = Job.objects.select_related('clientID__profileID', 'assignedWorkerID__profileID').get(jobID=self.job_id)
            
            # Check if user is the client or assigned worker
            is_client = job.clientID and job.clientID.profileID.profileID == profile.profileID
            is_worker = job.assignedWorkerID and job.assignedWorkerID.profileID.profileID == profile.profileID
            
            has_access = is_client or is_worker
            print(f"[JobWS] Access check - Client: {is_client}, Worker: {is_worker}, Has access: {has_access}")
            return has_access
        except Profile.DoesNotExist:
            print(f"[JobWS] ERROR: Profile not found for user {self.user}")
            return False
        except Job.DoesNotExist:
            print(f"[JobWS] ERROR: Job {self.job_id} not found")
            return False
        except Exception as e:
            print(f"[JobWS] ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
