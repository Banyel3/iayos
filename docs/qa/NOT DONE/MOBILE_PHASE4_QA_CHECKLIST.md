# Mobile Phase 4 - QA Testing Checklist

**Phase**: 4 - Worker Profile & Application Management  
**Date**: November 14, 2025  
**Status**: Ready for Testing  
**Tester**: ******\_******  
**Build Version**: ******\_******

---

## 📋 Testing Overview

This checklist covers comprehensive testing for Phase 4 features. Mark each test as:

- ✅ **PASS** - Feature works as expected
- ❌ **FAIL** - Feature has issues (note in Bug Tracking section)
- ⚠️ **PARTIAL** - Feature works with minor issues
- ⏭️ **SKIP** - Not applicable or deferred

---

## 1️⃣ Profile Screen Testing

### 1.1 Profile Loading

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 1.1.1 | Profile loads on first visit         | ⬜     |       |
| 1.1.2 | Loading spinner shows while fetching | ⬜     |       |
| 1.1.3 | Profile data renders after load      | ⬜     |       |
| 1.1.4 | Error state shows if API fails       | ⬜     |       |
| 1.1.5 | Retry button works on error          | ⬜     |       |
| 1.1.6 | Profile caches for 5 minutes         | ⬜     |       |

### 1.2 Profile Header

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 1.2.1 | Avatar placeholder shows person icon   | ⬜     |       |
| 1.2.2 | Full name displays correctly           | ⬜     |       |
| 1.2.3 | Email displays correctly               | ⬜     |       |
| 1.2.4 | Phone number shows if present          | ⬜     |       |
| 1.2.5 | Phone verified badge shows if verified | ⬜     |       |
| 1.2.6 | Edit button visible in top right       | ⬜     |       |
| 1.2.7 | Edit button navigates to edit screen   | ⬜     |       |

### 1.3 Profile Completion Widget

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 1.3.1 | Circular progress shows percentage     | ⬜     |       |
| 1.3.2 | Color is red when <30%                 | ⬜     |       |
| 1.3.3 | Color is yellow when 30-70%            | ⬜     |       |
| 1.3.4 | Color is green when >70%               | ⬜     |       |
| 1.3.5 | Linear progress bar matches percentage | ⬜     |       |
| 1.3.6 | Info button shows checklist modal      | ⬜     |       |
| 1.3.7 | Modal shows all 8 criteria             | ⬜     |       |
| 1.3.8 | Completed criteria show ✓              | ⬜     |       |
| 1.3.9 | Incomplete criteria show ○             | ⬜     |       |

### 1.4 Profile Completion Calculation

| #     | Test Case                     | Status | Notes |
| ----- | ----------------------------- | ------ | ----- |
| 1.4.1 | Avatar adds 12.5%             | ⬜     |       |
| 1.4.2 | Bio (50+ chars) adds 12.5%    | ⬜     |       |
| 1.4.3 | Hourly rate adds 12.5%        | ⬜     |       |
| 1.4.4 | Skills/categories add 12.5%   | ⬜     |       |
| 1.4.5 | Phone verified adds 12.5%     | ⬜     |       |
| 1.4.6 | Service areas add 12.5%       | ⬜     |       |
| 1.4.7 | Certifications add 12.5%      | ⬜     |       |
| 1.4.8 | Portfolio adds 12.5%          | ⬜     |       |
| 1.4.9 | Total equals sum of completed | ⬜     |       |

### 1.5 Stats Cards

| #     | Test Case                         | Status | Notes |
| ----- | --------------------------------- | ------ | ----- |
| 1.5.1 | Jobs completed counter displays   | ⬜     |       |
| 1.5.2 | Total earnings shows PHP format   | ⬜     |       |
| 1.5.3 | Average rating displays (0.0-5.0) | ⬜     |       |
| 1.5.4 | Review count shows correctly      | ⬜     |       |
| 1.5.5 | Icons render correctly            | ⬜     |       |
| 1.5.6 | Cards have proper spacing         | ⬜     |       |

### 1.6 Profile Sections

| #      | Test Case                                | Status | Notes |
| ------ | ---------------------------------------- | ------ | ----- |
| 1.6.1  | Bio shows if present                     | ⬜     |       |
| 1.6.2  | Bio empty state shows if missing         | ⬜     |       |
| 1.6.3  | "Add Bio" button works                   | ⬜     |       |
| 1.6.4  | Hourly rate shows if set                 | ⬜     |       |
| 1.6.5  | Hourly rate empty state shows if missing | ⬜     |       |
| 1.6.6  | "Set Rate" button works                  | ⬜     |       |
| 1.6.7  | Skills render as blue chips              | ⬜     |       |
| 1.6.8  | Skills empty state shows if none         | ⬜     |       |
| 1.6.9  | "Add Skills" button works                | ⬜     |       |
| 1.6.10 | Categories render as green chips         | ⬜     |       |
| 1.6.11 | Service areas show with location icon    | ⬜     |       |

