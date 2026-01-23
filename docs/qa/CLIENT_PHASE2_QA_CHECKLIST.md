# 🧪 QA Testing Checklist - Client Phase 2 (Client Perspective)

**Testing Date:** November 13, 2025  
**Phase:** Client Phase 2 - Agency Selection & INVITE Workflow  
**Tester Role:** CLIENT USER  
**Test Environment:** Development (Docker containers)

---

## 📋 Pre-Testing Setup

### Account Requirements

- [ ] **Have a CLIENT account** created and logged in
- [ ] **Verify you're logged in** by checking the dashboard displays "CLIENT" role
- [ ] **Check wallet balance** - ensure you have at least ₱5,000 for testing payments
- [ ] **Browser:** Use Chrome/Edge (latest version) for testing
- [ ] **Device:** Test on desktop first, then mobile

### Test Data Preparation

- [ ] **At least 3 agencies** should exist in the system with KYC verified status
- [ ] **Each agency should have**:
  - Complete profiles (business name, description, logo)
  - Different service categories (Plumbing, Electrical, Construction)
  - Ratings between 3.0-5.0 stars
  - Team members (3-10 employees)
  - At least 1 review
- [ ] **Have GCash test account** credentials ready (for payment testing)
- [ ] **Test materials list** ready (e.g., "Cement", "Paint", "Nails")

---

## 1️⃣ Agency Profile - Hire Button Integration

### Test: Locate "Hire This Agency" Button

1. [ ] Navigate to **`/dashboard/home`**
2. [ ] Switch to **🏢 Agencies** tab
3. [ ] Click **"View Agency Profile"** on any agency card
4. [ ] Verify navigation to **`/dashboard/agencies/{id}`**
5. [ ] Locate the **"Hire This Agency"** button on profile page
6. [ ] Verify button is **prominently displayed** (primary color, large size)

**Expected Result:**

- ✅ Button is visible near top of page (after agency header)
- ✅ Button stands out with primary color (blue/green)
- ✅ Button text is clear: "Hire This Agency" or "Invite to Job"
- ✅ Button has hover effect (color change on mouseover)

**Screenshot:** Take a screenshot showing the hire button on agency profile

---

### Test: Hire Button Click - Modal Opens

1. [ ] Click **"Hire This Agency"** button
2. [ ] Verify **InviteJobCreationModal** opens
3. [ ] Verify modal has **overlay** (darkened background)
4. [ ] Verify modal is **centered** on screen
5. [ ] Verify **agency name is pre-filled** or displayed in modal header

**Expected Result:**

- ✅ Modal opens smoothly (slide-in or fade-in animation)
- ✅ Background is dimmed/overlayed
- ✅ Modal is responsive (fits screen on mobile)
- ✅ Agency context is preserved (name/logo visible)
- ✅ Close button (X) is visible in top-right corner

**Screenshot:** Take a screenshot of the opened modal (Step 1 visible)

---

## 2️⃣ Multi-Step Job Creation Workflow

### Test: Step 1 - Job Details

Verify the following fields are present:

- [ ] **Job Title** input field
  - [ ] Placeholder text suggests example (e.g., "Fix kitchen plumbing")
  - [ ] Character counter shows (e.g., "0/100")
- [ ] **Description** textarea
  - [ ] Multi-line input (at least 3 rows visible)
  - [ ] Placeholder suggests detail (e.g., "Describe the work needed...")
  - [ ] Character counter shows (e.g., "0/500")
- [ ] **Category** dropdown
  - [ ] Dropdown displays service categories (Plumbing, Electrical, etc.)
  - [ ] Default option: "Select a category"
- [ ] **Budget** input field
  - [ ] Currency symbol (₱) displayed
  - [ ] Numeric input only
  - [ ] Placeholder: "Enter budget amount"
- [ ] **Next** button at bottom
  - [ ] Disabled if fields incomplete (grayed out)

**Expected Result:**

- ✅ All fields are clearly labeled
- ✅ Input validation prevents empty submission
- ✅ Budget accepts only numbers (no letters)
- ✅ Character counters update in real-time

---

### Test: Step 1 - Form Validation

1. [ ] Leave **Title** empty, click **Next**
   - [ ] Verify error message: "Title must be at least 10 characters"
2. [ ] Enter **5 characters** in Title, click **Next**
   - [ ] Verify error message persists
3. [ ] Enter **valid title** (10+ chars), leave **Description** empty
   - [ ] Verify error message: "Description must be at least 50 characters"
4. [ ] Fill **Title** and **Description**, leave **Category** unselected
   - [ ] Verify error message: "Please select a category"
5. [ ] Fill all fields, leave **Budget** empty or zero
   - [ ] Verify error message: "Budget must be greater than 0"
6. [ ] Fill **all fields correctly**, click **Next**
   - [ ] Verify modal advances to **Step 2**

**Expected Result:**

- ✅ Error messages display near relevant field (red text)
- ✅ Next button remains disabled until all validations pass
- ✅ No console errors when validation fails
- ✅ Smooth transition to Step 2 (no page reload)

**Screenshot:** Take a screenshot showing validation error for empty Title

---

### Test: Step 2 - Additional Details

Verify the following fields are present:

- [ ] **Location** input field
  - [ ] Text input or autocomplete (if Google Maps integrated)
  - [ ] Placeholder: "Enter job location"
- [ ] **Duration** input field
  - [ ] Numeric input
  - [ ] Unit selector (Hours / Days / Weeks)
  - [ ] Example: "5" with "Days" selected
- [ ] **Start Date** date picker
  - [ ] Calendar icon triggers date picker
  - [ ] Prevents selection of past dates
  - [ ] Default: Today or tomorrow
- [ ] **Urgency** radio buttons or dropdown
  - [ ] Options: LOW / MEDIUM / HIGH
  - [ ] Visual distinction (colors or icons)
