# Mobile Phase 10 - QA Testing Checklist

**Feature**: Advanced Features & Production Polish
**Date**: November 15, 2025
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Mobile app running via Expo Go or standalone build
- [ ] Test accounts created (worker + client)
- [ ] Camera/photo library permissions granted
- [ ] Network debugging enabled
- [ ] AsyncStorage accessible for inspection

## Pre-Testing Setup

### Account 1 (Worker):
- [ ] Email: worker@test.com
- [ ] Profile type: WORKER
- [ ] Has completed profile

### Account 2 (Client):
- [ ] Email: client@test.com
- [ ] Profile type: CLIENT
- [ ] Has posted jobs

---

## 1. App Settings Screen

**File**: `app/settings/index.tsx` (468 lines)

### Screen Access & Layout

- [ ] Navigate to Settings from Profile tab
- [ ] Screen displays "Settings" header
- [ ] All 6 sections visible:
  1. Account
  2. Preferences
  3. Support
  4. Legal
  5. Data & Storage
  6. Danger Zone
- [ ] Footer displays app version and copyright
- [ ] Screen scrolls smoothly

### Account Section

- [ ] "Account" section title displays
- [ ] "Edit Profile" item visible
  - [ ] Person icon on left
  - [ ] Chevron on right
  - [ ] Tapping navigates to `/profile/edit`
- [ ] "Privacy & Security" item visible
  - [ ] Shield icon on left
  - [ ] Chevron on right
  - [ ] Tapping navigates to `/settings/privacy` (or shows "Coming Soon")
- [ ] "Change Password" item visible
  - [ ] Lock icon on left
  - [ ] Chevron on right
  - [ ] Tapping navigates to `/settings/password` (or shows "Coming Soon")

### Preferences Section

- [ ] "Preferences" section title displays
- [ ] "Dark Mode" item visible
  - [ ] Moon icon on left
  - [ ] Toggle switch on right
  - [ ] Default state: OFF (light mode)
  - [ ] Tapping toggle shows confirmation alert
  - [ ] Alert: "Theme Updated - The app theme will update on next launch."
  - [ ] Preference saved to AsyncStorage (`@iayos_theme`)
  - [ ] Can verify in AsyncStorage inspector
- [ ] "Notifications" item visible
  - [ ] Notifications icon on left
  - [ ] Toggle switch on right
  - [ ] Default state: ON
  - [ ] Tapping toggle shows alert
  - [ ] Alert: "Notifications have been disabled." (or enabled)
- [ ] "Language" item visible
  - [ ] Language icon on left
  - [ ] Subtitle: "English" or "Filipino (Tagalog)"
  - [ ] Chevron on right
  - [ ] Tapping shows alert with 3 options:
    - [ ] "English" button
    - [ ] "Filipino (Tagalog)" button
    - [ ] "Cancel" button
  - [ ] Selecting language updates subtitle
  - [ ] Preference saved to AsyncStorage (`@iayos_language`)

### Support Section

- [ ] "Support" section title displays
- [ ] "Help Center" item visible
  - [ ] Help icon on left
  - [ ] Chevron on right
  - [ ] Tapping navigates to `/help/faq`
- [ ] "Contact Support" item visible
  - [ ] Chat icon on left
  - [ ] Chevron on right
  - [ ] Tapping navigates to `/help/contact` (or shows "Coming Soon")
- [ ] "Report a Problem" item visible
  - [ ] Flag icon on left
  - [ ] Chevron on right
  - [ ] Tapping navigates to `/dispute/create`

### Legal Section

- [ ] "Legal" section title displays
- [ ] "Terms of Service" item visible
  - [ ] Document icon on left
  - [ ] Chevron on right
  - [ ] Tapping opens URL in browser (https://iayos.com/terms)
- [ ] "Privacy Policy" item visible
  - [ ] Shield icon on left
  - [ ] Chevron on right
  - [ ] Tapping opens URL in browser (https://iayos.com/privacy)
- [ ] "Licenses" item visible
  - [ ] Info icon on left
  - [ ] Chevron on right
  - [ ] Tapping navigates to `/settings/licenses` (or shows "Coming Soon")

### Data & Storage Section

- [ ] "Data & Storage" section title displays
- [ ] "Clear Cache" item visible
  - [ ] Trash icon on left
  - [ ] Subtitle: "Free up storage space"
  - [ ] Chevron on right
  - [ ] Tapping shows confirmation alert
  - [ ] Alert: "Clear Cache - This will clear all cached data. Are you sure?"
  - [ ] Two buttons: "Clear" (destructive) and "Cancel"
  - [ ] Tapping "Clear" clears React Query cache
  - [ ] Success alert: "Cache cleared successfully."
  - [ ] AsyncStorage cache entries removed

### Danger Zone Section

- [ ] "Danger Zone" section title displays
- [ ] "Logout" item visible
  - [ ] Logout icon on left
  - [ ] Red/destructive text color
  - [ ] Chevron on right
  - [ ] Tapping shows confirmation alert
  - [ ] Alert: "Logout - Are you sure you want to logout?"
  - [ ] Two buttons: "Logout" (destructive) and "Cancel"
  - [ ] Tapping "Logout" navigates to `/auth/login`
  - [ ] User logged out successfully
- [ ] "Delete Account" item visible
  - [ ] Trash icon on left
  - [ ] Red/destructive text color
  - [ ] Subtitle: "Permanently delete your account"
  - [ ] Chevron on right
  - [ ] Tapping shows first confirmation alert
  - [ ] Alert 1: "Delete Account - This will permanently delete your account and all associated data. This action cannot be undone."
  - [ ] Buttons: "Delete" (destructive) and "Cancel"
  - [ ] Tapping "Delete" shows second confirmation
  - [ ] Alert 2: "Confirm Deletion - Type 'DELETE' to confirm account deletion"
  - [ ] Buttons: "Cancel" and "Proceed"
  - [ ] Tapping "Proceed" shows final alert (API not implemented)
  - [ ] Alert 3: "Account Deletion - Please contact support to delete your account."

### Footer Section

- [ ] Footer displays at bottom after scrolling
- [ ] "iAyos Mobile" text displays
- [ ] Version displays (e.g., "Version 1.0.0 (1)")
- [ ] Copyright notice: "© 2025 iAyos. All rights reserved."
- [ ] Text is gray and centered

---

## 2. Help Center (FAQ)

**File**: `app/help/faq.tsx` (612 lines)

### Screen Access & Layout

- [ ] Navigate from Settings → Help Center
- [ ] Header displays "Help Center" or "FAQ"
- [ ] Search bar visible at top
- [ ] Category filter tabs visible below search
- [ ] FAQ list displays below filters
- [ ] Contact Support CTA at bottom
- [ ] Screen scrolls smoothly

### Search Functionality

- [ ] Search bar displays
- [ ] Magnifying glass icon on left
- [ ] Placeholder: "Search frequently asked questions..."
- [ ] Typing updates search query
- [ ] FAQs filter in real-time as you type
- [ ] Search is case-insensitive
- [ ] Searches both questions and answers
- [ ] Clear button (X) appears when text entered
- [ ] Tapping clear button empties search
- [ ] Empty state shows when no results found
  - [ ] Search icon (64px)
  - [ ] Title: "No results found"
  - [ ] Text: "Try searching with different keywords"

### Category Filter Tabs

- [ ] Horizontal scroll container displays
- [ ] 10 category buttons visible:
  1. All (default selected)
  2. Getting Started
  3. Jobs & Applications
  4. Payments
  5. Profile & Verification
  6. Messaging
  7. Reviews & Ratings
  8. Notifications
  9. Troubleshooting
  10. Safety & Security
- [ ] "All" category selected by default (blue background)
- [ ] Inactive categories have gray background
- [ ] Tapping category filters FAQs
- [ ] Active category highlighted
- [ ] Horizontal scrolling works smoothly

### FAQ List Display

- [ ] All 31 FAQs display when "All" selected
- [ ] Each FAQ shows:
  - [ ] Chevron icon (forward when collapsed, down when expanded)
  - [ ] Question text (bold, 16px)
- [ ] FAQs grouped by category internally
- [ ] FAQs display as white cards with shadows
- [ ] Spacing between cards (12px)
- [ ] Margins on left/right (16px)

### FAQ Expansion/Collapse

- [ ] Tapping FAQ item expands it
- [ ] Chevron rotates to down
- [ ] Answer text displays below question
  - [ ] Gray text color
  - [ ] 15px font size
  - [ ] Line height 22px
- [ ] Category label displays (italic, small text)
  - [ ] Format: "Category: Getting Started"
- [ ] Tapping expanded item collapses it
- [ ] Chevron rotates back to forward
- [ ] Answer text hides
- [ ] Only one item expanded at a time (optional behavior)

### FAQ Content Verification

**Getting Started Category** (3 FAQs):
- [ ] FAQ 1: "How do I create an account on iAyos?"
  - [ ] Answer mentions email, password, verification, role selection
- [ ] FAQ 2: "What is the difference between a worker and a client?"
  - [ ] Answer explains worker provides services, client hires
- [ ] FAQ 3: "How do I complete my profile?"
  - [ ] Answer mentions bio, hourly rate, skills, certifications

**Jobs & Applications Category** (4 FAQs):
- [ ] FAQ 4: "How do I find jobs?"
  - [ ] Answer mentions Home tab, filters, search
- [ ] FAQ 5: "How do I apply for a job?"
  - [ ] Answer mentions "Apply Now", budget, cover letter
- [ ] FAQ 6: "Can I withdraw my job application?"
  - [ ] Answer mentions pending status, withdraw option
- [ ] FAQ 7: "How do I complete a job?"
  - [ ] Answer mentions "Mark as Complete", photos, notes, client approval

**Payments Category** (5 FAQs):
- [ ] FAQ 8: "How does the payment system work?"
  - [ ] Answer explains 50% escrow, 50% final, two-phase system
- [ ] FAQ 9: "What payment methods are accepted?"
  - [ ] Answer mentions GCash, Wallet, Cash
- [ ] FAQ 10: "How do I add money to my wallet?"
  - [ ] Answer mentions Wallet > Deposit, ₱100 minimum
- [ ] FAQ 11: "When do I receive my earnings?"
  - [ ] Answer explains after client approval, auto-release, 5% fee
- [ ] FAQ 12: "What is the platform fee?"
  - [ ] Answer mentions 5% on total job amount

**Profile & Verification Category** (5 FAQs):
- [ ] FAQ 13: "Why do I need to verify my identity (KYC)?"
  - [ ] Answer explains trust, badge, search ranking, higher-value jobs
- [ ] FAQ 14: "What documents do I need for KYC verification?"
  - [ ] Answer mentions government ID (front/back), selfie with ID, clearances
- [ ] FAQ 15: "How long does KYC verification take?"
  - [ ] Answer mentions 1-3 business days, notification
- [ ] FAQ 16: "How do I add certifications?"
  - [ ] Answer mentions Profile > Manage Certifications, upload certificate
- [ ] FAQ 17: "Can I add materials or products I offer?"
  - [ ] Answer mentions Profile > Manage Materials, pricing, photo

**Messaging Category** (3 FAQs):
- [ ] FAQ 18: "How do I chat with clients or workers?"
  - [ ] Answer mentions Messages tab, real-time chat, text and images
- [ ] FAQ 19: "Can I send images in chat?"
  - [ ] Answer mentions camera icon, photo capture, gallery selection
- [ ] FAQ 20: "How do I archive a conversation?"
  - [ ] Answer mentions swipe left (iOS), long-press (Android), Archive filter

**Reviews & Ratings Category** (3 FAQs):
- [ ] FAQ 21: "How do I leave a review?"
  - [ ] Answer mentions post-completion prompt, 1-5 stars, 10-500 characters
- [ ] FAQ 22: "Can I edit or delete my review?"
  - [ ] Answer mentions 24-hour edit window, permanent after
- [ ] FAQ 23: "What if I receive an unfair or inappropriate review?"
  - [ ] Answer mentions flag icon, report review, team investigation

**Notifications Category** (2 FAQs):
- [ ] FAQ 24: "How do I manage push notifications?"
  - [ ] Answer mentions Settings > Notifications, category toggles, DND
- [ ] FAQ 25: "Why am I not receiving notifications?"
  - [ ] Answer mentions device settings, app settings verification

**Troubleshooting Category** (3 FAQs):
- [ ] FAQ 26: "The app is slow or crashing. What should I do?"
  - [ ] Answer mentions clear cache, restart, update app, contact support
- [ ] FAQ 27: "I forgot my password. How do I reset it?"
  - [ ] Answer mentions "Forgot Password?", email, reset link
- [ ] FAQ 28: "How do I report a bug or technical issue?"
  - [ ] Answer mentions Settings > Contact Support, describe issue, screenshots

**Safety & Security Category** (3 FAQs):
- [ ] FAQ 29: "How does iAyos protect my payment information?"
  - [ ] Answer mentions Xendit, no card storage, escrow security
- [ ] FAQ 30: "What should I do if I suspect fraud or scam?"
  - [ ] Answer mentions Report a Problem, provide details, never share personal info
- [ ] FAQ 31: "Can I trust the other users on iAyos?"
  - [ ] Answer mentions KYC, reviews, verified badges, report suspicious behavior

### Contact Support CTA

- [ ] CTA card displays after FAQ list
- [ ] Chat bubble icon (32px, blue)
- [ ] Title: "Still need help?"
- [ ] Text: "Our support team is here to assist you"
- [ ] "Contact Support" button (blue)
- [ ] Button tapping navigates or shows "Coming Soon"

### Filtering Behavior

- [ ] Selecting "Getting Started" shows only 3 FAQs
- [ ] Selecting "Payments" shows only 5 FAQs
- [ ] Selecting "All" shows all 31 FAQs
- [ ] Search overrides category filter
- [ ] Clearing search restores category filter
- [ ] Search + category filter works together

---

## 3. Dispute Resolution

**File**: `app/dispute/create.tsx` (578 lines)

### Screen Access & Layout

- [ ] Navigate from Settings → Report a Problem
- [ ] Header displays "Report a Dispute"
- [ ] Alert icon (48px, red) at top
- [ ] Title: "Report a Dispute"
- [ ] Subtitle explains purpose
- [ ] Form sections display:
  1. Dispute Type
  2. Job ID (Optional)
  3. Subject
  4. Description
  5. Evidence (Optional)
  6. Important Information
  7. Submit Button
- [ ] Footer displays response time info
- [ ] Screen scrolls smoothly
- [ ] Keyboard-aware scrolling works

### Dispute Type Selection

- [ ] "Dispute Type" section displays
- [ ] Required asterisk (*) shows
- [ ] 6 dispute type buttons display in grid:
  1. Payment Issue (cash icon)
  2. Job Quality (construct icon)
  3. No Show (person-remove icon)
  4. Harassment (shield icon)
  5. Fraud/Scam (warning icon)
  6. Other (help-circle icon)
- [ ] Buttons display in 2 columns
- [ ] Default state: none selected
- [ ] Tapping button selects it
- [ ] Selected button highlighted (blue border, light blue background)
- [ ] Icon color changes to blue when selected
- [ ] Text color changes to blue when selected
- [ ] Can only select one type at a time

### Job ID Field

- [ ] "Job ID (Optional)" section displays
- [ ] Hint text: "If this dispute is related to a specific job, enter the Job ID"
- [ ] Text input field displays
- [ ] Placeholder: "e.g., 12345"
- [ ] Numeric keyboard on mobile
- [ ] Can enter job ID or leave empty
- [ ] No validation errors if empty

### Subject Field

- [ ] "Subject" section displays
- [ ] Required asterisk (*) shows
- [ ] Hint text: "Brief summary of the issue (10-100 characters)"
- [ ] Text input field displays
- [ ] Placeholder: "e.g., Payment not received after job completion"
- [ ] Can type up to 100 characters
- [ ] Character counter shows below (e.g., "0 / 100")
- [ ] Counter updates as you type
- [ ] Validation: minimum 10 characters
- [ ] If <10 characters on submit, shows error alert
- [ ] Error: "Subject must be at least 10 characters long."

### Description Field

- [ ] "Description" section displays
- [ ] Required asterisk (*) shows
- [ ] Hint text: "Detailed explanation of what happened (50-1000 characters)"
- [ ] Multi-line text input displays
- [ ] Minimum 8 visible lines
- [ ] Placeholder has detailed example text
- [ ] Can type up to 1000 characters
- [ ] Character counter shows (e.g., "0 / 1000")
- [ ] Counter updates as you type
- [ ] Scrollable if text exceeds visible area
- [ ] Validation: minimum 50 characters
- [ ] If <50 characters on submit, shows error alert
- [ ] Error: "Description must be at least 50 characters long. Please provide detailed information."

### Evidence Upload

- [ ] "Evidence (Optional)" section displays
- [ ] Hint text: "Upload screenshots, photos, or documents (up to 5 files, max 5MB each)"
- [ ] "Add Evidence" button displays
  - [ ] Camera icon
  - [ ] Text: "Add Evidence"
  - [ ] Blue dashed border
  - [ ] Light blue background
- [ ] Tapping button shows action sheet/alert
- [ ] Options: "Take Photo", "Choose from Library", "Cancel"

**Camera Photo Capture**:
- [ ] "Take Photo" requests camera permission (first time)
- [ ] Permission alert shows proper message
- [ ] If permission granted, camera launches
- [ ] Can take photo
- [ ] Photo auto-crops to 4:3 aspect ratio
- [ ] Photo compressed (1200px max width, 80% quality)
- [ ] Compressed photo added to evidence grid
- [ ] Filename: `evidence_[timestamp].jpg`

**Gallery Photo Selection**:
- [ ] "Choose from Library" requests gallery permission (first time)
- [ ] Permission alert shows proper message
- [ ] If permission granted, gallery opens
- [ ] Can select photo
- [ ] Photo auto-crops to 4:3 aspect ratio
- [ ] Photo compressed (1200px max width, 80% quality)
- [ ] Compressed photo added to evidence grid
- [ ] Filename: `evidence_[timestamp].jpg`

**Evidence Grid Display**:
- [ ] Evidence grid displays when files added
- [ ] Each item shows:
  - [ ] Thumbnail image (100x100)
  - [ ] Rounded corners (8px)
  - [ ] Remove button (close-circle icon, red)
- [ ] Grid wraps to multiple rows
- [ ] Spacing between items (12px)
- [ ] Up to 5 items can be added
- [ ] "Add Evidence" button hides when 5 items added
- [ ] Tapping remove button deletes item
- [ ] Grid updates immediately after delete

**Maximum Limit Enforcement**:
- [ ] Can add up to 5 evidence files
- [ ] 6th attempt shows error alert
- [ ] Error: "Maximum Limit - You can upload up to 5 evidence images."
- [ ] Add button disabled/hidden when 5 added
- [ ] Must delete one to add another

### Important Information Notice

- [ ] Info box displays above submit button
- [ ] Blue left border (4px)
- [ ] Light blue background
- [ ] Info icon (20px, blue)
- [ ] Text: "Important: False or malicious disputes may result in account suspension. Please ensure all information is accurate and truthful."
- [ ] Bold "Important:" text

### Form Validation

- [ ] Submitting without dispute type shows error
- [ ] Error: "Please select a dispute type."
- [ ] Submitting with subject <10 chars shows error
- [ ] Error: "Subject must be at least 10 characters long."
- [ ] Submitting with description <50 chars shows error
- [ ] Error: "Description must be at least 50 characters long. Please provide detailed information."
- [ ] Validation runs on submit
- [ ] Validation does NOT run while typing
- [ ] First error alert stops submission

### Submit Functionality

- [ ] Submit button displays at bottom
- [ ] Blue background, white text
- [ ] Send icon on left
- [ ] Text: "Submit Dispute"
- [ ] Tapping shows confirmation alert
- [ ] Alert: "Submit Dispute - Are you sure you want to submit this dispute? Our team will review it within 1-3 business days."
- [ ] Buttons: "Submit" and "Cancel"
- [ ] Tapping "Cancel" closes alert
- [ ] Tapping "Submit" starts submission
- [ ] Button shows loading state:
  - [ ] Spinner replaces icon
  - [ ] Text: "Submitting..."
  - [ ] Button disabled (opacity 60%)
- [ ] Simulated 2-second delay
- [ ] Success alert after delay
- [ ] Alert: "Dispute Submitted - Your dispute has been submitted successfully. Our support team will review it and contact you within 1-3 business days."
- [ ] Button: "OK"
- [ ] Tapping "OK" navigates back
- [ ] Form clears after submission

### Footer Information

- [ ] Footer displays at bottom
- [ ] Text: "Our support team typically responds within 1-3 business days. You will receive notifications about your dispute status."
- [ ] Gray text, centered
- [ ] 24px padding

### Error Handling

- [ ] If camera permission denied, shows alert
- [ ] Alert: "Permission Required - Camera permission is required to take photos."
- [ ] If gallery permission denied, shows alert
- [ ] Alert: "Permission Required - Gallery permission is required to choose photos."
- [ ] If submission fails (simulated), shows error alert
- [ ] Error: "Failed to submit dispute. Please try again later."

---

## 4. Cache Manager Utility

**File**: `lib/utils/cacheManager.ts` (368 lines)

### Set Operation

- [ ] Can store string data
- [ ] Can store object data (JSON serialized)
- [ ] Can store array data
- [ ] Can store number data
- [ ] Can store boolean data
- [ ] TTL option works (optional parameter)
- [ ] Data stored to AsyncStorage with prefix `@iayos_cache_`
- [ ] Expiry time stored with prefix `@iayos_cache_expiry_`
- [ ] No errors on set

### Get Operation

- [ ] Can retrieve string data
- [ ] Can retrieve object data (JSON parsed)
- [ ] Can retrieve array data
- [ ] Can retrieve number data
- [ ] Can retrieve boolean data
- [ ] Returns null if key not found
- [ ] Returns null if data expired
- [ ] Expired data auto-removed on get
- [ ] Type parameter works correctly (TypeScript)

### Remove Operation

- [ ] Can remove specific cache entry
- [ ] Both cache and expiry keys removed
- [ ] No error if key doesn't exist
- [ ] Verify removal in AsyncStorage

### Clear All Operation

- [ ] Can clear all cache entries
- [ ] All keys with `@iayos_cache_` prefix removed
- [ ] All keys with `@iayos_cache_expiry_` prefix removed
- [ ] Non-cache keys preserved
- [ ] Settings integration works (Settings → Clear Cache)

### Clear Expired Operation

- [ ] Can clear only expired entries
- [ ] Non-expired entries preserved
- [ ] Expired cache + expiry keys removed
- [ ] Works with multiple expired entries
- [ ] Works when no expired entries

### Has Operation

- [ ] Returns true if key exists and not expired
- [ ] Returns false if key doesn't exist
- [ ] Returns false if key expired

### Get Multiple Operation

- [ ] Can retrieve multiple keys at once
- [ ] Returns array of values
- [ ] Returns null for missing keys
- [ ] Returns null for expired keys
- [ ] Order preserved

### Set Multiple Operation

- [ ] Can set multiple entries at once
- [ ] All entries stored successfully
- [ ] TTL works for individual entries
- [ ] No partial failures

### Get Cache Size

- [ ] Returns size in bytes (number)
- [ ] Accurate calculation
- [ ] Only counts cache entries (not expiry keys)

### Get Cache Size Formatted

- [ ] Returns human-readable string
- [ ] Formats as "Bytes", "KB", "MB", "GB"
- [ ] Correct conversion (1024 base)
- [ ] Example: "2.5 MB"

### TTL Expiry Testing

- [ ] Set data with 1-second TTL
- [ ] Get immediately: returns data
- [ ] Wait 2 seconds
- [ ] Get again: returns null
- [ ] Expired data removed from storage

### Error Handling

- [ ] Invalid JSON doesn't crash
- [ ] Missing AsyncStorage doesn't crash
- [ ] Large data doesn't crash
- [ ] Concurrent operations don't conflict

---

## 5. Optimized Image Component

**File**: `components/OptimizedImage.tsx` (162 lines)

### Basic Rendering

- [ ] Can render image from URI
- [ ] Can render image from local source (number)
- [ ] Image displays correctly
- [ ] Style prop applied correctly
- [ ] Resize mode prop works (cover, contain, stretch, center)

### Lazy Loading

- [ ] With `lazy={true}`: shows placeholder initially
- [ ] Placeholder shows image icon (64px, gray)
- [ ] After 100ms delay, starts loading actual image
- [ ] With `lazy={false}`: loads immediately

### Blurhash Placeholder

- [ ] Default blurhash displays
- [ ] Custom blurhash prop works
- [ ] Blurhash shows while image loading
- [ ] Smooth transition from blurhash to image

### Loading State

- [ ] Loading spinner shows while image loading
- [ ] Spinner: ActivityIndicator, blue color
- [ ] Semi-transparent white overlay
- [ ] Loading state disappears when image loaded

### Loaded State

- [ ] onLoad callback triggered
- [ ] Loading spinner hidden
- [ ] Image visible
- [ ] 200ms fade transition

### Error State

- [ ] Invalid URI triggers error
- [ ] onError callback triggered
- [ ] Fallback icon displays
- [ ] Default icon: "image-outline"
- [ ] Custom fallbackIcon prop works
- [ ] Gray background
- [ ] No retry button

### Image Optimization

- [ ] Uses expo-image for rendering
- [ ] Built-in caching works
- [ ] Memory usage optimized
- [ ] Smooth transitions (200ms)

### Props Testing

- [ ] source (object with uri)
- [ ] source (number for local image)
- [ ] style (object with width, height, borderRadius)
- [ ] placeholder (blurhash string)
- [ ] blurhash (custom blurhash)
- [ ] lazy (true/false)
- [ ] fallbackIcon (Ionicons name)
- [ ] resizeMode (cover, contain, stretch, center)
- [ ] onLoad (callback function)
- [ ] onError (callback function)

### Integration Testing

- [ ] Use in job listings
- [ ] Use in portfolio/gallery
- [ ] Use in chat messages
- [ ] Use in certifications
- [ ] Use in materials
- [ ] Multiple images on same screen
- [ ] Scroll performance (FlatList)

---

## 6. Integration Testing

### Settings → FAQ Navigation

- [ ] From Settings, tap "Help Center"
- [ ] FAQ screen loads
- [ ] Can search and filter
- [ ] Back button returns to Settings

### Settings → Dispute Navigation

- [ ] From Settings, tap "Report a Problem"
- [ ] Dispute screen loads
- [ ] Can fill form and submit
- [ ] Back button returns to Settings

### Settings → Clear Cache Integration

- [ ] From Settings, tap "Clear Cache"
- [ ] Confirmation alert shows
- [ ] Tap "Clear"
- [ ] CacheManager.clearAll() called
- [ ] React Query cache cleared
- [ ] Success alert shows
- [ ] App continues working normally

### Dark Mode Toggle Persistence

- [ ] Enable dark mode in Settings
- [ ] Preference saved to AsyncStorage
- [ ] Close and reopen app
- [ ] Read from AsyncStorage
- [ ] Preference persists

### Language Selection Persistence

- [ ] Select "Filipino (Tagalog)" in Settings
- [ ] Preference saved to AsyncStorage
- [ ] Close and reopen app
- [ ] Subtitle still shows "Filipino (Tagalog)"
- [ ] Preference persists

---

## 7. Performance Testing

### Cache Performance

- [ ] Set 100 cache entries: <1 second
- [ ] Get 100 cache entries: <500ms
- [ ] Clear all cache: <500ms
- [ ] Cache size calculation: <200ms

### Optimized Image Performance

- [ ] Load 20 images in FlatList: smooth scrolling (60fps)
- [ ] Memory usage reasonable (<150MB for 20 images)
- [ ] No memory leaks
- [ ] Transitions smooth (no jank)

### Settings Screen Performance

- [ ] Screen loads in <500ms
- [ ] Toggle switches respond instantly
- [ ] Navigation smooth
- [ ] No lag on scroll

### FAQ Screen Performance

- [ ] Initial load: <1 second
- [ ] Search filtering: instant (<50ms)
- [ ] Category filtering: instant (<50ms)
- [ ] Expand/collapse: smooth (<200ms)

### Dispute Screen Performance

- [ ] Form loads in <500ms
- [ ] Image upload: <3 seconds (WiFi)
- [ ] Image compression: <1 second
- [ ] Form submission: 2 seconds (simulated)

---

## 8. Edge Cases & Error Handling

### Settings

- [ ] Toggle switch rapidly: no crashes
- [ ] Navigate away during cache clear: no crashes
- [ ] Double-tap logout: shows only one alert
- [ ] Delete account on non-existent account: shows contact support message

### FAQ

- [ ] Search for non-existent term: shows empty state
- [ ] Search with special characters: no crashes
- [ ] Select all categories sequentially: works correctly
- [ ] Expand all FAQs: all display correctly

### Dispute

- [ ] Submit without selecting type: validation error
- [ ] Submit with 9-character subject: validation error
- [ ] Submit with 49-character description: validation error
- [ ] Upload 6th evidence: shows limit error
- [ ] Camera permission denied: shows alert
- [ ] Gallery permission denied: shows alert
- [ ] Very large image (>10MB): handled gracefully

### Cache

- [ ] Set very large object (>1MB): works or shows error
- [ ] Get non-existent key: returns null
- [ ] TTL of 0ms: expires immediately
- [ ] Negative TTL: handled gracefully

### Optimized Image

- [ ] Invalid URI: shows error state
- [ ] Empty URI: shows error state
- [ ] Network failure during load: shows error state
- [ ] Multiple rapid prop changes: no crashes

---

## 9. Platform-Specific Testing

### iOS Testing

- [ ] Settings: All sections display correctly
- [ ] Toggle switches: iOS style
- [ ] Alerts: iOS alert style
- [ ] Navigation: Swipe back works
- [ ] FAQ: Scroll smooth
- [ ] Dispute: Camera/gallery permissions work
- [ ] Action sheets display correctly

### Android Testing

- [ ] Settings: All sections display correctly
- [ ] Toggle switches: Android style
- [ ] Alerts: Android alert style
- [ ] Navigation: Back button works
- [ ] FAQ: Scroll smooth
- [ ] Dispute: Camera/gallery permissions work
- [ ] Alert dialogs display correctly

---

## 10. Accessibility

### Screen Reader Support

- [ ] Settings: All items have labels
- [ ] FAQ: Questions and answers announced
- [ ] Dispute: Form fields have labels
- [ ] Buttons have descriptive labels

### Font Scaling

- [ ] Settings supports system font scaling
- [ ] FAQ supports system font scaling
- [ ] Dispute supports system font scaling
- [ ] Layout doesn't break at 200% scale

### Color Contrast

- [ ] Settings: Text readable (WCAG AA)
- [ ] FAQ: Text readable (WCAG AA)
- [ ] Dispute: Text readable (WCAG AA)
- [ ] Error messages clearly visible

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

**Total Test Cases**: 250+
**Estimated Testing Time**: 8-12 hours
**Priority**: High (Final production polish features)
**Status**: ⏳ Awaiting QA Execution

---

**Date Created**: November 15, 2025
**Created By**: Development Team
**Phase**: Mobile Phase 10 - Advanced Features & Production Polish
