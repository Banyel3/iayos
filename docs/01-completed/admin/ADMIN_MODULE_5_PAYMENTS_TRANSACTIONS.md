# Admin Panel - Module 5: Payments & Transactions Management

**Status**: 📋 PLANNED  
**Priority**: HIGH  
**Estimated Time**: 20-25 hours  
**Dependencies**: Module 2 (User links), Module 3 (Job links)

---

## Module Overview

Comprehensive payment and transaction management system for monitoring financial flows, escrow payments, worker earnings, refunds, and platform revenue. Includes transaction search, dispute resolution, and financial reporting.

### Scope

- Transaction listings with advanced filtering
- Payment detail pages with full audit trail
- Escrow payment monitoring (50% downpayment system)
- Worker earnings tracking and payout management
- Refund processing workflow
- Payment dispute resolution
- Financial analytics and revenue reports

---

## Backend APIs Available

### Transaction Endpoints

```python
# Get all transactions
GET /api/adminpanel/transactions/all
Query: page, limit, status, payment_method, user_id, date_from, date_to
Response: {
  transactions: [{
    id, job_id, payer_id, payee_id, amount, status, payment_method,
    created_at, escrow_status, refund_status
  }],
  pagination: { ... }
}

# Get transaction detail
GET /api/adminpanel/transactions/{id}/detail
Response: {
  transaction: { ... },
  job: { title, budget, status },
  payer: { name, email, profile_type },
  payee: { name, email, profile_type },
  escrow_details: { downpayment_amount, final_payment_amount, released_at },
  audit_trail: [{ action, admin_id, timestamp, reason }]
}

# Get escrow payments
GET /api/adminpanel/transactions/escrow
Query: status (pending, held, released, refunded)

# Release escrow payment
POST /api/adminpanel/transactions/{id}/release-escrow
Body: { reason: string }

# Process refund
POST /api/adminpanel/transactions/{id}/refund
Body: { amount: number, reason: string, refund_to: 'payer' | 'payee' }

# Get worker earnings
GET /api/adminpanel/transactions/worker-earnings
Query: worker_id?, status, date_from, date_to

# Process payout to worker
POST /api/adminpanel/transactions/{id}/payout
Body: { method: 'gcash' | 'bank', account_details: object }

# Get payment disputes
GET /api/adminpanel/transactions/disputes
Query: status (open, investigating, resolved)

# Resolve dispute
POST /api/adminpanel/transactions/disputes/{id}/resolve
Body: { resolution: string, refund_amount?: number, decision: string }

# Get financial statistics
GET /api/adminpanel/transactions/statistics
Query: date_from, date_to
Response: {
  total_revenue: number,
  total_transactions: number,
  escrow_held: number,
  refunded_amount: number,
  platform_fees: number,
  payment_method_breakdown: { gcash: number, wallet: number, cash: number }
}

# Get revenue trends
GET /api/adminpanel/transactions/revenue-trends
Query: period (daily, weekly, monthly)
Response: {
  timeline: [{ date, revenue, transaction_count }],
  comparison: { current, previous, change_percent }
}
```

---

## Implementation Tasks

### Task 1: Transactions List Page ⏰ 5-6 hours

**File**: `apps/frontend_web/app/admin/payments/transactions/page.tsx`

**AI Prompt**:

```
Create Transactions list page with:
1. Fetch from /api/adminpanel/transactions/all with pagination (50 per page)
2. Filters: Status dropdown (All/Completed/Pending/Failed/Refunded), Payment Method (All/GCash/Wallet/Cash), Date Range picker (From/To), User search (by ID or name)
3. Display 5 stat cards: Total Transactions, Total Revenue (₱), Escrow Held (₱), Refunded (₱), Platform Fees (₱)
4. Transaction table columns: Transaction ID, Job Title, Payer Name, Payee Name, Amount (₱), Payment Method badge, Status badge, Date, Actions
5. Status badges: Completed (green), Pending (yellow), Failed (red), Refunded (orange)
6. Payment method badges: GCash (blue), Wallet (purple), Cash (gray)
7. Click row to navigate to /admin/payments/transactions/{id}
8. Add "Export to CSV" button (filters applied)
9. Pagination with Previous/Next + page numbers
10. Loading skeleton and empty state

File: apps/frontend_web/app/admin/payments/transactions/page.tsx
```

