# Mobile Client "My Requests" Feature - QA Checklist

**Feature:** Client Job Management System
**Platform:** React Native (Expo) - Mobile App
**Test Date:** TBD
**Tester:** QA Team
**Build Version:** TBD

---

## Test Environment Setup

### Prerequisites
- [ ] Mobile app installed on test devices (iOS & Android)
- [ ] Test account with CLIENT profile type created
- [ ] Test account has wallet balance for job posting
- [ ] Backend server running and accessible
- [ ] At least 3 test worker accounts available for applications

### Test Data Requirements
- [ ] Client account with existing jobs in different statuses
- [ ] Jobs with 0 applications
- [ ] Jobs with 1+ pending applications
- [ ] Jobs with accepted worker
- [ ] Worker accounts to submit test applications

---

## 1. Job List View Testing

### 1.1 Active Jobs Tab
- [ ] **Display**: Active jobs list loads correctly
- [ ] **Empty State**: Shows empty state when no active jobs
- [ ] **Job Cards**: Each job card displays:
  - [ ] Job title
  - [ ] Budget amount (formatted as ₱X.XX)
  - [ ] Posted date
  - [ ] Location (barangay, city)
  - [ ] Status badge (blue "Active")
  - [ ] Right chevron icon
- [ ] **Sorting**: Jobs sorted by most recent first
- [ ] **Pull to Refresh**: Pull down gesture refreshes the list
- [ ] **Pagination**: Scroll to bottom loads more jobs (if 20+)
- [ ] **Tap Action**: Tapping job card navigates to job detail

### 1.2 In Progress Jobs Tab
- [ ] **Tab Switch**: Tapping "In Progress" tab switches view
- [ ] **Display**: In-progress jobs load correctly
- [ ] **Empty State**: Shows empty state when no in-progress jobs
- [ ] **Job Cards**: Each card displays:
  - [ ] Job title
  - [ ] Job description (truncated)
  - [ ] Budget amount
  - [ ] Location and category
  - [ ] Status badge (yellow "In Progress")
  - [ ] Assigned worker name (if available)
- [ ] **Pull to Refresh**: Works on this tab
- [ ] **Pagination**: Works if many jobs

### 1.3 Completed Jobs Tab
- [ ] **Tab Switch**: Tapping "Past Requests" tab switches view
- [ ] **Display**: Completed jobs load correctly
- [ ] **Empty State**: Shows empty state when no completed jobs
- [ ] **Job Cards**: Each card displays:
  - [ ] Job title
  - [ ] Completion date
  - [ ] Final budget amount
  - [ ] Status badge (green "Completed")
- [ ] **Pull to Refresh**: Works on this tab
- [ ] **Pagination**: Works if many jobs

### 1.4 Requests (Applications) Tab
- [ ] **Tab Switch**: Tapping "Requests" tab switches view
- [ ] **Display**: All applications across jobs load
- [ ] **Empty State**: Shows "No applications yet" when none
- [ ] **Application Cards**: Each card shows:
  - [ ] Worker name and photo
  - [ ] Job title applied to
  - [ ] Proposed budget
  - [ ] Application date
  - [ ] Accept/Reject buttons (if pending)

---

## 2. Job Detail Screen Testing

### 2.1 Job Information Display
- [ ] **Header**: Shows job title, budget, and status badge
- [ ] **Details Grid**: Displays:
  - [ ] Category
  - [ ] Location (barangay, city with pin icon)
  - [ ] Posted date (formatted)
  - [ ] Expected duration (if provided)
- [ ] **Description**: Full job description visible
- [ ] **Photos**: Job photos display in scrollable gallery (if any)
- [ ] **Photos Empty**: Shows "No photos uploaded" if none
- [ ] **Materials**: Lists materials needed (if any)

### 2.2 Payment Information Section
- [ ] **Panel Display**: Payment info panel visible with credit card icon
- [ ] **Status**: Shows payment status (Pending/Paid)
- [ ] **Total Amount**: Displays correctly
- [ ] **Downpayment (50%)**: Shows escrow amount
- [ ] **Downpayment Status**: Indicates if paid (checkmark or status)
- [ ] **Final Payment (50%)**: Shows remaining amount
- [ ] **Final Payment Status**: Indicates if paid

