# Mobile Phase 7 - QA Testing Checklist

**Feature**: KYC Document Upload & Verification
**Date**: November 15, 2025
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Supabase storage configured for KYC document uploads
- [ ] Supabase storage bucket `iayos_files` created with path: `kyc/{accountID}/`
- [ ] Mobile app running via Expo Go or standalone build
- [ ] Test accounts created (2 workers, 1 client, 1 admin)
- [ ] Camera/photo library permissions granted
- [ ] File system permissions granted (for document selection)
- [ ] Network debugging enabled (to test upload failures)
- [ ] Admin panel accessible (for KYC approval/rejection testing)

## Pre-Testing Setup

### Account 1 (Worker - No KYC):

- [ ] Email: worker1@test.com
- [ ] Profile type: WORKER
- [ ] KYC status: NOT_SUBMITTED
- [ ] No KYC documents uploaded
- [ ] For testing fresh upload flow

### Account 2 (Worker - Pending KYC):

- [ ] Email: worker2@test.com
- [ ] Profile type: WORKER
- [ ] KYC status: PENDING
- [ ] Has uploaded documents (National ID, Selfie)
- [ ] Submission date: within last 7 days
- [ ] For testing pending state display

### Account 3 (Worker - Approved KYC):

- [ ] Email: worker3@test.com
- [ ] Profile type: WORKER
- [ ] KYC status: APPROVED
- [ ] Has all documents uploaded
- [ ] Approval date: within last 30 days
- [ ] For testing approved state display

### Account 4 (Worker - Rejected KYC):

- [ ] Email: worker4@test.com
- [ ] Profile type: WORKER
- [ ] KYC status: REJECTED
- [ ] Has uploaded documents (rejected)
- [ ] Rejection reason provided: "Document not clear"
- [ ] For testing resubmission flow

### Account 5 (Admin):

- [ ] Email: admin@test.com
- [ ] Role: ADMIN
- [ ] Can access admin panel at http://localhost:3000/admin/kyc
- [ ] For approving/rejecting test submissions

### Test Documents Required:

- [ ] Sample National ID (front and back images)
- [ ] Sample Passport (single page)
- [ ] Sample UMID ID (front and back)
- [ ] Sample PhilHealth ID (front and back)
- [ ] Sample Driver's License (front and back)
- [ ] Sample NBI Clearance (PDF or image)
- [ ] Sample Police/Barangay Clearance
- [ ] Selfie with ID photo
- [ ] Proof of Address document
- [ ] Business Permit (for agency testing)
- [ ] Various file sizes (1MB, 5MB, 10MB+)
- [ ] Various formats (JPEG, PNG, PDF)

---

## 1. KYC Status Screen - NOT_SUBMITTED State

**File**: `app/kyc/status.tsx` (481 lines)

### Screen Access & Layout

- [ ] Navigate to KYC Status screen (direct route: `/kyc/status`)
- [ ] Screen accessible from profile menu
- [ ] Screen accessible from worker dashboard (if applicable)
- [ ] Header displays "KYC Verification"
- [ ] Back button navigates to previous screen
- [ ] Screen scrolls smoothly

### Status Badge Display

- [ ] Status badge displays "NOT SUBMITTED"
- [ ] Badge color: gray or neutral
- [ ] Badge icon: document icon or alert icon
- [ ] Badge positioned at top of screen
- [ ] Badge styling consistent with design system

### Benefits of Verification Section

- [ ] "Why Verify?" section displays
- [ ] Section header: "Benefits of Verification"
- [ ] Lists 4+ benefits:
  1. [ ] "Access restricted job categories"
  2. [ ] "Build client trust and credibility"
  3. [ ] "Higher priority in search results"
  4. [ ] "Unlock premium features"
- [ ] Benefits display with checkmark icons
- [ ] Benefits styled clearly (readable)
- [ ] Section uses card or container styling

### Upload Documents CTA

- [ ] "Upload Documents" button visible
- [ ] Button prominently placed (bottom of screen or center)
- [ ] Button uses primary color (blue)
- [ ] Button has icon (upload or camera icon)
- [ ] Button text clear: "Upload Documents" or "Get Verified"
- [ ] Tapping button navigates to upload wizard (`/kyc/upload`)
- [ ] Button has press animation (scale down)

### Information Banner

- [ ] Info banner displays above CTA
- [ ] Banner icon: information icon (i)
- [ ] Banner message: "Verification typically takes 1-3 business days"
- [ ] Banner styled in info color (light blue)
- [ ] Banner has subtle background

### Pull-to-Refresh

- [ ] Pull down gesture triggers refresh
- [ ] Refresh indicator (spinner) shows
- [ ] KYC status reloads from backend
- [ ] Status updates if changed (e.g., approved by admin)
- [ ] Refresh completes in < 2 seconds
- [ ] Success feedback (spinner stops)

---

## 2. KYC Status Screen - PENDING State

**File**: `app/kyc/status.tsx` (481 lines)

### Status Badge Display

- [ ] Status badge displays "PENDING REVIEW"
- [ ] Badge color: yellow/orange (warning color)
- [ ] Badge icon: clock or hourglass icon
- [ ] Badge prominently displayed

### Submission Information

- [ ] "Submitted on:" label displays
- [ ] Submission date formatted: "MMMM d, yyyy" (e.g., "November 15, 2025")
- [ ] Submission time displays (optional): "h:mm a" (e.g., "2:45 PM")
- [ ] Relative time displays: "Submitted 3 days ago"
- [ ] Information styled clearly

### Review Timeline

- [ ] Timeline visualization displays
- [ ] Shows estimated review time: "1-3 business days"
- [ ] Shows current status: "Under review"
- [ ] Timeline styled with progress indicator
- [ ] Timeline uses stepper or progress bar

### Uploaded Documents Section

- [ ] "Uploaded Documents" heading displays
- [ ] All uploaded documents listed
- [ ] Each document shows:
  - [ ] Document type (e.g., "National ID - Front")
  - [ ] Thumbnail image (100x100px or similar)
  - [ ] Upload date/time
  - [ ] File size (e.g., "2.3 MB")
- [ ] Document thumbnails tappable
- [ ] Tapping thumbnail opens preview (`/kyc/preview`)

### Information Message

- [ ] Info banner displays
- [ ] Message: "Your documents are being reviewed. You'll be notified once verified."
- [ ] Message styled in info color
- [ ] Icon: information icon

### No Action Buttons

- [ ] No "Upload" or "Resubmit" button visible
- [ ] Cannot upload new documents while pending
- [ ] UI clearly indicates waiting state

### Pull-to-Refresh

- [ ] Pull down gesture triggers refresh
- [ ] Refresh checks for status updates
- [ ] If approved, status changes to APPROVED
- [ ] If rejected, status changes to REJECTED
- [ ] Refresh updates document list

---

## 3. KYC Status Screen - APPROVED State

**File**: `app/kyc/status.tsx` (481 lines)

### Status Badge Display

- [ ] Status badge displays "VERIFIED"
- [ ] Badge color: green (success color)
- [ ] Badge icon: checkmark or shield icon
- [ ] Badge prominently displayed
- [ ] Badge has celebratory styling (optional: animation)

### Approval Information

- [ ] "Verified on:" label displays
- [ ] Approval date formatted: "MMMM d, yyyy"
- [ ] Relative time displays: "Verified 5 days ago"
- [ ] Reviewer name displays (optional): "Reviewed by: Admin Name"

### Success Message

- [ ] Success banner displays
- [ ] Message: "Your account is verified! You now have full access to all features."
- [ ] Message styled in success color (green)
- [ ] Icon: checkmark or trophy icon

### Uploaded Documents Section

- [ ] "Verified Documents" heading displays
- [ ] All approved documents listed
- [ ] Each document shows:
  - [ ] Document type
  - [ ] Thumbnail image
  - [ ] Verification date
  - [ ] Verified badge (green checkmark)
- [ ] Document thumbnails tappable
- [ ] Tapping thumbnail opens preview

### Benefits Unlocked Section

- [ ] "What's Unlocked" section displays
- [ ] Lists features now accessible:
  1. [ ] "All job categories"
  2. [ ] "Premium worker badge"
  3. [ ] "Priority in search"
  4. [ ] "Trusted profile status"
- [ ] Features display with checkmark icons

### No Action Buttons

- [ ] No "Upload" button visible
- [ ] Cannot resubmit documents once approved
- [ ] UI clearly indicates verified state

### Pull-to-Refresh

- [ ] Pull down gesture works
- [ ] Refresh maintains APPROVED state
- [ ] Document list refreshes

---

## 4. KYC Status Screen - REJECTED State

**File**: `app/kyc/status.tsx` (481 lines)

### Status Badge Display

- [ ] Status badge displays "REJECTED"
- [ ] Badge color: red (error color)
- [ ] Badge icon: X or alert icon
- [ ] Badge prominently displayed

### Rejection Information

- [ ] "Rejected on:" label displays
- [ ] Rejection date formatted: "MMMM d, yyyy"
- [ ] Relative time displays: "Rejected 2 days ago"

### Rejection Reason Section

- [ ] "Rejection Reason" heading displays
- [ ] Rejection reason from admin displays
- [ ] Common reasons:
  - [ ] "Document not clear"
  - [ ] "ID is expired"
  - [ ] "Selfie doesn't match ID"
  - [ ] "Document is incomplete"
  - [ ] "Invalid ID type"
- [ ] Reason styled in alert container (red background)
- [ ] Icon: alert or warning icon

### Rejected Documents Section

- [ ] "Previous Submission" heading displays
- [ ] Previously uploaded documents listed
- [ ] Each document shows:
  - [ ] Document type
  - [ ] Thumbnail image (grayed out or with overlay)
  - [ ] Rejected badge (red X)
- [ ] Document thumbnails tappable
- [ ] Tapping thumbnail opens preview (read-only)

### Resubmit Instructions

