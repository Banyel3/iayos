# Real-Time Chat Testing Guide

## 🎯 Overview

The chat system is now fully wired with Django Channels WebSocket on the backend and React hooks on the frontend.

## 📋 Prerequisites

### Backend Running

```bash
cd apps/backend/src
python manage.py runserver
# Should show: "Starting ASGI/Daphne version X.X.X development server at http://127.0.0.1:8000/"
```

### Frontend Running

```bash
# From project root
turbo run dev
# Frontend should be at http://localhost:3000
```

## 🧪 Testing Steps

### 1. Create Test Conversations

You need at least one conversation (created when a job application is accepted). If you don't have any:

**Option A: Via Admin Panel**

- Go to Django admin: http://localhost:8000/admin
- Navigate to Profiles → Conversations
- Create a conversation with:
  - Client: [Select a client profile]
  - Worker: [Select a worker profile]
  - Related Job Posting: [Select a job]
  - Status: ACTIVE

**Option B: Via Job Application Flow**

- Post a job as a CLIENT
- Apply to the job as a WORKER
- Accept the application as CLIENT
- This automatically creates a conversation

### 2. Login to Frontend

**Browser 1 (Client):**

```
1. Go to http://localhost:3000/auth/login
2. Login as the CLIENT user from the conversation
3. Navigate to /dashboard/inbox
```

**Browser 2 (Worker):**

```
1. Open incognito/private window
2. Go to http://localhost:3000/auth/login
3. Login as the WORKER user from the conversation
4. Navigate to /dashboard/inbox
```

### 3. Test Real-Time Messaging

1. **In Browser 1 (Client):**
   - You should see the conversation listed
   - Click on the conversation
   - Check the connection status indicator:
     - 🟢 "Connected" = WebSocket connected
     - 🟡 "Connecting..." = WebSocket attempting to connect
     - ⚫ "Offline" = WebSocket not connected

2. **In Browser 2 (Worker):**
   - Open the same conversation
   - Wait for "Connected" status

3. **Send Messages:**
   - Type a message in Browser 1
   - Press Enter or click Send button
   - Message should appear in Browser 2 **instantly** without refresh
   - Type a reply in Browser 2
   - Should appear in Browser 1 **instantly**

### 4. Check Console Logs

**Frontend Console (Browser DevTools):**

```
✅ Expected logs:
🔌 Connecting to WebSocket: ws://localhost:8000/ws/chat/{id}/
✅ WebSocket connected
📨 Received message: {...}
📤 Sending via WebSocket: Hello!
✅ Loaded conversations: X
✅ Loaded messages: Y
```

**Backend Console (Django terminal):**

```
✅ Expected logs:
🔌 WebSocket CONNECT: /ws/chat/{id}/ (User: {user})
✅ User authenticated: {email}
✅ Conversation access verified
✅ User joined chat room
📨 Message received: {...}
💾 Message saved to database
📤 Broadcasting message to room
```

## 🔍 Troubleshooting

### WebSocket Connection Fails (Error 1006)

**Symptoms:** Connection status shows "Offline", console shows "WebSocket closed: Code 1006"

**Causes & Fixes:**

1. **Not Logged In**
   - WebSocket requires Django session authentication
   - Solution: Make sure you're logged in to the frontend
   - Check: You should see user data in AuthContext

2. **CORS/Cookies Issue**
   - WebSocket needs session cookies
   - Solution: Make sure frontend and backend are on same domain or CORS configured
   - Check: Look for cookies in DevTools → Application → Cookies

3. **User Not in Conversation**
   - ChatConsumer verifies user is client OR worker
   - Solution: Make sure logged-in user matches conversation participant
   - Check backend logs for: "❌ User not authorized for this conversation"

4. **Daphne Not Running**
   - WebSocket requires ASGI server (Daphne)
   - Solution: Make sure you ran `python manage.py runserver` (should auto-use Daphne)
   - Check: Terminal should say "Starting ASGI/Daphne" not "Starting development server"

### Messages Not Appearing

**If messages send but don't appear in other browser:**

1. **Different Conversations**
   - Make sure both browsers opened the SAME conversation
   - Check: conversation ID in URL or selectedChat.id

2. **WebSocket Not Broadcasting**
   - Check backend logs for "📤 Broadcasting message to room"
   - Solution: Restart backend server

