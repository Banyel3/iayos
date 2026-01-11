# 🧪 QA Testing Checklist - Agency Phase 1 (Client Perspective)

**Testing Date:** November 14, 2025 (Updated)  
**Phase:** Agency Phase 1 - Discovery & Integration System  
**Tester Role:** CLIENT USER  
**Test Environment:** Development (Docker containers)  
**Implementation Doc:** `docs/github-issues/AGENCY_PHASE_1_DISCOVERY_INTEGRATION.md`

---

## 📋 Pre-Testing Setup

### Account Requirements

- [ ] **Have a CLIENT account** created and logged in
- [ ] **Verify you're logged in** by checking the dashboard displays "CLIENT" role
- [ ] **Browser:** Use Chrome/Edge (latest version) for testing
- [ ] **Device:** Test on desktop first, then mobile

### Test Data Preparation

- [ ] **At least 1-5 agencies** should exist in the system with KYC verified status
- [ ] **Agencies should have**:
  - Complete profiles (business name, description, logo)
  - At least 1 employee/team member
  - Optional: ratings and reviews

---

## 1️⃣ Agency Discovery on Dashboard

### Test: Access Agency Tab

1. [ ] Navigate to **`/dashboard/home`**
2. [ ] Verify you see **TWO tabs** at the top:
   - [ ] 🧑‍🔧 **Individual Workers** tab (default)
   - [ ] 🏢 **Agencies** tab (new)
3. [ ] Click the **Agencies** tab
4. [ ] Verify the tab switches and you see **"Verified Agencies"** heading
5. [ ] Verify agencies display in a grid layout

**Expected Result:**

- ✅ Agencies tab is clickable
- ✅ Tab becomes active (highlighted)
- ✅ Grid displays with agency cards (not worker cards)
- ✅ Page doesn't reload (smooth tab switch)
- ✅ Loading indicator shows briefly if fetching data
- ✅ Heading shows "Verified Agencies"

**Screenshot:** Take a screenshot showing both tabs visible

---

### Test: Agency Cards Display Correctly

For each **AgencyCard** displayed, verify the following:

#### Card Header

- [ ] **Agency logo** displays (or default initial letter if no logo)
- [ ] **KYC Verified badge** shows as ✅ checkmark icon (if verified)
- [ ] **Business name** is clearly visible as heading

#### Card Body

- [ ] **Rating or review status** displays (e.g., "No reviews yet" or star rating)
- [ ] **Business description** displays (short text)
- [ ] **Statistics** show:
  - [ ] Jobs completed (e.g., "0 completed")

#### Card Footer

- [ ] **"View Agency Profile"** button is visible
- [ ] Button has correct styling (primary color, readable text)

**Expected Result:**

- ✅ All cards display consistently
- ✅ Information is readable and properly formatted
- ✅ No broken images or missing data
- ✅ Cards are responsive (adapt to screen size)

**Screenshot:** Take a screenshot of the agency grid with visible cards

---

### Test: Grid Responsiveness

1. [ ] **Desktop View** (>1024px):
   - [ ] Verify cards display in grid format
   - [ ] Cards are evenly spaced
2. [ ] **Tablet View** (768px-1024px):
   - [ ] Verify responsive layout
   - [ ] Navigation tabs still accessible
3. [ ] **Mobile View** (<768px):
   - [ ] Verify cards stack vertically
   - [ ] Tabs work on mobile
   - [ ] All content remains readable

**Expected Result:**

- ✅ Layout adjusts smoothly at different screen sizes
- ✅ No horizontal scrolling
- ✅ Touch targets are adequately sized (min 44x44px)

---

## 2️⃣ Agency Profile Detail Page

### Test: Navigate to Agency Profile

1. [ ] From the agency grid, click **"View Agency Profile"** on any card
2. [ ] Verify navigation to **`/dashboard/agencies/{id}`** (check URL)
3. [ ] Verify page loads without errors

**Expected Result:**

- ✅ Navigation occurs smoothly (no page refresh)
- ✅ URL changes to show agency ID (e.g., `/dashboard/agencies/8`)
- ✅ Loading state shows briefly
- ✅ Profile page displays

**Screenshot:** Take a screenshot of the full agency profile page

---

### Test: Profile Header Section

Verify the following elements display:

- [ ] **Agency logo** (large, centered or left-aligned)
- [ ] **Business name** as page title
- [ ] **KYC Verified badge** (checkmark icon with "Verified" text if applicable)
- [ ] **Rating display** (stars + numeric rating + review count, e.g., "0.0 (0 reviews)")
- [ ] **Jobs completed** count (e.g., "0 jobs completed")
- [ ] **Business description** text
- [ ] **Location** (with note if "Address not provided")
- [ ] **Contact information**:
  - [ ] Phone number (if provided)

**Expected Result:**

