# Mobile Phase 9 - QA Testing Checklist

**Feature**: Push Notifications System
**Date**: November 15, 2025
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Mobile app running via Expo Go or standalone build
- [ ] **Physical device required** (push notifications don't work on simulator)
- [ ] Expo push notification service configured
- [ ] Firebase Cloud Messaging (FCM) configured for Android
- [ ] Apple Push Notification service (APNs) configured for iOS (production)
- [ ] Test accounts created (2 workers, 2 clients)
- [ ] Backend `PushToken` and `NotificationSettings` models verified
- [ ] Notification API endpoints accessible

## Pre-Testing Setup

### Device Setup:

- [ ] Test on physical iOS device (iPhone)
- [ ] Test on physical Android device
- [ ] Expo Go app installed (for development testing)
- [ ] Standalone build installed (for production-like testing)
- [ ] Notifications permission NOT granted yet (for testing permission flow)

### Account 1 (Worker):

- [ ] Email: worker1@test.com
- [ ] Profile type: WORKER
- [ ] Has active jobs
- [ ] Can receive job-related notifications

### Account 2 (Client):

- [ ] Email: client1@test.com
- [ ] Profile type: CLIENT
- [ ] Has posted jobs
- [ ] Can receive application notifications

### Backend Notification Setup:

- [ ] Create test notifications in database for each type
- [ ] Mix of read/unread notifications
- [ ] Notifications with different timestamps (recent, 1 day ago, 1 week ago)
- [ ] Create push tokens for test devices

---

## 1. App Launch & Permission Request

**File**: `lib/services/notificationService.ts` (285 lines)

### First Launch - Permission Request

- [ ] App launches for first time
- [ ] Notification permission alert appears
- [ ] Alert title: "Allow Notifications?"
- [ ] Alert message explains why notifications needed
- [ ] "Allow" button visible
- [ ] "Don't Allow" button visible
- [ ] Alert shows on both iOS and Android

### Permission Granted

- [ ] User taps "Allow"
- [ ] Permission granted successfully
- [ ] Expo push token generated
- [ ] Token format: ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]
- [ ] Token registered with backend via API
- [ ] POST /api/accounts/register-push-token called
- [ ] Token saved in database (PushToken model)
- [ ] deviceType set correctly (ios or android)
- [ ] isActive set to true
- [ ] Success logged in console

### Permission Denied

- [ ] User taps "Don't Allow"
- [ ] Permission denied
- [ ] Alert shown: "Notification permissions are required"
- [ ] Option to open settings
- [ ] App continues functioning without notifications
- [ ] No push token generated
- [ ] User can enable later in settings

### Permission Already Granted

- [ ] App launches with permission already granted
- [ ] No permission alert shown
- [ ] Push token retrieved immediately
- [ ] Token registered/refreshed with backend
- [ ] Existing token updated if changed

### Re-requesting Permission

- [ ] Navigate to notification settings
- [ ] Tap "Enable Notifications" button
- [ ] Permission request shown again
- [ ] Can grant permission from settings
- [ ] Token registered after granting

---

## 2. Push Token Registration

**File**: Backend - `accounts/api.py` (POST /register-push-token)

### Token Registration API

- [ ] Endpoint: POST /api/accounts/register-push-token
- [ ] Requires authentication (cookie_auth)
- [ ] Request body includes:
  - pushToken: string (ExponentPushToken[...])
  - deviceType: "ios" or "android"
- [ ] Returns 200 OK on success
- [ ] Response includes token_id
- [ ] PushToken record created in database

### Token Storage

- [ ] Token linked to authenticated user (accountFK)
- [ ] deviceType stored correctly
- [ ] isActive set to true
- [ ] createdAt timestamp set
- [ ] updatedAt timestamp set
- [ ] lastUsed timestamp set

### Duplicate Token Handling

- [ ] Registering same token twice updates existing record
- [ ] updatedAt timestamp updated
- [ ] lastUsed timestamp updated
- [ ] No duplicate tokens created
- [ ] Old tokens deactivated (isActive = false) if new token for same device

### Multiple Devices

- [ ] User logs in on Device A
- [ ] Token A registered
- [ ] User logs in on Device B
- [ ] Token B registered
- [ ] Both tokens active simultaneously
- [ ] Notifications sent to both devices

### Token Refresh

- [ ] Token refreshes periodically (Expo handles)
- [ ] New token registered with backend
- [ ] Old token deactivated
- [ ] No duplicate active tokens per device

---

## 3. In-App Notification List Screen

**File**: `app/notifications/index.tsx` (290 lines)

### Screen Access & Navigation

