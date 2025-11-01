import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message, Profile

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat functionality.
    Handles connection, disconnection, and message exchange for job-based conversations.
    """

    async def connect(self):
        """
        Called when WebSocket connection is established.
        Authenticates user and joins the conversation group.
        """
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        # Get user from scope (set by AuthMiddlewareStack)
        self.user = self.scope.get('user')
        
        # Verify user is authenticated
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        # Verify user has access to this conversation
        has_access = await self.verify_conversation_access()
        if not has_access:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        """
        Called when WebSocket connection is closed.
        Removes user from the conversation group.
        """
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """
        Called when message is received from WebSocket.
        Processes the message and broadcasts it to the conversation group.
        """
        try:
            data = json.loads(text_data)
            message_text = data.get('message', '')
            message_type = data.get('type', 'TEXT')
            
            if not message_text:
                return
            
            # Save message to database
            message = await self.save_message(message_text, message_type)
            
            # Send message to room group
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
                        'timestamp': message.timestamp.isoformat(),
                        'is_read': message.isRead,
                    }
                }
            )
            
        except json.JSONDecodeError:
            # Invalid JSON, ignore
            pass
        except Exception as e:
            # Log error in production
            print(f"Error in receive: {str(e)}")

    async def chat_message(self, event):
        """
        Called when a message is sent to the group.
        Sends the message to the WebSocket.
        """
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message
        }))

    @database_sync_to_async
    def verify_conversation_access(self):
        """
        Verify that the current user has access to this conversation.
        User must be either the client or worker in the conversation.
        """
        try:
            # Get user's profile
            profile = Profile.objects.get(accountID=self.user)
            
            # Check if user is part of this conversation
            conversation = Conversation.objects.get(
                conversationID=self.conversation_id
            )
            
            return (conversation.client.profileID == profile.profileID or 
                    conversation.worker.profileID == profile.profileID)
        except (Profile.DoesNotExist, Conversation.DoesNotExist):
            return False

    @database_sync_to_async
    def save_message(self, message_text, message_type):
        """
        Save message to database and update conversation metadata.
        Returns the created Message object.
        """
        # Get user's profile
        profile = Profile.objects.get(accountID=self.user)
        
        # Get conversation
        conversation = Conversation.objects.get(
            conversationID=self.conversation_id
        )
        
        # Create message (save() method will update conversation automatically)
        message = Message.objects.create(
            conversationID=conversation,
            sender=profile,
            messageText=message_text,
            messageType=message_type,
            isRead=False
        )
        
        return message
