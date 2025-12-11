# Mobile Phase 5 - QA Testing Checklist

**Feature**: Real-Time Chat & Messaging
**Date**: November 15, 2025
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Backend WebSocket running on ws://192.168.1.117:8001
- [ ] Django Channels server restarted (to load updated consumers.py)
- [ ] Supabase storage configured for chat images
- [ ] Mobile app running via Expo Go
- [ ] Test accounts created (2 workers, 2 clients)
- [ ] Camera/photo library permissions granted
- [ ] Network debugging enabled (to test offline mode)

## Pre-Testing Setup

### Account 1 (Worker):

- [ ] Email: worker1@test.com
- [ ] Profile type: WORKER
- [ ] Has 1+ accepted job applications
- [ ] Can send/receive messages

### Account 2 (Client):

- [ ] Email: client1@test.com
- [ ] Profile type: CLIENT
- [ ] Has posted jobs with accepted applications
- [ ] Can send/receive messages

### Account 3 (Worker 2):

- [ ] Email: worker2@test.com
- [ ] Profile type: WORKER
- [ ] For testing multiple conversations

### Account 4 (Client 2):

- [ ] Email: client2@test.com
- [ ] Profile type: CLIENT
- [ ] For testing multiple conversations

### Test Conversation Setup:

- [ ] Create 3+ conversations between different users
- [ ] Each conversation linked to a job
- [ ] Mix of read/unread messages
- [ ] At least 1 conversation with images
- [ ] At least 1 conversation to archive

---

## 1. Conversations List Screen (Tab)

**File**: `app/(tabs)/messages.tsx` (468 lines)

### Screen Access & Layout

- [ ] Navigate to Messages tab from bottom navigation
- [ ] Screen displays "Messages" header
- [ ] Connection status indicator visible in header
- [ ] Shows "Connected" with green dot when WebSocket connected
- [ ] Search bar visible below header
- [ ] Filter tabs visible (All/Unread/Archived)
- [ ] Conversations list renders properly
- [ ] Results count displays at bottom

### Connection Status Indicator

- [ ] Shows "Connected" with green dot when online
- [ ] Shows "Connecting..." with spinner when connecting
- [ ] Shows "Offline" banner with cloud icon when disconnected
- [ ] Banner message: "Offline - Messages will be sent when reconnected"
- [ ] Connection status updates in real-time
- [ ] Banner uses appropriate colors (green/yellow/red)

### Search Functionality

- [ ] Search bar placeholder: "Search conversations..."
- [ ] Search icon (magnifying glass) visible on left
- [ ] Typing in search filters conversations in real-time
- [ ] Searches participant name (other user)
- [ ] Searches job title
- [ ] Search is case-insensitive
- [ ] Clear button (X) appears when text entered
- [ ] Tapping clear button empties search
- [ ] Empty state shows when no results found
- [ ] Search results update instantly as you type

### Filter Tabs

- [ ] Three filter buttons: All, Unread, Archived
- [ ] "All" filter selected by default
- [ ] Active filter highlighted (blue background)
- [ ] Inactive filters have white background with border
- [ ] Unread filter shows badge with count (if unread > 0)
- [ ] Badge displays correct unread count
- [ ] Badge styled in red with white text
- [ ] Tapping filter switches conversations
- [ ] Filter state persists when switching tabs
- [ ] Filter state resets when searching

### Conversations List Display

- [ ] All conversations display in reverse chronological order
- [ ] Each conversation shows participant avatar
- [ ] Participant name displays correctly
- [ ] Job title displays below name
- [ ] Last message preview shows (truncated if long)
- [ ] Last message timestamp displays correctly
- [ ] Timestamp format: "Just now", "5m ago", "2h ago", "Yesterday", "Nov 15"
- [ ] Unread count badge shows on right (if unread > 0)
- [ ] Unread conversations show bold participant name
- [ ] Read conversations show normal weight text
- [ ] Job budget displays (₱X,XXX)
- [ ] User's role displays (You're the client/worker)