---

## 2️⃣ Edit Profile Screen Testing

### 2.1 Form Loading

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 2.1.1 | Form pre-fills with current data     | ⬜     |       |
| 2.1.2 | Loading spinner shows while fetching | ⬜     |       |
| 2.1.3 | All fields populate correctly        | ⬜     |       |
| 2.1.4 | Empty fields show placeholders       | ⬜     |       |

### 2.2 Bio Field

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 2.2.1 | TextArea accepts multiline input     | ⬜     |       |
| 2.2.2 | Character counter updates live       | ⬜     |       |
| 2.2.3 | Counter shows X/500 format           | ⬜     |       |
| 2.2.4 | Warning shows if <50 characters      | ⬜     |       |
| 2.2.5 | Cannot exceed 500 characters         | ⬜     |       |
| 2.2.6 | Field border highlights on focus     | ⬜     |       |
| 2.2.7 | Validation error shows if 1-49 chars | ⬜     |       |

### 2.3 Hourly Rate Field

| #     | Test Case                          | Status | Notes |
| ----- | ---------------------------------- | ------ | ----- |
| 2.3.1 | Shows ₱ prefix                     | ⬜     |       |
| 2.3.2 | Shows /hour suffix                 | ⬜     |       |
| 2.3.3 | Accepts decimal input              | ⬜     |       |
| 2.3.4 | Numeric keyboard appears           | ⬜     |       |
| 2.3.5 | Rejects negative values            | ⬜     |       |
| 2.3.6 | Rejects values >10,000             | ⬜     |       |
| 2.3.7 | Validation error shows for invalid | ⬜     |       |

### 2.4 Phone Number Field

| #     | Test Case                          | Status | Notes |
| ----- | ---------------------------------- | ------ | ----- |
| 2.4.1 | Shows phone icon prefix            | ⬜     |       |
| 2.4.2 | Phone keyboard appears             | ⬜     |       |
| 2.4.3 | Placeholder shows example format   | ⬜     |       |
| 2.4.4 | Accepts 10-15 digits               | ⬜     |       |
| 2.4.5 | Rejects <10 digits                 | ⬜     |       |
| 2.4.6 | Rejects >15 digits                 | ⬜     |       |
| 2.4.7 | Validation error shows for invalid | ⬜     |       |

### 2.5 Skills Field

| #     | Test Case                           | Status | Notes |
| ----- | ----------------------------------- | ------ | ----- |
| 2.5.1 | Accepts comma-separated values      | ⬜     |       |
| 2.5.2 | Placeholder shows example           | ⬜     |       |
| 2.5.3 | Validates each skill 2-50 chars     | ⬜     |       |
| 2.5.4 | Trims whitespace around commas      | ⬜     |       |
| 2.5.5 | Validation error for invalid skills | ⬜     |       |

### 2.6 Form Behavior

| #      | Test Case                            | Status | Notes |
| ------ | ------------------------------------ | ------ | ----- |
| 2.6.1  | Save button disabled initially       | ⬜     |       |
| 2.6.2  | Save button enables on change        | ⬜     |       |
| 2.6.3  | Preview section shows changed fields | ⬜     |       |
| 2.6.4  | Preview updates as fields change     | ⬜     |       |
| 2.6.5  | Cancel shows confirmation if changed | ⬜     |       |
| 2.6.6  | Cancel without changes goes back     | ⬜     |       |
| 2.6.7  | Save shows loading spinner           | ⬜     |       |
| 2.6.8  | Save disables button during submit   | ⬜     |       |
| 2.6.9  | Success toast shows on save          | ⬜     |       |
| 2.6.10 | Navigates back after success         | ⬜     |       |
| 2.6.11 | Error toast shows on failure         | ⬜     |       |
| 2.6.12 | Profile query invalidated after save | ⬜     |       |

### 2.7 Keyboard Behavior

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 2.7.1 | Screen scrolls with keyboard (iOS)     | ⬜     |       |
| 2.7.2 | Screen scrolls with keyboard (Android) | ⬜     |       |
| 2.7.3 | Fields not hidden by keyboard          | ⬜     |       |
| 2.7.4 | Can scroll while keyboard open         | ⬜     |       |
| 2.7.5 | Keyboard closes on outside tap         | ⬜     |       |

