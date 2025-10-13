# Two-Phase Payment **Payment Methods:**

- **Online Payment Options:**
  - Platform Wallet (recommended for instant processing)
  - GCash (direct integration)
  - Maya (formerly PayMaya)
  - Credit/Debit Card
  - Bank Transfer
- All online methods ensure security and automatic traceabilitystem Implementation

## Overview

The platform implements a 2-phase payment system to protect both clients and workers, ensuring commitment and fair compensation throughout the job lifecycle.

---

## Payment Flow

### Phase 1: Downpayment (50%)

**Trigger:** Both parties (client and worker) agree on the job terms

**Process:**

1. Client and worker negotiate and agree on job details and total price
2. System calculates 50% of the total job price as downpayment
3. Client pays 50% downpayment through the platform wallet
4. Payment is held in escrow by the platform
5. Worker is notified that downpayment is secured
6. Job status changes to "ACTIVE" or "IN_PROGRESS"

**Payment Method:**

- **Wallet Only** - Downpayment must be paid through the platform wallet to ensure security and traceability

**Business Rules:**

- Downpayment is mandatory before work begins
- Downpayment is non-refundable once worker starts the job
- If job is cancelled before work starts, downpayment can be refunded (minus platform fee)

---

### Phase 2: Final Payment (Remaining 50%)

**Trigger:** Both parties mark the job as completed

**Process:**

1. Worker completes the job and marks it as "COMPLETED" from their end
2. Client reviews the completed work
3. Client marks the job as "COMPLETED" from their end
4. **Both parties must confirm completion** for payment to proceed
5. Client selects payment method for the remaining 50%
6. Payment is processed based on selected method
7. Funds are released to worker's wallet (if online payment) or worker receives cash on-site

**Payment Methods:**

- **Option 1: Online Payment**
  - Platform Wallet (instant, recommended)
  - GCash (direct integration, instant)
  - Maya (formerly PayMaya)
  - Credit/Debit Card (Visa, Mastercard, etc.)
  - Bank Transfer (online banking)
  - Payment is instantly transferred to worker's wallet
  - Transaction is recorded in both parties' transaction history
  - Digital receipt is generated
  - All online payments are processed securely through payment gateway

- **Option 2: Cash Payment**
  - Client pays remaining 50% in cash directly to worker on-site
  - Worker confirms cash receipt in the app
  - Both parties acknowledge cash payment
  - Transaction is recorded as "CASH_PAYMENT" in system
  - No funds move through platform wallet for this portion

**Business Rules:**

- Final payment can only be initiated after both parties mark job as completed
- Client must select payment method before proceeding
- Cash payments require worker confirmation of receipt
- Platform service fee is deducted from total payment (typically from downpayment)

---

## Payment States

### Job Payment Status Flow

```
PENDING → DOWNPAYMENT_PAID → COMPLETED → FINAL_PAYMENT_PENDING → FULLY_PAID
```

**Status Definitions:**

- `PENDING`: Job created, awaiting agreement and downpayment
- `DOWNPAYMENT_PAID`: 50% paid, job in progress
- `COMPLETED`: Work finished, both parties confirmed completion
- `FINAL_PAYMENT_PENDING`: Awaiting final 50% payment
- `FULLY_PAID`: All payments completed (wallet or cash)

---

## Database Schema Requirements

### JobRequest/JobApplication Table Updates

```sql
-- Add payment tracking fields
ALTER TABLE job_requests ADD COLUMN payment_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE job_requests ADD COLUMN total_price DECIMAL(10, 2);
ALTER TABLE job_requests ADD COLUMN downpayment_amount DECIMAL(10, 2);
ALTER TABLE job_requests ADD COLUMN final_payment_amount DECIMAL(10, 2);
ALTER TABLE job_requests ADD COLUMN downpayment_method VARCHAR(20); -- 'WALLET', 'GCASH', 'MAYA', 'CARD', 'BANK_TRANSFER'
ALTER TABLE job_requests ADD COLUMN final_payment_method VARCHAR(20); -- 'WALLET', 'GCASH', 'MAYA', 'CARD', 'BANK_TRANSFER', 'CASH'
ALTER TABLE job_requests ADD COLUMN downpayment_paid_at TIMESTAMP;
ALTER TABLE job_requests ADD COLUMN final_payment_paid_at TIMESTAMP;
ALTER TABLE job_requests ADD COLUMN client_marked_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE job_requests ADD COLUMN worker_marked_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE job_requests ADD COLUMN client_marked_complete_at TIMESTAMP;
ALTER TABLE job_requests ADD COLUMN worker_marked_complete_at TIMESTAMP;
```

