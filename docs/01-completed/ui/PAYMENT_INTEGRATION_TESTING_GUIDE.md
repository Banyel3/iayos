# Payment System Integration Testing Guide

## 🎯 Quick Start

### 1. Start Both Servers

**Terminal 1 - Backend**:

```powershell
cd c:\code\iayos\apps\backend
python manage.py runserver
```

Wait for: `Starting development server at http://127.0.0.1:8000/`

**Terminal 2 - Frontend**:

```powershell
cd c:\code\iayos\apps\frontend_web
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### 2. Login to Admin Panel

1. Open browser: `http://localhost:3000/admin/login`
2. Login with admin credentials
3. You should see dashboard

### 3. Navigate to Payments Module

Click **Payments** in the left sidebar → Opens dropdown with 6 options:

- Transactions
- Escrow Payments
- Worker Earnings
- Disputes
- Analytics

---

## 🧪 Testing Each Page

### Page 1: Transactions List

**URL**: `/admin/payments/transactions`

**What to Test**:

1. ✅ Page loads without errors
2. ✅ Transaction table displays with data
3. ✅ Statistics cards show numbers (Total, Completed, Pending, Volume)
4. ✅ Filters work:
   - Status dropdown (All/Pending/Completed/Failed/Cancelled)
   - Payment method dropdown (All/Wallet/GCash/Maya/Card/Bank/Cash)
   - Date from/to pickers
   - Search input (type transaction ID, reference number, description)
5. ✅ Export button visible
6. ✅ Pagination works (Next/Previous buttons)
7. ✅ Click transaction row → navigates to detail page

**Expected Console**:

- ✅ `GET /api/adminpanel/transactions/all?page=1&limit=50` → 200 OK
- ✅ `GET /api/adminpanel/transactions/statistics` → 200 OK
- ❌ No "Failed to fetch" errors

**If Empty**:

- Check backend logs for errors
- Verify Transaction table has data: `Transaction.objects.count()`
- Try removing all filters

---

### Page 2: Transaction Detail

**URL**: `/admin/payments/transactions/[id]`

**How to Access**: Click any transaction from the list

**What to Test**:

1. ✅ Transaction details display (ID, type, amount, status, payment method)
2. ✅ User information shows (name, email)
3. ✅ Job information shows (title, client, worker) if applicable
4. ✅ Escrow details show if PAYMENT type
5. ✅ Timeline displays with status history
6. ✅ Action buttons visible:
   - "Release Escrow" (if PAYMENT + PENDING)
   - "Process Refund" (if COMPLETED)
7. ✅ Click "Release Escrow" → Shows confirmation modal
8. ✅ Confirm release → Success message → Status changes to COMPLETED
9. ✅ Click "Process Refund" → Shows refund modal
10. ✅ Enter amount + reason → Submit → Success message

**Expected Console**:

- ✅ `GET /api/adminpanel/transactions/123/detail` → 200 OK
- ✅ `POST /api/adminpanel/transactions/123/release-escrow` → 200 OK (if tested)
- ✅ `POST /api/adminpanel/transactions/123/refund` → 200 OK (if tested)

**Test Data**:

- Find a PENDING PAYMENT transaction for release test
- Find a COMPLETED transaction for refund test

---

### Page 3: Escrow Payments

**URL**: `/admin/payments/escrow`

**What to Test**:

1. ✅ Page loads without errors
2. ✅ Escrow payments table displays (only PAYMENT type transactions)
3. ✅ Statistics cards show (Total Held, Pending, Released Today, Average)
4. ✅ Status filter works (All/Pending/Completed)
5. ✅ Search works (job title, client name)
6. ✅ "Days Held" column shows calculation
7. ✅ Checkbox column appears for bulk actions
8. ✅ Select multiple escrows → "Bulk Release" button enabled
9. ✅ Click "Bulk Release" → Confirmation modal → Confirm → Success message
10. ✅ Selected escrows change to COMPLETED status

**Expected Console**:

- ✅ `GET /api/adminpanel/transactions/escrow?status=PENDING` → 200 OK
- ✅ `GET /api/adminpanel/transactions/escrow/statistics` → 200 OK
- ✅ `POST /api/adminpanel/transactions/escrow/bulk-release` → 200 OK (if tested)

**If Empty**:

- Create test escrow: Find PENDING PAYMENT transaction
- Or filter by "Completed" to see released escrows

---

### Page 4: Worker Earnings

**URL**: `/admin/payments/earnings`

**What to Test**:

1. ✅ Page loads without errors
2. ✅ Worker earnings table displays
3. ✅ Statistics cards show (Total Workers, Jobs Completed, Total Earnings, Pending Payouts)
4. ✅ Search works (worker name/email)
5. ✅ Each row shows:
   - Worker name/email
   - Jobs completed
   - Total earnings
   - Platform fee (5%)
   - Net earnings
   - Paid out
   - Pending payout
   - "Pay Now" button
