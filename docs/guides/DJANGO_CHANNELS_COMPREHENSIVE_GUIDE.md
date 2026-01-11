# Django Channels Real-Time Chat - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [How It Works](#how-it-works)
5. [Frontend Integration](#frontend-integration)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Django Channels?

Django Channels extends Django to handle WebSockets, HTTP2, and other protocols beyond standard HTTP. It allows real-time, bidirectional communication between client and server.

### Why We Need It

**Problem**: Traditional HTTP is request-response only. For real-time chat:

- ❌ Polling (checking for new messages every few seconds) is inefficient
- ❌ Long-polling is complex and resource-intensive
- ❌ Server-Sent Events (SSE) is one-way only

**Solution**: WebSockets provide:

- ✅ Full-duplex (two-way) communication
- ✅ Real-time message delivery
- ✅ Efficient (persistent connection)
- ✅ Low latency

### Our Use Case

**Job-Based Chat System**:

- Each conversation is tied to a specific job posting
- Created automatically when job application is accepted
- One conversation per job (enforced by database constraint)
- Real-time messaging between client and worker

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│                                                                 │
│  ┌──────────────┐                    ┌──────────────┐          │
│  │ Send Message │                    │Receive Message│         │
│  └──────┬───────┘                    └──────▲───────┘          │
│         │                                    │                  │
└─────────┼────────────────────────────────────┼──────────────────┘
          │                                    │
          │ WebSocket                          │ WebSocket
          │ (ws://localhost:8000)              │
          ▼                                    │
┌─────────────────────────────────────────────┼──────────────────┐
│                  Django Channels             │                  │
│                                              │                  │
│  ┌──────────────────────────────────────────┴────────────┐     │
│  │           ChatConsumer (WebSocket Handler)            │     │
│  │                                                        │     │
│  │  • connect()    - Verify user & join room             │     │
│  │  • receive()    - Get message, save to DB             │     │
│  │  • disconnect() - Leave room                          │     │
│  └──────────────┬─────────────────────┬──────────────────┘     │
│                 │                     │                         │
│                 ▼                     ▼                         │
│         ┌──────────────┐      ┌──────────────┐                 │
│         │ Channel Layer│      │ PostgreSQL   │                 │
│         │  (In-Memory) │      │   (Neon DB)  │                 │
│         │              │      │              │                 │
│         │ Broadcasts   │      │ Stores       │                 │
│         │ to all users │      │ messages     │                 │
│         │ in room      │      │ permanently  │                 │
│         └──────────────┘      └──────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Components Explained

#### 1. **ASGI Application** (`iayos_project/asgi.py`)

- Replaces traditional WSGI
- Routes HTTP to Django, WebSocket to Channels
- Entry point for Daphne server

```python
application = ProtocolTypeRouter({
    "http": get_asgi_application(),      # Normal Django views
    "websocket": AuthMiddlewareStack(    # WebSocket connections
        URLRouter(websocket_urlpatterns)
    ),
})
```

#### 2. **WebSocket Routing** (`profiles/routing.py`)

- Similar to Django URLs but for WebSocket connections
- Pattern: `ws://localhost:8000/ws/chat/{conversation_id}/`

```python
websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>\d+)/$', ChatConsumer.as_asgi()),
]
```

#### 3. **ChatConsumer** (`profiles/consumers.py`)

- Handles WebSocket lifecycle (connect, receive, disconnect)
- Async-based for better performance
- Integrates with Django ORM via `@database_sync_to_async`

#### 4. **Channel Layer**

- Message bus for broadcasting to multiple clients
- Development: In-memory (single server)
- Production: Redis (multi-server, persistent)

---

## Setup & Configuration

### 1. Packages Installed

```txt
channels          # Django Channels framework
channels-redis    # Redis channel layer (for production)
daphne           # ASGI server (like Gunicorn but for async)
```

### 2. Django Settings (`settings.py`)

```python
INSTALLED_APPS = [
    'daphne',  # MUST be first!
    'django.contrib.admin',
    # ... other apps
    'channels',
    # ... your apps
]

# Point to ASGI application
ASGI_APPLICATION = "iayos_project.asgi.application"

# Channel layer configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"  # Development
        # Production: Use Redis
        # "BACKEND": "channels_redis.core.RedisChannelLayer",
        # "CONFIG": {"hosts": [("127.0.0.1", 6379)]},
    },
}
```

### 3. File Structure

```
apps/backend/src/
├── iayos_project/
│   ├── settings.py          # Channels configuration
│   ├── asgi.py              # ASGI application (WebSocket routing)
│   └── urls.py              # HTTP URLs (unchanged)
├── profiles/
│   ├── models.py            # Conversation, Message models
│   ├── consumers.py         # ChatConsumer (WebSocket handler)
│   ├── routing.py           # WebSocket URL patterns
│   ├── api.py               # REST API endpoints (unchanged)
│   └── schemas.py           # Pydantic schemas (unchanged)
```

---

## How It Works

### Connection Flow

```
1. User opens chat window
   ↓
2. Frontend creates WebSocket connection
   ws = new WebSocket('ws://localhost:8000/ws/chat/123/')
   ↓
3. ChatConsumer.connect() called
   - Extract conversation_id from URL (123)
   - Get user from scope (Django auth middleware)
   - Verify user is authenticated
   - Verify user is participant (client or worker)
   - Join room group (chat_123)
   - Accept connection
   ↓
4. Connection established ✅
```

### Message Sending Flow

```
1. User types message and clicks send
   ↓
2. Frontend sends via WebSocket
   ws.send(JSON.stringify({message: "Hello!", type: "TEXT"}))
   ↓
3. ChatConsumer.receive() called
   - Parse JSON data
   - Extract message_text and message_type
   - Call save_message() to store in database
   ↓
4. Database operations (via @database_sync_to_async)
   - Get user's Profile
   - Get Conversation
   - Create Message object
   - Message.save() automatically updates:
     * conversation.lastMessageText
     * conversation.lastMessageTime
     * Increments unreadCountClient or unreadCountWorker
   ↓
5. Broadcast to room group
   channel_layer.group_send('chat_123', {
       'type': 'chat_message',
       'message': {...}
   })
   ↓
6. ChatConsumer.chat_message() called for ALL connected clients
   - Sends message to each client's WebSocket
   ↓
7. All users in chat see message instantly ✨
```

### Disconnection Flow

```
1. User closes chat window or loses connection
   ↓
2. ChatConsumer.disconnect() called
   - Leave room group (chat_123)
   - Clean up resources
   ↓
3. Connection closed
```

---

## Frontend Integration

### 1. WebSocket Connection (React/Next.js)

```typescript
// hooks/useChat.ts
import { useEffect, useState, useRef } from "react";

interface Message {
  id: number;
  sender_id: string;
  sender_name: string;
  message_text: string;
  timestamp: string;
  is_read: boolean;
}

export function useChat(conversationId: number) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const websocket = new WebSocket(
      `ws://localhost:8000/ws/chat/${conversationId}/`
    );

    // Connection opened
    websocket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    // Listen for messages
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "message") {
        setMessages((prev) => [...prev, data.message]);

        // Play notification sound
        playNotificationSound();
      }
    };

    // Handle errors
    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Connection closed
    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);

      // Optional: Auto-reconnect
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        // Recreate connection
      }, 3000);
    };

    ws.current = websocket;

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, [conversationId]);

  // Send message function
  const sendMessage = (text: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          message: text,
          type: "TEXT",
        })
      );
    }
  };

  return { messages, isConnected, sendMessage };
}
```

### 2. Chat Component

```typescript
// components/ChatWindow.tsx
import { useChat } from '@/hooks/useChat'
import { useState } from 'react'

