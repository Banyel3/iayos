# 🧪 QA Testing Checklist - Agency Phase 2 (Employee Management)

**Testing Date:** ******\_\_\_******  
**Phase:** Agency Phase 2 - Employee Management & Rating System  
**Tester Role:** AGENCY OWNER  
**Test Environment:** Development (Docker containers)

---

## 📋 Pre-Testing Setup

### Account Requirements

- [ ] **Have an AGENCY account** created and logged in
- [ ] **Verify you're logged in** by checking the dashboard displays "AGENCY" role
- [ ] **KYC Status:** Agency KYC should be APPROVED
- [ ] **Browser:** Use Chrome/Edge (latest version) for testing
- [ ] **Device:** Test on desktop first, then mobile

### Test Data Preparation

- [ ] **At least 5 employees** should exist in your agency:
  - [ ] Employees with different roles (Plumber, Electrician, Carpenter, etc.)
  - [ ] Employees with various ratings (1.0 to 5.0)
  - [ ] At least 1 employee with `totalJobsCompleted > 0`
  - [ ] At least 1 employee with `totalEarnings > 0`
  - [ ] Mix of active and inactive employees (if applicable)
- [ ] **No Employee of the Month** currently set (to test selection)

### Backend Verification

- [ ] **Migration 0003** applied (run `python manage.py showmigrations agency`)
- [ ] **Database fields exist**:
  - [ ] `employeeOfTheMonth` (boolean)
  - [ ] `employeeOfTheMonthDate` (datetime)
  - [ ] `employeeOfTheMonthReason` (text)
  - [ ] `lastRatingUpdate` (datetime)
  - [ ] `totalJobsCompleted` (integer)
  - [ ] `totalEarnings` (decimal)
  - [ ] `isActive` (boolean)

---

## 1️⃣ Employee List Management

### Test: Access Employee Management Page

1. [ ] Login as **AGENCY OWNER**
2. [ ] Navigate to **`/dashboard/agency/employees`** (or `/agency/employees` depending on routing)
3. [ ] Verify page loads without errors

**Expected Result:**

- ✅ Page displays employee list
- ✅ Loading indicator shows briefly
- ✅ No 403 Forbidden errors (proper authentication)
- ✅ Page title is "Employee Management" or similar

**Screenshot:** Take a screenshot of the employee management page

---

### Test: Employee List Display

Verify the employee list shows:

- [ ] **Employee cards/rows** for each employee
- [ ] Each card displays:
  - [ ] Employee photo/avatar (or placeholder)
  - [ ] Employee name
  - [ ] Role/specialization
  - [ ] Email address
  - [ ] Rating (stars + numeric value)
  - [ ] Total jobs completed
  - [ ] Total earnings (₱ formatted)
  - [ ] Active/Inactive status indicator
  - [ ] Employee of the Month badge (if applicable)

**Expected Result:**

- ✅ All employees display in organized grid/list
- ✅ Data is properly formatted (currency, decimals)
- ✅ No "null" or "undefined" values
- ✅ Avatar placeholders work if no photo

---

### Test: Employee Sorting/Filtering

1. [ ] Locate **sort dropdown** or tabs
2. [ ] Test sorting by:
   - [ ] **Rating** (highest to lowest)
   - [ ] **Total Jobs** (most to least)
   - [ ] **Total Earnings** (highest to lowest)
   - [ ] **Name** (A-Z)
3. [ ] Verify list reorders correctly for each sort

**Expected Result:**

- ✅ Sorting works correctly
- ✅ Current sort option is highlighted
- ✅ Animation/transition is smooth

---

### Test: Search Functionality (if implemented)

1. [ ] Locate **search bar**
2. [ ] Enter **employee name** (e.g., "John")
3. [ ] Verify results filter in real-time
4. [ ] Clear search and verify all employees return

**Expected Result:**

- ✅ Search filters correctly
- ✅ Results update smoothly
- ✅ "No results" message if no match

---

## 2️⃣ Update Employee Rating

### Test: Access Rating Update Modal

1. [ ] From employee list, find an employee card
2. [ ] Click **"Update Rating"** button or similar action
3. [ ] Verify modal/form opens

**Expected Result:**

- ✅ Modal opens smoothly
- ✅ Modal displays employee name as heading
- ✅ Current rating shows (if any)
- ✅ Form is ready for input

**Screenshot:** Take a screenshot of the rating update modal

---

### Test: Rating Update - Valid Input

1. [ ] In the modal, select **4.5 stars** (use star selector or input)
2. [ ] Enter **reason** (optional): "Excellent customer service this month"
3. [ ] Click **"Update Rating"** button
4. [ ] Verify modal closes
5. [ ] Verify success notification appears

