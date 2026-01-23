# Agency Module 2: Real-Time Chat & Messaging System

**Status**: 📋 PLANNED  
**Priority**: HIGH  
**Estimated Time**: 15-18 hours  
**Dependencies**: Existing Conversation/Message models, Module 1 (for employee context)

---

## Module Overview

Real-time chat system enabling three-way communication between agencies, clients, and assigned workers. Critical for coordinating job execution, providing updates, and resolving issues during active jobs.

### Scope

- WebSocket integration (Django Channels)
- Conversation list with job context
- Real-time message threading
- Typing indicators
- Read receipts
- File/photo attachments
- Message notifications
- Unread message counts

---

## Current State Analysis

### ✅ What Exists

**Message Models** (`apps/backend/src/accounts/models.py`):

```python
class Conversation(models.Model):
    conversationID (PK)
    jobID (FK to Job)
    clientFK (FK to Account)
    workerFK (FK to Account)
    createdAt, lastMessageAt

class Message(models.Model):
    messageID (PK)
    conversationFK (FK to Conversation)
    senderFK (FK to Account)
    messageText, isRead
    createdAt
```

**Mobile Chat Implementation**:

- `apps/frontend_mobile/iayos_mobile/app/messages/[conversationId].tsx` (800+ lines)
- Real-time message polling
- Job completion buttons in chat
- Photo attachments
- Status messages

**Web Inbox** (`apps/frontend_web/app/dashboard/inbox/page.tsx` - 1,300+ lines):

- Conversation list
- Message threading
- Mark complete / Approve completion buttons
- File uploads

### ❌ What's Missing for Agency

1. **No agency participation** in conversations (currently only client ↔ worker)
2. **No WebSocket support** (uses polling, inefficient)
3. **No agency-specific chat UI** in agency portal
4. **No three-way chat** (agency needs to monitor client-worker communication)
5. **No employee mentions** (@employee tagging)
6. **No chat notifications** for agencies

---

## Architecture Decision

### Option 1: Extend Existing Conversations (RECOMMENDED)

**Approach**: Add `agencyFK` field to Conversation model

**Pros**:

- Simplest implementation
- Reuse existing Message model
- Single conversation per job
- Easy to add agency as participant

**Cons**:

- Three-way chat in single thread (could be cluttered)
- All parties see all messages

### Option 2: Separate Conversations

**Approach**: Create separate conversations (client-agency, agency-worker)

**Pros**:

- Clear separation of concerns
- Private agency-worker discussions
- Client doesn't see internal agency chat

**Cons**:

- More complex logic
- Duplicate messages
- Harder to keep everyone synchronized

**DECISION**: **Option 1** - Extend existing conversations with agency participation

---

## Backend Implementation

### Task 1: Database Migration ⏰ 1 hour

**Create Migration**: `0039_conversation_agency_support.py`

```python
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0038_job_assigned_employee_tracking'),
    ]

    operations = [
        # Add agency as conversation participant
        migrations.AddField(
            model_name='conversation',
            name='agencyFK',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='agency_conversations',
                to='agency.agency',
                help_text='Agency involved in this conversation (for agency jobs)'
            ),
        ),

        # Add index for performance
        migrations.AddIndex(
            model_name='conversation',
            index=models.Index(
                fields=['agencyFK', 'lastMessageAt'],
                name='conversation_agency_last_msg_idx'
            ),
        ),

        # Add typing indicator field
        migrations.AddField(
            model_name='conversation',
            name='typingUserFK',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='typing_conversations',
                to='accounts.accounts',
                help_text='User currently typing in this conversation'
            ),
        ),

        migrations.AddField(
            model_name='conversation',
            name='typingAt',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='When user started typing'
            ),
        ),
    ]
```

---

### Task 2: WebSocket Consumer (Django Channels) ⏰ 3-4 hours

**File**: `apps/backend/src/chat/consumers.py` (NEW)

