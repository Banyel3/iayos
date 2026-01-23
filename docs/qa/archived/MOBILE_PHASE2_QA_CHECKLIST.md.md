# Mobile Phase 2 - QA Testing Checklist

**Feature**: Two-Phase Job Completion Workflow  
**Date**: November 14, 2025  
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Supabase storage configured for file uploads
- [ ] Mobile app running via Expo Go
- [ ] Test accounts created (1 worker, 1 client)
- [ ] At least 3 jobs in ASSIGNED/IN_PROGRESS status

## Pre-Testing Setup

### Worker Account:

- [ ] Email: worker@test.com
- [ ] Has 2+ jobs assigned
- [ ] At least 1 job in IN_PROGRESS
- [ ] Camera/photo library permissions granted

### Client Account:

- [ ] Email: client@test.com
- [ ] Has 2+ jobs posted and assigned to workers
- [ ] At least 1 job marked complete by worker

---

## 1. Home Screen / Dashboard

### Quick Actions Grid

- [ ] Home screen displays correctly
- [ ] Welcome message shows user's first name
- [ ] Quick Actions grid visible with 4 cards
- [ ] "Active Jobs" card present for workers
- [ ] "Active Jobs" card present for clients
- [ ] Icons render correctly (construct-outline)
- [ ] Tapping "Active Jobs" navigates to active jobs screen
- [ ] Other quick action cards work

### Stats Cards

- [ ] Overview section displays 3 stat cards
- [ ] Job count shows correct number
- [ ] Completed count shows
- [ ] Rating displays (or default 0)
- [ ] Icons render properly

### Recent Activity

- [ ] Activity feed shows recent items
- [ ] Activity icons color-coded correctly
- [ ] Timestamps display (e.g., "2 hours ago")
- [ ] "See All" link navigates correctly

---

## 2. Active Jobs Listing Screen

### Screen Access

- [ ] Accessible from home screen "Active Jobs" card
- [ ] Accessible from jobs tab "Active Jobs" button
- [ ] Screen title shows "Active Jobs"
- [ ] Back button navigates correctly

### Worker View - Active Jobs List

- [ ] Shows jobs with status ASSIGNED or IN_PROGRESS
- [ ] Job cards display correctly with:
  - [ ] Job title
  - [ ] Category badge
  - [ ] Budget (₱X format)
  - [ ] Location (City, Barangay)
  - [ ] Client name and avatar
  - [ ] Timeline info (assigned/started)
- [ ] Status badges show:
  - [ ] "In Progress" (blue) for IN_PROGRESS jobs
  - [ ] "Assigned" (purple) for ASSIGNED jobs
  - [ ] "Pending Approval" (yellow) if worker marked complete
- [ ] Special banner shows if job marked complete:
  - [ ] "Marked complete - Awaiting client approval"
  - [ ] Yellow background
- [ ] Pull-to-refresh updates list
- [ ] Loading indicator shows while fetching
- [ ] Empty state shows if no active jobs
- [ ] Tapping card navigates to job detail

### Client View - Active Jobs List

- [ ] Shows posted jobs with ASSIGNED/IN_PROGRESS status
- [ ] Job cards display correctly with:
  - [ ] Job title
  - [ ] Category badge
  - [ ] Budget
  - [ ] Location
  - [ ] Worker name and avatar
  - [ ] Timeline info
- [ ] Status badges accurate
- [ ] Special banner shows if worker marked complete:
  - [ ] "Worker marked complete - Review needed"
  - [ ] Yellow/orange background
  - [ ] Prominent visibility
- [ ] Pull-to-refresh works
- [ ] Empty state shows if no active jobs

---

## 3. Active Job Detail Screen

### Job Information Display

- [ ] Back button navigates to active jobs list
- [ ] Job title displays
- [ ] Category badge shows
- [ ] Full job description visible
- [ ] Budget card shows amount
- [ ] Location card shows full address
- [ ] Job details expandable/collapsible

### Client/Worker Info Card

- [ ] Shows correct person (client for worker, worker for client)
- [ ] Avatar displays (or placeholder)
- [ ] Name shows correctly
- [ ] Phone number displays
- [ ] Call button with phone icon
- [ ] Tapping call button initiates phone call

### Timeline Visualization

- [ ] Timeline section visible
- [ ] Step 1: "Job Assigned" shows with checkmark
- [ ] Assigned date displays correctly
- [ ] Step 2: "Work Started" shows with checkmark (if started)
- [ ] Started date displays (if applicable)
- [ ] Step 3: "Worker Marked Complete" shows conditionally
- [ ] Worker completion date shows (if marked)
- [ ] Steps properly highlighted/grayed based on status
- [ ] Timeline updates after status changes

### Status Banners