### Transaction History Table

```sql
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_requests(id),
    transaction_type VARCHAR(20), -- 'DOWNPAYMENT' or 'FINAL_PAYMENT'
    amount DECIMAL(10, 2),
    payment_method VARCHAR(20), -- 'WALLET', 'GCASH', 'MAYA', 'CARD', 'BANK_TRANSFER', 'CASH'
    payment_provider VARCHAR(50), -- 'PLATFORM_WALLET', 'GCASH_API', 'MAYA_API', 'STRIPE', 'PAYMONGO', etc.
    payer_id UUID REFERENCES accounts(id),
    receiver_id UUID REFERENCES accounts(id),
    status VARCHAR(20), -- 'COMPLETED', 'PENDING', 'FAILED'
    transaction_reference VARCHAR(100),
    external_transaction_id VARCHAR(100), -- Reference from GCash, Maya, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    notes TEXT
);
```

---

## API Endpoints Required

### 1. Agree on Job & Initiate Downpayment

```
POST /api/jobs/{job_id}/agree
```

**Request Body:**

```json
{
  "agreed_price": 5000.0,
  "client_id": "uuid",
  "worker_id": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "job_id": "uuid",
  "total_price": 5000.0,
  "downpayment_amount": 2500.0,
  "payment_status": "PENDING_DOWNPAYMENT",
  "payment_url": "/wallet/pay?job_id=uuid&amount=2500"
}
```

### 2. Process Downpayment

```
POST /api/payments/downpayment
```

**Request Body:**

```json
{
  "job_id": "uuid",
  "amount": 2500.0,
  "payment_method": "GCASH", // Options: "WALLET", "GCASH", "MAYA", "CARD", "BANK_TRANSFER"
  "payment_details": {
    "gcash_number": "09171234567", // If GCash
    "card_token": "tok_xyz123", // If Card
    "account_number": "1234567890" // If Bank Transfer
  }
}
```

**Response:**

```json
{
  "success": true,
  "transaction_id": "uuid",
  "payment_method": "GCASH",
  "external_transaction_id": "GCASH-TXN-123456",
  "job_status": "IN_PROGRESS",
  "remaining_balance": 2500.0
}
```

### 3. Mark Job as Completed (Worker)

```
POST /api/jobs/{job_id}/complete/worker
```

**Response:**

```json
{
  "success": true,
  "worker_marked_complete": true,
  "client_marked_complete": false,
  "awaiting_client_confirmation": true
}
```

### 4. Mark Job as Completed (Client)

```
POST /api/jobs/{job_id}/complete/client
```

**Response:**

```json
{
  "success": true,
  "worker_marked_complete": true,
  "client_marked_complete": true,
  "both_confirmed": true,
  "payment_status": "FINAL_PAYMENT_PENDING",
  "final_amount_due": 2500.0
}
```

### 5. Process Final Payment

```
POST /api/payments/final
```

**Request Body:**

```json
{
  "job_id": "uuid",
  "amount": 2500.0,
  "payment_method": "MAYA", // Options: "WALLET", "GCASH", "MAYA", "CARD", "BANK_TRANSFER", "CASH"
  "payment_details": {
    "maya_account": "09171234567"
  }
}
```

**Response (Online Payment):**

```json
{
  "success": true,
  "transaction_id": "uuid",
  "payment_method": "MAYA",
  "external_transaction_id": "MAYA-TXN-789012",
  "job_status": "FULLY_PAID",
  "funds_released_to_worker": true
}
```

**Response (Cash Payment):**

```json
{
  "success": true,
  "transaction_id": "uuid",
  "payment_method": "CASH",
  "job_status": "AWAITING_CASH_CONFIRMATION",
  "awaiting_worker_confirmation": true
}
```

### 6. Confirm Cash Receipt (Worker)

```
POST /api/payments/confirm-cash
```

**Request Body:**

```json
{
  "job_id": "uuid",
  "transaction_id": "uuid",
  "amount_received": 2500.0,
  "confirmation_notes": "Cash received in full"
}
```

**Response:**

```json
{
  "success": true,
  "job_status": "FULLY_PAID",
  "payment_confirmed": true
}
```