### Conversation Card Interactions

- [ ] Tapping conversation navigates to chat screen
- [ ] Swipe gesture reveals archive button (iOS)
- [ ] Long press shows context menu (Android)
- [ ] Context menu shows "Archive" option
- [ ] Tapping archive moves conversation to archived
- [ ] Conversation disappears from All/Unread filters
- [ ] Conversation appears in Archived filter
- [ ] Can unarchive from Archived filter

### Pull-to-Refresh

- [ ] Pull down gesture triggers refresh
- [ ] Refresh indicator (spinner) shows while loading
- [ ] Conversations list reloads from backend
- [ ] WebSocket connection refreshes
- [ ] New messages appear after refresh
- [ ] Refresh completes in < 2 seconds
- [ ] Success feedback provided (spinner stops)

### Empty States

- [ ] Empty state for no conversations (All filter)
- [ ] Shows chat bubble icon (64px)
- [ ] Message: "No conversations yet"
- [ ] Subtext: "Start by applying for jobs or accepting applications"
- [ ] Empty state for no search results
- [ ] Shows search icon when search returns nothing
- [ ] Message: "No conversations found"
- [ ] Subtext: "Try searching for a different name or job title"
- [ ] Empty state for archived conversations
- [ ] Shows archive icon
- [ ] Message: "No archived conversations"
- [ ] Subtext: "Archived conversations will appear here"

### Real-Time Updates

- [ ] New message appears in conversations list immediately
- [ ] Last message preview updates in real-time
- [ ] Unread count increments when message received
- [ ] Conversation moves to top when new message received
- [ ] Timestamp updates to "Just now"
- [ ] Updates happen without manual refresh
- [ ] WebSocket connection provides real-time data

### Results Count

- [ ] Results bar displays at bottom
- [ ] Shows count: "X conversations" or "1 conversation"
- [ ] Count updates when filtering
- [ ] Count updates when searching
- [ ] Styled in gray text, centered
- [ ] Hidden when list is empty

---

## 2. Chat Screen (Conversation View)

**File**: `app/messages/[conversationId].tsx` (667 lines)

### Screen Access & Header

- [ ] Navigate from conversations list
- [ ] Screen displays participant name in header
- [ ] Header shows "Messages" as back button text
- [ ] Job info button (i icon) visible in header
- [ ] Tapping info button navigates to job details
- [ ] Back button returns to conversations list
- [ ] Header displays correctly on iOS and Android

### Job Info Header Bar

- [ ] Job info bar displays below header
- [ ] Shows briefcase icon
- [ ] Job title displays (truncated if long)
- [ ] Job budget shows (₱X,XXX)
- [ ] User's role shows: "You're the client" or "You're the worker"
- [ ] Entire bar is tappable
- [ ] Tapping navigates to job detail screen
- [ ] Background color matches theme (light blue)

### Offline Indicator

- [ ] Offline banner shows when disconnected
- [ ] Banner displays cloud-offline icon
- [ ] Message: "You're offline. Messages will be sent when you reconnect."
- [ ] Banner uses warning color (orange/yellow)
- [ ] Banner appears immediately on disconnect
- [ ] Banner disappears when reconnected
- [ ] Banner positioned below job header

### Messages List Display

- [ ] All messages load on screen open
- [ ] Messages display in chronological order (oldest at top)
- [ ] Auto-scrolls to bottom on load
- [ ] Shows loading spinner while fetching messages
- [ ] Loading message: "Loading conversation..."
- [ ] Messages grouped by sender
- [ ] User's messages align to right
- [ ] Other user's messages align to left

### Message Bubbles (Text)

- [ ] User's messages have blue background
- [ ] Other user's messages have gray background
- [ ] Message text is readable (white on blue, black on gray)
- [ ] Long messages wrap properly
- [ ] URLs in messages are tappable (if applicable)
- [ ] Message bubbles have rounded corners
- [ ] Bubble tail points to sender side
- [ ] Multiple consecutive messages from same sender grouped

