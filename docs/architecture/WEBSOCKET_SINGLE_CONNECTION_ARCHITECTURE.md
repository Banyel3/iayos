# WebSocket Single-Connection Architecture

## Overview

The WebSocket system has been refactored from a **per-conversation** architecture to a **single user-level connection** architecture for maximum efficiency and performance.

## Previous Architecture (Per-Conversation)

### Problems:

- Created N separate WebSocket connections for N active conversations
- Each connection consumed memory, CPU, and network resources
- Complex state management with 4 separate Maps keyed by conversation ID
- Higher probability of connection failures (N connections = N potential failure points)
- Connection pooling helped but still had fundamental inefficiencies

### Implementation:

```typescript
// Per-conversation URL pattern
//host/ws/chat/{conversationId}/

// State tracking per conversation
ws: const wsConnections = new Map<number, WebSocket>();
const connectionListeners = new Map<number, Set<callback>>();
const backgroundReconnects = new Map<number, NodeJS.Timeout>();
const connectionStates = new Map<
  number,
  { isConnecting; attempts; lastError }
>();
```

---

## New Architecture (Single User Connection)

### Benefits:

- ✅ **Exactly 1 WebSocket** per authenticated user (instead of N)
- ✅ **Simpler state management** - no Maps needed
- ✅ **Lower resource usage** on client and server
- ✅ **Better scalability** - server handles fewer total connections
- ✅ **All optimizations retained** - reconnection, timeout protection, retry functionality
- ✅ **Faster** - single connection eliminates overhead

### Implementation:

#### **Global Connection Pattern**

```typescript
// Single user-level URL
//host/ws/inbox/

// Global state (not per-conversation)
ws: let globalWebSocket: WebSocket | null = null;
let globalConnectionState = {
  isConnecting: boolean,
  isConnected: boolean,
  reconnectAttempts: number,
  error: string | null,
};

// All listeners share the same connection
const globalMessageListeners = new Set<(msg: WebSocketMessage) => void>();
```

#### **Message Routing**

```typescript
// Messages now include conversation_id in payload
interface WebSocketMessage {
  type: string;
  message: string;
  conversation_id?: number; // ⬅️ Critical for routing
  sender_id?: number;
  sender_name?: string;
  sender_avatar?: string;
  created_at?: string;
  message_id?: number;
}

// Frontend filters messages by conversation_id
ws.onmessage = (event) => {
  const data: WebSocketMessage = JSON.parse(event.data);

  // Notify ALL listeners (they filter themselves)
  globalMessageListeners.forEach((listener) => listener(data));
};

// Each component filters for its conversation
const filteredMessageHandler = useCallback(
  (msg: WebSocketMessage) => {
    if (msg.conversation_id === currentConversationIdRef.current) {
      setLastMessage(msg);
      onMessage(msg);
    }
  },
  [onMessage]
);
```

#### **Sending Messages**

```typescript
// Old (per-conversation)
wsSendMessage(message);

// New (with conversation ID)
wsSendMessage(conversationId, message);

// Backend receives
{
  conversation_id: 123,
  message: "Hello",
  type: "TEXT"
}
```

---

## Hook API

### **useWebSocket(conversationId, onMessage)**

The hook signature remains the same, but now internally uses a shared global connection.

```typescript
const {
  isConnected, // Global connection status
  isConnecting, // Global connecting status
  error, // Global connection error
  sendMessage, // (conversationId, message) => void
  lastMessage, // Last message for THIS conversation
  retry, // Manually retry global connection
} = useWebSocket(selectedChat?.id || null, handleWebSocketMessage);
```

### **Internal Behavior**

1. **On Mount (conversationId provided):**
   - Add filtered message listener to global set
   - Connect global WebSocket if not already connected/connecting

2. **On Message Received:**
   - Global listener receives ALL messages
   - Each component's filter only processes messages matching its `conversation_id`

3. **On Unmount:**
   - Remove this component's listener from global set
   - If no more listeners, close global WebSocket

4. **On Send:**

   ```typescript
   sendMessage(conversationId, "Hello");

   // Sends to global WebSocket with payload:
   {
     conversation_id: conversationId,
     message: "Hello",
     type: "TEXT"
   }
   ```

---

## Advanced Features (Retained)

### **Background Reconnection**

- Non-blocking reconnection (UI stays responsive)
- Smart exponential backoff: 500ms → 2s → 5s → 10s → 30s
- Up to 10 automatic retry attempts
- Connection timeout protection (5 seconds)

### **Error Handling**

```typescript
// Yellow error banner with retry button
{wsError && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
    <p className="text-sm text-yellow-700">{wsError}</p>
    <button onClick={retryWebSocket}>Retry Now</button>
  </div>
)}
```

### **State Synchronization**

- Global state updates notify all subscribed components
- React state stays in sync with global connection state