---

### Task 2: Transaction Detail Page ⏰ 5-6 hours

**File**: `apps/frontend_web/app/admin/payments/transactions/[id]/page.tsx`

**AI Prompt**:

```
Create Transaction Detail page with:
1. Fetch from /api/adminpanel/transactions/{id}/detail
2. 2-column layout: Main content (left 2/3) + Sidebar (right 1/3)
3. Main content sections:
   - Transaction Card: ID, Amount (₱), Status badge, Payment method, Created date
   - Escrow Details (if applicable): Downpayment (50%), Final Payment (50%), Released date
   - Audit Trail: Timeline of all actions (created, released, refunded) with admin names, timestamps
4. Sidebar sections:
   - Payer Card: Name, Email, Profile type, "View Profile" link
   - Payee Card: Name, Email, Profile type, "View Profile" link
   - Job Card: Title, Budget, Status, "View Job" link
   - Actions Card: Buttons (Release Escrow, Process Refund, Download Receipt)
5. Release Escrow modal: Confirmation + optional note
6. Refund modal: Amount input (max = transaction amount), Reason textarea, Refund To dropdown (Payer/Payee)
7. API calls: POST /release-escrow, POST /refund
8. Success toasts after actions
9. Back button to transactions list
10. Responsive design with Tailwind

File: apps/frontend_web/app/admin/payments/transactions/[id]/page.tsx
```

---

### Task 3: Escrow Payments Monitor ⏰ 3-4 hours

**File**: `apps/frontend_web/app/admin/payments/escrow/page.tsx`

**AI Prompt**:

```
Create Escrow Payments monitoring page:
1. Fetch from /api/adminpanel/transactions/escrow
2. Status filter tabs: All, Pending (yellow), Held (blue), Released (green), Refunded (red)
3. Display 4 stat cards: Total Escrow Held (₱), Pending Release Count, Released Today (₱), Refunded This Month (₱)
4. Escrow table columns: Job Title, Worker Name, Client Name, Downpayment (₱), Status badge, Days Held, Actions
5. "Days Held" calculation: Current date - created_at (color code: <7 days green, 7-14 yellow, >14 red)
6. Quick Actions dropdown per row: Release Escrow, Refund, View Details
7. Bulk actions: Select multiple, Bulk Release (confirmation modal)
8. Search by job title or user name
9. Pagination (30 per page)
10. Auto-refresh every 60 seconds (with toggle)

File: apps/frontend_web/app/admin/payments/escrow/page.tsx
```

---

### Task 4: Worker Earnings & Payouts ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/payments/earnings/page.tsx`

**AI Prompt**:

```
Create Worker Earnings page:
1. Fetch from /api/adminpanel/transactions/worker-earnings
2. Filters: Worker search (autocomplete), Status (All/Earned/Paid Out/Pending), Date range
3. Stats cards: Total Earned (₱), Paid Out (₱), Pending Payout (₱), Workers with Earnings (count)
4. Earnings table columns: Worker Name, Jobs Completed, Total Earned (₱), Paid Out (₱), Pending (₱), Last Payout Date, Actions
5. Click "Process Payout" button opens modal:
   - Worker info summary
   - Payout amount input (max = pending amount)
   - Payout method dropdown (GCash, Bank Transfer)
   - Account details inputs (conditional based on method):
     * GCash: Phone number (11 digits)
     * Bank: Bank name, Account number, Account name
   - Notes textarea
   - Confirm button
6. API call: POST /transactions/{id}/payout
7. Success notification: "Payout of ₱{amount} processed for {worker_name}"
8. Export earnings report as CSV
9. Worker name links to worker profile
10. Pagination + search

File: apps/frontend_web/app/admin/payments/earnings/page.tsx
```

---

### Task 5: Payment Disputes Management ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/payments/disputes/page.tsx`

**AI Prompt**:

```
Create Payment Disputes page:
1. Fetch from /api/adminpanel/transactions/disputes
2. Status filter tabs: All, Open (red badge), Investigating (yellow), Resolved (green)
3. Priority badges: High (red), Medium (yellow), Low (gray)
4. Dispute cards (not table) showing:
   - Dispute ID + Priority badge
   - Job title
   - Parties: Client name vs Worker name
   - Issue description (truncated)
   - Amount disputed (₱)
   - Created date
   - Status badge
   - "View Details" button
5. Dispute detail page (/disputes/{id}):
   - Full issue description
   - Evidence attachments (images/documents)
   - Messages timeline between parties
   - Admin notes section (internal only)
   - Resolution form:
     * Decision textarea (required)
     * Refund amount input (optional, max = transaction amount)
     * Resolution dropdown: Favor Client / Favor Worker / Split / No Refund
     * Confirm button
6. API call: POST /disputes/{id}/resolve
7. Email notifications sent to both parties
8. Resolved disputes show resolution and admin decision
9. Filter by priority
10. Search by job or user

File: apps/frontend_web/app/admin/payments/disputes/page.tsx
```

---

### Task 6: Financial Analytics Dashboard ⏰ 5-6 hours

**File**: `apps/frontend_web/app/admin/payments/analytics/page.tsx`

**AI Prompt**:

```
Create Financial Analytics dashboard:
1. Fetch from /api/adminpanel/transactions/statistics and /revenue-trends
2. Date range selector: Today, This Week, This Month, This Year, Custom Range
3. Stats cards (6 cards):
   - Total Revenue (₱) with % change vs previous period
   - Total Transactions (count) with % change
   - Escrow Held (₱)
   - Platform Fees Collected (₱)
   - Refunded Amount (₱)
   - Average Transaction (₱)
4. Revenue trend line chart:
   - X-axis: Time (daily/weekly/monthly based on range)
   - Y-axis: Revenue (₱)
   - Show transaction count as bars (secondary axis)
5. Payment method breakdown pie chart:
   - GCash, Wallet, Cash percentages
   - Show amount and count for each
6. Top 10 tables:
   - Highest spending clients (name, total spent, job count)
   - Top earning workers (name, total earned, job count)
   - Most active categories (category, transaction count, revenue)
7. Export buttons: Export Revenue Report (PDF), Export Transactions (CSV)
8. Comparison badges: "↑ 25% vs last month" (green up, red down)
9. Use Chart.js or Recharts for visualizations
10. Responsive grid layout

File: apps/frontend_web/app/admin/payments/analytics/page.tsx
```

---

### Task 7: Refund Processing Workflow ⏰ 2-3 hours

**Component**: Reusable refund modal/page

**AI Prompt**:

```
Create reusable Refund Processing component:
1. Can be used from transaction detail or disputes
2. Modal/page shows:
   - Transaction summary: ID, Original amount, Payer, Payee
   - Refund amount input (with validation: max = original amount, min = 0)
   - Reason textarea (required, min 20 chars)
   - Refund to dropdown:
     * Refund to Payer (client)
     * Refund to Payee (worker)
     * Split Refund (show 2 amount inputs)
   - Processing method info: "Refund will be processed to original payment method"
   - Confirmation checkbox: "I confirm this refund is valid"
   - Process Refund button (disabled until all fields valid)
3. API call: POST /transactions/{id}/refund
4. Loading state during API call
5. Success screen:
   - Checkmark icon
   - "Refund Processed Successfully"
   - Refund details summary
   - "Back to Transactions" button
6. Error handling with user-friendly messages
7. TypeScript interfaces for props
8. Tailwind styling
9. Mobile responsive
10. Can be imported in any page

File: apps/frontend_web/components/admin/RefundModal.tsx
```

---

## Testing Checklist

### Transactions

- [ ] Transactions list loads with real data
- [ ] All filters work (status, payment method, date range, user)
- [ ] Stat cards display accurate totals
- [ ] Pagination works correctly
- [ ] Export to CSV generates correct data
- [ ] Click row navigates to detail page
- [ ] Transaction detail shows all information
- [ ] Audit trail displays chronologically
- [ ] Links to users and jobs work
- [ ] Download receipt works

### Escrow

- [ ] Escrow list filtered by status
- [ ] Stat cards accurate
- [ ] Days held calculation correct with color coding
- [ ] Release escrow modal works
- [ ] Bulk release works with confirmation
- [ ] Refund flow works
- [ ] Auto-refresh toggle works
- [ ] Search filters results