**Expected Result:**

- ✅ Rating updates successfully
- ✅ Success message: "Employee rating updated successfully"
- ✅ Employee card reflects new rating immediately
- ✅ No page reload required
- ✅ Notification auto-dismisses after 3-5 seconds

**API Test:**

- [ ] Open **Network tab** (F12 → Network)
- [ ] Check **`PUT /api/agency/employees/{id}/rating`** request
- [ ] Verify response: `200 OK`
- [ ] Response body includes:
  ```json
  {
    "success": true,
    "message": "Employee rating updated successfully",
    "employeeId": 123,
    "rating": 4.5,
    "lastRatingUpdate": "2025-11-13T10:00:00Z"
  }
  ```

---

### Test: Rating Update - Validation (Below Minimum)

1. [ ] Open rating update modal
2. [ ] Try to enter **-1.0** or **0.0** rating
3. [ ] Click "Update Rating"

**Expected Result:**

- ✅ Validation error appears
- ✅ Error message: "Rating must be between 0.00 and 5.00"
- ✅ Form does not submit
- ✅ Modal remains open
- ✅ Field is highlighted in red

---

### Test: Rating Update - Validation (Above Maximum)

1. [ ] Open rating update modal
2. [ ] Try to enter **6.0** rating
3. [ ] Click "Update Rating"

**Expected Result:**

- ✅ Validation error appears
- ✅ Error message: "Rating must be between 0.00 and 5.00"
- ✅ Form does not submit
- ✅ Modal remains open

---

### Test: Rating Update - Timestamp Verification

1. [ ] Update an employee's rating
2. [ ] After success, check employee card
3. [ ] Verify **"Last Updated"** timestamp displays
4. [ ] Timestamp should show current date/time

**Expected Result:**

- ✅ Timestamp displays correctly
- ✅ Format: "Nov 13, 2025 at 10:30 AM" or similar
- ✅ Timezone is correct (local or UTC indicated)

---

### Test: Rating Update - Notification Created

1. [ ] After updating rating, navigate to **Notifications** page
2. [ ] Verify a new notification exists
3. [ ] Notification should show:
   - [ ] Title: "Rating Updated: [Employee Name]"
   - [ ] Message: "Updated [Name]'s rating to 4.5/5.0. Reason: [reason]"
   - [ ] Type: `EMPLOYEE_RATING_UPDATED`
   - [ ] Timestamp

**Expected Result:**

- ✅ Notification appears in list
- ✅ Information is accurate
- ✅ Notification is marked as unread (if status tracking exists)

---

## 3️⃣ Employee of the Month Selection

### Test: Access EOTM Selection Modal

1. [ ] From employee list, find an employee card
2. [ ] Click **"Set as Employee of the Month"** button or crown icon
3. [ ] Verify modal opens

**Expected Result:**

- ✅ Modal opens smoothly
- ✅ Modal title: "Set Employee of the Month" or similar
- ✅ Employee name displays
- ✅ Reason input field is visible and required

**Screenshot:** Take a screenshot of the EOTM selection modal

---

### Test: EOTM Selection - Valid Input

1. [ ] In the modal, enter **reason**: "Outstanding performance and 98% customer satisfaction"
2. [ ] Click **"Confirm"** or **"Set as EOTM"** button
3. [ ] Verify modal closes
4. [ ] Verify success notification appears

**Expected Result:**

- ✅ EOTM updates successfully
- ✅ Success message: "[Name] is now Employee of the Month!"
- ✅ Employee card displays **EOTM badge** (crown icon, "EOTM" label, etc.)
- ✅ Other employees lose EOTM badge (only one at a time)
- ✅ No page reload required

**API Test:**

- [ ] Check **`POST /api/agency/employees/{id}/set-eotm`** request
- [ ] Verify response: `200 OK`
- [ ] Response body includes:
  ```json
  {
    "success": true,
    "message": "John Doe is now Employee of the Month!",
    "employeeId": 123,
    "employeeOfTheMonth": true,
    "employeeOfTheMonthDate": "2025-11-13T10:00:00Z",
    "employeeOfTheMonthReason": "Outstanding performance..."
  }
  ```

---

### Test: EOTM Selection - Validation (Missing Reason)

1. [ ] Open EOTM selection modal
2. [ ] Leave **reason field empty**
3. [ ] Click "Confirm"

**Expected Result:**

- ✅ Validation error appears
- ✅ Error message: "Reason is required for Employee of the Month selection"
- ✅ Form does not submit
- ✅ Field is highlighted in red

---

### Test: EOTM Selection - Only One Active

