# Changelog

All notable changes to the iAyos Mobile App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Team PROJECT Multi-Day Attendance Flow (No Per-Day Payout)**
  - Enabled daily attendance UI in mobile conversation for multi-day TEAM `PROJECT` jobs (while keeping DAILY behavior intact).
  - Enabled worker "On The Way" and undo check-in actions for multi-day TEAM `PROJECT` jobs.
  - Updated attendance confirmation copy/actions in PROJECT mode from per-day "Pay" to attendance-only confirmation.
  - Updated backend client attendance confirmation for multi-day TEAM `PROJECT` jobs to record attendance only and skip daily auto-payment.
  - Added safer worker-name resolution in attendance confirmation responses for assignment-based team flows.
  - **Impact**: Team project jobs now support true multi-day attendance tracking in chat without accidental per-day payouts; payment remains at final job completion.

- **Team PROJECT One-Day and Multi-Day Flow Parity + Cancellation UI**
  - Unified conversation attendance flow for TEAM `PROJECT` jobs regardless of duration (one-day and multi-day now share the same on-the-way -> verify arrival -> checkout -> confirm day sequence).
  - Removed legacy one-day team arrival UI path to prevent behavior drift between durations.
  - Kept DAILY-only controls (skip-day, QA skip-day controls, daily end actions, daily-rate card) scoped to DAILY jobs only.
  - Ensured client cancel button is consistently shown for TEAM `PROJECT` jobs through the shared team cancellation action path.
  - **Impact**: Team project cancellation logic now operates against a consistent attendance lifecycle for both one-day and multi-day jobs.

- **Worker Skills Cap + Primary Skill Enforcement**
  - Added backend enforcement to block adding a 6th skill (`max 5` per worker).
  - Preserved and hardened primary-skill behavior so workers maintain one primary skill when skills exist.
  - Updated mobile Skills screen to show `x/5` counter and disable add action at limit with clear messaging.
  - Updated admin worker views to show skill cap context and primary-skill count for audit visibility.
  - **Impact**: Consistent skill policy across API and UI, clearer UX at limits, and safer primary-skill state management.

- **DAILY Worker Checkout Confirmation Update**
  - Removed the backend 2-hour minimum work-duration blocker for worker checkout in DAILY jobs.
  - Added a 6-second delayed confirmation dialog before worker checkout to prevent accidental checkouts.
  - Preserved existing safeguards (must be assigned and must have checked in first).
  - **Impact**: Workers can check out when needed without duration lockouts, while still getting anti-misclick protection.

- **Daily-Rate Authorization and Payment Accuracy Hardening**
  - Added stricter DAILY authorization checks across backend attendance/summary/extension/rate-change APIs to block non-participant access.
  - Added team-aware DAILY actor resolution so team workers can participate in extension/rate-change approval flows.
  - Hardened mobile no-work endpoint validation to ensure selected worker/employee belongs to the target job (including agency employee support).
  - Added assignment validation to mobile worker check-out flow for consistency with check-in authorization.
  - Updated daily attendance pay confirmation copy to use per-attendance `amount_earned` instead of static job daily rate.
  - **Impact**: Safer DAILY workflows (reduced unauthorized access risk), correct client payment prompts, and improved client→agency daily no-work handling.

- **Team Job Duplicate Apply Button Removal**
  - Hidden the generic bottom apply button on team job detail screens.
  - Kept only per-skill-slot apply actions as the valid team application entry point.
  - Added defensive checks to block generic apply submission paths for team jobs.
  - Hardened generic apply guards to use team-job state checks in both open and submit handlers.
  - **Impact**: Team applications are now always tied to a specific skill slot, preventing invalid slot-less submissions.

- **Worker Calendar -> Job Details Freeze on Expo Go**
  - Refactored worker calendar date details from a nested modal into a single-modal overlay flow.
  - Hardened Android back handling so date-details closes first before dismissing the calendar sheet.
  - Preserved guarded close-then-navigate behavior to avoid stale touch-block overlays during route transitions.
  - **Impact**: Opening a job from calendar date details no longer leaves job details screen unresponsive.

- **Agency Conversation Review CTA Reopen/Double-Submit Guard**
  - Fixed mobile conversation review CTA visibility to hide during closure-sync windows and after conversation closure.
  - Added safe review-modal opener guard to block stale re-open attempts right after review submission.
  - Added final-step review sync locking for team and regular review flows to prevent duplicate review submissions while refetching status.
  - Updated messages query stale timing to reduce stale review-state gaps after mutations.
  - **Impact**: Client-side agency/team conversations no longer allow repeated review submissions after completion and align closer to web closure behavior.

