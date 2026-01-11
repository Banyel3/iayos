# Module 2: Payment System Implementation

**Priority**: Critical (Blocking Job Workflow)  
**Duration**: 2-3 weeks  
**Dependencies**: Module 1 (Job Workflows)  
**Files**: ~12 new/modified

---

## Overview

Implement complete escrow and final payment system matching React Native mobile app. This module handles the 50%+50% payment split with 5% platform fee added ON TOP of each payment (worker receives 100% of listing, client pays 105% total).

**RN Source Files**:

- `app/payments/method.tsx` - Payment method selection
- `app/payments/gcash.tsx` - GCash payment via Xendit
- `app/payments/wallet.tsx` - Wallet payment
- `app/payments/cash.tsx` - Cash proof upload
- `app/payments/status.tsx` - Payment status tracking
- `app/payments/deposit.tsx` - Wallet deposit
- `app/payments/history.tsx` - Transaction history

---

## 2.1 Payment Fee Calculation (CRITICAL)

### Platform Fee Structure

**⚠️ VERIFIED FROM RN APP** - Worker receives 100% of listing, client pays platform fee ON TOP:

```typescript
// Job Listing Budget: ₱10,000 (what worker will receive total)
const jobBudget = 10000;

// ESCROW PAYMENT (50% to worker)
const halfBudget = jobBudget * 0.5; // ₱5,000 to worker
const platformFee = halfBudget * 0.05; // ₱250 (5% of escrow = 2.5% of total)
const totalToCharge = halfBudget + platformFee; // ₱5,250 client pays

// FINAL PAYMENT (50% to worker)
const halfBudget2 = jobBudget * 0.5; // ₱5,000 to worker
const platformFee2 = halfBudget2 * 0.05; // ₱250 (5% of final = 2.5% of total)
const totalToCharge2 = halfBudget2 + platformFee2; // ₱5,250 client pays

// TOTALS
const workerReceivesTotal = jobBudget; // ₱10,000 (100% of listing)
const platformFeesTotal = platformFee + platformFee2; // ₱500 (5% of listing)
const clientPaysTotal = totalToCharge + totalToCharge2; // ₱10,500 (105% of listing)
```

**Source**: `apps/frontend_mobile/iayos_mobile/lib/hooks/usePayments.ts` lines 275-289

**Payment Breakdown Component**:

```typescript
<PaymentBreakdown jobBudget={10000} phase="escrow">
  <Row>
    <Label>Job Listing Price</Label>
    <Amount>₱10,000</Amount>
  </Row>
  <Row>
    <Label>Escrow Amount (50% to worker)</Label>
    <Amount>₱5,000</Amount>
  </Row>
  <Row variant="warning">
    <Label>Platform Fee (5% of escrow)</Label>
    <Amount>+₱250</Amount>
  </Row>
  <Divider />
  <Row variant="success">
    <Label>Worker Receives</Label>
    <Amount>₱5,000</Amount>
  </Row>
  <Row variant="primary" className="font-bold text-lg">
    <Label>You Pay Now</Label>
    <Amount>₱5,250</Amount>
  </Row>
  <InfoText className="mt-2 text-sm text-gray-600">
    💡 Worker receives full listing price. Platform fee is added to your cost.
  </InfoText>
</PaymentBreakdown>
```

### Backend Validation

**ALL payment endpoints MUST use this formula** (from `apps/backend/src/jobs/api.py` lines 108-114):

```python
# Backend validation (Python) - matches RN app
downpayment = Decimal(str(budget)) * Decimal('0.5')  # 50% to worker
platform_fee = downpayment * Decimal('0.05')  # 5% of downpayment (2.5% of total)
total_to_charge = downpayment + platform_fee  # What client pays

# Save to database
payment = EscrowPayment.objects.create(
    job=job,
    amount_paid=downpayment,          # ₱5,000 (what worker gets)
    platform_fee=platform_fee,        # ₱250 (what platform takes)
    total_charged=total_to_charge,    # ₱5,250 (what client pays)
    payment_method=payment_method,
)

# CRITICAL: Worker receives downpayment (₱5,000), client pays total_to_charge (₱5,250)
```

---

## 2.2 Wallet Management

### Files to Create

```
app/dashboard/wallet/page.tsx (NEW - 450 lines)
app/dashboard/wallet/deposit/page.tsx (NEW - 380 lines)
app/dashboard/wallet/transactions/page.tsx (NEW - 420 lines)
components/wallet/WalletCard.tsx (NEW - 200 lines)
components/wallet/TransactionCard.tsx (NEW - 150 lines)
lib/hooks/useWallet.ts (NEW - 180 lines)
```

### Features

#### Wallet Overview Page

**Balance Display**:

```typescript
<WalletCard>
  <BalanceSection>
    <Label>Available Balance</Label>
    <Balance className="text-4xl font-bold">
      ₱{formatNumber(walletBalance)}
    </Balance>
    <LastUpdated>{formatRelativeTime(lastUpdated)}</LastUpdated>
  </BalanceSection>

  <QuickActions>
    <DepositButton href="/dashboard/wallet/deposit" />
    <WithdrawButton href="/dashboard/wallet/withdraw" />
    <TransactionsButton href="/dashboard/wallet/transactions" />
  </QuickActions>

  <PendingTransactions count={pendingCount}>
    <Alert variant="info">
      You have {pendingCount} pending transaction(s)
    </Alert>
  </PendingTransactions>
</WalletCard>
```

**Recent Transactions Widget**:

```typescript
<RecentTransactions limit={5}>
  <Header>
    <Title>Recent Activity</Title>
    <ViewAllLink href="/dashboard/wallet/transactions" />
  </Header>

  <TransactionList>
    {transactions.map(tx => (
      <TransactionCard key={tx.id}>
        <Icon type={tx.type} />
        <Info>
          <Description>{tx.description}</Description>
          <Date>{formatRelativeTime(tx.createdAt)}</Date>
        </Info>
        <Amount variant={tx.type === 'CREDIT' ? 'success' : 'danger'}>
          {tx.type === 'CREDIT' ? '+' : '-'}₱{formatNumber(tx.amount)}
        </Amount>
        <StatusBadge status={tx.status} />
      </TransactionCard>
    ))}
  </TransactionList>
</RecentTransactions>
```

#### API Endpoints

**Get Wallet Balance**:

```typescript
GET / api / accounts / wallet / balance;

Response: {
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_spent: number;
  last_updated: string;
}
```

**Get Recent Transactions**:

```typescript
GET /api/accounts/wallet/transactions?limit=5

Response:
{
  transactions: Array<{
    id: number;
    type: "CREDIT" | "DEBIT";
    amount: number;
    description: string;
    status: "COMPLETED" | "PENDING" | "FAILED";
    created_at: string;
  }>;
  total: number;
}
```

### Wallet Deposit

**Deposit Page Features**:

- [ ] Preset amounts (₱100, ₱500, ₱1000, ₱2000, ₱5000)
- [ ] Custom amount input (₱100 - ₱100,000)
- [ ] Amount validation
- [ ] Payment method selection (GCash only)
- [ ] Xendit invoice creation
- [ ] WebView redirect for payment

**Preset Amount Buttons**:

```typescript
<PresetAmounts>
  {[100, 500, 1000, 2000, 5000].map(amount => (
    <PresetButton
      key={amount}
      active={selectedAmount === amount}
      onClick={() => setSelectedAmount(amount)}
    >
      ₱{formatNumber(amount)}
    </PresetButton>
  ))}
</PresetAmounts>

<CustomAmountInput>
  <Label>Custom Amount</Label>
  <Input
    type="number"
    min={100}
    max={100000}
    value={customAmount}
    onChange={e => setCustomAmount(e.target.value)}
    placeholder="Enter amount (₱100 - ₱100,000)"
  />
</CustomAmountInput>
```

**Validation**:

```typescript
const validateDepositAmount = (amount: number) => {
  if (amount < 100) {
    return { error: "Minimum deposit is ₱100" };
  }
  if (amount > 100000) {
    return { error: "Maximum deposit is ₱100,000" };
  }
  if (amount % 1 !== 0) {
    return { error: "Amount must be a whole number" };
  }
  return { valid: true };
};
```

**API Endpoint**:

```typescript
POST / api / accounts / wallet / deposit;
{
  amount: number;
  payment_method: "GCASH"; // Only GCash for deposits
}

Response: {
  success: true;
  deposit_id: number;
  amount: number;
  invoice_url: string; // Xendit payment URL
}
```

**Flow**:

1. User selects/enters amount
2. Validates amount (₱100-₱100,000)
3. Clicks "Deposit via GCash"
4. API creates Xendit invoice
5. Redirects to Xendit payment page (WebView)
6. After payment: Xendit webhook updates balance
7. Redirect back to wallet page
8. Show success toast + updated balance

---

## 2.3 Escrow Payment (50% Downpayment)

### Files to Create

```
app/dashboard/payments/escrow/[jobId]/page.tsx (NEW - 520 lines)
components/payments/PaymentMethodSelector.tsx (NEW - 280 lines)
components/payments/PaymentSummaryCard.tsx (NEW - 200 lines)
components/payments/WalletBalanceCard.tsx (NEW - 150 lines)
lib/hooks/usePayments.ts (NEW - 250 lines)
```

### Features

#### Payment Method Selection

**When Triggered**:

- INVITE job created → immediate redirect to escrow payment
- LISTING job application accepted → redirect to escrow payment

**Payment Methods**:

1. **Wallet** - Instant payment if sufficient balance
2. **GCash** - Via Xendit invoice
3. **Cash** - Upload proof of payment (admin verification)

**Method Selector**:

```typescript
<PaymentMethodSelector
  required={escrowAmount}
  walletBalance={walletBalance}
  onSelect={setPaymentMethod}
>
  <WalletOption>
    <Radio checked={method === 'WALLET'} />
    <Icon>💳</Icon>
    <Label>Wallet Balance</Label>
    <Balance>₱{formatNumber(walletBalance)}</Balance>
    {walletBalance < escrowAmount && (
      <Badge variant="warning">Insufficient Balance</Badge>
    )}
  </WalletOption>

  <GCashOption>
    <Radio checked={method === 'GCASH'} />
    <Icon>📱</Icon>
    <Label>GCash via Xendit</Label>
    <Description>Instant payment, secure</Description>
  </GCashOption>

  <CashOption>
    <Radio checked={method === 'CASH'} />
    <Icon>💵</Icon>
    <Label>Cash Payment</Label>
    <Description>Upload proof, admin verifies (1-2 days)</Description>
    <Badge variant="warning">Slower</Badge>
  </CashOption>
</PaymentMethodSelector>
```

#### Payment Summary Card

```typescript
<PaymentSummaryCard jobId={jobId}>
  <JobInfo>
    <JobTitle>{job.title}</JobTitle>
    <JobCategory>{job.category}</JobCategory>
    <WorkerName>
      Hired: {job.assignedWorker.name}
    </WorkerName>
  </JobInfo>

  <PaymentBreakdown>
    <Row>
      <Label>Job Listing Price</Label>
      <Amount>₱{formatNumber(job.budget)}</Amount>
    </Row>
    <Row highlight>
      <Label>Escrow Payment (50% to worker)</Label>
      <Amount>₱{formatNumber(job.budget * 0.50)}</Amount>
    </Row>
    <Row variant="warning">
      <Label>Platform Fee (5% of escrow)</Label>
      <Amount>+₱{formatNumber(job.budget * 0.50 * 0.05)}</Amount>
    </Row>
    <Row variant="success">
      <Label>Worker Receives</Label>
      <Amount>₱{formatNumber(job.budget * 0.50)}</Amount>
    </Row>
    <Divider />
    <Row variant="primary" className="text-xl font-bold">
      <Label>You Pay Now</Label>
      <Amount>₱{formatNumber(job.budget * 0.50 * 1.05)}</Amount>
    </Row>
  </PaymentBreakdown>

  <InfoAlert>
    <Icon>ℹ️</Icon>
    <Text>
      The remaining 50% (₱{formatNumber(job.budget * 0.50)}) will be paid
      upon job completion.
    </Text>
  </InfoAlert>
</PaymentSummaryCard>
```

#### Wallet Payment Flow

**Page**: `/dashboard/payments/escrow/[jobId]?method=wallet`

**Features**:

- [ ] Check sufficient balance before showing
- [ ] Display remaining balance after payment
- [ ] Confirmation dialog with breakdown
- [ ] Instant processing (no waiting)
- [ ] Auto-redirect to job page after success

**Confirmation Modal**:

```typescript
<WalletPaymentConfirmation>
  <Header>Confirm Wallet Payment</Header>

  <CurrentBalance>
    <Label>Current Balance</Label>
    <Amount>₱{formatNumber(walletBalance)}</Amount>
  </CurrentBalance>

  <PaymentAmount>
    <Label>Payment Amount</Label>
    <Amount variant="danger">-₱{formatNumber(escrowAmount)}</Amount>
  </PaymentAmount>

  <Divider />

  <RemainingBalance>
    <Label>Remaining Balance</Label>
    <Amount variant={remaining >= 0 ? 'success' : 'danger'}>
      ₱{formatNumber(walletBalance - escrowAmount)}
    </Amount>
  </RemainingBalance>

  <Actions>
    <CancelButton onClick={onClose} />
    <ConfirmButton
      onClick={handleWalletPayment}
      disabled={walletBalance < escrowAmount}
    >
      Confirm Payment
    </ConfirmButton>
  </Actions>
</WalletPaymentConfirmation>
```

**API Endpoint**:

```typescript
POST / api / mobile / payments / escrow;
{
  job_id: number;
  payment_method: "WALLET";
}

Response: {
  success: true;
  payment_id: number;
  amount_paid: number; // What worker receives (\u20b15,000)
  platform_fee: number; // \u20b1250 (2.5% of listing)
  total_charged: number; // What client pays (\u20b15,250)
  wallet_balance: number; // Updated balance (deducted \u20b15,250)
  message: "Payment successful. Job is now in progress.";
}
```

**Flow**:

1. User clicks "Pay with Wallet"
2. Check balance >= escrowAmount
3. Show confirmation modal
4. User confirms
5. API deducts from wallet
6. Creates EscrowPayment record
7. Updates Job status to IN_PROGRESS
8. Sends notification to worker
9. Toast success + redirect to job page

#### GCash Payment Flow (Xendit)

**Page**: `/dashboard/payments/escrow/[jobId]?method=gcash`

**Features**:

- [ ] Create Xendit invoice via API
- [ ] Redirect to Xendit payment page
- [ ] Handle payment callback (success/failure)
- [ ] Display payment status
- [ ] Auto-redirect on success

**Flow**:

1. User clicks "Pay with GCash"
2. API creates Xendit invoice
3. Receives `invoice_url`
4. Redirect to Xendit payment page (or open in WebView)
5. User completes payment in GCash
6. Xendit webhook notifies backend
7. Backend updates payment status
8. User redirected back to status page
9. Show success + redirect to job page

**API Endpoints**:

```typescript
POST / api / mobile / payments / xendit / invoice;
{
  job_id: number;
  amount: number;
  description: string;
  payment_type: "ESCROW" | "FINAL";
}

Response: {
  success: true;
  invoice_id: string;
  invoice_url: string; // Redirect here
  expires_at: string;
}

// Xendit Webhook (backend handles)
POST / api / payments / xendit / callback;
{
  id: string; // invoice_id
  external_id: string; // payment_id
  status: "PAID" | "EXPIRED" | "FAILED";
  amount: number;
  paid_at: string;
}
```

**Payment Status Page**:

```typescript
<PaymentStatus paymentId={paymentId}>
  <StatusIcon status={payment.status}>
    {status === 'PENDING' && <Spinner />}
    {status === 'COMPLETED' && <CheckCircle />}
    {status === 'FAILED' && <XCircle />}
  </StatusIcon>

  <StatusMessage>
    {status === 'PENDING' && 'Processing your payment...'}
    {status === 'COMPLETED' && 'Payment successful!'}
    {status === 'FAILED' && 'Payment failed. Please try again.'}
  </StatusMessage>

  <PaymentDetails>
    <Row>
      <Label>Payment ID</Label>
      <Value>{payment.id}</Value>
    </Row>
    <Row>
      <Label>Amount</Label>
      <Value>₱{formatNumber(payment.amount)}</Value>
    </Row>
    <Row>
      <Label>Method</Label>
      <Value>{payment.method}</Value>
    </Row>
    <Row>
      <Label>Status</Label>
      <StatusBadge status={payment.status} />
    </Row>
  </PaymentDetails>

  <Actions>
    {status === 'COMPLETED' && (
      <ViewJobButton href={`/dashboard/jobs/${jobId}`} />
    )}
    {status === 'FAILED' && (
      <RetryButton onClick={handleRetry} />
    )}
  </Actions>
</PaymentStatus>
```

#### Cash Payment Flow

**Page**: `/dashboard/payments/escrow/[jobId]?method=cash`

**Features**:

- [ ] Upload proof of payment image
- [ ] Show payment instructions
- [ ] Status tracking (verifying → approved/rejected)
- [ ] Admin verification workflow

**Upload Form**:

```typescript
<CashPaymentForm>
  <Instructions>
    <Title>How to Pay with Cash</Title>
    <Steps>
      <Step>1. Prepare ₱{formatNumber(escrowAmount)} in cash</Step>
      <Step>2. Visit our office or authorized partner</Step>
      <Step>3. Receive payment receipt</Step>
      <Step>4. Take a clear photo of the receipt</Step>
      <Step>5. Upload below</Step>
    </Steps>
  </Instructions>

  <ImageUpload>
    <Label>Upload Receipt Photo</Label>
    {!proofImage ? (
      <UploadZone onClick={handleSelectImage}>
        <Icon>📷</Icon>
        <Text>Click to select receipt image</Text>
        <Requirements>
          Max 5MB, JPG/PNG only
        </Requirements>
      </UploadZone>
    ) : (
      <ImagePreview>
        <Image src={proofImage} />
        <RemoveButton onClick={() => setProofImage(null)} />
      </ImagePreview>
    )}
  </ImageUpload>

  <NotesInput>
    <Label>Additional Notes (Optional)</Label>
    <Textarea
      placeholder="Reference number, payment location, etc."
      value={notes}
      onChange={e => setNotes(e.target.value)}
    />
  </NotesInput>

  <SubmitButton
    disabled={!proofImage}
    onClick={handleSubmitCashProof}
  >
    Submit for Verification
  </SubmitButton>
</CashPaymentForm>
```

**API Endpoint**:

```typescript
POST /api/mobile/payments/cash-proof
{
  job_id: number;
  proof_image: File;
  notes?: string;
}

Response:
{
  success: true;
  payment_id: number;
  status: "VERIFYING";
  message: "Receipt uploaded. Admin will verify within 24-48 hours.";
}
```

**Admin Verification** (separate admin panel feature):

- Admin reviews uploaded receipt
- Can approve (status → COMPLETED) or reject (status → FAILED)
- Worker notified when verified
- Job moves to IN_PROGRESS on approval

---

## 2.4 Final Payment (50% Completion)

### Files to Create

```
app/dashboard/payments/final/[jobId]/page.tsx (NEW - 480 lines)
components/payments/FinalPaymentConfirmation.tsx (NEW - 250 lines)
```

### Features

#### Final Payment Trigger

**When**: Client approves job completion (worker marked complete)

**Page**: `/dashboard/payments/final/[jobId]`

**Pre-conditions**:

- Job status = IN_PROGRESS
- Worker marked complete = true
- Escrow payment completed
- Client has NOT yet approved completion

**Final Payment Summary**:

```typescript
<FinalPaymentSummary jobId={jobId}>
  <JobInfo>
    <JobTitle>{job.title}</JobTitle>
    <WorkerInfo>
      <Avatar src={job.assignedWorker.avatar} />
      <Name>{job.assignedWorker.name}</Name>
      <Rating value={job.assignedWorker.rating} />
    </WorkerInfo>
    <CompletionInfo>
      <Icon>✅</Icon>
      <Text>{job.assignedWorker.name} marked this job as complete</Text>
      <Date>{formatRelativeTime(job.workerMarkedCompleteAt)}</Date>
    </CompletionInfo>
  </JobInfo>

  <PaymentHistory>
    <Title>Payment History</Title>
    <Row variant="success">
      <Label>Escrow Payment (Paid)</Label>
      <Amount>₱{formatNumber(job.budget * 0.50)}</Amount>
      <Date>{formatDate(escrowPayment.createdAt)}</Date>
    </Row>
  </PaymentHistory>

  <FinalPaymentBreakdown>
    <Title>Final Payment</Title>
    <Row>
      <Label>Final Amount (50% to worker)</Label>
      <Amount>₱{formatNumber(job.budget * 0.50)}</Amount>
    </Row>
    <Row variant="warning">
      <Label>Platform Fee (5% of final)</Label>
      <Amount>+₱{formatNumber(job.budget * 0.50 * 0.05)}</Amount>
    </Row>
    <Row variant="success">
      <Label>Worker Receives</Label>
      <Amount>₱{formatNumber(job.budget * 0.50)}</Amount>
    </Row>
    <Divider />
    <Row variant="primary" className="text-xl font-bold">
      <Label>You Pay Now</Label>
      <Amount>₱{formatNumber(job.budget * 0.50 * 1.05)}</Amount>
    </Row>
  </FinalPaymentBreakdown>

  <TotalEarnings variant="info">
    <Icon>💰</Icon>
    <Text>
      {job.assignedWorker.name} will receive the full listing price of
      ₱{formatNumber(job.budget)} for this job (platform fee is your burden)
    </Text>
  </TotalEarnings>
</FinalPaymentSummary>
```

#### Payment Method Selection (Final)

**Same 3 options as escrow**:

- Wallet (instant)
- GCash (Xendit)
- Cash (proof upload + verification)

**Flow is identical to escrow payment, but**:

- Different API endpoint
- Updates job status to COMPLETED
- Triggers review prompts for both parties
- Releases payment to worker's wallet

**API Endpoint**:

```typescript
POST /api/jobs/{job_id}/approve-completion
{
  payment_method: "WALLET" | "GCASH" | "CASH";
  cash_proof_image?: File; // If CASH
}

Response:
{
  success: true;
  job_id: number;
  status: "COMPLETED";
  payment_id: number;
  amount_paid: number;        // What worker receives (₱5,000)
  platform_fee: number;       // What platform takes (₱250)
  total_charged: number;      // What client pays (₱5,250)
  total_worker_earnings: number; // ₱10,000 (full listing price)
  prompt_review: true;
  invoice_url?: string; // If GCash
}
```

**Success Flow**:

1. Payment processed
2. Job status → COMPLETED
3. Worker receives final payment to wallet
4. Both parties redirected to review submission page
5. Toast: "Job completed! Please leave a review."

---

## 2.5 Worker Earnings Dashboard

### Files to Create

```
app/dashboard/earnings/page.tsx (NEW - 480 lines)
components/earnings/EarningsCard.tsx (NEW - 200 lines)
components/earnings/EarningsChart.tsx (NEW - 250 lines)
components/earnings/JobEarningsList.tsx (NEW - 180 lines)
```

### Features (WORKER SIDE)

#### Earnings Overview

**Stats Cards**:

```typescript
<EarningsOverview>
  <StatCard variant="success">
    <Icon>💰</Icon>
    <Label>Total Earnings</Label>
    <Value>₱{formatNumber(totalEarnings)}</Value>
    <SubText>All time</SubText>
  </StatCard>

  <StatCard variant="primary">
    <Icon>🔄</Icon>
    <Label>Pending Earnings</Label>
    <Value>₱{formatNumber(pendingEarnings)}</Value>
    <SubText>From {pendingJobs} jobs in progress</SubText>
  </StatCard>

  <StatCard variant="info">
    <Icon>📈</Icon>
    <Label>This Month</Label>
    <Value>₱{formatNumber(monthlyEarnings)}</Value>
    <SubText>{completedThisMonth} jobs completed</SubText>
  </StatCard>

  <StatCard variant="warning">
    <Icon>📊</Icon>
    <Label>Average per Job</Label>
    <Value>₱{formatNumber(averageEarnings)}</Value>
    <SubText>Based on {totalJobs} jobs</SubText>
  </StatCard>
</EarningsOverview>
```

#### Earnings Chart

**Monthly Breakdown**:

```typescript
<EarningsChart>
  <Header>
    <Title>Earnings Trend</Title>
    <PeriodSelector
      value={period}
      options={['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Last Year']}
      onChange={setPeriod}
    />
  </Header>

  <BarChart data={earningsData}>
    {/* Shows earnings per period with bar chart */}
  </BarChart>

  <Legend>
    <Item color="success">Completed Jobs</Item>
    <Item color="warning">Platform Fees Deducted</Item>
  </Legend>
</EarningsChart>
```

#### Job Earnings List

**Completed Jobs with Earnings**:

```typescript
<JobEarningsList>
  <Header>
    <Title>Recent Earnings</Title>
    <FilterDropdown
      options={['All', 'This Week', 'This Month', 'This Year']}
      value={filter}
      onChange={setFilter}
    />
  </Header>

  <EarningsList>
    {jobs.map(job => (
      <JobEarningCard key={job.id}>
        <JobInfo>
          <JobTitle>{job.title}</JobTitle>
          <ClientName>{job.client.name}</ClientName>
          <CompletedDate>{formatDate(job.completedAt)}</CompletedDate>
        </JobInfo>

        <EarningsBreakdown>
          <Row>
            <Label>Job Budget</Label>
            <Amount>₱{formatNumber(job.budget)}</Amount>
          </Row>
          <Row variant="danger">
            <Label>Platform Fees (5% × 2)</Label>
            <Amount>-₱{formatNumber(job.budget * 0.10)}</Amount>
          </Row>
          <Row variant="success" className="font-bold">
            <Label>You Earned</Label>
            <Amount>₱{formatNumber(job.budget * 0.90)}</Amount>
          </Row>
        </EarningsBreakdown>

        <ViewJobButton href={`/dashboard/jobs/${job.id}`} />
      </JobEarningCard>
    ))}
  </EarningsList>
</JobEarningsList>
```

#### API Endpoints

**Get Worker Earnings**:

```typescript
GET / api / mobile / workers / earnings;

Response: {
  total_earnings: number;
  pending_earnings: number;
  monthly_earnings: number;
  average_earnings: number;
  total_jobs: number;
  completed_this_month: number;
  pending_jobs: number;
}
```

**Get Earnings History**:

```typescript
GET /api/mobile/workers/earnings/history?period=last_30_days

Response:
{
  earnings: Array<{
    job_id: number;
    job_title: string;
    client_name: string;
    budget: number;
    platform_fees: number;
    worker_earned: number;
    completed_at: string;
  }>;
  chart_data: Array<{
    date: string;
    amount: number;
  }>;
}
```

---

## 2.6 Payment History & Tracking

### Files to Create

```
app/dashboard/payments/history/page.tsx (NEW - 400 lines)
components/payments/PaymentHistoryCard.tsx (NEW - 180 lines)
```

### Features (CLIENT + WORKER SIDE)

#### Client Payment History

**View**:

```typescript
<PaymentHistory role="client">
  <Header>
    <Title>Payment History</Title>
    <FilterTabs>
      <Tab active={filter === 'all'} onClick={() => setFilter('all')}>
        All
      </Tab>
      <Tab active={filter === 'escrow'} onClick={() => setFilter('escrow')}>
        Escrow Payments
      </Tab>
      <Tab active={filter === 'final'} onClick={() => setFilter('final')}>
        Final Payments
      </Tab>
    </FilterTabs>
  </Header>

  <PaymentList>
    {payments.map(payment => (
      <PaymentCard key={payment.id}>
        <PaymentInfo>
          <JobTitle>{payment.job.title}</JobTitle>
          <WorkerName>Paid to: {payment.worker.name}</WorkerName>
          <PaymentType badge>
            {payment.type === 'ESCROW' ? 'Escrow (50%)' : 'Final (50%)'}
          </PaymentType>
        </PaymentInfo>

        <PaymentDetails>
          <Row>
            <Label>Amount Paid</Label>
            <Amount>₱{formatNumber(payment.amount)}</Amount>
          </Row>
          <Row variant="muted">
            <Label>Platform Fee</Label>
            <Amount>₱{formatNumber(payment.platformFee)}</Amount>
          </Row>
          <Row>
            <Label>Payment Method</Label>
            <Badge>{payment.method}</Badge>
          </Row>
          <Row>
            <Label>Date</Label>
            <Date>{formatDateTime(payment.createdAt)}</Date>
          </Row>
        </PaymentDetails>

        <StatusBadge status={payment.status} />

        <ViewJobButton href={`/dashboard/jobs/${payment.jobId}`} />
      </PaymentCard>
    ))}
  </PaymentList>
</PaymentHistory>
```

#### Worker Payment History

**View** (Worker receives payments):

