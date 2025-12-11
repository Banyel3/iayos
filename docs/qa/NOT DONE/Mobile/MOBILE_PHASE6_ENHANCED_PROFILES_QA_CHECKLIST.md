# Mobile Phase 6 - QA Testing Checklist

**Feature**: Enhanced Worker Profiles (Certifications & Materials)
**Date**: November 15, 2025
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Supabase storage configured for profile images, portfolio, certificates
- [ ] Mobile app running via Expo Go or standalone build
- [ ] Test accounts created (2 workers, 2 clients)
- [ ] Camera/photo library permissions granted
- [ ] Network debugging enabled (to test offline mode)
- [ ] Test worker profile has existing data (for editing tests)

## Pre-Testing Setup

### Account 1 (Worker - Complete Profile):

- [ ] Email: worker1@test.com
- [ ] Profile type: WORKER
- [ ] Has profile photo uploaded
- [ ] Has 2+ certifications
- [ ] Has 3+ materials/products
- [ ] Has portfolio with 5+ images
- [ ] Profile completion > 70%

### Account 2 (Worker - Incomplete Profile):

- [ ] Email: worker2@test.com
- [ ] Profile type: WORKER
- [ ] No profile photo
- [ ] No certifications
- [ ] No materials
- [ ] Empty portfolio
- [ ] Profile completion < 30%

### Account 3 (Client):

- [ ] Email: client1@test.com
- [ ] Profile type: CLIENT
- [ ] For viewing worker profiles

---

## 1. Worker Profile Viewing

**File**: `app/profile/index.tsx` (660 lines)

### Screen Access & Layout

- [ ] Navigate to Profile tab from bottom navigation
- [ ] Screen displays worker's name in header
- [ ] Avatar displayed (or placeholder if none)
- [ ] Profile completion widget visible at top
- [ ] Stats cards visible (jobs completed, earnings, rating)
- [ ] Bio section displays
- [ ] Skills/specializations section displays
- [ ] Service areas section displays
- [ ] Certifications section displays (up to 3)
- [ ] Materials section displays (up to 3)
- [ ] Portfolio section displays (up to 3 images)
- [ ] "Edit Profile" button visible
- [ ] Screen scrolls smoothly

### Profile Completion Widget

- [ ] Circular progress indicator displays
- [ ] Progress percentage shows (0-100%)
- [ ] Color coding correct:
  - [ ] Red for <30% (Needs improvement)
  - [ ] Yellow for 30-70% (Good progress)
  - [ ] Green for >70% (Nearly complete)
- [ ] Info button (i icon) visible
- [ ] Tapping info button shows checklist modal
- [ ] Modal displays 8 completion criteria:
  1. [ ] Profile photo uploaded (12.5%)
  2. [ ] Bio 50+ characters (12.5%)
  3. [ ] Hourly rate set (12.5%)
  4. [ ] 3+ skills or 2+ categories (12.5%)
  5. [ ] Phone number verified (12.5%)
  6. [ ] 1+ service area (12.5%)
  7. [ ] Certifications added (12.5%)
  8. [ ] Portfolio items added (12.5%)
- [ ] Completed criteria show checkmarks
- [ ] Incomplete criteria show empty circles
- [ ] Linear progress bar shows below criteria
- [ ] Percentage text displays (e.g., "62% Complete")

### Stats Cards

- [ ] Three cards display horizontally
- [ ] Jobs Completed card shows count
- [ ] Total Earnings card shows ₱ amount with commas
- [ ] Rating card shows average (e.g., "4.5")
- [ ] Star icons display for rating
- [ ] Cards have proper spacing and shadows
- [ ] Tapping cards navigates (if applicable)

### Bio Section

- [ ] "About Me" heading displays
- [ ] Bio text displays (or "No bio yet" if empty)
- [ ] Long bio truncates properly
- [ ] Bio wraps to multiple lines
- [ ] Edit icon visible

### Skills/Specializations Section

- [ ] "Skills & Specializations" heading displays
- [ ] Skills display as chips/tags
- [ ] Skills wrap to multiple rows
- [ ] Empty state: "No skills added yet"
- [ ] Edit icon visible

### Service Areas Section

- [ ] "Service Areas" heading displays
- [ ] Service areas display as list items
- [ ] Empty state: "No service areas yet"
- [ ] Edit icon visible

### Certifications Section

- [ ] "Certifications" heading displays
- [ ] Shows up to 3 most recent certifications
- [ ] Each certification shows:
  - [ ] Certification name
  - [ ] Issuing organization
  - [ ] Verification status badge (verified/pending)
  - [ ] Expiry warning if <30 days (red badge)
- [ ] "View All (X)" link displays if certifications exist
- [ ] Shows total count in link (e.g., "View All (5)")
- [ ] "View All X Certifications" button if >3
- [ ] Empty state: "Add Certifications" CTA button
- [ ] Tapping "View All" navigates to certifications list
- [ ] Tapping "Add Certifications" navigates to certifications list

### Materials Section

- [ ] "Materials & Products" heading displays
- [ ] Shows up to 3 most recent materials
- [ ] Each material shows:
  - [ ] Material name
  - [ ] Price (₱X,XXX.XX)
  - [ ] Availability badge (green "Available" or red "Unavailable")
- [ ] "View All (X)" link displays if materials exist
- [ ] Shows total count in link (e.g., "View All (7)")
- [ ] "View All X Materials" button if >3
- [ ] Empty state: "Add Materials" CTA button
- [ ] Tapping "View All" navigates to materials list
- [ ] Tapping "Add Materials" navigates to materials list

### Portfolio Section

- [ ] "Portfolio" heading displays
- [ ] Shows up to 3 most recent images
- [ ] Images display in grid (3 columns)
- [ ] Images have rounded corners
- [ ] Images are 100x100 (or similar size)
- [ ] Empty state: "Add portfolio images" if none
- [ ] Tapping image opens full-screen viewer
- [ ] "View All" link if >3 images

