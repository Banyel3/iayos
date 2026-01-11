# QA Checklist - React Native Screens Keyboard Fix

**Feature:** Keyboard Functionality Restoration
**Platform:** Mobile (iOS & Android)
**Bug Fix:** React Native Screens Downgrade (4.16.0 → 3.11.0)
**Date Created:** November 16, 2025
**Priority:** HIGH

---

## OVERVIEW

This QA checklist covers testing for the keyboard functionality fix implemented by downgrading `react-native-screens` from version 4.16.0 to 3.11.0.

**What Changed:**
- Downgraded react-native-screens package version
- Fixed keyboard not appearing/responding to text inputs
- Restored focus management and input handling

**Expected Outcome:**
- All text inputs should show keyboard when tapped
- Keyboard should hide appropriately when dismissed
- Text entry should work smoothly across all screens

---

## PRE-TESTING SETUP

### Environment Requirements
- [ ] Latest code from `dev` branch pulled
- [ ] `node_modules` cleared and reinstalled with `--legacy-peer-deps`
- [ ] Package version verified: `npm list react-native-screens` shows `3.11.0`
- [ ] Metro bundler cache cleared: `npx expo start -c`

### Test Devices
- [ ] iOS Device/Simulator (minimum iOS 13+)
- [ ] Android Device/Emulator (minimum Android 8.0+)
- [ ] Expo Go app (latest version)

---

## CRITICAL FUNCTIONALITY TESTS

### 1. Authentication Screens

#### Login Screen (`app/auth/login.tsx`)
**iOS:**
- [ ] Tap email input - keyboard appears
- [ ] Type in email field - text visible and responsive
- [ ] Tap password input - keyboard switches with secure text entry
- [ ] Type in password field - text entry works
- [ ] Tap outside inputs - keyboard dismisses
- [ ] Switch between email/password - keyboard maintains correct type

**Android:**
- [ ] Tap email input - keyboard appears
- [ ] Type in email field - text visible and responsive
- [ ] Tap password input - keyboard switches with secure text entry
- [ ] Type in password field - text entry works
- [ ] Back button dismisses keyboard
- [ ] Switch between email/password - keyboard maintains correct type

#### Register Screen (`app/auth/register.tsx`)
**iOS:**
- [ ] All text inputs (email, password, confirm password, name) work
- [ ] Keyboard type changes appropriately (email keyboard for email field)
- [ ] Form validation doesn't break keyboard
- [ ] Scrolling works when keyboard is visible
- [ ] Keyboard doesn't cover submit button

**Android:**
- [ ] All text inputs functional
- [ ] Keyboard type correct for each field
- [ ] Form scrolls properly with keyboard open
- [ ] Submit button accessible with keyboard visible

---

### 2. Profile Screens

#### Profile Edit (`app/profile/edit.tsx`)
**iOS:**
- [ ] First name input works
- [ ] Last name input works
- [ ] Bio text area works (multiline)
- [ ] Contact number input works
- [ ] Birth date picker doesn't interfere with keyboard
- [ ] Keyboard dismisses when scrolling

**Android:**
- [ ] All profile fields accept input
- [ ] Multiline bio field works correctly
- [ ] Date picker integration doesn't break keyboard
- [ ] Keyboard adapts to screen size

#### Certifications (`app/profile/certifications.tsx`)
**iOS:**
- [ ] Certification name input works
- [ ] Organization input functional
- [ ] Certificate number input works
- [ ] Date pickers work alongside text inputs

**Android:**
- [ ] All certification form fields functional
- [ ] Text inputs maintain state
- [ ] No keyboard flickering when switching fields

#### Materials (`app/profile/materials.tsx`)
**iOS:**
- [ ] Material name input works
- [ ] Description text area functional
- [ ] Price input accepts numeric keyboard
- [ ] Category dropdown doesn't conflict with keyboard

**Android:**
- [ ] Material form fields all functional
- [ ] Numeric keyboard for price field
- [ ] Text area scrolls properly

---

### 3. Job-Related Screens

#### Job Search (`app/jobs/search.tsx`)
**iOS:**
- [ ] Search input shows keyboard on tap
- [ ] Search input accepts text immediately
- [ ] Typing triggers search (if debounced)
- [ ] Clear button works without keyboard issues
- [ ] Keyboard dismisses when scrolling results

**Android:**
- [ ] Search functionality identical to iOS
- [ ] Keyboard search button triggers search
- [ ] No lag when typing

#### Job Application (`app/applications/browse.tsx`)
**iOS:**
- [ ] Application proposal input works
- [ ] Budget input accepts numbers
- [ ] Notes/description field functional
- [ ] Form scrolls with keyboard visible

**Android:**
- [ ] All application form inputs work
- [ ] Numeric keyboard for budget
- [ ] Multiline fields function correctly

---

### 4. Payment Screens

#### Wallet Deposit (`app/payments/deposit.tsx`)
**iOS:**
- [ ] Amount input shows numeric keyboard
- [ ] Amount field accepts decimal values
- [ ] Notes field works (if present)

**Android:**
- [ ] Numeric keyboard for amount
- [ ] Decimal input functional
- [ ] No keyboard issues on form submit

---

### 5. Messaging Screens

#### Chat/Messages (`app/messages/[id].tsx`)
**iOS:**
- [ ] Message input shows keyboard
- [ ] Typing is smooth and responsive
- [ ] Send button accessible with keyboard open
- [ ] Keyboard dismisses on send
- [ ] Message list scrolls to bottom with keyboard

**Android:**
- [ ] Message input functional
- [ ] Keyboard doesn't cover input field
- [ ] Send action works correctly
- [ ] Smooth keyboard animations

