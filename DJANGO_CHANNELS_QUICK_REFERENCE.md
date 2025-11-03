# Django Channels Chat - Quick Reference

## 🚀 What Was Done

✅ **Installed Packages:**

- `channels` - Django Channels framework
- `channels-redis` - Redis support (for production)
- `daphne` - ASGI server

✅ **Configured Django:**

- Added `daphne` and `channels` to `INSTALLED_APPS`
- Set `ASGI_APPLICATION` to use Channels
- Configured `CHANNEL_LAYERS` (in-memory for development)

✅ **Created Files:**

- `profiles/consumers.py` - WebSocket message handler
- `profiles/routing.py` - WebSocket URL routing
- Updated `asgi.py` - ASGI application with WebSocket support

---

## 🔌 WebSocket URL

```
ws://localhost:8000/ws/chat/{conversation_id}/
```

Example: `ws://localhost:8000/ws/chat/123/`

---

## 🖥️ Running the Server

### Development

```bash
cd apps/backend/src
python manage.py runserver
# Server supports WebSockets automatically
```

### Production (Recommended)

```bash
cd apps/backend/src
daphne -b 0.0.0.0 -p 8000 iayos_project.asgi:application
```

---

## 💬 Message Format

### Send Message (Client → Server)

```json
{
  "message": "Hello, when can we start?",
  "type": "TEXT"
}
```

### Receive Message (Server → Client)

```json
{
  "type": "message",
  "message": {
    "id": 456,
    "conversation_id": "123",
    "sender_id": "789",
    "sender_name": "John Doe",
    "message_text": "Hello, when can we start?",
    "message_type": "TEXT",
    "timestamp": "2024-11-03T14:30:00Z",
    "is_read": false
  }
}
```

---

## 🧪 Quick Test

### Browser Console

```javascript
// Connect
const ws = new WebSocket("ws://localhost:8000/ws/chat/1/");

// Listen
ws.onopen = () => console.log("✅ Connected");
ws.onmessage = (e) => console.log("📨 Received:", JSON.parse(e.data));
ws.onerror = (e) => console.error("❌ Error:", e);
ws.onclose = () => console.log("🔌 Disconnected");

// Send
ws.send(JSON.stringify({ message: "Test", type: "TEXT" }));
```

### CLI (wscat)

```bash
npm install -g wscat
wscat -c ws://localhost:8000/ws/chat/1/
> {"message": "Hello", "type": "TEXT"}
```

---

## 🐛 Common Issues

### Issue: "WebSocket connection failed"

**Solution:** Make sure server is running:

```bash
python manage.py runserver
```

### Issue: "Connection closes immediately"

**Possible reasons:**

1. User not logged in (needs authentication)
2. User not authorized (not client or worker in conversation)
3. Conversation doesn't exist

### Issue: "Messages not appearing for other users"

**Solution:** Check both users are connected to same conversation ID

### Issue: "SynchronousOnlyOperation error"

**Solution:** Already handled - all DB operations use `@database_sync_to_async`

---

## 📱 Frontend Integration (React)

### Basic Setup

```typescript
// hooks/useChat.ts
import { useEffect, useState, useRef } from "react";

export function useChat(conversationId: number) {
  const [messages, setMessages] = useState([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(
      `ws://localhost:8000/ws/chat/${conversationId}/`
    );

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    return () => ws.current?.close();
  }, [conversationId]);

  const sendMessage = (text: string) => {
    ws.current?.send(
      JSON.stringify({
        message: text,
        type: "TEXT",
      })
    );
  };

  return { messages, sendMessage };
}
```

### Usage

```typescript
// components/ChatWindow.tsx
import { useChat } from '@/hooks/useChat'

export function ChatWindow({ conversationId }) {
  const { messages, sendMessage } = useChat(conversationId)
  const [input, setInput] = useState('')

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.sender_name}:</strong> {msg.message_text}
        </div>
      ))}

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(input)
            setInput('')
          }
        }}
      />
    </div>
  )
}
```

---

## 🔐 Security

✅ **Authentication:** User must be logged in (Django session)
✅ **Authorization:** User must be participant in conversation
✅ **Validation:** Message content validated before saving
✅ **Database:** All operations through Django ORM

---

## 📊 How It Works

```
1. User opens chat
   ↓
2. Frontend connects via WebSocket
   ↓
3. ChatConsumer verifies user & conversation access
   ↓
4. User joins "room" (chat_{conversation_id})
   ↓
5. User sends message
   ↓
6. Message saved to PostgreSQL (Neon)
   ↓
7. Broadcast to all users in room
   ↓
8. All connected users receive message instantly ✨
```

---

## 📈 Production Checklist

### Switch to Redis Channel Layer

```python
# settings.py
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [("redis-server", 6379)]},
    },
}
```

### Use Daphne or Uvicorn

```bash
# Daphne
daphne iayos_project.asgi:application

# Or Uvicorn
uvicorn iayos_project.asgi:application
```

### Configure Nginx

```nginx
location /ws/ {
    proxy_pass http://django_asgi;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Use WSS (Secure WebSocket)

```javascript
// Frontend
const ws = new WebSocket("wss://your-domain.com/ws/chat/123/");
```

---

## 📚 Full Documentation

See `DJANGO_CHANNELS_COMPREHENSIVE_GUIDE.md` for:

- Complete architecture explanation
- Detailed troubleshooting
- Advanced features (typing indicators, presence, etc.)
- Deployment guides
- Performance optimization

---

## ✅ Summary

Your job-based chat system is now **fully functional** with:

✅ Real-time messaging via WebSockets
✅ Authenticated connections
✅ One conversation per job
✅ Messages saved to PostgreSQL (Neon)
✅ Automatic broadcasting to all participants
✅ Ready for frontend integration

**Next:** Implement WebSocket connection in your React frontend!