### Navigation

- [ ] "Edit Profile" button navigates to edit screen
- [ ] Back button returns to Profile tab
- [ ] All section links navigate correctly

### Pull-to-Refresh

- [ ] Pull down gesture triggers refresh
- [ ] Refresh indicator (spinner) shows
- [ ] Profile data reloads from backend
- [ ] Stats update after refresh
- [ ] Certifications/materials update
- [ ] Refresh completes in < 2 seconds

---

## 2. Profile Editing

**File**: `app/profile/edit.tsx` (640 lines)

### Screen Access & Layout

- [ ] Navigate from profile view via "Edit Profile"
- [ ] Header displays "Edit Profile"
- [ ] Screen displays all editable fields
- [ ] "Save" button visible in header
- [ ] Screen scrolls smoothly
- [ ] Keyboard-aware scrolling works

### Avatar Section

- [ ] Avatar section at top of form
- [ ] Current avatar displays (or placeholder)
- [ ] "Change Photo" button visible
- [ ] Tapping button navigates to avatar upload screen
- [ ] Avatar updates after upload
- [ ] Circular display (150x150)

### Portfolio Section

- [ ] "Portfolio" section displays
- [ ] Shows all uploaded images (up to 10)
- [ ] "Add Photos" button visible
- [ ] Tapping button allows multi-select
- [ ] Can add up to 5 images at once
- [ ] Upload progress shows for each image
- [ ] Images display in grid after upload
- [ ] Long-press image enables selection mode
- [ ] Can delete selected images
- [ ] Delete confirmation dialog shows

### Bio Field

- [ ] "Bio" field displays
- [ ] Current bio pre-filled (if exists)
- [ ] Multi-line input (TextInput with multiline)
- [ ] Character counter shows (500 max)
- [ ] Counter updates as you type
- [ ] Counter turns red when >500 characters
- [ ] Validation: 50-500 characters
- [ ] Error message shows if <50 characters
- [ ] Error message shows if >500 characters
- [ ] Placeholder: "Tell clients about yourself..."

### Hourly Rate Field

- [ ] "Hourly Rate" field displays
- [ ] Current rate pre-filled (if exists)
- [ ] Numeric keyboard on mobile
- [ ] PHP ₱ symbol prefix displays
- [ ] Validation: 0.01 - 10,000
- [ ] Error message shows if out of range
- [ ] Error message shows if not a number
- [ ] Decimal values accepted (e.g., 150.50)
- [ ] Placeholder: "Enter hourly rate"

### Phone Number Field

- [ ] "Phone Number" field displays
- [ ] Current phone pre-filled (if exists)
- [ ] Phone keyboard on mobile
- [ ] Validation: 10-11 digits
- [ ] Error message shows if invalid length
- [ ] Error message shows if non-numeric
- [ ] Format: +63XXXXXXXXXX or 09XXXXXXXXX
- [ ] Placeholder: "Enter phone number"

### Skills Field

- [ ] "Skills & Specializations" field displays
- [ ] Current skills pre-filled as chips
- [ ] Text input for adding new skills
- [ ] Pressing Enter/comma adds skill
- [ ] Skills display as removable chips
- [ ] Tapping X on chip removes skill
- [ ] Validation: At least 1 skill required
- [ ] Empty state: "Add your skills"

### Service Areas Field

- [ ] "Service Areas" field displays
- [ ] Current areas pre-filled as list
- [ ] Text input for adding new area
- [ ] Pressing Enter/comma adds area
- [ ] Areas display as removable items
- [ ] Tapping X removes area
- [ ] Validation: At least 1 area required
- [ ] Empty state: "Add service areas"

### Certifications Management Section

- [ ] Section displays after Skills field
- [ ] Ribbon icon with "Certifications" title
- [ ] Hint: "Add professional certifications"
- [ ] "Manage Certifications" button visible
- [ ] Button has settings icon + chevron
- [ ] Tapping button navigates to certifications list
- [ ] Badge shows count if certifications exist (e.g., "3")

### Materials Management Section

- [ ] Section displays after Certifications
- [ ] Cube icon with "Materials & Products" title
- [ ] Hint: "List materials or products you offer"
- [ ] "Manage Materials" button visible
- [ ] Button has settings icon + chevron
- [ ] Tapping button navigates to materials list
- [ ] Badge shows count if materials exist (e.g., "5")

### Form Validation

- [ ] Save button disabled if form invalid
- [ ] Save button enabled when all fields valid
- [ ] Validation runs on blur (field exit)
- [ ] Validation runs on submit
- [ ] Error messages display below fields
- [ ] Error messages styled in red
- [ ] First invalid field scrolls into view

### Save Functionality

- [ ] Tapping "Save" submits form
- [ ] Loading spinner shows during save
- [ ] Save button disabled during save
- [ ] Success toast shows after save
- [ ] Toast message: "Profile updated successfully"
- [ ] Profile view refreshes after save
- [ ] Navigates back to profile view
- [ ] Error toast shows if save fails

### Unsaved Changes Warning

- [ ] If fields modified, back button shows warning
- [ ] Warning dialog: "Discard unsaved changes?"
- [ ] Options: "Discard" and "Cancel"
- [ ] Tapping "Discard" navigates away
- [ ] Tapping "Cancel" stays on edit screen
- [ ] Warning only shows if changes made
- [ ] No warning if no changes made

### Keyboard Handling

- [ ] Keyboard appears when tapping input
- [ ] Screen adjusts when keyboard opens
- [ ] Input field stays visible above keyboard
- [ ] Can scroll form while keyboard open
- [ ] Keyboard dismissed when tapping outside
- [ ] "Done" button dismisses keyboard (iOS)