- **Daily Check-in Time Window + Direct-Hire Category/Tab Consistency**
  - Fixed DAILY single-job attendance time-window validation to use Philippine time for 6:00 AM to 8:00 PM checks, preventing false "outside allowed hours" errors during valid morning check-ins.
  - Updated direct-hire category loading to scope categories by selected worker skills, so clients only see valid categories for that worker.
  - Updated worker Applications tab behavior to show pending applications only, so accepted jobs no longer appear in both Applied and In Progress.
  - **Impact**: Workers can check in at valid PH times, clients see skill-valid direct-hire categories, and accepted requests appear only in In Progress.

- Updated worker calendar modal layout to respect safe-area insets and prevent date detail cards from being clipped off-screen on smaller devices
- Changed date tap behavior in worker calendar to open a dedicated job-details popup modal instead of rendering details under the calendar
- **Client -> Agency Hiring & Review Flow Stability**
  - Removed the hardblock requiring 2+ workers for agency-hire creation; clients can now submit agency jobs with exactly 1 selected worker.
  - Refactored agency conversation review/closure checks to be role-aware (CLIENT vs AGENCY), preventing asymmetric close behavior and ensuring closure only after both sides complete required reviews.
  - **Impact**: Single-worker agency hires are now supported, and agency job conversations close consistently for both client and agency after the correct review milestones.
- Updated profile performance cards to use live `/api/mobile/profile/metrics` values for worker ratings and completed jobs
- **Impact**: Worker profile stats now refresh from backend metrics instead of stale cached values, and calendar job details remain fully visible

- Fixed client→agency direct-hire flow: hidden listing applications for `INVITE` jobs and added agency worker suggestion CTA in job details
- Fixed agency payment UX in conversation: replaced per-employee "Approve & Pay" actions with a single agency-level approve-and-pay action
- Fixed client-side conversation closure for agency jobs by aligning backend agency review status calculation (supports `assignedAgencyFK` flows and no-employee agency assignments)
- **Impact**: Direct agency hires now follow correct B2B payment and closure behavior, with cleaner client job details UX

- Enabled AI price suggestion card for agency-hire PROJECT jobs even when title/description are still short by using selected-category fallback context
- Fixed agency approve-and-pay backend transaction creation using correct `Transaction` model fields (`walletID`, `relatedJobPosting`, `balanceAfter`, `paymentMethod`)
- Fixed cash and GCash approval paths to create valid transaction records instead of raising internal server errors
- Fixed DAILY attendance payment notification creation to use valid Notification fields (`accountFK`, numeric `relatedJobID`) so client confirm/pay no longer fails with server error
- Updated post-application success guidance from "My Applications" to `Jobs > Applied` and deep-linked navigation to the `applications` tab
- **Impact**: Clients can complete approve-and-pay flows reliably, agency hires get usable price suggestions, and workers are routed to the correct application status tab

- **KYC Selfie Policy Alignment**
  - Removed "hold ID in selfie" requirement from mobile KYC guidance and capture checklist.
  - Updated selfie capture flow to require clear face + no glasses only, matching backend face-match verification against submitted ID front image.
  - **Impact**: Reduces false rejects and user friction while preserving strict identity verification.

  - Fixed mobile message cache invalidation to target active conversation queries keyed by `viewerKey` (prevents stale chat UI that required refresh/reopen)
  - Standardized inbox websocket payloads to emit explicit event types (`chat_message`, `typing_indicator`, `message_read`) so mobile listeners process events consistently
  - Added dynamic websocket unsubscribe when leaving a conversation to prevent stale subscriptions and missed/current-thread update conflicts
  - Aligned outgoing typing/read actions (`action: typing`, `action: mark_read`) with backend consumer protocol and added backend read-receipt handling/broadcast
  - Added websocket job-status broadcast after mobile final payment so conversation payment state updates instantly without manual refresh
  - **Impact**: Conversation screens now reflect new messages, typing, read receipts, and payment status changes in real time more reliably

- **Production Skip-Day Request Workflow for DAILY Jobs**
  - Added worker-initiated skip-day requests in conversation Daily Attendance section
  - Team DAILY jobs now require all ACTIVE workers to request before client can review
  - Added client approve/reject controls in chat with live consensus progress display
  - Added approved/rejected skip-day state banners for workers and clients
  - Added explicit worker-facing warning that client approval is not guaranteed and rejected/abusive requests may lead to reports or admin action
  - **Impact**: Real production contingency flow for no-work days with explicit client approval and team consensus