6. ✅ Click "Pay Now" → Payout modal opens
7. ✅ Modal shows worker details + pending payout amount
8. ✅ Select payout method (GCash/Bank Transfer)
9. ✅ Enter GCash number or bank details
10. ✅ Submit → Success message → Pending payout decreases

**Expected Console**:

- ✅ `GET /api/adminpanel/transactions/worker-earnings?search=pedro` → 200 OK
- ✅ `GET /api/adminpanel/transactions/worker-earnings/statistics` → 200 OK
- ✅ `POST /api/adminpanel/transactions/payout` → 200 OK (if tested)

**If Empty**:

- Workers must have completed jobs with status='COMPLETED'
- Check: `Job.objects.filter(status='COMPLETED').count()`

---

### Page 5: Disputes

**URL**: `/admin/payments/disputes`

**What to Test**:

1. ✅ Page loads without errors
2. ✅ Disputes table displays
3. ✅ Statistics cards show (Total, Open, Under Review, Resolved)
4. ✅ Filters work:
   - Status (All/Open/Under Review/Resolved/Closed)
   - Priority (All/Low/Medium/High/Critical)
   - Search (job title, reason)
5. ✅ Each row shows:
   - Dispute ID
   - Job title
   - Disputed by (CLIENT/WORKER)
   - Status badge
   - Priority badge
   - Job amount
   - Disputed amount
   - Days open
6. ✅ Click row → Navigates to dispute detail page

**Expected Console**:

- ✅ `GET /api/adminpanel/transactions/disputes?status=OPEN` → 200 OK
- ✅ `GET /api/adminpanel/transactions/disputes/statistics` → 200 OK

**If Empty**:

- Create test dispute: `JobDispute.objects.create(...)`
- Or check if all disputes are resolved

---

### Page 6: Dispute Detail

**URL**: `/admin/payments/disputes/[id]`

**How to Access**: Click any dispute from the list

**What to Test**:

1. ✅ Dispute details display (ID, reason, description, status, priority)
2. ✅ Job details show (title, description, budget)
3. ✅ Client information shows (name, email, phone)
4. ✅ Worker information shows (name, email, phone)
5. ✅ Related transactions table displays
6. ✅ Timeline shows dispute history
7. ✅ "Resolve Dispute" button visible (if not resolved)
8. ✅ Click "Resolve" → Resolution modal opens
9. ✅ Modal shows dispute details + resolution options
10. ✅ Select decision (Favor Client/Favor Worker/Partial)
11. ✅ Enter resolution notes
12. ✅ Enter refund amount (if applicable)
13. ✅ Submit → Success message → Status changes to RESOLVED

**Expected Console**:

- ✅ `GET /api/adminpanel/transactions/disputes/25` → 200 OK
- ✅ `POST /api/adminpanel/transactions/disputes/25/resolve` → 200 OK (if tested)

**Test Scenarios**:

- Resolve in favor of client → Full refund
- Resolve in favor of worker → No refund
- Partial resolution → Partial refund

---

### Page 7: Analytics

**URL**: `/admin/payments/analytics`

**What to Test**:

1. ✅ Page loads without errors
2. ✅ Overview statistics cards display:
   - Total Revenue
   - Total Transactions
   - Average Transaction
   - Platform Fees
3. ✅ Period selector works (Last 7 Days/Last 30 Days/Last 90 Days/This Year)
4. ✅ Revenue Trends chart displays:
   - X-axis: Dates
   - Y-axis: Amount
   - Line graph with trend
5. ✅ Payment Methods Breakdown chart displays:
   - Pie/donut chart
   - Percentages for each method
   - Legend with colors
6. ✅ Top Performers section displays:
   - Top 10 Clients (by total spent)
   - Top 10 Workers (by total earned)
   - Top 10 Categories (by revenue)
7. ✅ Each top performer shows name, amount, count
8. ✅ Change period → Charts update with new data

**Expected Console**:

- ✅ `GET /api/adminpanel/transactions/statistics?period=last_30_days` → 200 OK
- ✅ `GET /api/adminpanel/transactions/revenue-trends?period=last_30_days` → 200 OK
- ✅ `GET /api/adminpanel/transactions/payment-methods-breakdown?period=last_30_days` → 200 OK
- ✅ `GET /api/adminpanel/transactions/top-performers?period=last_30_days` → 200 OK

**If Charts Empty**:

- Need completed transactions within selected period
- Try "This Year" period for more data
- Check: `Transaction.objects.filter(status='COMPLETED').count()`

---

## 🐛 Common Issues & Fixes

### Issue 1: "Failed to fetch transactions"

**Cause**: Backend not running or CORS issue

**Fix**:

1. Check backend running: `http://localhost:8000/api/adminpanel/transactions/all`
2. Check CORS settings in backend `settings.py`
3. Check browser console for exact error

### Issue 2: "Unauthorized" (401 error)

**Cause**: Not logged in or session expired