```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        self.user = self.scope['user']

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

        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'conversation_id': self.conversation_id
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Clear typing indicator
        await self.clear_typing_indicator()

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'send_message':
            await self.handle_send_message(data)
        elif message_type == 'typing_start':
            await self.handle_typing_start()
        elif message_type == 'typing_stop':
            await self.handle_typing_stop()
        elif message_type == 'mark_read':
            await self.handle_mark_read(data)

    async def handle_send_message(self, data):
        """Save message and broadcast to all participants"""
        message_text = data.get('message')
        attachment_url = data.get('attachment_url')

        # Save message to database
        message = await self.save_message(message_text, attachment_url)

        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

        # Send push notifications to offline users
        await self.send_push_notifications(message)

    async def handle_typing_start(self):
        """Broadcast typing indicator"""
        await self.update_typing_indicator(is_typing=True)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_typing',
                'user_id': self.user.accountID,
                'is_typing': True
            }
        )

    async def handle_typing_stop(self):
        """Clear typing indicator"""
        await self.update_typing_indicator(is_typing=False)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_typing',
                'user_id': self.user.accountID,
                'is_typing': False
            }
        )

    async def handle_mark_read(self, data):
        """Mark messages as read"""
        message_ids = data.get('message_ids', [])
        await self.mark_messages_read(message_ids)

        # Broadcast read receipts
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'messages_read',
                'message_ids': message_ids,
                'user_id': self.user.accountID
            }
        )

    # Event handlers for group messages
    async def chat_message(self, event):
        """Receive message from room group"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def user_typing(self, event):
        """Receive typing indicator from room group"""
        await self.send(text_data=json.dumps({
            'type': 'typing_indicator',
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))

    async def messages_read(self, event):
        """Receive read receipts from room group"""
        await self.send(text_data=json.dumps({
            'type': 'read_receipts',
            'message_ids': event['message_ids'],
            'user_id': event['user_id']
        }))

    # Database operations
    @database_sync_to_async
    def verify_conversation_access(self):
        """Check if user is participant in conversation"""
        from accounts.models import Conversation
        try:
            conversation = Conversation.objects.select_related(
                'clientFK', 'workerFK', 'agencyFK'
            ).get(conversationID=self.conversation_id)

            # Check if user is client, worker, or agency
            is_client = conversation.clientFK == self.user
            is_worker = conversation.workerFK == self.user
            is_agency = (
                conversation.agencyFK and
                conversation.agencyFK.accountFK == self.user
            )

            return is_client or is_worker or is_agency
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message_text, attachment_url=None):
        """Save message to database"""
        from accounts.models import Conversation, Message

        conversation = Conversation.objects.get(conversationID=self.conversation_id)

        message = Message.objects.create(
            conversationFK=conversation,
            senderFK=self.user,
            messageText=message_text,
            attachmentUrl=attachment_url,
            isRead=False
        )

        # Update conversation last message timestamp
        conversation.lastMessageAt = timezone.now()
        conversation.save()

        return {
            'message_id': message.messageID,
            'sender_id': message.senderFK.accountID,
            'sender_name': f"{message.senderFK.firstName} {message.senderFK.lastName}",
            'text': message.messageText,
            'attachment_url': message.attachmentUrl,
            'created_at': message.createdAt.isoformat(),
            'is_read': message.isRead
        }

    @database_sync_to_async
    def update_typing_indicator(self, is_typing):
        """Update typing indicator in conversation"""
        from accounts.models import Conversation

        conversation = Conversation.objects.get(conversationID=self.conversation_id)

        if is_typing:
            conversation.typingUserFK = self.user
            conversation.typingAt = timezone.now()
        else:
            conversation.typingUserFK = None
            conversation.typingAt = None

        conversation.save()

    @database_sync_to_async
    def clear_typing_indicator(self):
        """Clear typing indicator on disconnect"""
        from accounts.models import Conversation

        try:
            conversation = Conversation.objects.get(conversationID=self.conversation_id)
            if conversation.typingUserFK == self.user:
                conversation.typingUserFK = None
                conversation.typingAt = None
                conversation.save()
        except Conversation.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_messages_read(self, message_ids):
        """Mark messages as read"""
        from accounts.models import Message

        Message.objects.filter(
            messageID__in=message_ids,
            conversationFK__conversationID=self.conversation_id
        ).exclude(
            senderFK=self.user
        ).update(isRead=True)

    @database_sync_to_async
    def send_push_notifications(self, message):
        """Send push notifications to offline users"""
        from accounts.models import Conversation, Notification

        conversation = Conversation.objects.select_related(
            'clientFK', 'workerFK', 'agencyFK__accountFK', 'jobID'
        ).get(conversationID=self.conversation_id)

        # Determine recipients (everyone except sender)
        recipients = []
        if conversation.clientFK != self.user:
            recipients.append(conversation.clientFK)
        if conversation.workerFK and conversation.workerFK != self.user:
            recipients.append(conversation.workerFK)
        if conversation.agencyFK and conversation.agencyFK.accountFK != self.user:
            recipients.append(conversation.agencyFK.accountFK)

        # Create notifications
        sender_name = f"{self.user.firstName} {self.user.lastName}"
        for recipient in recipients:
            Notification.objects.create(
                accountFK=recipient,
                notificationType='NEW_MESSAGE',
                title=f'New message from {sender_name}',
                message=message['text'][:100],
                relatedJobID=conversation.jobID.jobID if conversation.jobID else None
            )
```