### Message Timestamps

- [ ] Timestamp shows for first message in each minute
- [ ] Timestamp format: "h:mm a" (e.g., "2:45 PM")
- [ ] Timestamp positioned below message bubble
- [ ] User's message timestamps align right
- [ ] Other user's message timestamps align left
- [ ] Timestamp color is light gray
- [ ] Timestamp font size smaller than message text

### Date Separators

- [ ] Date separator shows when day changes
- [ ] Separator format: "MMMM d, yyyy" (e.g., "November 15, 2025")
- [ ] Separator centered horizontally
- [ ] Separator has light gray background pill
- [ ] Text color is gray
- [ ] Separators appear between messages from different days

### Image Messages

- [ ] Image messages display inline in chat
- [ ] Images align to sender side (left/right)
- [ ] Images have rounded corners
- [ ] Images constrained to 200x200px
- [ ] Tapping image opens full-screen viewer
- [ ] Full-screen viewer allows pinch-to-zoom
- [ ] Image timestamp shows below image
- [ ] Loading spinner shows while image loads
- [ ] Broken image icon if image fails to load

### Typing Indicator

- [ ] Typing indicator appears when other user typing
- [ ] Shows participant's avatar on left
- [ ] Animated typing dots (3 dots pulsing)
- [ ] Dots animate smoothly
- [ ] Indicator disappears after 3 seconds if no new typing event
- [ ] Indicator positioned at bottom of messages list
- [ ] Auto-scrolls to show typing indicator

### Send Message

- [ ] Message input field visible at bottom
- [ ] Input placeholder: "Type a message..."
- [ ] Input expands as text grows (multi-line)
- [ ] Send button visible on right
- [ ] Send button disabled when input empty
- [ ] Send button enabled when text entered
- [ ] Tapping send sends message
- [ ] Input clears after send
- [ ] Sent message appears in chat immediately
- [ ] Message persists after app restart (backend saved)

### Typing Indicator (Outgoing)

- [ ] Typing event sent to backend when user types
- [ ] Typing event debounced (sent every 2 seconds max)
- [ ] Stop typing event sent after 3 seconds idle
- [ ] Other user sees typing indicator
- [ ] Typing indicator shows in real-time

### Image Upload Button

- [ ] Camera icon button visible in input area
- [ ] Tapping camera button shows action sheet (iOS) or alert (Android)
- [ ] Options: "Take Photo", "Choose from Library", "Cancel"
- [ ] Selecting "Take Photo" opens camera
- [ ] Selecting "Choose from Library" opens gallery
- [ ] Selecting "Cancel" dismisses picker

### Camera Permissions

- [ ] App requests camera permission on first use
- [ ] Permission alert shows proper message
- [ ] If permission denied, shows alert
- [ ] Alert message: "Camera permission is required to take photos."
- [ ] Can retry permission request

### Gallery Permissions

- [ ] App requests gallery permission on first use
- [ ] Permission alert shows proper message
- [ ] If permission denied, shows alert
- [ ] Alert message: "Gallery permission is required to choose photos."
- [ ] Can retry permission request

### Image Capture & Selection

- [ ] Camera launches successfully
- [ ] Can take photo with camera
- [ ] Image editor appears after capture (crop/edit)
- [ ] Can crop to 4:3 aspect ratio
- [ ] Gallery picker shows user's photos
- [ ] Can select photo from gallery
- [ ] Image editor appears after selection
- [ ] Can crop selected image

### Image Upload Process

- [ ] Upload starts immediately after selection
- [ ] Upload progress banner appears
- [ ] Banner shows: "Uploading image... X%"
- [ ] Progress percentage updates in real-time
- [ ] Spinner animates during upload
- [ ] Upload completes in < 5 seconds (WiFi)
- [ ] Success message: "Image sent successfully!"
- [ ] Image appears in chat after upload
- [ ] Image persists after app restart

