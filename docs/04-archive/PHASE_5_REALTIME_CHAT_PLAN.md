# Mobile Phase 5: Real-Time Chat & Messaging - Implementation Plan

**Phase**: 5 - Real-Time Chat  
**Priority**: HIGH  
**Estimated Time**: 100-120 hours  
**Status**: 📋 PENDING (After Phases 3 & 4)

---

## 🎯 Phase Overview

Implement real-time WebSocket-based chat system for worker-client communication with job context, typing indicators, and message attachments.

**GitHub Issue Spec**: `docs/github-issues/MOBILE_PHASE_5_REALTIME_CHAT.md`

### Key Requirements

1. **WebSocket Connection**: Real-time bidirectional communication
2. **Conversation Management**: List of chats with unread badges
3. **Chat Interface**: 1-on-1 messaging with job context
4. **Message Features**: Text, images, typing indicators, read receipts
5. **Offline Support**: Queue messages when offline, sync on reconnection

---

## 📊 Week-by-Week Implementation

### Week 1: WebSocket Foundation (35-40 hours)

#### Day 1-2: WebSocket Integration (15-18 hours)

**Files to Create**:

- `lib/services/websocket.ts` (320 lines) - WebSocket manager
- `lib/hooks/useWebSocket.ts` (220 lines) - WebSocket React hooks
- `lib/utils/websocket-utils.ts` (150 lines) - Connection helpers

**Features**:

- WebSocket connection manager with auto-reconnect
- Heartbeat/ping mechanism (every 30 seconds)
- Connection state management (connecting/connected/disconnected)
- JWT authentication on WebSocket handshake
- Event listener registration/cleanup
- Exponential backoff for reconnection

**API Integration**:

- WebSocket endpoint: `ws://192.168.1.117:8000/ws/chat/`
- Authentication: JWT token in WebSocket headers

**Success Criteria**:

- ✅ WebSocket connects successfully with JWT
- ✅ Auto-reconnect works after disconnection
- ✅ Heartbeat keeps connection alive
- ✅ Connection state updates correctly

---

#### Day 3-4: Conversation Management (15-18 hours)

**Files to Create**:

- `app/messages/index.tsx` (480 lines) - Conversations list screen
- `components/ConversationCard.tsx` (280 lines) - Conversation item
- `lib/hooks/useConversations.ts` (200 lines) - Conversations hooks

**Features**:

- Conversations list with last message preview
- Unread count badges (red circles)
- Related job context display (job title, worker/client name)
- Conversation search functionality
- Pull-to-refresh
- Real-time updates when new messages arrive

**API Integration**:

- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/conversations/{id}` - Get conversation details

**Success Criteria**:

- ✅ Conversations load with pagination
- ✅ Unread badges display correctly
- ✅ Job context shows in each conversation
- ✅ Search filters conversations
- ✅ Real-time updates when new message arrives

---

#### Day 5: Conversation Filtering (8-10 hours)

**Files to Create**:

- `components/ConversationFilter.tsx` (180 lines) - Filter component

**Features**:

- Filter by active/archived conversations
- Filter by job (dropdown)
- Sort by latest message/unread
- Active filter indicator

**Success Criteria**:

- ✅ Filters work correctly
- ✅ Archived conversations hidden by default
- ✅ Job filter shows only relevant conversations

---

### Week 2: Chat Interface (40-45 hours)

#### Day 6-7: Chat Screen (20-24 hours)

**Files to Create**:

- `app/messages/[conversationId].tsx` (620 lines) - Chat screen
- `components/MessageBubble.tsx` (320 lines) - Message component
- `components/MessageInput.tsx` (280 lines) - Input field with send button
- `lib/hooks/useMessages.ts` (240 lines) - Messages hooks

**Features**:

- Chat interface with message list (FlatList)
- Message bubbles (sent: blue right-aligned, received: gray left-aligned)
- Timestamps (show only on first message per minute)
- Job details header (job title, client/worker name, avatar)
- Message input with send button
- Auto-scroll to bottom on new message
- Pull-to-refresh to load older messages (pagination)

**API Integration**:

- `GET /api/messages/{conversationId}/messages` - List messages
- `POST /api/messages/{conversationId}/send` - Send message via HTTP (fallback)
- WebSocket: Send message via `ws.send(JSON.stringify({...}))`

**Success Criteria**:

- ✅ Messages display correctly (sent/received)
- ✅ Job header shows correct information
- ✅ Message input sends messages
- ✅ Auto-scroll works
- ✅ Pagination loads older messages

---

#### Day 8-9: Typing Indicators & Read Receipts (15-18 hours)

**Files to Create**:

- `components/TypingIndicator.tsx` (150 lines) - Animated typing dots
- `lib/hooks/useTypingIndicator.ts` (120 lines) - Typing hooks

**Features**:

- Typing indicator ("User is typing..." with animated dots)
- Send typing event via WebSocket (debounced to every 2 seconds)
- Stop typing event when user stops (after 3 seconds of inactivity)
- Read receipts (checkmark icon: single = delivered, double = read)
- Mark messages as read when conversation opened

**WebSocket Events**:

- Send: `{"type": "typing", "conversationId": 123}`
- Receive: `{"type": "typing", "userId": 456, "isTyping": true}`
- Send: `{"type": "mark_read", "messageId": 789}`

**Success Criteria**:

- ✅ Typing indicator shows when other user types
- ✅ Typing events sent correctly (debounced)
- ✅ Read receipts display correctly
- ✅ Messages marked as read when opened

---

#### Day 10: Online/Offline Status (8-10 hours)

**Files to Create**:

- `components/OnlineStatusBadge.tsx` (100 lines) - Online indicator

**Features**:

- Online/offline status indicator in chat header
- Green dot for online, gray for offline
- "Last seen X minutes ago" for offline users

**WebSocket Events**:

- Receive: `{"type": "user_status", "userId": 456, "online": true}`

**Success Criteria**:

- ✅ Online status displays correctly
- ✅ Last seen timestamp accurate
- ✅ Real-time updates when user goes online/offline

---

### Week 3: Attachments & Polish (25-35 hours)

#### Day 11-12: Image Messages (15-20 hours)

**Files to Create**:

- `components/ImageMessage.tsx` (220 lines) - Image message component
- `components/ImagePicker.tsx` (180 lines) - Image picker modal
- `lib/hooks/useImageUpload.ts` (200 lines) - Image upload hooks

**Features**:

- Image picker (camera + gallery) with attachment icon
- Image preview before sending
- Image compression (max 1200x1200, <1MB)
- Sequential upload to backend
- Upload progress indicator
- Image display in message bubbles (tap to view full-screen)

**API Integration**:

- `POST /api/messages/{conversationId}/upload-image` - Upload image

**Success Criteria**:

- ✅ Image picker works (camera/gallery)
- ✅ Images compressed correctly
- ✅ Upload progress displays
- ✅ Images display in chat
- ✅ Tap to view full-screen

---

#### Day 13: Notifications (6-8 hours)

**Files to Create**:

- `lib/utils/chat-notifications.ts` (150 lines) - Notification helpers

**Features**:

- Local notification for new messages (when app in background)
- Push notification for new messages (when app closed)
- Notification tap opens chat screen
- Notification count badge on Messages tab icon
- Sound on new message

**API Integration**:

- `POST /api/notifications/message` - Create message notification

**Success Criteria**:

- ✅ Local notifications work when app backgrounded
- ✅ Push notifications work when app closed
- ✅ Tap opens correct chat screen
- ✅ Badge count displays on tab icon
- ✅ Sound plays on new message

---

#### Day 14: Offline Support & Testing (8-10 hours)

**Files to Create**:

- `lib/utils/offline-queue.ts` (180 lines) - Message queue manager

**Features**:

- Queue messages when offline (store in AsyncStorage)
- Retry sending failed messages on reconnection
- Cache message history locally (IndexedDB/AsyncStorage)
- Sync messages on reconnection
- Show offline indicator banner

**Success Criteria**:

- ✅ Messages queued when offline
- ✅ Messages sent when reconnected
- ✅ Offline indicator visible
- ✅ Message history cached locally

**Testing**:

- Test WebSocket connection/disconnection
- Test typing indicators
- Test read receipts
- Test image upload
- Test offline mode
- Test notifications
- Verify TypeScript compilation (0 errors)

**QA Checklist**:

- 180+ test cases in `docs/qa/NOT DONE/MOBILE_PHASE5_QA_CHECKLIST.md`

---

## 📁 Complete File List (22 files, ~4,800 lines)

### Services & Utils (4 files, ~800 lines)

1. `lib/services/websocket.ts` (320 lines) - WebSocket manager
2. `lib/utils/websocket-utils.ts` (150 lines) - Connection helpers
3. `lib/utils/chat-notifications.ts` (150 lines) - Notification helpers
4. `lib/utils/offline-queue.ts` (180 lines) - Message queue

### Hooks (5 files, ~980 lines)

5. `lib/hooks/useWebSocket.ts` (220 lines) - WebSocket hooks
6. `lib/hooks/useConversations.ts` (200 lines) - Conversations hooks
7. `lib/hooks/useMessages.ts` (240 lines) - Messages hooks
8. `lib/hooks/useTypingIndicator.ts` (120 lines) - Typing hooks
9. `lib/hooks/useImageUpload.ts` (200 lines) - Image upload hooks

### Screens (2 files, ~1,100 lines)

10. `app/messages/index.tsx` (480 lines) - Conversations list
11. `app/messages/[conversationId].tsx` (620 lines) - Chat screen

### Components (8 files, ~1,710 lines)

12. `components/ConversationCard.tsx` (280 lines) - Conversation item
13. `components/ConversationFilter.tsx` (180 lines) - Filter component
14. `components/MessageBubble.tsx` (320 lines) - Message component
15. `components/MessageInput.tsx` (280 lines) - Input field
16. `components/TypingIndicator.tsx` (150 lines) - Typing dots
17. `components/OnlineStatusBadge.tsx` (100 lines) - Online indicator
18. `components/ImageMessage.tsx` (220 lines) - Image message
19. `components/ImagePicker.tsx` (180 lines) - Image picker

### Documentation (3 files, ~4,500 lines)

20. `docs/github-issues/plans/PHASE_5_PROGRESS.md` (1,500 lines) - Progress tracking
21. `docs/qa/NOT DONE/MOBILE_PHASE5_QA_CHECKLIST.md` (1,800 lines) - QA tests
22. `docs/mobile/MOBILE_PHASE5_COMPLETE.md` (1,200 lines) - Completion summary

### Modified Files (1 file)

23. `lib/api/config.ts` - Add 6 chat endpoints

---

## 🔌 API Endpoints & WebSocket Events

### REST API Endpoints (6 endpoints)

1. `GET /api/messages/conversations` - List conversations
2. `GET /api/messages/conversations/{id}` - Get conversation details
3. `GET /api/messages/{conversationId}/messages` - List messages
4. `POST /api/messages/{conversationId}/send` - Send message (HTTP fallback)
5. `POST /api/messages/{conversationId}/upload-image` - Upload image
6. `POST /api/notifications/message` - Create message notification

### WebSocket Events

**Client → Server**:

- `{"type": "message", "conversationId": 123, "text": "Hello"}` - Send message
- `{"type": "typing", "conversationId": 123}` - Typing indicator
- `{"type": "mark_read", "messageId": 789}` - Mark message as read

**Server → Client**:

- `{"type": "message", "data": {...}}` - New message received
- `{"type": "typing", "userId": 456, "isTyping": true}` - Other user typing
- `{"type": "user_status", "userId": 456, "online": true}` - User status update

---

## 🎨 UI Flow

### Conversations List

```
Messages Tab
    ↓
