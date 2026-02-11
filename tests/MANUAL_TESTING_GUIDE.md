# PR #298 Manual Browser Testing Guide

# Daily Payment Job Flow UI Verification

## ✅ Automated API Tests Results (Completed)

### PASSED ✅

- **Phase 1**: Authentication (both agency + mobile)
  - ✅ Agency login successful (gamerofgames76@gmail.com)
  - ✅ Mobile login successful (john@gmail.com)
- **Phase 4**: Mobile endpoints accessible via JWT
  - ✅ GET /api/mobile/jobs/my-jobs works correctly

### EXPECTED BEHAVIOR (Not Errors)

- **Phase 2**: Agency jobs API - 401 Unauthorized
  - **Why**: `/api/agency/jobs` uses cookie_auth (requires browser session)
  - **Solution**: Test manually in browser (see below)
- **Phase 3**: Agency conversations API - 401 Unauthorized
  - **Why**: `/api/agency/conversations` uses cookie_auth
  - **Solution**: Test manually in browser (see below)

---

## 🌐 Manual Browser Testing Instructions

### STEP 1: Test Agency UI (PR #298 Fix)

**Credentials**: gamerofgames76@gmail.com / VanielCornelio_123

**URL**: https://agency.iayos.online (or your agency portal URL)

1. **Login to Agency Portal**

   ```
   Email: gamerofgames76@gmail.com
   Password: VanielCornelio_123
   ```

2. **Navigate to Messages/Conversations**
   - Find an active job conversation
   - Note the job type (DAILY vs PROJECT)