### Image Upload Offline

- [ ] If offline, image added to queue
- [ ] Alert shows: "Offline - Image will be sent when you're back online."
- [ ] Image stored in AsyncStorage queue
- [ ] When reconnected, queued image uploads automatically
- [ ] Success notification after queued upload completes

### Image Upload Errors

- [ ] If upload fails, error alert shows
- [ ] Error message: "Failed to send image. Please try again."
- [ ] Can retry upload
- [ ] Failed image not added to chat (until retry succeeds)

### WebSocket Connection

- [ ] WebSocket connects on screen open
- [ ] Connection status tracked (connecting/connected/disconnected)
- [ ] Messages sent via WebSocket if connected
- [ ] Messages sent via HTTP if WebSocket disconnected
- [ ] Auto-reconnect on disconnect
- [ ] Exponential backoff for reconnection attempts
- [ ] Max 5 reconnection attempts

### Real-Time Message Receiving

- [ ] New messages appear immediately when received
- [ ] No manual refresh needed
- [ ] Message triggers auto-scroll to bottom
- [ ] Sound/haptic feedback on new message (if enabled)
- [ ] Unread count increments in conversations list
- [ ] Last message preview updates in conversations list

### Auto-Scroll Behavior

- [ ] Auto-scrolls to bottom on screen open
- [ ] Auto-scrolls when sending message
- [ ] Auto-scrolls when receiving message
- [ ] Does NOT auto-scroll if user scrolled up manually
- [ ] Smooth scrolling animation (100ms)

### Keyboard Handling

- [ ] Keyboard appears when tapping input
- [ ] Messages list adjusts when keyboard opens
- [ ] Input field stays visible above keyboard
- [ ] Can scroll messages while keyboard open
- [ ] Keyboard dismissed when tapping outside input
- [ ] Keyboard avoided properly (iOS & Android)
- [ ] No content hidden behind keyboard

### Loading States

- [ ] Loading spinner on initial conversation load
- [ ] Loading message: "Loading conversation..."
- [ ] Loading state for image uploads
- [ ] Loading state for message send (if slow)
- [ ] Skeleton loaders for message list (optional)

### Error States

- [ ] Error screen if conversation not found
- [ ] Shows alert icon (red)
- [ ] Error message: "Conversation not found"
- [ ] "Go Back" button to return to conversations list
- [ ] Network error handling (retry logic)
- [ ] Error toast notifications for failed actions

### Navigation

- [ ] Back button returns to conversations list
- [ ] Job info button navigates to job details
- [ ] Tapping participant avatar navigates to profile (if implemented)
- [ ] Deep linking to conversation works (if applicable)

---

## 3. Archive Conversation Feature

**File**: `lib/hooks/useConversations.ts` (+48 lines)

### Archive Action

- [ ] Can archive conversation from conversations list
- [ ] Swipe to archive works (iOS)
- [ ] Long press menu shows archive option (Android)
- [ ] Tapping archive triggers mutation
- [ ] Success feedback (conversation disappears from list)
- [ ] Conversation appears in Archived filter
- [ ] Archive status persisted in backend

### Unarchive Action

- [ ] Navigate to Archived filter
- [ ] Archived conversations display
- [ ] Can unarchive conversation
- [ ] Swipe to unarchive works (iOS)
- [ ] Long press menu shows unarchive option (Android)
- [ ] Unarchived conversation returns to All filter
- [ ] Unarchive status persisted in backend

### Backend Integration

- [ ] Archive API call: `POST /api/profiles/chat/conversations/{id}/toggle-archive`
- [ ] API toggles archive status (no body needed)
- [ ] Separate archive state per user (archivedByClient vs archivedByWorker)
- [ ] Client archiving doesn't affect worker's view
- [ ] Worker archiving doesn't affect client's view
- [ ] Archive state persists after app restart

### Cache Invalidation

