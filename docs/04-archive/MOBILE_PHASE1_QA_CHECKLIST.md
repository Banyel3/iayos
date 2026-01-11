# Mobile Phase 1 - QA Testing Checklist

**Feature**: Job Application Flow  
**Date**: November 14, 2025  
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Mobile app running via Expo Go
- [ ] Test accounts created (1 worker, 1 client)
- [ ] Database seeded with test jobs

## Pre-Testing Setup

### Worker Account:

- [ ] Email: worker@test.com
- [ ] Profile type: WORKER
- [ ] Profile completed
- [ ] Location sharing enabled

### Client Account:

- [ ] Email: client@test.com
- [ ] Profile type: CLIENT
- [ ] Profile completed
- [ ] Posted at least 5 test jobs

---

## 1. Authentication & Onboarding

### Login Screen

- [ ] App loads without crashes
- [ ] Login form displays correctly
- [ ] Email field validates email format
- [ ] Password field masks characters
- [ ] "Show Password" toggle works
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials shows error
- [ ] Error messages are user-friendly
- [ ] Loading indicator shows during login
- [ ] Successful login navigates to home screen

### Registration

- [ ] Register link navigates to registration screen
- [ ] All required fields validate correctly
- [ ] Email validation works (invalid format rejected)
- [ ] Password strength indicator shows
- [ ] Successful registration creates account
- [ ] New user redirected to profile setup

---

## 2. Jobs Tab - Browse Available Jobs

### Jobs Listing Screen

- [ ] Jobs tab accessible from bottom navigation
- [ ] Screen displays "Available Jobs" header
- [ ] Job cards render correctly with:
  - [ ] Job title
  - [ ] Category badge
  - [ ] Budget (₱X - ₱Y format)
  - [ ] Location (City, Barangay)
  - [ ] Urgency badge (LOW/MEDIUM/HIGH colors)
  - [ ] Posted timestamp
  - [ ] "Applied" badge if already applied
- [ ] Search bar filters jobs by keyword
- [ ] Urgency filter buttons work (All/Low/Medium/High)
- [ ] Pull-to-refresh updates job list
- [ ] Loading indicator shows while fetching
- [ ] Empty state shows when no jobs match filters
- [ ] Tapping job card navigates to detail screen

### Job Search & Filters

- [ ] Search by job title works
- [ ] Search by description works
- [ ] Filter by LOW urgency shows correct jobs
- [ ] Filter by MEDIUM urgency shows correct jobs
- [ ] Filter by HIGH urgency shows correct jobs
- [ ] Clearing filters shows all jobs
- [ ] Search + filter combination works
- [ ] No results message shows when appropriate

---

## 3. Job Detail Screen

### Job Information Display

- [ ] Back button navigates to jobs list
- [ ] Job title displays correctly
- [ ] Category badge shows job type
- [ ] Job description shows full text
- [ ] Budget card shows min-max range
- [ ] Location card shows city and barangay
- [ ] Expected duration displays
- [ ] Urgency badge shows with correct color
- [ ] Preferred start date displays (if set)
- [ ] Materials needed section shows (if applicable)

### Client Information

- [ ] Client name displays
- [ ] Client avatar shows (or placeholder)
- [ ] Client city displays
- [ ] Client rating shows (or "No rating")

### Apply Button States

- [ ] "Apply for Job" button visible if not applied
- [ ] Button disabled if already applied
- [ ] "Already Applied" badge shows if applied
- [ ] Button shows loading state when clicked
- [ ] Button disabled during submission

---

## 4. Job Application Flow

### Application Modal

- [ ] Modal opens when "Apply for Job" clicked
- [ ] Modal has proper header with title
- [ ] Close button (X) visible in header
- [ ] Close button dismisses modal
- [ ] Modal scrolls if content overflows

### Bid Amount Input

- [ ] Label shows "Your Bid Amount \*"
- [ ] Placeholder text: "Enter your bid (₱)"
- [ ] Numeric keyboard opens on focus
- [ ] Only numbers accepted
- [ ] Required field validation works
- [ ] Error shown if empty on submit
- [ ] Value persists while typing

### Proposal Message Input

- [ ] Label shows "Proposal Message \*"
- [ ] Placeholder text helpful
- [ ] Multi-line text input
- [ ] 6 lines visible by default
- [ ] Scrollable for longer messages
- [ ] Required field validation works
- [ ] Error shown if empty on submit
- [ ] Text persists while typing

### Estimated Days Input

- [ ] Label shows "Estimated Days to Complete \*"
- [ ] Placeholder text: "e.g., 3"
- [ ] Numeric keyboard opens
- [ ] Only numbers accepted
- [ ] Required field validation works
- [ ] Error shown if empty on submit
- [ ] Value persists while typing

### Submission

- [ ] All required fields validated before submit
- [ ] Alert shown if any field empty
- [ ] Submit button shows loading indicator
- [ ] API call sends correct data format
- [ ] Success shows confirmation dialog
- [ ] Dialog has "View Applications" button
- [ ] "View Applications" navigates correctly
- [ ] Modal closes on success
- [ ] Form fields cleared after success
- [ ] Error alert shown if submission fails
- [ ] Network error handled gracefully

---

## 5. My Applications Screen

### Applications List

- [ ] Screen accessible from jobs tab header
- [ ] "My Applications" button visible
- [ ] Screen shows all submitted applications
- [ ] Applications sorted by date (newest first)
- [ ] Pull-to-refresh updates list
- [ ] Loading indicator shows while fetching
- [ ] Empty state shows if no applications