3. **Frontend Not Handling WebSocket Messages**
   - Check console for "📨 Received message"
   - Solution: Check `handleWebSocketMessage` function

### API Errors

**If conversations or messages don't load:**

1. **Check Network Tab**
   - DevTools → Network → Look for 401/403/500 errors
   - Should see GET requests to `/api/profiles/chat/conversations`

2. **CORS Issues**
   - Check if requests are blocked
   - Solution: Verify CORS settings in Django settings.py

3. **No Conversations Exist**
   - If you're a new user, you might not have any conversations yet
   - Solution: Create a conversation via job application flow

## 📊 Expected Behavior

### Conversation List

- ✅ Shows all conversations where user is client or worker
- ✅ Displays other participant's name and avatar
- ✅ Shows job title for each conversation
- ✅ Shows last message preview
- ✅ Shows unread count badge (if > 0)
- ✅ Shows loading spinner while fetching

### Chat View

- ✅ Shows dynamic job info banner (title, budget, status, location)
- ✅ "Your Request" for clients, "Your Job" for workers
- ✅ "View Job Details" button links to job page
- ✅ Connection status indicator (Connected/Connecting/Offline)
- ✅ Messages load when conversation selected
- ✅ Messages show sender avatar (for other person)
- ✅ Messages show timestamp
- ✅ Auto-scrolls to bottom when new message arrives
- ✅ Send button disabled when not connected

### Real-Time Updates

- ✅ New messages appear instantly (< 1 second)
- ✅ No page refresh needed
- ✅ Works bidirectionally (both users see updates)
- ✅ Optimistic UI (your own messages appear immediately)
- ✅ Auto-reconnects if connection drops

## 🐛 Debug Commands

### Check WebSocket in Browser Console

```javascript
// Test WebSocket connection manually
const ws = new WebSocket("ws://localhost:8000/ws/chat/1/");
ws.onopen = () => console.log("Connected!");
ws.onmessage = (e) => console.log("Message:", JSON.parse(e.data));
ws.onerror = (e) => console.log("Error:", e);
ws.onclose = (e) => console.log("Closed:", e.code, e.reason);

// Send test message
ws.send(JSON.stringify({ message: "Hello!", type: "chat_message" }));
```

### Check Backend

```bash
# Check if Daphne is in requirements
pip list | grep -i daphne

# Check Django logs
python manage.py runserver
# Look for WebSocket connection logs
```

### Check Frontend Environment

```bash
# Make sure .env.local has correct URLs
cat apps/frontend_web/.env.local | grep API

# Should show:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
# NEXT_PUBLIC_WS_BASE_URL=localhost:8000
```

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Conversations load in the inbox
2. ✅ Clicking a conversation shows the job banner
3. ✅ Connection status shows "🟢 Connected"
4. ✅ Typing and sending a message works
5. ✅ Message appears in the other browser **immediately**
6. ✅ Both users can send messages back and forth
7. ✅ Messages persist (refresh and they're still there)
8. ✅ No errors in browser or backend console

## 📝 Files Created/Modified

### Frontend

- ✅ `lib/hooks/useWebSocket.ts` - WebSocket hook with auto-reconnect
- ✅ `lib/api/chat.ts` - API functions for conversations and messages
- ✅ `lib/api/config.ts` - API base URL configuration
- ✅ `app/dashboard/inbox/page.tsx` - Updated with real data integration
- ✅ `.env.local` - Added API URLs

### Backend (Already Done)

- ✅ `profiles/consumers.py` - ChatConsumer with authentication
- ✅ `profiles/routing.py` - WebSocket URL patterns
- ✅ `iayos_project/asgi.py` - ASGI configuration
- ✅ `iayos_project/settings.py` - Channels configuration
- ✅ `profiles/api.py` - REST API endpoints for chat

## 🚀 Next Steps

After confirming chat works:

1. **Production Setup**
   - Install Redis: `pip install redis`
   - Update CHANNEL_LAYERS to use RedisChannelLayer
   - Deploy with Daphne + Nginx

2. **Features to Add**
   - File attachments
   - Message reactions
   - Typing indicators
   - Read receipts
   - Message search
   - Message deletion
   - Notifications for new messages

3. **Performance Optimization**
   - Message pagination (load older messages on scroll)
   - Virtual scrolling for long conversations
   - Message caching with IndexedDB
   - Lazy load images

Happy testing! 🎊