- [ ] **Materials Needed** section
  - [ ] Input field to add material
  - [ ] "Add Material" button
  - [ ] List of added materials below
  - [ ] Delete button (X) for each material
- [ ] **Back** and **Next** buttons at bottom

**Expected Result:**

- ✅ All fields are clearly labeled
- ✅ Date picker opens on click
- ✅ Duration unit selector works (dropdown or radio)
- ✅ Urgency selection is clear (visual feedback)
- ✅ Materials list updates dynamically

---

### Test: Step 2 - Materials Management

1. [ ] Enter **"Cement"** in materials input, click **Add Material**
   - [ ] Verify "Cement" appears in list below
2. [ ] Add **3 more materials** (e.g., "Paint", "Nails", "Brushes")
   - [ ] Verify all 4 materials display in list
3. [ ] Click **delete (X)** on "Nails"
   - [ ] Verify "Nails" is removed from list
4. [ ] Try to add **empty material** (blank input)
   - [ ] Verify error message: "Material name cannot be empty"
5. [ ] Add **duplicate material** (e.g., "Cement" again)
   - [ ] Verify: Either prevented, or allowed with duplicate indicator

**Expected Result:**

- ✅ Materials add instantly (no delay)
- ✅ Delete works immediately
- ✅ List updates without page reload
- ✅ Input field clears after adding material
- ✅ At least 10 materials can be added (no arbitrary limit)

**Screenshot:** Take a screenshot showing Step 2 with 3 materials added

---

### Test: Step 2 - Navigation

1. [ ] Click **Back** button
   - [ ] Verify return to **Step 1**
   - [ ] Verify **previously entered data persists** (title, description, etc.)
2. [ ] Click **Next** again to return to **Step 2**
   - [ ] Verify **Step 2 data persists** (location, materials, etc.)
3. [ ] Fill all Step 2 fields, click **Next**
   - [ ] Verify modal advances to **Step 3**

**Expected Result:**

- ✅ Back navigation works smoothly
- ✅ Form data is NOT lost when navigating between steps
- ✅ Step indicator updates (e.g., "Step 2 of 4" → "Step 3 of 4")
- ✅ Progress bar/stepper updates visually

---

### Test: Step 3 - Payment Method Selection

Verify the following options are present:

- [ ] **Payment Method Selector**
  - [ ] Radio buttons or cards for: **WALLET** and **GCASH**
  - [ ] Visual distinction (icons for wallet and GCash logo)
- [ ] **Wallet Option Details**
  - [ ] Displays **current wallet balance** (e.g., "Balance: ₱15,000")
  - [ ] Shows **50% downpayment amount** (calculated from budget)
  - [ ] Example: If budget is ₱10,000, shows "Downpayment: ₱5,000"
- [ ] **GCash Option Details**
  - [ ] GCash logo displayed
  - [ ] Text: "Pay via GCash" or "GCash Payment Link"
- [ ] **Back** and **Next** buttons at bottom

**Expected Result:**

- ✅ Both payment methods are clearly presented
- ✅ Wallet balance is accurate (matches `/accounts/wallet-balance` API)
- ✅ Downpayment calculation is correct (50% of budget)
- ✅ Only one payment method can be selected at a time

**Screenshot:** Take a screenshot of Step 3 showing payment options

---

### Test: Step 3 - Wallet Payment (Sufficient Balance)

1. [ ] Ensure wallet balance ≥ 50% of job budget (e.g., ₱5,000 balance, ₱8,000 job = ₱4,000 downpayment)
2. [ ] Select **WALLET** payment method
3. [ ] Verify **Next button is enabled**
4. [ ] Click **Next**
5. [ ] Verify modal advances to **Step 4 (Confirmation)**

**Expected Result:**

- ✅ Wallet option is selectable
- ✅ No error messages
- ✅ Downpayment amount is highlighted (e.g., "You will pay: ₱4,000")
- ✅ Smooth transition to Step 4

---

### Test: Step 3 - Wallet Payment (Insufficient Balance)

1. [ ] Ensure wallet balance **< 50%** of job budget (e.g., ₱2,000 balance, ₱10,000 job = ₱5,000 downpayment needed)
2. [ ] Select **WALLET** payment method
3. [ ] Verify **error message displays**: "Insufficient wallet balance. Please deposit funds or choose GCash."
4. [ ] Verify **Next button is disabled** (grayed out)
5. [ ] Click **"Deposit Funds"** link (if present)
   - [ ] Verify navigation to wallet deposit page OR deposit modal opens

**Expected Result:**

- ✅ Error message is clear and actionable
- ✅ User cannot proceed with insufficient funds
- ✅ Deposit link/button is visible and works
- ✅ GCash remains available as alternative

**Screenshot:** Take a screenshot showing insufficient balance error

---

### Test: Step 3 - GCash Payment Selection

1. [ ] Select **GCASH** payment method
2. [ ] Verify **50% downpayment amount** displays (e.g., "You will pay: ₱5,000 via GCash")
3. [ ] Verify **Next button is enabled**
4. [ ] Click **Next**
5. [ ] Verify modal advances to **Step 4 (Confirmation)**

**Expected Result:**

- ✅ GCash option is selectable
- ✅ Payment amount is clear
- ✅ No wallet balance check required for GCash
- ✅ Smooth transition to Step 4

---

### Test: Step 4 - Confirmation & Submission

Verify the following information displays:

- [ ] **Job Summary Section**
  - [ ] Job Title (entered in Step 1)
  - [ ] Description (truncated if long, with "Read more" if needed)
  - [ ] Category badge/tag
  - [ ] Location
  - [ ] Start Date (formatted: "Nov 15, 2025")
  - [ ] Duration (e.g., "5 Days")
  - [ ] Urgency indicator (LOW/MEDIUM/HIGH with color)
- [ ] **Materials List**
  - [ ] All added materials display (e.g., "Cement, Paint, Brushes")
  - [ ] Or message: "No materials specified"