- [ ] Navigate from profile screen (notification bell icon)
- [ ] Navigate from bottom tab (if added)
- [ ] URL format: `/notifications`
- [ ] Header shows "Notifications"
- [ ] Back button returns to previous screen

### Notification Bell Icon (Profile Screen)

- [ ] Bell icon visible in profile screen header
- [ ] Icon uses Ionicons bell-outline
- [ ] Badge displays unread count (if > 0)
- [ ] Badge red background with white text
- [ ] Badge positioned at top-right of bell icon
- [ ] Tapping bell navigates to notifications screen
- [ ] Badge count updates in real-time

### Filter Tabs

- [ ] Two filter tabs: "All" and "Unread"
- [ ] "All" tab selected by default
- [ ] Active tab highlighted (blue background or underline)
- [ ] Inactive tab has white/gray background
- [ ] Tapping tab switches filter
- [ ] Tab switch smooth (no flicker)

### All Filter

- [ ] Shows all notifications (read + unread)
- [ ] Notifications sorted by date (latest first)
- [ ] Read notifications have lighter appearance
- [ ] Unread notifications have white background
- [ ] Both types display correctly

### Unread Filter

- [ ] Shows only unread notifications
- [ ] Unread notifications highlighted
- [ ] Count matches unread badge
- [ ] Empty state if no unread

### Notifications List Display

- [ ] All notifications render in list
- [ ] Each notification uses NotificationCard component
- [ ] Notifications separated by subtle border/shadow
- [ ] Scrolling smooth (60fps)
- [ ] List virtualized for performance (FlatList)

### Pull-to-Refresh

- [ ] Pull down gesture triggers refresh
- [ ] Refresh indicator shows
- [ ] Notifications reload from backend
- [ ] New notifications appear after refresh
- [ ] Unread count updates
- [ ] Refresh completes in < 2 seconds

### Empty States

- [ ] Empty state for no notifications (All filter)
- [ ] Shows bell icon (64px)
- [ ] Message: "No notifications yet"
- [ ] Subtext: "You'll see updates here"
- [ ] Empty state for no unread (Unread filter)
- [ ] Shows checkmark icon
- [ ] Message: "You're all caught up!"
- [ ] Subtext: "No unread notifications"

### Loading States

- [ ] Loading spinner on initial load
- [ ] Loading message: "Loading notifications..."
- [ ] Skeleton loaders for notification cards (optional)

### Unread Count Badge

- [ ] Badge displays unread count
- [ ] Count accurate (matches backend)
- [ ] Badge hidden if count = 0
- [ ] Badge updates in real-time
- [ ] Maximum display: "99+" for counts > 99

---

## 4. Notification Card Component

**File**: `components/Notifications/NotificationCard.tsx` (265 lines)

### Card Display

- [ ] Notification card renders correctly
- [ ] Card has padding and border
- [ ] Unread cards have white background
- [ ] Read cards have gray/lighter background
- [ ] Card shadow/elevation visible
- [ ] Cards separated by margin

### Icon Display

- [ ] Notification type icon displays on left
- [ ] Icon size 40-48px
- [ ] Icon color matches notification type:
  - KYC: Blue
  - Job Applications: Green
  - Job Status: Purple
  - Payments: Gold/Yellow
  - Messages: Blue
  - Reviews: Orange/Star color
- [ ] Icon uses correct Ionicons name per type

### Notification Content

- [ ] Title displays (bold, 14-16px)
- [ ] Message displays below title (regular, 12-14px)
- [ ] Text wraps properly for long messages
- [ ] Text readable with good contrast
- [ ] Multiline messages display correctly

### Timestamp

- [ ] Timestamp displays at bottom right
- [ ] Format: "Just now", "5m ago", "2h ago", "Yesterday", "Nov 15"
- [ ] Uses relative time (< 24h ago)
- [ ] Uses absolute date (>= 24h ago)
- [ ] Timestamp in light gray
- [ ] Small font size (11-12px)

### Unread Indicator

- [ ] Unread dot/badge displays for unread notifications
- [ ] Blue dot positioned at top-right or left of title
- [ ] Dot size 8-10px
- [ ] Dot disappears when notification marked read

### Card Actions

- [ ] Tapping card triggers action
- [ ] If notification has deep link, navigates to target screen
- [ ] If no deep link, marks as read only
- [ ] Haptic feedback on tap (iOS/Android)
- [ ] Card highlights on tap (visual feedback)

### Mark as Read Action

- [ ] Swipe gesture reveals "Mark Read" button (iOS)
- [ ] Long press shows context menu (Android)
- [ ] Context menu shows "Mark as Read" option
- [ ] Tapping "Mark Read" marks notification read
- [ ] Card appearance changes to read state
- [ ] Unread count decrements
- [ ] API call: POST /notifications/{id}/mark-read

