# Mobile Phase 3 - QA Testing Checklist

**Feature**: Escrow Payment System (50% Downpayment)  
**Date**: November 14, 2025  
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Xendit test account configured
- [ ] Supabase storage configured for file uploads
- [ ] Mobile app running via Expo Go
- [ ] Test accounts created (1 worker, 1 client)
- [ ] Test wallet with sufficient balance (₱5,000+)
- [ ] Test GCash account or Xendit sandbox
- [ ] Camera/photo library permissions granted

## Pre-Testing Setup

### Worker Account:

- [ ] Email: worker@test.com
- [ ] Profile type: WORKER
- [ ] Has 2+ job applications in ACCEPTED status
- [ ] Ready to post job requiring payment

### Client Account:

- [ ] Email: client@test.com
- [ ] Profile type: CLIENT
- [ ] Wallet balance: ₱5,000 minimum
- [ ] Has posted jobs ready for payment
- [ ] Camera/gallery permissions enabled

### Test Job Setup:

- [ ] Create test job with budget ₱2,000
- [ ] Accept worker application
- [ ] Job status: ACCEPTED (ready for payment)

---

## 1. Payment Method Selection Screen

**File**: `app/payments/method.tsx`

### Screen Access & Layout

- [ ] Navigate from job detail "Make Payment" button
- [ ] Screen displays "Payment Method" header
- [ ] Back button navigates to previous screen
- [ ] Payment summary card visible at top
- [ ] Wallet balance card displays
- [ ] Three payment method buttons visible

### Payment Summary Card

- [ ] Job budget displays correctly (₱2,000)
- [ ] Escrow amount shows 50% (₱1,000)
- [ ] Platform fee shows 5% (₱100)
- [ ] Total amount calculates correctly (₱1,100)
- [ ] All amounts formatted as PHP currency (₱X,XXX.XX)
- [ ] Info box explains escrow system
- [ ] Breakdown section expands/collapses

### Wallet Balance Card

- [ ] Current balance displays correctly
- [ ] Balance formatted as PHP currency
- [ ] Gradient background renders properly
- [ ] Refresh button visible (circular arrow icon)
- [ ] Tapping refresh updates balance
- [ ] Loading spinner shows during refresh
- [ ] Balance updates in real-time

### Payment Method Buttons

- [ ] GCash button displays with blue wallet icon
- [ ] Wallet button displays with card icon
- [ ] Cash button displays with green cash icon
- [ ] Each button has label and description
- [ ] Radio button circles visible
- [ ] Tapping button selects it (checkmark appears)
- [ ] Only one method can be selected at a time
- [ ] Selected method highlighted

### Wallet Insufficient Balance Logic

- [ ] If balance < total, wallet method disabled
- [ ] Disabled wallet button grayed out
- [ ] Cannot select disabled wallet method
- [ ] Warning message shows: "Insufficient wallet balance"
- [ ] Warning styled in red/orange
- [ ] Deposit funds suggestion displays

### Navigation & Proceed Button

- [ ] "Proceed to Payment" button visible at bottom
- [ ] Button disabled if no method selected
- [ ] Button enabled when method selected
- [ ] Tapping proceed with GCash navigates to GCash screen
- [ ] Tapping proceed with Wallet navigates to Wallet screen
- [ ] Tapping proceed with Cash navigates to Cash screen
- [ ] Job ID, budget, title passed as route params

---

## 2. GCash Payment Screen (Xendit)

**File**: `app/payments/gcash.tsx`

### Screen Load & Invoice Creation

- [ ] Screen displays "GCash Payment" header
- [ ] Back button visible in header
- [ ] Job title displays in header subtitle
- [ ] Loading indicator shows on screen load
- [ ] "Creating payment invoice..." message displays
- [ ] API call to create Xendit invoice triggers
- [ ] Invoice creation takes < 3 seconds

### Payment Summary (Compact Mode)

- [ ] Payment summary card shows in compact mode
- [ ] Single line shows total amount
- [ ] Amount formatted correctly (₱1,100)

### Xendit WebView Integration

- [ ] WebView displays after invoice created
- [ ] Xendit payment page loads
- [ ] Loading indicator shows while page loads
- [ ] Page displays correctly (no layout issues)
- [ ] Can scroll through payment page
- [ ] Payment channel options visible (GCash, etc.)
- [ ] Can interact with form fields

### Payment Success Flow

- [ ] Complete test payment in WebView
- [ ] Success callback detected (URL contains /payment/success)
- [ ] WebView closes automatically
- [ ] Loading indicator shows "Processing payment..."
- [ ] Escrow payment record created via API
- [ ] Success toast notification appears
- [ ] Navigation to payment status screen
- [ ] Status screen shows "Completed" status

### Payment Failure Flow

- [ ] Cancel payment or use failed card
- [ ] Failure callback detected (URL contains /payment/failed)
- [ ] Error alert displays with message
- [ ] "Payment Failed" title in alert
- [ ] User-friendly error message
- [ ] "Try Again" button in alert
- [ ] Can retry payment
- [ ] Can cancel and go back

### Cancel Payment

- [ ] Cancel button visible in header (or screen)
- [ ] Tapping cancel shows confirmation dialog
- [ ] Dialog message: "Are you sure you want to cancel?"
- [ ] "No" button dismisses dialog
- [ ] "Yes, Cancel" button (destructive style)
- [ ] Confirming cancel returns to method selection