- [ ] **Agency Information**
  - [ ] Agency name
  - [ ] Agency logo (small)
  - [ ] Rating (e.g., ⭐⭐⭐⭐⭐ 4.7)
- [ ] **Payment Summary**
  - [ ] Total Budget: ₱10,000
  - [ ] Downpayment (50%): ₱5,000
  - [ ] Remaining (50%): ₱5,000 (payable after completion)
  - [ ] Payment Method: WALLET or GCASH (as selected)
- [ ] **Action Buttons**
  - [ ] **Back** button (return to Step 3)
  - [ ] **Confirm & Create Job** button (primary CTA)
  - [ ] **Cancel** button (close modal)

**Expected Result:**

- ✅ All information is accurate and matches entered data
- ✅ Summary is readable and well-formatted
- ✅ Payment breakdown is clear (50/50 split)
- ✅ Primary button stands out (bright color, bold text)

**Screenshot:** Take a screenshot of the full Step 4 confirmation screen

---

### Test: Step 4 - Job Submission (Wallet Payment)

1. [ ] Ensure **WALLET** was selected in Step 3
2. [ ] Click **"Confirm & Create Job"** button
3. [ ] Verify **loading indicator** shows (button disabled, spinner visible)
4. [ ] Wait for API response (should take 1-3 seconds)
5. [ ] Verify **success message** displays (e.g., "Job created successfully!")
6. [ ] Verify modal **closes automatically** or shows success screen with "View Job" button

**Expected Result:**

- ✅ Submission shows loading state
- ✅ API call succeeds (check Network tab: `POST /api/jobs/create-invite`)
- ✅ Wallet balance is deducted (check new balance)
- ✅ Success message is clear and positive
- ✅ User is redirected to **My Invite Jobs** page OR job detail page

**API Verification (DevTools Network Tab):**

- [ ] Request URL: `POST /api/jobs/create-invite`
- [ ] Request Payload includes:
  - [ ] `title`, `description`, `category`, `budget`
  - [ ] `location`, `duration`, `startDate`, `urgency`
  - [ ] `materialsNeeded` (array)
  - [ ] `assignedAgencyFK` (agency ID)
  - [ ] `jobType`: "INVITE"
  - [ ] `paymentMethod`: "WALLET"
- [ ] Response Status: **201 Created**
- [ ] Response includes `jobId`, `inviteStatus`: "PENDING", `escrowPaid`: true

**Screenshot:** Take a screenshot of success message

---

### Test: Step 4 - Job Submission (GCash Payment)

1. [ ] Ensure **GCASH** was selected in Step 3
2. [ ] Click **"Confirm & Create Job"** button
3. [ ] Verify **loading indicator** shows
4. [ ] Wait for API response
5. [ ] Verify **GCash payment URL** is generated
6. [ ] Verify **redirect message** displays (e.g., "Redirecting to GCash payment page...")
7. [ ] Verify **redirect occurs** (opens GCash checkout in new tab or same tab)

**Expected Result:**

- ✅ API call succeeds (check Network tab: `POST /api/jobs/create-invite`)
- ✅ Response includes `paymentUrl` (Xendit checkout link)
- ✅ User is redirected to GCash checkout page
- ✅ Checkout page displays correct amount (50% downpayment)

**API Verification:**

- [ ] Request Payload includes `paymentMethod`: "GCASH"
- [ ] Response Status: **201 Created**
- [ ] Response includes `paymentUrl` (Xendit link)
- [ ] Response includes `jobId`, `inviteStatus`: "PENDING", `escrowPaid`: false

**Screenshot:** Take a screenshot of GCash checkout page (if accessible in test environment)

---

### Test: Step 4 - Cancel Job Creation

1. [ ] Click **"Cancel"** button (or X in top-right corner)
2. [ ] Verify **confirmation dialog** displays (e.g., "Are you sure? All entered data will be lost.")
3. [ ] Click **"Cancel"** in dialog (abort cancellation)
   - [ ] Verify modal remains open
4. [ ] Click **"Cancel"** again, then **"Yes, Cancel"** in dialog
   - [ ] Verify modal closes
   - [ ] Verify no API call is made
   - [ ] Verify no wallet deduction

**Expected Result:**

- ✅ Confirmation dialog prevents accidental cancellation
- ✅ User can abort cancellation
- ✅ Full cancellation closes modal cleanly
- ✅ No data is submitted if cancelled

---

## 3️⃣ My Invite Jobs Dashboard

### Test: Access My Invite Jobs Page

1. [ ] After successful job creation, verify redirect to **`/client/my-invite-jobs`**
   - [ ] OR manually navigate to **`/client/my-invite-jobs`** via sidebar/navigation
2. [ ] Verify page loads without errors
3. [ ] Verify page displays **tabs at the top**:
   - [ ] **ALL** (default)
   - [ ] **PENDING**
   - [ ] **ACCEPTED**
   - [ ] **REJECTED**
4. [ ] Verify **job cards** display below tabs

**Expected Result:**

- ✅ Page loads in <2 seconds
- ✅ Tabs are clearly visible and styled
- ✅ Default tab is "ALL" (highlighted/active)
- ✅ Job cards display (or "No invite jobs found" message)

**Screenshot:** Take a screenshot of My Invite Jobs page with ALL tab active

---

### Test: Tab Filtering - ALL Tab

1. [ ] Verify **ALL** tab is active by default (highlighted)
2. [ ] Verify **all INVITE jobs** display (regardless of status)
3. [ ] Count the job cards, verify number matches expected jobs

**Expected Result:**

- ✅ Tab displays all jobs (PENDING + ACCEPTED + REJECTED)
- ✅ Jobs are sorted (newest first, or by relevance)
- ✅ No duplicate cards

---

### Test: Tab Filtering - PENDING Tab