### Delete Action

- [ ] Swipe gesture reveals "Delete" button (iOS)
- [ ] Long press shows "Delete" option (Android)
- [ ] Tapping "Delete" shows confirmation alert
- [ ] Alert: "Delete this notification?"
- [ ] Confirm delete removes notification from list
- [ ] API call: DELETE /notifications/{id}/delete
- [ ] Notification removed from backend

### Notification Types Display

**KYC Approved:**
- [ ] Icon: checkmark-circle (green)
- [ ] Title: "KYC Approved"
- [ ] Message: "Your KYC verification has been approved"

**KYC Rejected:**
- [ ] Icon: close-circle (red)
- [ ] Title: "KYC Rejected"
- [ ] Message: "Your KYC verification was rejected. Please resubmit."

**Job Application Received:**
- [ ] Icon: briefcase (blue)
- [ ] Title: "New Job Application"
- [ ] Message: "[Worker Name] applied to your job '[Job Title]'"

**Job Application Accepted:**
- [ ] Icon: checkmark-circle (green)
- [ ] Title: "Application Accepted"
- [ ] Message: "Your application for '[Job Title]' was accepted"

**Job Application Rejected:**
- [ ] Icon: close-circle (red)
- [ ] Title: "Application Rejected"
- [ ] Message: "Your application for '[Job Title]' was not accepted"

**Job Started:**
- [ ] Icon: play-circle (purple)
- [ ] Title: "Job Started"
- [ ] Message: "Job '[Job Title]' has been started"

**Job Completed (Worker):**
- [ ] Icon: checkmark-done (green)
- [ ] Title: "Job Completed"
- [ ] Message: "You marked job '[Job Title]' as complete"

**Job Completed (Client):**
- [ ] Icon: checkmark-done (green)
- [ ] Title: "Job Completed"
- [ ] Message: "Client accepted completion of '[Job Title]'"

**Job Cancelled:**
- [ ] Icon: trash (red)
- [ ] Title: "Job Cancelled"
- [ ] Message: "Job '[Job Title]' has been cancelled"

**Payment Received:**
- [ ] Icon: cash (gold)
- [ ] Title: "Payment Received"
- [ ] Message: "You received ₱X,XXX for '[Job Title]'"

**Escrow Payment:**
- [ ] Icon: wallet (gold)
- [ ] Title: "Escrow Payment"
- [ ] Message: "Escrow payment of ₱X,XXX received for '[Job Title]'"

**Final Payment:**
- [ ] Icon: cash (gold)
- [ ] Title: "Final Payment"
- [ ] Message: "Final payment of ₱X,XXX received for '[Job Title]'"

**Payment Released:**
- [ ] Icon: send (gold)
- [ ] Title: "Payment Released"
- [ ] Message: "Payment released for '[Job Title]'"

**New Message:**
- [ ] Icon: chatbubble (blue)
- [ ] Title: "New Message"
- [ ] Message: "[Sender Name]: [Message preview]"

**Review Received:**
- [ ] Icon: star (orange)
- [ ] Title: "New Review"
- [ ] Message: "[Reviewer Name] left you a X-star review"

---

## 5. Notification Settings Screen

**File**: `app/notifications/settings.tsx` (380 lines)

### Screen Access

- [ ] Navigate from profile menu
- [ ] Navigate from notifications screen (gear icon)
- [ ] URL format: `/notifications/settings`
- [ ] Header shows "Notification Settings"
- [ ] Back button returns to previous screen

### Global Push Toggle

- [ ] "Enable Push Notifications" toggle at top
- [ ] Toggle reflects current setting (on/off)
- [ ] Toggle synchronized with backend
- [ ] Tapping toggle updates state immediately
- [ ] API call: PUT /notification-settings with pushEnabled
- [ ] Success toast on update
- [ ] When disabled, no push notifications sent
- [ ] When enabled, notifications resume

### Sound Toggle

- [ ] "Enable Sound" toggle displayed
- [ ] Toggle reflects current setting
- [ ] Tapping toggle updates sound preference
- [ ] API call: PUT /notification-settings with soundEnabled
- [ ] When enabled, notifications play sound
- [ ] When disabled, notifications silent
- [ ] Sound setting persists

### Category Toggles

**Job Updates:**
- [ ] "Job Updates" toggle displayed
- [ ] Label: "Applications, status changes, completions"
- [ ] Toggle controls job-related notifications
- [ ] API call updates jobUpdates field

**Messages:**
- [ ] "Messages" toggle displayed
- [ ] Label: "New messages and chat updates"
- [ ] Toggle controls message notifications
- [ ] API call updates messages field

