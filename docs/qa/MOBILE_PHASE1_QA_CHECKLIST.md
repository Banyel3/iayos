# Mobile Phase 1: Job Application Flow - QA Testing Checklist

**Issue:** #19  
**Status:** ✅ COMPLETE - Ready for QA Testing  
**Date Created:** November 13, 2025  
**Last Updated:** November 13, 2025  
**Tester:** _[Name]_  
**Test Date:** _[Date]_  
**Platform:** ☐ iOS ☐ Android ☐ Both

---

## 📋 Testing Overview

This document provides a comprehensive testing checklist for Mobile Phase 1 (Job Application Flow) in the Flutter mobile app. The phase includes job browsing, search, application submission, and application management features.

**Scope:**

- Job listing and browsing
- Job search and filtering
- Job details viewing
- Application submission with budget negotiation
- Application tracking and management
- Client application review features

**Test Environment:**

- Backend API: `http://[your-backend-url]:8000`
- Mobile App: Flutter (iOS/Android)
- Test Accounts: Worker and Client profiles required

---

## 1️⃣ Job Listing & Browsing

### 1.1 Initial Load

- [ ] **JL-001:** App loads job listing screen successfully on first launch
- [ ] **JL-002:** Loading spinner displays while fetching jobs
- [ ] **JL-003:** Job cards display with correct information (title, budget, location, urgency)
- [ ] **JL-004:** Jobs are sorted by location proximity (same city first)
- [ ] **JL-005:** "No jobs available" message displays when no jobs exist
- [ ] **JL-006:** Error message displays clearly if API call fails

**Expected Behavior:** Jobs load within 2-3 seconds, display in cards with budget formatted as "₱X,XXX.XX"

### 1.2 Pagination & Infinite Scroll

- [ ] **JL-007:** Initial page loads 20 jobs (or configured limit)
- [ ] **JL-008:** Scrolling to bottom triggers loading of next page
- [ ] **JL-009:** Loading indicator appears at bottom during pagination
- [ ] **JL-010:** No duplicate jobs appear after pagination
- [ ] **JL-011:** "No more jobs" indicator displays when all jobs loaded
- [ ] **JL-012:** Scroll position maintained after loading more jobs

**Expected Behavior:** Smooth infinite scroll without duplicate entries or jerky scrolling

### 1.3 Pull-to-Refresh

- [ ] **JL-013:** Pull-down gesture triggers refresh animation
- [ ] **JL-014:** Job list reloads from page 1 after refresh
- [ ] **JL-015:** Refresh indicator disappears after successful reload
- [ ] **JL-016:** Error message displays if refresh fails
- [ ] **JL-017:** User can retry refresh after error

**Expected Behavior:** Quick refresh (1-2 seconds) with smooth animation

### 1.4 Job Card Display

- [ ] **JL-018:** Job title displays correctly (truncated if too long)
- [ ] **JL-019:** Budget displays in correct format: "₱5,000.00"
- [ ] **JL-020:** Location displays city/address
- [ ] **JL-021:** Urgency badge displays (LOW/MEDIUM/HIGH) with correct colors
- [ ] **JL-022:** Category name displays if available
- [ ] **JL-023:** "Posted X hours/days ago" displays correctly
- [ ] **JL-024:** Job photo thumbnail displays (or placeholder if no photo)
- [ ] **JL-025:** Client name/avatar displays
- [ ] **JL-026:** Applications count displays (e.g., "5 applications")

**Expected Behavior:** All information clearly visible, properly formatted, colors match urgency levels

---

## 2️⃣ Category Filtering

### 2.1 Category Dropdown

- [ ] **CF-001:** Category dropdown button displays at top of job list
- [ ] **CF-002:** Tapping dropdown opens category selection modal/sheet
- [ ] **CF-003:** "All Categories" option appears first
- [ ] **CF-004:** All job categories load from backend
- [ ] **CF-005:** Category names display correctly
- [ ] **CF-006:** Selected category highlights in list

**Expected Behavior:** Smooth modal/sheet animation, all categories visible

### 2.2 Category Filtering Functionality

