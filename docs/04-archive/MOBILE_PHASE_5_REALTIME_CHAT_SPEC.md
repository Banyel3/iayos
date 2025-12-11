# [Mobile] Phase 5: Real-Time Chat & Messaging

**Labels:** `priority:high`, `type:feature`, `area:mobile`, `area:chat`
**Priority:** HIGH
**Estimated Time:** 100-120 hours

## Summary
Implement real-time WebSocket-based chat system for worker-client communication with job context.

## Tasks

### WebSocket Integration
- [ ] Integrate web_socket_channel package
- [ ] Implement WebSocket connection manager
- [ ] Handle connection/disconnection events
- [ ] Add automatic reconnection logic
- [ ] Implement heartbeat/ping mechanism
- [ ] Handle WebSocket authentication with JWT

### Conversation Management
- [ ] Create ConversationsScreen listing all chats
- [ ] Display last message preview
- [ ] Show unread message count badges
- [ ] Add conversation filtering (active/archived)
- [ ] Implement conversation search
- [ ] Show related job context in conversation list

### Chat Interface
- [ ] Create ChatScreen for 1-on-1 messaging
- [ ] Display job details header in chat
- [ ] Implement message input with send button
- [ ] Show message bubbles (sent/received)
- [ ] Display message timestamps
- [ ] Add message delivery status indicators (sent/delivered/read)
- [ ] Implement typing indicators
- [ ] Add pull-to-refresh for message history

### Message Features
- [ ] Implement text message sending
- [ ] Add image message support
- [ ] Implement file attachment support (PDF, images)
- [ ] Add message reactions (optional)
- [ ] Implement message deletion (own messages)
- [ ] Add message copy functionality

### Real-Time Updates
- [ ] Receive messages in real-time via WebSocket
- [ ] Update conversation list on new message
- [ ] Show typing indicator when other user types
- [ ] Update read receipts in real-time
- [ ] Handle online/offline status
- [ ] Play notification sound for new messages

### Notifications
- [ ] Show local notification for new messages
- [ ] Display push notifications when app is closed
- [ ] Add notification tap to open chat
- [ ] Show notification count on app icon
- [ ] Implement notification settings

### Offline Support
- [ ] Queue messages when offline
- [ ] Retry sending failed messages
- [ ] Cache message history locally
- [ ] Sync messages on reconnection
- [ ] Show offline indicator

## Files to Create
- `lib/screens/chat/conversations_screen.dart` - Conversation list
- `lib/screens/chat/chat_screen.dart` - Chat interface
- `lib/components/message_bubble.dart` - Message component
- `lib/components/typing_indicator.dart` - Typing indicator
- `lib/components/message_input.dart` - Message input field
- `lib/services/websocket_service.dart` - WebSocket manager
- `lib/services/chat_service.dart` - Chat API service
- `lib/models/conversation.dart` - Conversation model
- `lib/models/message.dart` - Message model
- `lib/providers/chat_provider.dart` - Chat state
- `lib/providers/websocket_provider.dart` - WebSocket state
- `lib/utils/notification_helper.dart` - Local notifications

## WebSocket Channels to Implement
- `ws://localhost:8001/ws/chat/{conversation_id}/` - Chat messages
- Handle message types: `chat_message`, `typing`, `read_receipt`

## API Endpoints to Integrate
- `GET /api/conversations/` - Get conversation list
- `GET /api/conversations/{id}/messages/` - Get message history
- `POST /api/conversations/{id}/messages/` - Send message
- `POST /api/messages/{id}/read/` - Mark as read

## Acceptance Criteria
- [ ] Users can send and receive messages in real-time
- [ ] Typing indicators show when other party is typing
- [ ] Unread message counts display correctly
- [ ] Messages persist across app restarts
- [ ] Offline messages queue and send when online
- [ ] Push notifications work when app is closed
- [ ] Job context is visible in chat header
- [ ] Images and files can be sent and received
- [ ] WebSocket reconnects automatically on disconnect

## Dependencies
- **Requires:** Mobile Phase 1 - Job application (conversation context)
- **Integrates with:** Mobile Phase 2 - Job completion discussions

## Testing
- [ ] Test message sending/receiving in real-time
- [ ] Test WebSocket reconnection
- [ ] Test offline message queuing
- [ ] Verify typing indicators
- [ ] Test push notifications
- [ ] Verify message persistence
- [ ] Test with poor network conditions
- [ ] Verify notification sound playback

---
Generated with Claude Code