### Worker Earnings

- [ ] Earnings list loads correctly
- [ ] Worker search autocomplete works
- [ ] Stats cards accurate
- [ ] Process payout modal validates inputs
- [ ] GCash payout saves phone number
- [ ] Bank transfer saves bank details
- [ ] API call succeeds
- [ ] Success notification appears
- [ ] Export report works
- [ ] Profile links work

### Disputes

- [ ] Disputes load grouped by status
- [ ] Priority badges display correctly
- [ ] Detail page shows full information
- [ ] Evidence attachments viewable
- [ ] Admin notes save
- [ ] Resolution form validates
- [ ] API call works
- [ ] Email notifications sent
- [ ] Resolved disputes show decision
- [ ] Search and filters work

### Analytics

- [ ] All stat cards display with data
- [ ] Date range selector changes data
- [ ] Comparison percentages accurate
- [ ] Revenue chart renders correctly
- [ ] Payment method pie chart accurate
- [ ] Top 10 tables populated
- [ ] Export PDF works
- [ ] Export CSV works
- [ ] Responsive on mobile

### Refund Component

- [ ] Modal opens correctly
- [ ] Amount validation works
- [ ] Reason required and validated
- [ ] Refund to dropdown works
- [ ] Split refund shows 2 inputs
- [ ] Confirmation checkbox required
- [ ] API call succeeds
- [ ] Success screen displays
- [ ] Error handling works
- [ ] Can be used in multiple pages

---

## File Structure

```
apps/frontend_web/app/admin/payments/
├── transactions/
│   ├── page.tsx                    ❌ CREATE (transactions list)
│   └── [id]/
│       └── page.tsx                ❌ CREATE (transaction detail)
├── escrow/
│   └── page.tsx                    ❌ CREATE (escrow monitor)
├── earnings/
│   └── page.tsx                    ❌ CREATE (worker earnings)
├── disputes/
│   ├── page.tsx                    ❌ CREATE (disputes list)
│   └── [id]/
│       └── page.tsx                ❌ CREATE (dispute detail)
└── analytics/
    └── page.tsx                    ❌ CREATE (financial analytics)

apps/frontend_web/components/admin/
└── RefundModal.tsx                 ❌ CREATE (reusable refund)
```

---

## API Integration Summary

| Endpoint                                             | Method | Purpose             | Status   |
| ---------------------------------------------------- | ------ | ------------------- | -------- |
| `/api/adminpanel/transactions/all`                   | GET    | List transactions   | ✅ Ready |
| `/api/adminpanel/transactions/{id}/detail`           | GET    | Transaction details | ✅ Ready |
| `/api/adminpanel/transactions/escrow`                | GET    | Escrow payments     | ✅ Ready |
| `/api/adminpanel/transactions/{id}/release-escrow`   | POST   | Release escrow      | ✅ Ready |
| `/api/adminpanel/transactions/{id}/refund`           | POST   | Process refund      | ✅ Ready |
| `/api/adminpanel/transactions/worker-earnings`       | GET    | Worker earnings     | ✅ Ready |
| `/api/adminpanel/transactions/{id}/payout`           | POST   | Process payout      | ✅ Ready |
| `/api/adminpanel/transactions/disputes`              | GET    | Payment disputes    | ✅ Ready |
| `/api/adminpanel/transactions/disputes/{id}/resolve` | POST   | Resolve dispute     | ✅ Ready |
| `/api/adminpanel/transactions/statistics`            | GET    | Financial stats     | ✅ Ready |
| `/api/adminpanel/transactions/revenue-trends`        | GET    | Revenue trends      | ✅ Ready |

---

## Dependencies

- **Module 2**: User Management (for user profile links)
- **Module 3**: Jobs Management (for job detail links)
- **Chart Library**: Chart.js or Recharts for analytics

---

## Completion Criteria

✅ Module complete when:

1. All transaction pages functional
2. Escrow monitoring operational
3. Worker earnings and payouts working
4. Dispute resolution workflow complete
5. Financial analytics dashboard with charts
6. Refund component reusable
7. All API integrations working
8. All tests passing
9. Documentation updated

---

**Ready for Implementation**: ✅ All backend APIs operational, financial workflows designed