---

## 3. Avatar Upload

**File**: `app/profile/avatar.tsx` (380 lines)
**Component**: `components/AvatarUpload.tsx` (251 lines)

### Screen Access

- [ ] Navigate from profile edit screen
- [ ] Header displays "Upload Avatar"
- [ ] Current avatar displays (or placeholder)
- [ ] Two action buttons: "Take Photo" and "Choose from Gallery"
- [ ] Delete button visible if avatar exists

### Camera Photo Capture

- [ ] Tapping "Take Photo" requests camera permission
- [ ] Permission dialog shows proper message
- [ ] If permission granted, camera launches
- [ ] Can capture photo with camera
- [ ] Photo preview shows after capture
- [ ] Crop editor appears after capture
- [ ] Crop to square aspect ratio (1:1)
- [ ] Can adjust crop area
- [ ] "Crop" button saves crop
- [ ] "Retake" button returns to camera

### Gallery Photo Selection

- [ ] Tapping "Choose from Gallery" requests permission
- [ ] Permission dialog shows proper message
- [ ] If permission granted, gallery opens
- [ ] Can browse gallery images
- [ ] Can select photo from gallery
- [ ] Crop editor appears after selection
- [ ] Crop to square aspect ratio (1:1)
- [ ] Can adjust crop area
- [ ] "Crop" button saves crop
- [ ] "Cancel" button returns to gallery

### Image Processing

- [ ] Image resized to 300x300 (or config size)
- [ ] Image compressed to <2MB
- [ ] Compression quality 80%
- [ ] Processing shows spinner
- [ ] Processing completes in < 2 seconds

### Upload Progress

- [ ] Upload starts automatically after crop
- [ ] Progress banner appears
- [ ] Banner shows: "Uploading avatar... X%"
- [ ] Progress percentage updates (0-100%)
- [ ] Spinner animates during upload
- [ ] Upload completes in < 5 seconds (WiFi)
- [ ] Success message: "Avatar uploaded successfully!"
- [ ] Avatar updates in profile view
- [ ] Upload persists after app restart

### Delete Avatar

- [ ] "Delete Avatar" button visible if avatar exists
- [ ] Button styled in red/destructive color
- [ ] Tapping button shows confirmation dialog
- [ ] Dialog message: "Are you sure you want to delete your avatar?"
- [ ] Options: "Delete" and "Cancel"
- [ ] Tapping "Delete" removes avatar
- [ ] Success toast: "Avatar deleted"
- [ ] Avatar reverts to placeholder
- [ ] Profile completion percentage decreases by 12.5%
- [ ] Delete persists after app restart

### Error Handling

- [ ] If camera permission denied, shows alert
- [ ] Alert message: "Camera permission is required to take photos."
- [ ] If gallery permission denied, shows alert
- [ ] Alert message: "Gallery permission is required to choose photos."
- [ ] If upload fails, shows error toast
- [ ] Error message: "Failed to upload avatar. Please try again."
- [ ] Can retry upload after failure
- [ ] If file too large (>5MB), shows error
- [ ] Error message: "Image too large. Maximum size is 5MB."

### Display & Integration

- [ ] Avatar displays as circle (150x150)
- [ ] Uploaded avatar shows immediately in edit screen
- [ ] Avatar shows in profile view after save
- [ ] Avatar shows in conversations list
- [ ] Avatar shows in job applications
- [ ] Profile completion increases to +12.5% after upload

---

## 4. Portfolio Management

**Files**:
- `components/PortfolioUpload.tsx` (562 lines)
- `components/PortfolioGrid.tsx` (337 lines)
- `components/ImageViewer.tsx` (325 lines)

### Portfolio Upload

- [ ] Navigate from profile edit screen
- [ ] "Add Photos" button visible
- [ ] Button shows if portfolio count < 10
- [ ] Button disabled if portfolio count = 10
- [ ] Tapping button shows action sheet (iOS) or alert (Android)
- [ ] Options: "Take Photo", "Choose from Library", "Cancel"

### Multi-Image Selection (Gallery)

- [ ] Selecting "Choose from Library" opens gallery
- [ ] Can select multiple images (up to 5 at once)
- [ ] Selection counter shows (e.g., "3 selected")
- [ ] "Done" button confirms selection
- [ ] Maximum 5 images enforced
- [ ] Error message if selecting >5
- [ ] Error: "You can only upload 5 images at once."

### Single Photo Capture (Camera)

- [ ] Selecting "Take Photo" opens camera
- [ ] Can capture single photo
- [ ] Photo preview shows after capture
- [ ] Can add caption (200 chars max)
- [ ] Caption input visible below photo
- [ ] Character counter shows (200 max)

### Image Compression

- [ ] Images <2MB skip compression
- [ ] Images ≥2MB compressed automatically
- [ ] Resize to max 1200x1200
- [ ] Compression quality 80%
- [ ] Compression shows spinner
- [ ] Compressed images still high quality

### Sequential Upload

- [ ] Images upload one at a time (sequentially)
- [ ] Upload progress shows for each image
- [ ] Progress: "Uploading image 1 of 5... 45%"
- [ ] Progress bar shows per-image progress
- [ ] Each image shows spinner while uploading
- [ ] Failed image stops upload sequence
- [ ] Can retry failed image
- [ ] Successful images remain uploaded

### Upload Progress Tracking

- [ ] Overall progress shows (e.g., "2 / 5 uploaded")
- [ ] Per-image progress shows (0-100%)
- [ ] Progress banner visible during upload
- [ ] Banner shows: "Uploading image X of Y... Z%"
- [ ] Spinner animates during upload
- [ ] Upload completes in < 10 seconds per image (WiFi)
- [ ] Success message after all uploads complete
- [ ] Message: "All images uploaded successfully!"

### Portfolio Grid Display