- [ ] **CF-007:** Selecting "All Categories" shows all jobs
- [ ] **CF-008:** Selecting specific category filters jobs correctly
- [ ] **CF-009:** Job count updates after filter applied
- [ ] **CF-010:** "No jobs in this category" displays when empty
- [ ] **CF-011:** Filter persists during pagination
- [ ] **CF-012:** Pull-to-refresh maintains selected category
- [ ] **CF-013:** Switching categories resets to page 1

**Expected Behavior:** Instant filtering with smooth list update, no flickering

---

## 3️⃣ Job Search

### 3.1 Search Screen Access

- [ ] **JS-001:** Search icon/button visible on job listing screen
- [ ] **JS-002:** Tapping search navigates to search screen
- [ ] **JS-003:** Search screen displays with input field focused
- [ ] **JS-004:** Keyboard appears automatically
- [ ] **JS-005:** Back button returns to job listing

**Expected Behavior:** Instant navigation, keyboard ready for input

### 3.2 Search Functionality

- [ ] **JS-006:** Search requires minimum 2 characters
- [ ] **JS-007:** Error message displays if < 2 characters entered
- [ ] **JS-008:** Search executes on "Enter" key press
- [ ] **JS-009:** Search button executes search
- [ ] **JS-010:** Loading indicator displays during search
- [ ] **JS-011:** Search results display in list format
- [ ] **JS-012:** "No results found" displays for empty results
- [ ] **JS-013:** Search term highlights in results (optional)

**Expected Behavior:** Fast search (< 1 second), relevant results appear

### 3.3 Search Results Display

- [ ] **JS-014:** Search results show same info as job listing (title, budget, etc.)
- [ ] **JS-015:** Tapping result navigates to job details
- [ ] **JS-016:** Search results match query text
- [ ] **JS-017:** Clearing search field resets to empty state
- [ ] **JS-018:** Multiple searches work consecutively

**Expected Behavior:** Results match search query, accurate and complete

---

## 4️⃣ Job Details Screen

### 4.1 Navigation & Display

- [ ] **JD-001:** Tapping job card opens job details screen
- [ ] **JD-002:** Loading spinner displays while fetching details
- [ ] **JD-003:** Job details load within 2 seconds
- [ ] **JD-004:** Back button returns to previous screen
- [ ] **JD-005:** Share button displays in app bar (if implemented)

**Expected Behavior:** Smooth transition, all details load correctly

### 4.2 Job Information Display

- [ ] **JD-006:** Job title displays prominently
- [ ] **JD-007:** Full description displays (multiline, scrollable)
- [ ] **JD-008:** Budget displays: "₱5,000.00"
- [ ] **JD-009:** Location displays full address
- [ ] **JD-010:** Expected duration displays (e.g., "2-3 days")
- [ ] **JD-011:** Preferred start date displays (if provided)
- [ ] **JD-012:** Urgency level displays with colored badge
- [ ] **JD-013:** Category name displays
- [ ] **JD-014:** "Posted X hours/days ago" displays
- [ ] **JD-015:** Materials needed list displays (if provided)

**Expected Behavior:** All job information clearly readable, properly formatted

### 4.3 Photo Gallery

- [ ] **JD-016:** Job photos display in gallery/carousel format
- [ ] **JD-017:** Can swipe between multiple photos
- [ ] **JD-018:** Photos display in full width
- [ ] **JD-019:** Photo count indicator displays (e.g., "1 / 5")
- [ ] **JD-020:** Tapping photo opens full-screen view (if implemented)
- [ ] **JD-021:** Placeholder image displays if no photos
- [ ] **JD-022:** Photos load progressively (lazy loading)

**Expected Behavior:** Smooth swiping, clear images, no broken image links

### 4.4 Client Information

- [ ] **JD-023:** Client name displays
- [ ] **JD-024:** Client avatar/photo displays (or placeholder)
- [ ] **JD-025:** Client city/location displays
- [ ] **JD-026:** Client rating displays (e.g., "4.5 ★")
- [ ] **JD-027:** Total jobs posted displays (if available)
- [ ] **JD-028:** Client info section clearly separated

**Expected Behavior:** Complete client profile visible, builds trust

### 4.5 Application Status Indicator

- [ ] **JD-029:** "Already Applied" badge displays if user applied
- [ ] **JD-030:** Application status displays (PENDING/ACCEPTED/REJECTED)
- [ ] **JD-031:** Apply button disabled if already applied
- [ ] **JD-032:** Apply button hidden if job status is not ACTIVE