- [ ] "What to Do Next" section displays
- [ ] Instructions:
  1. [ ] "Review the rejection reason"
  2. [ ] "Prepare clearer documents"
  3. [ ] "Upload new documents below"
- [ ] Instructions styled as numbered list or checklist

### Resubmit CTA

- [ ] "Resubmit Documents" button visible
- [ ] Button prominently placed
- [ ] Button uses primary color (blue)
- [ ] Button has icon (upload or retry icon)
- [ ] Tapping button navigates to upload wizard
- [ ] Button enables fresh upload flow

### Pull-to-Refresh

- [ ] Pull down gesture works
- [ ] Refresh checks for status updates
- [ ] Refresh updates rejection reason (if admin updated it)

---

## 5. Upload Wizard - Step 1: Select ID Type

**File**: `app/kyc/upload.tsx` (783 lines)

### Screen Access & Layout

- [ ] Navigate from KYC status screen via "Upload Documents"
- [ ] Header displays "Upload KYC Documents"
- [ ] Step indicator shows "Step 1 of 3"
- [ ] Progress bar shows 33% progress
- [ ] Screen title: "Select Your ID Type"
- [ ] Instructions displayed above options
- [ ] Screen scrolls smoothly

### Step Progress Indicator

- [ ] Progress stepper displays at top
- [ ] Shows 3 steps:
  1. [ ] "Select ID" (active/highlighted)
  2. [ ] "Upload Documents" (inactive/grayed)
  3. [ ] "Review & Submit" (inactive/grayed)
- [ ] Active step highlighted (blue)
- [ ] Inactive steps grayed out
- [ ] Progress bar shows percentage (33%)

### Instructions Section

- [ ] Instructions heading: "Choose your primary government ID"
- [ ] Subtext: "Select one of the following accepted government-issued IDs"
- [ ] Instructions clearly visible
- [ ] Uses readable font size

### Government ID Options (5 types)

**Option 1: National ID**
- [ ] Card/button displays "National ID"
- [ ] Icon: ID card icon
- [ ] Description: "Philippine National ID"
- [ ] Badge: "Recommended" (optional)
- [ ] Card tappable
- [ ] Selected state highlighted (border + background)
- [ ] Tapping selects this ID type

**Option 2: Passport**
- [ ] Card displays "Passport"
- [ ] Icon: passport icon
- [ ] Description: "Philippine Passport"
- [ ] Card tappable
- [ ] Selected state highlighted

**Option 3: UMID ID**
- [ ] Card displays "UMID ID"
- [ ] Icon: ID card icon
- [ ] Description: "Unified Multi-Purpose ID"
- [ ] Card tappable
- [ ] Selected state highlighted

**Option 4: PhilHealth ID**
- [ ] Card displays "PhilHealth ID"
- [ ] Icon: health icon
- [ ] Description: "PhilHealth Identification Card"
- [ ] Card tappable
- [ ] Selected state highlighted

**Option 5: Driver's License**
- [ ] Card displays "Driver's License"
- [ ] Icon: license icon
- [ ] Description: "Philippine Driver's License"
- [ ] Card tappable
- [ ] Selected state highlighted

### ID Type Cards Styling

- [ ] Each card has:
  - [ ] Icon on left (48x48px)
  - [ ] ID type name (bold)
  - [ ] Description text (gray)
  - [ ] Border (default: light gray)
  - [ ] Background (default: white)
  - [ ] Rounded corners
  - [ ] Shadow (subtle)
- [ ] Selected card styling:
  - [ ] Border: blue (primary color)
  - [ ] Background: light blue tint
  - [ ] Checkmark icon on right
- [ ] Cards arranged in single column (vertical list)
- [ ] Adequate spacing between cards (16px)

### Optional Clearance Section

- [ ] Section heading: "Optional: Add Clearance Document"
- [ ] Subtext: "Increase credibility (optional but recommended)"
- [ ] Two clearance options displayed:

**Clearance Option 1: NBI Clearance**
- [ ] Card displays "NBI Clearance"
- [ ] Icon: document icon
- [ ] Description: "National Bureau of Investigation Clearance"
- [ ] Card tappable
- [ ] Selected state highlighted

**Clearance Option 2: Police/Barangay Clearance**
- [ ] Card displays "Police/Barangay Clearance"
- [ ] Icon: shield icon
- [ ] Description: "Police or Barangay Clearance"
- [ ] Card tappable
- [ ] Selected state highlighted

- [ ] "Skip" option available (no clearance selected)
- [ ] Can select one clearance or skip
- [ ] Cannot select multiple clearances

### Navigation Buttons

- [ ] "Next" button visible at bottom
- [ ] "Next" button disabled if no ID type selected
- [ ] "Next" button enabled when ID type selected
- [ ] Button styling:
  - [ ] Disabled: gray background, gray text
  - [ ] Enabled: blue background, white text
- [ ] Tapping "Next" navigates to Step 2
- [ ] "Cancel" button in header
- [ ] Tapping "Cancel" shows confirmation dialog
- [ ] Confirmation: "Discard upload and return to status?"
- [ ] Options: "Discard" and "Stay"

### Form Validation

- [ ] Must select at least one ID type to proceed
- [ ] Clearance selection optional (can skip)
- [ ] Error message if trying to proceed without ID selection
- [ ] Error: "Please select an ID type to continue"

---

## 6. Upload Wizard - Step 2: Upload Documents

**File**: `app/kyc/upload.tsx` (783 lines)

### Screen Layout

- [ ] Header displays "Upload KYC Documents"
- [ ] Step indicator shows "Step 2 of 3"
- [ ] Progress bar shows 66% progress
- [ ] Screen title: "Upload Your Documents"
- [ ] Instructions displayed
- [ ] Screen scrolls smoothly

### Step Progress Indicator

- [ ] Progress stepper updated
- [ ] Steps:
  1. [ ] "Select ID" (completed/checkmark)
  2. [ ] "Upload Documents" (active/highlighted)
  3. [ ] "Review & Submit" (inactive)
- [ ] Progress bar shows 66%

### Instructions Section

- [ ] Instructions heading: "Upload clear, readable photos"
- [ ] Tips displayed:
  - [ ] "Ensure all corners are visible"
  - [ ] "Avoid glare and shadows"
  - [ ] "Use high resolution"
- [ ] Instructions clearly visible

### Document Upload Sections

**Section 1: ID Front (Required)**
- [ ] Section heading: "ID Front *" (asterisk indicates required)
- [ ] Selected ID type displayed: "National ID - Front"
- [ ] Upload button/card visible
- [ ] Upload button icon: camera or upload icon
- [ ] Upload button text: "Upload ID Front" or "Take Photo"
- [ ] Tapping button shows action sheet (iOS) or alert (Android)
- [ ] Options: "Take Photo", "Choose from Gallery", "Cancel"
- [ ] Required badge displayed (red or orange)