export function ChatWindow({ conversationId }: { conversationId: number }) {
  const { messages, isConnected, sendMessage } = useChat(conversationId)
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="chat-window">
      {/* Connection status */}
      <div className="status">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Messages list */}
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <strong>{msg.sender_name}:</strong> {msg.message_text}
            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  )
}
```

### 3. Authentication

WebSocket connections use Django's session authentication automatically:

```typescript
// The WebSocket connection will include cookies
// No additional auth needed if user is logged in
const ws = new WebSocket("ws://localhost:8000/ws/chat/123/");

// Django's AuthMiddlewareStack extracts user from session cookie
// ChatConsumer checks if user.is_authenticated
```

### 4. Message Format

**Client → Server (Send):**

```json
{
  "message": "Hello! Can we start tomorrow?",
  "type": "TEXT"
}
```

**Server → Client (Receive):**

```json
{
  "type": "message",
  "message": {
    "id": 456,
    "conversation_id": "123",
    "sender_id": "789",
    "sender_name": "John Doe",
    "message_text": "Hello! Can we start tomorrow?",
    "message_type": "TEXT",
    "timestamp": "2024-11-03T14:30:00Z",
    "is_read": false
  }
}
```

---

## Testing

### 1. Backend Testing

#### Check Server is Running

```bash
cd apps/backend/src
python manage.py runserver

