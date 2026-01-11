# Backend WebSocket Configuration for Single-User Connection

## Changes Made

### 1. New InboxConsumer (`profiles/consumers.py`)

Created a new `InboxConsumer` class that handles **all conversations** for a user through a **single WebSocket connection**.

#### **Key Features:**

- **User-Level Connection:** Connects at `/ws/inbox/` instead of `/ws/chat/{id}/`
- **Multi-Conversation Support:** Subscribes to ALL conversation groups the user is part of
- **Message Routing:** Routes messages based on `conversation_id` in the payload
- **Dynamic Subscription:** Automatically subscribes to all user conversations on connect

#### **How It Works:**

1. **On Connect:**
   - Authenticates user
   - Fetches user's profile
   - Gets ALL conversations user is part of (as client OR worker)
   - Subscribes to ALL conversation groups (e.g., `chat_1`, `chat_2`, `chat_3`)
   - Accepts connection

2. **On Message Received:**
   - Parses `conversation_id` from payload
   - Verifies user has access to that conversation
   - Saves message to database
   - Broadcasts to specific conversation group
   - All subscribers to that group receive the message

3. **On Disconnect:**
   - Unsubscribes from all conversation groups
   - Closes connection

### 2. Updated Routing (`profiles/routing.py`)

Added new WebSocket endpoint while keeping legacy endpoint for backwards compatibility:

```python
websocket_urlpatterns = [
    # NEW: Single user-level WebSocket
    re_path(r'ws/inbox/$', consumers.InboxConsumer.as_asgi()),

    # LEGACY: Per-conversation WebSocket (backwards compatible)
    re_path(r'ws/chat/(?P<conversation_id>\d+)/$', consumers.ChatConsumer.as_asgi()),

    # Job status updates
    re_path(r'ws/job/(?P<job_id>\d+)/$', consumers.JobStatusConsumer.as_asgi()),
]
```

---

## Message Protocol

### **Client → Server (Outgoing)**

When sending a message, client must include `conversation_id`:

```json
{
  "conversation_id": 123,
  "message": "Hello from client",
  "type": "TEXT"
}
```

**Required Fields:**

- `conversation_id` (int): Which conversation this message belongs to
- `message` (string): The message text
- `type` (string): Message type (default: "TEXT")

### **Server → Client (Incoming)**

Server sends messages with full context:

```json
{
  "id": 789,
  "conversation_id": 123,
  "sender_id": "456",
  "sender_name": "John Doe",
  "sender_avatar": "https://...",
  "message": "Hello from server",
  "type": "TEXT",
  "created_at": "2025-01-15T10:30:00Z",
  "message_id": 789
}
```

**Fields:**

- `conversation_id` (int): ⚠️ **CRITICAL** - Frontend uses this to route messages
- `sender_id` (string): Profile ID of sender
- `sender_name` (string): Full name of sender
- `sender_avatar` (string|null): Avatar URL
- `message` (string): Message text
- `type` (string): Message type
- `created_at` (string): ISO timestamp
- `message_id` (int): Message ID

---

## How Message Routing Works

### **Example: User with 3 Conversations**

```
User connects to ws://host/ws/inbox/
    ↓
InboxConsumer.connect() executes
    ↓
Fetches conversations: [1, 2, 3]
    ↓
Subscribes to groups:
    - chat_1
    - chat_2
    - chat_3
    ↓
Connection accepted ✅
```

### **Example: User Sends Message to Conversation 2**

```
Client sends:
{
  "conversation_id": 2,
  "message": "Hi",
  "type": "TEXT"
}
    ↓
InboxConsumer.receive() executes
    ↓
Verifies user has access to conversation 2 ✅
    ↓
Saves message to database
    ↓
Broadcasts to group "chat_2"
    ↓
ALL subscribers to "chat_2" receive:
{
  "conversation_id": 2,
  "sender_id": "456",
  "message": "Hi",
  ...
}
```

### **Example: User in Conversation 2 Receives Message**

```
Other user sends message to conversation 2
    ↓
Message saved to database
    ↓
Broadcast to group "chat_2"
    ↓
Channel layer delivers to ALL group members
    ↓
InboxConsumer.chat_message() executes
    ↓
Sends to WebSocket:
{
  "conversation_id": 2,
  "message": "Reply",
  ...
}
    ↓
Frontend filters by conversation_id
    ↓
Only Conversation 2 component processes it ✅
```

---

## Database Queries

### **On Connect**

```python
# Get user profile
Profile.objects.get(accountFK=user)

# Get all user conversations
Conversation.objects.filter(client=profile) | Conversation.objects.filter(worker=profile)
# Returns: QuerySet of conversation IDs
```