**Section 2: ID Back (Conditional)**
- [ ] Only displays if ID has two sides (National ID, UMID, PhilHealth, Driver's License)
- [ ] Does NOT display for Passport (single-sided)
- [ ] Section heading: "ID Back *"
- [ ] Selected ID type displayed: "National ID - Back"
- [ ] Upload button visible
- [ ] Upload button text: "Upload ID Back"
- [ ] Tapping button shows action sheet
- [ ] Required badge displayed

**Section 3: Selfie with ID (Required)**
- [ ] Section heading: "Selfie with ID *"
- [ ] Instructions: "Take a selfie holding your ID next to your face"
- [ ] Upload button visible
- [ ] Upload button icon: camera icon
- [ ] Upload button text: "Take Selfie"
- [ ] Tapping button shows action sheet
- [ ] Required badge displayed
- [ ] Example image/illustration displayed (optional)

**Section 4: Clearance Document (Optional)**
- [ ] Only displays if clearance selected in Step 1
- [ ] Section heading: "NBI Clearance" or "Police/Barangay Clearance"
- [ ] Badge: "Optional" (blue or neutral)
- [ ] Upload button visible
- [ ] Upload button text: "Upload Clearance"
- [ ] Tapping button shows action sheet
- [ ] Can skip this document

### Document Upload Flow (Each Document)

**Camera Permission Request:**
- [ ] Selecting "Take Photo" requests camera permission
- [ ] Permission dialog shows proper message
- [ ] Message: "iAyos needs camera access to capture KYC documents"
- [ ] If permission granted, camera launches
- [ ] If permission denied, alert shows
- [ ] Alert: "Camera permission is required to take photos. Please enable it in Settings."
- [ ] Can retry permission request
- [ ] Can navigate to Settings (platform-specific)

**Gallery Permission Request:**
- [ ] Selecting "Choose from Gallery" requests gallery permission
- [ ] Permission dialog shows proper message
- [ ] Message: "iAyos needs gallery access to select KYC documents"
- [ ] If permission granted, gallery opens
- [ ] If permission denied, alert shows
- [ ] Alert: "Gallery permission is required. Please enable it in Settings."
- [ ] Can retry permission request

**Camera Capture:**
- [ ] Camera launches successfully
- [ ] Camera interface shows capture button
- [ ] Can switch camera (front/back)
- [ ] Can toggle flash
- [ ] Capture button taps successfully
- [ ] Photo preview shows after capture
- [ ] Preview has "Use Photo" and "Retake" buttons
- [ ] "Use Photo" proceeds to compression
- [ ] "Retake" returns to camera
- [ ] Back button cancels and closes camera

**Gallery Selection:**
- [ ] Gallery picker opens successfully
- [ ] Can browse all photos
- [ ] Can select photo
- [ ] Single selection mode (can't select multiple for one field)
- [ ] Selected photo highlighted
- [ ] "Done" or "Select" button confirms selection
- [ ] "Cancel" button closes picker

**Image Compression:**
- [ ] After capture/selection, compression starts
- [ ] Loading spinner shows during compression
- [ ] Message: "Processing image..."
- [ ] Image resized to max 1920x1920 pixels
- [ ] Image compressed to 85% quality
- [ ] File size reduced (typically 70% smaller)
- [ ] Compression completes in < 2 seconds
- [ ] High quality maintained

**Document Preview (After Selection):**
- [ ] Document preview card displays
- [ ] Preview shows thumbnail (200x200px)
- [ ] Document type label displays
- [ ] File size displays (e.g., "2.3 MB")
- [ ] "Change" button visible
- [ ] "Remove" button visible
- [ ] Tapping "Change" reopens action sheet
- [ ] Tapping "Remove" clears document
- [ ] Remove shows confirmation: "Remove this document?"

**Document Capture Instructions (Per Type):**

*National ID Front:*
- [ ] Instruction: "Capture the front of your National ID"
- [ ] Example: "Ensure all text is readable and corners are visible"

*National ID Back:*
- [ ] Instruction: "Capture the back of your National ID"
- [ ] Example: "Include signature and QR code if present"

*Passport:*
- [ ] Instruction: "Capture the photo page of your passport"
- [ ] Example: "Ensure passport number and photo are clear"

*Selfie with ID:*
- [ ] Instruction: "Hold your ID next to your face"
- [ ] Example: "Both your face and ID should be clearly visible"
- [ ] Tip: "Use front camera for easier positioning"

*Clearance:*
- [ ] Instruction: "Capture the full clearance document"
- [ ] Example: "Ensure document number and issue date are visible"

### File Validation

**File Size Validation:**
- [ ] Maximum file size: 10MB per document
- [ ] If file > 10MB, error alert shows
- [ ] Error message: "File too large. Maximum size is 10MB."
- [ ] Large file not added to form
- [ ] Can retry with different file
- [ ] Quality warning if file 5-10MB: "Large file detected. Upload may take longer."

**File Format Validation:**
- [ ] Accepted formats: JPEG, JPG, PNG
- [ ] PDF accepted for clearance documents only
- [ ] If invalid format, error alert shows
- [ ] Error message: "Invalid file format. Only JPEG, PNG allowed."
- [ ] Invalid file not added to form
- [ ] Can retry with different file

**Image Quality Check (Optional):**
- [ ] Resolution check: minimum 800x600 pixels
- [ ] If too low resolution, warning shows
- [ ] Warning: "Image resolution is low. Document may be hard to verify."
- [ ] Can proceed with warning or retake

### Form Validation (Step 2)

- [ ] ID Front is required
- [ ] ID Back is required (if two-sided ID)
- [ ] Selfie with ID is required
- [ ] Clearance is optional (can skip)
- [ ] "Next" button disabled until required docs uploaded
- [ ] "Next" button enabled when all required docs uploaded
- [ ] Error message if trying to proceed without required docs
- [ ] Error: "Please upload all required documents"
- [ ] Error highlights missing document sections

### Navigation Buttons

- [ ] "Next" button at bottom
- [ ] "Next" button disabled state:
  - [ ] Gray background
  - [ ] Gray text
  - [ ] No press animation
- [ ] "Next" button enabled state:
  - [ ] Blue background
  - [ ] White text
  - [ ] Press animation
- [ ] Tapping "Next" navigates to Step 3
- [ ] "Previous" button visible
- [ ] Tapping "Previous" returns to Step 1
- [ ] Previous button preserves uploaded documents
- [ ] "Cancel" button in header
- [ ] Tapping "Cancel" shows confirmation
- [ ] Confirmation: "Discard all uploaded documents?"
- [ ] Options: "Discard" (red) and "Stay"

### Document Retake

- [ ] Can change uploaded document
- [ ] Tapping "Change" on preview shows action sheet
- [ ] Can capture new photo or select new file
- [ ] New document replaces old one
- [ ] Old document discarded (not uploaded)
- [ ] Can retake unlimited times

### Document Removal

- [ ] Tapping "Remove" shows confirmation
- [ ] Confirmation: "Remove this document?"
- [ ] Options: "Remove" and "Cancel"
- [ ] Tapping "Remove" clears document
- [ ] Document preview disappears
- [ ] Upload button reappears
- [ ] Form validation updates (if was required)

---

## 7. Upload Wizard - Step 3: Review & Submit

**File**: `app/kyc/upload.tsx` (783 lines)

### Screen Layout

- [ ] Header displays "Upload KYC Documents"
- [ ] Step indicator shows "Step 3 of 3"
- [ ] Progress bar shows 100% progress
- [ ] Screen title: "Review Your Submission"
- [ ] Instructions displayed
- [ ] Screen scrolls smoothly

### Step Progress Indicator

- [ ] Progress stepper updated
- [ ] Steps:
  1. [ ] "Select ID" (completed/checkmark)
  2. [ ] "Upload Documents" (completed/checkmark)
  3. [ ] "Review & Submit" (active/highlighted)
- [ ] Progress bar shows 100%

### Instructions Section

- [ ] Instructions heading: "Review your documents before submitting"
- [ ] Subtext: "Make sure all information is clear and readable"
- [ ] Instructions clearly visible

### Documents Review List

**Selected ID Type Display:**
- [ ] Section heading: "Selected ID Type"
- [ ] ID type name displays (e.g., "National ID")
- [ ] ID type icon displays
- [ ] "Change" link/button visible
- [ ] Tapping "Change" returns to Step 1

**Uploaded Documents List:**
- [ ] Section heading: "Uploaded Documents"
- [ ] All uploaded documents listed
- [ ] Each document card shows:
  - [ ] Document type label (e.g., "ID Front")
  - [ ] Thumbnail preview (150x150px)
  - [ ] File size (e.g., "2.3 MB")
  - [ ] File format badge (JPEG/PNG)
  - [ ] "View" button
  - [ ] "Change" button
- [ ] Documents displayed in order:
  1. [ ] ID Front
  2. [ ] ID Back (if applicable)
  3. [ ] Selfie with ID
  4. [ ] Clearance (if uploaded)
- [ ] Tapping "View" opens full-screen preview
- [ ] Tapping "Change" returns to Step 2 (specific document)

**Document Thumbnails:**
- [ ] High quality thumbnails
- [ ] Maintain aspect ratio
- [ ] Rounded corners
- [ ] Border around thumbnail
- [ ] Loading spinner while generating thumbnail
- [ ] Error icon if thumbnail generation fails

### Important Notices Section

- [ ] Section heading: "Important Notices"
- [ ] Warning icon displayed
- [ ] Notices list:
  1. [ ] "Verification typically takes 1-3 business days"
  2. [ ] "Make sure all documents are clear and readable"
  3. [ ] "Blurry or incomplete documents will be rejected"
  4. [ ] "You'll be notified via email once verified"
  5. [ ] "You can check status anytime in the KYC section"
- [ ] Notices styled in info container (light blue)
- [ ] Checkmark or bullet points for each notice

### Terms & Conditions (Optional)

- [ ] Checkbox: "I confirm all documents are authentic"
- [ ] Checkbox required to submit
- [ ] Submit button disabled if unchecked
- [ ] Terms link: "View KYC Terms and Conditions"
- [ ] Tapping link opens terms modal/page

### Submit Button

- [ ] "Submit for Verification" button at bottom
- [ ] Button prominently styled:
  - [ ] Blue background
  - [ ] White text
  - [ ] Large size (full width or centered)
  - [ ] Icon: checkmark or upload icon
- [ ] Button disabled if terms unchecked (if applicable)
- [ ] Button has press animation
- [ ] Tapping button shows final confirmation

### Final Confirmation Dialog

- [ ] Dialog title: "Submit KYC Documents?"
- [ ] Dialog message: "Once submitted, you cannot edit documents until review is complete."
- [ ] Dialog icon: warning or question icon
- [ ] Two buttons:
  - [ ] "Cancel" (neutral/gray)
  - [ ] "Submit" (blue/primary)
- [ ] Tapping "Cancel" closes dialog
- [ ] Tapping "Submit" starts upload process

### Navigation Buttons

- [ ] "Previous" button visible
- [ ] Tapping "Previous" returns to Step 2
- [ ] Previous preserves all uploaded documents
- [ ] "Cancel" button in header
- [ ] Tapping "Cancel" shows confirmation
- [ ] Confirmation: "Discard all uploaded documents?"

---

## 8. Upload Process & Progress Tracking

**File**: `app/kyc/upload.tsx` (783 lines)

### Upload Initiation

- [ ] After confirming submit, upload process starts
- [ ] Screen transitions to upload progress view
- [ ] Upload happens immediately (no delay)
- [ ] Cannot navigate away during upload (blocked)

### Upload Progress Screen

- [ ] Screen title: "Uploading Documents..."
- [ ] Large loading spinner displays
- [ ] Progress bar shows overall progress (0-100%)
- [ ] Progress percentage displays (e.g., "45%")
- [ ] Current status message displays
- [ ] Upload cannot be cancelled (intentional security measure)
- [ ] "Do not close" warning displays
- [ ] Warning styled in alert container (orange/yellow)

### Multi-Document Upload

- [ ] Documents upload sequentially (one at a time)
- [ ] Upload order:
  1. [ ] ID Front
  2. [ ] ID Back (if applicable)
  3. [ ] Selfie with ID
  4. [ ] Clearance (if uploaded)

**Per-Document Upload Progress:**
- [ ] Status message updates per document
- [ ] Message format: "Uploading ID Front... 30%"
- [ ] Each document shows individual progress
- [ ] Individual progress bar (0-100%) per document
- [ ] Spinner animates during upload
- [ ] Document thumbnail shows while uploading
- [ ] Checkmark appears when document uploaded successfully

**Overall Upload Progress:**
- [ ] Overall progress bar shows total progress
- [ ] Percentage calculation: (completed docs / total docs) * 100
- [ ] Example: "2 of 4 documents uploaded (50%)"
- [ ] Overall status updates as documents complete

### Upload Progress Tracking (XMLHttpRequest)

- [ ] Uses XMLHttpRequest for upload (not fetch)
- [ ] Progress events captured via `upload.onprogress`
- [ ] Progress percentage calculated: (loaded / total) * 100
- [ ] Percentage updates in real-time (every 100ms)
- [ ] Loaded bytes displayed: "2.3 MB / 4.5 MB"
- [ ] Upload speed calculated (optional): "500 KB/s"

### Upload Performance

- [ ] Upload timeout: 120 seconds per document
- [ ] Average upload time (WiFi):
  - [ ] 1MB file: 2-3 seconds
  - [ ] 5MB file: 8-12 seconds
  - [ ] 10MB file: 18-25 seconds
- [ ] Compression reduces upload time by ~70%
- [ ] Progress updates smoothly (no freezing)

### Upload Success Handling

- [ ] After last document uploads, success screen shows
- [ ] Success message: "Documents uploaded successfully!"
- [ ] Success icon: checkmark or trophy icon
- [ ] Success styled in green
- [ ] Confetti animation (optional)
- [ ] Auto-redirect to KYC status screen (2 seconds delay)
- [ ] Redirect can be skipped by tapping "View Status"

### Upload Error Handling

**Network Error:**
- [ ] If network lost during upload, error shows
- [ ] Error message: "Network error. Please check your connection and try again."
- [ ] Error icon: cloud-offline or alert icon
- [ ] "Retry Upload" button visible
- [ ] Tapping "Retry" restarts upload (from failed document)
- [ ] "Cancel" button returns to review screen (Step 3)
- [ ] Failed document not saved (must retry)

**Timeout Error:**
- [ ] If upload exceeds 120 seconds, timeout occurs
- [ ] Error message: "Upload timed out. Please try again."
- [ ] Retry button visible
- [ ] Can retry or cancel

**Server Error (500):**
- [ ] If backend returns 500 error, error shows
- [ ] Error message: "Server error. Please try again later."
- [ ] Retry button visible
- [ ] Can retry or contact support

**Invalid File Error:**
- [ ] If file validation fails server-side, error shows
- [ ] Error message from backend displayed
- [ ] Example: "ID Front is not a valid image file."
- [ ] "Go Back" button returns to Step 2
- [ ] Must replace invalid file

**Storage Error (Supabase):**
- [ ] If Supabase upload fails, error shows
- [ ] Error message: "Failed to upload to storage. Please try again."
- [ ] Retry button visible
- [ ] Can retry or cancel

### Upload Interruption

- [ ] If user tries to navigate away, warning shows
- [ ] Warning: "Upload in progress. Are you sure you want to cancel?"
- [ ] Options: "Stay" and "Cancel Upload"
- [ ] Tapping "Cancel Upload" stops upload
- [ ] Partially uploaded documents not saved
- [ ] Returns to review screen (Step 3)

### Background Upload (Optional)

- [ ] App backgrounding pauses upload (optional behavior)
- [ ] Notification shows: "Upload paused. Return to app to continue."
- [ ] Foregrounding app resumes upload
- [ ] Upload progress preserved

---

## 9. Upload Completion & Redirect

**File**: `app/kyc/upload.tsx` (783 lines)

### Success Screen

- [ ] Screen title: "Success!"
- [ ] Large success icon (checkmark, 100x100px)
- [ ] Success message: "Your KYC documents have been uploaded successfully!"
- [ ] Subtext: "We'll review your documents within 1-3 business days. You'll receive an email notification once verified."
- [ ] Success styled in green
- [ ] Confetti or celebration animation (optional)

### Auto-Redirect

- [ ] Countdown timer displays: "Redirecting in 3... 2... 1..."
- [ ] Timer counts down from 3 to 0
- [ ] After 3 seconds, redirects to KYC status screen
- [ ] Redirect uses navigation replace (cannot go back to upload wizard)

### Manual Navigation

- [ ] "View Status" button visible
- [ ] Tapping button immediately navigates to KYC status
- [ ] Button skips countdown timer
- [ ] Button styled in primary color (blue)

### Backend Data Persistence

- [ ] After upload, KYC record created in database
- [ ] KYC status set to "PENDING"
- [ ] All uploaded documents saved in Supabase
- [ ] Supabase storage path: `kyc/{accountID}/`
- [ ] File URLs stored in `kycFiles` table
- [ ] File metadata saved:
  - [ ] idType (NATIONALID, PASSPORT, etc.)
  - [ ] documentUrl (Supabase public URL)
  - [ ] uploadedAt (timestamp)
  - [ ] fileSize (bytes)
  - [ ] accountID (linked to user)
- [ ] Submission timestamp recorded: `createdAt`
- [ ] User's KYC status updated: `kycVerified = "PENDING"`

### Cache Invalidation

- [ ] After upload, KYC queries invalidated
- [ ] Queries invalidated:
  - [ ] `['kyc-status']`
  - [ ] `['worker-profile']`
  - [ ] `['user']`
- [ ] KYC status screen refreshes automatically
- [ ] Profile completion percentage updates

### Email Notification (Backend - Out of Scope)

- [ ] Email sent to user after upload (backend handles)
- [ ] Email subject: "KYC Documents Received"
- [ ] Email body:
  - [ ] "Your KYC documents have been received"
  - [ ] "Verification typically takes 1-3 business days"
  - [ ] "You'll receive another email once verified"
  - [ ] Link to check status in app

---

## 10. Document Preview Screen

**File**: `app/kyc/preview.tsx` (257 lines)

### Screen Access

- [ ] Navigate from KYC status screen (tap document thumbnail)
- [ ] Navigate from review screen (tap "View" button)
- [ ] Header displays document type (e.g., "National ID - Front")
- [ ] Back button returns to previous screen
- [ ] Screen opens in full-screen modal

### Document Display

- [ ] Document image displays at full size
- [ ] Image centered on screen
- [ ] Image maintains aspect ratio
- [ ] High quality rendering
- [ ] No pixelation or blurring
- [ ] Background: dark gray or black (to highlight image)

### Zoom Controls

**Zoom In:**
- [ ] Zoom in button visible (+ icon)
- [ ] Tapping button zooms in by 50%
- [ ] Maximum zoom: 300%
- [ ] Zoom in disabled at max zoom
- [ ] Button grayed out at max zoom
- [ ] Smooth zoom animation (200ms)

**Zoom Out:**
- [ ] Zoom out button visible (- icon)
- [ ] Tapping button zooms out by 50%
- [ ] Minimum zoom: 50%
- [ ] Zoom out disabled at min zoom
- [ ] Button grayed out at min zoom
- [ ] Smooth zoom animation

**Reset Zoom:**
- [ ] Reset button visible (reset icon or 100% text)
- [ ] Tapping button resets to 100% zoom
- [ ] Smooth reset animation
- [ ] Button only visible if zoom ≠ 100%

### Pinch-to-Zoom

- [ ] Can pinch to zoom in/out
- [ ] Pinch gesture smooth (no lag)
- [ ] Zoom range: 50%-300%
- [ ] Cannot zoom beyond limits
- [ ] Zoom centered on pinch point
- [ ] Zoom animation smooth

### Pan Gesture (When Zoomed)

- [ ] Can drag image when zoomed in
- [ ] Pan gesture smooth
- [ ] Cannot pan beyond image bounds
- [ ] Elastic bounce at edges (iOS)
- [ ] Hard stop at edges (Android)

### Image Loading States

- [ ] Loading spinner shows while image loads
- [ ] Spinner centered on screen
- [ ] Spinner message: "Loading document..."
- [ ] Image fades in after load (smooth transition)
- [ ] Loading time < 2 seconds (WiFi)

### Image Error States

- [ ] If image fails to load, error shows
- [ ] Error icon: broken image icon (red)
- [ ] Error message: "Failed to load document"
- [ ] "Retry" button visible
- [ ] Tapping "Retry" reloads image
- [ ] "Close" button returns to previous screen

### Document Metadata Display (Optional)

- [ ] Metadata bar at bottom (optional)
- [ ] Shows:
  - [ ] Document type (e.g., "National ID - Front")
  - [ ] File size (e.g., "2.3 MB")
  - [ ] Upload date (e.g., "Nov 15, 2025")
  - [ ] Format (e.g., "JPEG")
- [ ] Metadata styled with dark background
- [ ] Metadata toggleable (tap to show/hide)

### Close Button

- [ ] Close button (X icon) in header or top-right
- [ ] Tapping close returns to previous screen
- [ ] Close button always visible
- [ ] Close button has contrast against background

### Download Button (Optional - Future)

- [ ] Download button visible (download icon)
- [ ] Tapping button downloads image to device
- [ ] Download shows progress
- [ ] Download saves to gallery/downloads folder
- [ ] Success toast: "Document downloaded"

### Share Button (Optional - Future)

- [ ] Share button visible (share icon)
- [ ] Tapping button opens share sheet
- [ ] Can share via email, messaging, etc.
- [ ] Share works on iOS and Android

---

## 11. KYC Components

### KYCStatusBadge Component

**File**: `components/KYC/KYCStatusBadge.tsx` (125 lines)

**NOT_SUBMITTED Status:**
- [ ] Badge displays "Not Submitted"
- [ ] Color: gray or neutral
- [ ] Icon: document-text icon
- [ ] Size variants work: small, medium, large
- [ ] Description text displays (if `showDescription` prop)
- [ ] Description: "Upload your documents to get verified"

**PENDING Status:**
- [ ] Badge displays "Pending Review"
- [ ] Color: yellow/orange
- [ ] Icon: time or hourglass icon
- [ ] Description: "Your documents are being reviewed"

**APPROVED Status:**
- [ ] Badge displays "Verified"
- [ ] Color: green
- [ ] Icon: checkmark-circle icon
- [ ] Description: "Your account is verified"

**REJECTED Status:**
- [ ] Badge displays "Rejected"
- [ ] Color: red
- [ ] Icon: close-circle icon
- [ ] Description: "Your documents were rejected"

**Size Variants:**
- [ ] Small: 24px height, 12px font
- [ ] Medium: 32px height, 14px font
- [ ] Large: 40px height, 16px font
- [ ] Icons scale with size

### DocumentCard Component

**File**: `components/KYC/DocumentCard.tsx` (236 lines)

- [ ] Card displays document thumbnail (100x100px)
- [ ] Document type label displays
- [ ] File size displays (e.g., "2.3 MB")
- [ ] Upload date displays (relative time: "2 days ago")
- [ ] Upload status indicator:
  - [ ] Green checkmark if uploaded
  - [ ] Yellow clock if pending
  - [ ] Red X if rejected
- [ ] "View" button visible
- [ ] "Delete" button visible (if deletable)
- [ ] Tapping "View" opens preview
- [ ] Tapping "Delete" shows confirmation
- [ ] Card has border and shadow
- [ ] Card has press animation

### DocumentUploader Component

**File**: `components/KYC/DocumentUploader.tsx` (331 lines)

**Initial State (No Document):**
- [ ] Upload button displays
- [ ] Button icon: camera or upload icon
- [ ] Button text: "Upload [Document Type]"
- [ ] Required badge displays if required
- [ ] Tapping button shows action sheet

**Action Sheet:**
- [ ] Three options: "Take Photo", "Choose from Gallery", "Cancel"
- [ ] "Take Photo" option has camera icon
- [ ] "Choose from Gallery" option has images icon
- [ ] "Cancel" option closes sheet
- [ ] Action sheet styled platform-specific (iOS/Android)

**After Document Selected:**
- [ ] Preview card displays
- [ ] Thumbnail shows (200x200px)
- [ ] Document type label displays
- [ ] File size displays
- [ ] "Change" button visible
- [ ] "Remove" button visible
- [ ] Tapping "Change" reopens action sheet
- [ ] Tapping "Remove" clears document

**Document Validation:**
- [ ] File size validated (max 10MB)
- [ ] File format validated (JPEG/PNG)
- [ ] Validation errors show toast
- [ ] Invalid files not added

### UploadProgressBar Component

**File**: `components/KYC/UploadProgressBar.tsx` (190 lines)

**Single Upload Progress:**
- [ ] Progress bar displays
- [ ] Progress percentage shows (0-100%)
- [ ] Percentage text displays: "45%"
- [ ] Progress bar fills from left to right
- [ ] Progress color: blue
- [ ] Background color: light gray
- [ ] Bar height: 8px (or configurable)
- [ ] Rounded corners
- [ ] Smooth animation (transitions)

**Multi-Upload Progress:**
- [ ] Overall progress bar displays
- [ ] Individual progress bars for each document
- [ ] Each document labeled (e.g., "ID Front")
- [ ] Each document shows percentage
- [ ] Completed documents show checkmark
- [ ] Pending documents show spinner
- [ ] Failed documents show error icon

**Byte Formatting:**
- [ ] Formats bytes to readable units
- [ ] Examples:
  - [ ] 1024 bytes → "1 KB"
  - [ ] 1,048,576 bytes → "1 MB"
  - [ ] 5,242,880 bytes → "5 MB"
- [ ] Shows loaded / total: "2.3 MB / 4.5 MB"

**Upload Speed (Optional):**
- [ ] Calculates upload speed
- [ ] Displays: "500 KB/s" or "1.2 MB/s"
- [ ] Updates every second

---

## 12. API Integration

### Endpoint 1: GET /api/accounts/kyc-status

**Request:**
- [ ] Method: GET
- [ ] Authentication: Required (cookie-based)
- [ ] No request body

**Response (NOT_SUBMITTED):**
- [ ] Status code: 200
- [ ] Response body:
  ```json
  {
    "hasKYC": false,
    "status": "NOT_SUBMITTED",
    "message": "No KYC submission found"
  }
  ```
- [ ] `hasKYC` is false
- [ ] `status` is "NOT_SUBMITTED"

**Response (PENDING):**
- [ ] Status code: 200
- [ ] Response body:
  ```json
  {
    "hasKYC": true,
    "status": "PENDING",
    "kycRecord": {
      "kycID": 123,
      "kyc_status": "PENDING",
      "notes": "",
      "createdAt": "2025-11-15T10:30:00Z",
      "reviewedAt": null,
      "files": [...]
    },
    "files": [
      {
        "fileID": 1,
        "idType": "NATIONALID",
        "documentUrl": "https://...supabase.co/.../front.jpg",
        "uploadedAt": "2025-11-15T10:30:00Z",
        "fileSize": 2457600
      },
      ...
    ]
  }
  ```
- [ ] `hasKYC` is true
- [ ] `status` is "PENDING"
- [ ] `kycRecord` contains KYC details
- [ ] `files` array contains uploaded documents

**Response (APPROVED):**
- [ ] Status code: 200
- [ ] `status` is "APPROVED"
- [ ] `reviewedAt` timestamp present
- [ ] Files list populated

**Response (REJECTED):**
- [ ] Status code: 200
- [ ] `status` is "REJECTED"
- [ ] `notes` field contains rejection reason
- [ ] `reviewedAt` timestamp present
- [ ] Files list populated

**Error Responses:**
- [ ] 401 Unauthorized: If not authenticated
- [ ] 500 Internal Server Error: If backend error

### Endpoint 2: POST /api/accounts/upload-kyc

**Request:**
- [ ] Method: POST
- [ ] Authentication: Required (cookie-based)
- [ ] Content-Type: multipart/form-data
- [ ] Request body (FormData):
  - [ ] `IDType`: string (e.g., "NATIONALID")
  - [ ] `clearanceType`: string (optional, e.g., "NBI")
  - [ ] `frontID`: File (image, required)
  - [ ] `backID`: File (image, optional/conditional)
  - [ ] `selfie`: File (image, required)
  - [ ] `clearance`: File (image/PDF, optional)

**Successful Response:**
- [ ] Status code: 201 Created
- [ ] Response body:
  ```json
  {
    "success": true,
    "message": "KYC documents uploaded successfully",
    "kyc_id": 123,
    "files": [
      {
        "fileID": 1,
        "idType": "NATIONALID",
        "documentUrl": "https://...supabase.co/.../front.jpg",
        "uploadedAt": "2025-11-15T10:30:00Z"
      },
      ...
    ]
  }
  ```
- [ ] `success` is true
- [ ] `kyc_id` returned
- [ ] `files` array contains uploaded file details

**Error Responses:**

*Missing Required File:*
- [ ] Status code: 400 Bad Request
- [ ] Response: `{ "error": "frontID is required" }`

*File Too Large:*
- [ ] Status code: 400 Bad Request
- [ ] Response: `{ "error": "File too large. Maximum size is 10MB." }`

*Invalid File Format:*
- [ ] Status code: 400 Bad Request
- [ ] Response: `{ "error": "Invalid file format. Only JPEG, PNG allowed." }`

*Duplicate Submission:*
- [ ] Status code: 409 Conflict
- [ ] Response: `{ "error": "KYC already submitted and pending review" }`

*Supabase Upload Failure:*
- [ ] Status code: 500 Internal Server Error
- [ ] Response: `{ "error": "Failed to upload to storage. Please try again." }`

*Database Error:*
- [ ] Status code: 500 Internal Server Error
- [ ] Response: `{ "error": "Failed to save KYC submission." }`

*Unauthorized:*
- [ ] Status code: 401 Unauthorized
- [ ] Response: `{ "error": "Authentication required" }`

### Endpoint 3: GET /api/accounts/kyc-application-history

**Request:**
- [ ] Method: GET
- [ ] Authentication: Required (cookie-based)
- [ ] No request body

**Response:**
- [ ] Status code: 200
- [ ] Response body (array of past submissions):
  ```json
  [
    {
      "kycID": 123,
      "kyc_status": "APPROVED",
      "notes": "",
      "createdAt": "2025-11-10T10:30:00Z",
      "reviewedAt": "2025-11-12T14:20:00Z"
    },
    {
      "kycID": 122,
      "kyc_status": "REJECTED",
      "notes": "Document not clear",
      "createdAt": "2025-11-08T09:15:00Z",
      "reviewedAt": "2025-11-09T16:40:00Z"
    }
  ]
  ```
- [ ] Returns all past KYC submissions (if any)
- [ ] Ordered by `createdAt` descending (most recent first)
- [ ] Empty array if no history: `[]`

**Error Responses:**
- [ ] 401 Unauthorized: If not authenticated
- [ ] 500 Internal Server Error: If backend error

---

## 13. Data Persistence & Caching

### React Query Caching

**KYC Status Query:**
- [ ] Query key: `['kyc-status']`
- [ ] Stale time: 5 minutes (300,000ms)
- [ ] Cache time: 10 minutes
- [ ] Refetch on window focus: true
- [ ] Retry: 3 attempts
- [ ] Retry delay: exponential backoff (1s, 2s, 4s)

**Upload Mutation:**
- [ ] Mutation key: `['upload-kyc']`
- [ ] On success, invalidates `['kyc-status']`
- [ ] On success, invalidates `['worker-profile']`
- [ ] On success, invalidates `['user']`
- [ ] On error, shows error toast

**Cache Invalidation:**
- [ ] After upload success, KYC status refetched
- [ ] Status screen updates automatically
- [ ] Profile completion percentage updates
- [ ] No manual refresh needed

### Supabase Storage

**Storage Bucket:**
- [ ] Bucket name: `iayos_files`
- [ ] Bucket is public (read access)
- [ ] Path structure: `kyc/{accountID}/`
- [ ] File naming: `{timestamp}_{filename}`
- [ ] Example: `kyc/123/1731672000_nationalid_front.jpg`

**File URLs:**
- [ ] Public URL format: `https://[project].supabase.co/storage/v1/object/public/iayos_files/kyc/{accountID}/{filename}`
- [ ] URLs stored in `kycFiles.documentUrl`
- [ ] URLs accessible without authentication (public bucket)

**File Retention:**
- [ ] Files stored indefinitely (no auto-delete)
- [ ] Admin can manually delete files (future feature)
- [ ] GDPR compliance: user can request deletion (future feature)

### Database Persistence

**Tables Updated:**

*kyc table:*
- [ ] `kycID` (auto-increment primary key)
- [ ] `accountID` (foreign key to accounts)
- [ ] `kyc_status` ("PENDING" on upload)
- [ ] `notes` (empty on upload, admin adds on review)
- [ ] `createdAt` (timestamp on upload)
- [ ] `reviewedAt` (null on upload, set by admin)

*kycFiles table:*
- [ ] `fileID` (auto-increment primary key)
- [ ] `accountID` (foreign key to accounts)
- [ ] `idType` (e.g., "NATIONALID", "PASSPORT", "SELFIE", "CLEARANCE")
- [ ] `documentUrl` (Supabase public URL)
- [ ] `uploadedAt` (timestamp)
- [ ] `fileSize` (bytes, optional)

*accounts table:*
- [ ] `KYCVerified` field updated to "PENDING"

**Data Relationships:**
- [ ] One `accounts` record → One `kyc` record (1-to-1)
- [ ] One `kyc` record → Multiple `kycFiles` records (1-to-many)
- [ ] Cascade delete: Deleting `kyc` deletes related `kycFiles`

---

## 14. Type System & Validation

**File**: `lib/types/kyc.ts` (395 lines)

### TypeScript Interfaces

**KYCStatus Type:**
- [ ] Type defined: `"NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED"`
- [ ] Used consistently throughout app
- [ ] No magic strings used

**DocumentType Type:**
- [ ] Type defined: `"NATIONALID" | "PASSPORT" | "UMID" | "PHILHEALTH" | "DRIVERSLICENSE" | "NBI" | "POLICE" | "SELFIE" | "PROOF_OF_ADDRESS" | "BUSINESS_PERMIT"`
- [ ] All 10 document types included

**KYCFile Interface:**
- [ ] Properties:
  - [ ] `fileID: number`
  - [ ] `accountID: number`
  - [ ] `idType: DocumentType`
  - [ ] `documentUrl: string`
  - [ ] `uploadedAt: string` (ISO 8601)
  - [ ] `fileSize?: number` (optional)
- [ ] Interface exported and used in API responses

**KYCRecord Interface:**
- [ ] Properties:
  - [ ] `kycID: number`
  - [ ] `kyc_status: KYCStatus`
  - [ ] `notes: string`
  - [ ] `createdAt: string`
  - [ ] `reviewedAt: string | null`
  - [ ] `files: KYCFile[]`
- [ ] Interface exported and used in state management

**KYCStatusResponse Interface:**
- [ ] Properties:
  - [ ] `hasKYC: boolean`
  - [ ] `status: KYCStatus`
  - [ ] `kycRecord?: KYCRecord`
  - [ ] `files?: KYCFile[]`
  - [ ] `message?: string`
- [ ] Interface matches backend API response

**UploadKYCPayload Interface:**
- [ ] Properties:
  - [ ] `IDType: DocumentType`
  - [ ] `clearanceType?: DocumentType`
  - [ ] `frontID: File`
  - [ ] `backID?: File`
  - [ ] `selfie: File`
  - [ ] `clearance?: File`
- [ ] Interface used for upload mutation

### Document Type Configuration

**DOCUMENT_TYPES Constant:**
- [ ] Object with 10 document type configs
- [ ] Each config has:
  - [ ] `id: DocumentType`
  - [ ] `label: string` (display name)
  - [ ] `description: string`
  - [ ] `category: "GOVERNMENT_ID" | "CLEARANCE" | "SUPPORTING"`
  - [ ] `required: boolean`
  - [ ] `icon: string` (Ionicons icon name)
  - [ ] `instructions: string[]` (capture tips)
  - [ ] `examples: string[]` (what to include)
  - [ ] `maxFileSize: number` (bytes, 10MB)
  - [ ] `allowedFormats: string[]` (e.g., ["JPEG", "PNG"])
  - [ ] `hasTwoSides: boolean` (true for National ID, UMID, etc.)

**Document Type Configs Validated:**

*NATIONALID:*
- [ ] Label: "National ID"
- [ ] Description: "Philippine National ID"
- [ ] Category: "GOVERNMENT_ID"
- [ ] Required: true
- [ ] Has two sides: true
- [ ] Max file size: 10MB
- [ ] Allowed formats: ["JPEG", "PNG"]

*PASSPORT:*
- [ ] Label: "Passport"
- [ ] Category: "GOVERNMENT_ID"
- [ ] Has two sides: false (single page)

*SELFIE:*
- [ ] Label: "Selfie with ID"
- [ ] Description: "Selfie holding your ID next to your face"
- [ ] Category: "SUPPORTING"
- [ ] Required: true
- [ ] Instructions include: "Both face and ID must be clearly visible"

*NBI:*
- [ ] Label: "NBI Clearance"
- [ ] Category: "CLEARANCE"
- [ ] Required: false (optional)
- [ ] Allowed formats: ["JPEG", "PNG", "PDF"]

### Validation Utilities

**validateFileSize Function:**
- [ ] Accepts file and maxSize parameters
- [ ] Returns boolean
- [ ] Returns false if file.size > maxSize
- [ ] Returns true if file.size ≤ maxSize

**validateFileFormat Function:**
- [ ] Accepts file and allowedFormats parameters
- [ ] Returns boolean
- [ ] Checks file.type or file extension
- [ ] Returns true if format allowed
- [ ] Returns false if format not allowed

**formatFileSize Function:**
- [ ] Accepts bytes (number)
- [ ] Returns formatted string
- [ ] Examples:
  - [ ] 1024 → "1 KB"
  - [ ] 1048576 → "1 MB"
  - [ ] 5242880 → "5 MB"
- [ ] Rounds to 2 decimal places

**getDocumentTypeConfig Function:**
- [ ] Accepts documentType parameter
- [ ] Returns config object from DOCUMENT_TYPES
- [ ] Returns undefined if type not found
- [ ] Type-safe return value

---

## 15. Edge Cases & Error Scenarios

### Empty/Invalid Data

- [ ] No KYC record: Shows NOT_SUBMITTED state
- [ ] Empty files array: Shows "No documents uploaded"
- [ ] Null/undefined values: Handles gracefully (no crash)
- [ ] Missing document URLs: Shows broken image icon
- [ ] Invalid status value: Defaults to NOT_SUBMITTED

### File Upload Edge Cases

**Very Large File:**
- [ ] 15MB file upload rejected
- [ ] Error message: "File too large. Maximum size is 10MB."
- [ ] User can select different file

**Corrupted Image:**
- [ ] Corrupted JPEG/PNG rejected by backend
- [ ] Error message from backend displayed
- [ ] User can retry with valid file

**Unsupported Format:**
- [ ] Uploading GIF rejected
- [ ] Uploading BMP rejected
- [ ] Uploading TIFF rejected
- [ ] Error message: "Invalid file format. Only JPEG, PNG allowed."

**Zero-Byte File:**
- [ ] Empty file rejected
- [ ] Error message: "File is empty or corrupted."

**Network Interruption:**
- [ ] WiFi disconnects during upload
- [ ] Upload pauses and shows error
- [ ] Error message: "Network error. Please check your connection."
- [ ] "Retry" button restarts upload

**Slow Network:**
- [ ] Upload on 3G takes longer (30-60s per file)
- [ ] Progress updates correctly
- [ ] No timeout if < 120 seconds
- [ ] User sees progress advancing slowly

**Upload Timeout:**
- [ ] Upload exceeding 120 seconds times out
- [ ] Error message: "Upload timed out. Please try again."
- [ ] User can retry

**Simultaneous Uploads:**
- [ ] Starting second upload wizard while first pending
- [ ] Error message: "KYC already submitted and pending review"
- [ ] Cannot submit duplicate application

### Form Edge Cases

**Skipping Steps:**
- [ ] Cannot skip Step 1 (must select ID type)
- [ ] Cannot skip Step 2 (must upload required docs)
- [ ] Cannot skip Step 3 (must review before submit)

**Back Navigation:**
- [ ] Tapping "Previous" preserves uploaded documents
- [ ] Can edit ID type selection in Step 1
- [ ] Can change uploaded documents in Step 2
- [ ] No data loss on back navigation

**Cancel During Upload:**
- [ ] Tapping "Cancel" during upload shows confirmation
- [ ] Confirmation: "Upload in progress. Are you sure?"
- [ ] Cancelling stops upload (documents not saved)
- [ ] Returns to review screen

**App Backgrounding:**
- [ ] Backgrounding app during upload pauses upload (optional)
- [ ] Foregrounding app resumes upload
- [ ] Upload progress preserved
- [ ] No duplicate upload

**App Crash During Upload:**
- [ ] Upload not saved if app crashes
- [ ] User must restart upload wizard
- [ ] No partial KYC records created

### UI Edge Cases

**Long Document Names:**
- [ ] Document type names truncate if too long
- [ ] Uses ellipsis (...) for overflow
- [ ] Full name visible on hover/tap (tooltip)

**Small Screen Devices:**
- [ ] UI scales correctly on small screens (iPhone SE, etc.)
- [ ] Buttons remain tappable (≥44x44px)
- [ ] Text remains readable
- [ ] Images scale proportionally

**Large Screen Devices:**
- [ ] UI uses available space efficiently (tablets)
- [ ] Layout adjusts for landscape orientation
- [ ] Document previews larger on tablets
- [ ] Wizard steps visible side-by-side (tablet landscape)

**Dark Mode:**
- [ ] KYC screens support dark mode (if app has dark mode)
- [ ] Text readable in dark mode
- [ ] Buttons have proper contrast
- [ ] Status badges visible in dark mode

---

## 16. Platform-Specific Testing

### iOS Testing

**General:**
- [ ] Keyboard avoidance works (KeyboardAvoidingView)
- [ ] Safe areas respected (notch, home indicator)
- [ ] Status bar style correct (light/dark)
- [ ] Navigation animations smooth (native feel)

**Camera & Permissions:**
- [ ] Camera permission dialog shows proper message
- [ ] Message: "iAyos needs camera access to capture KYC documents"
- [ ] Permission denial shows alert
- [ ] Alert has "Open Settings" button
- [ ] Tapping "Open Settings" navigates to iOS Settings app
- [ ] Can enable permission in Settings and return to app

**Gallery Permissions:**
- [ ] Photo library permission dialog shows
- [ ] Message: "iAyos needs gallery access to select KYC documents"
- [ ] Permission denial shows alert
- [ ] Can enable in Settings

**Action Sheets:**
- [ ] Action sheets display iOS-native style
- [ ] Options: "Take Photo", "Choose from Library", "Cancel"
- [ ] "Cancel" button separated at bottom
- [ ] Tapping outside dismisses sheet
- [ ] Swipe down gesture dismisses sheet

**Image Picker:**
- [ ] iOS photo picker UI displays
- [ ] Can browse all albums
- [ ] Can search photos (iOS 15+)
- [ ] Can select photo
- [ ] Crop editor appears after selection (if implemented)

**File Picker (for PDFs):**
- [ ] iOS Files app opens for PDF selection
- [ ] Can browse iCloud Drive, Files, etc.
- [ ] Can select PDF file
- [ ] File size displayed during selection

**Notifications (Future):**
- [ ] Push notification permission requested (Phase 9)
- [ ] Notification shows on KYC approval/rejection

### Android Testing

**General:**
- [ ] Status bar color matches app theme
- [ ] Keyboard handling works correctly
- [ ] Back button navigation works
- [ ] Back button dismissed modals
- [ ] Material Design ripple effects visible

**Camera & Permissions:**
- [ ] Camera permission dialog shows
- [ ] Message: "iAyos needs camera access to capture KYC documents"
- [ ] Permission denial shows alert
- [ ] Alert has "Open Settings" button
- [ ] Tapping "Open Settings" navigates to Android Settings app
- [ ] Can enable permission in Settings

**Gallery Permissions:**
- [ ] Storage permission dialog shows (Android <10)
- [ ] Photo picker permission dialog shows (Android 10+)
- [ ] Permission denial shows alert
- [ ] Can enable in Settings

**Alert Dialogs:**
- [ ] Alert dialogs display Android-native style
- [ ] Options: "Take Photo", "Choose from Library", "Cancel"
- [ ] Tapping outside dismisses dialog
- [ ] Back button dismisses dialog

**Image Picker:**
- [ ] Android photo picker UI displays
- [ ] Can browse all folders
- [ ] Can select photo
- [ ] Crop editor appears after selection (if implemented)

**File Picker (for PDFs):**
- [ ] Android file picker opens for PDF selection
- [ ] Can browse Downloads, Documents, etc.
- [ ] Can select PDF file
- [ ] File size displayed during selection

**Back Button Behavior:**
- [ ] Back button in upload wizard returns to previous step
- [ ] Back button in preview screen closes preview
- [ ] Back button on Step 1 shows cancel confirmation
- [ ] Back button during upload shows cancel confirmation

**Notifications (Future):**
- [ ] Push notification permission requested (Android 13+)
- [ ] Notification shows on KYC approval/rejection

---

## 17. Performance Testing

### Load Performance

**KYC Status Screen:**
- [ ] Initial load < 1 second (cached data)
- [ ] API request < 2 seconds (WiFi)
- [ ] Document thumbnails load < 1 second each
- [ ] No lag during scroll
- [ ] Smooth pull-to-refresh

**Upload Wizard:**
- [ ] Step transitions smooth (< 100ms)
- [ ] No lag when selecting ID type
- [ ] Document preview renders quickly (< 500ms)
- [ ] Form validation instant (no delay)

**Document Preview:**
- [ ] Full-size image loads < 2 seconds (WiFi)
- [ ] Zoom in/out smooth (60fps)
- [ ] Pinch-to-zoom responsive
- [ ] Pan gesture smooth when zoomed

**Upload Process:**
- [ ] Upload starts immediately after submit
- [ ] Progress updates every 100ms
- [ ] No UI freezing during upload
- [ ] App responsive during upload

### Memory Usage

**App Memory:**
- [ ] App memory < 200MB during normal use
- [ ] Memory doesn't increase during wizard navigation
- [ ] Memory released after upload complete
- [ ] No memory leaks from image loading

**Image Memory:**
- [ ] Images compressed before upload (reduces memory)
- [ ] Thumbnails cached efficiently
- [ ] Full-size images not kept in memory (preview only)
- [ ] Image cache cleared after upload

**Cache Memory:**
- [ ] React Query cache < 10MB
- [ ] AsyncStorage usage minimal
- [ ] No excessive caching of large files

### Network Efficiency

**API Calls:**
- [ ] KYC status API called only on mount + refresh
- [ ] No duplicate API calls
- [ ] Cache prevents unnecessary requests (5-min stale time)
- [ ] Upload API called only once per submission

**Image Upload:**
- [ ] Images compressed before upload (70% size reduction)
- [ ] Compression reduces upload time
- [ ] Upload uses multipart/form-data (efficient)
- [ ] Progress tracking lightweight (minimal overhead)

**Bandwidth Usage:**
- [ ] Average upload: 10-20 MB total (4 documents, compressed)
- [ ] Download: <100 KB (thumbnails, status data)
- [ ] Total bandwidth per KYC submission: ~20 MB

### Battery Impact

- [ ] App doesn't drain battery excessively during upload
- [ ] Screen stays on during upload (prevents timeout)
- [ ] Background upload pauses to save battery (optional)
- [ ] No runaway processes after upload

### Startup Performance

- [ ] KYC screens load from deep link < 2 seconds
- [ ] No blocking on app startup
- [ ] KYC data prefetched if user navigates to KYC section

---

## 18. Accessibility

### Screen Reader Support

**VoiceOver (iOS) / TalkBack (Android):**
- [ ] All buttons have accessible labels
- [ ] Button labels descriptive:
  - [ ] "Upload Documents" (not just "Upload")
  - [ ] "National ID option" (not just "National ID")
  - [ ] "Upload ID Front" (not just "Upload")
  - [ ] "Submit for verification" (not just "Submit")
- [ ] All images have alt text:
  - [ ] Document thumbnails: "National ID Front"
  - [ ] Status icons: "Verified status"
  - [ ] Info icons: "Information"
- [ ] Form fields have labels:
  - [ ] "Select your ID type"
  - [ ] "Upload ID Front (required)"
- [ ] Error messages announced:
  - [ ] "Error: File too large"
  - [ ] "Error: Document not uploaded"
- [ ] Success toasts announced:
  - [ ] "Documents uploaded successfully"
  - [ ] "KYC status refreshed"
- [ ] Progress updates announced:
  - [ ] "Uploading ID Front, 50% complete"
  - [ ] "Upload complete"

**Focus Order:**
- [ ] Tab order follows visual order (top to bottom)
- [ ] No focus traps (can navigate away from modals)
- [ ] Focus returns to trigger element after modal close

**Accessible Hints:**
- [ ] Buttons have hints when needed:
  - [ ] "Upload Documents" hint: "Opens upload wizard"
  - [ ] Document card hint: "Tap to view full-size image"

### Font Scaling

**System Font Size:**
- [ ] App supports system font scaling (100%-200%)
- [ ] Text remains readable at 200% scale
- [ ] Layout doesn't break with large text
- [ ] Buttons expand to fit text
- [ ] No text truncation at large sizes

**Minimum Font Sizes:**
- [ ] Body text: ≥14px
- [ ] Button text: ≥16px
- [ ] Headings: ≥18px
- [ ] Small text (file size, date): ≥12px

### Color Contrast

**WCAG AA Compliance:**
- [ ] Text has sufficient contrast ratio (≥4.5:1)
- [ ] Button text vs background: ≥4.5:1
- [ ] Status badges:
  - [ ] "Verified" green badge: ≥4.5:1
  - [ ] "Pending" yellow badge: ≥4.5:1
  - [ ] "Rejected" red badge: ≥4.5:1
- [ ] Error messages: red text ≥4.5:1 against background
- [ ] Links: blue text ≥4.5:1

**Color Not Sole Indicator:**
- [ ] Status uses color + icon (not just color)
- [ ] Required fields use asterisk + text (not just red color)
- [ ] Errors use icon + text (not just red color)

### Touch Targets

**Minimum Size:**
- [ ] All buttons ≥44x44 pixels
- [ ] Icon buttons ≥44x44 pixels
- [ ] Radio buttons (ID type cards) ≥48px height
- [ ] Checkboxes ≥44x44 pixels
- [ ] Toggle switches ≥44x44 pixels

**Spacing:**
- [ ] Adequate spacing between buttons (≥8px)
- [ ] ID type cards separated (≥16px)
- [ ] Document cards separated (≥12px)

---

## 19. Security Testing

### Authentication & Authorization

**Authenticated Access:**
- [ ] All KYC API endpoints require authentication
- [ ] Unauthenticated requests return 401 Unauthorized
- [ ] Cannot access other users' KYC data
- [ ] Cannot upload KYC for other users

**Token Validation:**
- [ ] Expired JWT token triggers re-authentication
- [ ] Token refresh handled automatically (if implemented)
- [ ] Session timeout logs user out
- [ ] Cannot bypass authentication

**Authorization:**
- [ ] Worker can upload KYC
- [ ] Client cannot upload KYC (if applicable)
- [ ] Admin can view/approve/reject KYC
- [ ] Regular users cannot access admin endpoints

### Data Privacy

**Encryption in Transit:**
- [ ] All API calls use HTTPS (production)
- [ ] WebSocket uses WSS (production)
- [ ] No sensitive data sent over HTTP
- [ ] TLS 1.2 or higher used

**Encryption at Rest:**
- [ ] Documents stored in Supabase with encryption at rest
- [ ] Database credentials encrypted
- [ ] No plaintext storage of sensitive data

**Document URLs:**
- [ ] Supabase URLs not guessable (random filenames)
- [ ] URLs use secure tokens (if applicable)
- [ ] Cannot enumerate files by URL guessing
- [ ] Public URLs only for user's own documents

**Cache Security:**
- [ ] KYC data cleared on logout
- [ ] AsyncStorage cleared on logout
- [ ] No KYC data persisted insecurely
- [ ] React Query cache cleared on logout

### Input Validation & Sanitization

**Client-Side Validation:**
- [ ] File size validated (max 10MB)
- [ ] File format validated (JPEG/PNG only)
- [ ] Required fields enforced
- [ ] Cannot submit empty form

**Server-Side Validation:**
- [ ] File size validated on backend (max 10MB)
- [ ] File format validated on backend
- [ ] MIME type checked (not just extension)
- [ ] File content validated (not just filename)
- [ ] Malicious files rejected (if scanner implemented)

**SQL Injection Prevention:**
- [ ] All database queries use parameterized statements
- [ ] No raw SQL with user input
- [ ] ORM (Django ORM) used for queries

**XSS Prevention:**
- [ ] User input sanitized on display
- [ ] Rejection notes from admin sanitized
- [ ] No HTML rendering of user input
- [ ] React escapes all text by default

**CSRF Protection:**
- [ ] CSRF tokens used for POST requests (Django default)
- [ ] SameSite cookies used
- [ ] CORS properly configured

### File Upload Security

**File Type Verification:**
- [ ] Backend checks MIME type (not just extension)
- [ ] Image files validated as actual images
- [ ] PDF files validated as actual PDFs
- [ ] Executable files rejected (.exe, .sh, etc.)

**File Size Limits:**
- [ ] Hard limit enforced on backend (10MB)
- [ ] Prevents DoS via large uploads
- [ ] Disk quota monitoring (backend)

**Virus Scanning (Future):**
- [ ] Uploaded files scanned for malware (future feature)
- [ ] ClamAV or similar used
- [ ] Infected files rejected

**Path Traversal Prevention:**
- [ ] Filenames sanitized (no ../, etc.)
- [ ] Files stored in designated path only
- [ ] Cannot upload to arbitrary directories

### Privacy Compliance

**GDPR (if applicable):**
- [ ] User consents to document upload (terms checkbox)
- [ ] User can request data deletion (future feature)
- [ ] Data retention policy documented
- [ ] Data processing agreement in place

**Data Minimization:**
- [ ] Only required documents uploaded
- [ ] No unnecessary personal data collected
- [ ] Documents deleted after verification (optional policy)

---

## 20. Admin Approval/Rejection Flow (Out of Scope for Mobile, but Required for Testing)

**Note:** This section is for backend/web admin panel, but mobile QA must verify that admin actions reflect correctly in mobile app.

### Admin Panel Access (Web)

- [ ] Admin can log in to admin panel: http://localhost:3000/admin/kyc
- [ ] KYC dashboard displays pending submissions
- [ ] Each submission shows:
  - [ ] Worker name
  - [ ] Submission date
  - [ ] Document thumbnails
  - [ ] "View Details" link

### Admin Review Flow (Web)

- [ ] Admin clicks "View Details"
- [ ] Document viewer displays all uploaded documents
- [ ] Can view each document full-size
- [ ] Can download documents (optional)
- [ ] "Approve" button visible
- [ ] "Reject" button visible

### Admin Approval (Web → Mobile)

- [ ] Admin clicks "Approve"
- [ ] Confirmation dialog: "Approve this KYC submission?"
- [ ] Admin confirms approval
- [ ] Backend updates:
  - [ ] `kyc.kyc_status` → "APPROVED"
  - [ ] `kyc.reviewedAt` → current timestamp
  - [ ] `accounts.KYCVerified` → "APPROVED"
- [ ] Email sent to user (optional)
- [ ] **Mobile App:**
  - [ ] Pull-to-refresh on KYC status screen
  - [ ] Status updates to "APPROVED"
  - [ ] Badge turns green
  - [ ] Success message displays
  - [ ] Profile completion updates
  - [ ] Worker can now access restricted features

### Admin Rejection (Web → Mobile)

- [ ] Admin clicks "Reject"
- [ ] Rejection reason form displays
- [ ] Admin enters reason: "Document not clear"
- [ ] Admin confirms rejection
- [ ] Backend updates:
  - [ ] `kyc.kyc_status` → "REJECTED"
  - [ ] `kyc.notes` → rejection reason
  - [ ] `kyc.reviewedAt` → current timestamp
  - [ ] `accounts.KYCVerified` → "REJECTED"
- [ ] Email sent to user (optional)
- [ ] **Mobile App:**
  - [ ] Pull-to-refresh on KYC status screen
  - [ ] Status updates to "REJECTED"
  - [ ] Badge turns red
  - [ ] Rejection reason displays
  - [ ] "Resubmit Documents" button appears
  - [ ] Worker can resubmit via upload wizard

---

## 21. Integration with Other Mobile Phases

### Profile Management Integration (Phase 6)

- [ ] Profile completion widget includes KYC status
- [ ] Profile completion increases after KYC approval
- [ ] KYC verification badge shows on profile (if implemented)
- [ ] KYC status accessible from profile menu

### Job Browsing & Application (Phase 1)

- [ ] Restricted job categories require KYC verification
- [ ] Attempting to apply for restricted job shows KYC prompt
- [ ] Prompt: "This job requires KYC verification. Upload documents now?"
- [ ] Tapping "Upload Documents" navigates to KYC wizard
- [ ] After KYC approval, can apply for restricted jobs

### Earnings & Payments (Phase 4)

- [ ] Withdrawal features require KYC verification (future feature)
- [ ] Attempting to withdraw shows KYC prompt
- [ ] After KYC approval, can withdraw earnings

### Real-Time Chat (Phase 5)

- [ ] No integration (chat works regardless of KYC status)

### Push Notifications (Phase 9)

- [ ] Notification sent on KYC approval (Phase 9 feature)
- [ ] Notification sent on KYC rejection (Phase 9 feature)
- [ ] Tapping notification navigates to KYC status screen

---

## 22. Regression Testing

### Previous Phases Still Work

**Phase 1: Job Application & Browsing**
- [ ] Job browsing works
- [ ] Job details screen works
- [ ] Job search works
- [ ] Job application works
- [ ] Active jobs screen works
- [ ] Saved jobs screen works

**Phase 2: Two-Phase Job Completion**
- [ ] Mark job complete (worker) works
- [ ] Accept job completion (client) works
- [ ] Job completion confirmation works

**Phase 3: Escrow Payment System**
- [ ] Escrow payment works
- [ ] Payment methods work
- [ ] Wallet deposit works
- [ ] Payment timeline works

**Phase 4: Final Payment & Earnings**
- [ ] Final payment works
- [ ] Worker earnings dashboard works
- [ ] Payment received screen works
- [ ] Transaction history works

**Phase 5: Real-Time Chat**
- [ ] Conversations list works
- [ ] Chat screen works
- [ ] Image upload in chat works
- [ ] Typing indicators work
- [ ] WebSocket connection works

**Phase 6: Worker Profile Management**
- [ ] Profile editing works
- [ ] Avatar upload works
- [ ] Portfolio upload works
- [ ] Certifications management works
- [ ] Materials management works

**Adding Phase 7 (KYC) doesn't break previous features:**
- [ ] No navigation issues
- [ ] No API conflicts
- [ ] No styling regressions
- [ ] No performance degradation

---

## Test Completion Checklist

- [ ] All test cases executed (350+ tests)
- [ ] All critical issues documented
- [ ] Screenshots captured for visual issues
- [ ] Performance metrics recorded (upload times, load times)
- [ ] Test report created (summary document)
- [ ] Bugs logged in issue tracker (if any)
- [ ] QA sign-off obtained
- [ ] Phase 7 marked as QA complete (move to `docs/qa/DONE/`)

---

**Total Test Cases**: 350+
**Estimated Testing Time**: 15-20 hours
**Priority**: HIGH (Critical verification feature)
**Status**: ⏳ Awaiting QA Execution

---

**Date Created**: November 15, 2025
**Created By**: Development Team (Claude Code AI Agent)
**Phase**: Mobile Phase 7 - KYC Document Upload & Verification
**Related Documentation**:
- Completion Doc: `docs/01-completed/mobile/PHASE_7_KYC_DOCUMENT_UPLOAD_COMPLETE.md`
- Progress Doc: `docs/04-archive/duplicates/MOBILE_PHASE_7_KYC_UPLOAD_PROGRESS.md` (archived)

---

**Notes for QA Team**:
1. Test on both iOS and Android physical devices (camera behavior differs)
2. Test with various document types and file sizes
3. Test network interruptions during upload (turn off WiFi mid-upload)
4. Test admin approval/rejection flow (requires admin panel access)
5. Verify KYC status updates in real-time (pull-to-refresh)
6. Test with slow network (3G) to verify progress tracking accuracy
7. Test permission denial scenarios (deny camera/gallery permissions)
8. Verify documents persist after app restart and account switch
9. Test with expired/invalid IDs (backend should reject via admin review)
10. Verify GDPR compliance (data privacy, user consent)

**Known Limitations (Expected Behavior)**:
- No offline upload queue (documents must be uploaded with active internet)
- No draft saving (if user exits mid-wizard, progress is lost for security)
- No PDF preview in mobile app (PDFs for clearances viewable only via download)
- No image editing beyond cropping (brightness/contrast adjustments not available)
- No OCR validation (no automatic ID text extraction)
- No duplicate detection (system allows re-uploading same documents)

**Out of Scope (Future Enhancements)**:
- AI-powered document quality check (blur/glare detection)
- OCR for automatic ID information extraction
- Face matching between ID photo and selfie
- Document expiry date extraction and warning
- Multi-language support for instructions
- Video selfie verification
- Live ID capture with real-time alignment guides

---

*End of QA Checklist*