**Payments:**
- [ ] "Payments" toggle displayed
- [ ] Label: "Payment receipts and wallet updates"
- [ ] Toggle controls payment notifications
- [ ] API call updates payments field

**Reviews:**
- [ ] "Reviews" toggle displayed
- [ ] Label: "Reviews and ratings"
- [ ] Toggle controls review notifications
- [ ] API call updates reviews field

**KYC Updates:**
- [ ] "KYC Updates" toggle displayed
- [ ] Label: "Verification status changes"
- [ ] Toggle controls KYC notifications
- [ ] API call updates kycUpdates field

### All Category Toggles Work

- [ ] Each toggle updates independently
- [ ] Settings persist after app restart
- [ ] Backend settings match UI state
- [ ] Disabling category stops those notifications
- [ ] Enabling category resumes those notifications

### Do Not Disturb Section

- [ ] "Do Not Disturb" section header displayed
- [ ] Description: "Mute notifications during these hours"
- [ ] Start time picker displayed
- [ ] End time picker displayed
- [ ] Time pickers use native UI (iOS wheel, Android dialog)

### Start Time Picker

- [ ] Tapping "Start Time" opens time picker
- [ ] Time picker shows current start time
- [ ] Can select any time (12:00 AM to 11:59 PM)
- [ ] Selected time displays in field
- [ ] Format: "10:00 PM" or "22:00" (based on device locale)
- [ ] Time saved on selection
- [ ] API call: PUT /notification-settings with doNotDisturbStart

### End Time Picker

- [ ] Tapping "End Time" opens time picker
- [ ] Time picker shows current end time
- [ ] Can select any time
- [ ] Selected time displays in field
- [ ] Format: "7:00 AM" or "07:00"
- [ ] Time saved on selection
- [ ] API call: PUT /notification-settings with doNotDisturbEnd

### Do Not Disturb Logic

- [ ] DND period enforced (start time to end time)
- [ ] Notifications muted during DND hours
- [ ] Notifications resume after DND period
- [ ] Handles overnight DND (e.g., 10 PM to 7 AM)
- [ ] Current time checked against DND window
- [ ] DND status visible in UI (optional indicator)

### Settings Persistence

- [ ] All settings saved to backend immediately
- [ ] Settings retrieved on screen load
- [ ] GET /notification-settings called on mount
- [ ] Settings persist across app restarts
- [ ] Settings synchronized across devices (same user)

### Loading States

- [ ] Loading spinner while fetching settings
- [ ] Settings toggles disabled during load
- [ ] Skeleton loaders for toggle rows (optional)

### Error Handling

- [ ] Network error shows error message
- [ ] Error toast: "Failed to update settings"
- [ ] Can retry update
- [ ] UI reverts to previous state on error

---

## 6. Push Notification Reception

**File**: `lib/services/notificationService.ts` (285 lines)

### Foreground Notifications

- [ ] Notification received while app in foreground
- [ ] In-app banner displays at top of screen
- [ ] Banner shows notification icon, title, message
- [ ] Banner displays for 3-5 seconds
- [ ] Banner auto-dismisses
- [ ] Can swipe up to dismiss early
- [ ] Tapping banner navigates to relevant screen
- [ ] Sound plays if sound enabled
- [ ] Vibration if enabled

### Background Notifications

- [ ] Notification received while app in background
- [ ] System notification appears in notification center
- [ ] Notification shows app icon, title, message
- [ ] Notification grouped by app
- [ ] Sound plays if sound enabled
- [ ] Vibration if enabled (Android)
- [ ] Badge count updates (iOS)

### Notification Tap Handling

- [ ] Tapping notification opens app
- [ ] App navigates to relevant screen (deep link)
- [ ] Notification marked as read automatically
- [ ] Unread count decrements
- [ ] Deep link extracts data from notification payload
- [ ] Navigation smooth (no crash)

### Notification Sound

- [ ] Sound plays when notification received (if enabled)
- [ ] Sound is notification.wav (custom sound)
- [ ] Sound plays on iOS
- [ ] Sound plays on Android
- [ ] Sound respects device volume
- [ ] Sound muted if sound setting disabled
- [ ] Sound muted during DND hours

### Badge Management (iOS)

- [ ] App icon badge shows unread count
- [ ] Badge updates when notification received
- [ ] Badge decrements when notification read
- [ ] Badge clears when all notifications read
- [ ] Badge persists after app close

### Android Notification Channels

**6 Notification Channels:**
1. **Default Channel:**
   - [ ] Channel ID: "default"
   - [ ] Name: "General Notifications"
   - [ ] Importance: DEFAULT
   - [ ] Sound enabled