1. [ ] Set **Employee A** as EOTM (with reason)
2. [ ] Verify Employee A has EOTM badge
3. [ ] Set **Employee B** as EOTM (with different reason)
4. [ ] Verify:
   - [ ] Employee B now has EOTM badge
   - [ ] Employee A's EOTM badge is **removed**
   - [ ] Only one employee has EOTM badge at a time

**Expected Result:**

- ✅ Only one EOTM exists at a time
- ✅ Previous EOTM badge clears automatically
- ✅ Backend constraint enforced (check database if possible)

---

### Test: EOTM Badge Display

After setting EOTM, verify badge displays:

- [ ] **On employee card** in list (prominent placement)
- [ ] **On employee profile** page (if exists)
- [ ] **In leaderboard** view (if exists)
- [ ] Badge design:
  - [ ] Crown icon or "EOTM" label
  - [ ] Gold/yellow color scheme
  - [ ] Tooltip showing reason (on hover)

**Expected Result:**

- ✅ Badge is clearly visible
- ✅ Design matches brand style
- ✅ Tooltip works (desktop)

---

### Test: EOTM Notification Created

1. [ ] After setting EOTM, navigate to **Notifications**
2. [ ] Verify notification exists:
   - [ ] Title: "Employee of the Month: [Name]"
   - [ ] Message: "[Name] has been selected as Employee of the Month! Reason: [reason]"
   - [ ] Type: `EMPLOYEE_OF_MONTH_SET`

**Expected Result:**

- ✅ Notification created
- ✅ Information is accurate
- ✅ Timestamp is current

---

## 4️⃣ Employee Performance Statistics

### Test: Access Performance Page

1. [ ] From employee list, click **"View Performance"** or employee name
2. [ ] Verify navigation to performance detail page
3. [ ] URL should be **`/agency/employees/{id}/performance`** or similar

**Expected Result:**

- ✅ Navigation occurs smoothly
- ✅ Loading state shows briefly
- ✅ Performance page displays

**Screenshot:** Take a screenshot of the performance statistics page

---

### Test: Performance Stats Display

Verify the following statistics display:

#### Header Section

- [ ] Employee name (large, prominent)
- [ ] Employee photo/avatar
- [ ] Role/specialization
- [ ] Current rating (stars + numeric)
- [ ] Active/Inactive status

#### Performance Metrics Grid

- [ ] **Total Jobs Completed** (numeric value)
- [ ] **Total Earnings** (formatted as ₱ currency)
- [ ] **Average Rating** (decimal, e.g., 4.7/5.0)
- [ ] **Employee of the Month Status** (Yes/No or badge)
- [ ] **EOTM Date** (if applicable)
- [ ] **EOTM Reason** (if applicable)
- [ ] **Last Rating Update** (timestamp)

**Expected Result:**

- ✅ All stats display correctly
- ✅ Numbers are formatted (commas for thousands)
- ✅ Currency shows ₱ symbol
- ✅ No "null" or "undefined" values
- ✅ Stats grid is organized (2-3 columns)

---

### Test: Performance - Jobs History Section

1. [ ] Scroll to **Jobs History** section
2. [ ] Verify section displays (even if empty)

**If Jobs History Implemented:**

- [ ] List of recent jobs shows
- [ ] Each job displays:
  - [ ] Job title
  - [ ] Client name
  - [ ] Completion date
  - [ ] Rating received (if applicable)
  - [ ] Earnings from job

**If Jobs History Not Implemented (Phase 2 Part 1):**

- [ ] Empty state message: "Job history will be available when job assignment tracking is implemented"
- [ ] Or: Returns empty array `[]`

**Expected Result:**

- ✅ Section exists (placeholder or populated)
- ✅ Empty state is user-friendly
- ✅ No errors in console

---

### Test: Performance API Response

1. [ ] Open **Network tab**
2. [ ] Navigate to performance page
3. [ ] Check **`GET /api/agency/employees/{id}/performance`** request
4. [ ] Verify response: `200 OK`
5. [ ] Response body structure:
   ```json
   {
     "employeeId": 123,
     "name": "John Doe",
     "email": "john@example.com",
     "role": "Plumber",
     "avatar": "https://...",
     "rating": 4.5,
     "totalJobsCompleted": 45,
     "totalEarnings": 125000.0,
     "isActive": true,
     "employeeOfTheMonth": false,
     "employeeOfTheMonthDate": null,
     "employeeOfTheMonthReason": "",
     "lastRatingUpdate": "2025-11-10T14:30:00Z",
     "jobsHistory": []
   }
   ```

**Expected Result:**

- ✅ API responds quickly (<800ms)
- ✅ All fields present
- ✅ Data types are correct
- ✅ No server errors (500)

---

## 5️⃣ Employee Leaderboard

### Test: Access Leaderboard

