# Mobile UI Redesign - Complete Full Redesign QA Checklist

**Feature:** Complete UI Redesign for all 37+ Mobile Screens
**Platform:** React Native (Expo)
**Date Created:** November 16, 2025
**QA Status:** NOT STARTED

---

## Overview

This QA checklist covers the complete UI redesign of the iAyos mobile application, ensuring all 37+ screens match the Next.js web design, function correctly, and provide an excellent user experience.

---

## Design System Verification

### Theme Consistency
- [ ] Primary color (#3B82F6) used consistently across all screens
- [ ] Typography sizes match theme.ts specifications
- [ ] Spacing follows Spacing constants from theme.ts
- [ ] Border radius values consistent (6-10px range)
- [ ] Shadows match theme.ts shadow system
- [ ] Focus rings appear on input focus

### Component Usage
- [ ] All screens use base UI components (Button, Input, Card, Badge)
- [ ] All screens use utility components where appropriate (SearchBar, FilterChip, etc.)
- [ ] No hardcoded colors (all from theme.ts)
- [ ] No hardcoded spacing values (all from theme.ts)
- [ ] No hardcoded typography (all from theme.ts)

---

## PHASE 1: Job Browsing & Discovery

### Browse Jobs Screen (`app/(tabs)/index.tsx`)
- [ ] SearchBar renders at top
- [ ] FilterChips for categories display correctly
- [ ] FilterChips for urgency levels work
- [ ] JobCard list renders jobs
- [ ] Pull-to-refresh functional
- [ ] Loading shows SkeletonCard
- [ ] EmptyState shows when no jobs
- [ ] ErrorState shows on API failure
- [ ] Pagination works (load more)
- [ ] Navigation to job detail works
- [ ] Navigation to search works
- [ ] Navigation to categories works

### Job Detail Screen (`app/jobs/[id].tsx`)
- [ ] Full-screen modal presentation
- [ ] Image carousel displays job photos
- [ ] Job title, category badge render
- [ ] Budget display formatted correctly
- [ ] Status badge shows correct status
- [ ] Client/Worker info card displays
- [ ] Description expands with "Read more"
- [ ] Skills chips render
- [ ] Location section displays
- [ ] Bottom action bar shows correct buttons:
  - [ ] Workers: "Apply Now" button
  - [ ] Clients: "Edit" / "View Applications" / "Cancel" buttons
- [ ] Apply button navigates to application form
- [ ] Edit button (clients only) works
- [ ] View Applications (clients only) works
- [ ] Cancel button shows confirmation dialog

### Categories Screen (`app/jobs/categories.tsx`)
- [ ] 2-column grid layout
- [ ] Category cards show icon, name, count
- [ ] Tap navigates to filtered job list
- [ ] Loading state shows
- [ ] Error state handles API failure

### Search Screen (`app/jobs/search.tsx`)
- [ ] SearchBar auto-focused on mount
- [ ] Recent searches list displays
- [ ] Filter options render (budget, location, date)
- [ ] Search results show JobCards
- [ ] Real-time search works (debounced)
- [ ] Clear search button works
- [ ] Navigation back to browse works

### Saved Jobs Screen (`app/jobs/saved.tsx`)
- [ ] JobCard list renders saved jobs
- [ ] Swipe to delete functional
- [ ] EmptyState shows when no saved jobs
- [ ] Pull-to-refresh works
- [ ] Unsave action updates UI immediately
- [ ] Navigate to job detail works

---

## PHASE 2: My Jobs / Client Requests

### My Jobs/Requests Screen (`app/(tabs)/my-jobs.tsx`)
- [ ] Top tab navigation renders:
  - [ ] Workers: "Active" / "In Progress" / "Completed"
  - [ ] Clients: "Active Requests" / "In Progress" / "Past Requests" / "Applications"
- [ ] JobCard list renders for each tab
- [ ] Filter by status works
- [ ] Pull-to-refresh functional
- [ ] Application count badges show (clients)
- [ ] Navigate to job detail works
- [ ] Navigate to applications (clients) works
- [ ] User role detection (worker/client) works

### Applications Management Screen (`app/client/job-applications/[jobId].tsx`) - NEW
- [ ] Header shows job title
- [ ] Applicant cards list renders
- [ ] Each card shows: avatar, name, rating, proposed budget
- [ ] Skills chips display
- [ ] "View Profile" button navigates
- [ ] "Accept" button works
- [ ] "Reject" button works
- [ ] EmptyState: "No applications yet" shows
- [ ] Optimistic UI updates on accept/reject
- [ ] Confirmation dialogs for accept/reject

### Application Detail Screen (`app/applications/[id].tsx`)
- [ ] Worker profile summary displays
- [ ] Proposal text renders
- [ ] Budget comparison shows
- [ ] Portfolio samples display
- [ ] Accept button (clients) works
- [ ] Reject button (clients) works
- [ ] Withdraw button (workers) works
- [ ] Confirmation dialogs functional
- [ ] Navigation back works

---

## PHASE 3: Profile & Portfolio

### Profile Tab (`app/(tabs)/profile.tsx`)
- [ ] Profile header card renders:
  - [ ] Large avatar (100px)
  - [ ] Name, verification badge
  - [ ] Rating stars
  - [ ] Edit button navigates
- [ ] Stats grid (2x2) displays: Jobs, Earnings, Rating, Response time
- [ ] Menu sections using Card component
- [ ] Account, Payments, Settings, Support, Logout sections
- [ ] Logout shows confirmation dialog
- [ ] Navigation to each section works

### Edit Profile Screen (`app/profile/edit.tsx`)
- [ ] Avatar upload section (tap to change)
- [ ] Form sections render: Personal, Professional, Location, Skills
- [ ] Save button sticky at bottom
- [ ] Validation messages display
- [ ] Save button disabled when invalid
- [ ] Success message after save
- [ ] Navigate back after save
- [ ] Changes persist

### Avatar Upload Screen (`app/profile/edit/avatar.tsx`) - NEW
- [ ] Camera/gallery selection works
- [ ] Image cropping (square) functional
- [ ] Preview displays cropped image
- [ ] Upload to Supabase works
- [ ] Loading state during upload
- [ ] Success/error messages display
- [ ] Navigate back after upload

### Portfolio Screen (`app/profile/portfolio.tsx`)
- [ ] 2-3 column grid layout
- [ ] Image cards with delete button
- [ ] Add photo button works
- [ ] Full-screen viewer on tap
- [ ] Limit: 10 images enforced
- [ ] Delete confirmation dialog
- [ ] Optimistic UI updates

### Certifications Screen (`app/profile/certifications.tsx`)
- [ ] List of certification cards
- [ ] Issue/expiry dates display
- [ ] Status badge (valid/expired) shows
- [ ] Add button opens form modal
- [ ] Form modal validates inputs
- [ ] Edit button works
- [ ] Delete button with confirmation
- [ ] Expired certifications highlighted

### Materials Screen (`app/profile/materials.tsx`)
- [ ] List of material cards
- [ ] Price, unit, description display
- [ ] Add button opens form
- [ ] Edit button works
- [ ] Delete button with confirmation
- [ ] Form validation works

---

## PHASE 4: Messaging

### Messages Tab (`app/(tabs)/messages.tsx`)
- [ ] SearchBar at top
- [ ] Conversation cards display:
  - [ ] Avatar (48px), name, last message
  - [ ] Timestamp, unread badge
  - [ ] Job title (small gray)
- [ ] Filter tabs: All / Unread / Archived
- [ ] EmptyState shows when no conversations
- [ ] Navigate to chat screen works
- [ ] Unread count badge updates
- [ ] Pull-to-refresh works

### Chat Screen (`app/messages/[id].tsx`)
- [ ] Header: avatar, name, online status
- [ ] Message bubbles render correctly:
  - [ ] Sent: blue bg, white text, right
  - [ ] Received: gray bg, dark text, left
  - [ ] Rounded 16px with tail
  - [ ] Timestamp displays
- [ ] Image messages display
- [ ] Typing indicator shows
- [ ] Input bar: text input, image button, send button
- [ ] WebSocket connection establishes
- [ ] Real-time messages received
- [ ] Send message works
- [ ] Image upload works
- [ ] Scroll to bottom on new message
- [ ] Keyboard avoiding view works

---

## PHASE 5: Payments & Wallet

### Wallet Screen (`app/payments/wallet.tsx`)
- [ ] Balance card (large, elevated) displays
- [ ] Add Funds button works
- [ ] Withdraw button works
- [ ] Transaction history list renders
- [ ] Filter by type works
- [ ] TransactionCard shows: type, amount, date, status
- [ ] Pull-to-refresh updates balance
- [ ] Navigate to deposit screen works

### Payment Method Selection (`app/payments/final/[jobId].tsx`)
- [ ] Header: "Choose Payment Method"
- [ ] Payment method cards (GCash, Cash) render
- [ ] Radio selection works
- [ ] Continue button enabled when selected
- [ ] Navigate to GCash/Cash flow works

### GCash Payment (`app/payments/gcash/[jobId].tsx`)
- [ ] WebView for Xendit renders
- [ ] Loading state during payment
- [ ] Success handling navigates correctly
- [ ] Error handling shows message
- [ ] Back button works

### Cash Payment Proof (`app/payments/cash-proof/[jobId].tsx`)
- [ ] Instructions display
- [ ] Camera button opens camera
- [ ] Gallery button opens gallery
- [ ] Image preview shows selected image
- [ ] Submit button uploads proof
- [ ] Loading state during upload
- [ ] Success/error messages display
- [ ] Navigate back after submit

### Payment Timeline (`app/payments/timeline/[jobId].tsx`)
- [ ] Vertical stepper renders:
  - [ ] Escrow (50%)
  - [ ] Work in progress
  - [ ] Work completed
  - [ ] Final payment (50%)
  - [ ] Closed
- [ ] Color-coded status (green=complete, blue=current, gray=pending)
- [ ] Timestamps display for completed steps
- [ ] Navigate back works

### Worker Earnings (`app/worker/earnings.tsx`)
- [ ] Summary cards display: Total, This month, Pending, Available
- [ ] Filter tabs: All / Week / Month
- [ ] Earnings history list renders
- [ ] Withdraw button works
- [ ] EarningsStatsCard shows correct data
- [ ] Pull-to-refresh updates data

### Payment Received (`app/worker/payment-received.tsx`)
- [ ] Success animation plays
- [ ] Amount displays (large)
- [ ] Job details show
- [ ] New balance displays
- [ ] Action buttons work
- [ ] Navigate to earnings/wallet works

---

## PHASE 6: KYC & Verification

### KYC Status (`app/kyc/status.tsx`)
- [ ] Status card: badge, message, date display
- [ ] Document list with previews renders
- [ ] Upload/Resubmit button navigates
- [ ] Status badge colors correct:
  - [ ] PENDING: yellow
  - [ ] APPROVED: green
  - [ ] REJECTED: red
- [ ] Navigate to upload works

### KYC Upload (`app/kyc/upload.tsx`)
- [ ] Step indicator (1/3, 2/3, 3/3) shows
- [ ] Step 1: Select ID type works
- [ ] Step 2: Upload photos works
- [ ] Step 3: Review & submit works
- [ ] Multi-step navigation forward/back works
- [ ] Validation on each step works
- [ ] Submit button uploads documents
- [ ] Loading state during upload
- [ ] Success/error messages display

### KYC Preview (`app/kyc/preview.tsx`)
- [ ] Document previews display
- [ ] Edit buttons navigate back to upload
- [ ] Terms checkbox functional
- [ ] Submit button enabled when checked
- [ ] Submit uploads and navigates
- [ ] Loading state during submit

---

## PHASE 7: Notifications

### Notifications Screen (`app/notifications/index.tsx`)
- [ ] Notification cards display:
  - [ ] Icon, title, message, timestamp
  - [ ] Unread indicator
- [ ] Tap to navigate works
- [ ] Group by: Today / Yesterday / Earlier
- [ ] Mark all read button works
- [ ] EmptyState shows when no notifications
- [ ] Pull-to-refresh updates
- [ ] Swipe to delete works

### Notification Settings (`app/notifications/settings.tsx`)
- [ ] Toggle sections for each notification type
- [ ] DND schedule picker works
- [ ] Sound toggle functional
- [ ] Test notification button sends notification
- [ ] Settings save on change
- [ ] Settings persist after app restart

---

## PHASE 8: Reviews & Ratings

### Submit Review (`app/reviews/submit/[jobId].tsx`)
- [ ] Job info card displays
- [ ] Star rating selector (1-5) works
- [ ] Comment textarea functional
- [ ] Photo upload works
- [ ] Submit button validates (rating required)
- [ ] Submit button uploads review
- [ ] Loading state during submit
- [ ] Success/error messages display
- [ ] Navigate back after submit

### View Reviews (`app/reviews/[workerId].tsx`)
- [ ] Overall rating summary displays
- [ ] Rating breakdown (5★, 4★, etc.) renders
- [ ] Review cards list displays
- [ ] Filter options work (All, 5★, 4★, etc.)
- [ ] Sort options work (Latest, Highest, Lowest)
- [ ] Pagination works
- [ ] ReviewCard shows: avatar, name, rating, date, comment, photos

### My Reviews (`app/reviews/my-reviews.tsx`)
- [ ] Given/Received tabs work
- [ ] Review cards with job info display
- [ ] Edit button (given reviews) opens form
- [ ] Delete button (given reviews) with confirmation
- [ ] Navigate to job detail works
- [ ] Pull-to-refresh updates

---

## PHASE 9: Settings & Help

### Settings Screen (`app/settings/index.tsx`)
- [ ] Sections with Card component render:
  - [ ] Account, Preferences, Notifications, Privacy, Help, About
  - [ ] Logout (red text)
- [ ] Each section navigates to detail screen
- [ ] Logout shows confirmation dialog
- [ ] Logout clears cache and navigates to login

### FAQ Screen (`app/help/faq.tsx`)
- [ ] SearchBar functional
- [ ] Category chips filter FAQs
- [ ] Accordion list (expandable) works
- [ ] Contact support button navigates
- [ ] Search filters FAQ items
- [ ] Categories: General, Payments, Jobs, Account, etc.

### Contact Support (`app/help/contact.tsx`) - NEW
- [ ] Form renders: Name, Email, Subject, Message
- [ ] Category dropdown works
- [ ] Attach file button opens picker
- [ ] File preview displays
- [ ] Submit button validates form
- [ ] Submit button sends support request
- [ ] Loading state during submit
- [ ] Success/error messages display
- [ ] Navigate back after submit

---

## PHASE 10: Welcome & Onboarding

### Welcome Screen (`app/welcome.tsx`)
- [ ] Full-screen illustration displays
- [ ] Logo and tagline render
- [ ] Feature highlights display
- [ ] Get Started button navigates to register
- [ ] Login link navigates to login
- [ ] Animations smooth

### Onboarding Screens (if exists)
- [ ] Swipeable carousel works
- [ ] 3-4 feature screens display
- [ ] Skip button navigates to login
- [ ] Next button advances
- [ ] Done button (last screen) navigates
- [ ] Dot indicators show current screen

---

## PHASE 11: Additional Components

### ConversationCard
- [ ] Avatar renders (48px)
- [ ] Name displays
- [ ] Last message shows (truncated)
- [ ] Timestamp displays
- [ ] Unread badge shows count
- [ ] Job title displays
- [ ] Tap navigates to chat

### StarRating
- [ ] Displays rating (1-5 stars)
- [ ] Interactive mode allows selection
- [ ] Display-only mode shows rating
- [ ] Half-star support works
- [ ] Color matches theme (primary)

### ImageViewer
- [ ] Full-screen image display
- [ ] Pinch to zoom works
- [ ] Swipe to dismiss works
- [ ] Close button works
- [ ] Image loading state shows
- [ ] Error state for failed load

### AvatarUpload
- [ ] Camera/gallery selection
- [ ] Image cropping (square)
- [ ] Preview displays
- [ ] Upload functional
- [ ] Loading state
- [ ] Success/error handling

### PaymentMethodCard
- [ ] Icon/logo displays
- [ ] Method name shows
- [ ] Description displays
- [ ] Radio selection works
- [ ] Disabled state visual
- [ ] Tap selects method

### ApplicantCard
- [ ] Avatar, name, rating display
- [ ] Proposed budget shows
- [ ] Skills chips render
- [ ] View Profile button navigates
- [ ] Accept button works
- [ ] Reject button works

### TransactionCard
- [ ] Type icon displays
- [ ] Amount formatted
- [ ] Date/time displays
- [ ] Status badge shows
- [ ] Tap expands details (optional)

### NotificationCard
- [ ] Icon displays
- [ ] Title, message show
- [ ] Timestamp displays
- [ ] Unread indicator
- [ ] Tap navigates
- [ ] Swipe to delete

### ReviewCard
- [ ] Avatar, name display
- [ ] Star rating shows
- [ ] Date displays
- [ ] Comment text renders
- [ ] Photos display (if any)
- [ ] Tap photo opens viewer

---

## PHASE 12: Navigation Updates

### Tab Navigation (`app/(tabs)/_layout.tsx`)
- [ ] Tab labels correct
- [ ] Icons display correctly
- [ ] Conditional tabs for worker/client work
- [ ] Badge counts show (messages, notifications)
- [ ] Active tab highlighted
- [ ] Tab press switches screen
- [ ] Tab press scrolls to top if already active

### Navigation Flows
- [ ] All screens properly linked
- [ ] Back buttons work correctly
- [ ] Modal presentations correct
- [ ] Deep linking setup functional
- [ ] Stack navigation preserves state
- [ ] Tab navigation preserves state

---

## PHASE 13: Testing & Polish

### All Screens Testing
- [ ] Loading states display correctly
- [ ] Error states handle failures gracefully
- [ ] Empty states show when appropriate
- [ ] Pull-to-refresh functional on lists
- [ ] Animations smooth (60fps)
- [ ] Haptic feedback on important actions
- [ ] Navigation flows complete
- [ ] API integration works
- [ ] Form validation proper
- [ ] Images load with placeholders

### Performance Optimization
- [ ] Image optimization (expo-image)
- [ ] List virtualization (FlatList)
- [ ] Memoization (React.memo, useMemo, useCallback)
- [ ] Query caching (TanStack Query)
- [ ] No unnecessary re-renders
- [ ] Bundle size acceptable
- [ ] App startup fast
- [ ] Screen transitions smooth

### Cross-Platform Testing
- [ ] iOS rendering correct
- [ ] Android rendering correct
- [ ] iOS gestures work (swipe back, etc.)
- [ ] Android back button works
- [ ] Status bar color correct
- [ ] Safe area insets handled
- [ ] Keyboard avoiding works on both
- [ ] Haptics work on both

---

## Accessibility Testing

- [ ] All interactive elements have accessible labels
- [ ] Screen reader announcements correct
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets minimum 44x44 points
- [ ] Focus indicators visible
- [ ] Error messages announced
- [ ] Loading states announced

---

## Bug Tracking

### Critical Bugs
*(None yet)*

### Minor Bugs
*(None yet)*

### UI/UX Issues
*(None yet)*

---

## Screenshots

*(Will be added during QA)*

- [ ] Browse Jobs
- [ ] Job Detail
- [ ] Categories
- [ ] Search
- [ ] Saved Jobs
- [ ] My Jobs
- [ ] Applications Management
- [ ] Profile
- [ ] Edit Profile
- [ ] Portfolio
- [ ] Certifications
- [ ] Messages List
- [ ] Chat Screen
- [ ] Wallet
- [ ] Payments
- [ ] Worker Earnings
- [ ] KYC Status
- [ ] Notifications
- [ ] Reviews
- [ ] Settings
- [ ] Help/FAQ

---

## Sign-Off

**QA Engineer:** ___________________
**Date:** ___________________
**Status:** [ ] PASS / [ ] FAIL / [ ] PENDING
**Notes:**

---

**Created:** November 16, 2025
**Last Updated:** November 16, 2025