- **Withdrawal Screen Layout Fix & Enhancements**
  - Moved header outside KeyboardAvoidingView to fix layout issues
  - Removed vertical offset to eliminate whitespace above keyboard
  - Removed quick amount buttons and bottom banner to reduce redundancy
  - Added "Insufficient Funds" label to withdrawal button when balance is exceeded
  - Added bottom padding to footer for better button spacing
  - **Impact**: Improved user experience, clearer error feedback, and visual layout on withdrawal screen

- **APK Auto-Update Stuck on "Installing" on Real Devices**
  - Added `REQUEST_INSTALL_PACKAGES` permission to AndroidManifest (required by Android 8+ / API 26+)
  - Switched install intent from `ACTION_VIEW` to `ACTION_INSTALL_PACKAGE` for better compatibility
  - Added 15-second timeout with fallback alert offering "Open Settings" and "Retry Install" options
  - Updated error dialog to offer "Open Settings" shortcut instead of generic message
  - **Impact**: APK installs now work on real phones, not just emulators. Users get clear guidance if permission is needed.

### Added

- **Mobile Reporting Actions (User / Job / Conversation)**
  - Added report actions in worker profile, client profile, job detail, and conversation header
  - Added reason picker flow (spam, harassment, fraud/scam, inappropriate, fake profile)
  - Added mobile reporting hook and endpoints integration for direct submission from app UI
  - **Impact**: Workers and clients can now report users/jobs/conversations in-context without leaving the screen

- **Countdown Confirmation Timer for Critical Actions**
  - Added 5-second countdown timer on standard confirmations (job creation, accept/reject application, withdraw application, delete job, accept invite)
  - Added 7-second countdown timer on financial confirmations (approve completion & pay, approve team job & pay, confirm daily attendance & pay, wallet withdrawal)
  - Animated progress bar, haptic feedback on countdown complete, always-available cancel button
  - Prevents accidental taps on irreversible or financial actions
  - **Impact**: Users have a safety window to cancel before critical/financial actions execute

- **BIR Receipt Disclaimer on All Transaction Summaries**
  - Added amber compliance banner: "This is NOT an Official Receipt as defined by the Bureau of Internal Revenue (BIR)"
  - Applied to Job Receipt Modal, Payment Receipt Modal, and Withdrawal Success screen
  - Disclaimer text included in Share Receipt text output
  - **Impact**: Legal compliance — all in-app receipts clearly marked as non-O.R. transaction summaries

### Fixed

- **KYC Upload Screen Crash - "Property 'kycData' doesn't exist"**
  - Fixed undefined variable reference `kycData` in upload.tsx useEffect that crashed the KYC screen
  - `kycData` was used at lines 200-203 but never destructured from the `useKYC()` hook
  - Replaced with already-available `isRejected` boolean which performs the same check
  - **Impact**: KYC upload screen no longer crashes on load

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

- **Back Button Closes App Issue**
  - Fixed critical bug where tapping the back button (top-left) would close the app instead of navigating back
  - Root cause: 100+ screens used `router.back()` without checking if navigation history exists
  - Solution: Created `useSafeBack` hook that checks `router.canGoBack()` and falls back to home tabs if no history
  - Fixed critical deep-linkable screens: jobs/[id], workers/[id], messages/[conversationId], notifications, wallet
  - **Impact**: Users can now navigate back safely from any screen, even when opened via deep links or notifications

