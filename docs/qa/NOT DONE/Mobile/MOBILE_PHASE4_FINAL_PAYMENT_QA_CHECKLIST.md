# Mobile Phase 4 - QA Testing Checklist

**Feature**: Final Payment System & Worker Earnings Tracking
**Date**: November 14, 2025
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Xendit test account configured
- [ ] Supabase storage configured for file uploads
- [ ] Mobile app running via Expo Go
- [ ] Test accounts created (2 workers, 2 clients)
- [ ] Test wallets with sufficient balance (₱10,000+)
- [ ] Test GCash account or Xendit sandbox
- [ ] Camera/photo library permissions granted
- [ ] At least 1 completed job with escrow payment

## Pre-Testing Setup

### Worker Account 1:

- [ ] Email: worker1@test.com
- [ ] Profile type: WORKER
- [ ] Has completed 2+ jobs (marked complete by both parties)
- [ ] Has received escrow payments on completed jobs
- [ ] Ready to receive final payments

### Worker Account 2:

- [ ] Email: worker2@test.com
- [ ] Profile type: WORKER
- [ ] No earnings yet (empty state testing)
- [ ] Ready to complete first job

### Client Account 1:

- [ ] Email: client1@test.com
- [ ] Profile type: CLIENT
- [ ] Wallet balance: ₱10,000 minimum
- [ ] Has jobs with workers marked complete
- [ ] Ready to make final payments

### Client Account 2:

- [ ] Email: client2@test.com
- [ ] Profile type: CLIENT
- [ ] Wallet balance: ₱5,000 minimum
- [ ] Has jobs ready for final payment

### Test Job Setup:

- [ ] Create test job with budget ₱10,000
- [ ] Accept worker application
- [ ] Pay escrow (₱5,250 = 50% + 5% fee)
- [ ] Mark job in progress
- [ ] Worker marks job complete
- [ ] Client approves job completion
- [ ] Job status: COMPLETED (ready for final payment)

---

## 1. Final Payment Selection Screen

**File**: `app/payments/final.tsx`

### Screen Access & Layout

- [ ] Navigate from job completion approval screen
- [ ] Screen displays "Final Payment" header
- [ ] Back button navigates to previous screen
- [ ] Job completion success header visible
- [ ] Job title displays correctly
- [ ] Completion date shows
- [ ] Payment summary card visible at top
- [ ] Previous escrow payment card visible
- [ ] Wallet balance card displays
- [ ] Three payment method buttons visible

### Job Completion Header

- [ ] Large green checkmark icon displays
- [ ] "Job Completed!" text shows in large font
- [ ] Job title displays below (with icon)
- [ ] Completion date formatted: "Completed on Nov 14, 2025"
- [ ] Section has light green/success background
- [ ] Congratulations message displays
- [ ] Header has rounded corners

### Final Payment Breakdown Card

- [ ] Card displays "Final Payment Breakdown" title
- [ ] Remaining payment row shows 50% (₱5,000)
- [ ] Platform fee row shows 5% of final (₱250)
- [ ] Total row shows sum (₱5,250)
- [ ] Worker receives section shows net (₱9,737.50)
- [ ] Worker amount shows total minus fees
- [ ] Info text explains 5% platform fee deduction
- [ ] All amounts formatted as PHP currency (₱X,XXX.XX)
- [ ] Breakdown formatted in table/list style
- [ ] Card has border and rounded corners

### Previous Escrow Payment Card

- [ ] Card displays "Previous Payment" title
- [ ] Green checkmark icon shows (✓)
- [ ] Escrow amount displays (₱5,250)
- [ ] Payment date formatted: "Paid on Nov 12, 2025"
- [ ] "Escrow Payment" label shows
- [ ] Card has success/completed styling
- [ ] Card has light green background
- [ ] Text color readable on background

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

- [ ] If balance < total (₱5,250), wallet method disabled
- [ ] Disabled wallet button grayed out
- [ ] Cannot select disabled wallet method
- [ ] Warning message shows: "Insufficient wallet balance"
- [ ] Warning styled in red/orange
- [ ] Shows amount needed: "Need ₱X more"
- [ ] Deposit funds button displays
- [ ] Tapping deposit navigates to deposit screen

### Navigation & Proceed Button

- [ ] "Proceed to Payment" button visible at bottom
- [ ] Button disabled if no method selected
- [ ] Button enabled when method selected
- [ ] Tapping proceed with GCash navigates to GCash screen
- [ ] Tapping proceed with Wallet navigates to Wallet screen
- [ ] Tapping proceed with Cash navigates to Cash screen
- [ ] Job ID, budget, title, paymentType="final" passed as params
- [ ] Reuses Phase 3 payment screens

### Validation & Error Handling

- [ ] Alert shows if proceed without method selected
- [ ] Alert message: "Please select a payment method"
- [ ] Alert shows if wallet selected with insufficient balance
- [ ] Alert offers deposit option
- [ ] Network error shows toast message
- [ ] Loading job data shows spinner
- [ ] Error loading job shows retry option

---

## 2. Payment Timeline Screen

**File**: `app/payments/timeline/[jobId].tsx`

### Screen Access & Layout

- [ ] Accessible from earnings dashboard
- [ ] Accessible from payment received screen
- [ ] Accessible from job detail screen
- [ ] Screen displays "Payment Timeline" header
- [ ] Back button in header
- [ ] Job title in subtitle
- [ ] Payment summary card at top
- [ ] Timeline visualization below
- [ ] Scroll view for long timelines

### Payment Summary Card

- [ ] Card displays "Payment Summary" title
- [ ] "Escrow Paid" row shows amount (₱5,250)
- [ ] "Final Paid" row shows amount (₱5,250)
- [ ] Divider line between rows
- [ ] "Total Paid" row shows sum (₱10,500)
- [ ] Total row styled bold
- [ ] All amounts right-aligned
- [ ] All amounts formatted as PHP
- [ ] Card has border and rounded corners

### Timeline Event Count

- [ ] Total events count displays: "7 events"
- [ ] Count updates based on timeline data
- [ ] Styled in gray text

### Timeline Visualization

- [ ] Events display in chronological order (oldest to newest)
- [ ] Each event has colored dot indicator
- [ ] Vertical line connects events
- [ ] Line connects from first to last event
- [ ] Event cards display for each event
- [ ] Spacing between events consistent
- [ ] Timeline scrolls smoothly

### Timeline Event Dots

- [ ] Dot at left of each event
- [ ] Dots color-coded by event type:
  - [ ] Blue: Payment created/initiated
  - [ ] Green: Payment received/completed
  - [ ] Purple: Job started/completed
  - [ ] Orange: Payment released
  - [ ] Red: Payment failed (if applicable)
- [ ] Dot size consistent (12-16pt diameter)
- [ ] Dot has border

### Timeline Connector Lines

- [ ] Vertical line connects dots
- [ ] Line styled as border (dashed or solid)
- [ ] Line color matches theme (gray)
- [ ] Line visible between all events
- [ ] No line after last event

### Event Cards

- [ ] Each event displays as card
- [ ] Event type label shows (bold)
- [ ] Amount displays if applicable (right-aligned)
- [ ] Amount formatted as PHP
- [ ] Event description shows (if exists)
- [ ] Timestamp displays below
- [ ] Timestamp relative: "2 hours ago"
- [ ] Absolute timestamp on hover/long-press: "Nov 14, 2025 at 3:30 PM"
- [ ] Card has subtle background
- [ ] Card has rounded corners

### Event Types Displayed

- [ ] "Escrow Payment Created" event
- [ ] "Escrow Payment Received" event
- [ ] "Job Started" event
- [ ] "Job Marked Complete (Worker)" event
- [ ] "Job Completion Approved (Client)" event
- [ ] "Final Payment Initiated" event
- [ ] "Final Payment Received" event
- [ ] "Funds Released to Worker" event
- [ ] "Payment Failed" event (if failed)
- [ ] "Refund Initiated" event (if applicable)

### Pull-to-Refresh

- [ ] Pull down to reveal refresh indicator
- [ ] Release to trigger refresh
- [ ] Spinner shows during refresh
- [ ] Timeline data updates after refresh
- [ ] Smooth animation

### Navigation Buttons

- [ ] "Back" button at bottom (gray)
- [ ] "Home" button at bottom (blue)
- [ ] Tapping back returns to previous screen
- [ ] Tapping home navigates to home tab
- [ ] Buttons have icons (arrows)

### Empty State

- [ ] If no timeline data, empty state shows
- [ ] Clock/timeline icon displayed (large, gray)
- [ ] "No Timeline Available" title
- [ ] "Payment timeline will appear after payment" subtitle
- [ ] Empty state centered vertically

### Loading State

- [ ] On initial load, spinner shows
- [ ] "Loading payment timeline..." message
- [ ] Loading centered in screen

### Error State

- [ ] If API fails, error message shows
- [ ] "Failed to load timeline" message
- [ ] Retry button displays
- [ ] Tapping retry refetches data

---

## 3. Worker Earnings Dashboard

**File**: `app/worker/earnings.tsx`

### Screen Access & Layout

- [ ] Accessible from profile tab
- [ ] Accessible from bottom navigation
- [ ] Accessible from worker menu
- [ ] Screen displays "My Earnings" header
- [ ] Back button in header
- [ ] Earnings summary card at top
- [ ] Balance cards in row (2 columns)
- [ ] Quick actions in row (2 columns)
- [ ] Filter chips for history
- [ ] Earnings history list
- [ ] Scroll view for all content

### Earnings Summary Card

- [ ] Card displays large wallet icon
- [ ] "Total Earnings" label shows
- [ ] Total amount displays very large (36pt)
- [ ] Amount formatted as PHP (₱25,450.00)
- [ ] "From X completed jobs" subtitle shows
- [ ] Job count displays correctly
- [ ] Card has gradient background (green/blue)
- [ ] Text color white/high contrast
- [ ] Card has rounded corners

### Available Balance Card

- [ ] Card displays cash icon
- [ ] "Available Balance" label shows
- [ ] Balance amount displays large (24pt)
- [ ] Amount formatted as PHP (₱12,300.00)
- [ ] "Can be withdrawn" hint text shows
- [ ] Card has border
- [ ] Card has light background
- [ ] Card has rounded corners

### Pending Payments Card

- [ ] Card displays clock icon
- [ ] "Pending Payments" label shows
- [ ] Pending amount displays large (24pt)
- [ ] Amount formatted as PHP (₱5,250.00)
- [ ] "Not yet released" hint text shows
- [ ] Card has border
- [ ] Card has light background (yellow tint)
- [ ] Card has rounded corners

### Quick Actions - Withdraw Button

- [ ] Button displays arrow-up icon
- [ ] "Withdraw" label shows
- [ ] Button has border
- [ ] Button has white background
- [ ] Tapping button navigates to withdraw screen
- [ ] Button disabled if balance = ₱0
- [ ] Disabled state grayed out

### Quick Actions - Transactions Button

- [ ] Button displays list icon
- [ ] "Transactions" label shows
- [ ] Button has border
- [ ] Button has white background
- [ ] Tapping button navigates to transaction history
- [ ] Button always enabled

### Earnings History Section

- [ ] Section title: "Earnings History"
- [ ] Filter chips display: Week, Month, All
- [ ] Default filter: "All"
- [ ] Active filter highlighted (blue background)
- [ ] Inactive filters gray background
- [ ] Tapping filter updates history list

### Filter Functionality

- [ ] "Week" filter shows last 7 days earnings
- [ ] "Month" filter shows last 30 days earnings
- [ ] "All" filter shows all-time earnings
- [ ] History list updates immediately on filter change
- [ ] Loading indicator shows during filter change
- [ ] Empty state adapts to active filter

### Earnings History List

- [ ] Each earning displays as list item
- [ ] Items sorted by date (newest first)
- [ ] Job title displays (truncated if long)
- [ ] Relative timestamp: "2 hours ago"
- [ ] Absolute date: "Nov 14, 2025"
- [ ] Status badge displays (Completed/Pending/Failed)
- [ ] Gross amount displays at right
- [ ] Net amount displays below gross
- [ ] Platform fee shown: "Fee: -₱262.50"
- [ ] Chevron arrow at far right (→)
- [ ] Tapping item navigates to payment timeline
- [ ] Items have subtle border/divider

### Earnings History Item Status

- [ ] Completed: Green checkmark icon + badge
- [ ] Pending: Yellow clock icon + badge
- [ ] Failed: Red X icon + badge
- [ ] Status badge color-coded
- [ ] Badge has rounded pill shape

### Pull-to-Refresh

- [ ] Pull down to refresh
- [ ] Spinner shows during refresh
- [ ] Summary cards update after refresh
- [ ] History list updates after refresh
- [ ] Smooth animation

### Empty State - No Earnings

- [ ] If no earnings, empty state shows
- [ ] Wallet icon displayed (large, gray)
- [ ] "No Earnings Yet" title
- [ ] "Complete jobs to start earning" subtitle
- [ ] "Browse Jobs" button displays (blue)
- [ ] Tapping button navigates to jobs tab
- [ ] Empty state centered vertically

### Empty State - Filtered

- [ ] If filter returns no results, adapted empty state
- [ ] "No earnings this week" (for Week filter)
- [ ] "No earnings this month" (for Month filter)
- [ ] Empty state centered

### Loading State

- [ ] On initial load, spinner shows
- [ ] "Loading earnings..." message
- [ ] Loading centered in screen

### Error State

- [ ] If API fails, error message shows
- [ ] "Failed to load earnings" message
- [ ] Retry button displays
- [ ] Tapping retry refetches data

---

## 4. Payment Received Screen

**File**: `app/worker/payment-received.tsx`

### Screen Access & Layout

- [ ] Screen displays after payment released to worker
- [ ] Automatic navigation from backend notification
- [ ] Manual access via earnings history
- [ ] Screen displays "Payment Received" header
- [ ] Close button (X) in header
- [ ] Success icon at top (large checkmark)
- [ ] Success message below icon
- [ ] Earnings breakdown card
- [ ] Updated wallet balance card
- [ ] Transaction ID display
- [ ] Action buttons at bottom
- [ ] Info box at bottom

### Success Header

- [ ] Large green checkmark icon (96pt)
- [ ] Icon has circular green background (20% opacity)
- [ ] "Payment Received!" title (large, bold)
- [ ] "Your earnings have been added to your wallet" subtitle
- [ ] Section has success/celebration styling
- [ ] Confetti animation (optional)
- [ ] Header centered

### Earnings Breakdown Card

- [ ] Card displays receipt icon
- [ ] Card title: "Earnings Breakdown"
- [ ] Job title displays
- [ ] Job completion date shows
- [ ] "Total Payment" row: ₱10,500.00
- [ ] "Platform Fee (5%)" row: -₱525.00
- [ ] Fee amount in red/negative color
- [ ] Divider line between fee and net
- [ ] "You Received" row: ₱9,975.00 (bold, large)
- [ ] Net amount in green/positive color
- [ ] Timestamp displays: "November 14, 2025 at 3:36 PM"
- [ ] All amounts formatted as PHP
- [ ] Card has border and rounded corners

### Updated Wallet Balance Card

- [ ] Card displays wallet icon
- [ ] "Updated Wallet Balance" label
- [ ] New balance displays very large (36pt)
- [ ] Balance formatted as PHP (₱22,037.50)
- [ ] Balance amount in green/success color
- [ ] Card has gradient background
- [ ] Card has rounded corners
- [ ] Previous balance hint (optional): "Previous: ₱12,062.50"

### Transaction ID Display

- [ ] "Transaction ID" label shows
- [ ] Transaction ID displays in monospace font
- [ ] Format: "TXN-123456789" or similar
- [ ] ID styled in gray
- [ ] Copy icon next to ID (optional)
- [ ] Tapping ID copies to clipboard (optional)
- [ ] "Copied!" toast on copy

### Action Buttons

- [ ] "Share Receipt" button displays (outline style)
- [ ] Share icon in button
- [ ] "View Payment Timeline" button displays (outline style)
- [ ] Timeline icon in button
- [ ] "View All Earnings" button displays (filled style, blue)
- [ ] Earnings icon in button
- [ ] Buttons stacked vertically
- [ ] Buttons have consistent height
- [ ] Tapping share opens share sheet

### Share Receipt Functionality

- [ ] Share sheet opens with native options
- [ ] Share message includes:
  - [ ] "Payment Received - iAyos"
  - [ ] Job title
  - [ ] Total payment amount
  - [ ] Platform fee
  - [ ] Net received
  - [ ] Transaction ID
  - [ ] Date & time
  - [ ] "Thank you for using iAyos!"
- [ ] Share message formatted nicely
- [ ] Can share via SMS, Email, WhatsApp, etc.
- [ ] Sharing works on iOS
- [ ] Sharing works on Android

### Navigation Actions

- [ ] Tapping "View Payment Timeline" navigates to timeline screen
- [ ] Timeline screen shows correct job timeline
- [ ] Tapping "View All Earnings" navigates to earnings dashboard
- [ ] Close button (X) returns to previous screen or home

### Info Box

- [ ] Box at bottom with info icon (ℹ️)
- [ ] Background light blue/gray tint
- [ ] Text: "You can withdraw your earnings anytime from your wallet. Minimum withdrawal amount is ₱100."
- [ ] Text readable on background
- [ ] Box has rounded corners
- [ ] Box has padding

### Loading State

- [ ] If data loading, spinner shows
- [ ] "Loading payment details..." message
- [ ] Screen shows once data loaded

### Error State

- [ ] If API fails, error shows
- [ ] Can retry loading payment details

---

## 5. Cash Payment Verification Flow (Phase 4)

**File**: `components/CashPaymentPendingCard.tsx`

### Cash Pending Card Display

- [ ] Card displays on final payment screen (if cash selected)
- [ ] Card displays on payment status screen
- [ ] Card title: "Cash Payment Verification"
- [ ] Card has orange/yellow background tint
- [ ] Warning icon (⚠️) displays

### 3-Step Visual Timeline

- [ ] Timeline has 3 steps vertically
- [ ] Step 1: "Proof Submitted" - Green checkmark (✓)
- [ ] Step 2: "Admin Verification" - Yellow spinner (⏳)
- [ ] Step 3: "Payment Released" - Gray outline
- [ ] Connector lines between steps
- [ ] Active step highlighted
- [ ] Completed step has green styling
- [ ] Pending step has yellow/orange styling
- [ ] Upcoming step has gray styling

### Step 1: Proof Submitted

- [ ] Green checkmark icon
- [ ] "Proof Submitted" label (bold)
- [ ] Timestamp shows: "Nov 14, 2025 at 2:00 PM"
- [ ] Status: "Completed" in green

### Step 2: Admin Verification

- [ ] Yellow/orange spinner icon (animated)
- [ ] "Admin Verification" label (bold)
- [ ] "In Progress" subtitle
- [ ] Estimated time: "24-48 hours"
- [ ] Status: "Pending" in yellow

### Step 3: Payment Released

- [ ] Gray circle outline icon
- [ ] "Payment Released" label (gray)
- [ ] "Upcoming" subtitle
- [ ] No timestamp yet
- [ ] Status: "Awaiting" in gray

### Verification Info

- [ ] Info text: "Your cash payment proof is being verified by our admin team"
- [ ] Estimated verification time displays
- [ ] "You will be notified once verified" text
- [ ] Text readable on card background

### Loading Indicator

- [ ] Small loading spinner shows during verification
- [ ] "Verifying..." text displays
- [ ] Spinner animates smoothly

### Status Polling

- [ ] Screen auto-refreshes every 10 seconds
- [ ] Checks cash payment verification status
- [ ] Updates card when status changes
- [ ] Stops polling when verified
- [ ] Stops polling when failed

### Verified State

- [ ] When verified, card updates
- [ ] Step 2 shows green checkmark
- [ ] Step 3 activates (shows spinner or checkmark)
- [ ] Success toast notification shows
- [ ] "Payment verified!" message
- [ ] Can proceed to payment release

### Rejected State

- [ ] When rejected, card updates
- [ ] Step 2 shows red X icon
- [ ] "Verification Failed" status
- [ ] Reason displays (if provided)
- [ ] "Try Again" button shows
- [ ] Tapping try again returns to cash upload

---

## 6. Final Payment with Existing Phase 3 Screens

### GCash Payment (Final 50%)

- [ ] Navigate from final payment screen
- [ ] GCash screen displays with final amount (₱5,250)
- [ ] Payment summary shows "Final Payment (50% + 5%)"
- [ ] Xendit invoice created for final amount
- [ ] WebView displays correctly
- [ ] Complete test payment
- [ ] Success callback detected
- [ ] Final payment record created in backend
- [ ] Job status updates to "final_payment_received"
- [ ] Success toast notification
- [ ] Navigate to payment status or received screen

### Wallet Payment (Final 50%)

- [ ] Navigate from final payment screen
- [ ] Wallet screen displays with final amount (₱5,250)
- [ ] Wallet balance checks if sufficient
- [ ] Payment summary shows final breakdown
- [ ] Balance calculation shows: Current - ₱5,250 = Remaining
- [ ] Confirmation modal displays
- [ ] Confirm payment processes
- [ ] Wallet deduction occurs
- [ ] Final payment record created
- [ ] Success toast notification
- [ ] Balance updates to show deduction

### Cash Payment (Final 50%)

- [ ] Navigate from final payment screen
- [ ] Cash screen displays with final amount
- [ ] Instructions show final payment amount (₱5,250)
- [ ] Upload cash payment proof image
- [ ] Progress bar shows 0-100%
- [ ] Upload completes successfully
- [ ] Final payment record created with status "verifying"
- [ ] Navigate to pending verification screen
- [ ] Cash payment pending card displays
- [ ] 3-step timeline shows verification status

---

## 7. Component Testing

### FinalPaymentCard Component

- [ ] Renders in final payment screen
- [ ] Displays payment breakdown correctly
- [ ] Shows remaining 50% amount
- [ ] Shows platform fee (5%)
- [ ] Shows total amount
- [ ] Shows worker receives amount (optional)
- [ ] All amounts formatted as PHP
- [ ] Info notes display
- [ ] Card has proper styling

### PaymentReceivedCard Component

- [ ] Renders in payment received screen
- [ ] Displays earnings breakdown
- [ ] Shows job title and date
- [ ] Shows total payment amount
- [ ] Shows platform fee (negative, red)
- [ ] Shows net received (bold, green)
- [ ] Success icon displays
- [ ] Card has proper styling
- [ ] Amounts formatted correctly

### CashPaymentPendingCard Component

- [ ] Renders in payment status screen
- [ ] Renders in final payment flow (if cash)
- [ ] Displays 3-step timeline
- [ ] Step 1 shows completed (green checkmark)
- [ ] Step 2 shows in progress (yellow spinner)
- [ ] Step 3 shows upcoming (gray)
- [ ] Connector lines display
- [ ] Estimated time shows (24-48 hours)
- [ ] Info text displays
- [ ] Loading indicator animates

### PaymentTimelineItem Component

- [ ] Renders in timeline screen
- [ ] Displays event type with icon
- [ ] Shows amount if applicable
- [ ] Shows event description
- [ ] Displays relative timestamp ("2h ago")
- [ ] Displays absolute timestamp on tap/hover
- [ ] Color-coded by event type
- [ ] Proper spacing and styling

### PaymentTimelineConnector Component

- [ ] Renders between timeline events
- [ ] Vertical line displays
- [ ] Active state shows solid line
- [ ] Inactive state shows dashed/faded line
- [ ] Height adjustable
- [ ] Color matches theme
- [ ] No line after last event

### EarningsStatsCard Component

- [ ] Renders in earnings dashboard
- [ ] Displays 2x2 grid of stats
- [ ] Total earnings stat (wallet icon)
- [ ] Completed jobs stat (briefcase icon)
- [ ] Average per job stat (trending up icon)
- [ ] This month stat (calendar icon - optional)
- [ ] Icons color-coded
- [ ] Values formatted as PHP or numbers
- [ ] Labels display correctly
- [ ] Grid responsive

### EarningsHistoryItem Component

- [ ] Renders in earnings history list
- [ ] Displays job title (truncated if long)
- [ ] Shows date and relative timestamp
- [ ] Status badge displays with icon
- [ ] Status icon: checkmark (completed), clock (pending), X (failed)
- [ ] Gross amount displays
- [ ] Net amount displays
- [ ] Platform fee displays (red)
- [ ] Chevron arrow at right
- [ ] Tapping item triggers onPress callback
- [ ] Proper spacing and styling

---

## 8. Integration Testing

### End-to-End: Final Payment with GCash

- [ ] Complete Phase 3 escrow payment (₱5,250)
- [ ] Worker marks job complete
- [ ] Client approves completion
- [ ] Navigate to final payment screen
- [ ] See job completion header
- [ ] See final payment breakdown (₱5,250)
- [ ] See previous escrow payment card
- [ ] Select GCash payment method
- [ ] Tap "Proceed to Payment"
- [ ] GCash screen loads, invoice created
- [ ] Complete test payment in WebView
- [ ] Success detected, navigate to received screen
- [ ] Payment received screen shows earnings
- [ ] Wallet balance updates
- [ ] Transaction appears in history
- [ ] Payment timeline shows all events

### End-to-End: Final Payment with Wallet

- [ ] Ensure wallet has sufficient balance (₱6,000+)
- [ ] Complete job and get to final payment screen
- [ ] Wallet balance displays correctly
- [ ] Select Wallet payment method
- [ ] Tap "Proceed to Payment"
- [ ] Wallet screen shows balance breakdown
- [ ] Remaining balance calculates: Current - ₱5,250
- [ ] Tap "Confirm Payment"
- [ ] Confirmation modal appears
- [ ] Confirm payment in modal
- [ ] Payment processes
- [ ] Success toast notification
- [ ] Navigate to received screen
- [ ] Wallet balance updated (deducted ₱5,250)
- [ ] Earnings added to worker wallet
- [ ] Transaction in history

### End-to-End: Final Payment with Cash

- [ ] Complete job and get to final payment screen
- [ ] Select Cash payment method
- [ ] Tap "Proceed to Payment"
- [ ] Cash screen loads with instructions
- [ ] Instructions show final amount (₱5,250)
- [ ] Tap upload button
- [ ] Select camera or gallery
- [ ] Capture or select receipt photo
- [ ] Photo preview displays
- [ ] Tap "Submit for Verification"
- [ ] Upload progress 0-100%
- [ ] Upload completes
- [ ] Navigate to pending verification screen
- [ ] Cash payment pending card shows
- [ ] 3-step timeline: Submitted (✓), Verifying (⏳), Release (-)
- [ ] Admin approves payment (backend)
- [ ] Status polling detects approval
- [ ] Payment released to worker
- [ ] Navigate to received screen
- [ ] Transaction in history with "Completed" status

### End-to-End: Worker Earnings Dashboard

- [ ] Complete 3 jobs with final payments
- [ ] Navigate to worker earnings dashboard
- [ ] Total earnings displays sum of all jobs
- [ ] Available balance shows current wallet balance
- [ ] Pending payments shows unreleased amounts
- [ ] Completed jobs count matches
- [ ] Earnings history lists all earnings
- [ ] Filter by "Week" shows last 7 days
- [ ] Filter by "Month" shows last 30 days
- [ ] Filter by "All" shows all-time
- [ ] Pull-to-refresh updates all data
- [ ] Tap history item navigates to timeline
- [ ] Timeline shows correct job events

### End-to-End: Payment Timeline Full Journey

- [ ] Complete full job cycle (escrow + final)
- [ ] Navigate to payment timeline screen
- [ ] Timeline shows 8+ events in order:
  1. Escrow Payment Created
  2. Escrow Payment Received
  3. Job Started
  4. Job Marked Complete (Worker)
  5. Job Completion Approved (Client)
  6. Final Payment Initiated
  7. Final Payment Received
  8. Funds Released to Worker
- [ ] All timestamps display correctly
- [ ] All amounts display correctly
- [ ] Payment summary shows escrow + final totals
- [ ] Pull-to-refresh works
- [ ] Back/Home buttons navigate correctly

### End-to-End: Empty State to First Earning

- [ ] Log in as new worker with no earnings
- [ ] Navigate to earnings dashboard
- [ ] Empty state displays: "No Earnings Yet"
- [ ] "Browse Jobs" button shows
- [ ] Tap button, navigate to jobs tab
- [ ] Apply to a job, get accepted
- [ ] Client pays escrow, start job
- [ ] Mark job complete, client approves
- [ ] Client pays final payment
- [ ] Payment released to worker
- [ ] Navigate to earnings dashboard
- [ ] First earning displays in history
- [ ] Total earnings shows first amount
- [ ] Stats cards update from ₱0

---

## 9. Error Recovery Testing

### Insufficient Wallet Balance

- [ ] At final payment screen, wallet balance < ₱5,250
- [ ] Wallet method disabled, grayed out
- [ ] Warning message shows insufficient balance
- [ ] "Need ₱X more" displays
- [ ] Deposit button displays and works
- [ ] Navigate to deposit screen
- [ ] Deposit sufficient funds
- [ ] Return to final payment screen
- [ ] Wallet method now enabled

### Network Interruption During Final Payment

- [ ] Select GCash, proceed to payment
- [ ] During invoice creation, disconnect network
- [ ] Error alert shows "Network error"
- [ ] Reconnect network
- [ ] Retry invoice creation
- [ ] Succeeds after reconnection

### Final Payment API Failure

- [ ] Complete final payment flow
- [ ] If payment API fails (500 error)
- [ ] Error alert shows user-friendly message
- [ ] Can retry payment
- [ ] Second attempt succeeds
- [ ] Payment recorded correctly

### Timeline Loading Failure

- [ ] Navigate to payment timeline
- [ ] If API fails, error message shows
- [ ] "Failed to load timeline" displays
- [ ] Retry button visible
- [ ] Tap retry, timeline loads successfully

### Earnings Dashboard Loading Failure

- [ ] Navigate to earnings dashboard
- [ ] If API fails, error message shows
- [ ] "Failed to load earnings" displays
- [ ] Retry button visible
- [ ] Tap retry, dashboard loads successfully

### Cash Payment Verification Timeout

- [ ] Submit cash payment proof
- [ ] Wait 5 minutes (simulate delay)
- [ ] Pending card still shows "Verifying"
- [ ] Status polling continues
- [ ] No timeout error
- [ ] Admin approves later
- [ ] Status updates correctly

### Payment Received Screen Data Missing

- [ ] Navigate to payment received screen
- [ ] If job data missing, graceful handling
- [ ] Shows "Unknown Job" or placeholder
- [ ] Amount still displays correctly
- [ ] Transaction ID displays
- [ ] Doesn't crash

---

## 10. Performance Testing

### Load Times

- [ ] Final payment screen loads in < 1 second
- [ ] Payment timeline loads in < 2 seconds (10 events)
- [ ] Earnings dashboard loads in < 2 seconds
- [ ] Payment received screen loads in < 1 second
- [ ] Earnings history filter switches in < 500ms

### Responsiveness

- [ ] All button taps respond immediately (< 100ms)
- [ ] Scrolling smooth in timeline
- [ ] Scrolling smooth in earnings history
- [ ] Filter switching instant
- [ ] Pull-to-refresh smooth animation

### Memory Usage

- [ ] No memory leaks during payment flows
- [ ] Timeline screen handles 50+ events
- [ ] Earnings history handles 100+ items
- [ ] Can navigate between screens multiple times
- [ ] No crashes after 30+ minutes

### Auto-Refresh Performance

- [ ] Cash payment polling every 10s doesn't lag UI
- [ ] Battery usage acceptable during polling
- [ ] Polling stops when screen not visible
- [ ] Polling resumes when screen returns
- [ ] No excessive API calls

### Large Data Sets

- [ ] Earnings dashboard with 50+ completed jobs
- [ ] Timeline with 100+ events (multiple jobs)
- [ ] History list with 200+ earnings
- [ ] All load and scroll smoothly
- [ ] No performance degradation

---

## 11. Cross-Platform Testing

### iOS Specific

- [ ] Navigation animations smooth
- [ ] Status bar style correct
- [ ] Safe area insets respected (notch, home indicator)
- [ ] Haptic feedback on actions (optional)
- [ ] Share sheet displays iOS-native options
- [ ] Alert prompts show iOS-style
- [ ] Large text accessibility works
- [ ] Dynamic Type scales correctly
- [ ] VoiceOver announces content correctly

### Android Specific

- [ ] Navigation animations smooth
- [ ] System back button behavior correct
- [ ] Material Design styling consistent
- [ ] Share intent shows Android-native apps
- [ ] Alert dialogs show Material Design style
- [ ] TalkBack announces content correctly
- [ ] Large text accessibility works
- [ ] Keyboard avoidance works

---

## 12. Accessibility Testing

### Screen Reader (VoiceOver/TalkBack)

- [ ] All buttons have accessible labels
- [ ] Earnings amounts announced as currency
- [ ] Status badges announced with status name
- [ ] Timeline events announced in order
- [ ] Navigation flow logical with screen reader
- [ ] Icons have text alternatives
- [ ] Loading states announced

### Visual Accessibility

- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Status colors distinguishable (not color-only)
- [ ] Timeline uses shapes + colors for events
- [ ] Text sizes readable at default zoom
- [ ] Touch targets at least 44x44 points
- [ ] Can zoom text to 200% without breaking layout

---

## 13. Edge Cases & Boundary Testing

### Earnings Amounts

- [ ] ₱0 earnings displays as "₱0.00"
- [ ] Very large earning (₱999,999) displays correctly
- [ ] Negative amounts (fees) show minus sign and red color
- [ ] Decimal amounts round to 2 places (₱1,234.56)

### Timeline Events

- [ ] Job with only escrow (no final yet) shows partial timeline
- [ ] Job with failed payment shows failure event
- [ ] Job with refund shows refund event
- [ ] Very long job titles truncate in timeline
- [ ] Timeline with 1 event displays correctly
- [ ] Timeline with 100+ events scrolls smoothly

### Earnings History

- [ ] Empty week filter shows appropriate message
- [ ] Empty month filter shows appropriate message
- [ ] Single earning displays correctly
- [ ] 100+ earnings paginate or scroll smoothly
- [ ] Very long job titles truncate

### Timestamps

- [ ] Payment received < 1 min ago: "Just now"
- [ ] Payment 1 hour ago: "1h ago"
- [ ] Payment 1 day ago: "1d ago"
- [ ] Payment 7+ days ago: "Nov 7"
- [ ] Payment from previous year: "Dec 15, 2024"

### Wallet Balance

- [ ] Balance exactly equals final amount (₱5,250)
- [ ] Balance ₱1 less (₱5,249) - insufficient
- [ ] Balance ₱1 more (₱5,251) - sufficient
- [ ] Zero balance (₱0) - wallet disabled
- [ ] Very large balance (₱999,999) displays correctly

---

## 14. Security & Data Integrity

### Payment Security

- [ ] Final payment amount validated on backend
- [ ] Cannot pay final before escrow
- [ ] Cannot pay final twice for same job
- [ ] Payment amounts match job budget
- [ ] Transaction IDs unique and not predictable
- [ ] Cannot manipulate payment amounts via frontend

### Earnings Security

- [ ] Worker can only view their own earnings
- [ ] Cannot access other workers' earnings
- [ ] Earnings amounts calculated on backend
- [ ] Platform fee deducted correctly (5%)
- [ ] Cannot modify earnings in frontend

### Timeline Security

- [ ] Timeline shows only authorized user's data
- [ ] Cannot view other users' payment timelines
- [ ] Timeline events immutable
- [ ] Timestamps accurate and not modifiable

### Data Privacy

- [ ] Payment received screen shows only worker's data
- [ ] Transaction IDs don't expose sensitive info
- [ ] Shared receipts don't include private data

---

## 15. Business Logic Validation

### Two-Phase Payment Calculation

- [ ] Job budget: ₱10,000
- [ ] Escrow (50%): ₱5,000
- [ ] Escrow fee (5%): ₱250
- [ ] Escrow total: ₱5,250 ✓
- [ ] Final (50%): ₱5,000
- [ ] Final fee (5%): ₱250
- [ ] Final total: ₱5,250 ✓
- [ ] Client total paid: ₱10,500 ✓
- [ ] Worker gross: ₱10,000
- [ ] Platform fee (5% of gross): ₱500
- [ ] Worker net received: ₱9,500 ✓

### Worker Earnings Calculation

- [ ] Total earnings = Sum of all job gross amounts
- [ ] Available balance = Wallet balance (released payments)
- [ ] Pending payments = Payments not yet released
- [ ] Completed jobs count = Jobs with status COMPLETED
- [ ] Average per job = Total earnings / Completed jobs
- [ ] All calculations match backend data

### Payment Status Transitions

- [ ] Job starts: IN_PROGRESS
- [ ] Escrow paid: escrowPaid = true
- [ ] Job marked complete (worker): workerMarkedComplete = true
- [ ] Job approved (client): clientMarkedComplete = true, status = COMPLETED
- [ ] Final payment initiated: finalPaymentPaid = false
- [ ] Final payment received: finalPaymentPaid = true
- [ ] Payment released to worker: releasedToWorker = true
- [ ] All status transitions logged in timeline

---

## Summary Checklist

### Critical Paths (Must Pass)

- [ ] Complete final payment with GCash successfully
- [ ] Complete final payment with Wallet successfully
- [ ] Complete final payment with Cash successfully
- [ ] View payment received screen correctly
- [ ] View payment timeline with all events
- [ ] View earnings dashboard with correct totals
- [ ] View earnings history with all earnings
- [ ] Filter earnings history (Week/Month/All)

### High Priority (Should Pass)

- [ ] All amounts calculate correctly
- [ ] All amounts formatted as PHP currency
- [ ] All timestamps display correctly
- [ ] Worker receives correct net amount (minus 5% fee)
- [ ] Cash payment verification workflow works
- [ ] Pull-to-refresh updates all data
- [ ] Share receipt functionality works
- [ ] Navigation between screens smooth

### Medium Priority

- [ ] Animations smooth (60fps)
- [ ] Loading indicators show appropriately
- [ ] Empty states display correctly
- [ ] Error messages user-friendly
- [ ] Retry buttons work after errors

### Low Priority

- [ ] Edge cases handled gracefully
- [ ] Large data sets perform well
- [ ] Accessibility features work
- [ ] Very long text truncates

---

## Sign-Off

**QA Tester**: ________________
**Date**: ________________
**Pass Rate**: ____ / ____ tests passed
**Critical Issues Found**: ____
**High Priority Issues**: ____
**Medium Priority Issues**: ____
**Low Priority Issues**: ____

**Approved for Production**: [ ] YES [ ] NO
**Comments**: ________________________________________

---

**Last Updated**: November 14, 2025
**Phase**: 4 - Final Payment & Worker Earnings System
**Implementation Status**: ✅ Complete
**Documentation**: `docs/01-completed/mobile/PHASE_4_FINAL_PAYMENT_COMPLETE.md`