**Expected Behavior:** Clear indication of application state

---

## 5️⃣ Application Submission

### 5.1 Application Modal/Screen

- [ ] **AS-001:** Tapping "Apply" button opens application modal
- [ ] **AS-002:** Modal displays job title and budget
- [ ] **AS-003:** Modal can be dismissed with X button or swipe down
- [ ] **AS-004:** All input fields visible without scrolling
- [ ] **AS-005:** Form scrolls if keyboard covers fields

**Expected Behavior:** Smooth modal animation, all fields accessible

### 5.2 Budget Option Selection

- [ ] **AS-006:** Two budget option cards display: "Accept Original" and "Negotiate"
- [ ] **AS-007:** "Accept Original" selected by default
- [ ] **AS-008:** Selected option highlights with primary color border
- [ ] **AS-009:** Original budget amount displays on "Accept" card
- [ ] **AS-010:** Tapping "Negotiate" shows budget input field
- [ ] **AS-011:** Tapping "Accept" hides budget input field
- [ ] **AS-012:** Budget pre-fills with original amount when switching

**Expected Behavior:** Clear visual feedback, smooth toggle between options

### 5.3 Budget Input (Negotiate Mode)

- [ ] **AS-013:** Budget input field appears only when "Negotiate" selected
- [ ] **AS-014:** Numeric keyboard appears for budget input
- [ ] **AS-015:** Budget accepts decimal values (e.g., 5000.50)
- [ ] **AS-016:** Budget validates > 0
- [ ] **AS-017:** Error message displays for invalid budget (empty, zero, negative)
- [ ] **AS-018:** Helper text displays: "Propose a different amount"

**Expected Behavior:** Easy number input, clear validation messages

### 5.4 Estimated Duration Input

- [ ] **AS-019:** Estimated duration field displays
- [ ] **AS-020:** Placeholder shows examples: "e.g., 2 days, 1 week, 3-5 days"
- [ ] **AS-021:** Free-form text input accepts any duration format
- [ ] **AS-022:** Field validates as required (not empty)
- [ ] **AS-023:** Error message displays if empty
- [ ] **AS-024:** Helper text displays: "How long will it take you to complete this job?"

**Expected Behavior:** Flexible input, clear expectations

### 5.5 Proposal Message Input

- [ ] **AS-025:** Proposal message field displays with 5 rows
- [ ] **AS-026:** Placeholder text: "Tell the client why you're the best fit..."
- [ ] **AS-027:** Character counter displays (e.g., "0 / 500")
- [ ] **AS-028:** Field validates minimum 20 characters
- [ ] **AS-029:** Field validates maximum 500 characters
- [ ] **AS-030:** Error displays: "Please write at least 20 characters"
- [ ] **AS-031:** Text wraps properly in input field

**Expected Behavior:** Comfortable typing area, clear character limits

### 5.6 Form Validation

- [ ] **AS-032:** Submit button disabled until all fields valid
- [ ] **AS-033:** All validation errors display at once
- [ ] **AS-034:** Red error text displays below invalid fields
- [ ] **AS-035:** Fields with errors highlight with red border
- [ ] **AS-036:** Validation triggers on blur (leaving field)
- [ ] **AS-037:** Validation clears when field becomes valid

**Expected Behavior:** Clear, immediate feedback on errors

### 5.7 Submission Process

- [ ] **AS-038:** Tapping "Submit Application" triggers submission
- [ ] **AS-039:** Loading spinner appears on button during submission
- [ ] **AS-040:** Button text changes to spinner/loading state
- [ ] **AS-041:** Button disabled during submission (no double-submit)
- [ ] **AS-042:** Modal cannot be dismissed during submission
- [ ] **AS-043:** Success message displays: "Application submitted successfully!"
- [ ] **AS-044:** Modal closes automatically after success
- [ ] **AS-045:** Job details screen updates to show "Already Applied"

**Expected Behavior:** 1-2 second submission, clear success confirmation

### 5.8 Error Handling