2. **Job Updates Channel:**
   - [ ] Channel ID: "job_updates"
   - [ ] Name: "Job Updates"
   - [ ] Description: "Notifications about job applications and status"
   - [ ] Importance: HIGH
   - [ ] Sound enabled

3. **Messages Channel:**
   - [ ] Channel ID: "messages"
   - [ ] Name: "Messages"
   - [ ] Description: "New message notifications"
   - [ ] Importance: HIGH
   - [ ] Sound enabled

4. **Payments Channel:**
   - [ ] Channel ID: "payments"
   - [ ] Name: "Payments"
   - [ ] Description: "Payment and wallet notifications"
   - [ ] Importance: HIGH
   - [ ] Sound enabled

5. **Reviews Channel:**
   - [ ] Channel ID: "reviews"
   - [ ] Name: "Reviews"
   - [ ] Description: "Review and rating notifications"
   - [ ] Importance: DEFAULT
   - [ ] Sound enabled

6. **KYC Channel:**
   - [ ] Channel ID: "kyc"
   - [ ] Name: "KYC Updates"
   - [ ] Description: "Verification status updates"
   - [ ] Importance: DEFAULT
   - [ ] Sound enabled

### Channel Configuration

- [ ] All channels created on app launch
- [ ] Channels visible in Android settings
- [ ] User can customize each channel (sound, vibration, etc.)
- [ ] Notifications routed to correct channel based on type
- [ ] Channel importance respected

---

## 7. Deep Linking & Navigation

**File**: `lib/utils/deepLinkHandler.ts` (160 lines)

### Deep Link Handling

- [ ] Deep links extracted from notification payload
- [ ] Notification data includes: type, targetId, targetScreen
- [ ] Deep link handler parses notification data
- [ ] Navigates to correct screen based on type

### KYC Notifications

- [ ] KYC Approved notification taps navigate to KYC screen
- [ ] KYC Rejected notification taps navigate to KYC screen
- [ ] URL: `/kyc` or `/profile/kyc`
- [ ] Screen displays KYC status

### Job Application Notifications

- [ ] Job Application Received taps navigate to application details
- [ ] URL: `/applications/browse`
- [ ] Job Application Accepted taps navigate to job details
- [ ] URL: `/jobs/active/[jobId]`
- [ ] Job Application Rejected taps navigate to applications screen

### Job Status Notifications

- [ ] Job Started taps navigate to active job details
- [ ] URL: `/jobs/active/[jobId]`
- [ ] Job Completed notifications navigate to job details
- [ ] Job Cancelled notifications navigate to job details

### Payment Notifications

- [ ] Payment Received taps navigate to payment timeline
- [ ] URL: `/payments/timeline/[jobId]`
- [ ] Escrow Payment taps navigate to payment timeline
- [ ] Final Payment taps navigate to payment timeline
- [ ] Payment Released taps navigate to wallet or payment history
- [ ] URL: `/payments/history` or `/wallet`

### Message Notifications

- [ ] New Message taps navigate to chat screen
- [ ] URL: `/messages/[conversationId]`
- [ ] Opens specific conversation
- [ ] Scrolls to latest message

### Review Notifications

- [ ] Review Received taps navigate to my reviews screen
- [ ] URL: `/reviews/my-reviews`
- [ ] Opens "Received" tab automatically
- [ ] Highlights new review (optional)

### Navigation Error Handling

- [ ] Invalid notification data handled gracefully
- [ ] Missing targetId handled (fallback to home)
- [ ] Non-existent resources handled (404 screen or back)
- [ ] Navigation errors logged
- [ ] User sees fallback screen (notifications list)

### Deep Link Validation

- [ ] Validates notification type before navigation
- [ ] Validates targetId exists
- [ ] Checks user has permission to view target
- [ ] Handles race conditions (data not loaded yet)

---

## 8. Notification Backend API

**File**: Backend - `accounts/api.py` (notification endpoints)

### GET /api/accounts/notifications

#### Authentication

- [ ] Requires authentication (cookie_auth)
- [ ] Unauthenticated returns 401

#### Query Parameters

- [ ] limit: integer, default 50, max 100
- [ ] unread_only: boolean, default false

#### Response

- [ ] Returns 200 OK
- [ ] Response includes notifications array
- [ ] Each notification includes:
  - notification_id, title, message
  - type, is_read
  - created_at, target_id, target_screen
- [ ] Notifications sorted by date (latest first)
- [ ] Pagination supported (optional)

#### Filtering

- [ ] unread_only=true returns only unread
- [ ] unread_only=false returns all notifications
- [ ] Limit enforced (max 100)