1. [ ] Click **PENDING** tab
2. [ ] Verify **only jobs with inviteStatus = PENDING** display
3. [ ] Verify jobs with ACCEPTED or REJECTED status are hidden
4. [ ] Verify **badge** on each card shows "PENDING" (yellow/orange color)

**Expected Result:**

- ✅ Filter applies correctly
- ✅ Job count updates (e.g., "5 Pending Invites")
- ✅ Tab switches smoothly (no page reload)
- ✅ Status badge is visible and color-coded

**Screenshot:** Take a screenshot of PENDING tab with filtered jobs

---

### Test: Tab Filtering - ACCEPTED Tab

1. [ ] Click **ACCEPTED** tab
2. [ ] Verify **only jobs with inviteStatus = ACCEPTED** display
3. [ ] Verify **badge** on each card shows "ACCEPTED" (green color)
4. [ ] Verify jobs show **acceptance timestamp** (e.g., "Accepted on Nov 12, 2025")

**Expected Result:**

- ✅ Filter applies correctly
- ✅ Only accepted jobs display
- ✅ Green status badge is clear
- ✅ Acceptance date is formatted properly

---

### Test: Tab Filtering - REJECTED Tab

1. [ ] Click **REJECTED** tab
2. [ ] Verify **only jobs with inviteStatus = REJECTED** display
3. [ ] Verify **badge** on each card shows "REJECTED" (red color)
4. [ ] Verify jobs show **rejection reason** (if provided by agency)
5. [ ] Verify jobs show **rejection timestamp** (e.g., "Rejected on Nov 11, 2025")

**Expected Result:**

- ✅ Filter applies correctly
- ✅ Only rejected jobs display
- ✅ Red status badge is visible
- ✅ Rejection reason displays (if exists), or "No reason provided"
- ✅ Rejection date is formatted properly

**Screenshot:** Take a screenshot of REJECTED tab with rejection reason visible

---

## 4️⃣ InviteJobCard Component Testing

### Test: Card Header - Basic Information

For each **InviteJobCard**, verify the following:

- [ ] **Job Title** displays prominently (bold, large font)
- [ ] **Status Badge** displays in top-right corner:
  - [ ] PENDING: Yellow/orange badge, text "Pending"
  - [ ] ACCEPTED: Green badge, text "Accepted"
  - [ ] REJECTED: Red badge, text "Rejected"
- [ ] **Category Badge** displays (e.g., "Plumbing", "Electrical")
- [ ] **Urgency Indicator** displays with color:
  - [ ] LOW: Gray or blue
  - [ ] MEDIUM: Yellow/orange
  - [ ] HIGH: Red

**Expected Result:**

- ✅ Title is readable and not truncated (or has tooltip if long)
- ✅ Status badge matches job's actual inviteStatus
- ✅ Category and urgency are clearly visible
- ✅ Colors are consistent across all cards

**Screenshot:** Take a screenshot showing 3 job cards with different statuses

---

### Test: Card Body - Job Details

Verify the following details display:

- [ ] **Description** (first 100-150 characters, "Read more" if truncated)
- [ ] **Location** with pin icon (📍)
- [ ] **Start Date** (formatted: "Starts Nov 15, 2025")
- [ ] **Duration** (e.g., "5 Days")
- [ ] **Budget** (formatted: "₱10,000")

**Expected Result:**

- ✅ All details are clearly readable
- ✅ Dates are formatted consistently (e.g., "Nov 15, 2025")
- ✅ Budget has currency symbol and commas (₱10,000, not ₱10000)
- ✅ Icons are visible and intuitive

---

### Test: Card Body - Invite Target (Agency/Worker)

- [ ] **Agency information** displays:
  - [ ] Agency name (e.g., "ABC Construction Agency")
  - [ ] Agency logo (small icon/avatar)
  - [ ] Agency icon (🏢) if no logo
  - [ ] Rating (e.g., ⭐ 4.7)
- [ ] **Link to agency profile** (if clickable)

**Expected Result:**

- ✅ Agency info is prominent (user knows WHO they invited)
- ✅ Logo displays correctly (or fallback icon)
- ✅ Agency name is clickable (opens profile in new tab or modal)

---

### Test: Card Body - Payment Status

Verify the following payment information displays:

- [ ] **Total Budget**: ₱10,000
- [ ] **Downpayment (50%)**: ₱5,000
  - [ ] **Paid status**: ✅ Paid (green checkmark) OR ⏳ Pending (yellow icon)
- [ ] **Remaining (50%)**: ₱5,000
  - [ ] Status: "Payable after completion" (gray text)
- [ ] **Payment Method**: WALLET or GCASH (as used)

**Expected Result:**

- ✅ Payment breakdown is clear (50/50 split)
- ✅ Paid status is visually distinct (checkmark or icon)
- ✅ Remaining amount is clearly labeled as "not yet paid"
- ✅ Payment method is visible (helps user remember how they paid)

---

### Test: Card Body - Materials Needed

- [ ] **Materials section** displays
- [ ] **List of materials** shows (comma-separated or bulleted)
- [ ] Example: "Cement, Paint, Nails, Brushes"
- [ ] If no materials: "No materials specified"

**Expected Result:**

- ✅ Materials display clearly
- ✅ Long lists are truncated (e.g., "Cement, Paint, +3 more")
- ✅ Expandable if truncated ("Show all" link)

---

### Test: Card Body - Response Information (ACCEPTED)

For **ACCEPTED** jobs, verify:

- [ ] **Acceptance message** displays (e.g., "Agency accepted your invite!")
- [ ] **Accepted timestamp** (e.g., "Accepted on Nov 12, 2025 at 2:30 PM")
- [ ] **Next steps message** (optional, e.g., "Work will begin on Nov 15, 2025")

**Expected Result:**

- ✅ Acceptance message is positive and clear
- ✅ Timestamp is accurate and formatted properly
- ✅ User understands what happens next

---

### Test: Card Body - Response Information (REJECTED)