### 2.3 Applications List
- [ ] **Header**: Shows "Applications (X)" with correct count
- [ ] **Empty State**: Shows "No applications yet" with icon
- [ ] **Application Cards**: Each applicant card shows:
  - [ ] Worker profile photo
  - [ ] Worker full name
  - [ ] Worker rating (stars)
  - [ ] Worker skills/specializations
  - [ ] Proposed budget
  - [ ] Proposal message
  - [ ] Estimated duration
  - [ ] Accept/Reject buttons (if PENDING)
- [ ] **Accepted Application**: Shows "Accepted" badge if already accepted
- [ ] **Rejected Application**: Shows "Rejected" badge if rejected

### 2.4 Action Buttons
- [ ] **Cancel Job Button**: Visible if job status is ACTIVE
- [ ] **Cancel Disabled**: Hidden if job is IN_PROGRESS or COMPLETED
- [ ] **Edit Job**: (If implemented) Edit button visible for ACTIVE jobs
- [ ] **Contact Worker**: (If implemented) Contact button visible for IN_PROGRESS jobs

---

## 3. Application Management Testing

### 3.1 Accept Application Flow
- [ ] **Accept Button**: Tapping "Accept" on pending application
- [ ] **Confirmation Dialog**: Shows confirmation dialog:
  - [ ] Dialog title: "Accept Application?"
  - [ ] Worker name displayed
  - [ ] Proposed budget shown
  - [ ] "Cancel" and "Confirm" buttons
- [ ] **Cancel**: Tapping Cancel closes dialog, no action taken
- [ ] **Confirm**: Tapping Confirm:
  - [ ] Shows loading indicator
  - [ ] API request sent to backend
  - [ ] Success: Application status updated to ACCEPTED
  - [ ] Success: Job status changes to IN_PROGRESS
  - [ ] Success: Success message displayed
  - [ ] Success: Applications list refreshes
  - [ ] Success: Other pending applications auto-rejected
- [ ] **Error Handling**:
  - [ ] Network error shows error message
  - [ ] Server error shows user-friendly message
  - [ ] Can retry action

### 3.2 Reject Application Flow
- [ ] **Reject Button**: Tapping "Reject" on pending application
- [ ] **Confirmation Dialog**: Shows confirmation dialog:
  - [ ] Dialog title: "Reject Application?"
  - [ ] Warning message displayed
  - [ ] "Cancel" and "Confirm" buttons
- [ ] **Confirm Reject**:
  - [ ] Shows loading indicator
  - [ ] API request sent
  - [ ] Application status updated to REJECTED
  - [ ] Application card updates or removes
  - [ ] Success message displayed
- [ ] **Error Handling**: Proper error messages

### 3.3 View Worker Profile
- [ ] **Tap Worker Name**: Tapping worker name/photo
- [ ] **Navigation**: Navigates to worker profile screen
- [ ] **Profile Display**: Shows full worker profile:
  - [ ] Profile photo
  - [ ] Name and rating
  - [ ] Bio/description
  - [ ] Skills/specializations
  - [ ] Completed jobs count
  - [ ] Reviews/ratings
  - [ ] Portfolio images
  - [ ] Certifications
- [ ] **Back Navigation**: Can return to job detail screen

---

## 4. Job Creation Flow Testing

### 4.1 Form Access
- [ ] **Create Button**: "+ Create a Job Post" button visible on Active Jobs tab
- [ ] **Tap Action**: Tapping button opens job creation screen/modal

### 4.2 Step 1: Basic Information
- [ ] **Job Title Field**:
  - [ ] Input field accepts text
  - [ ] Placeholder text shown
  - [ ] Validation: Required field
  - [ ] Validation: Minimum 5 characters
  - [ ] Validation: Maximum 100 characters
- [ ] **Category Dropdown**:
  - [ ] Dropdown shows all categories
  - [ ] Each category has emoji icon
  - [ ] Can select a category
  - [ ] Validation: Required field