1. [ ] From employee management page, click **"Leaderboard"** tab or link
2. [ ] Verify leaderboard view displays
3. [ ] URL should be **`/agency/employees/leaderboard`** or similar

**Expected Result:**

- ✅ Leaderboard displays
- ✅ Loading state shows briefly
- ✅ Employees are ranked

**Screenshot:** Take a screenshot of the leaderboard

---

### Test: Leaderboard Display

Verify the leaderboard shows:

- [ ] **Rank column** (1, 2, 3, etc.)
- [ ] **Employee name** column
- [ ] **Role** column
- [ ] **Rating** column (with stars)
- [ ] **Total Jobs** column
- [ ] **Total Earnings** column
- [ ] **EOTM badge** (if applicable)
- [ ] Top 3 have special styling (gold, silver, bronze) - optional

**Expected Result:**

- ✅ All columns display
- ✅ Data is aligned properly
- ✅ Table is sortable (if feature exists)
- ✅ Responsive on mobile (scrollable or stacked)

---

### Test: Leaderboard Sorting - By Rating

1. [ ] Locate **sort dropdown** or click **"Rating"** column header
2. [ ] Select **"Sort by Rating"** (if dropdown)
3. [ ] Verify employees sort by rating (highest to lowest)
4. [ ] Verify rank numbers update (1, 2, 3...)

**Expected Result:**

- ✅ Employees reorder correctly
- ✅ Highest rating is rank 1
- ✅ Ties handled gracefully (same rank or alphabetical)

**API Test:**

- [ ] Check **`GET /api/agency/employees/leaderboard?sort_by=rating`**
- [ ] Verify response: `200 OK`
- [ ] Verify employees are sorted in response JSON

---

### Test: Leaderboard Sorting - By Jobs

1. [ ] Select **"Sort by Jobs Completed"**
2. [ ] Verify employees sort by `totalJobsCompleted` (highest to lowest)
3. [ ] Verify rank numbers update

**Expected Result:**

- ✅ Employees reorder correctly
- ✅ Most jobs completed is rank 1

**API Test:**

- [ ] Check **`GET /api/agency/employees/leaderboard?sort_by=jobs`**
- [ ] Verify sorting in response

---

### Test: Leaderboard Sorting - By Earnings

1. [ ] Select **"Sort by Total Earnings"**
2. [ ] Verify employees sort by `totalEarnings` (highest to lowest)
3. [ ] Verify rank numbers update

**Expected Result:**

- ✅ Employees reorder correctly
- ✅ Highest earnings is rank 1

**API Test:**

- [ ] Check **`GET /api/agency/employees/leaderboard?sort_by=earnings`**
- [ ] Verify sorting in response

---

### Test: Leaderboard - Active Employees Only

1. [ ] If you have **inactive employees**, note their names
2. [ ] View leaderboard
3. [ ] Verify inactive employees are **not displayed**
4. [ ] Only active employees (`isActive=true`) show

**Expected Result:**

- ✅ Leaderboard filters to active employees only
- ✅ Count matches active employee count
- ✅ Backend enforces filter

---

### Test: Leaderboard - Empty State

1. [ ] If possible, mark **all employees as inactive** (via database or admin)
2. [ ] View leaderboard
3. [ ] Verify empty state message displays

**Expected Result:**

- ✅ Friendly message: "No active employees to display"
- ✅ Suggestion: "Add employees or activate existing ones"
- ✅ No error or blank page

---

## 6️⃣ Data Consistency & Integration

### Test: Rating Update Reflects Everywhere

1. [ ] Update **Employee A's** rating to **4.8**
2. [ ] Navigate to:
   - [ ] Employee list → verify rating shows 4.8
   - [ ] Performance page → verify rating shows 4.8
   - [ ] Leaderboard → verify rating shows 4.8 (and rank adjusts)
3. [ ] All views should match

**Expected Result:**

- ✅ Rating is consistent across all views
- ✅ No discrepancies
- ✅ Real-time updates (no cache issues)

---

### Test: EOTM Badge Consistency

1. [ ] Set **Employee B** as EOTM
2. [ ] Navigate to:
   - [ ] Employee list → verify badge shows
   - [ ] Performance page → verify EOTM status shows "Yes"
   - [ ] Leaderboard → verify badge shows
3. [ ] Navigate back to employee list
4. [ ] Verify previous EOTM no longer has badge

**Expected Result:**

- ✅ EOTM badge consistent everywhere
- ✅ Only one employee has badge
- ✅ Date and reason are preserved

---

### Test: Totals Update (Future Integration)

**Note:** This test verifies the `update_totals()` method is ready for future job completion integration.