For **REJECTED** jobs, verify:

- [ ] **Rejection message** displays (e.g., "Agency declined your invite")
- [ ] **Rejection reason** displays (if provided by agency)
  - [ ] Example: "Unable to complete within requested timeframe"
  - [ ] If no reason: "No reason provided"
- [ ] **Rejected timestamp** (e.g., "Rejected on Nov 11, 2025 at 4:15 PM")
- [ ] **Action suggestion** (optional, e.g., "You can invite another agency")

**Expected Result:**

- ✅ Rejection message is clear but not harsh
- ✅ Reason is displayed prominently (if exists)
- ✅ Timestamp is accurate
- ✅ User understands they can take further action

**Screenshot:** Take a screenshot of a REJECTED job card showing rejection reason

---

### Test: Card Footer - Action Buttons (PENDING)

For **PENDING** jobs, verify:

- [ ] **"View Details"** button displays
- [ ] **"Cancel Invite"** button displays (secondary, red or gray)
- [ ] Both buttons are clickable

**Expected Result:**

- ✅ View Details button is primary style (blue/green)
- ✅ Cancel button is secondary style (red/gray, outlined)
- ✅ Buttons are adequately sized for touch (min 44x44px)

---

### Test: Card Footer - Action Buttons (ACCEPTED)

For **ACCEPTED** jobs, verify:

- [ ] **"View Details"** button displays
- [ ] **"Start Chat"** button displays (if messaging enabled)
- [ ] **"Cancel Job"** button may still be available (with confirmation)

**Expected Result:**

- ✅ View Details remains primary action
- ✅ Chat button is visible if messaging integrated
- ✅ Cancel is deemphasized (user should proceed, not cancel)

---

### Test: Card Footer - Action Buttons (REJECTED)

For **REJECTED** jobs, verify:

- [ ] **"View Details"** button displays
- [ ] **"Delete"** or **"Archive"** button displays (secondary)
- [ ] **"Invite Another Agency"** button (optional enhancement)

**Expected Result:**

- ✅ View Details works
- ✅ Delete/Archive removes card from view
- ✅ User can easily move on to next agency

---

### Test: View Details Button

1. [ ] Click **"View Details"** on any job card
2. [ ] Verify navigation to **job detail page** OR **modal opens**
3. [ ] Verify **all job information** displays:
   - [ ] Full description (not truncated)
   - [ ] Complete materials list
   - [ ] Agency information
   - [ ] Payment breakdown
   - [ ] Status timeline (optional: PENDING → ACCEPTED/REJECTED)
4. [ ] Verify **Back** or **Close** button works

**Expected Result:**

- ✅ Detail view shows complete job information
- ✅ Navigation works smoothly
- ✅ User can easily return to job list

---

## 5️⃣ Job Cancellation & Refunds

### Test: Cancel Invite (PENDING Job, Wallet Payment)

1. [ ] Locate a **PENDING** job that was paid via **WALLET**
2. [ ] Click **"Cancel Invite"** button on job card
3. [ ] Verify **confirmation dialog** displays:
   - [ ] Message: "Are you sure you want to cancel this invite? Your downpayment (₱5,000) will be refunded to your wallet."
   - [ ] Buttons: "Yes, Cancel Invite" and "No, Keep It"
4. [ ] Click **"No, Keep It"**
   - [ ] Verify dialog closes, no action taken
5. [ ] Click **"Cancel Invite"** again, then **"Yes, Cancel Invite"**
6. [ ] Verify **loading indicator** shows
7. [ ] Wait for API response (2-5 seconds)
8. [ ] Verify **success message**: "Invite cancelled. ₱5,000 refunded to your wallet."
9. [ ] Verify job card **updates to CANCELLED status** or **is removed from list**
10. [ ] Verify **wallet balance increased** by refund amount

**Expected Result:**

- ✅ Confirmation dialog prevents accidental cancellation
- ✅ API call succeeds (`DELETE /api/jobs/{id}/cancel`)
- ✅ Wallet balance updates immediately (or after page refresh)
- ✅ Refund transaction appears in wallet history
- ✅ Job status updates to CANCELLED

**API Verification (DevTools Network Tab):**

- [ ] Request URL: `DELETE /api/jobs/{id}/cancel`
- [ ] Response Status: **200 OK**
- [ ] Response includes: `refundAmount`, `newWalletBalance`, `transactionId`

**Screenshot:** Take a screenshot of confirmation dialog and success message

---

### Test: Cancel Invite (PENDING Job, GCash Payment)

1. [ ] Locate a **PENDING** job that was paid via **GCASH**
2. [ ] Click **"Cancel Invite"** button
3. [ ] Verify **confirmation dialog** displays:
   - [ ] Message: "Refund will be processed to your GCash account within 3-5 business days."
4. [ ] Click **"Yes, Cancel Invite"**
5. [ ] Verify **success message**: "Invite cancelled. Refund will be processed to GCash within 3-5 business days."
6. [ ] Verify job status updates to CANCELLED

**Expected Result:**

- ✅ GCash refund message is clear (different from Wallet)
- ✅ User understands refund timeline (3-5 days)
- ✅ Job is cancelled successfully
- ✅ Refund is initiated (check backend logs if accessible)

---

### Test: Cannot Cancel Accepted Job

1. [ ] Locate an **ACCEPTED** job
2. [ ] Attempt to click **"Cancel Job"** (if button exists)
3. [ ] Verify **confirmation dialog** displays with **stricter warning**:
   - [ ] Message: "Work has been accepted. Cancelling now may incur penalties. Are you sure?"
4. [ ] If cancellation is allowed, verify **penalty deduction** or **partial refund**
5. [ ] If cancellation is NOT allowed, verify **error message**: "Cannot cancel after agency acceptance. Please contact support."

**Expected Result:**

