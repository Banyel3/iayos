# WebSocket Implementation for Real-Time Chat

## Overview

This document describes the WebSocket implementation for real-time messaging in job-based conversations using Django Channels.

## Architecture

### Key Components

1. **Django Channels Configuration** (`settings.py`)
   - ASGI application configured
   - In-memory channel layer for development
   - Production should use Redis channel layer

2. **ASGI Application** (`iayos_project/asgi.py`)
   - Routes HTTP and WebSocket protocols
   - Uses Django authentication middleware
   - Connects WebSocket routes to consumers

3. **WebSocket Routing** (`profiles/routing.py`)
   - URL pattern: `ws/chat/{conversation_id}/`
   - Routes WebSocket connections to ChatConsumer

4. **Chat Consumer** (`profiles/consumers.py`)
   - Handles WebSocket connections for conversations
   - Authenticates users and verifies access
   - Manages real-time message exchange

## WebSocket URL Pattern

```
ws://localhost:8000/ws/chat/{conversation_id}/
```

For production:

```
wss://your-domain.com/ws/chat/{conversation_id}/
```

## How It Works

### 1. Connection Flow

```
Client connects → ChatConsumer.connect()
    ↓
Verify user authentication
    ↓
Verify conversation access (client or worker)
    ↓
Join conversation group (chat_{conversation_id})
    ↓
Accept connection
```

### 2. Message Flow

```
Client sends message → ChatConsumer.receive()
    ↓
Parse JSON data (message_text, message_type)
    ↓
Save to database (Message model)
    ↓
Broadcast to group → ChatConsumer.chat_message()
    ↓
All connected clients receive message
```

### 3. Disconnection Flow

```
Client disconnects → ChatConsumer.disconnect()
    ↓
Leave conversation group
    ↓
Clean up resources
```

## Security Features

### Authentication

- User must be authenticated via Django session/token
- AuthMiddlewareStack provides user in scope
- Unauthenticated connections are closed

### Authorization

- `verify_conversation_access()` checks if user is participant
- User must be either client or worker in conversation
- Unauthorized access results in connection closure

### Data Validation

- JSON parsing with error handling
- Empty messages are ignored
- Invalid data doesn't crash the consumer

## Database Integration

### Message Creation

- Messages created via `Message.objects.create()`
- Message.save() automatically:
  - Updates conversation.lastMessage\* fields
  - Increments unread count for recipient
  - Updates conversation timestamp

### Conversation Access

- Verifies conversation exists
- Checks user profile is client or worker
- Database queries wrapped in `@database_sync_to_async`

## Message Format

### Client → Server (Send Message)

```json
{
  "message": "Hello, when can we start?",
  "type": "TEXT"
}
```

### Server → Client (Receive Message)

```json
{
  "type": "message",
  "message": {
    "id": 123,
    "conversation_id": "45",
    "sender_id": "789",
    "sender_name": "John Doe",
    "message_text": "Hello, when can we start?",
    "message_type": "TEXT",
    "timestamp": "2024-01-15T10:30:00Z",
    "is_read": false
  }
}
```

## Channel Layers

### Development (Current)

```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    },
}
```

**Note**: In-memory layer doesn't work across multiple server instances.

### Production (Recommended)

```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}
```

**Benefits**:

- Works across multiple servers
- Persists during deployments
- Better performance at scale

## Frontend Integration

### WebSocket Connection (React Example)

```typescript
// Connect to WebSocket
const ws = new WebSocket(`ws://localhost:8000/ws/chat/${conversationId}/`);

// Connection opened
ws.onopen = () => {
  console.log("Connected to chat");
};

// Receive messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "message") {
    // Add message to UI
    addMessageToUI(data.message);
  }
};

// Send message
const sendMessage = (text: string) => {
  ws.send(
    JSON.stringify({
      message: text,
      type: "TEXT",
    })
  );
};

// Handle errors
ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

// Handle close
ws.onclose = () => {
  console.log("Disconnected from chat");
  // Optionally reconnect
};
```

### Authentication

WebSocket connections use the same authentication as HTTP requests:

- Session cookies (Django sessions)
- Or authentication tokens in headers

Make sure cookies are sent with WebSocket requests:

```typescript
// Ensure credentials are included
const ws = new WebSocket(url);
// Cookies are automatically included for same-origin requests
```

## Testing WebSocket Connection

### Using wscat (CLI tool)

```bash
# Install wscat
npm install -g wscat

# Connect to chat
wscat -c ws://localhost:8000/ws/chat/1/

# Send message
{"message": "Test message", "type": "TEXT"}
```

### Using Browser Console

```javascript
// Open WebSocket
const ws = new WebSocket("ws://localhost:8000/ws/chat/1/");

// Log all events
ws.onopen = () => console.log("Connected");
ws.onmessage = (e) => console.log("Received:", e.data);
ws.onerror = (e) => console.error("Error:", e);
ws.onclose = () => console.log("Closed");