### POST /api/accounts/notifications/{id}/mark-read

#### Authentication

- [ ] Requires authentication
- [ ] User can only mark own notifications

#### Success Response

- [ ] Returns 200 OK
- [ ] Notification is_read set to true in database
- [ ] Success message returned

#### Error Responses

- [ ] 404 if notification not found
- [ ] 403 if not user's notification

### POST /api/accounts/notifications/mark-all-read

#### Authentication

- [ ] Requires authentication

#### Success Response

- [ ] Returns 200 OK
- [ ] All user's notifications marked read
- [ ] Response includes count of notifications marked
- [ ] Example: { "marked_count": 12 }

### GET /api/accounts/notifications/unread-count

#### Authentication

- [ ] Requires authentication

#### Response

- [ ] Returns 200 OK
- [ ] Response: { "unread_count": 5 }
- [ ] Count accurate
- [ ] Fast query (< 100ms)

### DELETE /api/accounts/notifications/{id}/delete

#### Authentication

- [ ] Requires authentication
- [ ] User can only delete own notifications

#### Success Response

- [ ] Returns 200 OK
- [ ] Notification deleted from database (soft delete or hard delete)
- [ ] Success message returned

#### Error Responses

- [ ] 404 if notification not found
- [ ] 403 if not user's notification

### GET /api/accounts/notification-settings

#### Authentication

- [ ] Requires authentication

#### Response

- [ ] Returns 200 OK
- [ ] Response includes NotificationSettings object:
  - pushEnabled, soundEnabled
  - jobUpdates, messages, payments, reviews, kycUpdates
  - doNotDisturbStart, doNotDisturbEnd
- [ ] Default settings created if none exist

### PUT /api/accounts/notification-settings

#### Authentication

- [ ] Requires authentication

#### Request Body

- [ ] Accepts partial settings object
- [ ] Can update any combination of fields
- [ ] Example: { "pushEnabled": false, "soundEnabled": true }

#### Success Response

- [ ] Returns 200 OK
- [ ] Settings updated in database
- [ ] Response includes updated settings object

#### Validation

- [ ] Boolean fields validated
- [ ] Time fields validated (HH:MM format)
- [ ] Invalid data rejected with 400 error

---

## 9. Notification Context Provider

**File**: `context/NotificationContext.tsx` (140 lines)

### Context Setup

- [ ] NotificationProvider wraps app in _layout.tsx
- [ ] Context provides unread count state
- [ ] Context provides refresh function
- [ ] Context accessible via useNotificationContext hook

### Unread Count State

- [ ] Unread count fetched on app launch
- [ ] GET /notifications/unread-count called
- [ ] Count stored in context state
- [ ] Count accessible throughout app

### Real-Time Updates

- [ ] Unread count updates when notification received
- [ ] Unread count decrements when notification marked read
- [ ] Unread count updates when navigating to notifications screen
- [ ] Count synchronized across all screens

### Refresh Function

- [ ] Context provides refreshNotifications() function
- [ ] Calling refresh refetches unread count
- [ ] Refresh function callable from any component
- [ ] Refresh triggers re-render with new count

### Badge Display

- [ ] Unread count displayed in notification bell badge
- [ ] Badge hidden if count = 0
- [ ] Badge shows "99+" if count > 99
- [ ] Badge color red with white text

---

## 10. Integration Testing

### End-to-End Notification Flow

**KYC Approval:**
- [ ] Admin approves KYC in backend
- [ ] Push notification sent to user's device
- [ ] Notification appears in system tray
- [ ] Notification shows: "KYC Approved"
- [ ] User taps notification
- [ ] App opens to KYC screen
- [ ] Screen shows "Approved" status
- [ ] Notification marked as read
- [ ] Unread count decrements

**Job Application Received:**
- [ ] Worker applies to client's job
- [ ] Push notification sent to client
- [ ] Notification appears: "New Job Application"
- [ ] Client taps notification
- [ ] App opens to application details
- [ ] Client sees worker's application
- [ ] Notification marked as read

**Payment Received:**
- [ ] Client pays worker via escrow
- [ ] Push notification sent to worker
- [ ] Notification appears: "Payment Received"
- [ ] Shows amount: "₱5,000"
- [ ] Worker taps notification
- [ ] App opens to payment timeline
- [ ] Timeline shows escrow payment
- [ ] Notification marked as read

**New Message:**
- [ ] Client sends message to worker
- [ ] Push notification sent to worker
- [ ] Notification appears: "New Message"
- [ ] Shows sender name and message preview
- [ ] Worker taps notification
- [ ] App opens to chat screen
- [ ] Chat shows new message
- [ ] Notification marked as read