- ✅ Accepted jobs have stricter cancellation rules
- ✅ User is warned about consequences
- ✅ Penalties are clearly communicated (if applicable)
- ✅ Support contact info is provided if cancellation blocked

---

### Test: Cannot Cancel In-Progress or Completed Jobs

1. [ ] Attempt to cancel a job with status **IN_PROGRESS** or **COMPLETED**
2. [ ] Verify **cancel button is hidden** or **disabled** (grayed out)
3. [ ] If button is clickable, verify **error message**: "Cannot cancel jobs that are in progress or completed."

**Expected Result:**

- ✅ Cancel is not available for advanced job statuses
- ✅ UI prevents accidental clicks (button hidden/disabled)
- ✅ Error message is clear if user tries

---

## 6️⃣ Payment Flow Testing

### Test: Wallet Balance Deduction (After Job Creation)

1. [ ] Note **wallet balance** before job creation (e.g., ₱15,000)
2. [ ] Create a job with **₱10,000 budget** (₱5,000 downpayment)
3. [ ] After successful job creation, check **wallet balance**
4. [ ] Verify balance decreased by **₱5,000** (new balance: ₱10,000)
5. [ ] Navigate to **Wallet Transactions** page
6. [ ] Verify **transaction record** exists:
   - [ ] Type: "Job Downpayment" or "Escrow Payment"
   - [ ] Amount: -₱5,000 (negative/debit)
   - [ ] Description: "Job: [Job Title]"
   - [ ] Date: Current date/time
   - [ ] Status: Completed

**Expected Result:**

- ✅ Wallet deduction is accurate (50% of budget)
- ✅ Balance updates immediately (or after 1-2 seconds)
- ✅ Transaction history reflects the payment
- ✅ No duplicate transactions

**Screenshot:** Take a screenshot of wallet transaction showing downpayment

---

### Test: GCash Payment Completion (Successful)

1. [ ] Create a job with **GCASH** payment method
2. [ ] Complete **GCash checkout** in Xendit (enter test card or GCash credentials)
3. [ ] Verify **redirect back** to iAyos app after payment
4. [ ] Verify **success message**: "Payment successful! Agency has been invited."
5. [ ] Verify job appears in **My Invite Jobs** with:
   - [ ] `escrowPaid`: true
   - [ ] `inviteStatus`: PENDING
6. [ ] Verify **payment record** in backend (check admin panel or API)

**Expected Result:**

- ✅ GCash payment completes successfully (in test environment)
- ✅ Xendit webhook updates job status (escrowPaid = true)
- ✅ User is redirected back to iAyos smoothly
- ✅ Job is created and visible in dashboard

**API Verification:**

- [ ] Webhook URL: `POST /api/webhooks/xendit` (check backend logs)
- [ ] Payload includes: `paymentId`, `status`: "PAID", `jobId`
- [ ] Job record updates: `escrowPaid` = true

---

### Test: GCash Payment Failure/Cancellation

1. [ ] Create a job with **GCASH** payment method
2. [ ] On Xendit checkout page, click **"Cancel"** or close the tab
3. [ ] Verify **redirect back** to iAyos OR user manually returns
4. [ ] Verify **error message**: "Payment cancelled. Please try again."
5. [ ] Verify job is **NOT created** (does not appear in My Invite Jobs)
6. [ ] OR job is created with `escrowPaid`: false (unpaid status)

**Expected Result:**

- ✅ Cancelled payment does not create paid job
- ✅ User is notified clearly
- ✅ User can retry payment or create new job
- ✅ No partial data corruption (job without payment)

---

## 7️⃣ Mobile Responsiveness Testing

### Test: Mobile - Hire Button on Agency Profile

1. [ ] Open **agency profile** on mobile device
2. [ ] Verify **"Hire This Agency"** button is visible and large enough to tap (min 44x44px)
3. [ ] Tap the button
4. [ ] Verify **modal opens** and fills screen (or nearly full screen)

**Expected Result:**

- ✅ Button is thumb-friendly size
- ✅ Modal is responsive (full-width on mobile)
- ✅ Modal scrolls if content overflows

---

### Test: Mobile - Multi-Step Modal (All Steps)

1. [ ] Complete **all 4 steps** on mobile device
2. [ ] Verify each step:
   - [ ] **Step 1**: Input fields stack vertically, keyboard opens for text input
   - [ ] **Step 2**: Date picker works on mobile, materials list scrolls
   - [ ] **Step 3**: Payment method cards stack vertically, tappable
   - [ ] **Step 4**: Summary is readable, buttons are accessible
3. [ ] Verify **Back** and **Next** buttons are always visible (sticky at bottom if needed)

**Expected Result:**

- ✅ All inputs work on mobile (no cut-off fields)
- ✅ Keyboard doesn't obscure input fields
- ✅ Navigation buttons are always accessible
- ✅ Modal scrolls smoothly

**Screenshot:** Take screenshots of Steps 1-4 on mobile

---

### Test: Mobile - My Invite Jobs Page

1. [ ] Open **`/client/my-invite-jobs`** on mobile
2. [ ] Verify **tabs scroll horizontally** (if needed) or stack
3. [ ] Verify **job cards stack vertically** (1 card per row)
4. [ ] Verify all card content is readable (not truncated)
5. [ ] Tap **action buttons** (View Details, Cancel)
6. [ ] Verify buttons are tappable (no accidental taps)

**Expected Result:**

- ✅ Layout adapts to mobile screen
- ✅ Touch targets are adequately sized
- ✅ No horizontal scrolling (except tabs)
- ✅ All content remains accessible

---

## 8️⃣ Performance Testing

### Test: Job Creation Speed

1. [ ] Open browser **Network tab**
2. [ ] Complete job creation workflow (all 4 steps)
3. [ ] Measure **API response time** for `POST /api/jobs/create-invite`
4. [ ] Verify response time is **<3 seconds**

**Expected Result:**