3. **Verify Banner Messages (PR #298 Fix)**

   **For DAILY payment jobs:**
   - ✅ Should show: **Blue banner** "Daily attendance tracking active"
   - ✅ Should show: Description "Workers check in/out daily. Client approves and pays for each day worked."
   - ❌ Should NOT show: Yellow "Waiting for client to confirm work has started" banner

   **For PROJECT payment jobs:**
   - ✅ Should show: **Yellow banner** "Waiting for client to confirm work has started"
   - ❌ Should NOT show: Blue "Daily attendance tracking active" banner

4. **Test Navigation**
   - Go to Jobs → Active Jobs
   - Filter by job type
   - Verify DAILY jobs display correct status indicators

**Expected Result**:

- Banners change based on `job.payment_model` field
- No generic "waiting" message for DAILY jobs
- Clear differentiation between payment models

---

### STEP 2: Test Mobile UI (PR #298 Fix)

**Credentials**: john@gmail.com / VanielCornelio_123

**Testing Methods**:

- Option A: Mobile app (React Native Expo)
- Option B: Browser DevTools mobile emulation (if web version exists)

1. **Login to Mobile App**

   ```
   Email: john@gmail.com
   Password: VanielCornelio_123
   ```

2. **Navigate to Active Job Conversation**
   - Go to Messages/Conversations
   - Open a DAILY team job conversation
   - Scroll to bottom of screen

3. **Verify PR #298 Fix - DAILY Team Jobs**

   **For DAILY team jobs (is_team_job = true, payment_model = "DAILY"):**
   - ✅ Should show: **Daily Attendance section** (lines 1433-1751)
   - ✅ Should show: Per-worker attendance tracking
   - ✅ Should show: "Confirm & Pay" buttons for each worker/day
   - ❌ Should NOT show: "Approve & Pay Team" button at bottom

   **For PROJECT team jobs (is_team_job = true, payment_model = "PROJECT"):**
   - ✅ Should show: "Approve & Pay Team" button at bottom
   - ❌ Should NOT show: Daily Attendance section

4. **Test Daily Attendance Flow** (if DAILY job exists)

   **Worker Actions:**
   - Tap "Check In" button (only available 6 AM - 8 PM)
   - Wait a few minutes
   - Tap "Check Out" button
   - Verify time stamps displayed

   **Client Actions:**
   - See pending attendance confirmations
   - Tap "Confirm & Pay This Day" button
   - Choose attendance status:
     - PRESENT (100% pay)
     - HALF_DAY (50% pay)
     - ABSENT (0% pay)
   - Verify payment processed notification

**Expected Result**:

- DAILY team jobs do NOT show lump-sum "Approve & Pay Team" button
- Daily Attendance section handles all DAILY job payments
- PROJECT team jobs still show "Approve & Pay Team" button

---

### STEP 3: Verify Backend Data (PR #294 Fix)

**Use Browser DevTools Network Tab**

1. **Open Network Inspector**
   - F12 → Network tab
   - Filter: XHR/Fetch

2. **Trigger Agency Jobs API Call**
   - Navigate to agency portal → Jobs page
   - Watch for: `GET /api/agency/jobs?status=ACTIVE`

3. **Inspect Response JSON**
   - Click the request in Network tab
   - View Response tab
   - Verify each job object contains:

   ```json
   {
     "id": 123,
     "title": "...",
     "payment_model": "DAILY", // ✅ Required
     "daily_rate_agreed": 1500, // ✅ Required
     "duration_days": 5, // ✅ Required
     "actual_start_date": "2026-02-06", // ✅ Required
     "total_days_worked": 2, // ✅ Required
     "daily_escrow_total": 8250 // ✅ Required
   }
   ```

4. **Test Conversation API**
   - Navigate to a conversation
   - Watch for: `GET /api/agency/conversations/{id}`
   - Verify response includes `job.payment_model` field

**Expected Result**:

- All 6 daily payment fields present in API responses
- TypeScript types match API response shape
- No "undefined" values in UI

---

### STEP 4: End-to-End Daily Job Flow Test

**Prerequisites**: Create a new DAILY job or use existing one

1. **Create DAILY Job** (if needed)
   - Agency creates job invite
   - Set payment_model = "DAILY"
   - Set daily_rate = ₱1,500
   - Set duration_days = 5
   - Assign worker(s)

2. **Day 1 Cycle**
   - Worker opens mobile app (8:00 AM)
   - Worker taps "Check In"
   - Worker works...
   - Worker taps "Check Out" (5:00 PM)
   - Client sees pending attendance
   - Client taps "Confirm & Pay This Day"
   - Client selects "PRESENT" (full pay)
   - Verify worker receives ₱1,500 payment

3. **Day 2 Cycle**
   - Repeat check-in/check-out flow
   - Test different attendance status: "HALF_DAY"
   - Verify worker receives ₱750 (50%)

4. **Verify Payment Calculations**
   - Check worker wallet balance
   - Verify transaction history
   - Confirm platform fee applied (10% on escrow)

5. **Test Edge Cases**
   - Try check-in outside 6 AM - 8 PM window (should fail)
   - Try check-in twice same day (should fail)
   - Try check-out before check-in (should fail)
   - Mark attendance ABSENT (worker gets ₱0)

**Expected Result**:

- Complete daily cycle works end-to-end
- Payments process correctly
- Time constraints enforced
- UI updates in real-time

---

## ✅ Testing Checklist

### PR #298 - UI Fix Verification

- [ ] Agency DAILY jobs show blue "attendance tracking" banner
- [ ] Agency PROJECT jobs show yellow "waiting" banner
- [ ] Mobile DAILY team jobs hide "Approve & Pay Team" button
- [ ] Mobile DAILY team jobs show Daily Attendance section
- [ ] Mobile PROJECT team jobs show "Approve & Pay Team" button

### PR #294 - Backend Fields Verification

- [ ] Agency jobs API returns `payment_model` field
- [ ] Agency jobs API returns `daily_rate_agreed` field
- [ ] Agency jobs API returns `duration_days` field
- [ ] Agency jobs API returns `actual_start_date` field
- [ ] Agency jobs API returns `total_days_worked` field
- [ ] Agency jobs API returns `daily_escrow_total` field

### Daily Attendance Flow Verification

- [ ] Worker check-in succeeds (6 AM - 8 PM)
- [ ] Worker check-out succeeds after check-in
- [ ] Client can confirm attendance (PRESENT/HALF_DAY/ABSENT)
- [ ] Payment processes correctly based on status
- [ ] Escrow calculation: (rate × workers × days) + 10% fee
- [ ] Time constraints enforced properly
- [ ] Duplicate check-in prevented
- [ ] Check-out requires prior check-in

### Complete Integration Test

- [ ] Create DAILY job → Assign workers → Complete 2 days → Verify payments
- [ ] Test extension workflow (request + approve + escrow increase)
- [ ] Test rate change workflow (request + approve + future days use new rate)
- [ ] Test job cancellation (refund unused escrow)

---

## 🐛 If You Find Issues

**Common Issues & Solutions**:

1. **"Approve & Pay Team" still showing for DAILY jobs**
   - Clear app cache / hard refresh
   - Verify PR #298 deployed to production
   - Check conversation.job.payment_model value in DevTools

2. **Daily fields missing in API response**
   - Verify PR #294 deployed to backend
   - Check backend logs for errors
   - Ensure agency/services.py includes the 6 fields

3. **Check-in fails with "Outside time window"**
   - This is correct behavior (6 AM - 8 PM constraint)
   - Test during allowed hours
   - Backend uses server timezone (Philippines?)

4. **Payment not processing after client confirm**
   - Check DailyPaymentService logs
   - Verify escrow balance sufficient
   - Check transaction history for worker

---

## 📊 Success Criteria

**All tests PASS if**:

- ✅ No "Approve & Pay Team" button shown for DAILY team jobs
- ✅ Agency UI shows correct banners based on payment_model
- ✅ All 6 daily payment fields present in API responses
- ✅ Daily attendance flow completes without errors
- ✅ Payments process correctly (PRESENT=100%, HALF_DAY=50%, ABSENT=0%)
- ✅ Time constraints enforced (6 AM - 8 PM)
- ✅ No TypeScript errors in browser console
- ✅ No 500 errors in backend logs

**Next Action**: Start with STEP 1 (Agency UI testing) in your browser