- [ ] **AS-046:** Network error displays: "Network error: [details]"
- [ ] **AS-047:** 409 error displays: "You have already applied to this job"
- [ ] **AS-048:** 404 error displays: "Job not found or no longer available"
- [ ] **AS-049:** Generic error displays: "Failed to submit application"
- [ ] **AS-050:** Error message displays in red snackbar/toast
- [ ] **AS-051:** Modal remains open after error for retry
- [ ] **AS-052:** User can correct input and resubmit after error

**Expected Behavior:** Clear error messages, easy to retry

---

## 6️⃣ My Applications Screen

### 6.1 Screen Access

- [ ] **MA-001:** "My Applications" menu item visible in navigation
- [ ] **MA-002:** Tapping navigates to applications list screen
- [ ] **MA-003:** Screen title displays: "My Applications"
- [ ] **MA-004:** Loading spinner displays while fetching

**Expected Behavior:** Easy access, clear navigation

### 6.2 Applications List Display

- [ ] **MA-005:** All worker's applications display in list
- [ ] **MA-006:** Applications sorted by date (newest first)
- [ ] **MA-007:** Each card shows: job title, budget, status, date
- [ ] **MA-008:** Status badge displays with color coding:
  - PENDING - Yellow/Orange
  - ACCEPTED - Green
  - REJECTED - Red
  - WITHDRAWN - Gray
- [ ] **MA-009:** "Applied X days ago" displays
- [ ] **MA-010:** Job thumbnail displays (if available)
- [ ] **MA-011:** Empty state displays: "No applications yet"
- [ ] **MA-012:** Pagination works for long lists (if implemented)

**Expected Behavior:** Clear status at a glance, easy to scan

### 6.3 Status Filtering

- [ ] **MA-013:** Filter tabs/buttons display at top
- [ ] **MA-014:** Filter options: All, Pending, Accepted, Rejected
- [ ] **MA-015:** Tapping filter updates list immediately
- [ ] **MA-016:** Active filter highlights
- [ ] **MA-017:** Application count updates per filter
- [ ] **MA-018:** "No [status] applications" displays when filtered list empty

**Expected Behavior:** Instant filtering, smooth transitions

### 6.4 Application Details View

- [ ] **MA-019:** Tapping application card opens details
- [ ] **MA-020:** Shows full job details
- [ ] **MA-021:** Shows submitted proposal message
- [ ] **MA-022:** Shows proposed budget (or "Accepted original")
- [ ] **MA-023:** Shows estimated duration
- [ ] **MA-024:** Shows application date/time
- [ ] **MA-025:** Shows current status prominently
- [ ] **MA-026:** Back button returns to list

**Expected Behavior:** Complete application info visible

### 6.5 Application Withdrawal

- [ ] **MA-027:** "Withdraw Application" button displays for PENDING applications
- [ ] **MA-028:** Button not visible for ACCEPTED/REJECTED applications
- [ ] **MA-029:** Confirmation dialog displays: "Withdraw this application?"
- [ ] **MA-030:** Dialog has Cancel and Confirm buttons
- [ ] **MA-031:** Tapping Confirm withdraws application
- [ ] **MA-032:** Loading indicator displays during withdrawal
- [ ] **MA-033:** Success message displays: "Application withdrawn"
- [ ] **MA-034:** Application status updates to WITHDRAWN
- [ ] **MA-035:** List updates to reflect withdrawal
- [ ] **MA-036:** Error message displays if withdrawal fails

**Expected Behavior:** Safe withdrawal with confirmation, immediate updates

---

## 7️⃣ Client: Job Applications Review

### 7.1 View Applications (Client Only)

- [ ] **CR-001:** Client can navigate to "My Jobs" screen
- [ ] **CR-002:** Job cards show application count: "5 applications"
- [ ] **CR-003:** Tapping job card opens job details
- [ ] **CR-004:** "View Applications" button displays for jobs with applications
- [ ] **CR-005:** Button displays application count
- [ ] **CR-006:** Tapping button opens applications list

**Expected Behavior:** Easy access to review applications

### 7.2 Applications List (Client View)

- [ ] **CR-007:** All applications for job display in list
- [ ] **CR-008:** Each card shows:
  - Worker name and avatar
  - Worker rating
  - Proposed budget (or "Accepts original")
  - Estimated duration
  - Proposal message (truncated)
  - Application status
  - Date submitted