**Optimization:** Consider caching conversation IDs if users have many conversations.

### **On Receive Message**

```python
# Verify access
Profile.objects.get(accountFK=user)
Conversation.objects.get(conversationID=conversation_id)

# Save message
Message.objects.create(
    conversationID=conversation,
    sender=profile,
    messageText=message_text,
    messageType=message_type,
    isRead=False
)
```

**Queries Per Message:** 3 (get profile, get conversation, create message)

---

## Security & Validation

### **Authentication Check**

```python
if not self.user or not self.user.is_authenticated:
    await self.close()
    return
```

### **Profile Validation**

```python
self.profile = await self.get_user_profile()
if not self.profile:
    await self.close()
    return
```

### **Conversation Access Verification**

```python
has_access = await self.verify_conversation_access(conversation_id)
if not has_access:
    return  # Silently ignore unauthorized messages
```

**Access Rules:**

- User must be either the `client` OR `worker` in the conversation
- Verified on EVERY message send
- Prevents cross-conversation message injection

---

## Group Subscription Pattern

### **Dynamic Group Management**

```python
# On Connect - Subscribe to ALL user's conversations
for conv_id in conversation_ids:
    group_name = f'chat_{conv_id}'
    await self.channel_layer.group_add(group_name, self.channel_name)

# On Disconnect - Unsubscribe from ALL
for group_name in self.conversation_groups:
    await self.channel_layer.group_discard(group_name, self.channel_name)
```

### **Broadcasting to Specific Conversation**

```python
room_group_name = f'chat_{conversation_id}'
await self.channel_layer.group_send(
    room_group_name,
    {
        'type': 'chat_message',
        'message': { ... }
    }
)
```

**Result:** Only users subscribed to that conversation's group receive the message.

---

## Logging & Debugging

The `InboxConsumer` includes extensive logging:

```python
print(f"[InboxWS] Connection attempt for user: {self.user}")
print(f"[InboxWS] User has {len(conversation_ids)} conversations: {conversation_ids}")
print(f"[InboxWS] ✅ Subscribed to {len(self.conversation_groups)} conversation groups")
print(f"[InboxWS] 📩 Received data: {text_data}")
print(f"[InboxWS] 💾 Saving message to database...")
print(f"[InboxWS] ✅ Message saved with ID: {message.messageID}")
print(f"[InboxWS] 📤 Message broadcasted to group {room_group_name}")
```

**To view logs:**

```bash
docker-compose -f docker-compose.dev.yml logs -f backend
```

**Common Log Patterns:**

- `✅` = Success
- `❌` = Error
- `⚠️` = Warning
- `📩` = Received message
- `📤` = Sent/broadcast message
- `💾` = Database operation

---

## Testing

### **1. Test WebSocket Connection**

Using `wscat`:

```bash
npm install -g wscat

# Connect
wscat -c "ws://localhost:8000/ws/inbox/" -H "Authorization: Bearer <token>"

# Or without auth (if using session cookies)
wscat -c "ws://localhost:8000/ws/inbox/"
```

### **2. Send Test Message**

```json
{ "conversation_id": 1, "message": "Test message", "type": "TEXT" }
```

Expected response:

```json
{
  "id": 123,
  "conversation_id": 1,
  "sender_id": "456",
  "sender_name": "Your Name",
  "message": "Test message",
  "type": "TEXT",
  "created_at": "2025-11-06T...",
  "message_id": 123
}
```

### **3. Test Multiple Conversations**

```bash
# Terminal 1 - User A connects
wscat -c "ws://localhost:8000/ws/inbox/"

# Terminal 2 - User B connects
wscat -c "ws://localhost:8000/ws/inbox/"

# User A sends to conversation 1
{"conversation_id": 1, "message": "Hello", "type": "TEXT"}

# User B (if in conversation 1) should receive message
# User B (if NOT in conversation 1) should NOT receive message
```

### **4. Verify Group Subscriptions**

Check backend logs for:

```
[InboxWS] User has 3 conversations: [1, 2, 3]
[InboxWS] ✅ Subscribed to 3 conversation groups
```

---

## Performance Considerations

### **Connection Overhead**

**Before (Per-Conversation):**

- 10 conversations = 10 WebSocket connections
- 10 authentication checks
- 10 group subscriptions (1 per connection)

**After (Single Inbox):**

- 10 conversations = **1 WebSocket connection**
- **1 authentication check**
- 10 group subscriptions (all on 1 connection)

**Improvement:** 90% reduction in connection overhead

### **Database Queries**

**On Connect:**

```sql
-- Get profile (1 query)
SELECT * FROM profiles WHERE accountFK = user_id;

-- Get conversations (1 query with OR)
SELECT conversationID FROM conversations
WHERE client_id = profile_id OR worker_id = profile_id;
```

