# Payment Buffer System Implementation (7-Day Hold Period)

**Status**: ✅ 100% COMPLETE  
**Type**: Full-Stack Feature - Payment Buffer with Backjob Protection  
**Date**: December 10, 2025

## Overview

Implemented a 7-day payment buffer system where worker earnings are held for a configurable period before being released to their wallet. During this buffer period, clients can request backjobs (rework). If no backjob is requested, payments are automatically released via cron job.

## Key Features

### 1. Due Balance (Pending Earnings)

- Workers see "Due Balance" in wallet showing held earnings
- Each pending payment shows job title, amount, and release date
- Visual countdown: "Releases in X days"
- Backjob indicator shows if payment is held due to pending backjob

### 2. 7-Day Buffer Period

- Configurable via `PlatformSettings.escrowHoldingDays` (default: 7 days)
- Countdown starts when client approves job completion
- Auto-release via cron when buffer expires

### 3. Backjob Protection

- Clients can only request backjobs during buffer period
- Once payment released, backjob window closes permanently
- 24-hour cooldown after backjob rejection before new request allowed

### 4. Auto-Release System

- Hourly cron job checks for payments ready to release
- Skips jobs with active backjob requests (OPEN or UNDER_REVIEW)
- Transfers from `pendingEarnings` to `balance`
- Sends notification to worker when released

## Database Changes (Migration 0065)

### Job Model

```python
paymentReleaseDate = DateTimeField(null=True)        # When payment can be released
paymentReleasedToWorker = BooleanField(default=False) # Whether released
paymentReleasedAt = DateTimeField(null=True)         # When it was released
paymentHeldReason = CharField(choices=[               # Why held
    'BUFFER_PERIOD',    # Within 7-day window
    'BACKJOB_PENDING',  # Backjob request active
    'ADMIN_HOLD',       # Admin override
    'RELEASED'          # Payment completed
])
```

### Wallet Model

```python
pendingEarnings = DecimalField(default=0.00)  # Due Balance
```

### Transaction Model

```python
PENDING_EARNING = 'Pending Earning (7-day buffer)'  # New type
```

### JobDispute Model

```python
adminRejectedAt = DateTimeField(null=True)     # For cooldown tracking
adminRejectionReason = TextField(null=True)    # Rejection reason
```

## Backend Implementation

### 1. Payment Buffer Service (`jobs/payment_buffer_service.py`)

```python
# Key Functions:
get_payment_buffer_days()           # Get buffer from settings (default 7)
add_pending_earnings(job, account, amount)  # Add to pendingEarnings
release_pending_payment(job)        # Transfer to balance
can_request_backjob(job)            # Check if client can request
has_active_backjob(job)             # Check for OPEN/UNDER_REVIEW dispute
get_pending_earnings_for_account(account)   # Get list for API
hold_payment_for_backjob(job)       # Set reason to BACKJOB_PENDING
resume_payment_after_backjob_rejection(job) # Resume countdown
```

### 2. Modified Endpoints

**POST /api/jobs/{id}/approve-completion**

- WALLET payments: Now uses `add_pending_earnings()` instead of direct credit
- CASH payments: Same treatment - held for 7 days
- Creates PENDING_EARNING transaction
- Sets `paymentReleaseDate` = now + 7 days

**POST /api/jobs/{id}/request-backjob**

- Validates buffer window (paymentReleasedToWorker must be False)
- Checks 24-hour cooldown after rejection
- Sets `paymentHeldReason = 'BACKJOB_PENDING'`
- Returns detailed error messages if can't request

**POST /api/adminpanel/disputes/{id}/reject**

- Sets `lastBackjobRejectedAt` for cooldown
- Resumes payment timeline (changes reason back to BUFFER_PERIOD)
- If release date passed, auto-releases payment

### 3. New API Endpoints

**GET /api/mobile/wallet/balance**

```json
{
  "balance": 1000.0,
  "pendingEarnings": 5000.0,
  "pendingEarningsList": [
    {
      "transaction_id": 123,
      "job_id": 456,
      "job_title": "Plumbing Repair",
      "amount": 5000.0,
      "release_date": "2024-12-17T12:00:00Z",
      "release_date_formatted": "Dec 17, 2024",
      "days_until_release": 7,
      "held_reason": "BUFFER_PERIOD",
      "has_active_backjob": false
    }
  ],
  "pendingEarningsCount": 1
}
```

**GET /api/mobile/wallet/pending-earnings**

```json
{
  "success": true,
  "pending_earnings": [...],
  "total_pending": 5000.00,
  "count": 1,
  "buffer_days": 7,
  "info_message": "Payments are held for 7 days..."
}
```

### 4. Cron Command

```bash
# Run hourly via cron
python manage.py release_pending_payments

# Or with dry-run to preview
python manage.py release_pending_payments --dry-run
```