- [ ] After archive, conversations cache refreshes
- [ ] Conversations list updates immediately
- [ ] No stale data after archive/unarchive
- [ ] React Query cache invalidated properly

---

## 4. Image Upload Endpoint (Backend)

**File**: `apps/backend/src/profiles/api.py` (+134 lines)

### Endpoint Access

- [ ] Endpoint: `POST /api/profiles/chat/{conversation_id}/upload-image`
- [ ] Authentication required (cookie_auth)
- [ ] Only conversation participants can upload
- [ ] Non-participants receive 403 Forbidden

### File Validation

- [ ] Accepts JPEG, PNG, JPG, WEBP formats
- [ ] Rejects other file types (e.g., PDF, GIF)
- [ ] Max file size: 5MB
- [ ] Files > 5MB rejected with error
- [ ] Error message: "File too large. Maximum size is 5MB."
- [ ] Empty file rejected
- [ ] Missing file rejected with error

### Supabase Upload

- [ ] Image uploaded to Supabase storage bucket: `iayos_files`
- [ ] Path: `chat/conversation_{id}/images/{timestamp}_{filename}`
- [ ] File stored with correct content type
- [ ] Public URL generated
- [ ] URL format: `https://...supabase.co/storage/v1/object/public/iayos_files/chat/...`

### Message Creation

- [ ] MESSAGE record created in database
- [ ] message_type set to "IMAGE"
- [ ] text field empty or contains caption (if implemented)
- [ ] image_url field populated with Supabase URL
- [ ] sender set to authenticated user
- [ ] conversation linked correctly
- [ ] created_at timestamp set

### MessageAttachment Creation (if applicable)

- [ ] MessageAttachment record created
- [ ] Links to MESSAGE record
- [ ] file_url contains Supabase URL
- [ ] file_type set to "IMAGE"
- [ ] file_size stored (in bytes)

### Response Format

- [ ] Returns JSON response
- [ ] success: true
- [ ] message_id: integer
- [ ] image_url: string (Supabase URL)
- [ ] uploaded_at: ISO 8601 timestamp
- [ ] conversation_id: integer

### Error Handling

- [ ] Upload failure returns 500 error
- [ ] Error response includes descriptive message
- [ ] Supabase errors caught and logged
- [ ] Database errors caught and logged
- [ ] Rollback on failure (no orphan records)

### Logging

- [ ] Upload start logged with user email and conversation ID
- [ ] File size and type logged
- [ ] Supabase upload success/failure logged
- [ ] Message creation success/failure logged
- [ ] Error stack traces logged

---

## 5. Typing Indicator WebSocket Events (Backend)

**File**: `apps/backend/src/profiles/consumers.py` (+64 lines)

### WebSocket Event Handling

- [ ] InboxConsumer handles `action: "typing"` events
- [ ] Event payload includes: conversation_id, user_id (or inferred from connection)
- [ ] Typing event does NOT save to database
- [ ] Typing event broadcasts to conversation participants

### Broadcasting Typing Events

- [ ] Typing event sent to conversation group channel
- [ ] Group channel name: `conversation_{conversation_id}`
- [ ] Only conversation participants receive event
- [ ] Non-participants do NOT receive event
- [ ] Sender does NOT receive their own typing event

### Typing Event Payload

- [ ] Broadcast message includes:
  - type: "typing_indicator"
  - user_id: sender's user ID
  - typing: true
  - conversation_id: integer
- [ ] Timestamp included (optional)

### Stop Typing Event

- [ ] Stop typing event handled separately (if implemented)
- [ ] Stop typing broadcasts typing: false
- [ ] Participants receive stop typing notification

### WebSocket Connection

- [ ] Typing events work over existing WebSocket connection
- [ ] No new connection needed
- [ ] Events sent/received on same InboxConsumer connection

### Error Handling

- [ ] Invalid conversation_id handled gracefully
- [ ] User not in conversation cannot send typing event
- [ ] WebSocket disconnect doesn't crash server
- [ ] Malformed events logged and ignored