// Send message
ws.send(JSON.stringify({ message: "Hello", type: "TEXT" }));
```

## Running the Server

### Development (ASGI Server)

```bash
# Use Daphne (ASGI server) instead of runserver
daphne -b 0.0.0.0 -p 8000 iayos_project.asgi:application

# Or with Uvicorn
uvicorn iayos_project.asgi:application --host 0.0.0.0 --port 8000 --reload
```

**Note**: `python manage.py runserver` may still work but doesn't support WebSockets in production.

## Integration with Job Workflow

### When Job Application is Accepted

```python
# In jobs/api.py accept_application endpoint
from profiles.models import Conversation

# After accepting application and setting job to IN_PROGRESS
conversation = Conversation.create_for_job(
    job_posting=job,
    client_profile=job.client.profile,
    worker_profile=worker_profile
)

# Create system message
Message.create_system_message(
    conversation=conversation,
    message_text=f"Job '{job.title}' has been accepted. Chat is now active."
)
```

This automatically:

1. Creates conversation linked to job
2. Sets client and worker participants
3. Sends initial system message
4. Chat becomes available in inbox

## Message Types

Currently supported message types:

- `TEXT`: Regular text messages
- `SYSTEM`: Automated system messages
- `LOCATION`: GPS location sharing
- `IMAGE`: Image attachments
- `FILE`: File attachments

## Unread Message Tracking

### How It Works

1. When message is created, recipient's unread count increases
2. When conversation is opened (GET /chat/conversations/{id}), messages marked as read
3. WebSocket messages start as unread
4. Frontend should call mark-as-read API when user views conversation

### REST API Fallback

- WebSocket provides real-time updates
- REST API provides initial data and fallback
- Both use same database models

## Error Handling

### Consumer Error Handling

```python
try:
    # Process message
except json.JSONDecodeError:
    # Invalid JSON, ignore
    pass
except Exception as e:
    # Log error, don't crash
    print(f"Error: {str(e)}")
```

### Frontend Error Handling

```typescript
ws.onerror = (error) => {
  console.error("WebSocket error:", error);
  // Show error message to user
  // Attempt reconnection with exponential backoff
};

ws.onclose = (event) => {
  if (!event.wasClean) {
    // Unexpected disconnection, try to reconnect
    setTimeout(() => reconnect(), 3000);
  }
};
```

## Performance Considerations

### Channel Layer Performance

- In-memory: Fast, but single-server only
- Redis: Slightly slower, but scalable

### Database Queries

- All DB operations wrapped in `@database_sync_to_async`
- Message save() triggers conversation update
- Consider caching conversation access checks

### Scaling

- Use Redis channel layer for multiple servers
- Load balancer should support WebSocket (sticky sessions)
- Database connection pooling for async operations

## Next Steps

1. **Update Job Accept Endpoint**
   - Create conversation when application accepted
   - Set job status to IN_PROGRESS
   - Send system message

2. **Frontend WebSocket Integration**
   - Connect to WebSocket in inbox/chat component
   - Send and receive real-time messages
   - Handle connection states (connecting, connected, disconnected)
   - Implement reconnection logic

3. **Production Setup**
   - Switch to Redis channel layer
   - Configure ASGI server (Daphne/Uvicorn)
   - Set up SSL for WSS (secure WebSocket)
   - Add monitoring and logging

4. **Enhanced Features**
   - Typing indicators
   - Message delivery status (sent, delivered, read)
   - File upload support
   - Message reactions/emojis
   - Push notifications for offline users

## File Locations

```
apps/backend/src/
├── iayos_project/
│   ├── settings.py         # Channels configuration
│   └── asgi.py            # ASGI application
└── profiles/
    ├── models.py          # Conversation, Message models
    ├── consumers.py       # ChatConsumer
    ├── routing.py         # WebSocket URL patterns
    └── api.py             # REST API endpoints
```

## Dependencies

```txt
channels          # Django Channels framework
channels-redis    # Redis channel layer (production)
daphne           # ASGI server
```

## Troubleshooting

### WebSocket Won't Connect

1. Check ASGI_APPLICATION in settings.py
2. Verify daphne is first in INSTALLED_APPS
3. Ensure server is running with ASGI server (daphne/uvicorn)
4. Check browser console for error messages

### Messages Not Broadcasting

1. Verify channel layer configuration
2. Check room group name matches in send/receive
3. Ensure multiple clients are connected
4. Check server logs for errors

### Authentication Failing

1. Verify user is authenticated
2. Check cookies are sent with WebSocket request
3. Test with session authentication first
4. Verify AuthMiddlewareStack in asgi.py

### Database Sync Errors

1. Ensure all DB queries use @database_sync_to_async
2. Check database connection settings
3. Verify models exist and migrations applied
4. Test queries in Django shell first

## Resources

- [Django Channels Documentation](https://channels.readthedocs.io/)
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Redis Channel Layer](https://github.com/django/channels_redis)