**On Message:**

```sql
-- Verify access (2 queries)
SELECT * FROM profiles WHERE accountFK = user_id;
SELECT * FROM conversations WHERE conversationID = conv_id;

-- Save message (1 query)
INSERT INTO messages (...) VALUES (...);
```

**Total per message:** 3 queries (same as before)

### **Channel Layer Load**

**Group Subscriptions:**

- User with 10 conversations subscribes to 10 groups
- Each message broadcast goes to 1 group only
- Minimal overhead compared to per-conversation model

**Redis Operations:**

```
# On connect
SADD chat_1 <channel_name>
SADD chat_2 <channel_name>
SADD chat_3 <channel_name>
...

# On message broadcast
SMEMBERS chat_2  # Get all subscribers
# Send to each subscriber
```

---

## Migration Guide

### **Switching from Legacy to New Endpoint**

**Frontend Change:**

```typescript
// Before
const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/`;

// After
const wsUrl = `${protocol}//${host}/ws/inbox/`;
```

**No backend changes needed** - both endpoints work simultaneously!

### **Gradual Rollout**

1. **Phase 1:** Deploy new `InboxConsumer` (✅ DONE)
2. **Phase 2:** Update frontend to use `/ws/inbox/` (✅ DONE)
3. **Phase 3:** Monitor logs, verify messages route correctly
4. **Phase 4:** (Optional) Remove legacy `ChatConsumer` after confirming stability

### **Rollback Plan**

If issues arise, frontend can revert to legacy endpoint:

```typescript
// Rollback - use per-conversation endpoint
const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/`;
```

Backend keeps supporting both endpoints, so no backend changes needed for rollback.

---

## Troubleshooting

### **Connection Rejected**

**Symptom:** WebSocket closes immediately after connecting

**Check:**

1. Is user authenticated?
   ```
   [InboxWS] REJECTED: User not authenticated
   ```
2. Does user have a profile?
   ```
   [InboxWS] REJECTED: Profile not found for user
   ```

**Fix:**

- Ensure JWT token or session cookie is sent with WebSocket request
- Verify user has associated Profile in database

### **Messages Not Routing**

**Symptom:** Message sent but not received

**Check:**

1. Is `conversation_id` included in message?
   ```
   [InboxWS] ⚠️ No conversation_id provided, skipping
   ```
2. Does user have access to conversation?
   ```
   [InboxWS] ⚠️ User does not have access to conversation 123
   ```
3. Is other user subscribed to that conversation group?

**Fix:**

- Ensure frontend sends `conversation_id` in payload
- Verify conversation exists and user is client/worker
- Check both users are connected and subscribed

### **No Logs Appearing**

**Symptom:** No `[InboxWS]` logs in backend

**Check:**

1. Is WebSocket request reaching backend?
2. Is ASGI server (Daphne) running?
3. Is routing configured correctly?

**Fix:**

```bash
# Check ASGI server is running
docker-compose -f docker-compose.dev.yml ps

# View real-time logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Verify routing
cat apps/backend/src/profiles/routing.py
```

---

## Future Enhancements

### **1. New Conversation Detection**

When user creates/joins new conversation, re-subscribe to groups:

```python
async def subscribe_to_new_conversation(self, conversation_id):
    group_name = f'chat_{conversation_id}'
    await self.channel_layer.group_add(group_name, self.channel_name)
    self.conversation_groups.append(group_name)
```

### **2. Typing Indicators**

Broadcast typing status to conversation group:

```python
# Client sends
{"conversation_id": 1, "type": "TYPING", "is_typing": true}

# Broadcast to group
await self.channel_layer.group_send(
    f'chat_{conversation_id}',
    {'type': 'typing_indicator', 'user_id': user_id, 'is_typing': True}
)
```

### **3. Read Receipts**

Mark messages as read when user views conversation:

```python
{"conversation_id": 1, "type": "READ", "message_ids": [789, 790]}
```

### **4. Presence Status**

Track user online/offline status:

```python
# On connect
await self.channel_layer.group_send('presence', {
    'type': 'user_online',
    'user_id': user_id
})
```

---

## Summary

✅ **Backend now supports single user-level WebSocket connections**

- Endpoint: `ws://host/ws/inbox/`
- Handles ALL conversations for a user
- Routes messages by `conversation_id` in payload
- Maintains backwards compatibility with legacy endpoint
- Extensive logging for debugging
- Security validation on every message

✅ **Ready for Production**

- Tested message routing
- Error handling implemented
- Authentication enforced
- Access control verified
- Compatible with existing frontend changes