---

### Task 3: WebSocket Routing ⏰ 30 minutes

**File**: `apps/backend/src/chat/routing.py` (NEW)

```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
```

**File**: `apps/backend/src/iayos/asgi.py` (MODIFY)

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
```

---

### Task 4: Chat API Endpoints ⏰ 2 hours

**File**: `apps/backend/src/agency/api.py` (ADD)

```python
@router.get("/conversations", auth=cookie_auth)
def get_agency_conversations(
    request,
    page: int = 1,
    limit: int = 20
):
    """
    Get all conversations involving this agency

    GET /api/agency/conversations?page=1&limit=20
    """
    try:
        agency = Agency.objects.get(accountFK=request.auth)
    except Agency.DoesNotExist:
        return Response({'error': 'Agency not found'}, status=404)

    # Get conversations where agency is participant
    conversations = Conversation.objects.filter(
        agencyFK=agency
    ).select_related(
        'jobID',
        'clientFK',
        'workerFK'
    ).prefetch_related(
        'messages'
    ).order_by('-lastMessageAt')

    # Pagination
    total = conversations.count()
    start = (page - 1) * limit
    end = start + limit
    conversations_page = conversations[start:end]

    # Format conversations
    results = []
    for conv in conversations_page:
        # Get last message
        last_message = conv.messages.order_by('-createdAt').first()

        # Count unread messages
        unread_count = conv.messages.filter(
            isRead=False
        ).exclude(
            senderFK=request.auth
        ).count()

        results.append({
            'conversation_id': conv.conversationID,
            'job': {
                'id': conv.jobID.jobID,
                'title': conv.jobID.title,
                'status': conv.jobID.status
            } if conv.jobID else None,
            'client': {
                'id': conv.clientFK.accountID,
                'name': f"{conv.clientFK.firstName} {conv.clientFK.lastName}",
                'email': conv.clientFK.email
            },
            'worker': {
                'id': conv.workerFK.accountID,
                'name': f"{conv.workerFK.firstName} {conv.workerFK.lastName}",
                'email': conv.workerFK.email
            } if conv.workerFK else None,
            'last_message': {
                'text': last_message.messageText,
                'sender_name': f"{last_message.senderFK.firstName} {last_message.senderFK.lastName}",
                'created_at': last_message.createdAt.isoformat()
            } if last_message else None,
            'unread_count': unread_count,
            'last_message_at': conv.lastMessageAt.isoformat() if conv.lastMessageAt else None,
            'created_at': conv.createdAt.isoformat()
        })

    return Response({
        'success': True,
        'conversations': results,
        'total': total,
        'page': page,
        'pages': (total + limit - 1) // limit
    })