- [ ] All uploaded images display in grid
- [ ] Grid has 3 columns
- [ ] Images have rounded corners
- [ ] Images are square (1:1 aspect ratio)
- [ ] Images sized 100x100 (or similar)
- [ ] Grid scrolls if >9 images
- [ ] Upload date shows on hover/long-press
- [ ] Relative timestamps (e.g., "2 hours ago")

### Image Captions

- [ ] Can add caption during upload (optional)
- [ ] Can edit caption after upload
- [ ] Tapping image shows caption input
- [ ] Caption max 200 characters
- [ ] Character counter shows
- [ ] "Save" button updates caption
- [ ] Caption displays in lightbox viewer

### Image Reordering (Drag-Drop)

- [ ] Long-press image enables selection mode
- [ ] Selected images highlighted
- [ ] Drag handle appears on selected images
- [ ] Can drag images to reorder
- [ ] Drag preview shows image
- [ ] Drop target highlights
- [ ] Order updates immediately
- [ ] Order persists to backend
- [ ] Reorder API call: `PUT /api/mobile/profile/portfolio/reorder`

### Image Deletion

- [ ] Long-press image shows context menu
- [ ] Menu option: "Delete Image"
- [ ] Tapping "Delete" shows confirmation dialog
- [ ] Dialog: "Are you sure you want to delete this image?"
- [ ] Options: "Delete" and "Cancel"
- [ ] Tapping "Delete" removes image
- [ ] Success toast: "Image deleted"
- [ ] Grid updates immediately
- [ ] Deletion persists to backend

### Full-Screen Lightbox Viewer

- [ ] Tapping image opens full-screen viewer
- [ ] Image displays at full size
- [ ] Can pinch to zoom (50%-300%)
- [ ] Can swipe to next/previous image
- [ ] Current index shows (e.g., "3 / 10")
- [ ] Close button (X) exits viewer
- [ ] Edit button visible (pencil icon)
- [ ] Delete button visible (trash icon)
- [ ] Caption displays below image (if exists)
- [ ] Swipe gesture smooth (no lag)

### Lightbox Edit Mode

- [ ] Tapping edit button shows caption input
- [ ] Current caption pre-filled
- [ ] Can modify caption
- [ ] "Save" button updates caption
- [ ] "Cancel" button discards changes
- [ ] Success toast after save

### Lightbox Delete

- [ ] Tapping delete button shows confirmation
- [ ] Confirmation dialog same as grid delete
- [ ] Deleting closes lightbox
- [ ] Returns to grid after delete
- [ ] Grid updates after delete

### Maximum Limit Enforcement

- [ ] Portfolio limited to 10 images
- [ ] "Add Photos" button disabled at 10
- [ ] Error message if trying to upload more
- [ ] Error: "Maximum 10 images allowed in portfolio."
- [ ] Must delete image to add new one

### Empty State

- [ ] If portfolio empty, shows placeholder
- [ ] Placeholder: "No portfolio images yet"
- [ ] "Add Photos" button visible
- [ ] CTA text: "Add your first portfolio image"

---

## 5. Certifications Management

**Files**:
- `app/profile/certifications/index.tsx` (580 lines)
- `components/CertificationCard.tsx` (370 lines)
- `components/CertificationForm.tsx` (650 lines)

### Certifications List Screen

- [ ] Navigate from profile edit screen
- [ ] Header displays "Certifications"
- [ ] "Add Certification" button (+) in header
- [ ] All certifications display as cards
- [ ] Cards display in reverse chronological order
- [ ] Pull-to-refresh works
- [ ] Loading spinner on initial load
- [ ] Empty state if no certifications

### Certification Card (Full Mode)

- [ ] Card displays all details
- [ ] Certification name (bold, large font)
- [ ] Issuing organization (below name)
- [ ] Issue date (formatted: "MMM d, yyyy")
- [ ] Expiry date (if exists)
- [ ] Certificate number (if exists)
- [ ] Verification status badge:
  - [ ] Green "Verified" badge if verified
  - [ ] Yellow "Pending" badge if pending
- [ ] Expiry warning badge if <30 days:
  - [ ] Red "Expiring Soon" badge
  - [ ] Days remaining (e.g., "15 days left")
- [ ] Document thumbnail (if uploaded)
- [ ] Document icon (file icon) if no thumbnail
- [ ] Edit button (pencil icon)
- [ ] Delete button (trash icon)

### Certification Card (Compact Mode - Profile View)

- [ ] Shows minimal info
- [ ] Certification name only
- [ ] Issuing organization (small text)
- [ ] Verification badge
- [ ] Expiry warning badge (if applicable)
- [ ] No action buttons
- [ ] Tappable to navigate to full list

### Add Certification Flow

- [ ] Tapping "Add Certification" opens form modal
- [ ] Form displays in bottom sheet (iOS) or dialog (Android)
- [ ] Form title: "Add Certification"
- [ ] All fields visible
- [ ] "Save" button at bottom
- [ ] "Cancel" button in header

### Certification Form Fields

- [ ] **Name** field (required):
  - [ ] Text input
  - [ ] Validation: 3-100 characters
  - [ ] Error message if <3 characters
  - [ ] Error message if >100 characters
  - [ ] Placeholder: "e.g., NCII in Plumbing"
- [ ] **Issuing Organization** field (required):
  - [ ] Text input
  - [ ] Validation: 2-100 characters
  - [ ] Error message if <2 characters
  - [ ] Placeholder: "e.g., TESDA"
- [ ] **Issue Date** field (required):
  - [ ] Date picker button
  - [ ] Tapping button opens date picker
  - [ ] Can select date from calendar
  - [ ] Date displays as "MMM d, yyyy"
  - [ ] Validation: Required
  - [ ] Error message if empty
