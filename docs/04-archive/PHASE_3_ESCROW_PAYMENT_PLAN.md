# Mobile Phase 3: Escrow Payment System - Implementation Plan

**Phase**: 3 - Escrow Payment (50% Downpayment)  
**Priority**: CRITICAL  
**Estimated Time**: 100-120 hours  
**Status**: 📋 READY TO BEGIN

---

## 🎯 Phase Overview

Implement the escrow payment system where clients pay 50% downpayment when creating jobs. This is **CRITICAL** as users currently cannot complete job creation in the mobile app without payment.

**GitHub Issue Spec**: `docs/github-issues/MOBILE_PHASE_3_ESCROW_PAYMENT.md`

### Key Requirements

1. **Payment Methods**: GCash (via Xendit), Wallet, Cash
2. **Escrow Amount**: 50% of job budget + 5% platform fee
3. **Payment Tracking**: Real-time status updates and transaction history
4. **Cash Verification**: Admin approval workflow for cash payments
5. **Wallet Integration**: Balance checking and deposit flow

---

## 📊 Week-by-Week Implementation

### Week 1: Payment Foundation (40-45 hours)

#### Day 1-2: Payment Method Selection (15-20 hours)

**Files to Create**:

- `lib/hooks/usePayments.ts` (200 lines) - React Query hooks
- `app/payments/method.tsx` (350 lines) - Payment method screen
- `components/PaymentMethodButton.tsx` (180 lines) - Method selector
- `components/PaymentSummaryCard.tsx` (220 lines) - Breakdown display

**Features**:

- Payment method selection (GCash/Wallet/Cash radio buttons)
- Wallet balance display with refresh
- Payment amount breakdown (50% job + 5% fee = 55% total)
- Visual indicators for selected method
- Disabled states for insufficient wallet balance
- "Proceed to Payment" navigation button

**API Integration**:

- `GET /api/accounts/wallet/balance` - Fetch wallet balance
- Update `lib/api/config.ts` with payment endpoints

**Success Criteria**:

- ✅ Users can select payment method
- ✅ Wallet balance displays correctly
- ✅ Payment summary calculates 55% correctly
- ✅ Navigation to next screen works

---

#### Day 3-4: Xendit Integration (15-20 hours)

**Files to Create**:

- `lib/hooks/useXendit.ts` (250 lines) - Xendit integration hooks
- `lib/utils/payment-utils.ts` (150 lines) - Payment helpers
- `app/payments/gcash.tsx` (400 lines) - GCash payment screen

**Features**:

- Xendit invoice creation via backend
- WebView for Xendit payment page
- Deep linking callback handling
- Payment success/failure detection
- Error handling with retry logic

**API Integration**:

- `POST /api/mobile/payments/xendit/invoice` - Create Xendit invoice
- `POST /api/mobile/payments/escrow` - Create escrow payment record

**Success Criteria**:

- ✅ Xendit invoice created successfully
- ✅ WebView loads Xendit payment page
- ✅ Payment completion detected correctly
- ✅ Error handling works (network failures, user cancellation)

---

#### Day 5: GCash Payment Screen Polish (10-12 hours)

**Features**:

- Loading states during invoice creation
- Success confirmation screen
- Failure screen with retry option
- "Return to Job" navigation
- Payment receipt generation

**Testing**:

- Test with Xendit sandbox credentials
- Test network failure scenarios
- Test user cancellation flow
- Verify callback handling

---

### Week 2: Alternative Payments (35-40 hours)

#### Day 6-7: Wallet Payment (20-25 hours)

**Files to Create**:

- `app/payments/wallet.tsx` (380 lines) - Wallet payment screen
- `app/payments/deposit.tsx` (420 lines) - Wallet deposit screen
- `components/WalletBalanceCard.tsx` (200 lines) - Balance display

**Features**:

- Wallet confirmation screen
- Balance deduction display (before/after)
- Insufficient balance handling
- Wallet deposit flow with Xendit
- Transaction receipt display

**API Integration**:

- `POST /api/mobile/payments/escrow` - Create escrow payment (wallet method)
- `POST /api/accounts/wallet/deposit` - Deposit via Xendit
- `GET /api/accounts/wallet/transactions` - Transaction history

**Success Criteria**:

- ✅ Wallet payment deducts correctly
- ✅ Deposit flow works via Xendit
- ✅ Transaction appears in history immediately
- ✅ Balance updates in real-time

---

#### Day 8-9: Cash Payment (15-20 hours)

**Files to Create**:

- `app/payments/cash.tsx` (450 lines) - Cash proof upload
- `components/CashProofUpload.tsx` (280 lines) - Image upload component

**Features**:

- Cash payment instruction screen
- Camera/gallery picker (using Expo ImagePicker)
- Image preview before upload
- Upload progress indicator (0-100%)
- Pending verification status display
- Admin approval notification

**API Integration**:

- `POST /api/mobile/payments/cash-proof` - Upload cash proof image
- `POST /api/mobile/payments/escrow` - Create escrow payment (cash method)

**Success Criteria**:

- ✅ Camera/gallery picker works
- ✅ Image uploads successfully
- ✅ Progress indicator displays correctly
- ✅ Pending status shown to user

---

### Week 3: Status & Testing (25-35 hours)

#### Day 10-11: Payment Status Tracking (15-20 hours)

**Files to Create**:

- `app/payments/status.tsx` (520 lines) - Payment status screen
- `app/payments/history.tsx` (480 lines) - Transaction history
- `components/PaymentStatusBadge.tsx` (150 lines) - Status badge
- `components/TransactionCard.tsx` (220 lines) - History item
- `components/PaymentReceiptModal.tsx` (280 lines) - Receipt display

**Features**:

- Payment status tracking screen (pending/completed/failed)
- Transaction history with filters (date, method, status)
- Payment receipt modal with download option
- Status badges with color coding
- Real-time status updates via polling

**API Integration**:

- `GET /api/mobile/payments/status/{id}` - Get payment status
- `GET /api/mobile/payments/history` - Transaction list
- `GET /api/mobile/payments/receipt/{id}` - Receipt details

**Success Criteria**:

- ✅ Status displays correctly for all payment types
- ✅ Transaction history loads with pagination
- ✅ Receipt modal displays all details
- ✅ Polling updates status in real-time

---

#### Day 12-14: Testing & QA (10-15 hours)

**Testing Tasks**:

- Integration testing with backend
- Test all 3 payment methods (GCash, Wallet, Cash)
- Test error scenarios (network failure, insufficient balance, payment failure)
- Test payment status updates
- Test transaction history
- Test receipt generation
- Verify TypeScript compilation (0 errors)

**QA Checklist**:

- 150+ test cases in `docs/qa/NOT DONE/MOBILE_PHASE3_QA_CHECKLIST.md`

**Documentation**:

- Update `docs/mobile/MOBILE_PHASE3_COMPLETE.md` with implementation details
- Create completion summary with statistics

---

## 📁 Complete File List (21 files, ~4,450 lines)

### Hooks & Utils (3 files, ~600 lines)

1. `lib/hooks/usePayments.ts` (200 lines) - Payment React Query hooks
2. `lib/hooks/useXendit.ts` (250 lines) - Xendit integration hooks
3. `lib/utils/payment-utils.ts` (150 lines) - Payment calculation utilities

### Screens (7 files, ~2,500 lines)

4. `app/payments/method.tsx` (350 lines) - Payment method selection
5. `app/payments/gcash.tsx` (400 lines) - GCash payment via Xendit
6. `app/payments/wallet.tsx` (380 lines) - Wallet payment confirmation
7. `app/payments/cash.tsx` (450 lines) - Cash proof upload
8. `app/payments/deposit.tsx` (420 lines) - Wallet deposit flow
9. `app/payments/status.tsx` (520 lines) - Payment status tracking
10. `app/payments/history.tsx` (480 lines) - Transaction history

### Components (6 files, ~1,200 lines)

11. `components/PaymentMethodButton.tsx` (180 lines) - Method selector
12. `components/PaymentSummaryCard.tsx` (220 lines) - Amount breakdown
13. `components/PaymentStatusBadge.tsx` (150 lines) - Status badge
14. `components/TransactionCard.tsx` (220 lines) - History item
15. `components/PaymentReceiptModal.tsx` (280 lines) - Receipt display
16. `components/CashProofUpload.tsx` (280 lines) - Image upload
17. `components/WalletBalanceCard.tsx` (200 lines) - Balance display

### Documentation (3 files, ~4,500 lines)

18. `docs/github-issues/plans/PHASE_3_PROGRESS.md` (1,500 lines) - Progress tracking
19. `docs/qa/NOT DONE/MOBILE_PHASE3_QA_CHECKLIST.md` (1,500 lines) - QA tests
20. `docs/mobile/MOBILE_PHASE3_COMPLETE.md` (1,500 lines) - Completion summary

### Modified Files (2 files)

21. `lib/api/config.ts` - Add 10 payment endpoints

---

## 🔌 API Endpoints (10 endpoints)

### New Endpoints (Backend already implemented)

1. `POST /api/mobile/payments/escrow` - Create escrow payment record
2. `POST /api/mobile/payments/xendit/invoice` - Create Xendit invoice
3. `POST /api/mobile/payments/cash-proof` - Upload cash proof image
4. `GET /api/mobile/payments/status/{id}` - Get payment status
5. `GET /api/mobile/payments/history` - Get transaction list

### Existing Endpoints (Verify integration)

6. `GET /api/accounts/wallet/balance` - Get wallet balance
7. `POST /api/accounts/wallet/deposit` - Deposit funds via Xendit
8. `GET /api/accounts/wallet/transactions` - Get wallet transactions
9. `POST /api/jobs/create` - Create job with payment
10. `POST /api/payments/xendit/callback` - Xendit webhook callback

