# [Mobile] Phase 9: Comprehensive Notifications System

**Labels:** `priority:medium`, `type:feature`, `area:mobile`, `area:notifications`
**Priority:** MEDIUM
**Estimated Time:** 60-80 hours

## Summary
Implement comprehensive in-app and push notification system covering all user interactions and job lifecycle events.

## Tasks

### Push Notification Setup
- [ ] Integrate Firebase Cloud Messaging (FCM)
- [ ] Configure iOS APNs certificates
- [ ] Implement FCM token registration
- [ ] Store device tokens in backend
- [ ] Handle token refresh
- [ ] Configure notification channels (Android)

### In-App Notifications
- [ ] Create NotificationsScreen listing all notifications
- [ ] Display notification icon with unread count badge
- [ ] Implement notification card component
- [ ] Add notification grouping by type
- [ ] Show notification timestamps (relative)
- [ ] Add mark as read functionality
- [ ] Implement mark all as read
- [ ] Add notification deletion

### Notification Types Implementation
- [ ] KYC notifications (approved/rejected)
- [ ] Job application notifications
  - [ ] Application received (client)
  - [ ] Application accepted (worker)
  - [ ] Application rejected (worker)
- [ ] Job status notifications
  - [ ] Job started
  - [ ] Job marked complete by worker
  - [ ] Job approved by client
- [ ] Payment notifications
  - [ ] Escrow payment received
  - [ ] Final payment received
  - [ ] Payment released to wallet
- [ ] Chat notifications
  - [ ] New message
  - [ ] Typing indicator
- [ ] Review notifications
  - [ ] New review received
  - [ ] Review response

### Push Notification Handling
- [ ] Handle foreground notifications
- [ ] Handle background notifications
- [ ] Handle notification taps (deep linking)
- [ ] Route to appropriate screen on tap
- [ ] Show notification banners
- [ ] Play notification sounds
- [ ] Implement vibration patterns

### Notification Settings
- [ ] Create NotificationSettingsScreen
- [ ] Add toggle for push notifications
- [ ] Add per-category notification toggles
  - [ ] Job updates
  - [ ] Messages
  - [ ] Payments
  - [ ] Reviews
  - [ ] KYC updates
- [ ] Add sound settings
- [ ] Add do-not-disturb schedule
- [ ] Persist settings to backend

### Notification Actions
- [ ] Implement quick actions from notifications
  - [ ] Reply to message
  - [ ] View job details
  - [ ] Accept application
- [ ] Add action buttons to notifications
- [ ] Handle action callbacks

### Badge Management
- [ ] Update app icon badge count
- [ ] Show unread count on notifications tab
- [ ] Show unread messages count on chat tab
- [ ] Clear badge on app open
- [ ] Update badge in real-time

## Files to Create
- `lib/screens/notifications/notifications_screen.dart` - Notification list
- `lib/screens/notifications/notification_settings_screen.dart` - Settings
- `lib/components/notification_card.dart` - Notification item
- `lib/components/notification_badge.dart` - Badge component
- `lib/services/fcm_service.dart` - Firebase messaging
- `lib/services/notification_service.dart` - Notification API
- `lib/models/notification.dart` - Notification model
- `lib/providers/notification_provider.dart` - Notification state
- `lib/utils/notification_handler.dart` - Notification handling
- `lib/utils/deep_link_handler.dart` - Deep linking

## API Endpoints to Integrate
- `GET /api/accounts/notifications` - Get notifications
- `POST /api/accounts/notifications/{id}/read` - Mark as read
- `POST /api/accounts/notifications/read-all` - Mark all read
- `GET /api/accounts/unread-count` - Get unread count
- `POST /api/accounts/device-token` - Register FCM token
- `PUT /api/accounts/notification-settings` - Update settings

## Acceptance Criteria
- [ ] Push notifications work on Android and iOS
- [ ] In-app notifications display correctly
- [ ] Unread badge counts update in real-time
- [ ] Notification taps route to correct screens
- [ ] All notification types are implemented
- [ ] Notification settings persist correctly
- [ ] Quick actions work from notifications
- [ ] Sounds and vibrations work as configured
- [ ] FCM tokens register and refresh correctly

## Dependencies
- **Requires:** All previous phases (notifications for each feature)
- **Integrates with:** All app features

## Testing
- [ ] Test push notifications on Android/iOS
- [ ] Test foreground/background notification handling
- [ ] Test notification tap routing
- [ ] Test notification settings toggles
- [ ] Verify badge count accuracy
- [ ] Test quick actions
- [ ] Test do-not-disturb schedule
- [ ] Verify FCM token registration

---
Generated with Claude Code