### Error Handling

- [ ] Network error handled gracefully
- [ ] Invoice creation failure shows error alert
- [ ] "Failed to create invoice" message
- [ ] Can retry invoice creation
- [ ] WebView loading timeout handled (30s)
- [ ] App backgrounding during payment handled

---

## 3. Wallet Payment Screen

**File**: `app/payments/wallet.tsx`

### Screen Layout & Display

- [ ] Screen displays "Wallet Payment" header
- [ ] Back button in header
- [ ] Job title in header subtitle
- [ ] Wallet balance card at top
- [ ] Payment summary card displays
- [ ] Balance calculation section visible

### Wallet Balance Card

- [ ] Current balance displays
- [ ] Gradient background renders
- [ ] Refresh button works
- [ ] Loading state shows on refresh
- [ ] Balance updates after refresh

### Payment Summary

- [ ] Full payment breakdown shows
- [ ] Job budget row (50%): ₱1,000
- [ ] Platform fee row (5%): ₱100
- [ ] Total amount row: ₱1,100
- [ ] All amounts formatted correctly

### Balance Calculation Display

- [ ] "Current Balance" row shows wallet amount
- [ ] "Payment Amount" row shows total
- [ ] "Remaining Balance" row calculates correctly
- [ ] Calculation: Current - Payment = Remaining
- [ ] Remaining balance formatted correctly

### Insufficient Balance State

- [ ] If balance < total, warning box shows
- [ ] Warning background styled (red/orange tint)
- [ ] Warning icon displays (⚠️)
- [ ] Warning text: "Insufficient wallet balance"
- [ ] Remaining needed amount displayed
- [ ] "Deposit Funds" button shows
- [ ] Deposit button styled prominently (blue)
- [ ] Tapping deposit navigates to deposit screen
- [ ] "Confirm Payment" button disabled
- [ ] Disabled button grayed out

### Sufficient Balance State

- [ ] If balance >= total, no warning shows
- [ ] Remaining balance shows in green
- [ ] "Confirm Payment" button enabled
- [ ] Button styled in primary color (blue)

### Payment Confirmation Modal

- [ ] Tapping "Confirm Payment" opens modal
- [ ] Modal displays over screen (dimmed background)
- [ ] Modal title: "Confirm Payment"
- [ ] Payment amount displays prominently
- [ ] Remaining balance displays
- [ ] Warning text about deduction
- [ ] "Cancel" button at bottom (gray)
- [ ] "Confirm Payment" button at bottom (blue)
- [ ] Tapping cancel dismisses modal
- [ ] Tapping outside modal dismisses it

### Payment Processing

- [ ] Confirming payment shows processing state
- [ ] "Confirm Payment" button shows spinner
- [ ] Button disabled during processing
- [ ] API call to create escrow payment triggers
- [ ] Payment method: "wallet" passed
- [ ] Processing takes < 2 seconds

### Payment Success

- [ ] Success toast notification shows
- [ ] "Payment successful" message
- [ ] Wallet balance refetches automatically
- [ ] Balance updates to show deduction
- [ ] Navigation to payment status screen
- [ ] Status screen shows "Completed"
- [ ] Can navigate back to see updated balance

### Payment Failure

- [ ] If API call fails, error alert shows
- [ ] Alert title: "Payment Failed"
- [ ] Error message user-friendly
- [ ] "Try Again" button in alert
- [ ] Can retry payment
- [ ] Wallet balance not deducted on failure

### Cancel & Navigation

- [ ] Back button shows confirmation if payment started
- [ ] Can cancel without confirmation if no payment
- [ ] Tapping back returns to method selection

---

## 4. Cash Payment Screen

**File**: `app/payments/cash.tsx`

### Screen Layout & Instructions

- [ ] Screen displays "Cash Payment" header
- [ ] Back button in header
- [ ] Job title in header subtitle
- [ ] Payment summary card displays
- [ ] Instructions card visible

### Payment Instructions Card

- [ ] Card has info icon (ℹ️)
- [ ] Title: "Payment Instructions"
- [ ] 4 numbered steps display
- [ ] Step 1: Shows total amount (₱1,100) highlighted
- [ ] Step 2: Instructions for taking photo
- [ ] Step 3: Upload photo instruction
- [ ] Step 4: Wait for admin approval (24-48 hours)
- [ ] Warning box at bottom
- [ ] Warning icon (⚠️) displays
- [ ] Warning text about verification delays
- [ ] Warning styled in yellow/orange

### Upload Section

- [ ] Section title: "Upload Proof of Payment"
- [ ] Subtitle: "Required - Clear photo..."
- [ ] Upload button displays (dashed border)
- [ ] Camera icon in upload button
- [ ] Button text: "Take Photo or Choose from Gallery"
- [ ] Hint text: "JPG or PNG, max 10MB"

### Image Picker - Camera

- [ ] Tapping upload shows action sheet
- [ ] Action sheet has 3 options: Camera, Gallery, Cancel
- [ ] Selecting "Camera" requests permission
- [ ] Permission alert shows if not granted
- [ ] Camera opens after permission granted
- [ ] Can capture photo of receipt
- [ ] Photo editing screen shows (crop, rotate)
- [ ] Confirming saves photo
- [ ] Photo preview displays in app