```typescript
const stateUpdateCallbacks = new Set<(state) => void>();

function notifyStateChange() {
  stateUpdateCallbacks.forEach((callback) =>
    callback({ ...globalConnectionState })
  );
}
```

---

## Backend Requirements

### **Expected WebSocket URL**

```
ws://host/ws/inbox/
```

### **Expected Message Format**

#### **Incoming (Server → Client)**

```json
{
  "type": "TEXT",
  "message": "Hello from server",
  "conversation_id": 123,
  "sender_id": 456,
  "sender_name": "John Doe",
  "sender_avatar": "https://...",
  "created_at": "2025-01-15T10:30:00Z",
  "message_id": 789
}
```

#### **Outgoing (Client → Server)**

```json
{
  "conversation_id": 123,
  "message": "Hello from client",
  "type": "TEXT"
}
```

### **Django Channels Consumer**

The backend consumer must:

1. Accept connections at `/ws/inbox/`
2. Authenticate the user
3. Route messages based on `conversation_id` in payload
4. Include `conversation_id` in all outgoing messages

---

## Migration Guide

### **Frontend Changes**

#### **1. Update sendMessage Calls**

```typescript
// Before
wsSendMessage(message);

// After
wsSendMessage(selectedChat.id, message);
```

#### **2. No Other Changes Needed**

The hook signature remains compatible. Existing code like this still works:

```typescript
const { isConnected, isConnecting, error, sendMessage, lastMessage, retry } =
  useWebSocket(selectedChat?.id || null, handleWebSocketMessage);
```

### **Backend Changes** ⚠️

If your backend doesn't support user-level routing yet, you'll need to:

1. Create new routing endpoint `/ws/inbox/`
2. Modify consumer to handle multiple conversations per connection
3. Ensure all messages include `conversation_id`

---

## Performance Improvements

### **Connection Overhead Reduction**

- **Before:** 10 conversations = 10 WebSocket connections
- **After:** 10 conversations = 1 WebSocket connection
- **Improvement:** 90% reduction in connection overhead

### **State Management Simplification**

- **Before:** 4 Maps × N conversations = complex state
- **After:** Simple global state + filtered listeners
- **Improvement:** O(1) state lookup instead of O(N)

### **Memory Usage**

- **Before:** Each WebSocket ~10KB + Map overhead
- **After:** Single WebSocket ~10KB total
- **Improvement:** ~90% memory reduction for 10 conversations

### **Network Efficiency**

- **Before:** N keep-alive pings, N reconnection attempts
- **After:** 1 keep-alive ping, 1 reconnection attempt
- **Improvement:** Linear reduction in network traffic

---

## Debugging Tips

### **Check Global Connection**

```javascript
// In browser console
console.log(window.globalWebSocket);
console.log(window.globalConnectionState);
```

### **Monitor Message Routing**

```javascript
// In useWebSocket hook, add temporary logging
const filteredMessageHandler = useCallback(
  (msg) => {
    console.log(
      `📨 Message received for conversation ${msg.conversation_id}:`,
      msg
    );
    if (msg.conversation_id === currentConversationIdRef.current) {
      console.log(
        `✅ Matched current conversation ${currentConversationIdRef.current}`
      );
      setLastMessage(msg);
      onMessage(msg);
    } else {
      console.log(`⏭️ Skipped (current: ${currentConversationIdRef.current})`);
    }
  },
  [onMessage]
);
```

### **Verify Backend Support**

```bash
# Test WebSocket endpoint
wscat -c ws://localhost:8000/ws/inbox/

# Send test message
{"conversation_id": 123, "message": "test", "type": "TEXT"}
```

---

## Testing Checklist

- [ ] Single user can open multiple conversations
- [ ] Messages route to correct conversation
- [ ] Switching conversations doesn't create new WebSocket
- [ ] Connection survives conversation switches
- [ ] Reconnection maintains all conversation subscriptions
- [ ] Error handling works across all conversations
- [ ] Retry button reconnects successfully
- [ ] No memory leaks when opening/closing conversations
- [ ] Backend receives `conversation_id` in messages
- [ ] Backend sends `conversation_id` in messages

---

## Rollback Plan

If issues arise, revert to per-conversation architecture by restoring the previous `useWebSocket.ts` from git:

```bash
git checkout HEAD~1 -- apps/frontend_web/lib/hooks/useWebSocket.ts
git checkout HEAD~1 -- apps/frontend_web/app/dashboard/inbox/page.tsx
```

---

## Future Enhancements

### **Potential Optimizations**

- Message queuing for offline support
- Message deduplication at global level
- Connection health monitoring
- Automatic ping/pong keep-alive
- Metrics collection (connection duration, message count, etc.)

### **Additional Features**

- Typing indicators across conversations
- Read receipts
- Message acknowledgments
- Presence status (online/offline)