- ✅ All information is clearly visible
- ✅ Logo displays at appropriate size
- ✅ Text is readable with good contrast
- ✅ Contact info displays when available

---

### Test: Stats Grid Section

Verify these statistics display:

- [ ] **Total Jobs** (numeric value)
- [ ] **Completed** (numeric value)
- [ ] **Active Jobs** (numeric value)
- [ ] **Avg Rating** (decimal, e.g., 0.0)
- [ ] **Completion Rate** (percentage, e.g., 0%)
- [ ] **On-Time Delivery** (percentage, e.g., 0%)
- [ ] **Response Time** (e.g., "within 2 hours")
- [ ] **Team Members** (number of employees, e.g., "1 employees")

**Expected Result:**

- ✅ Stats grid is organized (2-3 columns)
- ✅ Icons accompany each stat
- ✅ Numbers are formatted correctly
- ✅ No "null" or "undefined" values

---

### Test: Team Members Section (if implemented)

- [ ] **Team/Employees section** displays
- [ ] **Employee cards** show for each team member (if any exist)
- [ ] At least 1 employee displays OR "No team members" message

**Expected Result:**

- ✅ Employee information displays correctly
- ✅ Section is clearly labeled

---

### Test: Reviews Section

- [ ] **"Client Reviews"** heading is visible
- [ ] Reviews display OR appropriate message shows (e.g., "No reviews yet" or loading state)
- [ ] If reviews exist, they show:
  - [ ] Client name or anonymous indicator
  - [ ] Star rating
  - [ ] Review text
  - [ ] Date posted

**Expected Result:**

- ✅ Reviews section has clear heading
- ✅ Reviews display correctly OR appropriate empty state message
- ✅ No error messages displayed (API should work)

**Note:** If "Failed to load reviews" appears, this is a bug that needs fixing.

---

### Test: Action Buttons

- [ ] **"Back"** button is visible
- [ ] **"Hire This Agency"** button is visible (primary CTA)
- [ ] Buttons are styled consistently (primary vs secondary)

**Expected Result:**

- ✅ Primary button stands out (bold color, prominent placement)
- ✅ Buttons are clickable
- ✅ Hover states work (color change on mouseover)
- ✅ Back button returns to dashboard home

---

## 3️⃣ Mobile Responsiveness Testing

### Test: Mobile Navigation

1. [ ] Open app on **mobile device** (or use browser DevTools mobile view)
2. [ ] Navigate to `/dashboard/home`
3. [ ] Verify **tab switching** works on mobile
4. [ ] Test **swiping** between tabs (if supported)

**Expected Result:**

- ✅ Tabs are touch-friendly (min 44x44px)
- ✅ Tab content switches smoothly
- ✅ No horizontal overflow

---

### Test: Mobile Agency Cards

1. [ ] View **agency grid** on mobile
2. [ ] Verify **1 card per row** (stacked vertically)
3. [ ] Verify all card information is readable
4. [ ] Test **tapping** "View Agency Profile" button

**Expected Result:**

- ✅ Cards fill screen width (with padding)
- ✅ All content remains visible
- ✅ Touch targets are adequate size
- ✅ Navigation works on tap

---

### Test: Mobile Profile Page

1. [ ] Open **agency profile** on mobile
2. [ ] Verify **header section** displays correctly
3. [ ] Verify **stats grid** adapts (1-2 columns)
4. [ ] Verify **team members** display (1-2 per row)
5. [ ] Test **scrolling** through reviews

**Expected Result:**

- ✅ Page layout adapts to mobile screen
- ✅ Images scale appropriately
- ✅ Text is readable (min 16px font)
- ✅ Buttons are touch-friendly
- ✅ No content is cut off

---

## 4️⃣ Performance Testing

### Test: Page Load Speed

1. [ ] Open browser **Network tab** (F12 → Network)
2. [ ] Navigate to `/dashboard/home` (Agencies tab)
3. [ ] Measure **total load time**
4. [ ] Navigate to agency profile page
5. [ ] Measure **profile load time**

**Expected Result:**

- ✅ Dashboard loads in **<2 seconds**
- ✅ Agency profile loads in **<3 seconds**
- ✅ No 404 or 500 errors in console
- ✅ Images load progressively (lazy loading)

**Benchmarks:**

- Dashboard: <2s (good), <3s (acceptable), >3s (needs optimization)
- Profile: <3s (good), <4s (acceptable), >4s (needs optimization)

---

### Test: API Response Times

1. [ ] Open browser **Network tab**
2. [ ] Filter by **XHR/Fetch** requests
3. [ ] Reload **Agencies tab**
4. [ ] Check **`/api/client/agencies/browse`** response time
5. [ ] Open **agency profile**
6. [ ] Check **`/api/client/agencies/{id}`** response time
7. [ ] Verify **`/api/client/agencies/{id}/reviews`** loads successfully