### Application Cards

- [ ] Job title displays
- [ ] Category badge shows
- [ ] Budget range displays
- [ ] Location shows (City, Barangay)
- [ ] Status badge shows with correct color:
  - [ ] PENDING (yellow)
  - [ ] ACCEPTED (green)
  - [ ] REJECTED (red)
  - [ ] WITHDRAWN (gray)
- [ ] Applied date shows (e.g., "2 days ago")

### Application Details

- [ ] Expanding card shows full details
- [ ] Bid amount displays (₱X format)
- [ ] Estimated days displays
- [ ] Proposal message shows in full
- [ ] Applied timestamp accurate

---

## 6. Navigation & UI/UX

### Bottom Navigation

- [ ] Jobs tab icon and label correct
- [ ] Jobs tab highlighted when active
- [ ] Messages tab accessible
- [ ] Profile tab accessible
- [ ] Navigation persists across screens
- [ ] Active tab indicated visually

### General UI

- [ ] Theme colors consistent (#54B7EC primary)
- [ ] Typography sizes appropriate
- [ ] Spacing consistent throughout
- [ ] Shadows/elevations work correctly
- [ ] Icons render properly (Ionicons)
- [ ] Touch targets large enough (44x44 min)
- [ ] Animations smooth (if any)
- [ ] No visual glitches or overlaps

### Responsiveness

- [ ] Works on small screens (iPhone SE)
- [ ] Works on large screens (iPhone 15 Pro Max)
- [ ] Works on tablets (iPad)
- [ ] Keyboard doesn't cover inputs
- [ ] Safe area insets respected
- [ ] Status bar styled correctly

---

## 7. Error Handling

### Network Errors

- [ ] Offline shows appropriate message
- [ ] Slow network shows loading indicator
- [ ] Timeout handled gracefully
- [ ] Retry mechanism works (pull-to-refresh)

### Validation Errors

- [ ] Empty required fields show alerts
- [ ] Invalid email format rejected
- [ ] Invalid bid amount rejected (non-numeric)
- [ ] Server validation errors displayed
- [ ] Error messages user-friendly

### API Errors

- [ ] 400 Bad Request shows error message
- [ ] 401 Unauthorized redirects to login
- [ ] 403 Forbidden shows permission error
- [ ] 404 Not Found shows appropriate message
- [ ] 500 Server Error shows generic error
- [ ] Error responses parsed correctly

---

## 8. Data Persistence & State

### React Query Caching

- [ ] Jobs list cached after first load
- [ ] Cache invalidates on pull-to-refresh
- [ ] Applications cached correctly
- [ ] Submitting application invalidates cache
- [ ] Stale data refetched appropriately

### Local State

- [ ] Search query persists during session
- [ ] Filter selections persist
- [ ] Form inputs persist while typing
- [ ] Navigation stack preserved
- [ ] Back button behavior correct

---

## 9. Performance

### Load Times

- [ ] Jobs list loads in < 2 seconds
- [ ] Job detail loads in < 1 second
- [ ] Applications load in < 2 seconds
- [ ] Images load progressively
- [ ] No lag when typing in inputs

### Memory & Resources

- [ ] No memory leaks during navigation
- [ ] App doesn't crash after extended use
- [ ] Scrolling smooth with 50+ jobs
- [ ] Modal animations smooth

---

## 10. Security & Privacy

### Authentication

- [ ] Auth cookies sent with requests
- [ ] Unauthenticated users redirected to login
- [ ] Session persists across app restarts
- [ ] Logout clears session correctly

### Data Access

- [ ] Workers can only see available jobs
- [ ] Workers can't access client-only features
- [ ] Applications only visible to owner
- [ ] Sensitive data not exposed in API

---

## 11. Edge Cases

### Boundary Conditions

- [ ] Empty job list handled
- [ ] Job with no client info handled
- [ ] Job with missing fields handled
- [ ] Application with invalid status handled
- [ ] Very long job titles/descriptions display correctly
- [ ] Special characters in text handled
- [ ] Emoji in proposal message works

### Race Conditions

- [ ] Rapid clicking apply button doesn't duplicate
- [ ] Multiple simultaneous requests handled
- [ ] Canceling request mid-flight works

---

## 12. Platform-Specific Testing

### iOS

- [ ] Keyboard behavior correct
- [ ] Safe area insets work (notch devices)
- [ ] Status bar style correct
- [ ] Haptic feedback works (if implemented)
- [ ] Swipe gestures work
- [ ] Modal presentation correct

### Android

- [ ] Back button behavior correct
- [ ] Keyboard behavior correct
- [ ] Status bar style correct
- [ ] Material ripple effects work
- [ ] Hardware back button works
- [ ] Notification permissions handled

---

## Test Results Summary

**Total Test Cases**: **_ / _**  
**Passed**: **_  
**Failed**: _**  
**Blocked**: **_  
**Not Applicable**: _**

### Critical Issues Found:

1.
2.
3.

### Minor Issues Found:

1.
2.
3.

### Recommendations:

1.
2.
3.

---

**Tested By**: ******\_\_\_******  
**Date**: ******\_\_\_******  
**Build Version**: ******\_\_\_******  
**Test Environment**: ******\_\_\_******

**Sign-off**: Phase 1 is [ ] Ready for Production / [ ] Needs Fixes