# Should see:
# ASGI/Daphne support enabled
# WebSocket support enabled
```

#### Test WebSocket Endpoint

```bash
# Install wscat (WebSocket testing tool)
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8000/ws/chat/1/

# If not authenticated, connection will close
# If authenticated and authorized, connection stays open

# Send message
> {"message": "Test message", "type": "TEXT"}

# You should receive back:
< {"type": "message", "message": {...}}
```

### 2. Frontend Testing

#### Browser Console Test

```javascript
// Open browser console
const ws = new WebSocket("ws://localhost:8000/ws/chat/1/");

ws.onopen = () => console.log("Connected!");
ws.onmessage = (e) => console.log("Received:", JSON.parse(e.data));
ws.onerror = (e) => console.error("Error:", e);

// Send message
ws.send(JSON.stringify({ message: "Hello", type: "TEXT" }));
```

### 3. Multi-Client Testing

1. Open two browser windows (or incognito + normal)
2. Log in as different users (client and worker)
3. Navigate to same conversation
4. Send message from one window
5. Should appear instantly in other window

---

## Deployment

### Development

```bash
# Start Django development server (supports WebSockets)
cd apps/backend/src
python manage.py runserver

# WebSocket URL: ws://localhost:8000/ws/chat/{id}/
```

### Production

#### 1. Use Daphne (ASGI Server)

```bash
# Install Daphne (already in requirements.txt)
pip install daphne

# Run Daphne
daphne -b 0.0.0.0 -p 8000 iayos_project.asgi:application
```

#### 2. Use Uvicorn (Alternative)

```bash
# Install Uvicorn
pip install uvicorn[standard]

# Run Uvicorn
uvicorn iayos_project.asgi:application --host 0.0.0.0 --port 8000
```

#### 3. Use Redis Channel Layer (Multi-Server)

Update `settings.py`:

```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis-server", 6379)],
            # Or use environment variable
            # "hosts": [os.getenv("REDIS_URL", "redis://localhost:6379")],
        },
    },
}
```

Install Redis:

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Or use Docker
docker run -p 6379:6379 redis:alpine
```

#### 4. Nginx Configuration

```nginx
# WebSocket support
upstream django_asgi {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # WebSocket endpoint
    location /ws/ {
        proxy_pass http://django_asgi;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Regular HTTP endpoints
    location / {
        proxy_pass http://django_asgi;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 5. Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:pass@neon-host/db
REDIS_URL=redis://localhost:6379
DEBUG=False
ALLOWED_HOSTS=your-domain.com
```

#### 6. Systemd Service (Linux)

```ini
# /etc/systemd/system/iayos-chat.service
[Unit]
Description=iayos Chat WebSocket Server
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/apps/backend/src
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/daphne -b 0.0.0.0 -p 8000 iayos_project.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable iayos-chat
sudo systemctl start iayos-chat
sudo systemctl status iayos-chat
```

---

## Troubleshooting

### Issue: WebSocket Connection Fails

**Symptoms:**

- Browser console: `WebSocket connection failed`
- Connection immediately closes

**Solutions:**

1. **Check server is running with ASGI:**

   ```bash
   # Don't use: python manage.py runserver
   # Use: daphne or uvicorn
   daphne iayos_project.asgi:application
   ```

2. **Verify ASGI_APPLICATION setting:**

   ```python
   # settings.py
   ASGI_APPLICATION = "iayos_project.asgi.application"  # Correct path
   ```

3. **Check daphne is first in INSTALLED_APPS:**

   ```python
   INSTALLED_APPS = [
       'daphne',  # Must be FIRST!
       'django.contrib.admin',
       # ...
   ]
   ```

4. **Check WebSocket URL:**

   ```javascript
   // Correct
   ws://localhost:8000/ws/chat/1/

   // Wrong
   wss://localhost:8000/ws/chat/1/  // Use ws:// in development
   http://localhost:8000/ws/chat/1/  // Wrong protocol
   ```

### Issue: Connection Closes Immediately

**Symptoms:**

- Connection opens then closes right away

**Solutions:**

1. **Check authentication:**
   - User must be logged in
   - Session cookie must be included in WebSocket request

2. **Check authorization:**
   - User must be participant in conversation (client or worker)
   - Verify `verify_conversation_access()` returns True

3. **Check conversation exists:**
   - Conversation with given ID must exist in database

### Issue: Messages Not Broadcasting

**Symptoms:**

- Message saves to database but doesn't appear for other users

**Solutions:**