**Fix**:

1. Logout and login again
2. Check cookies in browser DevTools
3. Verify `cookie_auth` is working

### Issue 3: Empty transaction list

**Cause**: No transactions in database

**Fix**:

1. Check database: `Transaction.objects.count()`
2. Create test transactions via admin panel or Django shell
3. Try different filters (All status, All payment methods)

### Issue 4: Release Escrow button not showing

**Cause**: Transaction not PAYMENT type or not PENDING status

**Fix**:

1. Button only shows for: `transactionType='PAYMENT' AND status='PENDING'`
2. Find correct transaction type in database
3. Check transaction detail page for exact type

### Issue 5: Charts not displaying

**Cause**: No data in selected period or chart library issue

**Fix**:

1. Try different period (This Year for more data)
2. Check browser console for chart errors
3. Verify Recharts library installed: `npm list recharts`

### Issue 6: Bulk release not working

**Cause**: No escrows selected or already completed

**Fix**:

1. Select checkboxes before clicking "Bulk Release"
2. Only PENDING escrows can be released
3. Check button is enabled (not grayed out)

---

## 📊 Backend Logs to Monitor

### Successful Requests (200 OK)

```
✅ GET /api/adminpanel/transactions/all → 200 OK
✅ GET /api/adminpanel/transactions/statistics → 200 OK
✅ POST /api/adminpanel/transactions/123/release-escrow → 200 OK
```

### Error Patterns to Watch

**500 Internal Server Error**:

```
❌ Error in get_transactions_list: 'NoneType' object has no attribute 'amount'
```

→ Check for None values in Transaction model

**404 Not Found**:

```
❌ Transaction matching query does not exist
```

→ Invalid transaction ID in URL

**400 Bad Request**:

```
❌ Refund amount cannot exceed original transaction amount
```

→ Validation error (expected behavior)

**401 Unauthorized**:

```
❌ Unauthorized: /api/adminpanel/transactions/all
```

→ Not logged in or cookie expired

---

## 🎯 Success Criteria

### All Pages Pass If:

✅ **Transactions Page**:

- List loads with data
- Filters work correctly
- Statistics accurate
- Detail page accessible

✅ **Escrow Page**:

- PAYMENT type transactions display
- Days held calculated correctly
- Bulk release functional
- Statistics accurate

✅ **Earnings Page**:

- Workers listed with earnings
- Pending payouts calculated correctly
- Payout processing works
- Statistics accurate

✅ **Disputes Page**:

- Disputes listed with filters
- Detail page shows complete info
- Resolution process works
- Refunds created correctly

✅ **Analytics Page**:

- Charts display with data
- Period selector works
- Top performers show correctly
- Statistics accurate

### Overall System Health:

✅ **No Console Errors**: Zero "Failed to fetch" errors  
✅ **Backend Running**: Django server responds to all 17 endpoints  
✅ **Database Connected**: All queries execute successfully  
✅ **Authentication Working**: Cookie auth validates correctly  
✅ **Actions Functional**: Release, refund, payout, resolve all work  
✅ **Real-Time Updates**: Actions update UI immediately  
✅ **Performance**: Pages load in <2 seconds

---

## 🚀 Ready for Production?

### Pre-Deployment Checklist:

- [ ] All 7 pages tested and working
- [ ] All 17 API endpoints tested with curl
- [ ] No console errors in production build
- [ ] Django migrations applied
- [ ] Database indexes added for performance
- [ ] CORS configured for production domain
- [ ] Authentication tested with real admin accounts
- [ ] Error handling tested (invalid IDs, missing data)
- [ ] Performance tested with large datasets (1000+ transactions)
- [ ] Security reviewed (SQL injection, XSS prevention)
- [ ] Documentation complete and accurate
- [ ] Backup created before deployment

### Deployment Steps:

1. **Staging Test**: Deploy to staging environment first
2. **Smoke Test**: Test critical flows (list, detail, actions)
3. **Load Test**: Test with production-like data volume
4. **Monitor**: Watch logs for errors in first 24 hours
5. **Rollback Plan**: Have previous version ready if issues occur

---

## 📞 Support

If you encounter issues:

1. **Check Documentation**: `docs/ui-improvements/ADMIN_PAYMENT_BACKEND_COMPLETE.md`
2. **Check Logs**: Backend terminal for Django errors
3. **Check Console**: Browser DevTools for frontend errors
4. **Check Database**: Verify data exists in Transaction, Job, JobDispute tables
5. **Check Network**: Browser DevTools Network tab for failed requests

**Backend File**: `apps/backend/src/adminpanel/payment_service.py`  
**API Routes**: `apps/backend/src/adminpanel/api.py`  
**Frontend Pages**: `apps/frontend_web/app/admin/payments/`

---

**Status**: Ready for Integration Testing  
**Estimated Testing Time**: 1-2 hours for complete test suite  
**Success Rate**: Expect 95%+ pass rate on first test