- [ ] **Job Description**:
  - [ ] Multi-line textarea
  - [ ] Helper text shown
  - [ ] Validation: Required, min 20 characters
  - [ ] Character count displayed (optional)

### 4.3 Step 2: Budget & Payment
- [ ] **Budget Input**:
  - [ ] Numeric input only
  - [ ] Shows₱ currency symbol
  - [ ] Validation: Required
  - [ ] Validation: Must be > 0
  - [ ] Validation: Must be ≤ wallet balance
- [ ] **Wallet Balance Display**:
  - [ ] Shows current wallet balance
  - [ ] Formatted as "Available balance: ₱X.XX"
  - [ ] Updates if balance changes
- [ ] **Insufficient Balance**:
  - [ ] Error shown if budget > balance
  - [ ] Suggests depositing funds
  - [ ] Link to deposit screen (optional)

### 4.4 Step 3: Location
- [ ] **City Field**:
  - [ ] Pre-filled with "Zamboanga City" (disabled)
  - [ ] Or uses user's profile location
- [ ] **Barangay Dropdown**:
  - [ ] Shows all barangays for Zamboanga City
  - [ ] Searchable/filterable (optional)
  - [ ] Can select barangay
  - [ ] Validation: Required field

### 4.5 Step 4: Additional Details
- [ ] **Expected Duration**:
  - [ ] Number input
  - [ ] Unit selector: Hours, Days, Weeks, Months
  - [ ] Optional field
- [ ] **Preferred Start Date**:
  - [ ] Date picker opens on tap
  - [ ] Native date picker (iOS/Android)
  - [ ] Can select future date
  - [ ] Optional field
- [ ] **Materials Needed**:
  - [ ] Tag input field
  - [ ] Type material name + press Enter to add
  - [ ] Tags display as chips/badges
  - [ ] Can remove tags by tapping X
  - [ ] Optional field
- [ ] **Photo Upload**:
  - [ ] "Upload Photos" button visible
  - [ ] Tapping opens image picker
  - [ ] Can select from gallery
  - [ ] Can take photo with camera (permission requested)
  - [ ] Multiple photos selectable (up to 5)
  - [ ] Photos display as thumbnails
  - [ ] Can remove photos
  - [ ] Shows upload progress
  - [ ] Validates file size (≤ 5MB each)
  - [ ] Validates file type (PNG, JPG, WEBP)

### 4.6 Step 5: Review & Submit
- [ ] **Review Screen**: Shows summary of all entered data
- [ ] **Edit Buttons**: Can go back to edit each section
- [ ] **Submit Button**: "Post Job" button enabled if valid
- [ ] **Submit Action**:
  - [ ] Shows loading indicator
  - [ ] API request sent with form data
  - [ ] Success: Job created successfully
  - [ ] Success: Success message displayed
  - [ ] Success: Navigates to job detail or job list
  - [ ] Success: New job appears in Active Jobs tab
  - [ ] Error: Shows error message
  - [ ] Error: Can retry or edit form

### 4.7 Form Validation
- [ ] **Required Fields**: Cannot submit without required fields
- [ ] **Submit Disabled**: Submit button disabled if form invalid
- [ ] **Error Messages**: Clear error messages for each field
- [ ] **Inline Validation**: Errors shown as user types
- [ ] **Focus Management**: Auto-focus on error fields

### 4.8 Form Cancellation
- [ ] **Cancel Button**: Cancel button available
- [ ] **Confirmation**: Shows "Discard changes?" dialog
- [ ] **Discard**: Clears form and closes screen
- [ ] **Keep Editing**: Returns to form

---

## 5. Navigation Testing

### 5.1 Tab Navigation
- [ ] **Tab Bar**: Client sees correct tabs:
  - [ ] Home (if applicable)
  - [ ] My Jobs (or My Requests)
  - [ ] Messages
  - [ ] Profile
- [ ] **Active Tab**: Current tab highlighted
- [ ] **Tab Icons**: Correct icons for each tab
- [ ] **Tab Labels**: Correct labels displayed
- [ ] **Conditional Rendering**: Client-specific tabs shown (not worker tabs)