### Image Picker - Gallery

- [ ] Selecting "Gallery" requests permission
- [ ] Permission alert shows if not granted
- [ ] Gallery/photo library opens
- [ ] Can browse and select existing photo
- [ ] Photo editing screen shows
- [ ] Confirming saves photo
- [ ] Photo preview displays in app

### Image Preview

- [ ] Selected photo displays in preview box
- [ ] Preview box has border
- [ ] Photo scaled to fit (maintains aspect ratio)
- [ ] Remove button (X icon) at top-right corner
- [ ] Remove button has white background circle
- [ ] Tapping remove shows confirmation dialog
- [ ] Dialog: "Are you sure you want to remove?"
- [ ] "Cancel" and "Remove" (destructive) buttons
- [ ] Confirming remove clears image
- [ ] "Change Photo" button below preview
- [ ] Change button has camera icon
- [ ] Tapping change reopens action sheet

### Upload Progress

- [ ] "Submit for Verification" button at bottom
- [ ] Button disabled if no image selected
- [ ] Button enabled when image selected
- [ ] Tapping submit starts upload
- [ ] Progress bar appears
- [ ] Progress bar fills 0% to 100%
- [ ] Progress percentage text displays
- [ ] Upload takes 3-10 seconds
- [ ] Progress updates smoothly
- [ ] Submit button shows spinner during upload

### Upload Completion

- [ ] Upload completes successfully
- [ ] Success toast notification shows
- [ ] Escrow payment record created
- [ ] Payment status: "verifying"
- [ ] Navigation to payment status screen
- [ ] Status screen shows "Verifying" badge
- [ ] Status message about admin verification

### Upload Errors

- [ ] If submit without image, alert shows
- [ ] Alert message: "Please upload proof of payment"
- [ ] If upload fails, error alert shows
- [ ] Alert message: "Failed to upload..."
- [ ] Can retry upload
- [ ] File size validation (max 10MB)
- [ ] Alert if file too large
- [ ] File type validation (JPG/PNG only)
- [ ] Alert if wrong file type

### Cancel Payment

- [ ] Cancel button at bottom (below submit)
- [ ] Tapping cancel shows confirmation
- [ ] Dialog: "Are you sure you want to cancel?"
- [ ] Confirming cancel returns to method selection
- [ ] Image discarded on cancel

---

## 5. Payment Status Screen

**File**: `app/payments/status.tsx`

### Screen Access & Layout

- [ ] Screen displays after payment completion
- [ ] Header shows "Payment Status"
- [ ] Close button (X) in header
- [ ] Status icon displays at top (large, circular)
- [ ] Status badge below icon
- [ ] Status message below badge

### Status Icons (Color-Coded)

- [ ] Pending: Yellow clock icon (⏳)
- [ ] Completed: Green checkmark icon (✓)
- [ ] Failed: Red X icon (✗)
- [ ] Verifying: Blue search icon (🔍)
- [ ] Refunded: Purple undo icon (↩)
- [ ] Icon background matches status color (20% opacity)

### Status Badges

- [ ] Badge displays correct status text
- [ ] Pending: Yellow badge with "Pending"
- [ ] Completed: Green badge with "Completed"
- [ ] Failed: Red badge with "Failed"
- [ ] Verifying: Blue badge with "Verifying"
- [ ] Refunded: Purple badge with "Refunded"
- [ ] Badge has emoji icon matching status

### Status Messages

- [ ] Pending: "Your payment is being processed..."
- [ ] Completed: "Your payment has been confirmed!"
- [ ] Failed: "Your payment could not be processed..."
- [ ] Verifying: "Your cash proof is being verified..."
- [ ] Refunded: "Your payment has been refunded..."
- [ ] Message styled in center, gray text

### Auto-Refresh (Pending/Verifying)

- [ ] Screen auto-refreshes every 5 seconds if pending
- [ ] Screen auto-refreshes every 5 seconds if verifying
- [ ] Refresh stops when status is completed
- [ ] Refresh stops when status is failed
- [ ] Brief loading indicator during refresh
- [ ] No UI flicker during refresh

### Payment Details Card

- [ ] Card displays "Payment Details" title
- [ ] "Amount Paid" row shows total (₱1,100)
- [ ] "Payment Method" row shows method (GCash/Wallet/Cash)
- [ ] "Transaction ID" row shows ID or "N/A"
- [ ] "Date & Time" row shows timestamp
- [ ] Timestamp formatted: "Nov 14, 2025, 10:30 AM"
- [ ] All amounts formatted as PHP currency

### Job Details Card

- [ ] Card displays "Job Details" title
- [ ] "Job Title" row shows job name
- [ ] "Budget" row shows full job budget (₱2,000)
- [ ] "View Job Details" button at bottom
- [ ] Button has arrow icon (→)
- [ ] Tapping button navigates to job detail screen

### Status Timeline

- [ ] Card displays "Status Timeline" title
- [ ] Timeline has vertical line connecting steps
- [ ] "Payment Initiated" step always shows
- [ ] Timestamp shows for "Payment Initiated"
- [ ] "Verification Started" shows if verifying/completed
- [ ] "Payment Confirmed" shows if completed
- [ ] "Payment Failed" shows if failed
- [ ] Timeline dots color-coded (green for done, red for failed)
- [ ] Timestamps relative (e.g., "2 hours ago") or absolute

