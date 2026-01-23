# Mobile Phase 4: Final Payment System - Implementation Plan

**Phase**: 4 - Final Payment (50% Completion Payment)  
**Priority**: CRITICAL  
**Estimated Time**: 80-100 hours  
**Status**: 📋 PENDING (After Phase 3)

---

## 🎯 Phase Overview

Implement the final 50% payment that clients pay after approving job completion, triggering automatic payment release to workers' wallets.

**GitHub Issue Spec**: `docs/github-issues/MOBILE_PHASE_4_FINAL_PAYMENT.md`

### Key Requirements

1. **Final Payment Flow**: Client pays remaining 50% after approving job completion
2. **Automatic Release**: Payment automatically released to worker's wallet
3. **Payment Methods**: GCash (via Xendit), Wallet, Cash (same as Phase 3)
4. **Earnings Tracking**: Worker earnings dashboard with gross/net breakdown
5. **Payment Timeline**: Visual timeline showing escrow → final → release

---

## 📊 Week-by-Week Implementation

### Week 1: Final Payment Flow (35-40 hours)

#### Day 1-2: Final Payment Screen (15-18 hours)

**Files to Create**:

- `app/payments/final.tsx` (420 lines) - Final payment screen
- `components/FinalPaymentCard.tsx` (250 lines) - Payment breakdown
- `lib/hooks/useFinalPayment.ts` (180 lines) - Final payment hooks

**Features**:

- Final payment screen (triggered after client approves completion)
- Display remaining 50% + platform fees
- Payment method selection (reuse Phase 3 components)
- Payment confirmation modal
- Success/failure handling

**API Integration**:

- `POST /api/mobile/payments/final` - Create final payment
- `GET /api/jobs/{id}/payment-status` - Check payment status

**Success Criteria**:

- ✅ Final payment screen displays after job approval
- ✅ Amount calculation correct (50% of job budget)
- ✅ Payment methods work (GCash/Wallet/Cash)
- ✅ Worker receives payment notification

---

#### Day 3-4: Payment Release to Worker (15-18 hours)

**Files to Create**:

- `app/worker/payment-received.tsx` (350 lines) - Payment received screen
- `components/PaymentReceivedCard.tsx` (220 lines) - Earnings breakdown
- `lib/hooks/useWorkerEarnings.ts` (200 lines) - Earnings hooks

**Features**:

- Payment received notification to worker
- Earnings breakdown (gross, platform fee, net)
- Wallet balance update display
- Payment receipt generation
- "View Earnings" navigation

**API Integration**:

- `GET /api/accounts/wallet/balance` - Updated worker balance
- `GET /api/jobs/{id}/earnings` - Job earnings breakdown

**Success Criteria**:

- ✅ Worker receives notification when payment released
- ✅ Wallet balance updates automatically
- ✅ Earnings breakdown displays correctly
- ✅ Receipt generated successfully

---

#### Day 5: Cash Payment Verification UI (8-10 hours)

**Files to Create**:

- `components/CashPaymentPendingCard.tsx` (180 lines) - Pending status display

**Features**:

- Cash payment pending verification status
- Admin approval notification
- Approved/rejected status display
- Resubmit functionality for rejected payments

**API Integration**:

- `GET /api/mobile/payments/cash-status/{id}` - Check cash approval status

**Success Criteria**:

- ✅ Pending status displayed to both client and worker
- ✅ Approval notification sent to both parties
- ✅ Rejected payments allow resubmission

---

### Week 2: Timeline & Earnings (30-35 hours)

#### Day 6-7: Payment Timeline (18-22 hours)

**Files to Create**:

- `app/payments/timeline/[jobId].tsx` (480 lines) - Payment timeline screen
- `components/PaymentTimelineItem.tsx` (280 lines) - Timeline item component
- `components/PaymentTimelineConnector.tsx` (120 lines) - Visual connector

**Features**:

- Visual timeline with dots and connecting lines
- Escrow payment timestamp + amount
- Final payment timestamp + amount
- Payment release timestamp (to worker)
- Status badges for each step (completed/pending/failed)
- Relative timestamps ("2 days ago")

**API Integration**:

- `GET /api/jobs/{id}/payment-timeline` - Get payment timeline

**Success Criteria**:

- ✅ Timeline displays all payment events
- ✅ Visual indicators clear and intuitive
- ✅ Timestamps formatted correctly
- ✅ Works for both client and worker views

---

#### Day 8-9: Worker Earnings Dashboard (15-18 hours)

**Files to Create**:

- `app/worker/earnings.tsx` (520 lines) - Earnings dashboard
- `components/EarningsStatsCard.tsx` (240 lines) - Stats display
- `components/EarningsHistoryItem.tsx` (180 lines) - History item

**Features**:

- Total earnings display (gross/net)
- Current wallet balance
- Pending payments counter
- Earnings history with filters (date, job)
- Breakdown per job (job title, date, amount)
- Withdrawal button (navigation only)

**API Integration**:

- `GET /api/accounts/earnings/summary` - Earnings summary
- `GET /api/accounts/earnings/history` - Earnings history with pagination

**Success Criteria**:

- ✅ Earnings summary displays correctly
- ✅ History loads with pagination
- ✅ Filters work (date range, job)
- ✅ Navigation to withdrawal screen

---

### Week 3: Notifications & Testing (15-25 hours)

#### Day 10-11: Payment Notifications (10-12 hours)

**Files to Create**:

- `lib/utils/payment-notifications.ts` (150 lines) - Notification helpers

**Features**:

- Worker notification: Escrow paid
- Worker notification: Final payment received
- Worker notification: Payment released to wallet
- Client notification: Payment confirmed
- In-app notification badges

**API Integration**:

- `POST /api/notifications/payment` - Create payment notification

**Success Criteria**:

- ✅ All notification types working
- ✅ In-app badges display correctly
- ✅ Push notifications sent (if app closed)
- ✅ Notification tap opens relevant screen

---

#### Day 12-14: Testing & QA (5-13 hours)

**Testing Tasks**:

- Test final payment flow end-to-end
- Test payment release to worker wallet
- Test cash payment approval workflow
- Test payment timeline for all scenarios
- Test earnings dashboard with real data
- Test notifications for all payment events
- Verify TypeScript compilation (0 errors)

**QA Checklist**:

- 120+ test cases in `docs/qa/NOT DONE/MOBILE_PHASE4_QA_CHECKLIST.md`

**Documentation**:

- Update `docs/mobile/MOBILE_PHASE4_COMPLETE.md`
- Create completion summary

---

## 📁 Complete File List (18 files, ~3,800 lines)

### Hooks & Utils (3 files, ~530 lines)

1. `lib/hooks/useFinalPayment.ts` (180 lines) - Final payment hooks
2. `lib/hooks/useWorkerEarnings.ts` (200 lines) - Earnings hooks
3. `lib/utils/payment-notifications.ts` (150 lines) - Notification helpers

### Screens (5 files, ~1,770 lines)

4. `app/payments/final.tsx` (420 lines) - Final payment screen
5. `app/payments/timeline/[jobId].tsx` (480 lines) - Payment timeline
6. `app/worker/payment-received.tsx` (350 lines) - Payment received
7. `app/worker/earnings.tsx` (520 lines) - Earnings dashboard

### Components (7 files, ~1,450 lines)

8. `components/FinalPaymentCard.tsx` (250 lines) - Payment breakdown
9. `components/PaymentReceivedCard.tsx` (220 lines) - Earnings breakdown
10. `components/CashPaymentPendingCard.tsx` (180 lines) - Pending status
11. `components/PaymentTimelineItem.tsx` (280 lines) - Timeline item
12. `components/PaymentTimelineConnector.tsx` (120 lines) - Visual connector
13. `components/EarningsStatsCard.tsx` (240 lines) - Stats display
14. `components/EarningsHistoryItem.tsx` (180 lines) - History item

### Documentation (3 files, ~4,500 lines)

15. `docs/github-issues/plans/PHASE_4_PROGRESS.md` (1,500 lines) - Progress tracking
16. `docs/qa/NOT DONE/MOBILE_PHASE4_QA_CHECKLIST.md` (1,500 lines) - QA tests
17. `docs/mobile/MOBILE_PHASE4_COMPLETE.md` (1,500 lines) - Completion summary

### Modified Files (1 file)

18. `lib/api/config.ts` - Add 8 final payment endpoints

---

## 🔌 API Endpoints (8 endpoints)

### New Endpoints (Backend already implemented)

1. `POST /api/mobile/payments/final` - Create final payment
2. `GET /api/jobs/{id}/payment-status` - Get payment status
3. `GET /api/jobs/{id}/earnings` - Get job earnings breakdown
4. `GET /api/jobs/{id}/payment-timeline` - Get payment timeline
5. `GET /api/accounts/earnings/summary` - Get earnings summary
6. `GET /api/accounts/earnings/history` - Get earnings history
7. `GET /api/mobile/payments/cash-status/{id}` - Check cash approval
8. `POST /api/notifications/payment` - Create payment notification

---

## 🎨 UI Flow

### Client Final Payment Flow

```
Job Completed (approved by client)
    ↓
Final Payment Screen (final.tsx)
    ↓
┌──────────┬──────────┬──────────┐
│  GCash   │  Wallet  │   Cash   │
└──────────┴──────────┴──────────┘
    ↓
Payment Timeline (timeline/[jobId].tsx)
```

### Worker Payment Received Flow

```
Final Payment Completed (by client)
    ↓
Push Notification: "Payment Received"
    ↓
Payment Received Screen (payment-received.tsx)
    ↓
Earnings Dashboard (earnings.tsx)
```

---

## ✅ Success Criteria

### Functional Requirements

- [ ] Clients can pay final 50% after approving completion
- [ ] Payment automatically released to worker's wallet
- [ ] Workers receive notification of payment release
- [ ] Cash payments await admin approval
- [ ] Payment timeline shows all transaction timestamps
- [ ] Earnings dashboard displays gross/net/pending correctly
- [ ] Notifications work for all payment events

### Technical Requirements

- [ ] 0 TypeScript compilation errors
- [ ] All API endpoints integrated correctly
- [ ] React Query caching configured
- [ ] Error handling with toast notifications
- [ ] Loading states on all async operations

### Testing Requirements

- [ ] 120+ test cases executed (QA checklist)
- [ ] Integration tests with backend passed
- [ ] Payment flow tested end-to-end
- [ ] Notifications verified working

---

## 📝 Dependencies

**Requires**:

- ✅ Phase 3: Escrow Payment System (must be complete)
- ✅ Backend: Final payment APIs operational

**Blocks**:

- Phase 5: Real-Time Chat (can proceed in parallel)
- Phase 6: Enhanced Profiles completion (can proceed in parallel)

---

**Last Updated**: January 2025  
**Status**: 📋 PENDING (After Phase 3)  
**Next**: Awaiting Phase 3 completion