---

## 6. Offline Queue & Network Handling

**File**: `lib/services/offline-queue.ts` (214 lines)

### Offline Detection

- [ ] App detects offline state via NetInfo
- [ ] Connection status updates in real-time
- [ ] Offline banner shows when disconnected
- [ ] Banner message accurate

### Message Queueing

- [ ] When offline, messages added to AsyncStorage queue
- [ ] Queued messages persist across app restarts
- [ ] Queue stores: conversation_id, text, type, imageUri (if image)
- [ ] Queue items have unique IDs
- [ ] Queue visible to user (pending badge or list)

### Queue Processing

- [ ] When reconnected, queue processes automatically
- [ ] Messages sent in order (FIFO)
- [ ] Each message retried up to 3 times
- [ ] Failed messages remain in queue
- [ ] Success removes message from queue
- [ ] User notified of queue processing

### Network Listener

- [ ] Network listener set up on app start
- [ ] Listener detects online/offline changes
- [ ] Callback triggered on state change
- [ ] Listener cleaned up on unmount
- [ ] No memory leaks from listener

### User Feedback

- [ ] Offline banner shows when disconnected
- [ ] Banner disappears when reconnected
- [ ] Toast notification on reconnect: "Back online. Sending queued messages..."
- [ ] Success notification after queue processed
- [ ] Error notification if queue processing fails

---

## 7. WebSocket Connection Management

**File**: `lib/services/websocket.ts` (325 lines)

### Connection Establishment

- [ ] WebSocket connects on app start (if authenticated)
- [ ] Connection URL: `ws://192.168.1.117:8001/ws/inbox/`
- [ ] JWT access token included in connection params
- [ ] Connection handshake completes successfully
- [ ] Connection state tracked (connecting/connected/disconnected)

### Authentication

- [ ] Access token retrieved from AsyncStorage
- [ ] Token sent in WebSocket URL query params
- [ ] Backend validates token on connection
- [ ] Invalid token rejects connection
- [ ] Expired token triggers refresh and reconnect

### Auto-Reconnect

- [ ] On disconnect, auto-reconnect attempts triggered
- [ ] Exponential backoff between attempts (1s, 2s, 4s, 8s, 16s)
- [ ] Max 5 reconnection attempts
- [ ] After max attempts, stop trying (user must manually retry)
- [ ] Reconnect attempt count displayed in UI (optional)

### Heartbeat / Ping

- [ ] Heartbeat sent every 30 seconds
- [ ] Ping message: `{ action: "ping" }`
- [ ] Backend responds with pong (or no response needed)
- [ ] If no pong in 10 seconds, connection considered dead
- [ ] Reconnect triggered if ping fails

### Event Listeners

- [ ] Can register event listeners (e.g., onMessage, onTyping)
- [ ] Multiple listeners per event type supported
- [ ] Listeners called when event received
- [ ] Listeners cleaned up on unmount (no memory leaks)

### Message Sending

- [ ] Can send messages via WebSocket
- [ ] Message format: `{ action: "send_message", ... }`
- [ ] Sent messages acknowledged by backend (optional)
- [ ] Failed send falls back to HTTP API

### Connection State Management

- [ ] Connection state exposed via `useWebSocketConnection` hook
- [ ] State values: "connecting", "connected", "disconnected"
- [ ] State updates trigger re-renders
- [ ] UI reflects connection state accurately

### Cleanup

- [ ] WebSocket disconnects on app background (optional)
- [ ] WebSocket disconnects on logout
- [ ] Connection cleanup on unmount
- [ ] No zombie connections

---

## 8. Integration Testing

### End-to-End Message Flow

- [ ] User A sends text message to User B
- [ ] User B receives message in real-time (< 1 second)
- [ ] Message persists in backend database
- [ ] Message visible after app restart
- [ ] Conversation last_message updated
- [ ] Conversations list updated in real-time