- [ ] **Expiry Date** field (optional):
  - [ ] Date picker button
  - [ ] Checkbox: "No expiry date"
  - [ ] If checked, date picker disabled
  - [ ] If unchecked, date picker enabled
  - [ ] Validation: Must be after issue date
  - [ ] Error message if before issue date
- [ ] **Certificate Number** field (optional):
  - [ ] Text input
  - [ ] Max 50 characters
  - [ ] Placeholder: "Certificate/ID number"
- [ ] **Certificate Document** field (required on create):
  - [ ] File upload button
  - [ ] Tapping button shows action sheet
  - [ ] Options: "Take Photo", "Choose File", "Cancel"
  - [ ] File preview shows after selection
  - [ ] File name displays
  - [ ] File size displays (e.g., "2.3 MB")
  - [ ] Change file button visible after selection
  - [ ] Validation: Required on create
  - [ ] Error message if missing on create

### Certificate Document Upload

- [ ] Selecting "Take Photo" opens camera
- [ ] Can capture certificate photo
- [ ] Photo preview shows after capture
- [ ] Can crop photo (optional)
- [ ] Selecting "Choose File" opens file picker
- [ ] Can select image file (JPEG, PNG, PDF)
- [ ] File size validated (max 10MB)
- [ ] Error message if file >10MB
- [ ] Error: "File too large. Maximum size is 10MB."
- [ ] File type validated (JPEG/PNG/PDF only)
- [ ] Error message if wrong type
- [ ] Error: "Invalid file type. Only JPEG, PNG, PDF allowed."
- [ ] Upload shows progress (0-100%)
- [ ] **No compression for certificates** (preserve quality)

### Save Certification

- [ ] Tapping "Save" validates form
- [ ] Loading spinner shows during save
- [ ] Save button disabled during save
- [ ] Success toast after save
- [ ] Toast: "Certification added successfully"
- [ ] Form modal closes
- [ ] Certifications list refreshes
- [ ] New certification appears at top
- [ ] Profile completion increases by 12.5% (first certification)

### Edit Certification

- [ ] Tapping edit button opens form modal
- [ ] Form title: "Edit Certification"
- [ ] All fields pre-filled with current values
- [ ] Document field shows current file name
- [ ] Document field optional on edit
- [ ] Can change document (replaces old one)
- [ ] Can update all fields
- [ ] "Save" button updates certification
- [ ] Success toast: "Certification updated"
- [ ] List refreshes after update

### Delete Certification

- [ ] Tapping delete button shows confirmation dialog
- [ ] Dialog: "Are you sure you want to delete this certification?"
- [ ] Options: "Delete" and "Cancel"
- [ ] Tapping "Delete" removes certification
- [ ] Success toast: "Certification deleted"
- [ ] List updates immediately
- [ ] Deletion persists to backend
- [ ] Profile completion decreases if last certification deleted

### Document Viewing

- [ ] Tapping document thumbnail opens viewer
- [ ] Full-screen document viewer displays
- [ ] Can zoom in/out (pinch gesture)
- [ ] Close button (X) exits viewer
- [ ] Download button visible (optional)
- [ ] Share button visible (optional)

### Empty State

- [ ] If no certifications, shows placeholder
- [ ] Placeholder: "No certifications yet"
- [ ] Icon: ribbon or certificate icon
- [ ] Subtext: "Add professional certifications to boost credibility"
- [ ] "Add Certification" button visible

### Pull-to-Refresh

- [ ] Pull down gesture triggers refresh
- [ ] Refresh indicator shows
- [ ] Certifications reload from backend
- [ ] List updates after refresh
- [ ] Refresh completes in < 2 seconds

---

## 6. Materials/Products Management

**Files**:
- `app/profile/materials/index.tsx` (430 lines)
- `components/MaterialCard.tsx` (320 lines)
- `components/MaterialForm.tsx` (570 lines)

### Materials List Screen

- [ ] Navigate from profile edit screen
- [ ] Header displays "Materials & Products"
- [ ] "Add Material" button (+) in header
- [ ] All materials display as cards
- [ ] Cards display in list format
- [ ] Pull-to-refresh works
- [ ] Loading spinner on initial load
- [ ] Empty state if no materials

### Material Card (Full Mode)

- [ ] Card displays all details
- [ ] Material name (bold, large font)
- [ ] Description (2 lines max, truncated)
- [ ] Image thumbnail (100x100) on left
- [ ] Cube icon fallback if no image
- [ ] Price with PHP ₱ symbol (e.g., "₱1,234.56")
- [ ] Price formatted with commas
- [ ] Unit displayed after price (e.g., "per kg")
- [ ] Availability badge:
  - [ ] Green "Available" if available
  - [ ] Red "Unavailable" if not available
- [ ] Availability toggle switch (quick action)
- [ ] Edit button (pencil icon)
- [ ] Delete button (trash icon)

### Material Card (Compact Mode - Profile View)

- [ ] Shows minimal info
- [ ] Material name only
- [ ] Price (₱X,XXX.XX)
- [ ] Availability badge
- [ ] No image
- [ ] No action buttons
- [ ] Tappable to navigate to full list

### Add Material Flow

- [ ] Tapping "Add Material" opens form modal
- [ ] Form displays in bottom sheet (iOS) or dialog (Android)
- [ ] Form title: "Add Material/Product"
- [ ] All fields visible
- [ ] "Save" button at bottom
- [ ] "Cancel" button in header

### Material Form Fields

- [ ] **Name** field (required):
  - [ ] Text input
  - [ ] Validation: 3-100 characters
  - [ ] Error message if <3 characters
  - [ ] Error message if >100 characters
  - [ ] Placeholder: "e.g., Cement bags"