---

## 3️⃣ Application Detail Screen Testing

### 3.1 Screen Loading

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 3.1.1 | Detail loads from applications list  | ⬜     |       |
| 3.1.2 | Loading spinner shows while fetching | ⬜     |       |
| 3.1.3 | Data renders after load              | ⬜     |       |
| 3.1.4 | Error state shows if API fails       | ⬜     |       |
| 3.1.5 | Back button returns to list          | ⬜     |       |

### 3.2 Status Badge

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 3.2.1 | PENDING shows yellow with clock icon | ⬜     |       |
| 3.2.2 | ACCEPTED shows green with check icon | ⬜     |       |
| 3.2.3 | REJECTED shows red with X icon       | ⬜     |       |
| 3.2.4 | WITHDRAWN shows gray with back icon  | ⬜     |       |
| 3.2.5 | Badge is large and prominent         | ⬜     |       |

### 3.3 Job Information Card

| #     | Test Case                    | Status | Notes |
| ----- | ---------------------------- | ------ | ----- |
| 3.3.1 | Job title displays correctly | ⬜     |       |
| 3.3.2 | Category shows with icon     | ⬜     |       |
| 3.3.3 | Location shows with icon     | ⬜     |       |
| 3.3.4 | Full description displays    | ⬜     |       |
| 3.3.5 | Job budget shows PHP format  | ⬜     |       |

### 3.4 Application Card

| #     | Test Case                           | Status | Notes |
| ----- | ----------------------------------- | ------ | ----- |
| 3.4.1 | Proposed budget shows large         | ⬜     |       |
| 3.4.2 | Budget in primary blue color        | ⬜     |       |
| 3.4.3 | Estimated duration shows if present | ⬜     |       |
| 3.4.4 | Full proposal message displays      | ⬜     |       |
| 3.4.5 | Applied date shows relative time    | ⬜     |       |

### 3.5 Client Card

| #     | Test Case                     | Status | Notes |
| ----- | ----------------------------- | ------ | ----- |
| 3.5.1 | Client avatar renders (48x48) | ⬜     |       |
| 3.5.2 | Client name displays          | ⬜     |       |
| 3.5.3 | Client email displays         | ⬜     |       |
| 3.5.4 | Card has proper layout        | ⬜     |       |

### 3.6 Timeline

| #     | Test Case                     | Status | Notes |
| ----- | ----------------------------- | ------ | ----- |
| 3.6.1 | Timeline renders vertically   | ⬜     |       |
| 3.6.2 | Dots show for each event      | ⬜     |       |
| 3.6.3 | Lines connect between events  | ⬜     |       |
| 3.6.4 | Event action is bold          | ⬜     |       |
| 3.6.5 | Event description displays    | ⬜     |       |
| 3.6.6 | Relative timestamps show      | ⬜     |       |
| 3.6.7 | Events in chronological order | ⬜     |       |

### 3.7 Action Buttons

| #      | Test Case                               | Status | Notes |
| ------ | --------------------------------------- | ------ | ----- |
| 3.7.1  | "View Job" always visible               | ⬜     |       |
| 3.7.2  | "View Job" navigates to job detail      | ⬜     |       |
| 3.7.3  | "Contact Client" shows if ACCEPTED      | ⬜     |       |
| 3.7.4  | "Contact Client" hidden if not accepted | ⬜     |       |
| 3.7.5  | "Withdraw" shows if PENDING             | ⬜     |       |
| 3.7.6  | "Withdraw" hidden if not pending        | ⬜     |       |
| 3.7.7  | Withdraw shows confirmation dialog      | ⬜     |       |
| 3.7.8  | Withdraw "Cancel" keeps application     | ⬜     |       |
| 3.7.9  | Withdraw "Confirm" disables button      | ⬜     |       |
| 3.7.10 | Withdraw shows loading spinner          | ⬜     |       |
| 3.7.11 | Success toast shows after withdraw      | ⬜     |       |
| 3.7.12 | Navigates back after withdraw           | ⬜     |       |
| 3.7.13 | Application list updates after withdraw | ⬜     |       |

---

## 4️⃣ Application List Enhancements Testing

### 4.1 Card Actions

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 4.1.1 | "View Details" button visible on cards | ⬜     |       |
| 4.1.2 | "View Job" button visible on cards     | ⬜     |       |
| 4.1.3 | Both buttons equal width (50/50)       | ⬜     |       |
| 4.1.4 | Border separator above actions         | ⬜     |       |
| 4.1.5 | Proper spacing between buttons         | ⬜     |       |
| 4.1.6 | "View Details" navigates to detail     | ⬜     |       |
| 4.1.7 | "View Job" navigates to job            | ⬜     |       |
| 4.1.8 | Actions work for all statuses          | ⬜     |       |