### 5.2 Screen Navigation
- [ ] **Job List → Job Detail**: Smooth navigation
- [ ] **Job Detail → Worker Profile**: Navigates correctly
- [ ] **Back Button**: Android back button works
- [ ] **Header Back**: iOS back gesture/button works
- [ ] **Deep Linking**: Can navigate directly to job detail (if implemented)

---

## 6. Real-Time Updates Testing

### 6.1 Job Status Updates
- [ ] **New Application**: Job detail updates when worker applies
- [ ] **Application Count**: Application count increments
- [ ] **Status Change**: Job status updates when application accepted
- [ ] **Payment Update**: Payment status updates when payment made

### 6.2 Notifications
- [ ] **New Application**: Notification received when worker applies
- [ ] **Application Accepted**: Worker receives notification
- [ ] **Application Rejected**: Worker receives notification
- [ ] **Job Status Change**: Notifications for status changes

---

## 7. Error Handling Testing

### 7.1 Network Errors
- [ ] **No Internet**: Shows "No internet connection" message
- [ ] **Timeout**: Shows timeout error message
- [ ] **Retry Button**: Retry button available and works
- [ ] **Offline Behavior**: Gracefully handles offline state

### 7.2 Server Errors
- [ ] **400 Bad Request**: Shows validation error messages
- [ ] **401 Unauthorized**: Redirects to login
- [ ] **403 Forbidden**: Shows "Permission denied" message
- [ ] **404 Not Found**: Shows "Job not found" message
- [ ] **500 Server Error**: Shows user-friendly error message

### 7.3 Data Validation Errors
- [ ] **Invalid Budget**: Shows error for invalid amount
- [ ] **Duplicate Application**: Handles accepting already-accepted application
- [ ] **Missing Data**: Shows error for incomplete data

---

## 8. Performance Testing

### 8.1 Loading Performance
- [ ] **Job List**: Loads within 2 seconds
- [ ] **Job Detail**: Loads within 1 second
- [ ] **Images**: Load progressively without blocking UI
- [ ] **Pagination**: Smooth infinite scroll

### 8.2 Memory Management
- [ ] **No Memory Leaks**: App doesn't crash with extended use
- [ ] **Image Optimization**: Images don't cause memory issues
- [ ] **List Performance**: Smooth scrolling with 50+ jobs

### 8.3 Caching
- [ ] **TanStack Query Cache**: Data cached appropriately
- [ ] **Stale Data**: Stale data revalidated on focus
- [ ] **Cache Invalidation**: Cache clears on logout
- [ ] **Optimistic Updates**: Accept/reject updates UI optimistically

---

## 9. UI/UX Testing

### 9.1 Visual Design
- [ ] **Consistent Styling**: Matches app theme and colors
- [ ] **Typography**: Readable fonts and sizes
- [ ] **Spacing**: Proper padding and margins
- [ ] **Icons**: Correct icons for actions
- [ ] **Status Badges**: Color-coded correctly:
  - [ ] Active: Blue
  - [ ] In Progress: Yellow/Amber
  - [ ] Completed: Green
  - [ ] Cancelled: Red

### 9.2 Responsive Design
- [ ] **Small Screens**: Works on iPhone SE (small screen)
- [ ] **Large Screens**: Works on iPad/tablets
- [ ] **Landscape Mode**: Adapts to landscape orientation
- [ ] **Notch Support**: Handles iPhone notch correctly

### 9.3 Accessibility
- [ ] **Touch Targets**: Buttons ≥ 44pt tap targets
- [ ] **Contrast**: Sufficient color contrast for readability
- [ ] **Screen Reader**: Works with VoiceOver/TalkBack (optional)
- [ ] **Labels**: Accessible labels for interactive elements

### 9.4 User Feedback
- [ ] **Loading States**: Clear loading indicators
- [ ] **Success Messages**: Confirmation messages for actions
- [ ] **Error Messages**: Clear, actionable error messages
- [ ] **Haptic Feedback**: Haptic feedback on important actions
- [ ] **Animations**: Smooth transitions and animations
- [ ] **Empty States**: Helpful empty state messages

---

## 10. Platform-Specific Testing