- ✅ API responds in <3s (good), <5s (acceptable), >5s (needs optimization)
- ✅ No timeout errors
- ✅ Success message appears promptly

---

### Test: My Invite Jobs Page Load Speed

1. [ ] Navigate to **`/client/my-invite-jobs`**
2. [ ] Measure **total page load time** (Network tab)
3. [ ] Verify page loads in **<2 seconds** (with 10-20 jobs)
4. [ ] Test with **50+ jobs** (if available)
5. [ ] Verify **pagination** or **lazy loading** kicks in

**Expected Result:**

- ✅ Page loads quickly with moderate data
- ✅ Pagination prevents slow loads with many jobs
- ✅ Loading skeletons display while fetching data

---

## 9️⃣ Error Handling Testing

### Test: Network Error During Job Creation

1. [ ] Fill out job creation form (all 4 steps)
2. [ ] **Disconnect internet** (or use DevTools → Offline mode)
3. [ ] Click **"Confirm & Create Job"** on Step 4
4. [ ] Verify **error message** displays: "Network error. Please check your connection and try again."
5. [ ] Verify **Retry** button displays
6. [ ] **Reconnect internet**, click **Retry**
7. [ ] Verify job creation succeeds

**Expected Result:**

- ✅ Clear error message (not generic "Error")
- ✅ User can retry without re-entering data
- ✅ No data loss on network error

---

### Test: Server Error During Job Creation

1. [ ] (Simulate server error if possible, e.g., backend returns 500)
2. [ ] Complete job creation workflow
3. [ ] Click **"Confirm & Create Job"**
4. [ ] Verify **error message**: "Server error. Please try again later or contact support."
5. [ ] Verify **support contact link** (email or chat)

**Expected Result:**

- ✅ Error message is user-friendly
- ✅ User is not blamed ("Our server is experiencing issues")
- ✅ Support contact is provided

---

### Test: Invalid Agency ID (Edge Case)

1. [ ] Manually navigate to **`/dashboard/agencies/99999/hire`** (non-existent agency)
2. [ ] Attempt to open hire modal
3. [ ] Verify **error message**: "Agency not found or unavailable."
4. [ ] Verify **redirect** to agency browse page

**Expected Result:**

- ✅ App handles invalid agency gracefully
- ✅ No console errors or app crash
- ✅ User is guided back to valid page

---

## 🔟 Accessibility Testing

### Test: Keyboard Navigation (Hire Modal)

1. [ ] Open **hire modal** via keyboard (Tab to button, press Enter)
2. [ ] Use **Tab** to navigate through form fields in Step 1
3. [ ] Verify **focus indicators** are visible (blue outline)
4. [ ] Press **Enter** to advance to next step
5. [ ] Navigate through all 4 steps using only keyboard
6. [ ] Press **Esc** to close modal

**Expected Result:**

- ✅ All form fields are keyboard-accessible
- ✅ Focus order is logical (top-to-bottom, left-to-right)
- ✅ Enter key submits steps, Esc closes modal
- ✅ Focus indicators are always visible

---

### Test: Screen Reader Support (Optional)

1. [ ] Enable **screen reader** (NVDA, VoiceOver)
2. [ ] Navigate to **agency profile**
3. [ ] Verify **"Hire This Agency"** button is announced clearly
4. [ ] Open **hire modal**, verify each step is announced
5. [ ] Verify form fields have **labels** (e.g., "Job Title, required text field")
6. [ ] Verify error messages are announced

**Expected Result:**

- ✅ All content is announced clearly
- ✅ Form fields have descriptive labels
- ✅ Error messages are announced (not just visually shown)
- ✅ Modal close button is announced ("Close modal")

---

### Test: Color Contrast (Status Badges)

1. [ ] Use **browser extension** (WAVE, axe DevTools)
2. [ ] Check **color contrast** for status badges:
   - [ ] PENDING (yellow/orange): Ensure text is readable
   - [ ] ACCEPTED (green): Ensure text is readable
   - [ ] REJECTED (red): Ensure text is readable
3. [ ] Verify minimum contrast: **4.5:1** for normal text, **3:1** for large text

**Expected Result:**

- ✅ All badges meet WCAG AA standards
- ✅ Text is readable on colored backgrounds
- ✅ Status is distinguishable without color (icons or text labels)

---

## 1️⃣1️⃣ Integration Testing

### Test: End-to-End Workflow (Hire → Pay → Track)

1. [ ] **Step 1**: Browse agencies on dashboard
2. [ ] **Step 2**: View agency profile
3. [ ] **Step 3**: Click "Hire This Agency", complete job creation (WALLET payment)
4. [ ] **Step 4**: Verify success, redirected to My Invite Jobs
5. [ ] **Step 5**: Verify job appears in PENDING tab
6. [ ] **Step 6**: Verify wallet balance decreased
7. [ ] **Step 7**: Verify transaction appears in wallet history
8. [ ] **Step 8**: (Simulate agency acceptance - backend or manual)
9. [ ] **Step 9**: Refresh page, verify job moves to ACCEPTED tab
10. [ ] **Step 10**: Verify acceptance message displays on job card

**Expected Result:**

- ✅ Entire workflow completes smoothly (no broken steps)
- ✅ Data is consistent across all pages (dashboard, profile, jobs list, wallet)
- ✅ Status updates propagate correctly

---

### Test: Data Consistency Across Pages

1. [ ] Create a job with specific details (e.g., "Fix bathroom plumbing", ₱8,000 budget)
2. [ ] Verify **job card** on My Invite Jobs displays correct:
   - [ ] Title: "Fix bathroom plumbing"
   - [ ] Budget: ₱8,000
   - [ ] Downpayment: ₱4,000
   - [ ] Agency name (as invited)
3. [ ] Click **"View Details"**, verify detail page shows same information
4. [ ] Navigate to **wallet transactions**, verify transaction shows ₱4,000 deduction

**Expected Result:**

- ✅ Data is consistent everywhere (no discrepancies)
- ✅ No rounding errors in budget calculations
- ✅ Agency information matches across views

---

## 1️⃣2️⃣ User Experience (UX) Testing

### Test: First-Time User Experience

1. [ ] Pretend you're a **new client** hiring for the first time
2. [ ] Navigate to agency profile without instructions
3. [ ] Can you **easily find** the hire button?
4. [ ] Is the **multi-step process** intuitive? (Do you understand what to do at each step?)
5. [ ] Is the **payment flow** clear? (Do you understand what you're paying and when?)

**Expected Result:**

- ✅ Hire button is obvious (prominent placement, clear label)
- ✅ Multi-step form guides user (progress indicator, clear labels)
- ✅ Payment breakdown is clear (no surprises)
- ✅ Minimal friction (no unnecessary steps)

---

### Test: Visual Hierarchy (Job Creation Modal)

1. [ ] Open hire modal
2. [ ] What draws your **eye first** at each step?
   - [ ] **Step 1**: Should be input fields (title, description)
   - [ ] **Step 2**: Should be additional fields (location, date)
   - [ ] **Step 3**: Should be payment method cards
   - [ ] **Step 4**: Should be primary CTA button ("Confirm & Create Job")
3. [ ] Verify **primary actions stand out** (bright colors, large size)
4. [ ] Verify **secondary actions are muted** (gray, outlined)

**Expected Result:**

- ✅ User's eye is guided to next action
- ✅ Primary CTAs are obvious (can't be missed)
- ✅ Visual hierarchy reduces cognitive load

---

### Test: Loading States & Feedback

1. [ ] During job creation, verify **loading indicators** display:
   - [ ] Spinner on "Confirm & Create Job" button
   - [ ] Button text changes to "Creating..." (optional)
   - [ ] Button is disabled (prevents double-submission)
2. [ ] After submission, verify **success feedback**:
   - [ ] Green checkmark icon
   - [ ] Positive message ("Job created successfully!")
   - [ ] Clear next step ("Redirecting to your jobs..." or "View Job" button)

**Expected Result:**

- ✅ User always knows what's happening (never left wondering)
- ✅ Loading states prevent user impatience
- ✅ Success feedback is rewarding (positive reinforcement)

---

## ✅ Testing Summary Template

After completing all tests, fill out this summary:

### Test Session Info

- **Tester Name:** ************\_\_\_************
- **Date Tested:** ************\_\_\_************
- **Browser Used:** ************\_\_\_************
- **Device Used:** ************\_\_\_************
- **Test Duration:** ************\_\_\_************

### Results Overview

- **Total Tests:** **\_\_**
- **Passed (✅):** **\_\_**
- **Failed (❌):** **\_\_**
- **Blocked (⏸️):** **\_\_**
- **Pass Rate:** **\_\_**%

### Critical Issues Found

List any **critical bugs** that prevent core functionality:

1. ***
2. ***
3. ***

### Minor Issues Found

List any **minor bugs** or UX improvements:

1. ***
2. ***
3. ***

### Overall Assessment

- [ ] **PASS** - Ready for production
- [ ] **PASS with minor issues** - Deploy but track issues
- [ ] **FAIL** - Requires fixes before production

### Tester Comments

---

---

---

---

## 📸 Required Screenshots

Please capture and attach the following screenshots to your test report:

1. **Agency Profile - Hire Button** (showing button on profile page)
2. **Hire Modal - Step 1** (job details form)
3. **Hire Modal - Step 2** (additional details with materials)
4. **Hire Modal - Step 3** (payment method selection)
5. **Hire Modal - Step 4** (confirmation screen)
6. **Success Message** (after job creation)
7. **My Invite Jobs - ALL Tab** (showing job cards)
8. **My Invite Jobs - PENDING Tab** (filtered view)
9. **My Invite Jobs - REJECTED Tab** (with rejection reason)
10. **Job Card - PENDING** (showing all card details)
11. **Job Card - ACCEPTED** (showing acceptance message)
12. **Job Card - REJECTED** (showing rejection reason)
13. **Wallet Transaction** (showing downpayment deduction)
14. **Mobile - Hire Modal** (all 4 steps on mobile)
15. **Mobile - My Invite Jobs Page** (responsive layout)
16. **Network Tab** (showing API response times)

---

## 🐛 Bug Report Template

If you find a bug, report it using this format:

```markdown
### Bug Report

**Title:** Brief description of issue

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**

1. Navigate to...
2. Click on...
3. Observe...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
[Attach screenshot]

**Environment:**

- Browser: Chrome 120
- Device: Desktop
- OS: Windows 11
- Screen Resolution: 1920x1080

**Console Errors:**
```

[Paste any console errors]

```

**Additional Notes:**
Any other relevant information
```

---

## 🎯 Test Coverage Summary

### Functional Areas Tested

- ✅ **Agency Profile Integration** (hire button)
- ✅ **Multi-Step Job Creation** (4 steps)
- ✅ **Payment Methods** (Wallet + GCash)
- ✅ **Job Tracking Dashboard** (My Invite Jobs)
- ✅ **Job Status Filtering** (ALL/PENDING/ACCEPTED/REJECTED)
- ✅ **InviteJobCard Display** (all variations)
- ✅ **Job Cancellation** (refunds)
- ✅ **Payment Flow** (wallet deduction, GCash checkout)

### Non-Functional Testing

- ✅ **Mobile Responsiveness** (all components)
- ✅ **Performance** (page load, API response times)
- ✅ **Error Handling** (network errors, validation)
- ✅ **Accessibility** (keyboard nav, screen reader, contrast)
- ✅ **Cross-Browser** (Chrome, Firefox, Safari)
- ✅ **User Experience** (intuitive, clear feedback)

---

**Testing Checklist Version:** 1.0  
**Last Updated:** November 13, 2025  
**Next Review:** After Phase 2 implementation (if bugs found)
