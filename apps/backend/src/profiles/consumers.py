import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message, Profile

User = get_user_model()


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