### 10.1 iOS Testing
- [ ] **Device**: Tested on iPhone 12+ or newer
- [ ] **iOS Version**: Tested on iOS 14+ or current
- [ ] **Navigation**: iOS navigation gestures work
- [ ] **Status Bar**: Proper status bar handling
- [ ] **Safe Areas**: Respects safe area insets
- [ ] **Keyboard**: Keyboard handling correct
- [ ] **Permissions**: Camera/photo library permissions requested
- [ ] **Date Picker**: Native iOS date picker works

### 10.2 Android Testing
- [ ] **Device**: Tested on Android 10+ device
- [ ] **Navigation**: Android back button works
- [ ] **Status Bar**: Proper status bar handling
- [ ] **Keyboard**: Keyboard handling correct
- [ ] **Permissions**: Camera/storage permissions requested
- [ ] **Date Picker**: Native Android date picker works

---

## 11. Integration Testing

### 11.1 Payment Integration
- [ ] **Wallet Balance Check**: Validates against wallet balance
- [ ] **Escrow Deduction**: Balance updates when escrow paid
- [ ] **Payment Timeline**: Shows correct payment timeline

### 11.2 Messaging Integration
- [ ] **Contact Worker**: Can message assigned worker
- [ ] **Conversation Creation**: Creates conversation for job
- [ ] **Message Notifications**: Receives message notifications

### 11.3 Profile Integration
- [ ] **Worker Profiles**: Worker profiles load correctly
- [ ] **Client Profile**: Client's own profile displays correctly
- [ ] **Profile Updates**: Profile changes reflect in app

---

## 12. Edge Cases Testing

### 12.1 Data Edge Cases
- [ ] **0 Jobs**: Handles user with no posted jobs
- [ ] **1 Job**: Works with single job
- [ ] **100+ Jobs**: Handles large number of jobs
- [ ] **Long Job Titles**: Truncates long titles gracefully
- [ ] **Long Descriptions**: Shows truncated with "Read more"
- [ ] **0 Applications**: Handles job with no applications
- [ ] **10+ Applications**: Handles many applications

### 12.2 State Edge Cases
- [ ] **Accepted Then Cancelled**: Handles job acceptance then cancellation
- [ ] **Multiple Fast Taps**: Prevents double-submission on fast taps
- [ ] **Rapid Navigation**: Handles rapid screen transitions
- [ ] **App Backgrounding**: Preserves state when backgrounded

### 12.3 Concurrent Actions
- [ ] **Multiple Users**: Handles concurrent applications
- [ ] **Race Conditions**: Handles race conditions (e.g., two clients accepting same worker)

---

## 13. Security Testing

### 13.1 Authorization
- [ ] **Client Only**: Only clients can access this feature
- [ ] **Own Jobs Only**: Clients can only see their own jobs
- [ ] **Can't Accept Own Applications**: Prevents self-application
- [ ] **JWT Validation**: Proper JWT validation on all requests

### 13.2 Data Validation
- [ ] **Input Sanitization**: Input data sanitized before sending
- [ ] **SQL Injection**: Protected against SQL injection (backend)
- [ ] **XSS**: Protected against XSS (text rendering)

---

## 14. Regression Testing

### 14.1 Existing Features
- [ ] **Worker Features**: Worker job browsing still works
- [ ] **Authentication**: Login/logout still works
- [ ] **Profile Management**: Profile editing still works
- [ ] **Payments**: Payment features still work
- [ ] **Messaging**: Chat features still work

---

## Test Results Summary

### Pass/Fail Summary
- Total Test Cases: ~200+
- Passed: ___
- Failed: ___
- Blocked: ___
- Not Tested: ___

### Critical Issues Found
1.
2.
3.

### Minor Issues Found
1.
2.
3.

### Recommendations
1.
2.
3.

---

## Sign-Off

**QA Tester:** ___________________
**Date:** ___________________
**Approved for Release:** [ ] Yes [ ] No
**Notes:**

---

**Next Steps:**
- [ ] Fix critical issues
- [ ] Retest failed cases
- [ ] Update documentation
- [ ] Prepare for release