Conversations List (index.tsx)
    ├── Filter Bar (active/archived/job)
    ├── ConversationCard (with unread badge)
    │   ├── Avatar
    │   ├── Name + Job Title
    │   ├── Last Message Preview
    │   └── Timestamp + Unread Badge
    └── Search Bar
```

### Chat Interface

```
Conversation Tap
    ↓
Chat Screen ([conversationId].tsx)
    ├── Header
    │   ├── Job Title
    │   ├── Client/Worker Name
    │   └── Online Status Badge
    ├── Message List (FlatList)
    │   ├── MessageBubble (sent/received)
    │   ├── ImageMessage (with full-screen viewer)
    │   └── TypingIndicator
    └── Message Input
        ├── Text Input
        ├── Image Picker Icon
        └── Send Button
```

---

## ✅ Success Criteria

### Functional Requirements

- [ ] Users can view conversations list with unread badges
- [ ] Users can send/receive text messages in real-time
- [ ] Typing indicators show when other user types
- [ ] Read receipts display correctly (delivered/read)
- [ ] Users can send image messages
- [ ] Online/offline status displays correctly
- [ ] Notifications work (local + push)
- [ ] Offline mode queues messages and syncs on reconnect

### Technical Requirements

- [ ] 0 TypeScript compilation errors
- [ ] WebSocket connection stable with auto-reconnect
- [ ] All API endpoints integrated correctly
- [ ] React Query caching configured
- [ ] Error handling with toast notifications
- [ ] Loading states on all async operations

### Testing Requirements

- [ ] 180+ test cases executed (QA checklist)
- [ ] Integration tests with backend passed
- [ ] WebSocket connection tested (connect/disconnect/reconnect)
- [ ] Typing indicators verified
- [ ] Notifications verified
- [ ] Offline mode tested

---

## 📝 Dependencies

**Requires**:

- ✅ Backend: WebSocket chat server operational
- ✅ Backend: Message APIs operational
- ⚠️ Can proceed in parallel with Phase 3 & 4 (no blocking dependencies)

**Blocks**:

- None (Phase 5 is independent)

---

## 🚀 Technical Considerations

### WebSocket Connection

- **URL**: `ws://192.168.1.117:8000/ws/chat/`
- **Authentication**: JWT token in WebSocket headers or query params
- **Reconnection**: Exponential backoff (1s → 2s → 4s → 8s → 16s max)
- **Heartbeat**: Ping every 30 seconds, close if no pong after 5 seconds

### Message Caching

- **Strategy**: Cache last 50 messages per conversation in AsyncStorage
- **Sync**: Load from cache first, then fetch from API
- **Offline**: Store sent messages in queue, sync on reconnection

### Image Upload

- **Compression**: Max 1200x1200, quality 0.8, <1MB
- **Format**: JPEG for photos, PNG for screenshots
- **Upload**: Sequential upload to prevent server overload
- **Storage**: Backend uploads to Supabase storage

---

**Last Updated**: January 2025  
**Status**: 📋 PENDING (After Phases 3 & 4)  
**Next**: Awaiting Phases 3 & 4 completion