1. [ ] In database or via Django shell, manually call:
   ```python
   employee = AgencyEmployee.objects.get(id=123)
   employee.update_totals(job_payment=5000.00)
   ```
2. [ ] Refresh employee performance page
3. [ ] Verify:
   - [ ] `totalJobsCompleted` incremented by 1
   - [ ] `totalEarnings` increased by 5000.00

**Expected Result:**

- ✅ Method works correctly
- ✅ Values persist to database
- ✅ Frontend displays updated values

---

## 7️⃣ Error Handling & Edge Cases

### Test: Unauthorized Access (Non-Agency User)

1. [ ] Logout as agency owner
2. [ ] Login as **CLIENT** or **WORKER**
3. [ ] Try to navigate to **`/agency/employees`**

**Expected Result:**

- ✅ Access denied (403 Forbidden)
- ✅ Redirect to appropriate dashboard
- ✅ Error message: "You must be an agency owner to access this page"

---

### Test: Invalid Employee ID

1. [ ] Navigate to **`/agency/employees/99999/performance`** (non-existent ID)
2. [ ] Verify error page displays

**Expected Result:**

- ✅ 404 error or "Employee not found" message
- ✅ Option to return to employee list
- ✅ No server crash

---

### Test: Network Error - Rating Update

1. [ ] Open rating update modal
2. [ ] **Disconnect internet** (or use DevTools → Offline)
3. [ ] Try to update rating
4. [ ] Observe error handling

**Expected Result:**

- ✅ Error message displays: "Failed to update rating. Check your connection."
- ✅ Modal remains open
- ✅ Retry option available
- ✅ No data loss (form values retained)

---

### Test: Network Error - EOTM Selection

1. [ ] Open EOTM modal
2. [ ] **Disconnect internet**
3. [ ] Try to set EOTM
4. [ ] Observe error handling

**Expected Result:**

- ✅ Error message displays
- ✅ Retry mechanism works
- ✅ Form values retained

---

### Test: Concurrent EOTM Updates (Race Condition)

**Note:** This tests backend handling of simultaneous requests.

1. [ ] Open **two browser windows** (or two devices)
2. [ ] Login as same agency owner in both
3. [ ] In Window 1: Start setting **Employee A** as EOTM
4. [ ] In Window 2: Quickly set **Employee B** as EOTM
5. [ ] Complete both requests

**Expected Result:**

- ✅ Only one employee is EOTM at the end
- ✅ Last request wins (or first, depending on implementation)
- ✅ No database inconsistency
- ✅ Both windows refresh to show correct state

---

### Test: Empty Employee List

1. [ ] If possible, remove all employees (via admin or database)
2. [ ] Navigate to employee management page
3. [ ] Verify empty state displays

**Expected Result:**

- ✅ Friendly message: "No employees yet. Add your first employee!"
- ✅ "Add Employee" button is prominent
- ✅ No errors or blank page

---

## 8️⃣ Mobile Responsiveness

### Test: Mobile - Employee List

1. [ ] Open app on **mobile device** (or DevTools mobile view)
2. [ ] Navigate to employee management page
3. [ ] Verify employee cards display:
   - [ ] **1 card per row** (stacked vertically)
   - [ ] All info readable (not truncated)
   - [ ] Action buttons accessible

**Expected Result:**

- ✅ Layout adapts to mobile screen
- ✅ Touch targets are large enough (min 44x44px)
- ✅ No horizontal overflow
- ✅ All features work on touch

---

### Test: Mobile - Rating Update Modal

1. [ ] On mobile, open rating update modal
2. [ ] Verify modal fits screen (no cutoff)
3. [ ] Test star selector (touch-friendly)
4. [ ] Enter text in reason field (keyboard opens properly)

**Expected Result:**

- ✅ Modal is fully visible
- ✅ Star selector works on touch
- ✅ Input fields are large enough
- ✅ Keyboard doesn't obscure inputs

---

### Test: Mobile - Leaderboard

1. [ ] View leaderboard on mobile
2. [ ] Verify table is scrollable horizontally (if needed)
3. [ ] Or: Verify table adapts to vertical layout

**Expected Result:**

- ✅ All columns accessible
- ✅ Scrolling is smooth
- ✅ Rank numbers remain visible (sticky column - optional)

---

## 9️⃣ Performance Testing

### Test: API Response Times

1. [ ] Open **Network tab**
2. [ ] Test each endpoint and measure response time:

| Endpoint                                     | Expected Time | Actual Time | Pass/Fail |
| -------------------------------------------- | ------------- | ----------- | --------- |
| `GET /api/agency/employees`                  | <500ms        | **\_\_\_**  | ☐         |
| `PUT /api/agency/employees/{id}/rating`      | <300ms        | **\_\_\_**  | ☐         |
| `POST /api/agency/employees/{id}/set-eotm`   | <400ms        | **\_\_\_**  | ☐         |
| `GET /api/agency/employees/{id}/performance` | <800ms        | **\_\_\_**  | ☐         |
| `GET /api/agency/employees/leaderboard`      | <600ms        | **\_\_\_**  | ☐         |