- [ ] **CR-009:** Applications sorted by date (newest first)
- [ ] **CR-010:** Status filters work (All/Pending/Accepted/Rejected)
- [ ] **CR-011:** "No applications yet" displays if none

**Expected Behavior:** All applicant info clearly presented

### 7.3 Worker Profile View

- [ ] **CR-012:** Tapping worker name/avatar opens worker profile (if implemented)
- [ ] **CR-013:** Worker rating displays with stars
- [ ] **CR-014:** Worker city/location displays
- [ ] **CR-015:** Worker specialization displays (if available)

**Expected Behavior:** Enough info to make hiring decision

### 7.4 Application Detail View

- [ ] **CR-016:** Tapping application card opens full details
- [ ] **CR-017:** Full proposal message displays (not truncated)
- [ ] **CR-018:** Budget option clearly indicated:
  - "Accepts your budget of ₱5,000.00"
  - "Proposes ₱4,500.00"
- [ ] **CR-019:** Estimated duration displays prominently
- [ ] **CR-020:** Application date/time displays
- [ ] **CR-021:** Worker profile section displays

**Expected Behavior:** Complete proposal info for informed decision

### 7.5 Accept/Reject Application

- [ ] **CR-022:** "Accept" and "Reject" buttons display for PENDING applications
- [ ] **CR-023:** Buttons not visible for already ACCEPTED/REJECTED applications
- [ ] **CR-024:** Tapping "Accept" shows confirmation dialog
- [ ] **CR-025:** Confirmation explains: "This will assign the job to [worker]"
- [ ] **CR-026:** Tapping "Reject" shows confirmation dialog
- [ ] **CR-027:** Loading indicator displays during status update
- [ ] **CR-028:** Success message displays after accept/reject
- [ ] **CR-029:** Application status updates immediately
- [ ] **CR-030:** List updates to reflect status change
- [ ] **CR-031:** Other applications auto-reject when one accepted (if implemented)
- [ ] **CR-032:** Error message displays if update fails

**Expected Behavior:** Safe decisions with confirmation, immediate feedback

---

## 8️⃣ Mobile Responsiveness

### 8.1 Portrait Mode

- [ ] **MR-001:** All screens display correctly in portrait orientation
- [ ] **MR-002:** No horizontal scrolling required
- [ ] **MR-003:** Text remains readable (not too small)
- [ ] **MR-004:** Buttons are easily tappable (min 44x44 points)
- [ ] **MR-005:** Images scale properly
- [ ] **MR-006:** Forms fit on screen without scrolling (except long lists)

**Expected Behavior:** Comfortable use in portrait mode

### 8.2 Landscape Mode (Optional)

- [ ] **MR-007:** Screens adapt to landscape orientation
- [ ] **MR-008:** No UI elements hidden off-screen
- [ ] **MR-009:** Text remains readable
- [ ] **MR-010:** Images scale appropriately
- [ ] **MR-011:** Keyboard doesn't cover input fields

**Expected Behavior:** Functional in landscape (if supported)

### 8.3 Different Screen Sizes