#### Conversations List (`app/messages/index.tsx`)
**iOS:**
- [ ] Search conversations input works

**Android:**
- [ ] Search input functional

---

## EDGE CASES & REGRESSION TESTS

### Keyboard Behavior
- [ ] **iOS:** Keyboard dismisses when tapping outside input
- [ ] **Android:** Back button dismisses keyboard (not app)
- [ ] Keyboard doesn't flicker when switching inputs
- [ ] Keyboard type switches correctly (email, numeric, text, secure)
- [ ] Keyboard accessory view works (if implemented)

### Screen Behavior
- [ ] **iOS:** Safe area insets respected with keyboard
- [ ] **Android:** Android navigation bar doesn't overlap keyboard
- [ ] Screen content scrolls when keyboard appears
- [ ] Inputs don't get hidden behind keyboard
- [ ] Modal screens handle keyboard correctly

### Form Handling
- [ ] Form validation doesn't dismiss keyboard unexpectedly
- [ ] Auto-focus on next field works (if implemented)
- [ ] Submit button remains accessible
- [ ] Error messages don't interfere with keyboard
- [ ] Loading states don't break keyboard

### Navigation
- [ ] Tab navigation works with keyboard open
- [ ] Stack navigation (push/pop) doesn't break keyboard state
- [ ] Modal presentation works with keyboard
- [ ] Going back dismisses keyboard appropriately

---

## PERFORMANCE TESTS

### Input Responsiveness
- [ ] No lag when typing (< 50ms latency)
- [ ] Cursor position accurate
- [ ] Text selection works smoothly
- [ ] Copy/paste functionality intact

### Screen Transitions
- [ ] Screen transitions smooth with keyboard
- [ ] No keyboard animation glitches
- [ ] Keyboard state preserved/cleared appropriately

### Memory & Stability
- [ ] No memory leaks with repeated keyboard show/hide
- [ ] App doesn't crash during rapid input switching
- [ ] Background/foreground transitions handle keyboard correctly

---

## ACCESSIBILITY TESTS

- [ ] **iOS VoiceOver:** Text inputs announced correctly
- [ ] **Android TalkBack:** Inputs accessible and labeled
- [ ] Large text settings don't break input fields
- [ ] Keyboard navigation works for accessibility users

---

## PLATFORM-SPECIFIC TESTS

### iOS Specific
- [ ] Keyboard toolbar/accessory view (if used)
- [ ] Smart punctuation doesn't interfere
- [ ] QuickType suggestions work
- [ ] Keyboard shortcuts (iPad) functional
- [ ] Dark mode keyboard appearance

### Android Specific
- [ ] Different keyboard apps tested (Gboard, SwiftKey, Samsung)
- [ ] Split-screen mode handles keyboard
- [ ] Gesture navigation compatible
- [ ] Dark mode keyboard appearance

---

## KNOWN ISSUES TO VERIFY

Check that these previous issues are NOT present:

- [ ] Keyboard doesn't appear at all (main issue fixed)
- [ ] Keyboard appears but text doesn't show
- [ ] Keyboard covers input fields completely
- [ ] Focus is lost when switching inputs
- [ ] Keyboard dismisses unexpectedly
- [ ] App crashes when keyboard appears

---

## REGRESSION TESTS

### Verify No New Issues Introduced

#### Bottom Tab Navigation
- [ ] Tab switching works smoothly
- [ ] Active tab indicator correct
- [ ] Tab icons render correctly
- [ ] Haptic feedback on tab press (if implemented)

#### Screen Rendering
- [ ] All screens render correctly
- [ ] No blank screens
- [ ] Images load properly
- [ ] Lists scroll smoothly

#### Navigation Stack
- [ ] Push navigation works
- [ ] Pop/back navigation works
- [ ] Modal presentation functional
- [ ] Deep linking works (if implemented)

---

## TEST RESULTS SUMMARY

### Test Execution
- **Date Tested:** _________________
- **Tested By:** _________________
- **iOS Version:** _________________
- **Android Version:** _________________
- **Build Number:** _________________

### Results
- **Total Tests:** _____ / _____
- **Passed:** _____
- **Failed:** _____
- **Blocked:** _____

### Critical Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Non-Critical Issues Found
1. _______________________________________
2. _______________________________________

### Performance Notes
- Keyboard latency: _____ ms (target: < 50ms)
- Screen transition fps: _____ fps (target: 60fps)
- Memory usage: _____ MB

---

## ACCEPTANCE CRITERIA

**MUST PASS:**
- [ ] All authentication screens functional
- [ ] All profile editing screens functional
- [ ] Search functionality works
- [ ] Chat/messaging input functional
- [ ] No keyboard-related crashes
- [ ] No regression in navigation

**NICE TO HAVE:**
- [ ] Keyboard animations smooth
- [ ] Accessibility fully functional
- [ ] Performance metrics within targets

---

## SIGN-OFF

### QA Engineer
- **Name:** _________________
- **Date:** _________________
- **Status:** PASS / FAIL / CONDITIONAL PASS

### Comments/Notes:
_______________________________________
_______________________________________
_______________________________________

---

## NEXT STEPS

If QA PASSES:
- [ ] Move this document to `docs/qa/DONE/` and rename to `*_REPORT.md`
- [ ] Update bug fix document with QA approval
- [ ] Clear for production deployment

If QA FAILS:
- [ ] Document all failing tests
- [ ] Create GitHub issues for failures
- [ ] Retest after fixes implemented

---

**Status:** NOT DONE (Awaiting QA)
**Priority:** HIGH
**Related Documentation:** `docs/bug-fixes/REACT_NATIVE_SCREENS_KEYBOARD_FIX.md`