```typescript
<PaymentHistory role="worker">
  <Header>
    <Title>Received Payments</Title>
    <TotalReceived>
      Total: ₱{formatNumber(totalReceived)}
    </TotalReceived>
  </Header>

  <PaymentList>
    {payments.map(payment => (
      <PaymentCard key={payment.id} variant="success">
        <PaymentInfo>
          <JobTitle>{payment.job.title}</JobTitle>
          <ClientName>From: {payment.client.name}</ClientName>
          <PaymentType badge variant="success">
            {payment.type === 'ESCROW' ? 'Escrow Received' : 'Final Payment Received'}
          </PaymentType>
        </PaymentInfo>

        <EarningsDetails>
          <Row>
            <Label>Payment Amount</Label>
            <Amount>₱{formatNumber(payment.grossAmount)}</Amount>
          </Row>
          <Row variant="danger">
            <Label>Platform Fee (5%)</Label>
            <Amount>-₱{formatNumber(payment.platformFee)}</Amount>
          </Row>
          <Row variant="success" className="font-bold">
            <Label>You Received</Label>
            <Amount>₱{formatNumber(payment.netAmount)}</Amount>
          </Row>
          <Row>
            <Label>Date</Label>
            <Date>{formatDateTime(payment.createdAt)}</Date>
          </Row>
        </EarningsDetails>

        <ViewJobButton href={`/dashboard/jobs/${payment.jobId}`} />
      </PaymentCard>
    ))}
  </PaymentList>
</PaymentHistory>
```

#### API Endpoints

**Client Payment History**:

```typescript
GET /api/mobile/payments/history?role=client&type=all

Response:
{
  payments: Array<{
    id: number;
    job_id: number;
    job_title: string;
    worker_name: string;
    type: "ESCROW" | "FINAL";
    amount: number;
    platform_fee: number;
    method: "WALLET" | "GCASH" | "CASH";
    status: "COMPLETED" | "PENDING" | "FAILED";
    created_at: string;
  }>;
  total: number;
}
```

**Worker Payment History**:

```typescript
GET /api/mobile/payments/received?role=worker

Response:
{
  payments: Array<{
    id: number;
    job_id: number;
    job_title: string;
    client_name: string;
    type: "ESCROW" | "FINAL";
    gross_amount: number;
    platform_fee: number;
    net_amount: number;
    created_at: string;
  }>;
  total_received: number;
}
```

---

## 2.7 Payment Security & Validation

### Backend Validation Rules

**All payment endpoints MUST validate**:

```python
# 1. User Authorization
if job.clientID.profileID.accountFK != request.auth:
    return {'error': 'Unauthorized', 'status': 403}

# 2. Job Status
if job.status not in ['ACTIVE', 'IN_PROGRESS']:
    return {'error': 'Invalid job status for payment', 'status': 400}

# 3. Payment Type Validation
if payment_type == 'ESCROW':
    if job.escrow_paid:
        return {'error': 'Escrow already paid', 'status': 400}
    if job.status != 'ACTIVE':
        return {'error': 'Job must be ACTIVE for escrow', 'status': 400}

elif payment_type == 'FINAL':
    if not job.escrow_paid:
        return {'error': 'Escrow must be paid first', 'status': 400}
    if not job.workerMarkedComplete:
        return {'error': 'Worker has not marked complete', 'status': 400}
    if job.final_paid:
        return {'error': 'Final payment already made', 'status': 400}

# 4. Amount Validation
expected_amount = job.budget * 0.50
if abs(amount - expected_amount) > 0.01:
    return {'error': 'Invalid payment amount', 'status': 400}

# 5. Wallet Balance (if wallet payment)
if payment_method == 'WALLET':
    wallet = Wallet.objects.get(user=request.auth)
    if wallet.balance < amount:
        return {'error': 'Insufficient wallet balance', 'status': 400}
```

### Frontend Validation

**Before payment submission**:

```typescript
const validatePayment = (payment: PaymentData) => {
  // Check payment method selected
  if (!payment.method) {
    return { error: "Please select a payment method" };
  }

  // Wallet validation
  if (payment.method === "WALLET") {
    if (walletBalance < payment.amount) {
      return { error: "Insufficient wallet balance" };
    }
  }

  // Cash validation
  if (payment.method === "CASH") {
    if (!payment.proofImage) {
      return { error: "Please upload proof of payment" };
    }
  }

  // Amount validation
  const expectedAmount = job.budget * 0.5;
  if (Math.abs(payment.amount - expectedAmount) > 0.01) {
    return { error: "Invalid payment amount" };
  }

  return { valid: true };
};
```

### Atomic Transactions

**All payment operations MUST be atomic**:

```python
from django.db import transaction

@transaction.atomic
def process_escrow_payment(job_id, payment_method):
    # Lock job record
    job = Job.objects.select_for_update().get(id=job_id)

    # Validate job state
    if job.escrow_paid:
        raise ValueError('Escrow already paid')

    # Deduct from wallet if applicable
    if payment_method == 'WALLET':
        wallet = Wallet.objects.select_for_update().get(user=job.clientID.profileID.accountFK)
        escrow_amount = job.budget * 0.50

        if wallet.balance < escrow_amount:
            raise ValueError('Insufficient balance')

        wallet.balance -= escrow_amount
        wallet.save()

    # Create payment record
    payment = EscrowPayment.objects.create(
        job=job,
        amount_paid=escrow_amount,
        platform_fee=escrow_amount * 0.05,
        worker_receives=escrow_amount * 0.95,
        payment_method=payment_method,
        status='COMPLETED' if payment_method == 'WALLET' else 'PENDING',
    )

    # Update job
    job.escrow_paid = True
    job.status = 'IN_PROGRESS'
    job.save()

    # Send notification
    Notification.objects.create(
        user=job.assignedWorkerID.profileID.accountFK,
        message=f'Escrow payment received for {job.title}',
    )

    return payment
```

---

## Implementation Checklist

### Phase 1: Wallet System

- [ ] Create wallet overview page
- [ ] Build WalletCard component
- [ ] Create wallet deposit page
- [ ] Implement Xendit integration for deposits
- [ ] Create transactions history page
- [ ] Build TransactionCard component
- [ ] Wire up all wallet APIs
- [ ] Add balance refresh functionality
- [ ] Test deposit flow end-to-end

### Phase 2: Escrow Payment

- [ ] Create escrow payment page
- [ ] Build PaymentMethodSelector component
- [ ] Build PaymentSummaryCard component
- [ ] Implement wallet payment flow
- [ ] Implement GCash payment flow (Xendit)
- [ ] Implement cash payment flow
- [ ] Create payment status tracking page
- [ ] Wire up payment APIs
- [ ] Add Xendit webhook handler
- [ ] Test all 3 payment methods

### Phase 3: Final Payment

- [ ] Create final payment page
- [ ] Build FinalPaymentConfirmation component
- [ ] Reuse PaymentMethodSelector (same 3 methods)
- [ ] Wire up approve-completion API
- [ ] Add review prompt after completion
- [ ] Test final payment flow
- [ ] Test total earnings calculation

### Phase 4: Worker Earnings

- [ ] Create earnings dashboard page
- [ ] Build EarningsCard component
- [ ] Build EarningsChart component
- [ ] Build JobEarningsList component
- [ ] Wire up earnings APIs
- [ ] Add filtering and period selection
- [ ] Test earnings calculations

### Phase 5: Payment History

- [ ] Create payment history page (client)
- [ ] Create payment history page (worker)
- [ ] Build PaymentHistoryCard component
- [ ] Add filtering by type/status
- [ ] Wire up history APIs
- [ ] Add export functionality (optional)
- [ ] Test role-based views

### Phase 6: Security & Testing

- [ ] Implement all backend validation
- [ ] Add atomic transactions
- [ ] Test insufficient balance scenarios
- [ ] Test duplicate payment prevention
- [ ] Test payment failure handling
- [ ] Test Xendit webhook handling
- [ ] Perform security audit
- [ ] Load testing with multiple concurrent payments

---

## Testing Strategy

### Unit Tests

- [ ] Payment calculation functions
- [ ] Fee calculation (5% FROM payment)
- [ ] Balance validation
- [ ] Amount validation

### Integration Tests

- [ ] Wallet deposit flow
- [ ] Escrow payment (all 3 methods)
- [ ] Final payment (all 3 methods)
- [ ] Xendit webhook processing
- [ ] Payment status updates

### E2E Tests (Playwright)

```typescript
test("Client pays escrow via wallet and approves final payment", async ({
  page,
}) => {
  // Create job and accept application (Module 1)
  await loginAsClient(page);
  const jobId = await createAndAcceptJob(page);

  // Escrow payment
  await page.goto(`/dashboard/payments/escrow/${jobId}`);
  await page.click('input[value="WALLET"]');
  await page.click('button:has-text("Confirm Payment")');
  await expect(page).toHaveURL(`/dashboard/jobs/${jobId}`);

  // Worker marks complete
  await loginAsWorker(page);
  await page.goto(`/dashboard/jobs/${jobId}`);
  await page.click('button:has-text("Mark Complete")');

  // Final payment
  await loginAsClient(page);
  await page.goto(`/dashboard/payments/final/${jobId}`);
  await page.click('input[value="WALLET"]');
  await page.click('button:has-text("Approve & Pay")');
  await expect(page).toHaveURL("/dashboard/reviews/submit");

  // Verify total earnings (95% of budget)
  const earnings = await getWorkerEarnings(page, workerId);
  expect(earnings).toBe(jobBudget * 0.95);
});
```

---

## Completion Criteria

Module 2 is complete when:

- [x] All 7 sections implemented
- [x] Wallet deposit/balance works
- [x] Escrow payment (all 3 methods) works
- [x] Final payment (all 3 methods) works
- [x] Payment calculations correct (5% FROM each payment)
- [x] Worker earnings dashboard functional
- [x] Payment history (both roles) works
- [x] All validation and security checks pass
- [x] Xendit integration operational
- [x] 0 TypeScript errors
- [x] All E2E tests pass
- [x] Atomic transactions verified
- [x] No payment duplication bugs

---

**Next Module**: Module 3 - Messaging System