---

## 🎨 UI Components Architecture

### Payment Flow Navigation

```
Job Creation
    ↓
Payment Method Selection (method.tsx)
    ↓
┌──────────┬──────────┬──────────┐
│  GCash   │  Wallet  │   Cash   │
│ gcash.tsx│wallet.tsx│ cash.tsx │
└──────────┴──────────┴──────────┘
    ↓           ↓           ↓
Payment Status Screen (status.tsx)
    ↓
Job Details (payment complete)
```

### Component Hierarchy

```
PaymentMethodScreen
├── PaymentMethodButton (3x)
├── PaymentSummaryCard
└── WalletBalanceCard

GCashPaymentScreen
├── PaymentSummaryCard
├── WebView (Xendit)
└── PaymentStatusBadge

WalletPaymentScreen
├── WalletBalanceCard
├── PaymentSummaryCard
└── ConfirmButton

CashPaymentScreen
├── InstructionsCard
├── CashProofUpload
│   ├── Camera/Gallery Picker
│   └── Image Preview
└── UploadProgressBar

PaymentHistoryScreen
├── FilterBar
├── TransactionCard (list)
└── PaymentReceiptModal
```

---

## ✅ Success Criteria & Acceptance

### Functional Requirements

- [ ] Users can select payment method (GCash/Wallet/Cash)
- [ ] GCash payment completes via Xendit WebView
- [ ] Wallet payment deducts balance correctly
- [ ] Cash proof uploads with progress indicator
- [ ] Payment status displays correctly (pending/completed/failed)
- [ ] Transaction history accessible with filters
- [ ] Payment receipts viewable and downloadable

### Technical Requirements

- [ ] 0 TypeScript compilation errors
- [ ] All API endpoints integrated correctly
- [ ] React Query caching configured (5 minutes)
- [ ] Error handling with toast notifications
- [ ] Loading states on all async operations
- [ ] Optimistic UI updates where applicable

### Testing Requirements

- [ ] 150+ test cases executed (QA checklist)
- [ ] Integration tests with backend passed
- [ ] Payment flow tested end-to-end
- [ ] Error scenarios tested (network, insufficient balance, payment failure)
- [ ] All 3 payment methods verified working

### Documentation Requirements

- [ ] Progress tracker updated daily
- [ ] QA checklist completed with results
- [ ] Completion summary with statistics
- [ ] AGENTS.md updated with Phase 3 status

---

## 🚀 Next Steps to Begin

**Ready to start Week 1 Day 1-2**: Payment Method Selection (15-20 hours)

### First Implementation Tasks (Day 1)

1. **Update API Config** (30 mins)
   - Add 10 payment endpoints to `lib/api/config.ts`

2. **Create usePayments Hook** (4-5 hours)
   - File: `lib/hooks/usePayments.ts`
   - React Query hooks:
     - `useWalletBalance()` - Fetch wallet balance
     - `useCreateEscrowPayment()` - Create escrow payment
     - `usePaymentStatus()` - Get payment status
     - `useTransactionHistory()` - Fetch history

3. **Create Payment Summary Component** (3-4 hours)
   - File: `components/PaymentSummaryCard.tsx`
   - Display job budget, 50% escrow, 5% fee, total

4. **Create Payment Method Button** (2-3 hours)
   - File: `components/PaymentMethodButton.tsx`
   - Reusable radio button with icon and description

### Day 2 Tasks

5. **Create Payment Method Screen** (6-8 hours)
   - File: `app/payments/method.tsx`
   - Method selection UI
   - Wallet balance display
   - Navigation to next screen

---

## 📝 Notes & Considerations

### Backend Status

✅ **Backend is 100% operational**:

- Xendit integration complete
- Escrow calculation (50% + 5% fee)
- Wallet payment support
- Cash payment with admin approval
- Payment status tracking
- Transaction history

### Integration Points

- **Job Creation Flow**: Payment method selection triggered after accepting job application
- **Wallet Integration**: Existing wallet endpoints (`/api/accounts/wallet/*`)
- **Xendit**: Backend handles Xendit invoice creation and webhook callbacks
- **Deep Linking**: Configure `app.json` for Xendit return URLs

### Technical Decisions

- **WebView for Xendit**: Use `react-native-webview` for GCash payment page
- **Image Upload**: Sequential upload to prevent server overload
- **Payment Polling**: Poll payment status every 5 seconds until completion
- **Caching**: 5-minute cache for wallet balance, 1-minute for payment status

### Risk Mitigation

- **Network Failures**: Retry logic with exponential backoff
- **Payment Failures**: Clear error messages with "Try Again" option
- **Insufficient Balance**: Disable wallet option, show deposit CTA
- **Cash Approval Delays**: Display pending status with "Usually approved within 24 hours"

---

**Last Updated**: January 2025  
**Status**: 📋 READY TO BEGIN  
**Next**: Create usePayments.ts hook (Day 1)