- **Daily Attendance Flow Redesign** (PR #309)
  - Fixed critical bug where marking one agency employee's arrival would overwrite another employee's attendance record
  - Root cause: UniqueConstraint on `(jobID, workerID, date)` where `workerID=NULL` for all agency employees
  - Solution: Added DISPATCHED status and conditional UniqueConstraint on employeeID
  - New flow: Agency dispatches → Client verifies arrival → Client marks checkout → Client confirms payment
  - **Impact**: Agency owners can now manage multiple employees on daily payment jobs without data loss

- **Agency Daily Payment Fields** (PR #294)
  - Fixed missing daily payment fields in agency job endpoints (`get_agency_jobs`, `get_agency_job_detail`)
  - Backend now returns: `payment_model`, `daily_rate_agreed`, `duration_days`, `actual_start_date`, `total_days_worked`, `daily_escrow_total`
  - **Impact**: DailyJobScheduleCard and PaymentModelBadge now display correct job data instead of defaults

- **Mobile Backjob & Review UX Bugs** (PR #290)
  - Fixed backjob banner text invisible on light background (changed from white to dark color)
  - Fixed "Mark Complete" button unresponsive on Android (replaced iOS-only `Alert.prompt` with cross-platform `Alert.alert`)
  - Fixed review criteria backwards - worker reviewing client saw wrong criteria and vice versa
  - **Impact**: Android users can now mark jobs complete; review system shows correct criteria for both roles

- **Worker Multi-Job Application Blocker** (PR #287)
  - Workers can no longer apply to multiple jobs simultaneously
  - Added backend validation in `apply_to_job` and `accept_application` endpoints
  - Prevents workers from having multiple active jobs (IN_PROGRESS status) or multiple ACTIVE team assignments
  - **Impact**: Ensures workers focus on one job at a time; prevents scheduling conflicts

- **DAILY Team Job Button Guard Fixes** (PR #344)
  - Fixed Team Arrival section showing for DAILY team jobs alongside Daily Attendance section — now only shows for PROJECT team jobs
  - Fixed Team Phase 2 "Mark My Assignment Complete" button showing for DAILY team jobs — now only shows for PROJECT team jobs
  - Fixed Review section never appearing for completed DAILY jobs — added `status === "COMPLETED"` fallback
  - **Impact**: DAILY team jobs now show only the Daily Attendance workflow; PROJECT team jobs show the milestone-based workflow

- **Agency Job Workflow UI Bug Fixes** (12 fixes)
  - Fixed "Approve & Pay Team" button incorrectly showing for agency jobs due to vacuous truth on empty array
  - Fixed "Confirm Worker Has Arrived" button showing for agency jobs where arrival is tracked per-employee
  - Fixed duplicate payment buttons appearing alongside agency-specific approve button
  - Fixed regular job status messages leaking into agency/team job views
  - Added `!is_agency_job` guards and `length > 0` checks across team workflow sections
  - **Impact**: Agency jobs now show only their own workflow sections; no duplicate buttons or conflicting UI

### Added

- **Force Review Feature** (PR #349)
  - Users must leave a review after job completion/payment before exiting conversation
  - Hardware back button blocked with "Review Required" alert when review is pending
  - Full-screen blocking PendingReviewModal shown on app reopen when pending reviews exist
  - Backend now includes `conversation_id` in pending reviews API response
  - **Impact**: Users can no longer skip reviews after job completion, improving platform trust and feedback quality

- **Instant Direct Deposit (Testing Mode)**
  - Added instant test deposit feature that bypasses PayMongo entirely
  - Funds are added to wallet immediately without payment gateway validation
  - Only available when `TESTING=true` environment variable is set
  - **Impact**: Testers can now deposit funds instantly without needing a real payment gateway

### Changed

- **Job Creation Category Auto-Derive from Worker Skills**
  - When hiring a specific worker (INVITE job), category picker now only shows the worker's registered skills
  - If worker has exactly 1 skill, category is auto-selected
  - Backend validates that selected category matches one of the worker's skills
  - **Impact**: Clients hiring specific workers now see only relevant categories, preventing skill mismatches

## [1.0.0] - 2026-02-28

### Initial Release

This is the first stable release of the iAyos Mobile App, consolidating all previous development work.

### Features

- **Job Browsing & Filtering** — Category browsing, advanced search, saved jobs, infinite scroll pagination
- **Job Completion Workflow** — Two-phase completion (worker marks → client approves) with photo upload
- **Escrow Payment System** — 50% downpayment via GCash/Wallet/Cash with status tracking
- **Wallet & Withdrawals** — GCash withdrawal via Xendit, deposit, transaction history
- **Worker Profiles** — Completion tracking, certifications, portfolio, materials/products listing
- **Avatar & Portfolio** — Camera/gallery upload with crop, up to 10 portfolio images
- **Team Jobs** — Multi-worker jobs with per-worker arrival tracking, group conversations
- **ML Price Predictions** — LSTM model for job price range suggestions
- **Instant Profile Switching** — Switch between Worker/Client profiles without logout
- **Real-Time Chat** — WebSocket messaging with typing indicators, image sharing
- **KYC Verification** — Document upload with face detection and OCR
- **Push Notifications** — Job updates, payment alerts, application status
- **Custom Navigation** — Safe back navigation, custom headers, deep link support

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

4. **On release**: The workflow extracts [Unreleased] content for GitHub Release notes automatically