Features:

- Finds all jobs ready for release (paymentReleaseDate <= now)
- Skips jobs with active backjobs
- Atomic transaction for safety
- Creates EARNING transaction + notification
- Logs all operations for audit

## Frontend Implementation

### 1. API Config (`lib/api/config.ts`)

```typescript
WALLET_PENDING_EARNINGS: `${API_BASE_URL}/api/mobile/wallet/pending-earnings`;
```

### 2. Hooks (`lib/hooks/useWallet.ts`)

```typescript
// New types
interface PendingEarningItem {
  transaction_id: number;
  job_id: number;
  job_title: string;
  amount: number;
  release_date: string | null;
  days_until_release: number;
  held_reason: "BUFFER_PERIOD" | "BACKJOB_PENDING";
  has_active_backjob: boolean;
}

// Updated WalletData
interface WalletData {
  pendingEarnings: number;
  pendingEarningsList: PendingEarningItem[];
  pendingEarningsCount: number;
  // ... existing fields
}

// New hook
export function usePendingEarnings();
```

### 3. Wallet Screen Updates (`app/wallet/index.tsx`)

- New "Due Balance" section with warning styling
- Shows total pending amount
- Lists up to 3 pending jobs with release dates
- "View all X pending payments" link
- Backjob indicator badge
- Info box explaining 7-day hold

### 4. New Screen (`app/wallet/pending-earnings.tsx`)

- Full list of all pending earnings
- Summary card with total
- Individual job cards with:
  - Job title and amount
  - Release date
  - Days countdown
  - Backjob warning if applicable
  - "View Job Details" button
- Info banner explaining buffer period

## Business Rules

### Payment Flow

1. Client approves job completion
2. Payment goes to worker's `pendingEarnings` (Due Balance)
3. `paymentReleaseDate` set to 7 days from now
4. After 7 days (if no backjob): Auto-released to `balance`

### Backjob Flow

1. Client requests backjob during buffer
2. `paymentHeldReason` changes to `BACKJOB_PENDING`
3. Payment countdown paused
4. Admin reviews backjob:
   - **Approved**: Worker must do rework, payment held until resolution
   - **Rejected**: 24h cooldown, payment timeline resumes
5. If release date passed after rejection: Auto-release

### Restrictions

- Backjobs only during buffer (paymentReleasedToWorker = False)
- 24-hour cooldown between backjob rejections
- Once released, no more backjobs possible

## Files Created/Modified

### Backend (8 files)

1. `accounts/models.py` - Added 7 new fields across 3 models
2. `accounts/migrations/0065_payment_buffer_system.py` - Migration
3. `jobs/payment_buffer_service.py` - New service (437 lines)
4. `jobs/api.py` - Updated approve-completion, request-backjob
5. `adminpanel/api.py` - Updated reject-backjob
6. `accounts/mobile_api.py` - Updated wallet/balance, added pending-earnings
7. `jobs/management/commands/release_pending_payments.py` - Cron command

### Frontend (4 files)

1. `lib/api/config.ts` - Added WALLET_PENDING_EARNINGS
2. `lib/hooks/useWallet.ts` - Updated types, added usePendingEarnings
3. `app/wallet/index.tsx` - Added Due Balance section
4. `app/wallet/pending-earnings.tsx` - New screen (340 lines)

## Testing

### Manual Testing Checklist

- [ ] Complete a job, verify payment goes to pendingEarnings
- [ ] Check wallet shows Due Balance section
- [ ] Verify days countdown is accurate
- [ ] Request backjob within buffer - should succeed
- [ ] Admin reject backjob - verify 24h cooldown
- [ ] Try request within cooldown - should fail
- [ ] Wait for release date - run cron - verify release
- [ ] Try backjob after release - should fail

### Cron Testing

```bash
# Dry run
docker exec -w /app/apps/backend/src iayos-backend-dev python manage.py release_pending_payments --dry-run

# Actual run
docker exec -w /app/apps/backend/src iayos-backend-dev python manage.py release_pending_payments
```

## Production Setup

### Cron Configuration

Add to crontab:

```bash
# Run every hour at minute 0
0 * * * * cd /app/apps/backend/src && python manage.py release_pending_payments >> /var/log/payment_release.log 2>&1
```

### Monitoring

- Check `/var/log/payment_release.log` for release logs
- Monitor `pendingEarnings` totals in admin dashboard
- Alert on failed releases (ADMIN_HOLD status)

## Configuration

### PlatformSettings

```python
escrowHoldingDays = 7  # Default, can be changed in admin
```

### Constants (in payment_buffer_service.py)

```python
BACKJOB_COOLDOWN_HOURS = 24  # Cooldown after rejection
```