### End-to-End Image Flow

- [ ] User A sends image to User B
- [ ] Image uploads to Supabase
- [ ] IMAGE message created in database
- [ ] User B receives image message in real-time
- [ ] Image displays correctly for both users
- [ ] Image accessible after app restart

### Typing Indicator Flow

- [ ] User A types message
- [ ] User B sees typing indicator within 2 seconds
- [ ] Typing indicator stops after User A stops typing
- [ ] Indicator shows for max 3 seconds idle

### Archive/Unarchive Flow

- [ ] User A archives conversation
- [ ] Conversation disappears from All filter
- [ ] Conversation appears in Archived filter
- [ ] User B's view unaffected (conversation still in All for them)
- [ ] User A unarchives conversation
- [ ] Conversation returns to All filter

### Offline/Online Flow

- [ ] User goes offline (turn off WiFi)
- [ ] Offline banner shows
- [ ] User sends message
- [ ] Message added to queue
- [ ] User goes online
- [ ] Queued message sends automatically
- [ ] Message appears in chat for both users

### Multi-Conversation Flow

- [ ] User has 3+ conversations
- [ ] Can switch between conversations
- [ ] Each conversation loads correct messages
- [ ] New message in Conversation A updates its list item
- [ ] Switching to Conversation B doesn't affect A's state

---

## 9. Performance Testing

### Load Performance

- [ ] Conversations list with 20+ conversations loads in < 2 seconds
- [ ] Individual chat with 100+ messages loads in < 3 seconds
- [ ] Scrolling through 100+ messages is smooth (60fps)
- [ ] Image-heavy conversation (10+ images) loads smoothly
- [ ] No lag when typing messages

### Memory Usage

- [ ] App memory usage < 200MB with 50+ messages
- [ ] Memory doesn't increase indefinitely with long use
- [ ] No memory leaks on navigation
- [ ] No memory leaks from WebSocket listeners

### Network Efficiency

- [ ] WebSocket connection uses minimal bandwidth
- [ ] Heartbeat pings lightweight (< 100 bytes)
- [ ] Image uploads compressed (< 1MB)
- [ ] No unnecessary API calls
- [ ] Cache prevents duplicate fetches

### Battery Impact

- [ ] App doesn't drain battery significantly
- [ ] WebSocket connection doesn't prevent idle
- [ ] Background refresh respects system limits (if applicable)

---

## 10. Edge Cases & Error Scenarios

### Empty Conversation

- [ ] Conversation with no messages displays empty state
- [ ] Empty state message: "No messages yet. Start the conversation!"
- [ ] Send message works from empty state

### Single Message

- [ ] Conversation with 1 message displays correctly
- [ ] Date separator shows
- [ ] Timestamp shows

### Very Long Message

- [ ] Message with 1000+ characters wraps correctly
- [ ] Bubble doesn't overflow screen
- [ ] Text is readable
- [ ] Can scroll within message (if very long)

### Rapid Message Sending

- [ ] Sending 10 messages in 5 seconds works
- [ ] All messages appear in order
- [ ] No messages lost
- [ ] WebSocket handles rapid events

### Simultaneous Typing

- [ ] User A and User B type simultaneously
- [ ] Both see each other's typing indicators
- [ ] Indicators work independently

### Large Image Upload

- [ ] 4MB image uploads successfully
- [ ] 5MB+ image rejected with error
- [ ] Error message displayed to user

### Corrupted Image

- [ ] Invalid image file rejected
- [ ] Error message: "Invalid image file"

### Network Switch (WiFi to Cellular)

- [ ] Switching networks doesn't crash app
- [ ] WebSocket reconnects automatically
- [ ] Messages continue flowing after reconnect

### App Background/Foreground

- [ ] Backgrounding app pauses WebSocket (optional)
- [ ] Foregrounding app reconnects WebSocket
- [ ] Messages catch up after foreground
- [ ] No duplicate messages