**Expected Result:**

- ✅ All APIs respond within acceptable time
- ✅ No timeouts (>30s)
- ✅ Database queries are optimized (use indexes)

---

### Test: Page Load Speed

1. [ ] Measure page load times:

| Page             | Expected Time | Actual Time | Pass/Fail |
| ---------------- | ------------- | ----------- | --------- |
| Employee List    | <2s           | **\_\_\_**  | ☐         |
| Performance Page | <2s           | **\_\_\_**  | ☐         |
| Leaderboard      | <2.5s         | **\_\_\_**  | ☐         |

**Expected Result:**

- ✅ Pages load quickly
- ✅ No long blocking operations
- ✅ Progressive loading (content appears incrementally)

---

### Test: Large Employee List (Scalability)

**Note:** This test requires a database with many employees.

1. [ ] Add **50+ employees** to agency (via seeder script or manually)
2. [ ] Navigate to employee list
3. [ ] Observe performance:
   - [ ] Load time
   - [ ] Scroll smoothness
   - [ ] Sorting speed
   - [ ] Search responsiveness

**Expected Result:**

- ✅ Page remains responsive with many employees
- ✅ Pagination implemented (if >20 employees)
- ✅ Virtualization or lazy loading (if >100 employees)
- ✅ No UI lag when sorting

---

## 🔟 Accessibility Testing

### Test: Keyboard Navigation

1. [ ] Use **Tab key** to navigate employee list
2. [ ] Verify focus indicators are visible
3. [ ] Press **Enter** to open rating modal
4. [ ] Use **Tab** to navigate form fields
5. [ ] Press **Esc** to close modal

**Expected Result:**