1. **Check channel layer configuration:**

   ```python
   # settings.py
   CHANNEL_LAYERS = {
       "default": {
           "BACKEND": "channels.layers.InMemoryChannelLayer"
       }
   }
   ```

2. **Verify room group names match:**

   ```python
   # Both must be identical
   await self.channel_layer.group_add('chat_123', self.channel_name)
   await self.channel_layer.group_send('chat_123', {...})
   ```

3. **Check chat_message method exists:**
   ```python
   async def chat_message(self, event):
       # This method name must match 'type' in group_send
       ...
   ```

### Issue: Database Sync Errors

**Symptoms:**

- `SynchronousOnlyOperation: You cannot call this from an async context`

**Solutions:**

1. **Use @database_sync_to_async decorator:**

   ```python
   @database_sync_to_async
   def save_message(self, text, type):
       # All database operations here
       message = Message.objects.create(...)
       return message
   ```

2. **Don't access related objects directly:**

   ```python
   # Wrong
   async def receive(self, text_data):
       profile = Profile.objects.get(...)  # Error!

   # Correct
   @database_sync_to_async
   def get_profile(self):
       return Profile.objects.get(...)

   async def receive(self, text_data):
       profile = await self.get_profile()  # OK!
   ```

### Issue: Production - Multiple Servers

**Symptoms:**

- Messages only appear for users on same server
- Doesn't work with load balancer

**Solutions:**

1. **Use Redis channel layer:**

   ```python
   CHANNEL_LAYERS = {
       "default": {
           "BACKEND": "channels_redis.core.RedisChannelLayer",
           "CONFIG": {"hosts": [("redis-server", 6379)]},
       }
   }
   ```

2. **Configure sticky sessions on load balancer:**
   - Ensures same user always connects to same server
   - Or use Redis for cross-server communication

### Issue: Memory Leaks

**Symptoms:**

- Server memory grows over time
- Eventually crashes

**Solutions:**

1. **Always disconnect properly:**

   ```python
   async def disconnect(self, close_code):
       if hasattr(self, 'room_group_name'):
           await self.channel_layer.group_discard(
               self.room_group_name,
               self.channel_name
           )
   ```

2. **Use Redis channel layer (clears inactive connections)**

3. **Monitor with tools:**

   ```bash
   # Check memory usage
   htop

   # Check open WebSocket connections
   netstat -an | grep :8000 | grep ESTABLISHED
   ```

---

## Advanced Features (Future Enhancements)

### 1. Typing Indicators

```python
# consumers.py
async def receive(self, text_data):
    data = json.loads(text_data)

    if data.get('typing'):
        # Broadcast typing status
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_typing',
                'user_id': str(self.user.id),
                'is_typing': data['typing']
            }
        )
```

### 2. Online Presence

```python
# Track when users connect/disconnect
async def connect(self):
    # ... existing code

    # Notify others user is online
    await self.channel_layer.group_send(
        self.room_group_name,
        {
            'type': 'user_status',
            'user_id': str(self.user.id),
            'status': 'online'
        }
    )
```

### 3. Message Read Receipts

```python
# Send read receipt when message is viewed
async def mark_as_read(self, message_id):
    await self.update_message_read_status(message_id)

    await self.channel_layer.group_send(
        self.room_group_name,
        {
            'type': 'message_read',
            'message_id': message_id,
            'reader_id': str(self.user.id)
        }
    )
```

### 4. File Uploads

```python
# Handle file attachments via regular upload endpoint
# Then send file URL via WebSocket
{
    "message": "Image.jpg",
    "type": "IMAGE",
    "file_url": "https://storage.supabase.co/..."
}
```

---

## Summary

✅ **Django Channels is now configured and working**

✅ **Real-time chat for job-based conversations**

✅ **Authenticated and authorized WebSocket connections**

✅ **Messages saved to PostgreSQL (Neon) and broadcast instantly**

✅ **Ready for frontend integration**

### Key Files Created/Modified:

1. `settings.py` - Channels configuration
2. `asgi.py` - ASGI application with WebSocket routing
3. `profiles/consumers.py` - ChatConsumer (WebSocket handler)
4. `profiles/routing.py` - WebSocket URL patterns
5. `requirements.txt` - Added channels, channels-redis, daphne

### Next Steps:

1. Integrate WebSocket connection in frontend React components
2. Test with multiple users
3. Add typing indicators (optional)
4. Add file upload support (optional)
5. Deploy to production with Redis channel layer

---

## Resources

- [Django Channels Documentation](https://channels.readthedocs.io/)
- [Daphne ASGI Server](https://github.com/django/daphne)
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Channels Examples](https://github.com/django/channels-examples)