- [ ] Yellow banner shows if worker marked complete (pending approval)
- [ ] Banner text: "Worker has marked this job complete..."
- [ ] Green banner shows if client approved (completed)
- [ ] Banners positioned prominently at top
- [ ] Banner icons render correctly

---

## 4. Worker Completion Flow

### Mark as Complete Button

- [ ] Button visible for worker on assigned jobs
- [ ] Button disabled if already marked complete
- [ ] Button text: "Mark as Complete"
- [ ] Button shows correct icon
- [ ] Button styling matches theme (primary color)
- [ ] Tapping button opens completion modal

### Completion Modal - UI

- [ ] Modal opens smoothly
- [ ] Modal has proper header "Mark Job Complete"
- [ ] Close button (X) visible and functional
- [ ] Modal fullscreen on mobile
- [ ] SafeAreaView respects notch/insets
- [ ] Modal content scrollable

### Completion Notes Input

- [ ] Label shows "Completion Notes \*" with asterisk
- [ ] TextArea displays correctly
- [ ] Placeholder text helpful
- [ ] Multi-line input (6 lines visible)
- [ ] Text wraps properly
- [ ] Scrollable for long notes
- [ ] Character input works smoothly
- [ ] Validation: Required field
- [ ] Alert shown if submitted empty

### Photo Upload Button

- [ ] Label shows "Photos (Optional)"
- [ ] Upload button visible with camera icon
- [ ] Button text: "Add Photos (0/10)" initially
- [ ] Button disabled when 10 photos reached
- [ ] Tapping button requests permissions (if needed)
- [ ] Permission denial shows alert

### Photo Selection

- [ ] Image picker opens native photo library
- [ ] Multiple selection enabled
- [ ] Can select 1-10 photos total
- [ ] Selection limit enforced (10 - current count)
- [ ] Image quality compression to 0.8
- [ ] Selected photos added to grid

### Photo Preview Grid

- [ ] Grid displays selected photos (2-3 columns)
- [ ] Photos render with correct aspect ratio
- [ ] Each photo has remove button (X)
- [ ] Remove button positioned correctly (top-right)
- [ ] Tapping remove button deletes photo
- [ ] Grid updates after removal
- [ ] Photo count updates (e.g., "Add Photos (3/10)")

### Photo Upload Process

- [ ] Progress bar appears when submitting
- [ ] Progress bar container visible
- [ ] Progress bar fills from 0-100%
- [ ] Progress percentage text updates
- [ ] Text shows "Uploading photos... X%"
- [ ] Upload happens sequentially (one by one)
- [ ] Progress accurate (each photo increments correctly)

### Submit Button

- [ ] Button text: "Submit for Approval"
- [ ] Button disabled during upload/submission
- [ ] Loading indicator shows when submitting
- [ ] Button text changes to "Uploading..." during photo upload
- [ ] Button text changes to "Submitting..." during API call
- [ ] Cannot submit if notes empty (validation alert)

### Submission Success

- [ ] Confirmation dialog appears on success
- [ ] Dialog title: "Confirm Completion"
- [ ] Dialog message mentions client approval needed
- [ ] Success alert shows after submission
- [ ] Alert includes photo count if photos uploaded
- [ ] Alert message: "Job marked as complete with X photo(s)!"
- [ ] Modal closes after success
- [ ] Form fields cleared
- [ ] Job status updates to pending approval
- [ ] Active jobs list refreshes

### Error Handling

- [ ] Network error shows user-friendly message
- [ ] Photo upload failure handled gracefully
- [ ] Partial upload failure shows appropriate error
- [ ] Can retry after error
- [ ] Error logs to console for debugging

---

## 5. Client Approval Flow

### Review Screen for Client

- [ ] Client can see job marked complete by worker
- [ ] "Approve Completion" button visible
- [ ] Button only shows if worker marked complete
- [ ] Button text clear and actionable
- [ ] Button styled with success color (green)

### Completion Notes Display

- [ ] Card shows "Completion Notes" header
- [ ] Worker's notes displayed in full
- [ ] Text readable and formatted
- [ ] Card has proper styling/padding

### Completion Photos Display

- [ ] Photos section visible if photos uploaded
- [ ] Section header: "Completion Photos (X)"
- [ ] Photo count accurate
- [ ] Photos displayed in grid (2-3 columns)
- [ ] Photos render correctly
- [ ] Photos clickable for fullscreen view (optional)
- [ ] All uploaded photos visible

### Approve Completion Button

- [ ] Button positioned prominently
- [ ] Button text: "Approve Completion"
- [ ] Tapping button shows confirmation dialog
- [ ] Dialog title: "Approve Completion"
- [ ] Dialog message mentions payment release
- [ ] Dialog has "Cancel" and "Approve" buttons

### Approval Submission