**Expected Result:**

- ✅ Browse API responds in **<500ms**
- ✅ Profile API responds in **<800ms**
- ✅ Reviews API responds without errors
- ✅ No timeout errors (>30s)

---

## 5️⃣ Error Handling Testing

### Test: Network Error Handling

1. [ ] **Disconnect internet** (or use DevTools → Offline mode)
2. [ ] Try to load **Agencies tab**
3. [ ] Verify **error message** displays (e.g., "Failed to load agencies")
4. [ ] Verify **retry button** appears
5. [ ] **Reconnect internet** and click retry

**Expected Result:**

- ✅ Clear error message (not generic "Error")
- ✅ Retry mechanism works
- ✅ No app crash or blank screen

---

### Test: Invalid Agency ID

1. [ ] Manually navigate to **`/dashboard/agencies/99999`** (non-existent ID)
2. [ ] Verify **404 page** or **"Agency not found"** message displays
3. [ ] Verify **navigation** back to agency list works

**Expected Result:**

- ✅ User-friendly error page
- ✅ Clear "Return to Agencies" button
- ✅ No console errors that crash app

---

## 6️⃣ Accessibility Testing

### Test: Keyboard Navigation

1. [ ] Use **Tab key** to navigate through agency cards
2. [ ] Verify **focus indicators** are visible (blue outline, highlight)
3. [ ] Press **Enter** to activate "View Agency Profile" button
4. [ ] Verify navigation works without mouse

**Expected Result:**

- ✅ All interactive elements are keyboard-accessible
- ✅ Focus order is logical (top-to-bottom, left-to-right)
- ✅ Focus indicators are clear (not disabled)
- ✅ Enter key activates buttons

---

### Test: Screen Reader Support (Optional, Advanced)

1. [ ] Enable **screen reader** (NVDA on Windows, VoiceOver on Mac)
2. [ ] Navigate to **Agencies tab**
3. [ ] Verify screen reader **announces** agency names, ratings, locations
4. [ ] Verify buttons have **descriptive labels** (e.g., "View profile for ABC Construction Agency")

**Expected Result:**

- ✅ All content is announced clearly
- ✅ Images have alt text
- ✅ Buttons have ARIA labels
- ✅ Headings are properly structured (H1, H2, H3)

---

### Test: Color Contrast

1. [ ] Use **browser extension** (e.g., WAVE, axe DevTools)
2. [ ] Check **color contrast ratios** for text
3. [ ] Verify minimum contrast:
   - [ ] Normal text: 4.5:1
   - [ ] Large text (18pt+): 3:1

**Expected Result:**

- ✅ All text meets WCAG AA standards
- ✅ Links are distinguishable (not just color)
- ✅ Focus indicators have sufficient contrast

---

## 7️⃣ Cross-Browser Testing

### Test: Chrome/Edge (Chromium)

- [ ] Dashboard loads correctly
- [ ] Agency cards display properly
- [ ] Navigation works
- [ ] Filters and search work

---

### Test: Firefox

- [ ] Dashboard loads correctly
- [ ] Agency cards display properly
- [ ] Navigation works
- [ ] Filters and search work

---

### Test: Safari (Mac/iOS)

- [ ] Dashboard loads correctly
- [ ] Agency cards display properly
- [ ] Navigation works
- [ ] Filters and search work
- [ ] Touch interactions work on iPad

**Expected Result:**

- ✅ Consistent experience across all browsers
- ✅ No browser-specific bugs
- ✅ Polyfills load for older browsers (if applicable)

---

## 8️⃣ Integration Testing

### Test: Navigation Consistency

1. [ ] From **dashboard**, navigate to **agency profile**
2. [ ] Click **"Back"** button
3. [ ] Verify return to **dashboard (Agencies tab)**
4. [ ] Navigate to agency profile again
5. [ ] Use browser back button
6. [ ] Verify proper navigation history

**Expected Result:**

- ✅ Navigation history is preserved
- ✅ Back button works correctly
- ✅ Browser back button functions properly
- ✅ Returns to Agencies tab (not Workers tab)

---

### Test: Data Consistency

1. [ ] Note **agency rating** on dashboard card (e.g., 4.7)
2. [ ] Open that **agency's profile page**
3. [ ] Verify rating matches (4.7 on profile too)
4. [ ] Check **review count** matches
5. [ ] Verify **team size** matches
6. [ ] Verify **location** matches

**Expected Result:**

- ✅ Data is consistent across all views
- ✅ No discrepancies between card and profile
- ✅ Real-time updates (if data changes)

---

## 9️⃣ User Experience (UX) Testing

### Test: First-Time User Experience

1. [ ] Pretend you're a **new client** seeing the system for the first time
2. [ ] Navigate to **Agencies tab** without instructions
3. [ ] Can you **easily understand** what you're seeing?
4. [ ] Is it **obvious** how to view an agency's profile?
5. [ ] Is it **clear** what the KYC verified badge means?