**Review Received:**
- [ ] Client leaves 5-star review for worker
- [ ] Push notification sent to worker
- [ ] Notification appears: "New Review"
- [ ] Shows reviewer name and rating
- [ ] Worker taps notification
- [ ] App opens to my reviews screen
- [ ] Review displayed in "Received" tab
- [ ] Notification marked as read

### Mark All as Read Flow

- [ ] User has 10 unread notifications
- [ ] Unread badge shows "10"
- [ ] Navigate to notifications screen
- [ ] Tap "Mark All as Read" button (if exists)
- [ ] All notifications marked read
- [ ] API call: POST /notifications/mark-all-read
- [ ] Unread count becomes 0
- [ ] Badge disappears
- [ ] Notification cards change to read appearance

### Settings Sync Flow

- [ ] User disables "Messages" notifications
- [ ] Setting saved to backend
- [ ] New message sent to user
- [ ] No push notification received
- [ ] Message still visible in app (just no push)
- [ ] User enables "Messages" notifications
- [ ] New message sent
- [ ] Push notification received

### Do Not Disturb Flow

- [ ] User sets DND hours: 10 PM to 7 AM
- [ ] Current time is 11 PM (within DND)
- [ ] Notification sent from backend
- [ ] No push notification shown (muted)
- [ ] Notification still saved in database
- [ ] User opens app at 8 AM (after DND)
- [ ] Notifications visible in list
- [ ] Push notifications resume

---

## 11. Performance Testing

### Load Performance

- [ ] Notifications screen loads in < 2 seconds (50 notifications)
- [ ] Unread count query completes in < 100ms
- [ ] Settings screen loads in < 1 second
- [ ] Mark as read action completes in < 500ms
- [ ] Delete notification completes in < 500ms

### Memory Usage

- [ ] Notifications screen with 100 notifications uses < 100MB
- [ ] No memory leaks from notification listeners
- [ ] Memory stable after receiving 50+ notifications

### Battery Impact

- [ ] App doesn't significantly drain battery
- [ ] Push token registration once per session
- [ ] Notification listeners don't prevent idle
- [ ] Background refresh respects system limits

### Network Efficiency

- [ ] Notification fetch uses pagination (limit 50)
- [ ] Unread count query lightweight
- [ ] Settings update single API call
- [ ] No unnecessary polling for notifications

---

## 12. Platform-Specific Testing

### iOS Testing

- [ ] APNs notifications display correctly
- [ ] Badge count updates on app icon
- [ ] Notification sound plays
- [ ] Notification banner shows at top
- [ ] Swipe to dismiss works
- [ ] Notification Center shows notifications
- [ ] 3D Touch/Long press shows actions (optional)
- [ ] Safe areas respected (notch)
- [ ] Time picker uses iOS wheel

### Android Testing

- [ ] FCM notifications display correctly
- [ ] Notification channels configured
- [ ] Each channel has correct name/description
- [ ] User can customize channels in Android settings
- [ ] Notification sound plays
- [ ] Notification appears in notification shade
- [ ] Grouped by app
- [ ] Swipe to dismiss works
- [ ] Action buttons (optional)
- [ ] Time picker uses Android dialog

---

## 13. Accessibility Testing

### Screen Readers

- [ ] Notification cards have accessible labels
- [ ] Badge count announced ("5 unread notifications")
- [ ] Toggle switches have labels
- [ ] Time pickers have labels
- [ ] Buttons have accessible labels

### Font Scaling

- [ ] Text readable at 200% font scale
- [ ] Layout doesn't break with large text
- [ ] Notification cards adjust for large text

### Color Contrast

- [ ] Text meets WCAG AA contrast ratio
- [ ] Icons visible against backgrounds
- [ ] Badge colors distinguishable
- [ ] Toggle switches visible

---

## 14. Security Testing

### Authentication

- [ ] Unauthenticated users cannot fetch notifications
- [ ] Cannot register push token without auth
- [ ] Cannot access other users' notifications
- [ ] Cannot mark other users' notifications as read

### Authorization

- [ ] Users only see their own notifications
- [ ] Cannot delete other users' notifications
- [ ] Settings changes only affect own account

### Data Privacy

- [ ] Sensitive data not included in push payload
- [ ] Notification content sanitized
- [ ] Deep links validated before navigation

### Token Security

- [ ] Push tokens stored securely in database
- [ ] Tokens hashed or encrypted (if applicable)
- [ ] Tokens expire and refresh
- [ ] Old tokens deactivated

---

## 15. Edge Cases & Error Scenarios

### Permission States

- [ ] Permission never requested (ask on launch)
- [ ] Permission denied (show settings prompt)
- [ ] Permission granted (register token)
- [ ] Permission revoked later (handle gracefully)