- [ ] **Description** field (required):
  - [ ] Multi-line text input
  - [ ] Validation: 10-500 characters
  - [ ] Error message if <10 characters
  - [ ] Error message if >500 characters
  - [ ] Character counter (500 max)
  - [ ] Counter updates as you type
  - [ ] Placeholder: "Describe your material or product..."
- [ ] **Price** field (required):
  - [ ] Numeric input
  - [ ] PHP ₱ symbol prefix
  - [ ] Validation: ₱0.01 - ₱1,000,000
  - [ ] Error message if out of range
  - [ ] Decimal values accepted (e.g., 150.50)
  - [ ] Formatted with commas on blur (1,234.56)
  - [ ] Placeholder: "0.00"
- [ ] **Unit** field (required):
  - [ ] Text input or dropdown
  - [ ] Validation: 2-50 characters
  - [ ] Common units: "per kg", "per piece", "per meter", "per bag"
  - [ ] Error message if invalid
  - [ ] Placeholder: "e.g., per kg"
- [ ] **Availability** field:
  - [ ] Checkbox or toggle switch
  - [ ] Label: "Available for purchase"
  - [ ] Defaults to checked (true)
  - [ ] Can toggle on/off
- [ ] **Image** field (optional):
  - [ ] Image upload button
  - [ ] Tapping button shows action sheet
  - [ ] Options: "Take Photo", "Choose from Library", "Cancel"
  - [ ] Image preview shows after selection
  - [ ] Change image button visible
  - [ ] Optional on create
  - [ ] Optional on edit

### Material Image Upload

- [ ] Selecting "Take Photo" opens camera
- [ ] Can capture material photo
- [ ] Photo preview shows after capture
- [ ] Can crop photo (optional)
- [ ] Selecting "Choose from Library" opens gallery
- [ ] Can select image from gallery
- [ ] Image compressed if ≥2MB
- [ ] Resize to max 1200x1200
- [ ] Compression quality 80%
- [ ] Upload shows progress (0-100%)
- [ ] File size validated (max 5MB)
- [ ] Error message if >5MB

### Save Material

- [ ] Tapping "Save" validates form
- [ ] Loading spinner shows during save
- [ ] Save button disabled during save
- [ ] Success toast after save
- [ ] Toast: "Material added successfully"
- [ ] Form modal closes
- [ ] Materials list refreshes
- [ ] New material appears at top

### Edit Material

- [ ] Tapping edit button opens form modal
- [ ] Form title: "Edit Material/Product"
- [ ] All fields pre-filled with current values
- [ ] Image shows current thumbnail
- [ ] Can change all fields
- [ ] Can replace image
- [ ] "Save" button updates material
- [ ] Success toast: "Material updated"
- [ ] List refreshes after update

### Delete Material

- [ ] Tapping delete button shows confirmation dialog
- [ ] Dialog: "Are you sure you want to delete this material?"
- [ ] Options: "Delete" and "Cancel"
- [ ] Tapping "Delete" removes material
- [ ] Success toast: "Material deleted"
- [ ] List updates immediately
- [ ] Deletion persists to backend

### Quick Availability Toggle

- [ ] Toggle switch on material card
- [ ] Tapping toggle changes availability
- [ ] Optimistic UI update (immediate change)
- [ ] API call in background
- [ ] Success toast: "Availability updated"
- [ ] If API fails, reverts toggle
- [ ] Error toast on failure
- [ ] No need to open edit modal

### Price Formatting

- [ ] Price displays with PHP ₱ symbol
- [ ] Thousands separated by commas (1,234.56)
- [ ] Always shows 2 decimal places
- [ ] Unit displays after price (e.g., "₱50.00 per kg")

### Empty State

- [ ] If no materials, shows placeholder
- [ ] Placeholder: "No materials or products yet"
- [ ] Icon: cube or box icon
- [ ] Subtext: "Add materials or products you offer to clients"
- [ ] "Add Material" button visible

### Pull-to-Refresh

- [ ] Pull down gesture triggers refresh
- [ ] Refresh indicator shows
- [ ] Materials reload from backend
- [ ] List updates after refresh
- [ ] Refresh completes in < 2 seconds

---

## 7. Application Detail Screen

**File**: `app/applications/[id].tsx` (670 lines)

### Screen Access

- [ ] Navigate from applications list
- [ ] Header displays "Application Details"
- [ ] Back button returns to applications list

### Application Information

- [ ] Job title displays
- [ ] Job budget displays (₱X,XXX)
- [ ] Application status badge:
  - [ ] Yellow "Pending" badge
  - [ ] Green "Accepted" badge
  - [ ] Red "Rejected" badge
- [ ] Application date displays
- [ ] Proposed budget displays (if different from job budget)
- [ ] Cover letter displays (if provided)

### Application Timeline

- [ ] Timeline visualization displays
- [ ] Timeline events in chronological order
- [ ] Event types:
  - [ ] Application submitted
  - [ ] Application viewed
  - [ ] Application accepted/rejected
- [ ] Each event shows:
  - [ ] Event icon
  - [ ] Event description
  - [ ] Timestamp (relative, e.g., "2 hours ago")
- [ ] Connecting lines between events

### Withdraw Application

- [ ] "Withdraw Application" button visible if status = PENDING
- [ ] Button disabled if status = ACCEPTED or REJECTED
- [ ] Button styled in destructive color (red)
- [ ] Tapping button shows confirmation dialog
- [ ] Dialog: "Are you sure you want to withdraw this application?"
- [ ] Options: "Withdraw" and "Cancel"
- [ ] Tapping "Withdraw" removes application
- [ ] Success toast: "Application withdrawn"
- [ ] Navigates back to applications list
- [ ] Application removed from list

### Navigation

- [ ] "View Job" button navigates to job details
- [ ] "Contact Client" button navigates to chat (if accepted)
- [ ] Back button returns to applications list

---

## 8. Profile Integration

### Profile View Integration