**Expected Result:**

- ✅ Interface is intuitive (no training needed)
- ✅ Actions are clearly labeled
- ✅ Tooltips or help text available (if needed)
- ✅ No confusing jargon

---

### Test: Visual Hierarchy

1. [ ] View **agency card**
2. [ ] What draws your **eye first**? (Should be: agency name, then rating)
3. [ ] View **agency profile**
4. [ ] What draws your **eye first**? (Should be: agency name/logo, then CTA button)

**Expected Result:**

- ✅ Most important info is most prominent
- ✅ Hierarchy guides user through content
- ✅ Primary actions stand out (bright colors, large buttons)
- ✅ Secondary actions are muted but accessible

---

### Test: Loading States

1. [ ] Navigate to **Agencies tab** with **slow 3G** connection (DevTools → Network → Slow 3G)
2. [ ] Verify **loading skeleton** or spinner displays
3. [ ] Verify loading doesn't block **entire page** (progressive loading)

**Expected Result:**

- ✅ Loading state is visible and clear
- ✅ Skeleton cards mimic final layout (if used)
- ✅ User understands data is loading (not broken)
- ✅ Timeout after 30s with error message

---

## ✅ Testing Summary Template

After completing all tests, fill out this summary:

### Test Session Info

- **Tester Name:** \_\_\_\_\_\_\_\_\_\_\_\_
- **Date Tested:** \_\_\_\_\_\_\_\_\_\_\_\_
- **Browser Used:** \_\_\_\_\_\_\_\_\_\_\_\_
- **Device Used:** \_\_\_\_\_\_\_\_\_\_\_\_
- **Test Duration:** \_\_\_\_\_\_\_\_\_\_\_\_

### Results Overview

- **Total Tests:** \_\_
- **Passed (✅):** \_\_
- **Failed (❌):** \_\_
- **Blocked (⏸️):** \_\_
- **Pass Rate:** \_\_\_%

### Critical Issues Found

List any **critical bugs** that prevent core functionality:

1.
2.
3.

### Minor Issues Found

List any **minor bugs** or UX improvements:

1.
2.
3.

### Overall Assessment

- [ ] **PASS** - Ready for production
- [ ] **PASS with minor issues** - Deploy but track issues
- [ ] **FAIL** - Requires fixes before production

### Tester Comments

---

## 📸 Required Screenshots

Please capture and attach the following screenshots to your test report:

1. **Dashboard - Agencies Tab** (showing grid of agency cards)
2. **Agency Card - Close-up** (showing all card details)
3. **Agency Profile Page - Full View** (entire page from top to bottom)
4. **Mobile View - Agencies Tab** (responsive layout)
5. **Mobile View - Agency Profile** (responsive layout)
6. **Network Tab** (showing API response times)

---

## 🐛 Bug Report Template

If you find a bug, report it using this format:

```markdown
### Bug Report

**Title:** Brief description of issue

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**

1. Navigate to...
2. Click on...
3. Observe...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
[Attach screenshot]

**Environment:**

- Browser: Chrome 120
- Device: Desktop
- OS: Windows 11
- Screen Resolution: 1920x1080

**Console Errors:**
```

[Paste any console errors]

```

**Additional Notes:**
Any other relevant information
```

---

## 📞 Testing Support

If you encounter issues during testing:

- **Implementation Doc**: `docs/github-issues/AGENCY_PHASE_1_DISCOVERY_INTEGRATION.md`
- **Bug Tracking**: GitHub Issues - iayos/issues
- **API Endpoints**:
  - `GET /api/client/agencies/browse` - List agencies
  - `GET /api/client/agencies/{id}` - Agency profile
  - `GET /api/client/agencies/{id}/reviews` - Agency reviews

---

## 🎯 Scope Notes

**What IS Included in Phase 1:**

- ✅ Agency discovery via tabs on `/dashboard/home`
- ✅ AgencyCard component with basic information
- ✅ Agency profile page at `/dashboard/agencies/{id}`
- ✅ Hire Agency functionality
- ✅ Reviews display
- ✅ Team members display
- ✅ Backend API endpoints

**What is NOT Included in Phase 1:**

- ❌ Advanced search page at `/client/agencies` (removed)
- ❌ Search filters (service, location, rating)
- ❌ Sort options on home page
- ❌ Pagination controls on home page
- ❌ Agency comparison features
- ❌ Saved/favorite agencies

These features may be added in future phases as needed.

---

**Testing Checklist Version:** 2.0 (Updated)  
**Last Updated:** November 14, 2025  
**Implementation Reference:** Agency Phase 1 - COMPLETED November 12, 2025  
**Next Phase:** Agency Phase 2 - Employee Management