---

## Frontend User Flows

### Worker Flow

1. **Job Agreement Phase**
   - Receive job request from client
   - Negotiate terms and price
   - Accept job offer
   - Wait for client's 50% downpayment
   - Notification: "Downpayment received! You can start the job."

2. **Job Completion Phase**
   - Complete the work
   - Tap "Mark as Completed" button
   - Status: "Waiting for client to confirm completion"
   - Once client confirms, choose final payment method prompt appears for client

3. **Final Payment Reception**
   - If Wallet: Instant notification "You received ₱2,500 from [Client Name]"
   - If Cash: Confirm cash receipt in app after receiving physical cash

### Client Flow

1. **Job Agreement Phase**
   - Find and select worker
   - Agree on job terms and price
   - Pay 50% downpayment through wallet
   - Notification: "Downpayment sent! Worker will start soon."
   - View job status: "In Progress"

2. **Job Completion Phase**
   - Worker marks job as complete
   - Notification: "Worker has completed the job. Please review."
   - Review completed work
   - Tap "Mark as Completed" button
   - Payment method selection appears

3. **Final Payment**
   - **Option A: Pay Online (Wallet)**
     - Select "Pay with Wallet"
     - Review amount: ₱2,500 (remaining 50%)
     - Confirm payment
     - Funds instantly transferred to worker
     - Receipt generated

   - **Option B: Pay Cash**
     - Select "Pay with Cash"
     - Acknowledge: "I will pay ₱2,500 in cash to the worker"
     - Confirm cash payment intent
     - Pay worker in person
     - Worker confirms cash receipt in their app
     - Job marked as fully paid

---

## UI Components Needed

### 1. Payment Method Selection Modal

```tsx
// Client sees this after both parties mark job complete
<PaymentMethodModal>
  <h3>Final Payment: ₱2,500</h3>
  <p>Choose how you want to pay the remaining amount</p>

  <div className="online-methods">
    <h4>Pay Online (Instant)</h4>

    <button onClick={payWithWallet}>
      � Platform Wallet
      <span>Instant transfer • No fees</span>
    </button>

    <button onClick={payWithGCash}>
      📱 GCash
      <span>Direct payment • 2% fee</span>
    </button>

    <button onClick={payWithMaya}>
      💳 Maya
      <span>Fast payment • 2% fee</span>
    </button>

    <button onClick={payWithCard}>
      💳 Credit/Debit Card
      <span>Visa, Mastercard • 3% fee</span>
    </button>

    <button onClick={payWithBank}>
      🏦 Bank Transfer
      <span>Online banking • No fees</span>
    </button>
  </div>

  <div className="cash-method">
    <h4>Pay in Person</h4>
    <button onClick={payWithCash}>
      💵 Pay with Cash
      <span>Pay worker directly</span>
    </button>
  </div>
</PaymentMethodModal>
```

### 2. Cash Payment Confirmation (Worker Side)

```tsx
<CashConfirmationModal>
  <h3>Confirm Cash Receipt</h3>
  <p>Client: {clientName}</p>
  <p>Amount: ₱2,500</p>
  <p>Have you received the cash payment?</p>

  <button onClick={confirmCashReceipt}>✓ Yes, I received the cash</button>
  <button onClick={reportIssue}>⚠️ Report Issue</button>
</CashConfirmationModal>
```

### 3. Job Completion Tracker

```tsx
<CompletionTracker>
  <div>
    <CheckIcon checked={workerMarkedComplete} />
    <span>Worker marked complete</span>
  </div>
  <div>
    <CheckIcon checked={clientMarkedComplete} />
    <span>Client marked complete</span>
  </div>
  {bothComplete && (
    <div className="payment-pending">
      <span>Awaiting final payment</span>
    </div>
  )}
</CompletionTracker>
```

### 4. Job Details Payment Information Display