- [ ] Avatar displays at top (or placeholder)
- [ ] Tapping avatar navigates to avatar upload
- [ ] Portfolio section shows 3 most recent images
- [ ] Tapping portfolio image opens lightbox
- [ ] "View All" link navigates to portfolio grid
- [ ] Certifications section shows 3 most recent
- [ ] Certification cards in compact mode
- [ ] "View All (X)" link navigates to certifications list
- [ ] Empty state CTA if no certifications
- [ ] Materials section shows 3 most recent
- [ ] Material cards in compact mode
- [ ] "View All (X)" link navigates to materials list
- [ ] Empty state CTA if no materials
- [ ] All sections scroll smoothly
- [ ] Profile completion widget updates after changes

### Profile Edit Integration

- [ ] Avatar section at top
- [ ] "Change Photo" button navigates to avatar upload
- [ ] Portfolio section shows all images
- [ ] "Add Photos" button allows multi-select
- [ ] Certifications management section after skills
- [ ] "Manage Certifications" button navigates to list
- [ ] Badge shows count (e.g., "3")
- [ ] Materials management section after certifications
- [ ] "Manage Materials" button navigates to list
- [ ] Badge shows count (e.g., "5")
- [ ] All sections accessible via scroll

---

## 9. Data Persistence & API Integration

### API Endpoints (17 total)

**Avatar & Portfolio** (7 endpoints):
- [ ] `POST /api/mobile/profile/avatar` - Upload avatar
- [ ] `DELETE /api/mobile/profile/avatar` - Delete avatar
- [ ] `POST /api/mobile/profile/portfolio` - Upload portfolio image
- [ ] `GET /api/mobile/profile/portfolio` - List portfolio images
- [ ] `PUT /api/mobile/profile/portfolio/{id}` - Update caption
- [ ] `PUT /api/mobile/profile/portfolio/reorder` - Reorder images
- [ ] `DELETE /api/mobile/profile/portfolio/{id}` - Delete image

**Certifications** (5 endpoints):
- [ ] `GET /api/mobile/profile/certifications` - List certifications
- [ ] `POST /api/mobile/profile/certifications` - Create certification
- [ ] `GET /api/mobile/profile/certifications/{id}` - Get certification
- [ ] `PUT /api/mobile/profile/certifications/{id}` - Update certification
- [ ] `DELETE /api/mobile/profile/certifications/{id}` - Delete certification

**Materials** (5 endpoints):
- [ ] `GET /api/mobile/profile/materials` - List materials
- [ ] `POST /api/mobile/profile/materials` - Create material
- [ ] `GET /api/mobile/profile/materials/{id}` - Get material
- [ ] `PUT /api/mobile/profile/materials/{id}` - Update material
- [ ] `PUT /api/mobile/profile/materials/{id}/availability` - Toggle availability
- [ ] `DELETE /api/mobile/profile/materials/{id}` - Delete material

### React Query Caching

- [ ] Queries use `staleTime: 5 minutes`
- [ ] Queries retry up to 3 times
- [ ] Mutations invalidate relevant queries:
  - [ ] Avatar mutations → invalidate `['worker-profile']`
  - [ ] Portfolio mutations → invalidate `['portfolio']` + `['worker-profile']`
  - [ ] Certifications mutations → invalidate `['certifications']` + `['worker-profile']`
  - [ ] Materials mutations → invalidate `['materials']` + `['worker-profile']`
- [ ] Optimistic updates work (materials availability toggle)
- [ ] Cache persists across navigation
- [ ] Cache cleared on logout

### Data Persistence

- [ ] All uploads persist to Supabase
- [ ] Avatar persists after app restart
- [ ] Portfolio images persist
- [ ] Certifications persist
- [ ] Materials persist
- [ ] Data accessible from other devices (same account)

### Error Handling

- [ ] Network errors show toast notification
- [ ] Toast: "Network error. Please check your connection."
- [ ] API errors show descriptive messages
- [ ] 400 errors show validation messages
- [ ] 401 errors trigger re-authentication
- [ ] 403 errors show permission denied
- [ ] 404 errors show "Not found"
- [ ] 500 errors show "Server error. Please try again."
- [ ] Retry logic for failed requests (max 3 attempts)

---

## 10. UI/UX & Visual Polish

### Design System Compliance

- [ ] Typography uses constants (Typography.h1, etc.)
- [ ] Colors use palette (Colors.primary, etc.)
- [ ] Spacing uses values (Spacing.sm, md, lg)
- [ ] BorderRadius uses values (BorderRadius.sm, md)
- [ ] Shadows use values (Shadows.sm, md)
- [ ] Icons use Ionicons consistently

### Loading States

- [ ] Spinner shows on initial data load
- [ ] Skeleton loaders for list items (optional)
- [ ] Upload progress indicators (0-100%)
- [ ] Button loading states (disabled + spinner)
- [ ] Shimmer effects for placeholders (optional)

### Error States

- [ ] Error messages styled in red
- [ ] Error icons (alert-circle) displayed
- [ ] Retry buttons for failed actions
- [ ] Empty states with helpful CTAs
- [ ] Network error banners

### Empty States

- [ ] Icon (64x64 size)
- [ ] Title (e.g., "No certifications yet")
- [ ] Subtext (helpful description)
- [ ] CTA button (e.g., "Add Certification")
- [ ] Gray background with border

### Confirmation Dialogs

- [ ] Title describes action
- [ ] Message explains consequences
- [ ] Two buttons: destructive + cancel
- [ ] Destructive button styled in red
- [ ] Cancel button styled neutral

### Toast Notifications

- [ ] Success toasts green background
- [ ] Error toasts red background
- [ ] Info toasts blue background
- [ ] Duration: 3 seconds default
- [ ] Dismissible by tapping
- [ ] Position: bottom of screen
- [ ] Rounded corners, shadow