---

## 5️⃣ Navigation Testing

### 5.1 Profile Navigation

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 5.1.1 | Profile tab shows for workers        | ⬜     |       |
| 5.1.2 | "View Full Profile" button visible   | ⬜     |       |
| 5.1.3 | Button navigates to profile screen   | ⬜     |       |
| 5.1.4 | Edit button navigates to edit screen | ⬜     |       |
| 5.1.5 | Back from edit returns to profile    | ⬜     |       |
| 5.1.6 | Back from profile returns to tab     | ⬜     |       |

### 5.2 Application Navigation

| #     | Test Case                          | Status | Notes |
| ----- | ---------------------------------- | ------ | ----- |
| 5.2.1 | Applications tab shows list        | ⬜     |       |
| 5.2.2 | Card tap opens detail              | ⬜     |       |
| 5.2.3 | "View Details" opens detail        | ⬜     |       |
| 5.2.4 | Back from detail returns to list   | ⬜     |       |
| 5.2.5 | "View Job" navigates to job detail | ⬜     |       |

### 5.3 Deep Linking

| #     | Test Case                      | Status | Notes |
| ----- | ------------------------------ | ------ | ----- |
| 5.3.1 | Direct URL to profile works    | ⬜     |       |
| 5.3.2 | Direct URL to edit works       | ⬜     |       |
| 5.3.3 | Direct URL to app detail works | ⬜     |       |

---

## 6️⃣ Data Persistence Testing

### 6.1 Query Caching

| #     | Test Case                       | Status | Notes |
| ----- | ------------------------------- | ------ | ----- |
| 6.1.1 | Profile cached for 5 minutes    | ⬜     |       |
| 6.1.2 | Navigating away preserves cache | ⬜     |       |
| 6.1.3 | Returning shows cached data     | ⬜     |       |
| 6.1.4 | Refetch after cache expires     | ⬜     |       |

### 6.2 Query Invalidation

| #     | Test Case                          | Status | Notes |
| ----- | ---------------------------------- | ------ | ----- |
| 6.2.1 | Profile updates after edit save    | ⬜     |       |
| 6.2.2 | Applications update after withdraw | ⬜     |       |
| 6.2.3 | Detail updates after action        | ⬜     |       |
| 6.2.4 | List reflects changes immediately  | ⬜     |       |

---

## 7️⃣ Error Handling Testing

### 7.1 Network Errors

| #     | Test Case                         | Status | Notes |
| ----- | --------------------------------- | ------ | ----- |
| 7.1.1 | Offline shows error state         | ⬜     |       |
| 7.1.2 | Timeout shows error state         | ⬜     |       |
| 7.1.3 | 500 error shows friendly message  | ⬜     |       |
| 7.1.4 | 404 error shows not found message | ⬜     |       |
| 7.1.5 | Retry button works after error    | ⬜     |       |

### 7.2 Validation Errors

| #     | Test Case                       | Status | Notes |
| ----- | ------------------------------- | ------ | ----- |
| 7.2.1 | Bio too short shows error       | ⬜     |       |
| 7.2.2 | Bio too long shows error        | ⬜     |       |
| 7.2.3 | Invalid hourly rate shows error | ⬜     |       |
| 7.2.4 | Invalid phone shows error       | ⬜     |       |
| 7.2.5 | Invalid skills show error       | ⬜     |       |
| 7.2.6 | All errors clear on valid input | ⬜     |       |

### 7.3 API Errors

| #     | Test Case                          | Status | Notes |
| ----- | ---------------------------------- | ------ | ----- |
| 7.3.1 | 400 shows validation message       | ⬜     |       |
| 7.3.2 | 401 redirects to login             | ⬜     |       |
| 7.3.3 | 403 shows permission denied        | ⬜     |       |
| 7.3.4 | Generic errors show friendly toast | ⬜     |       |

---

## 8️⃣ Performance Testing

### 8.1 Load Times

| #     | Test Case                          | Status | Notes |
| ----- | ---------------------------------- | ------ | ----- |
| 8.1.1 | Profile loads <1 second            | ⬜     |       |
| 8.1.2 | Edit screen opens instantly        | ⬜     |       |
| 8.1.3 | Application detail loads <1 second | ⬜     |       |
| 8.1.4 | Form saves <2 seconds              | ⬜     |       |

### 8.2 Animations