- [ ] **MR-012:** UI works on small phones (iPhone SE, ~4.7")
- [ ] **MR-013:** UI works on medium phones (iPhone 13, ~6.1")
- [ ] **MR-014:** UI works on large phones (iPhone 13 Pro Max, ~6.7")
- [ ] **MR-015:** UI works on tablets (iPad, 10"+)
- [ ] **MR-016:** Text scales appropriately
- [ ] **MR-017:** Touch targets remain accessible
- [ ] **MR-018:** No content cutoff on any device

**Expected Behavior:** Responsive across all device sizes

---

## 9️⃣ Performance Testing

### 9.1 Loading Times

- [ ] **PT-001:** Job listing loads in < 3 seconds on 3G
- [ ] **PT-002:** Job details load in < 2 seconds on 3G
- [ ] **PT-003:** Search results load in < 1 second on WiFi
- [ ] **PT-004:** Application submission completes in < 2 seconds
- [ ] **PT-005:** Images load progressively (don't block UI)
- [ ] **PT-006:** App remains responsive during API calls

**Expected Behavior:** Fast, responsive performance

### 9.2 Offline Behavior

- [ ] **PT-007:** Clear error message displays when offline
- [ ] **PT-008:** App doesn't crash when offline
- [ ] **PT-009:** "No internet connection" message displays
- [ ] **PT-010:** Retry button/option available
- [ ] **PT-011:** Cached data displays with "Offline" indicator (if implemented)

**Expected Behavior:** Graceful offline handling

### 9.3 Memory & Battery

- [ ] **PT-012:** App memory usage remains stable (no leaks)
- [ ] **PT-013:** Scrolling through long lists remains smooth
- [ ] **PT-014:** No significant battery drain during normal use
- [ ] **PT-015:** App doesn't heat device excessively
- [ ] **PT-016:** Background tasks don't drain battery (if any)

**Expected Behavior:** Efficient resource usage

---

## 🔟 Security & Authentication

### 10.1 Authentication

- [ ] **SA-001:** Unauthenticated users redirected to login
- [ ] **SA-002:** JWT token stored securely (FlutterSecureStorage)
- [ ] **SA-003:** Token included in all API requests (Authorization header)
- [ ] **SA-004:** 401 responses trigger re-login flow
- [ ] **SA-005:** Session expires after timeout (if implemented)
- [ ] **SA-006:** User logged out cannot access protected screens

**Expected Behavior:** Secure authentication, seamless token handling

### 10.2 Authorization

- [ ] **SA-007:** Workers can only apply to jobs (not view applications)
- [ ] **SA-008:** Clients can only view applications for their own jobs
- [ ] **SA-009:** 403 errors display clear message: "Access denied"
- [ ] **SA-010:** Users cannot access other users' applications
- [ ] **SA-011:** Direct URL/deep link access respects permissions (if applicable)

**Expected Behavior:** Proper role-based access control

### 10.3 Data Privacy

- [ ] **SA-012:** Sensitive data not logged to console in production
- [ ] **SA-013:** API responses don't expose unnecessary user data
- [ ] **SA-014:** Passwords/tokens never displayed in UI
- [ ] **SA-015:** Forms don't auto-fill sensitive data inappropriately

**Expected Behavior:** User data protected and private

---

## 1️⃣1️⃣ Edge Cases & Error Scenarios

### 11.1 Network Errors

- [ ] **EC-001:** Slow network displays loading state (not freeze)
- [ ] **EC-002:** Network timeout displays clear error
- [ ] **EC-003:** Server 500 error displays user-friendly message
- [ ] **EC-004:** Retry button works after network error
- [ ] **EC-005:** App recovers gracefully after network restored

**Expected Behavior:** Resilient error handling

### 11.2 Data Edge Cases

- [ ] **EC-006:** Empty job list displays helpful message
- [ ] **EC-007:** Job with no photos displays placeholder
- [ ] **EC-008:** Job with very long description scrolls properly
- [ ] **EC-009:** Job with special characters displays correctly
- [ ] **EC-010:** Very large budget amounts format correctly (e.g., ₱1,000,000.00)
- [ ] **EC-011:** Null/missing optional fields handled gracefully

**Expected Behavior:** Handles all data variations

### 11.3 User Action Edge Cases

- [ ] **EC-012:** Cannot submit same application twice (duplicate prevention)
- [ ] **EC-013:** Cannot apply to COMPLETED/CANCELLED jobs
- [ ] **EC-014:** Cannot withdraw already ACCEPTED application
- [ ] **EC-015:** Rapid button tapping doesn't cause issues
- [ ] **EC-016:** Back button during API call cancels request (or waits)
- [ ] **EC-017:** App state recovers after force-close during submission

**Expected Behavior:** Robust handling of user actions

### 11.4 Concurrent Actions

- [ ] **EC-018:** Job status updates reflect immediately if changed by another user
- [ ] **EC-019:** Application status updates when client accepts/rejects
- [ ] **EC-020:** Job deleted/cancelled by client displays clear message
- [ ] **EC-021:** Multiple users applying simultaneously handled correctly

**Expected Behavior:** Real-time updates, no data conflicts

---

## 1️⃣2️⃣ Accessibility

### 12.1 Screen Reader Support

- [ ] **AC-001:** All interactive elements have semantic labels
- [ ] **AC-002:** Screen reader announces screen changes
- [ ] **AC-003:** Form fields have proper labels/hints
- [ ] **AC-004:** Error messages announced by screen reader
- [ ] **AC-005:** Status changes announced (e.g., "Application submitted")

**Expected Behavior:** Fully usable with screen reader

### 12.2 Touch Targets

- [ ] **AC-006:** All buttons meet minimum size (44x44 points)
- [ ] **AC-007:** Adequate spacing between tappable elements
- [ ] **AC-008:** No overlapping touch targets
- [ ] **AC-009:** Swipe gestures have alternatives (if used)

**Expected Behavior:** Easy to tap accurately

### 12.3 Visual Accessibility

- [ ] **AC-010:** Text has sufficient contrast (WCAG AA minimum)
- [ ] **AC-011:** Color not the only indicator (e.g., status has icons too)
- [ ] **AC-012:** Font sizes are readable (minimum 14pt)
- [ ] **AC-013:** Text remains readable in system large font mode

**Expected Behavior:** Readable for users with visual impairments

---

## 1️⃣3️⃣ Platform-Specific Testing

### 13.1 iOS-Specific

- [ ] **PS-001:** App works on iOS 13+ (or minimum supported version)
- [ ] **PS-002:** Pull-to-refresh uses iOS standard behavior
- [ ] **PS-003:** Navigation follows iOS Human Interface Guidelines
- [ ] **PS-004:** Modal sheets slide up from bottom (iOS style)
- [ ] **PS-005:** Back button uses iOS standard chevron
- [ ] **PS-006:** Keyboard dismisses with swipe down gesture
- [ ] **PS-007:** Safe area insets respected (no content behind notch)

**Expected Behavior:** Native iOS feel and behavior

### 13.2 Android-Specific

- [ ] **PS-008:** App works on Android 8+ (or minimum supported version)
- [ ] **PS-009:** Back button (hardware/gesture) works correctly
- [ ] **PS-010:** Material Design components used appropriately
- [ ] **PS-011:** Snackbars appear at bottom (Material style)
- [ ] **PS-012:** Floating action buttons positioned correctly (if used)
- [ ] **PS-013:** Status bar color appropriate for theme
- [ ] **PS-014:** Navigation bar color appropriate for theme

**Expected Behavior:** Native Android feel and behavior

---

## 🐛 Bug Tracking Template

Use this template to report any bugs found during testing:

```markdown
**Bug ID:** [Unique ID, e.g., MB-001]
**Test Case:** [Test case ID that failed]
**Severity:** Critical / High / Medium / Low
**Platform:** iOS / Android / Both
**Device:** [Model and OS version]

**Steps to Reproduce:**

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Video:**
[Attach if applicable]

**Additional Notes:**
[Any other relevant information]
```

---

## 📊 Test Summary

**Total Test Cases:** 300+

### By Category

| Category               | Test Cases | Passed | Failed | Blocked | N/A   |
| ---------------------- | ---------- | ------ | ------ | ------- | ----- |
| Job Listing & Browsing | 26         |        |        |         |       |
| Category Filtering     | 13         |        |        |         |       |
| Job Search             | 18         |        |        |         |       |
| Job Details Screen     | 29         |        |        |         |       |
| Application Submission | 52         |        |        |         |       |
| My Applications        | 36         |        |        |         |       |
| Client Review          | 32         |        |        |         |       |
| Mobile Responsiveness  | 18         |        |        |         |       |
| Performance            | 16         |        |        |         |       |
| Security & Auth        | 15         |        |        |         |       |
| Edge Cases             | 21         |        |        |         |       |
| Accessibility          | 13         |        |        |         |       |
| Platform-Specific      | 14         |        |        |         |       |
| **TOTAL**              | **303**    | **0**  | **0**  | **0**   | **0** |

---

## ✅ Sign-Off

### QA Tester

- **Name:** ************\_************
- **Date:** ************\_************
- **Signature:** **********\_**********

**Overall Status:** ☐ PASS ☐ FAIL ☐ PASS WITH ISSUES

**Notes:**

```
[Add any overall observations, recommendations, or concerns]
```

### Product Owner / Lead Developer

- **Name:** ************\_************
- **Date:** ************\_************
- **Signature:** **********\_**********
- **Approval:** ☐ Approved for Production ☐ Needs Revisions

---

## 📝 Notes & Observations

```
[Space for testers to add general observations, suggestions, or issues that don't fit specific test cases]
```

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Status:** Ready for QA Testing
