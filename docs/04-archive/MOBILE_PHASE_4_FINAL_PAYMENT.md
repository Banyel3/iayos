# [Mobile] Phase 4: Final Payment System (50% Completion Payment)

**Labels:** `priority:critical`, `type:feature`, `area:mobile`, `area:payments`
**Priority:** CRITICAL
**Estimated Time:** 80-100 hours

## Summary
Implement the final 50% payment that clients pay after approving job completion, triggering payment release to workers.

## Tasks

### Final Payment Flow
- [ ] Create FinalPaymentScreen
- [ ] Display remaining amount (50% of budget)
- [ ] Show payment breakdown with platform fees
- [ ] Trigger final payment after client approves completion
- [ ] Implement payment method selection (GCash/Cash/Wallet)
- [ ] Handle payment success and release to worker
- [ ] Integrate with `/api/jobs/{id}/pay-remaining`

### Payment Release to Worker
- [ ] Display payment release notification to worker
- [ ] Show payment received amount
- [ ] Update worker wallet balance automatically
- [ ] Create payment receipt for worker
- [ ] Add earnings breakdown (gross, fees, net)

### Cash Payment Verification
- [ ] Create cash payment proof upload for final payment
- [ ] Implement admin approval workflow awareness
- [ ] Show pending verification status to both parties
- [ ] Display admin approval notification
- [ ] Handle approved/rejected cash payments

### Payment Timeline
- [ ] Create PaymentTimelineScreen
- [ ] Display escrow payment timestamp
- [ ] Show final payment timestamp
- [ ] Display payment release timestamp
- [ ] Add visual timeline indicator

### Earnings & Withdrawals
- [ ] Create EarningsScreen for workers
- [ ] Display total earnings (gross/net)
- [ ] Show pending payments
- [ ] Add withdrawal request functionality
- [ ] Implement earnings history with filters

### Payment Notifications
- [ ] Notify worker when escrow is paid
- [ ] Notify worker when final payment is received
- [ ] Notify worker when payment is released to wallet
- [ ] Notify client when payment is confirmed
- [ ] Add in-app payment status badges

## Files to Create
- `lib/screens/payments/final_payment_screen.dart` - Final payment UI
- `lib/screens/payments/payment_timeline_screen.dart` - Payment history
- `lib/screens/worker/earnings_screen.dart` - Worker earnings
- `lib/screens/worker/withdrawal_screen.dart` - Withdrawal requests
- `lib/components/payment_timeline.dart` - Timeline component
- `lib/components/earnings_card.dart` - Earnings display
- `lib/services/final_payment_service.dart` - Final payment API
- `lib/models/payment_timeline.dart` - Timeline model
- `lib/models/earnings.dart` - Earnings model
- `lib/providers/earnings_provider.dart` - Earnings state

## API Endpoints to Integrate
- `POST /api/jobs/{id}/pay-remaining` - Pay final 50%
- `GET /api/accounts/wallet-balance` - Get worker balance
- `GET /api/accounts/transactions` - Transaction history
- `POST /api/accounts/deposit` - Wallet operations
- `GET /api/jobs/{id}` - Job payment status

## Acceptance Criteria
- [ ] Clients can pay final 50% after approving completion
- [ ] Payment is automatically released to worker's wallet
- [ ] Workers receive notification of payment release
- [ ] Cash payments await admin approval
- [ ] Payment timeline shows all transaction timestamps
- [ ] Workers can view total earnings
- [ ] All payment methods (GCash/Cash/Wallet) work correctly
- [ ] Platform fees are calculated and displayed accurately

## Dependencies
- **Requires:** Mobile Phase 2 - Job completion approval
- **Requires:** Mobile Phase 3 - Escrow payment system
- **Completes:** Critical payment workflow

## Testing
- [ ] Test final payment with all payment methods
- [ ] Test payment release to worker wallet
- [ ] Verify wallet balance updates correctly
- [ ] Test cash payment admin approval flow
- [ ] Verify earnings calculation accuracy
- [ ] Test payment timeline display
- [ ] Verify notification delivery

---
Generated with Claude Code