```tsx
// Display in job details modal/page
<PaymentInfoCard>
  <h4>💳 Payment Information</h4>

  {/* Payment Status Badge */}
  <div>
    <span>Status:</span>
    <Badge status={paymentStatus}>
      {paymentStatus === "FULLY_PAID"
        ? "Fully Paid"
        : paymentStatus === "DOWNPAYMENT_PAID"
          ? "Downpayment Paid"
          : "Pending"}
    </Badge>
  </div>

  {/* Total Amount */}
  <div>
    <span>Total Amount:</span>
    <span>₱5,000</span>
  </div>

  {/* Downpayment Details */}
  <div className="border-t">
    <span>Downpayment (50%):</span>
    <span>₱2,500</span>
    <PaymentMethodBadge method="GCASH">🔵 Paid via GCash</PaymentMethodBadge>
  </div>

  {/* Final Payment Details (if paid) */}
  <div className="border-t">
    <span>Final Payment (50%):</span>
    <span>₱2,500</span>
    <PaymentMethodBadge method="MAYA">🔵 Paid via Maya</PaymentMethodBadge>
    {/* OR */}
    <PaymentMethodBadge method="CASH">🟢 Paid in Cash</PaymentMethodBadge>
  </div>
</PaymentInfoCard>
```

**Payment Method Display Labels:**

- Wallet: "💰 Paid via Wallet"
- GCash: "📱 Paid via GCash"
- Maya: "💳 Paid via Maya"
- Card: "💳 Paid via Card"
- Bank Transfer: "🏦 Paid via Bank Transfer"
- Cash: "💵 Paid in Cash"

---

## Security & Edge Cases

### Escrow Protection

- Downpayment held in platform escrow until job completion
- Prevents worker non-performance
- Protects client's funds

### Dispute Resolution

- If parties disagree on completion:
  - Job enters "DISPUTE" status
  - Admin review required
  - Evidence submission system
  - Mediation process

### Cash Payment Verification

- Worker must confirm cash receipt within 48 hours
- If worker doesn't confirm, client can provide proof
- System sends reminders to worker
- After 7 days, admin review if still unconfirmed

### Refund Scenarios

- **Before work starts:** Full downpayment refund minus platform fee (5%)
- **After work starts:** Dispute resolution required
- **Partial completion:** Pro-rated payment based on admin decision

### Timeout Handling

- **Downpayment not paid within 48h:** Job auto-cancelled
- **Worker doesn't start within 7 days:** Client can request refund
- **Job not completed within agreed timeframe:** Either party can initiate dispute

---

## Platform Fees

### Fee Structure

- **Platform Service Fee:** 10% of total job price
- **Deducted from:** Downpayment (worker receives 45% of total, not 50%)
- **Payment Processing Fee:** 2% for wallet transactions (absorbed by platform)

### Example Calculation

- **Total Job Price:** ₱5,000
- **Client Pays Downpayment:** ₱2,500 (50%)
- **Platform Fee (10%):** ₱500
- **Worker Receives (Downpayment):** ₱2,000 (40% of total)
- **Client Pays Final:** ₱2,500 (50%)
- **Worker Receives (Final):** ₱2,500 (50% of total)
- **Worker Total Earnings:** ₱4,500 (90% of ₱5,000)

---

## Notifications

### Payment-Related Notifications

**Client:**

- "Please pay ₱2,500 downpayment to start the job"
- "Downpayment sent successfully"
- "Worker has completed the job. Please review and confirm."
- "Choose your payment method for final payment"
- "Final payment sent successfully" (Wallet)
- "Cash payment acknowledged. Thank you!" (Cash)

**Worker:**

- "Client has paid ₱2,500 downpayment. You can start the job!"
- "You completed the job. Waiting for client confirmation."
- "Job completed! Client will choose payment method."
- "You received ₱2,500 from [Client Name]" (Wallet)
- "Please confirm cash receipt of ₱2,500" (Cash)
- "Cash payment confirmed. Job fully paid!"

---

## Implementation Priority

### Phase 1 (MVP)

1. ✅ Basic job agreement system
2. ✅ 50% downpayment through wallet
3. ✅ Dual completion confirmation
4. ✅ Final wallet payment option
5. ✅ Transaction history

### Phase 2

1. Cash payment option
2. Cash confirmation system
3. Payment method selection UI
4. Enhanced transaction tracking

### Phase 3

1. Dispute resolution system
2. Escrow management
3. Automated refunds
4. Advanced reporting

---

## Related Documentation

- `WALLET_IMPLEMENTATION.md` - Wallet system details
- `AUTHENTICATION_CHANGES_SUMMARY.md` - User authentication flow
- `KYC_IMAGE_RENDERING_SUMMARY.md` - KYC verification process

---

**Last Updated:** October 12, 2025  
**Status:** Planning Phase  
**Next Steps:** Backend API implementation for payment processing