| #     | Test Case                             | Status | Notes |
| ----- | ------------------------------------- | ------ | ----- |
| 8.2.1 | Navigation transitions smooth (60fps) | ⬜     |       |
| 8.2.2 | Loading spinners animate smoothly     | ⬜     |       |
| 8.2.3 | No frame drops during scroll          | ⬜     |       |
| 8.2.4 | Modal animations smooth               | ⬜     |       |

### 8.3 Memory

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 8.3.1 | No memory leaks after 10 navigations | ⬜     |       |
| 8.3.2 | Memory usage stable over time        | ⬜     |       |
| 8.3.3 | Images released from memory          | ⬜     |       |

---

## 9️⃣ Device-Specific Testing

### 9.1 iOS Testing

| #     | Test Case                             | Status | Notes |
| ----- | ------------------------------------- | ------ | ----- |
| 9.1.1 | Profile screen renders correctly      | ⬜     |       |
| 9.1.2 | Edit screen keyboard behavior correct | ⬜     |       |
| 9.1.3 | Safe area insets respected            | ⬜     |       |
| 9.1.4 | Haptic feedback on button taps        | ⬜     |       |
| 9.1.5 | iOS design patterns followed          | ⬜     |       |

### 9.2 Android Testing

| #     | Test Case                             | Status | Notes |
| ----- | ------------------------------------- | ------ | ----- |
| 9.2.1 | Profile screen renders correctly      | ⬜     |       |
| 9.2.2 | Edit screen keyboard behavior correct | ⬜     |       |
| 9.2.3 | Back button handled correctly         | ⬜     |       |
| 9.2.4 | Material design patterns followed     | ⬜     |       |
| 9.2.5 | Ripple effects on buttons             | ⬜     |       |

### 9.3 Screen Sizes

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 9.3.1 | Small screens (320-375px) layout OK  | ⬜     |       |
| 9.3.2 | Medium screens (375-414px) layout OK | ⬜     |       |
| 9.3.3 | Large screens (414px+) layout OK     | ⬜     |       |
| 9.3.4 | Tablet screens (768px+) layout OK    | ⬜     |       |
| 9.3.5 | Text readable on all sizes           | ⬜     |       |
| 9.3.6 | Touch targets adequate (44x44)       | ⬜     |       |

---

## 🔟 Accessibility Testing

### 10.1 Visual

| #      | Test Case                     | Status | Notes |
| ------ | ----------------------------- | ------ | ----- |
| 10.1.1 | Color contrast passes WCAG AA | ⬜     |       |
| 10.1.2 | Text readable without zoom    | ⬜     |       |
| 10.1.3 | Icons have text labels        | ⬜     |       |
| 10.1.4 | Status colors distinguishable | ⬜     |       |

### 10.2 Interactive

| #      | Test Case                        | Status | Notes |
| ------ | -------------------------------- | ------ | ----- |
| 10.2.1 | All buttons tappable (44x44 min) | ⬜     |       |
| 10.2.2 | Form fields have labels          | ⬜     |       |
| 10.2.3 | Error messages clear             | ⬜     |       |
| 10.2.4 | Loading states announced         | ⬜     |       |

---

## 🐛 Bug Tracking

### Critical Bugs (Blocks Release)

| #   | Description | Steps to Reproduce | Status |
| --- | ----------- | ------------------ | ------ |
|     |             |                    |        |

### Major Bugs (Should Fix)

| #   | Description | Steps to Reproduce | Status |
| --- | ----------- | ------------------ | ------ |
|     |             |                    |        |

### Minor Bugs (Nice to Fix)

| #   | Description | Steps to Reproduce | Status |
| --- | ----------- | ------------------ | ------ |
|     |             |                    |        |

---

## 📊 Test Summary

### Coverage Statistics

- **Total Test Cases**: 250+
- **Tests Passed**: **\_** / **\_**
- **Tests Failed**: **\_** / **\_**
- **Tests Skipped**: **\_** / **\_**
- **Pass Rate**: **\_**%

### Sign-Off

**Tested By**: **********\_**********  
**Date**: **********\_**********  
**Environment**: iOS / Android (circle one)  
**Device**: **********\_**********  
**Build Version**: **********\_**********

**Status**:

- [ ] ✅ APPROVED FOR RELEASE
- [ ] ⚠️ APPROVED WITH NOTES
- [ ] ❌ NOT APPROVED

**Notes**:

---

---

---

---

**Document Version**: 1.0  
**Last Updated**: November 14, 2025  
**Related Docs**: MOBILE_PHASE4_COMPLETE.md, MOBILE_PHASE4_PLAN.md