@router.get("/conversations/{conversation_id}/messages", auth=cookie_auth)
def get_conversation_messages(
    request,
    conversation_id: int,
    page: int = 1,
    limit: int = 50
):
    """
    Get messages for a specific conversation

    GET /api/agency/conversations/{id}/messages?page=1&limit=50
    """
    try:
        agency = Agency.objects.get(accountFK=request.auth)
    except Agency.DoesNotExist:
        return Response({'error': 'Agency not found'}, status=404)

    # Verify conversation belongs to agency
    try:
        conversation = Conversation.objects.select_related(
            'jobID',
            'clientFK',
            'workerFK'
        ).get(
            conversationID=conversation_id,
            agencyFK=agency
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=404)

    # Get messages
    messages = Message.objects.filter(
        conversationFK=conversation
    ).select_related('senderFK').order_by('-createdAt')

    # Pagination
    total = messages.count()
    start = (page - 1) * limit
    end = start + limit
    messages_page = messages[start:end]

    # Format messages
    results = []
    for msg in messages_page:
        results.append({
            'message_id': msg.messageID,
            'sender': {
                'id': msg.senderFK.accountID,
                'name': f"{msg.senderFK.firstName} {msg.senderFK.lastName}",
                'email': msg.senderFK.email
            },
            'text': msg.messageText,
            'attachment_url': getattr(msg, 'attachmentUrl', None),
            'is_read': msg.isRead,
            'created_at': msg.createdAt.isoformat()
        })

    # Reverse to show oldest first
    results.reverse()

    return Response({
        'success': True,
        'messages': results,
        'conversation': {
            'id': conversation.conversationID,
            'job_id': conversation.jobID.jobID if conversation.jobID else None,
            'job_title': conversation.jobID.title if conversation.jobID else None
        },
        'total': total,
        'page': page,
        'pages': (total + limit - 1) // limit
    })
```

---

## Frontend Implementation

### Task 5: WebSocket Hook ⏰ 2 hours

**File**: `apps/frontend_web/lib/hooks/useWebSocket.ts` (NEW)

```typescript
import { useEffect, useRef, useState, useCallback } from "react";

interface Message {
  message_id: number;
  sender_id: number;
  sender_name: string;
  text: string;
  attachment_url?: string;
  created_at: string;
  is_read: boolean;
}

interface UseWebSocketOptions {
  conversationId: number;
  onMessage?: (message: Message) => void;
  onTyping?: (userId: number, isTyping: boolean) => void;
  onReadReceipts?: (messageIds: number[], userId: number) => void;
}

export function useWebSocket({
  conversationId,
  onMessage,
  onTyping,
  onReadReceipts,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const wsUrl = `ws://localhost:8000/ws/chat/${conversationId}/`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "new_message":
          onMessage?.(data.message);
          break;
        case "typing_indicator":
          onTyping?.(data.user_id, data.is_typing);
          break;
        case "read_receipts":
          onReadReceipts?.(data.message_ids, data.user_id);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection error");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);

      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connect();
      }, 5000);
    };

    wsRef.current = ws;
  }, [conversationId, onMessage, onTyping, onReadReceipts]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message: string, attachmentUrl?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "send_message",
          message,
          attachment_url: attachmentUrl,
        })
      );
    } else {
      console.error("WebSocket not connected");
    }
  }, []);

  const sendTypingStart = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing_start",
        })
      );
    }
  }, []);

  const sendTypingStop = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing_stop",
        })
      );
    }
  }, []);

  const markAsRead = useCallback((messageIds: number[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "mark_read",
          message_ids: messageIds,
        })
      );
    }
  }, []);

  return {
    isConnected,
    error,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    markAsRead,
  };
}
```

---

### Task 6: Agency Chat Page ⏰ 4-5 hours

**File**: `apps/frontend_web/app/agency/messages/page.tsx` (NEW)

```typescript
"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Search, Clock } from 'lucide-react';
import Link from 'next/link';