### Network Scenarios

- [ ] Fetch notifications offline (show cached data)
- [ ] Mark as read offline (queue for later)
- [ ] Settings update offline (queue for later)
- [ ] Network error shows error message
- [ ] Retry after network restored

### Device States

- [ ] App in foreground (show in-app banner)
- [ ] App in background (show system notification)
- [ ] App terminated (push wakes app)
- [ ] Device locked (notification on lock screen)
- [ ] Low battery mode (notifications still work)

### Notification Data

- [ ] Notification with missing data (handle gracefully)
- [ ] Notification with invalid type (skip or show generic)
- [ ] Notification with deleted target (show error or fallback)
- [ ] Very long notification title/message (truncate)

### User States

- [ ] User logs out (deactivate tokens)
- [ ] User deletes account (remove tokens)
- [ ] User has multiple devices (all receive notifications)
- [ ] User reinstalls app (re-register token)

### Timing Issues

- [ ] Notification received before app fully loaded
- [ ] Rapid notifications (queue processing)
- [ ] DND period crosses midnight (10 PM to 7 AM)
- [ ] DND start = end time (24-hour DND)

---

## 16. Known Limitations Testing

### Features NOT Implemented

- [ ] Rich notification actions (quick reply, accept/reject)
- [ ] Notification preview images (only text)
- [ ] Custom sound per notification type
- [ ] Notification snoozing
- [ ] Notification batching (multiple combined)
- [ ] Local scheduled notifications
- [ ] Notification analytics (open rates)

### Expected Behavior

- [ ] Notifications show title and message only
- [ ] No inline action buttons
- [ ] No image thumbnails
- [ ] All notifications use same sound
- [ ] Cannot snooze notifications
- [ ] Cannot schedule local notifications

---

## 17. Regression Testing

### Previous Phases Still Work

- [ ] Job browsing (Phase 1) works
- [ ] Job application (Phase 1) works
- [ ] Job completion (Phase 2) works
- [ ] Escrow payments (Phase 3) work
- [ ] Final payments (Phase 4) work
- [ ] Real-time chat (Phase 5) works
- [ ] Profile management (Phase 6) works
- [ ] KYC upload (Phase 7) works
- [ ] Reviews & ratings (Phase 8) work
- [ ] Notifications don't break other features

---

## 18. Deployment Testing

### Pre-Deployment Checklist

**iOS Configuration:**
- [ ] APNs certificates uploaded to Expo
- [ ] Bundle identifier configured in app.json
- [ ] Expo project ID set
- [ ] Test on physical iOS device
- [ ] Production build receives notifications

**Android Configuration:**
- [ ] FCM server key configured
- [ ] google-services.json added (if standalone)
- [ ] Package name configured in app.json
- [ ] Test notification channels on Android
- [ ] Production build receives notifications

**Backend Configuration:**
- [ ] PushToken migration run
- [ ] NotificationSettings migration run
- [ ] Default settings created for existing users
- [ ] Expo push notification sender configured
- [ ] Notification templates ready

### Production Testing

- [ ] Notifications work in production build
- [ ] Notifications work over cellular network
- [ ] Notifications work in different countries (if applicable)
- [ ] Rate limiting prevents spam (if applicable)
- [ ] Notification delivery rate monitored

---

## Test Completion Checklist

- [ ] All test cases executed
- [ ] All critical issues documented
- [ ] Screenshots captured for visual issues
- [ ] Performance metrics recorded
- [ ] Test report created
- [ ] Bugs logged in issue tracker
- [ ] QA sign-off obtained
- [ ] Production deployment approved

---

**Total Test Cases**: 300+
**Estimated Testing Time**: 10-15 hours
**Priority**: CRITICAL (Final phase, release blocker)
**Status**: ⏳ Awaiting QA Execution

---

**Special Notes for QA Team:**

1. **Physical Device Required**: Push notifications CANNOT be tested on simulators. You MUST use real iOS and Android devices.

2. **Expo vs Standalone**: Test both Expo Go (development) and standalone builds (production-like) for comprehensive coverage.

3. **Backend Coordination**: Work with backend team to trigger test notifications of all 14 types.

4. **Multi-Device Testing**: Test with multiple devices logged into same account to verify multi-device token handling.

5. **Time-Based Testing**: Test DND feature at actual scheduled times or modify device clock.

6. **Permission Testing**: Uninstall and reinstall app to test fresh permission flow.

7. **Production Readiness**: This is the FINAL mobile phase. Thorough testing critical before release.

---

**Generated for Phase 9 - Push Notifications System**
**iAyos Mobile Application - 100% Complete** 🎉