### Action Buttons (Status-Dependent)

- [ ] If completed: "View Job" button shows (blue)
- [ ] If failed: "Try Again" button shows (blue)
- [ ] "Back to Home" button always shows (gray)
- [ ] Tapping "View Job" navigates to job detail
- [ ] Tapping "Try Again" returns to method selection
- [ ] Tapping "Back to Home" navigates to home tab
- [ ] Buttons have icons (arrows, refresh)

### Loading State

- [ ] If data loading on mount, spinner shows
- [ ] "Loading payment status..." message displays
- [ ] Screen shows once data loaded

---

## 6. Transaction History Screen

**File**: `app/payments/history.tsx`

### Screen Access & Layout

- [ ] Accessible from profile/wallet section
- [ ] Screen displays "Transaction History" header
- [ ] Back button in header
- [ ] Filter chips row at top
- [ ] Transaction count below filters
- [ ] Transaction list scrollable

### Filter Chips

- [ ] 5 filter chips display: All, Pending, Completed, Verifying, Failed
- [ ] Chips have rounded pill shape
- [ ] Active chip highlighted (blue background)
- [ ] Inactive chips have gray background
- [ ] Tapping chip filters transactions
- [ ] Active chip text white, inactive text gray
- [ ] Chips scroll horizontally if overflow

### Filter Functionality

- [ ] "All" filter shows all transactions (default)
- [ ] "Pending" filter shows only pending transactions
- [ ] "Completed" filter shows only completed
- [ ] "Verifying" filter shows only verifying
- [ ] "Failed" filter shows only failed
- [ ] Transaction list updates immediately on filter
- [ ] Transaction count updates with filter

### Transaction Count

- [ ] Text displays: "X transaction(s)"
- [ ] Count matches filtered list length
- [ ] Singular "transaction" for count = 1
- [ ] Plural "transactions" for count > 1
- [ ] Count styled in gray, small font

### Transaction Cards

- [ ] Each transaction displays as card
- [ ] Card has white background, rounded corners
- [ ] Card has subtle border
- [ ] Cards have spacing between them
- [ ] Payment method icon at left (colored circle)
- [ ] Job title displays (truncated if long)
- [ ] Payment amount at right (bold)
- [ ] Amount formatted as PHP currency
- [ ] Positive amounts show "+" prefix (deposits)
- [ ] Payment method label below title (GCASH/WALLET/CASH)
- [ ] Relative timestamp displays (e.g., "2h ago")
- [ ] Status badge at bottom-right
- [ ] Chevron arrow at far right (→)
- [ ] Tapping card opens receipt modal

### Relative Timestamps

- [ ] "Just now" for < 1 minute ago
- [ ] "Xm ago" for minutes (e.g., "5m ago")
- [ ] "Xh ago" for hours (e.g., "2h ago")
- [ ] "Xd ago" for days (e.g., "3d ago")
- [ ] Absolute date for > 7 days (e.g., "Nov 7")
- [ ] Year included if not current year

### Payment Method Icons

- [ ] GCash: Blue wallet icon
- [ ] Wallet: Primary color card icon
- [ ] Cash: Green cash icon
- [ ] Icon backgrounds color-coded (20% opacity)

### Pull-to-Refresh

- [ ] Pull down to reveal refresh indicator
- [ ] Release to trigger refresh
- [ ] Spinner shows during refresh
- [ ] Transaction list updates after refresh
- [ ] Smooth animation

### Pagination (Infinite Scroll)

- [ ] Initial load shows first 20 transactions
- [ ] Scrolling to bottom triggers load more
- [ ] "Loading more..." text shows at bottom
- [ ] Small spinner shows during load
- [ ] Next 20 transactions append to list
- [ ] Pagination stops when no more transactions
- [ ] No "load more" if < 20 initial transactions

### Empty States

- [ ] If no transactions, empty state shows
- [ ] Receipt icon displayed (large, gray)
- [ ] "No Transactions Yet" title
- [ ] "Your payment history will appear here" subtitle
- [ ] Message changes based on filter
- [ ] Example: "No pending transactions found" for Pending filter
- [ ] Empty state centered vertically

### Loading State

- [ ] On initial load, spinner shows
- [ ] "Loading transactions..." message
- [ ] Loading centered in screen

---

## 7. Payment Receipt Modal

**File**: `components/PaymentReceiptModal.tsx`

### Modal Display

- [ ] Modal opens when transaction card tapped
- [ ] Modal slides up from bottom (page sheet style)
- [ ] Dimmed background behind modal
- [ ] Tapping background dismisses modal
- [ ] Modal takes full screen height

### Modal Header

- [ ] Header shows "Payment Receipt" title
- [ ] Close button (X) at left
- [ ] Share button at right (share icon)
- [ ] Header has white background
- [ ] Border below header

### Receipt Icon & Status

- [ ] Receipt icon at top (large, blue)
- [ ] Status badge below icon
- [ ] Badge matches transaction status
- [ ] Badge styled correctly (color, emoji)

### Total Amount Display

- [ ] "Total Amount" label shows
- [ ] Amount displays very large (36pt)
- [ ] Amount formatted as PHP (₱1,100)
- [ ] Amount styled in bold, dark text

### Transaction ID

- [ ] "Transaction ID" label shows
- [ ] Transaction ID displays in monospace font
- [ ] ID styled smaller, gray text
- [ ] ID copyable (long-press hint optional)

### Payment Breakdown Section

- [ ] Card shows "Payment Breakdown" title
- [ ] "Job Budget (50%)" row shows amount (₱1,000)
- [ ] "Platform Fee (5%)" row shows amount (₱100)
- [ ] Divider line between rows and total
- [ ] "Total Paid" row shows total (₱1,100)
- [ ] Total row styled bold
- [ ] All amounts right-aligned

### Payment Details Section

- [ ] Card shows "Payment Details" title
- [ ] "Payment Method" row shows method
- [ ] "Date & Time" row shows timestamp
- [ ] "Status" row shows status badge
- [ ] All rows have label on left, value on right
- [ ] Labels styled gray, values styled dark

### Job Details Section

- [ ] Card shows "Job Details" title (if job exists)
- [ ] "Job Title" row shows title
- [ ] "Job Budget" row shows full budget
- [ ] "Job ID" row shows ID (#123)
- [ ] All rows formatted consistently

### Worker Details Section (if applicable)

- [ ] Card shows "Worker Details" title
- [ ] "Worker Name" row shows name
- [ ] "Worker ID" row shows ID
- [ ] Only shows for client receipts

### Footer Note

- [ ] Footer section at bottom
- [ ] Info icon (ℹ️) at left
- [ ] Text: "This is an official receipt from iAyos..."
- [ ] Background tinted (gray/blue)
- [ ] Footer has rounded corners

### Share Functionality

- [ ] Tapping share button opens share sheet
- [ ] Share sheet shows native options (SMS, Email, etc.)
- [ ] Share message includes:
  - [ ] Transaction ID
  - [ ] Amount
  - [ ] Platform Fee
  - [ ] Total
  - [ ] Method
  - [ ] Status
  - [ ] Date
  - [ ] Job title (if exists)
- [ ] Share message formatted nicely
- [ ] Sharing works on iOS
- [ ] Sharing works on Android

### Modal Dismissal

- [ ] Tapping close (X) dismisses modal
- [ ] Tapping outside modal dismisses it
- [ ] Back button dismisses modal (Android)
- [ ] Smooth slide-down animation

---

## 8. Wallet Deposit Screen

**File**: `app/payments/deposit.tsx`

### Screen Access & Layout

- [ ] Accessible from wallet payment screen
- [ ] Accessible from payment method screen
- [ ] Screen displays "Deposit Funds" header
- [ ] Back button in header
- [ ] Current wallet balance card at top
- [ ] Amount input section
- [ ] Preset amounts grid
- [ ] Info card
- [ ] Deposit button at bottom

### Current Balance Display

- [ ] Wallet balance card shows at top
- [ ] Balance displays with gradient background
- [ ] Refresh button works
- [ ] Balance formatted as PHP currency

### Amount Input Section

- [ ] Section title: "Enter Amount"
- [ ] Subtitle: "Minimum ₱100, Maximum ₱100,000"
- [ ] Large amount input box
- [ ] ₱ symbol at left
- [ ] Amount displays large (48pt)
- [ ] Amount updates when preset selected
- [ ] Amount starts as "0" if no preset

### Preset Amount Buttons

- [ ] 6 preset amounts display: ₱100, ₱200, ₱500, ₱1000, ₱2000, ₱5000
- [ ] Buttons in 2-3 column grid
- [ ] Each button shows amount (₱X format)
- [ ] Inactive buttons have white background, border
- [ ] Active button has blue background, white text
- [ ] Tapping preset updates input
- [ ] Only one preset can be active at a time

### Custom Amount Input

- [ ] "Enter Custom Amount" button displays
- [ ] Button has dashed border
- [ ] Button has pencil icon
- [ ] Tapping button opens alert prompt (iOS) or dialog (Android)
- [ ] Prompt title: "Enter Custom Amount"
- [ ] Prompt message: "Minimum ₱100, Maximum ₱100,000"
- [ ] Input field in prompt
- [ ] Can type custom amount
- [ ] Preset amount pre-filled if exists
- [ ] "Cancel" button dismisses prompt
- [ ] "OK" button validates and saves

### Custom Amount Validation

- [ ] If amount < ₱100, error alert shows
- [ ] Alert message: "Minimum deposit amount is ₱100"
- [ ] If amount > ₱100,000, error alert shows
- [ ] Alert message: "Maximum deposit amount is ₱100,000"
- [ ] If invalid (non-numeric), error alert shows
- [ ] Alert message: "Please enter a valid amount"
- [ ] Valid amount updates input box

### Payment Method Info Card

- [ ] Card has info icon (ℹ️)
- [ ] Title: "Payment Method"
- [ ] Text explains Xendit redirect
- [ ] Text mentions GCash, bank transfer options
- [ ] Background tinted (light blue/gray)

### Deposit Button

- [ ] Button at bottom: "Deposit ₱X"
- [ ] Button shows selected amount
- [ ] Amount formatted as PHP currency
- [ ] Button disabled if no amount (₱0)
- [ ] Disabled button grayed out
- [ ] Enabled button blue background

### Xendit Deposit Flow

- [ ] Tapping deposit creates Xendit invoice
- [ ] Loading state shows "Creating invoice..."
- [ ] Invoice creation takes < 3 seconds
- [ ] WebView opens with Xendit page
- [ ] WebView loads payment form
- [ ] Can select payment channels
- [ ] Complete test deposit

### Deposit Success

- [ ] Success callback detected (URL)
- [ ] WebView closes
- [ ] Success toast notification shows
- [ ] "Deposit successful" message
- [ ] Wallet balance refetches
- [ ] Balance updates to show deposit
- [ ] Navigation back to previous screen
- [ ] Can see updated balance

### Deposit Failure

- [ ] Failure callback detected
- [ ] Error alert shows
- [ ] Alert message: "Deposit failed..."
- [ ] Can retry deposit
- [ ] Wallet balance unchanged

### Cancel Deposit

- [ ] Back button shows confirmation if deposit started
- [ ] Can cancel without confirmation if no deposit
- [ ] Tapping back returns to previous screen

### Error Handling

- [ ] Network error shows alert
- [ ] Invoice creation failure shows error
- [ ] Can retry invoice creation
- [ ] WebView timeout handled
- [ ] App backgrounding handled

---

## 9. Component Testing

### PaymentSummaryCard Component

- [ ] Component displays in method selection screen
- [ ] Component displays in GCash screen (compact)
- [ ] Component displays in Wallet screen
- [ ] Component displays in Cash screen
- [ ] Full mode shows all rows (budget, escrow, fee, total)
- [ ] Compact mode shows single line
- [ ] Amounts calculate correctly (50% + 5% = 55%)
- [ ] Amounts formatted as PHP currency
- [ ] Info box text readable
- [ ] Card has border and rounded corners

### PaymentMethodButton Component

- [ ] Renders in method selection screen
- [ ] Three instances render (GCash, Wallet, Cash)
- [ ] Icon displays with colored background
- [ ] Label displays (bold)
- [ ] Description displays (gray)
- [ ] Radio button circle at right
- [ ] Selected state shows checkmark in circle
- [ ] Unselected state shows empty circle
- [ ] Disabled state grayed out (Wallet if insufficient)
- [ ] Tapping selects button

### WalletBalanceCard Component

- [ ] Renders in payment method screen
- [ ] Renders in wallet payment screen
- [ ] Renders in deposit screen
- [ ] Gradient background renders (blue/cyan)
- [ ] Balance displays large, white text
- [ ] "Wallet Balance" label displays
- [ ] Refresh button visible (circular arrow)
- [ ] Tapping refresh triggers balance refetch
- [ ] Loading spinner shows during fetch
- [ ] Balance updates after fetch
- [ ] Deposit button shows if prop passed
- [ ] Tapping deposit navigates (if enabled)

### PaymentStatusBadge Component

- [ ] Renders in payment status screen
- [ ] Renders in transaction cards
- [ ] Renders in receipt modal
- [ ] Pending: Yellow background, ⏳ emoji, "Pending" text
- [ ] Completed: Green background, ✓ emoji, "Completed" text
- [ ] Failed: Red background, ✗ emoji, "Failed" text
- [ ] Verifying: Blue background, 🔍 emoji, "Verifying" text
- [ ] Refunded: Purple background, ↩ emoji, "Refunded" text
- [ ] Small size renders correctly
- [ ] Medium size renders correctly
- [ ] Large size renders correctly
- [ ] Badge has rounded pill shape

### TransactionCard Component

- [ ] Renders in transaction history screen
- [ ] Multiple cards render in list
- [ ] Card has white background, border
- [ ] Payment method icon displays (colored circle)
- [ ] Job title displays (truncated if long)
- [ ] Amount displays at right (bold)
- [ ] Amount formatted as PHP
- [ ] Positive amounts show "+" (e.g., "+₱1,100")
- [ ] Payment method label displays (uppercase)
- [ ] Relative timestamp displays
- [ ] Status badge displays at bottom-right
- [ ] Chevron arrow at far right
- [ ] Tapping card triggers onPress callback

### PaymentReceiptModal Component

- [ ] Renders when transaction tapped
- [ ] Modal displays over screen
- [ ] Dimmed background visible
- [ ] Can scroll through modal content
- [ ] All sections render correctly
- [ ] All data displays correctly
- [ ] Share button works
- [ ] Close button dismisses modal

---

## 10. Integration Testing

### End-to-End: GCash Payment Flow

- [ ] Start from job detail "Make Payment"
- [ ] Navigate to payment method selection
- [ ] See wallet balance and payment summary
- [ ] Select GCash payment method
- [ ] Tap "Proceed to Payment"
- [ ] GCash screen loads, invoice created
- [ ] WebView displays Xendit page
- [ ] Complete test payment
- [ ] Success detected, navigate to status
- [ ] Status shows "Completed"
- [ ] Job status updates (backend)
- [ ] Transaction appears in history
- [ ] Can view receipt from history

### End-to-End: Wallet Payment Flow

- [ ] Ensure wallet has sufficient balance (₱2,000+)
- [ ] Start from job detail "Make Payment"
- [ ] Navigate to payment method selection
- [ ] Wallet balance displays correctly
- [ ] Select Wallet payment method
- [ ] Tap "Proceed to Payment"
- [ ] Wallet screen shows balance breakdown
- [ ] Tap "Confirm Payment"
- [ ] Confirmation modal appears
- [ ] Confirm payment in modal
- [ ] Payment processing shows
- [ ] Payment completes
- [ ] Navigate to status screen
- [ ] Status shows "Completed"
- [ ] Return to method screen, balance updated
- [ ] Transaction in history
- [ ] Can view receipt

### End-to-End: Cash Payment Flow

- [ ] Start from job detail "Make Payment"
- [ ] Navigate to payment method selection
- [ ] Select Cash payment method
- [ ] Tap "Proceed to Payment"
- [ ] Cash screen loads with instructions
- [ ] Tap upload button
- [ ] Action sheet appears
- [ ] Select "Camera" or "Gallery"
- [ ] Permission granted
- [ ] Capture or select receipt photo
- [ ] Photo preview displays
- [ ] Tap "Submit for Verification"
- [ ] Upload progress shows (0-100%)
- [ ] Upload completes
- [ ] Navigate to status screen
- [ ] Status shows "Verifying"
- [ ] Transaction in history with "Verifying" badge
- [ ] Can view receipt

### End-to-End: Wallet Deposit Flow

- [ ] From wallet payment screen (insufficient balance)
- [ ] Tap "Deposit Funds" button
- [ ] Deposit screen loads
- [ ] Current balance displays
- [ ] Select preset amount (e.g., ₱1,000)
- [ ] Or enter custom amount
- [ ] Tap "Deposit ₱1,000"
- [ ] Xendit invoice created
- [ ] WebView opens
- [ ] Complete test deposit
- [ ] Success detected
- [ ] Balance refreshes
- [ ] New balance shows added deposit
- [ ] Return to previous screen
- [ ] Wallet method now enabled

### Transaction History Flow

- [ ] Complete 2+ payments (GCash, Wallet, Cash)
- [ ] Navigate to transaction history
- [ ] All transactions display
- [ ] Filter by "Pending" (if any)
- [ ] Filter by "Completed"
- [ ] Filter by "Verifying" (if cash payment)
- [ ] Pull-to-refresh updates list
- [ ] Scroll to load more (if >20)
- [ ] Tap transaction to view receipt
- [ ] Receipt displays correctly
- [ ] Share receipt
- [ ] Close receipt modal

---

## 11. Error Recovery Testing

### Network Interruption

- [ ] During GCash invoice creation, disconnect network
- [ ] Error alert shows with "Network error" message
- [ ] Reconnect network
- [ ] Retry invoice creation
- [ ] Succeeds after reconnection

### API Failures

- [ ] If escrow payment API fails (500), error alert shows
- [ ] Can retry payment
- [ ] If wallet balance API fails, error shows
- [ ] Can retry balance fetch
- [ ] If history API fails, error shows
- [ ] Can retry (pull-to-refresh)

### WebView Errors

- [ ] If Xendit page fails to load, timeout after 30s
- [ ] Error message shows
- [ ] Can close WebView and retry
- [ ] If payment completes but callback fails, manual check
- [ ] Status screen shows pending, auto-refreshes to completed

### Image Upload Errors

- [ ] If cash proof upload fails (network), error alert shows
- [ ] Can retry upload
- [ ] If file too large (>10MB), validation alert shows
- [ ] If wrong file type, validation alert shows
- [ ] Must select valid image to proceed

### App Backgrounding

- [ ] During GCash payment, press home button
- [ ] App goes to background
- [ ] Return to app
- [ ] WebView still active
- [ ] Can complete payment
- [ ] During wallet payment, background app
- [ ] Return to app
- [ ] Can still confirm payment

---

## 12. Performance Testing

### Load Times

- [ ] Payment method screen loads in < 1 second
- [ ] Wallet balance fetches in < 2 seconds
- [ ] Transaction history initial load < 3 seconds
- [ ] Payment status screen loads < 1 second
- [ ] Cash proof upload completes in < 10 seconds (for typical 2MB image)

### Responsiveness

- [ ] All button taps respond immediately (< 100ms)
- [ ] Scrolling smooth in transaction history
- [ ] No lag during filter switching
- [ ] Modal animations smooth (60fps)
- [ ] WebView scrolling smooth

### Memory Usage

- [ ] No memory leaks during payment flows
- [ ] WebView releases memory after close
- [ ] Image uploads release memory after complete
- [ ] Can complete 10+ payments without crash
- [ ] Transaction history handles 100+ items

### Auto-Refresh Performance

- [ ] 5-second auto-refresh doesn't cause UI jank
- [ ] Battery usage acceptable during auto-refresh
- [ ] Auto-refresh stops when screen not visible
- [ ] Auto-refresh resumes when screen visible

---

## 13. Cross-Platform Testing

### iOS Specific

- [ ] Camera permission alert shows with proper message
- [ ] Gallery permission alert shows
- [ ] WebView displays correctly on iPhone
- [ ] Status bar style correct (dark text on light background)
- [ ] Safe area insets respected (notch, home indicator)
- [ ] Keyboard avoidance works (modal inputs)
- [ ] Action sheet displays iOS-style
- [ ] Share sheet shows iOS-native options
- [ ] Alert prompts show iOS-style
- [ ] Large text accessibility works

### Android Specific

- [ ] Camera permission dialog shows
- [ ] Gallery permission dialog shows
- [ ] WebView displays correctly on Android
- [ ] Back button behavior correct (dismisses modals, goes back)
- [ ] Keyboard avoidance works
- [ ] Bottom sheet displays Android-style
- [ ] Share intent shows Android-native apps
- [ ] Alert dialogs show Material Design style
- [ ] Notifications work (if implemented)
- [ ] Large text accessibility works

---

## 14. Accessibility Testing

### Screen Reader (VoiceOver/TalkBack)

- [ ] All buttons have accessible labels
- [ ] Status badges announced with status name
- [ ] Amounts announced as currency values
- [ ] Navigation flow logical with screen reader
- [ ] Modals announced when opened
- [ ] Loading states announced

### Visual Accessibility

- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Status colors distinguishable (not color-only)
- [ ] Text sizes readable at default zoom
- [ ] Touch targets at least 44x44 points
- [ ] Can zoom text to 200% without breaking layout
- [ ] Focus indicators visible when navigating with keyboard (if applicable)

---

## 15. Edge Cases & Boundary Testing

### Amount Boundaries

- [ ] Minimum deposit (₱100) accepted
- [ ] Deposit < ₱100 rejected with error
- [ ] Maximum deposit (₱100,000) accepted
- [ ] Deposit > ₱100,000 rejected with error
- [ ] Zero amount (₱0) disables deposit button
- [ ] Negative amount rejected

### Wallet Balance Edge Cases

- [ ] Balance exactly equals payment amount (₱1,100)
- [ ] Balance ₱1 less than payment (₱1,099) - insufficient
- [ ] Balance ₱1 more than payment (₱1,101) - sufficient
- [ ] Zero balance (₱0) - wallet method disabled
- [ ] Very large balance (₱999,999) - displays correctly

### Image Upload Edge Cases

- [ ] 1MB image uploads successfully
- [ ] 9.9MB image uploads successfully
- [ ] 10.1MB image rejected with error
- [ ] Very small image (10KB) uploads
- [ ] Non-image file (.pdf) rejected
- [ ] Corrupt image file handled gracefully

### Transaction History Edge Cases

- [ ] Empty history shows empty state
- [ ] 1 transaction displays correctly
- [ ] 20 transactions (full page) - no pagination
- [ ] 21 transactions - pagination triggers
- [ ] 100+ transactions - scrolls smoothly
- [ ] Very long job title truncates

### Timestamp Edge Cases

- [ ] Transaction < 1 min ago: "Just now"
- [ ] Transaction 59 minutes ago: "59m ago"
- [ ] Transaction 1 hour ago: "1h ago"
- [ ] Transaction 23 hours ago: "23h ago"
- [ ] Transaction 1 day ago: "1d ago"
- [ ] Transaction 6 days ago: "6d ago"
- [ ] Transaction 7+ days ago: Shows date

---

## 16. Security & Data Integrity

### Payment Security

- [ ] Payment amounts not modifiable in frontend
- [ ] API validates payment amounts match job budget
- [ ] Transaction IDs unique and not predictable
- [ ] Cannot pay for same job twice
- [ ] Cannot create escrow payment without job acceptance

### Wallet Security

- [ ] Cannot set wallet balance via frontend
- [ ] Wallet deduction happens on backend only
- [ ] Cannot withdraw more than balance
- [ ] Balance refetch fetches from backend
- [ ] Cannot manipulate balance in API calls

### Data Privacy

- [ ] Transaction history shows only user's transactions
- [ ] Cannot view other users' receipts
- [ ] Cannot access other users' wallet balance
- [ ] Payment method details not exposed

---

## Summary Checklist

### Critical Paths (Must Pass)

- [ ] Complete GCash payment successfully
- [ ] Complete Wallet payment successfully
- [ ] Complete Cash payment upload successfully
- [ ] View payment status correctly
- [ ] View transaction history
- [ ] Deposit to wallet successfully

### High Priority (Should Pass)

- [ ] All error messages user-friendly
- [ ] All amounts formatted correctly
- [ ] All timestamps display correctly
- [ ] Auto-refresh works for pending payments
- [ ] Pull-to-refresh works
- [ ] Payment receipt displays correctly

### Medium Priority

- [ ] Animations smooth
- [ ] Loading indicators show appropriately
- [ ] Empty states display correctly
- [ ] Share functionality works

### Low Priority

- [ ] Edge cases handled
- [ ] Large text accessibility
- [ ] Very long job titles truncate

---

## Sign-Off

**QA Tester**: ******\_\_\_******  
**Date**: ******\_\_\_******  
**Pass Rate**: **\_** / **\_** tests passed  
**Critical Issues Found**: **\_**  
**High Priority Issues**: **\_**  
**Medium Priority Issues**: **\_**  
**Low Priority Issues**: **\_**

**Approved for Production**: [ ] YES [ ] NO  
**Comments**: **********************\_\_\_**********************

---

**Last Updated**: November 14, 2025  
**Phase**: 3 - Escrow Payment System  
**Implementation Status**: ✅ Complete  
**Documentation**: `docs/mobile/MOBILE_PHASE3_COMPLETE.md`
