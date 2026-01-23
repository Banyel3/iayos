# [Mobile] Phase 3: Escrow Payment System (50% Downpayment)

**Labels:** `priority:critical`, `type:feature`, `area:mobile`, `area:payments`
**Priority:** CRITICAL
**Estimated Time:** 100-120 hours

## Summary
Implement the escrow payment system where clients pay 50% downpayment when accepting a job application.

## Tasks

### Payment Integration
- [ ] Integrate Xendit SDK for Flutter
- [ ] Configure Xendit API keys in environment
- [ ] Implement payment gateway initialization
- [ ] Add payment method selection (GCash)
- [ ] Handle payment callbacks and webhooks

### Escrow Payment Flow
- [ ] Create EscrowPaymentScreen
- [ ] Display escrow amount (50% of job budget)
- [ ] Show payment breakdown (amount, fees, total)
- [ ] Implement GCash payment flow
- [ ] Add payment confirmation screen
- [ ] Handle payment success/failure states
- [ ] Integrate with `/api/jobs/{id}/pay-escrow`

### Payment Status Tracking
- [ ] Create PaymentStatusScreen
- [ ] Display escrow payment status
- [ ] Show payment timestamps
- [ ] Add payment receipt view
- [ ] Implement payment history

### Application Acceptance Flow
- [ ] Update job application acceptance to trigger escrow
- [ ] Show escrow payment prompt when accepting application
- [ ] Block job start until escrow is paid
- [ ] Display escrow status on job details
- [ ] Add escrow payment reminders

### Cash Payment Option
- [ ] Add cash payment selection
- [ ] Implement payment proof upload
- [ ] Create proof of payment camera/gallery picker
- [ ] Show pending verification status
- [ ] Integrate with `/api/jobs/{id}/upload-payment-proof`

### Wallet Integration
- [ ] Display wallet balance
- [ ] Add wallet deposit functionality
- [ ] Implement wallet payment option
- [ ] Show wallet transaction history
- [ ] Integrate with `/api/accounts/deposit`

## Files to Create
- `lib/screens/payments/escrow_payment_screen.dart` - Escrow payment UI
- `lib/screens/payments/payment_status_screen.dart` - Status tracking
- `lib/screens/payments/payment_proof_screen.dart` - Cash proof upload
- `lib/components/payment_method_selector.dart` - Payment method picker
- `lib/components/payment_summary.dart` - Payment breakdown
- `lib/services/xendit_service.dart` - Xendit integration
- `lib/services/payment_service.dart` - Payment API service
- `lib/models/payment.dart` - Payment model
- `lib/models/wallet.dart` - Wallet model
- `lib/providers/payment_provider.dart` - Payment state

## API Endpoints to Integrate
- `POST /api/jobs/{id}/pay-escrow` - Pay 50% escrow
- `POST /api/jobs/{id}/upload-payment-proof` - Upload cash proof
- `POST /api/accounts/deposit` - Deposit to wallet
- `GET /api/accounts/wallet-balance` - Get balance
- `GET /api/accounts/transactions` - Transaction history

## Acceptance Criteria
- [ ] Clients can pay 50% escrow via GCash
- [ ] Clients can choose cash payment and upload proof
- [ ] Clients can pay from wallet balance
- [ ] Payment status is tracked and displayed
- [ ] Job starts only after escrow is confirmed
- [ ] Workers see escrow payment confirmation
- [ ] Payment receipts are accessible
- [ ] Error handling for payment failures

## Dependencies
- **Requires:** Mobile Phase 1 - Job application system
- **Blocking:** Mobile Phase 2 - Job cannot progress without escrow

## Testing
- [ ] Test GCash payment flow with test credentials
- [ ] Test cash payment proof upload
- [ ] Test wallet payment with sufficient/insufficient balance
- [ ] Verify payment callback handling
- [ ] Test payment failure scenarios
- [ ] Verify escrow amount calculation accuracy

---
Generated with Claude Code