- ✅ All interactive elements accessible via keyboard
- ✅ Focus order is logical
- ✅ Modals trap focus (can't tab outside)
- ✅ Escape key closes modals

---

### Test: Screen Reader Support

1. [ ] Enable screen reader (NVDA/VoiceOver)
2. [ ] Navigate employee list
3. [ ] Verify announcements:
   - [ ] Employee names announced
   - [ ] Ratings announced (e.g., "4.5 out of 5 stars")
   - [ ] Button labels clear ("Update rating for John Doe")

**Expected Result:**

- ✅ All content announced clearly
- ✅ Form labels associated with inputs
- ✅ Error messages announced
- ✅ Success notifications announced

---

### Test: Color Contrast

1. [ ] Use **WAVE** or **axe DevTools**
2. [ ] Check color contrast ratios
3. [ ] Verify WCAG AA compliance:
   - [ ] Normal text: 4.5:1
   - [ ] Large text: 3:1
   - [ ] UI components: 3:1

**Expected Result:**

- ✅ All text meets contrast standards
- ✅ Star ratings visible to colorblind users
- ✅ Focus indicators have sufficient contrast

---

## 1️⃣1️⃣ Integration with Phase 1 (Client View)

### Test: Employee Display on Agency Profile (Client View)

1. [ ] Logout as agency owner
2. [ ] Login as **CLIENT**
3. [ ] Navigate to **`/dashboard/agencies/{id}`** (browse agencies from Phase 1)
4. [ ] Select an agency with employees
5. [ ] Verify **Team Members** section displays:
   - [ ] Employee names, roles, ratings
   - [ ] EOTM badge shows for Employee of the Month
   - [ ] Updated ratings from Phase 2 reflect here

**Expected Result:**

- ✅ Client sees updated employee data
- ✅ EOTM badge visible to clients
- ✅ Ratings match (consistency with Phase 2)
- ✅ Data comes from same API/service layer

---

### Test: Employee Data in Agency Card (Client View)

1. [ ] As CLIENT, view **agency cards** on dashboard
2. [ ] Verify agency card shows:
   - [ ] **Team size** (count of active employees)
   - [ ] **Average employee rating** (if displayed)

**Expected Result:**

- ✅ Team size is accurate
- ✅ Average rating updates when employee ratings change
- ✅ Data consistency between Phase 1 and Phase 2

---

## 1️⃣2️⃣ Notification System Testing

### Test: Notification List

1. [ ] After updating rating and setting EOTM, navigate to **Notifications**
2. [ ] Verify notifications display in chronological order (newest first)
3. [ ] Check notification types:
   - [ ] `EMPLOYEE_RATING_UPDATED`
   - [ ] `EMPLOYEE_OF_MONTH_SET`

**Expected Result:**

- ✅ Notifications appear in list
- ✅ Proper formatting and icons
- ✅ Click to view details (if feature exists)

---

### Test: Notification Badges

1. [ ] Check if notification **badge** updates (e.g., red dot, count)
2. [ ] Badge should show unread count

**Expected Result:**

- ✅ Badge increments when new notifications created
- ✅ Badge decrements when notifications read

---

## 1️⃣3️⃣ Database Integrity Testing

### Test: Database Constraints - EOTM

1. [ ] Access database (via Django shell or SQL)
2. [ ] Query employees with `employeeOfTheMonth=True`
3. [ ] Verify **only 1 employee** per agency has this flag

**Expected Result:**

- ✅ Database constraint enforced
- ✅ Only one EOTM per agency
- ✅ No orphaned EOTM entries

---

### Test: Database Indexes

1. [ ] Check if indexes exist (via Django shell or SQL):
   ```python
   from django.db import connection
   cursor = connection.cursor()
   cursor.execute("SELECT * FROM pg_indexes WHERE tablename='agency_employees';")
   print(cursor.fetchall())
   ```
2. [ ] Verify indexes:
   - [ ] `idx_agency_isActive` (agency, isActive)
   - [ ] `idx_agency_eotm` (agency, employeeOfTheMonth)
   - [ ] `idx_rating` (-rating)
   - [ ] `idx_jobs` (-totalJobsCompleted)

**Expected Result:**

- ✅ All indexes exist
- ✅ Indexes improve query performance
- ✅ Leaderboard queries use indexes (check EXPLAIN ANALYZE)

---

### Test: Data Migration Rollback

**Note:** Advanced test for database safety.

1. [ ] Backup database
2. [ ] Rollback migration 0003:
   ```bash
   python manage.py migrate agency 0002
   ```
3. [ ] Verify:
   - [ ] New fields removed from database
   - [ ] No data loss for existing fields
   - [ ] App still functions (without Phase 2 features)
4. [ ] Re-apply migration:
   ```bash
   python manage.py migrate agency 0003
   ```

**Expected Result:**

- ✅ Rollback succeeds
- ✅ Re-apply succeeds
- ✅ No data corruption

---

## 1️⃣4️⃣ Cross-Browser Testing

### Test: Chrome/Edge

- [ ] Employee list loads
- [ ] Rating modal works
- [ ] EOTM selection works
- [ ] Leaderboard displays
- [ ] Notifications appear

---

### Test: Firefox

- [ ] Employee list loads
- [ ] Rating modal works
- [ ] EOTM selection works
- [ ] Leaderboard displays
- [ ] Notifications appear

---

### Test: Safari (Mac/iOS)

- [ ] Employee list loads
- [ ] Rating modal works
- [ ] EOTM selection works
- [ ] Leaderboard displays
- [ ] Touch interactions work (iPad)

**Expected Result:**

- ✅ Consistent experience across browsers
- ✅ No browser-specific bugs

---

## ✅ Testing Summary Template

### Test Session Info

- **Tester Name:** ************\_\_\_************
- **Date Tested:** ************\_\_\_************
- **Browser Used:** ************\_\_\_************
- **Device Used:** ************\_\_\_************
- **Test Duration:** ************\_\_\_************

### Results Overview

- **Total Tests:** **\_\_**
- **Passed (✅):** **\_\_**
- **Failed (❌):** **\_\_**
- **Blocked (⏸️):** **\_\_**
- **Pass Rate:** **\_\_**%

### Critical Issues Found

List any **critical bugs** that prevent core functionality:

1. ***
2. ***
3. ***

### Minor Issues Found

List any **minor bugs** or UX improvements:

1. ***
2. ***
3. ***

### Overall Assessment

- [ ] **PASS** - Ready for production
- [ ] **PASS with minor issues** - Deploy but track issues
- [ ] **FAIL** - Requires fixes before production

### Tester Comments

---

---

---

---

## 📸 Required Screenshots

Please capture and attach the following screenshots:

1. **Employee Management Page - List View** (showing all employees)
2. **Rating Update Modal** (open with form visible)
3. **EOTM Selection Modal** (open with reason field)
4. **Employee Performance Page** (full statistics display)
5. **Leaderboard View** (sorted by rating)
6. **Leaderboard View** (sorted by jobs or earnings)
7. **Notification List** (showing rating and EOTM notifications)
8. **Mobile View - Employee List** (responsive layout)
9. **Mobile View - Rating Modal** (touch-friendly)
10. **Network Tab** (showing API response times)
11. **Database Query** (showing only one EOTM per agency)
12. **Client View - Agency Profile** (showing team with EOTM badge)

---

## 🐛 Bug Report Template

If you find a bug, report it using this format:

````markdown
### Bug Report - Agency Phase 2

**Title:** Brief description of issue

**Severity:** Critical / High / Medium / Low

**Component:** Employee List / Rating Update / EOTM / Performance / Leaderboard / Other

**Steps to Reproduce:**

1. Navigate to...
2. Click on...
3. Enter...
4. Observe...

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
- Agency ID: **\_\_**
- Employee ID: **\_\_**

**API Response (if applicable):**

```json
{
  "error": "...",
  "status": 500
}
```
````

**Console Errors:**

```
[Paste any console errors]
```

**Database State (if applicable):**

```sql
SELECT * FROM agency_employees WHERE employeeOfTheMonth=true;
-- Result: [paste result]
```

**Additional Notes:**
Any other relevant information

````

---

## 🔧 Test Data Setup Scripts

### Script: Create Test Employees
```python
# Django shell: python manage.py shell
from agency.models import AgencyEmployee
from accounts.models import Accounts
from decimal import Decimal

# Get your agency account
agency = Accounts.objects.get(email='agency@example.com')

# Create 5 test employees
employees_data = [
    {'name': 'John Doe', 'email': 'john@example.com', 'role': 'Plumber', 'rating': Decimal('4.5'), 'totalJobsCompleted': 45, 'totalEarnings': Decimal('125000.00')},
    {'name': 'Jane Smith', 'email': 'jane@example.com', 'role': 'Electrician', 'rating': Decimal('4.8'), 'totalJobsCompleted': 62, 'totalEarnings': Decimal('185000.00')},
    {'name': 'Bob Johnson', 'email': 'bob@example.com', 'role': 'Carpenter', 'rating': Decimal('4.2'), 'totalJobsCompleted': 38, 'totalEarnings': Decimal('98000.00')},
    {'name': 'Alice Brown', 'email': 'alice@example.com', 'role': 'Painter', 'rating': Decimal('4.6'), 'totalJobsCompleted': 51, 'totalEarnings': Decimal('142000.00')},
    {'name': 'Charlie Wilson', 'email': 'charlie@example.com', 'role': 'Mason', 'rating': Decimal('3.9'), 'totalJobsCompleted': 29, 'totalEarnings': Decimal('78000.00')},
]

for emp_data in employees_data:
    AgencyEmployee.objects.create(agency=agency, **emp_data)

print("✅ 5 test employees created!")
````

### Script: Reset EOTM

```python
# Reset all EOTM flags for fresh testing
from agency.models import AgencyEmployee

AgencyEmployee.objects.update(
    employeeOfTheMonth=False,
    employeeOfTheMonthDate=None,
    employeeOfTheMonthReason=''
)

print("✅ All EOTM flags reset!")
```

---

## 📊 Performance Benchmarks

### Expected Performance Metrics

| Metric                | Target | Acceptable | Needs Improvement |
| --------------------- | ------ | ---------- | ----------------- |
| Employee List Load    | <1.5s  | <2s        | >2s               |
| Rating Update API     | <300ms | <500ms     | >500ms            |
| EOTM Set API          | <400ms | <600ms     | >600ms            |
| Performance Page Load | <2s    | <3s        | >3s               |
| Leaderboard Load      | <2s    | <2.5s      | >2.5s             |
| Database Query Time   | <100ms | <200ms     | >200ms            |

---

## 🎯 Test Coverage Summary

### Backend (API Endpoints)

- [ ] `PUT /api/agency/employees/{id}/rating` - 8 tests
- [ ] `POST /api/agency/employees/{id}/set-eotm` - 7 tests
- [ ] `GET /api/agency/employees/{id}/performance` - 5 tests
- [ ] `GET /api/agency/employees/leaderboard` - 6 tests

### Frontend (UI Components)

- [ ] Employee List - 10 tests
- [ ] Rating Modal - 6 tests
- [ ] EOTM Modal - 6 tests
- [ ] Performance Page - 6 tests
- [ ] Leaderboard - 8 tests

### Integration

- [ ] Phase 1 Integration - 3 tests
- [ ] Notification System - 3 tests
- [ ] Data Consistency - 2 tests

### Non-Functional

- [ ] Mobile Responsiveness - 3 tests
- [ ] Performance - 3 tests
- [ ] Accessibility - 3 tests
- [ ] Cross-Browser - 3 tests
- [ ] Database Integrity - 3 tests

**Total Tests:** ~85 test cases

---

**Testing Checklist Version:** 2.0  
**Last Updated:** November 13, 2025  
**Next Review:** After Phase 2 implementation and initial bug fixes  
**Estimated Testing Time:** 6-8 hours for complete checklist