- [ ] Clicking "Approve" submits to API
- [ ] Loading indicator shows during API call
- [ ] Payment method sent (GCASH hardcoded)
- [ ] Success alert shows on approval
- [ ] Alert message: "Job completion approved! Payment will be processed..."
- [ ] "OK" button in alert
- [ ] Clicking OK navigates back
- [ ] Job status updates to completed
- [ ] Active jobs list refreshes (job removed)

### Post-Approval State

- [ ] Job no longer shows in active jobs list
- [ ] Job moves to completed jobs (if implemented)
- [ ] Client's wallet balance updates (Phase 4)
- [ ] Worker receives notification (backend)
- [ ] Payment processed (Phase 4 integration)

---

## 6. Status Tracking & Updates

### Real-time Status Updates

- [ ] Marking complete updates status immediately
- [ ] Approval updates status immediately
- [ ] Status badges reflect current state
- [ ] Timeline updates after each action
- [ ] Pull-to-refresh fetches latest status

### Query Invalidation

- [ ] Submitting completion invalidates queries
- [ ] Active jobs list refetches after mutation
- [ ] Job detail refetches after mutation
- [ ] Cache updated correctly
- [ ] No stale data displayed

### Notifications (Backend)

- [ ] Worker marking complete notifies client
- [ ] Client approving notifies worker
- [ ] Notification count updates
- [ ] Notifications accessible from bell icon

---

## 7. Navigation Integration

### Jobs Tab Button

- [ ] "Active Jobs" button in jobs tab header
- [ ] Button has green badge styling
- [ ] Button icon: construct-outline
- [ ] Button text: "Active"
- [ ] Tapping navigates to active jobs screen

### Home Screen Integration

- [ ] Active Jobs card in quick actions
- [ ] Card for both worker and client
- [ ] Card icon and color correct
- [ ] Tapping navigates to active jobs

### Back Navigation

- [ ] Back button on all screens works
- [ ] Hardware back (Android) works
- [ ] Swipe back (iOS) works
- [ ] Navigation stack preserved correctly

---

## 8. Photo Upload Technical Testing

### FormData Upload

- [ ] FormData constructed correctly
- [ ] Image field name: "image"
- [ ] File URI valid
- [ ] File type correct (image/jpeg, image/png)
- [ ] File name unique and valid
- [ ] Upload to `/api/jobs/{id}/upload-image` succeeds

### Sequential Upload

- [ ] Photos upload one at a time
- [ ] No parallel uploads (prevents overload)
- [ ] Order preserved
- [ ] Each upload completes before next starts
- [ ] Failed upload doesn't block others

### Backend Integration

- [ ] Backend receives FormData correctly
- [ ] Files uploaded to Supabase storage
- [ ] Path: `users/user_{userID}/job_{jobID}/filename`
- [ ] JobPhoto records created
- [ ] Photo URLs returned in response
- [ ] Photos accessible via public URL

### Photo Display

- [ ] Uploaded photos visible to client
- [ ] Photos load from Supabase URLs
- [ ] Images display with correct aspect ratio
- [ ] No broken image links
- [ ] Loading states for images

---

## 9. Edge Cases & Boundary Testing

### Photo Upload Limits

- [ ] Can upload exactly 10 photos
- [ ] Upload button disabled at 10 photos
- [ ] Cannot select more than 10 total
- [ ] Removing photo re-enables selection
- [ ] Uploading 0 photos works (optional)

### Large Files

- [ ] Large images (5MB+) compressed
- [ ] Upload doesn't timeout
- [ ] Progress bar accurate for large files
- [ ] Memory doesn't overflow

### Network Conditions

- [ ] Slow network shows progress correctly
- [ ] Upload resumes after brief disconnect (if supported)
- [ ] Complete failure shows error
- [ ] Can retry failed uploads

### Special Characters

- [ ] Completion notes with emoji work
- [ ] Special characters in notes saved correctly
- [ ] File names with spaces handled
- [ ] Unicode characters supported

### Race Conditions

- [ ] Rapid tapping submit doesn't duplicate
- [ ] Closing modal during upload cancels correctly
- [ ] Navigating away during upload handled
- [ ] Multiple clients can't approve simultaneously

### Permissions

- [ ] Photo library permission requested
- [ ] Permission denial handled gracefully
- [ ] Can retry after granting permission
- [ ] Settings link shown if permanently denied

---

## 10. UI/UX Testing

### Modal Behavior

- [ ] Modal opens smoothly (no lag)
- [ ] Modal closes with animation
- [ ] Backdrop dismisses modal (or not, per design)
- [ ] Keyboard doesn't cover inputs
- [ ] Modal scrollable on small screens
- [ ] Close button always accessible

### Loading States

- [ ] Submit button shows loading
- [ ] Progress bar renders smoothly
- [ ] Loading text updates appropriately
- [ ] Screen doesn't freeze during upload
- [ ] User can see progress clearly

