# Changelog

All notable changes to the iAyos Mobile App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Android APK Startup Crash / Reanimated New-Arch Build Guard**
  - Updated `mobile-release.yml` to synchronize `newArchEnabled` in both `android/gradle.properties` and `app.json` before build
  - Added automatic override: if `react-native-reanimated` requires New Architecture, workflow forces it ON to prevent CI build failure
  - Release notes now show both requested and effective New Architecture state
  - **Impact**: Prevents `assertNewArchitectureEnabledTask` build failures while keeping architecture state explicit per release

- **Job Detail Hardcoded Data Removal** (PR #363)
  - Replaced 13 `via.placeholder.com` avatar fallback URLs with Ionicons person icon across job detail and active job detail screens
  - Changed misleading "0.0 rating" displays to show "New" for unrated users (7 instances)
  - Fixed budget display to show "TBD" instead of "₱0" when budget is missing
  - Fixed distance display to show location name when distance is unavailable instead of "0.0 km away"
  - Added `payment_model` badge indicator: 💼 Project Based or 📅 Daily Rate with per-day amount
  - Added `phone` field to client and worker data from backend
  - Added server-side Haversine distance calculation in job detail API
  - Fixed active job detail data transformation (category showed `[object Object]`, location fields mismatched, budget was unformatted number)
  - Fixed "Unknown" and "N/A" worker fallbacks to use friendlier text
  - **Impact**: All job detail data now comes from backend with no fake/placeholder values

- **Skill Mismatch Banner Stale Cache Fix**
  - Reduced `useMySkills()` staleTime from 5 minutes to 30 seconds
  - Added `useFocusEffect` in job detail screen to invalidate skills cache on screen focus
  - **Impact**: After adding a skill, returning to a job listing immediately shows correct "skill match" status instead of stale mismatch warning

- **Add Skills Modal Scroll Fix**
  - Replaced hardcoded `maxHeight: 400` on skills list with `flexShrink: 1` for dynamic sizing
  - Added `nestedScrollEnabled` for proper Android nested scroll support
  - **Impact**: Users can now scroll through the full skills list in the Add Skills modal on all screen sizes

- **Safe Back Navigation App-Wide** (54 files, 98 instances)
  - Replaced all `router.back()` calls with `safeGoBack(router, fallbackRoute)` across the entire mobile app
  - Each screen now falls back to its logical parent tab instead of closing the app when there's no navigation history
  - Fallback routes: profile screens → `/(tabs)/profile`, job screens → `/(tabs)/jobs`, auth screens → `/(tabs)`, call screens → `/(tabs)/messages`
  - **Impact**: Tapping the back button no longer closes the app when navigating directly to a screen via deep link or notification

- **"Back to Home" After Job Creation Redirects to Login**
  - Changed `router.replace("/")` to `router.replace("/(tabs)")` in job creation success alert
  - Root cause: `/` goes through the auth redirect gate in `app/index.tsx` which can flash the login screen
  - **Impact**: After creating a job, tapping "Back to Home" now goes directly to the home tab

- **Team Job Completion Button Removed From Job Details**
  - Removed duplicate "Mark My Work Complete" button from job detail page
  - Workers should use the conversation screen to manage job progress (where the button already exists)
  - Kept "You're Assigned!" card and "Marked Complete" badge for already-completed assignments
  - Added link to conversation for workers who haven't completed yet
  - **Impact**: Prevents confusion from having the completion action in two places

- **Chat Messaging Hint During Arrival Wait**
  - Added "💬 You can still send messages while waiting" hint below the "Waiting for client to confirm work started..." banner
  - Messaging was never actually blocked, but the prominent waiting banner gave the impression chat was locked
  - **Impact**: Workers understand they can communicate with clients while waiting for arrival confirmation

### Added
- **Force Review Feature** (PR #349)
  - Users must leave a review after job completion/payment before exiting conversation
  - Hardware back button blocked with "Review Required" alert when review is pending
  - Header back button blocked with same alert, redirects to review modal
  - Review modal close button disabled when review is required
  - Full-screen blocking PendingReviewModal shown on app reopen when pending reviews exist
  - AppState listener checks for pending reviews when app comes to foreground
  - Backend now includes `conversation_id` in pending reviews API response
  - **Impact**: Users can no longer skip reviews after job completion, improving platform trust and feedback quality

### Fixed
- **DAILY Team Job Button Guard Fixes** (PR #344)
  - Fixed Team Arrival section ("Worker Arrivals" per-worker Confirm buttons) showing for DAILY team jobs alongside Daily Attendance section — now only shows for PROJECT team jobs
  - Fixed Team Phase 2 "Mark My Assignment Complete" button showing for DAILY team jobs alongside daily Check In/Out — now only shows for PROJECT team jobs
  - Fixed Review section never appearing for completed DAILY jobs because `clientMarkedComplete` is never set — added `status === "COMPLETED"` fallback matching `isConversationClosed` pattern
  - **Impact**: DAILY team jobs now show only the Daily Attendance workflow; PROJECT team jobs show the milestone-based arrival/completion workflow; reviews work for all payment models

- **Agency Job Workflow UI Bug Fixes** (12 fixes)
  - Fixed "Approve & Pay Team" button incorrectly showing for agency jobs due to vacuous truth on empty `team_worker_assignments` array
  - Fixed "Confirm Worker Has Arrived" button showing for agency jobs where arrival is tracked per-employee
  - Fixed "Approve & Pay Final Amount" duplicate payment button appearing alongside agency-specific approve button
  - Fixed "Mark Job Complete" and "Waiting for Client Approval" sections leaking into agency/team job views
  - Fixed regular job status messages ("Client confirmed work started", etc.) showing alongside agency workflow sections
  - Added `!is_agency_job` guard to Team Phase 2 (worker marks complete) and Team Phase 3 (client approves)
  - Added `length > 0` check on `team_worker_assignments` to prevent `.every()` vacuous truth
  - Fixed `isConversationClosed` not handling DAILY jobs (uses `job.status === "COMPLETED"` fallback)
  - **Impact**: Agency jobs now show only their own workflow sections; no duplicate buttons or conflicting UI

### Changed
- **Job Creation Category Auto-Derive from Worker Skills**
  - When hiring a specific worker (INVITE job), category picker now only shows the worker's registered skills
  - If worker has exactly 1 skill, category is auto-selected
  - If worker has multiple skills, picker is filtered to only show their skills
  - Backend validates that selected category matches one of the worker's skills
  - Removes redundancy of picking arbitrary categories that may not match worker expertise
  - **Impact**: Clients hiring specific workers now see only relevant categories, improving UX and preventing skill mismatches

### Added
- **Instant Direct Deposit (Testing Mode)**
  - Added instant test deposit feature that bypasses PayMongo entirely
  - Funds are added to wallet immediately without payment gateway validation
  - Button renamed from "GCash Direct" to "Direct Deposit" with "Test Only - Instant" label
  - Only available when `TESTING=true` environment variable is set
  - **Impact**: Testers can now deposit funds instantly without needing a real payment gateway

## [2.0.5] - 2026-02-06

### Fixed
- **Back Button Closes App Issue**
  - Fixed critical bug where tapping the back button (top-left) would close the app instead of navigating back
  - Root cause: 100+ screens used `router.back()` without checking if navigation history exists
  - Solution: Created `useSafeBack` hook that checks `router.canGoBack()` and falls back to home tabs if no history
  - Fixed critical deep-linkable screens: jobs/[id], workers/[id], messages/[conversationId], notifications, wallet
  - **Impact**: Users can now navigate back safely from any screen, even when opened via deep links or notifications

## [2.0.5] - 2026-02-06

### Fixed
- **Daily Attendance Flow Redesign** (PR #309)
  - Fixed critical bug where marking one agency employee's arrival would overwrite another employee's attendance record
  - Root cause: UniqueConstraint on `(jobID, workerID, date)` where `workerID=NULL` for all agency employees
  - Solution: Added DISPATCHED status and conditional UniqueConstraint on employeeID
  - New flow: Agency dispatches → Client verifies arrival → Client marks checkout → Client confirms payment
  - **Impact**: Agency owners can now manage multiple employees on daily payment jobs without data loss

## [2.0.4] - 2026-02-05

### Fixed
- **Agency Daily Payment Fields** (PR #294)
  - Fixed missing daily payment fields in agency job endpoints (`get_agency_jobs`, `get_agency_job_detail`)
  - Backend now returns: `payment_model`, `daily_rate_agreed`, `duration_days`, `actual_start_date`, `total_days_worked`, `daily_escrow_total`
  - **Impact**: DailyJobScheduleCard and PaymentModelBadge now display correct job data instead of defaults

## [2.0.3] - 2026-02-04

### Fixed
- **Mobile Backjob & Review UX Bugs** (PR #290)
  - Fixed backjob banner text invisible on light background (changed from white to dark color)
  - Fixed "Mark Complete" button unresponsive on Android (replaced iOS-only `Alert.prompt` with cross-platform `Alert.alert`)
  - Fixed review criteria backwards - worker reviewing client saw wrong criteria and vice versa
  - **Impact**: Android users can now mark jobs complete; review system shows correct criteria for both roles

## [2.0.2] - 2026-01-26

### Fixed
- **Worker Multi-Job Application Blocker** (PR #287)
  - Workers can no longer apply to multiple jobs simultaneously
  - Added backend validation in `apply_to_job` and `accept_application` endpoints
  - Prevents workers from having multiple active jobs (IN_PROGRESS status) or multiple ACTIVE team assignments
  - **Impact**: Ensures workers focus on one job at a time; prevents scheduling conflicts

## [2.0.1] - 2025-12-16

### Added
- **Team Worker Arrival Tracking** (PR #275)
  - Per-worker arrival confirmation with timestamps for team jobs
  - Client can confirm arrival for each worker individually
  - Displays arrival progress: `arrived_count / total_count`
  - **Impact**: Matches 3-phase workflow of regular jobs (Arrival → Complete → Approve)

### Changed
- **Team Job Auto-Start**
  - Jobs automatically create group conversations when all slots filled
  - Team jobs move from "Open Jobs" to "Pending" tab when fully staffed
  - **Impact**: Smoother workflow for team job management

## [2.0.0] - 2025-12-11

### Added
- **Price Budget LSTM Model**
  - ML-powered price prediction for job postings
  - Predicts min/suggested/max price ranges based on job details
  - Real-time recommendations during job creation
  - **Impact**: Helps clients set fair prices; reduces negotiation friction

### Changed
- **Universal Job Fields for ML Accuracy**
  - Added `job_scope`: MINOR_REPAIR | MODERATE_PROJECT | MAJOR_RENOVATION
  - Added `skill_level_required`: ENTRY | INTERMEDIATE | EXPERT
  - Added `work_environment`: INDOOR | OUTDOOR | BOTH
  - **Impact**: ML accuracy improved from ~24% to ~18-20% MAPE

## [1.9.0] - 2025-11-26

### Added
- **Wallet Withdrawal Feature**
  - Workers can withdraw earnings to GCash via Xendit disbursement
  - Minimum withdrawal: ₱100
  - Processing time: 1-3 business days
  - Balance deducted immediately on successful request
  - **Impact**: Workers can access their earnings directly to GCash

### Changed
- **Payment Method Enforcement**
  - Users must add GCash account before depositing or withdrawing
  - Deposit screen shows validation alert if no GCash method configured
  - Auto-redirect to payment methods screen
  - **Impact**: Ensures users set up payment methods before transacting

## [1.8.0] - 2025-11-25

### Fixed
- **Instant Profile Switching**
  - Workers/clients can now switch profiles without logout
  - JWT tokens include `profile_type` field (WORKER or CLIENT)
  - New `/api/mobile/profile/switch-profile` endpoint
  - **Impact**: Profile switch completes in ~2 seconds (vs ~30 seconds before)

### Fixed
- **Dual Profile Bug Fixes**
  - Fixed 14 endpoints failing with `MultipleObjectsReturned` exception
  - Changed `.get()` to `.filter().first()` with profile_type from JWT
  - **Impact**: Users with both worker and client profiles can now browse jobs/workers without errors

## [1.7.0] - 2025-11-23

### Added
- **Custom Navigation Headers**
  - Removed default Expo Router black header bar
  - Created reusable `CustomBackButton` component matching app theme
  - Custom headers on KYC upload and status screens
  - **Impact**: Consistent visual design throughout app

## [1.6.0] - 2025-11-14

### Added
- **Enhanced Profiles - Certifications & Materials**
  - Professional certifications management with document upload
  - Verification status badges (verified/pending)
  - Expiry date tracking with warning badges (<30 days)
  - Materials/products listing with PHP ₱ pricing
  - Availability toggle with optimistic UI
  - Full CRUD operations for both certifications and materials
  - **Impact**: Workers can showcase credentials; clients can verify qualifications

### Added
- **Avatar & Portfolio Photo Upload**
  - Avatar upload system (camera + gallery with square crop)
  - Portfolio management (up to 10 images with captions)
  - Multi-image upload (up to 5 at once, sequential)
  - Smart image compression (<2MB skip, ≥2MB compress to 1200x1200)
  - Full-screen lightbox viewer with swipe navigation
  - Drag-drop reordering with long-press selection
  - **Impact**: Workers can showcase their work; builds trust with clients

### Added
- **Worker Profile & Application Management**
  - Worker profile view with completion tracking
  - Profile editing with validation and preview
  - Application detail screen with timeline visualization
  - Application withdrawal functionality
  - Profile completion widget (0-100%, 8 criteria)
  - **Impact**: Workers can manage their profile and job applications efficiently

### Added
- **Job Browsing & Filtering System**
  - Category browsing with 18 service categories
  - Advanced search with budget, location, urgency filters
  - Saved jobs functionality with heart icon toggle
  - Sort options: Latest, Budget High/Low
  - Infinite scroll pagination (20 jobs/page)
  - **Impact**: Workers can find relevant jobs faster; clients reach qualified workers

### Added
- **Job Completion & Photo Upload**
  - Two-phase completion: worker marks → client approves
  - Active jobs listing and detail screens
  - Photo upload (up to 10 photos) with compression
  - Sequential upload with progress indicator (0-100%)
  - Photo preview grid with remove functionality
  - **Impact**: Visual proof of work completion; reduces disputes

---

## Version History

- **2.0.x** - Bug fixes and payment system enhancements (Feb 2026)
- **1.9.x** - Wallet withdrawal and payment features (Nov 2025)
- **1.8.x** - Profile switching and dual profile support (Nov 2025)
- **1.7.x** - UI improvements and custom components (Nov 2025)
- **1.6.x** - Enhanced profiles, photo uploads, job management (Nov 2025)

---

## Guidelines for Updating This Changelog

**When making mobile changes:**

1. **Add to [Unreleased] section** under the appropriate category:
   - `### Added` - New features
   - `### Changed` - Changes to existing functionality
   - `### Fixed` - Bug fixes
   - `### Removed` - Removed features

2. **Format each entry:**
   ```markdown
   - **Feature Name** (PR #XXX)
     - Brief description of what changed
     - Additional context if needed
     - **Impact**: How users benefit
   ```

3. **Keep it user-facing**: Focus on what users will notice, not internal refactoring

4. **On release**: The workflow will move [Unreleased] → [Version] with date automatically

**Example:**
```markdown
## [Unreleased]
### Fixed
- **Payment Method Validation** (PR #123)
  - Fixed wallet deposit validation to require GCash account
  - Auto-redirect to payment methods if not configured
  - **Impact**: Users can't start deposits without payment method set up
```