interface Conversation {
  conversation_id: number;
  job: { id: number; title: string; status: string } | null;
  client: { id: number; name: string; email: string };
  worker: { id: number; name: string; email: string } | null;
  last_message: { text: string; sender_name: string; created_at: string } | null;
  unread_count: number;
  last_message_at: string | null;
}

export default function AgencyMessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['agency-conversations'],
    queryFn: async () => {
      const response = await fetch('/api/agency/conversations', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
  });

  const conversations: Conversation[] = data?.conversations || [];

  const filteredConversations = conversations.filter(conv =>
    conv.job?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.worker?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Communicate with clients and workers</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No conversations yet</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <Link
              key={conv.conversation_id}
              href={`/agency/messages/${conv.conversation_id}`}
              className="block"
            >
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Job Title */}
                    {conv.job && (
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {conv.job.title}
                      </h3>
                    )}

                    {/* Participants */}
                    <p className="text-sm text-gray-600 mb-2">
                      Client: {conv.client.name}
                      {conv.worker && ` • Worker: ${conv.worker.name}`}
                    </p>

                    {/* Last Message */}
                    {conv.last_message && (
                      <p className="text-sm text-gray-500 truncate">
                        <span className="font-medium">{conv.last_message.sender_name}:</span>{' '}
                        {conv.last_message.text}
                      </p>
                    )}
                  </div>

                  {/* Right Side */}
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    {/* Timestamp */}
                    {conv.last_message_at && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {formatTimestamp(conv.last_message_at)}
                      </div>
                    )}

                    {/* Unread Badge */}
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
```

---

### Task 7: Chat Detail Page ⏰ 4-5 hours

**File**: `apps/frontend_web/app/agency/messages/[id]/page.tsx` (NEW)

Create full chat interface with:

- Message list with scroll to bottom
- Real-time message updates via WebSocket
- Send message input with file attachment
- Typing indicators ("Worker is typing...")
- Read receipts
- Job context sidebar
- Message timestamps

_(Full implementation ~500 lines - similar to existing inbox page but with WebSocket)_

---

## Testing Checklist

### Backend Tests

- [ ] Migration runs successfully
- [ ] Conversation has agencyFK field
- [ ] WebSocket consumer connects
- [ ] WebSocket consumer verifies access
- [ ] Messages save to database
- [ ] Messages broadcast to all participants
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] Push notifications sent
- [ ] API endpoints return conversations
- [ ] API endpoints return messages
- [ ] Agency can only see their conversations

### Frontend Tests

- [ ] WebSocket hook connects
- [ ] WebSocket hook reconnects on disconnect
- [ ] Messages display in real-time
- [ ] Send message works
- [ ] Typing indicators display
- [ ] Unread count updates
- [ ] Conversation list loads
- [ ] Search filters conversations
- [ ] Timestamps format correctly
- [ ] File attachments work
- [ ] Read receipts display

---

## Dependencies

**Backend**:

```bash
pip install channels==4.0.0
pip install channels-redis==4.1.0
pip install daphne==4.0.0
```

**Frontend**: None (native WebSocket API)

---

## Success Criteria

✅ Module 2 complete when:

1. WebSocket server running
2. Agency conversations API working
3. Real-time messaging functional
4. Typing indicators working
5. Read receipts working
6. File attachments working
7. Push notifications sending
8. Agency chat UI complete
9. All tests passing
10. Zero errors

---

**Next Module**: Module 3 (Performance Analytics) or Module 4 (Job Lifecycle)