### Logout

- [ ] Logging out disconnects WebSocket
- [ ] Conversation list cleared
- [ ] Chat state cleared
- [ ] No errors after logout

### Account Switch (if multi-account)

- [ ] Switching accounts loads correct conversations
- [ ] Previous account's messages not visible
- [ ] WebSocket reconnects with new token

---

## 11. Platform-Specific Testing

### iOS Testing

- [ ] Keyboard avoidance works (KeyboardAvoidingView)
- [ ] Safe areas respected (notch, home indicator)
- [ ] Action sheet for image picker shows correctly
- [ ] Swipe gestures work (swipe to archive)
- [ ] Navigation animations smooth
- [ ] Haptic feedback on actions (optional)

### Android Testing

- [ ] Keyboard handling works
- [ ] Status bar color matches theme
- [ ] Alert dialogs for image picker show correctly
- [ ] Long press menus work (archive)
- [ ] Back button navigation works
- [ ] Material ripple effects visible

---

## 12. Accessibility Testing

### Screen Readers

- [ ] Conversation list items have accessible labels
- [ ] Message bubbles have accessible labels
- [ ] Buttons have accessible labels
- [ ] Images have alt text (message type: IMAGE)
- [ ] Input field has placeholder announcement

### Font Scaling

- [ ] App supports system font scaling
- [ ] Text remains readable at 200% scale
- [ ] Layout doesn't break with large text

### Color Contrast

- [ ] Text has sufficient contrast (WCAG AA)
- [ ] Buttons/icons visible against background
- [ ] Color not sole indicator of status (use icons too)

---

## 13. Security Testing

### Authentication

- [ ] Unauthenticated users cannot access chat
- [ ] WebSocket requires valid JWT token
- [ ] Expired token triggers re-auth
- [ ] Cannot access other users' conversations
- [ ] Cannot upload images to conversations you're not in

### Data Privacy

- [ ] Messages encrypted in transit (HTTPS/WSS)
- [ ] Images stored securely in Supabase
- [ ] Cannot guess conversation URLs/IDs
- [ ] Archived conversations remain private

### Input Validation

- [ ] Cannot send empty messages
- [ ] Cannot send excessively long messages (10,000+ chars)
- [ ] XSS protection (sanitized text display)
- [ ] SQL injection protection (parameterized queries)

---

## 14. Bug Testing (Known Issues)

### Known Limitations

- [ ] Pagination for 1000+ messages not implemented (would need useInfiniteMessages)
- [ ] Read receipts not implemented (only unread counts)
- [ ] Message editing not implemented
- [ ] Message deletion not implemented
- [ ] Group conversations not supported (only 1-on-1)
- [ ] Voice messages not supported
- [ ] File attachments (non-image) not supported
- [ ] Push notifications on new message not implemented (Phase 9)

### Expected Behavior for Limitations

- [ ] Long conversation lists don't crash (but may load slowly)
- [ ] Old messages remain accessible (just need to scroll)
- [ ] Cannot edit sent messages (expected)
- [ ] Cannot delete sent messages (expected)

---

## 15. Regression Testing

### Previous Phases Still Work

- [ ] Job browsing (Phase 1) works
- [ ] Job application (Phase 1) works
- [ ] Job completion (Phase 2) works
- [ ] Escrow payments (Phase 3) work
- [ ] Final payments (Phase 4) work
- [ ] Profile management (Phase 6) works
- [ ] Adding chat doesn't break other features

---

## Test Completion Checklist

- [ ] All test cases executed
- [ ] All critical issues documented
- [ ] Screenshots captured for visual issues
- [ ] Performance metrics recorded
- [ ] Test report created
- [ ] Bugs logged in issue tracker
- [ ] QA sign-off obtained

---

**Total Test Cases**: 400+
**Estimated Testing Time**: 10-15 hours
**Priority**: High (Critical real-time feature)
**Status**: ⏳ Awaiting QA Execution