### Smooth Animations

- [ ] Navigation transitions smooth
- [ ] Modal slide-in animations
- [ ] Card press animations (scale down)
- [ ] Toggle switch animations
- [ ] Progress bar animations
- [ ] Fade-in for loaded images

### Touch Targets

- [ ] All buttons ≥44x44 pixels
- [ ] Icon buttons ≥44x44 pixels
- [ ] List items ≥48px height
- [ ] Toggle switches ≥44x44 pixels
- [ ] Adequate spacing between elements

---

## 11. Platform-Specific Testing

### iOS Testing

- [ ] Safe areas respected (notch, home indicator)
- [ ] Keyboard avoidance works (KeyboardAvoidingView)
- [ ] Action sheets display correctly
- [ ] Swipe gestures work
- [ ] Navigation animations smooth
- [ ] Status bar style correct (dark/light)
- [ ] Haptic feedback on actions (optional)
- [ ] Share functionality works

### Android Testing

- [ ] Status bar color matches theme
- [ ] Keyboard handling works
- [ ] Alert dialogs display correctly
- [ ] Long press menus work
- [ ] Back button navigation works
- [ ] Material ripple effects visible
- [ ] FAB (Floating Action Button) works
- [ ] Share functionality works

---

## 12. Edge Cases & Error Handling

### Empty Data Scenarios

- [ ] Empty profile (no bio, skills, areas)
- [ ] No certifications
- [ ] No materials
- [ ] No portfolio images
- [ ] Empty states display correctly

### Maximum Limits

- [ ] Portfolio limited to 10 images
- [ ] Error message if trying to upload 11th image
- [ ] Multi-select limited to 5 images
- [ ] Error message if selecting >5 images
- [ ] Bio max 500 characters
- [ ] Description max 500 characters

### Large Data Sets

- [ ] 10+ certifications display smoothly
- [ ] 10+ materials display smoothly
- [ ] Scrolling smooth with large lists
- [ ] No lag when rendering many cards

### Offline Scenarios

- [ ] Offline banner shows when disconnected
- [ ] Cannot upload images while offline
- [ ] Error message: "You're offline. Please check your connection."
- [ ] Cached data displays while offline
- [ ] Changes queued when offline (optional)
- [ ] Queue processes when reconnected

### Image Upload Edge Cases

- [ ] Very large image (>10MB) rejected
- [ ] Invalid file type rejected
- [ ] Corrupted image file rejected
- [ ] Network interruption during upload
- [ ] Upload retry works after failure

### Form Edge Cases

- [ ] Submitting empty form shows errors
- [ ] Submitting invalid data shows errors
- [ ] Changing field clears error
- [ ] Multiple validation errors show
- [ ] First error scrolls into view

### Simultaneous Actions

- [ ] Uploading multiple images simultaneously
- [ ] Editing profile while uploading images
- [ ] Deleting image during upload
- [ ] Navigating away during upload

---

## 13. Performance Testing

### Load Performance

- [ ] Profile screen loads in <2 seconds
- [ ] Certifications list loads in <2 seconds
- [ ] Materials list loads in <2 seconds
- [ ] Image thumbnails load quickly
- [ ] Smooth scrolling (60fps)

### Memory Usage

- [ ] App memory <200MB with large data sets
- [ ] No memory leaks on navigation
- [ ] Images cached efficiently
- [ ] Cached images cleared when needed

### Network Efficiency

- [ ] API calls minimized (use cache)
- [ ] Images compressed appropriately
- [ ] No duplicate API calls
- [ ] Query invalidation efficient

### Startup Performance

- [ ] App starts in <3 seconds
- [ ] Initial data loads in <2 seconds
- [ ] No blocking UI during startup

---

## 14. Accessibility

### Screen Reader Support

- [ ] All buttons have accessible labels
- [ ] All images have alt text
- [ ] Form fields have labels
- [ ] Error messages announced
- [ ] Success toasts announced

### Font Scaling

- [ ] App supports system font scaling
- [ ] Text readable at 200% scale
- [ ] Layout doesn't break with large text

### Color Contrast

- [ ] Text has sufficient contrast (WCAG AA)
- [ ] Buttons visible against background
- [ ] Status badges have good contrast
- [ ] Error messages clearly visible

---

## 15. Security Testing

### Authentication

- [ ] All API calls require authentication
- [ ] Expired tokens trigger re-auth
- [ ] Cannot access other users' data
- [ ] Cannot upload to other users' profiles

### Data Privacy

- [ ] Images encrypted in transit (HTTPS)
- [ ] Images stored securely (Supabase)
- [ ] Cannot guess image URLs
- [ ] Profile data private

### Input Validation

- [ ] Server validates all inputs
- [ ] Cannot inject malicious code
- [ ] File uploads validated server-side
- [ ] Max file sizes enforced

---

## 16. Regression Testing

### Previous Phases Still Work

- [ ] Job browsing (Phase 1) works
- [ ] Job application (Phase 1) works
- [ ] Job completion (Phase 2) works
- [ ] Escrow payments (Phase 3) work
- [ ] Final payments (Phase 4) work
- [ ] Real-time chat (Phase 5) works
- [ ] Adding profile features doesn't break other features

---

## Test Completion Checklist

- [ ] All test cases executed
- [ ] All critical issues documented
- [ ] Screenshots captured for visual issues
- [ ] Performance metrics recorded
- [ ] Test report created
- [ ] Bugs logged in issue tracker
- [ ] QA sign-off obtained

---

**Total Test Cases**: 350+
**Estimated Testing Time**: 15-20 hours
**Priority**: High (Critical profile features)
**Status**: ⏳ Awaiting QA Execution

---

**Date Created**: November 15, 2025
**Created By**: Development Team
**Phase**: Mobile Phase 6 - Enhanced Worker Profiles