### Feedback & Confirmations

- [ ] All actions have confirmation dialogs
- [ ] Success alerts clear and informative
- [ ] Error messages user-friendly
- [ ] Alerts dismissible
- [ ] No unexpected popups

### Accessibility

- [ ] Touch targets large enough (44x44)
- [ ] Text readable at default size
- [ ] Color contrast sufficient
- [ ] Icons have semantic meaning
- [ ] Error states clear

---

## 11. Performance Testing

### Load Times

- [ ] Active jobs load in < 2 seconds
- [ ] Job detail loads in < 1 second
- [ ] Modal opens in < 500ms
- [ ] Photo picker opens quickly
- [ ] Photo upload starts within 1 second

### Photo Upload Performance

- [ ] 1 photo uploads in < 5 seconds (good network)
- [ ] 10 photos upload in < 50 seconds
- [ ] Progress bar updates smoothly (no jumps)
- [ ] App responsive during upload
- [ ] Can navigate away without crash

### Memory Usage

- [ ] No memory leaks during uploads
- [ ] Photos released from memory after upload
- [ ] App doesn't crash with 10 large photos
- [ ] Scrolling remains smooth

---

## 12. Platform-Specific Testing

### iOS Specific

- [ ] Photo library permission flow works
- [ ] Image picker native UI correct
- [ ] Safe area insets respected (notch)
- [ ] Modal presentation correct
- [ ] Keyboard behavior correct
- [ ] Swipe to dismiss modal works (if enabled)

### Android Specific

- [ ] Photo library permission flow works
- [ ] Image picker native UI correct
- [ ] Back button closes modal
- [ ] Back button behavior correct
- [ ] Upload notification shows (if implemented)
- [ ] Material ripple effects work

---

## 13. API Integration Testing

### Mark Complete Endpoint

- [ ] POST to `/api/jobs/{id}/mark-complete`
- [ ] Sends completion_notes in body
- [ ] Returns success response
- [ ] Job status updates to worker_marked_complete
- [ ] Timestamp recorded (worker_marked_complete_at)

### Approve Completion Endpoint

- [ ] POST to `/api/jobs/{id}/approve-completion`
- [ ] Sends payment_method in body
- [ ] Returns success response
- [ ] Job status updates to client_marked_complete
- [ ] Payment processing triggered (Phase 4)

### Upload Image Endpoint

- [ ] POST to `/api/jobs/{id}/upload-image`
- [ ] Accepts multipart/form-data
- [ ] Image field name: "image"
- [ ] Returns image_url and photo_id
- [ ] Creates JobPhoto record
- [ ] Handles file size limits

### Error Responses

- [ ] 400 shows validation errors
- [ ] 401 redirects to login
- [ ] 403 shows permission error
- [ ] 404 shows job not found
- [ ] 500 shows generic error

---

## 14. Security & Authorization

### Worker Permissions

- [ ] Worker can only mark their assigned jobs complete
- [ ] Worker can't mark other workers' jobs complete
- [ ] Worker can't approve completion (client only)
- [ ] Worker can't access client approval flow

### Client Permissions

- [ ] Client can only approve their posted jobs
- [ ] Client can't approve other clients' jobs
- [ ] Client can't mark jobs complete (worker only)
- [ ] Client can see worker's completion data

### File Upload Security

- [ ] Only authenticated users can upload
- [ ] Only job participants can upload to job
- [ ] File type validation works
- [ ] File size limits enforced
- [ ] Malicious files rejected

---

## 15. Integration with Phase 1

### Continuation from Application

- [ ] Applied job can be assigned
- [ ] Assigned job appears in active jobs
- [ ] Worker can work on applied job
- [ ] Status progression correct (OPEN → ASSIGNED → IN_PROGRESS → COMPLETED)

### Data Consistency

- [ ] Job data consistent across screens
- [ ] Client/worker info matches Phase 1
- [ ] Budget info consistent
- [ ] Location info consistent

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

### Photo Upload Issues:

1.
2.
3.

### Performance Issues:

1.
2.
3.

### Recommendations:

1.
2.
3.

---

## Sign-off Checklist

- [ ] All critical paths tested
- [ ] Worker completion flow works end-to-end
- [ ] Client approval flow works end-to-end
- [ ] Photo upload works with 1-10 photos
- [ ] Progress indicator accurate
- [ ] No TypeScript errors
- [ ] No crashes during testing
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for production deployment

---

**Tested By**: ******\_\_\_******  
**Date**: ******\_\_\_******  
**Build Version**: ******\_\_\_******  
**Test Environment**: ******\_\_\_******  
**Backend Version**: ******\_\_\_******

**Sign-off**: Phase 2 is [ ] Ready for Production / [ ] Needs Fixes

### Notes:
