# Changelog

All notable changes to the iAyos Mobile App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Escrow Top-Up Prompts for Active Jobs (General)**
  - Clients now see a warning banner on active job details when the current escrow balance is insufficient to cover remaining work obligations.
  - Shows the exact deficit amount and a "Deposit Funds" button linking to the wallet deposit screen.
  - Works for both DAILY jobs (tracks per-worker remaining days vs escrow balance) and PROJECT jobs (checks wallet balance vs remaining 50% payment).
  - Accounts for early-completed workers (Panelist #2) when computing remaining escrow obligations on team jobs.
  - Backend: New `_compute_escrow_status(job)` helper in `mobile_services.py` — computes escrow health for DAILY and PROJECT payment models.
  - Backend: New `GET /{job_id}/escrow-status` endpoint in `jobs/api.py` — lightweight polling endpoint for escrow status.
  - Backend: Escrow status automatically included in job detail response for clients on active jobs.
  - Mobile: New `JOB_ESCROW_STATUS` API config constant, `EscrowStatus` interface, and deficit banner on active job detail screen.

- **Per-Worker Early Completion with Full Pay on DAILY Team Jobs (Panelist #2)**
  - Clients can mark individual workers as "done early" on active DAILY team jobs.
  - The worker receives their full contracted amount (daily_rate × duration_days); any remaining balance (total contracted − already earned) is paid out as a lump-sum to the worker's pending earnings.
  - New "Complete Early (Full Pay)" button per worker row on active team DAILY jobs (client view only, for ACTIVE assignments).
  - Early-completed workers show an "Early Done" badge and payout details on the assignment row.
  - Backend: New `early_completed`, `early_completed_at`, `early_completion_payout` fields on `JobWorkerAssignment` model.
  - Backend: New `POST /{job_id}/team/early-complete/{assignment_id}` API endpoint.
  - Mobile: New `useEarlyCompleteWorker` hook and `TEAM_EARLY_COMPLETE` API endpoint constant.

- **Daily Rate Negotiation for Workers (Panelist #1)**
  - Workers can now propose a custom daily rate and number of days when applying to DAILY payment model jobs (both regular and team jobs).
  - Apply modals show daily rate + days inputs (with computed total) when job is DAILY and worker selects "Negotiate", instead of the flat budget input.
  - Accept label shows daily rate breakdown (rate/day x days) for DAILY jobs.
  - Daily rate and days fields pre-populate from job's agreed rate and duration when opening apply modal.
  - Client team application view shows proposed daily rate breakdown for DAILY job applicants who negotiated.
  - My Applications cards show daily rate info for DAILY jobs where worker negotiated.
  - Backend: New `proposed_daily_rate` and `proposed_days` fields on JobApplication model.
  - Backend: Accept endpoint supports `daily_rate_override` for clients to counter-propose a rate.
  - Backend: Rate priority chain on accept: client override > worker proposal > job-level agreed rate.

### Fixed

- **Hybrid Team Job Visibility on Worker Home + Slot Guarding**
  - Fixed worker mobile home listing visibility for hybrid team jobs (one agency-invited slot + one open worker slot).
  - Worker feed now includes team jobs when at least one non-agency skill slot remains open.
  - Prevented worker apply CTA from showing on agency-invited slots in team job detail.
  - Added backend hard guard to reject worker applications on agency-reserved slots.
  - Aligned worker-visible filtering for team project-rate and agency-hire hybrid scenarios via backend query-level slot-open checks.
  - **Impact**: Hybrid team jobs now appear correctly in mobile home, and workers can only apply to worker-open slots.

- **Team Job Agency Invite Guard (Duplicate Agency Across Slots)**
  - Prevented inviting the same agency into multiple skill slots during team job creation.
  - Added immediate client-side guard in team create flow with prompt to navigate to existing **Hire Agency** flow.
  - Added submit-time duplicate validation safety check for slot-level agency invites.
  - Added backend hard validation (`DUPLICATE_AGENCY_SLOT_INVITE`) so API-level bypass is also blocked.
  - **Impact**: Multi-slot invites now enforce distinct agencies per slot, and users are redirected to the correct direct agency flow when they intend to hire one agency for multiple requirements.

- **Single Project Conversation Arrival Flow (Client-First Simplified Path)**
  - Removed legacy worker-first action gates (`Mark On The Way` / `Mark Job Started`) from single non-team, non-agency project conversation actions.
  - Client now always gets the first actionable button: **Confirm Worker Has Arrived**.
  - Worker now waits for client arrival confirmation, then can directly **Mark Job Complete** (no intermediate worker arrival/start taps).
  - Prevented in-session deadlock risk from legacy on-the-way lock state in simplified flow.
  - Cleaned single-job lifecycle timeline wording to avoid surfacing legacy worker-first step labels as current flow guidance.
  - **Impact**: Single project jobs now follow the same client-first simplified arrival behavior expected by QA.

- **Team DAILY Early-Paid Completion Deadlock (Review/Backjob Ready)**
  - Fixed team DAILY completion flow when all team workers were already paid via per-worker early completion.
  - Client approval now proceeds without requiring a non-zero final payment and no longer fails with "No remaining payment is due for this team job."
  - Updated team conversation CTA to show **Approve Team Completion** (instead of **Approve & Pay Team (₱0)**) when all assignments are already early-completed.
  - Mixed-case behavior remains unchanged: if only some workers are early-paid, final approval/payment flow still applies for workers with remaining contracted payout.
  - **Impact**: Team DAILY conversations no longer get stuck in "waiting for client approval" after all workers have already been paid early; flow proceeds to reviews/backjob eligibility correctly.

- **Shift Label + Time Window Update (Daily Jobs)**
  - Updated DAILY shift display labels across mobile flows from "Morning" to "Day Shift".
  - Updated Day Shift time display to `8:00 AM - 5:00 PM`.
  - Updated Night Shift time display to `6:00 PM - 12:00 AM`.
  - Applied in create-job forms, apply-job screens, fixed-shift banners, and worker calendar legend badges.
  - **Impact**: Shift selection and schedule display now consistently reflect the new operational shift windows.

- **Android Emulator Splash-Stuck Bootstrap Recovery (BlueStacks Windows)**
  - Hardened token/cache bootstrap storage reads with timeout-protected SecureStore access and AsyncStorage fallback in mobile token storage utility.
  - Added startup watchdog fallback on the app index route: if auth bootstrap stalls too long, splash is force-hidden and app routes to login instead of hanging indefinitely.
  - Kept normal successful bootstrap behavior unchanged (splash still hides immediately once auth + welcome flags resolve).
  - **Impact**: Prevents infinite splash-screen lock on emulator environments where SecureStore/keystore can stall (notably BlueStacks on Windows), while preserving existing behavior on working devices/emulators.

- **Team DAILY Backjob Start Flow Parity (Single-Job Pattern)**
  - Updated team DAILY backjob client-start gate so `Confirm Started` unlocks after workers finish schedule confirmations (same progression pattern as single-job backjobs).
  - Disabled team arrival-confirmation step specifically for DAILY backjobs and kept arrival gating for non-DAILY team backjobs.
  - Improved block-reason messaging to show schedule-confirmation progress before start.
  - **Impact**: After both team workers agree to the backjob schedule, client can proceed directly with backjob start and completion flow without getting stuck on arrival confirmation.

- **Agency Backjob One-Day Dispatch/Arrival Flow Unification (Single-Job Parity)**
  - Updated agency PROJECT backjob gates to bypass legacy multi-day project lock when a backjob is active, in negotiation, and schedule-confirmed.
  - Agency dispatch, client confirm-arrival, and completion sections now use backjob-cycle-aware status checks (`isAgencyStatusInCurrentBackjobCycle`) instead of raw flags.
  - This mirrors the single-job backjob progression after dispatch while preserving existing non-backjob behavior.
  - **Impact**: Client -> Agency backjobs no longer hide dispatch/arrival actions on legacy multi-day project jobs; flow now proceeds consistently through backjob completion.

- **Team Backjob Arrival CTA Gate Parity (Single-Job Pattern Alignment)**
  - Audited single-job backjob flow and aligned team flow to rely on real backjob state signals, not only `is_team_job` flag.
  - Backjob team worker rows now drive team-flow detection even for legacy payloads where `is_team_job` is missing/stale.
  - Client-side backjob start gate now recognizes team arrival prerequisites via assignment rows, restoring `Confirm Arrival` progression path.
  - **Impact**: Team PROJECT backjobs no longer dead-end after schedule confirmations when team assignment data exists but team flag metadata is inconsistent.

- **Team PROJECT Backjob: Client Confirm Arrival CTA Restoration**
  - Added explicit client-side `Confirm Arrival` action list in backjob workflow when team workers have confirmed schedule but are still pending arrival confirmation.
  - Preserved existing backjob start gate so `Confirm Started` appears only after all required team arrivals are confirmed.
  - **Impact**: Team PROJECT/FIXED backjobs no longer get stuck after schedule confirmations; client can complete arrival confirmations and continue flow.

- **Team DAILY Backjob Completion Compatibility + Idempotent UX**
  - Enabled team assignment completion for DAILY jobs during active backjob cycles so `Mark Assignment Complete` works in TEAM DAILY backjob flow.
  - Kept normal DAILY non-backjob behavior unchanged (still attendance-based outside active backjob cycles).
  - Updated team assignment completion UX to treat duplicate taps as idempotent success (`Already Marked Complete`) instead of error-like behavior.
  - **Impact**: TEAM DAILY backjobs now follow required per-worker completion flow consistently without repeat-tap confusion.

- **Team Backjob PROJECT RATE Completion Flow (Per-Worker Assignment)**
  - Fixed team PROJECT/FIXED backjob `Mark My Assignment Complete` button to use per-assignment completion endpoint instead of dispute-level mark-complete, preventing one worker from completing the entire backjob.
  - Updated worker waiting-for-approval and client approve-completion conditions to use `isTeamBackjobFlow` (all team types) instead of `isTeamDailyBackjobFlow` (DAILY only).
  - **Impact**: Team PROJECT RATE backjobs now require each worker to individually mark their assignment complete before client can approve, matching the working DAILY team backjob behavior.

- **Agency Wallet/Receipt Parity + Mobile UI Refresh (Selected PR #912 Changes)**
  - Applied receipt-related mobile updates so buffer release date/remaining-day details derive correctly when explicit fields are missing.
  - Applied selected mobile UI updates from PR #912 (agency chat banner/attendance presentation and profile/job/worker visual refinements).
  - **Impact**: Wallet/receipt presentation is more consistent and agency/mobile UI updates from PR #912 are now included in main.

- **Team Backjob Mark Complete Authorization + Multi-Worker Waiting State**
  - Hardened backend backjob completion permission lookup to resolve team assignment directly by authenticated account (`workerID__profileID__accountFK`) before legacy profile fallback.
  - Updated mobile conversation backjob gating to treat team flow as active when team assignment rows exist (even if legacy `is_team_job` flag is stale).
  - Prevented generic worker `Mark Complete` action from showing in team backjob flows when no matching team assignment is available.
  - Added explicit team-worker action label (`Mark My Assignment Complete`) and assignment-sync waiting notice for unbound team rows.
  - **Impact**: Team workers can mark completion reliably in backjob cycles, and client-side waiting state reflects multi-worker progression instead of falling back to a single-worker message.

- **Agency Attendance Confirm Toast Wording (No False ₱0 Payment Message)**
  - Updated mobile attendance confirmation success copy to avoid payment wording when confirmed amount is zero.
  - Client-side confirm action now shows `Attendance approved` unless a real payout amount is processed.
  - **Impact**: Client -> Agency attendance confirmations no longer show misleading `Payment of ₱0 processed` messages.

- **Team Backjob Attendance Row Selection Self-Heal (Legacy Duplicate Rows)**
  - Updated mobile team/backjob attendance matching to select the best row by priority (`assignment_id` first) and most recent attendance signal timestamp.
  - Applied the same best-match logic to worker-side `myWorkerAttendanceToday`, team backjob signal derivation, and client-side assignment-to-attendance merging.
  - Prevents stale legacy rows from winning first-match selection when both old and current-cycle same-day rows exist.
  - **Impact**: Worker `Mark On The Way` no longer reappears after dispatch, and client pending-arrival counts now reflect the current-cycle state consistently.

- **Agency Client Confirm Arrival Visibility (Project Jobs)**
  - Updated agency project conversation flow so clients can confirm arrival per dispatched employee without waiting for every assigned employee to be dispatched first.
  - Kept existing dispatch status guidance visible for employees not yet dispatched.
  - **Impact**: Clients now see `Confirm Arrival` as soon as an agency employee is marked on the way, matching expected team-style arrival confirmation behavior.

- **KYC Name Mismatch Warning Flow + DOB Picker Year Fix**
  - Updated mobile KYC Step 2 name-mismatch behavior from hard blocker to one-time warning modal (same UI, warning shown once per upload session).
  - Users can continue to ID verification after seeing/dismissing the warning instead of being forced to restart the step.
  - Fixed KYC Step 3 `Date of Birth` picker parsing/formatting so it no longer falls back to epoch-like values and supports changing year normally.
  - Enforced 18+ date restriction in Step 3 DOB picker so dates younger than 18 years old cannot be selected/saved.
  - Improved date handling to use local `YYYY-MM-DD` formatting and robust parsing for OCR date variants.
  - **Impact**: KYC flow is less disruptive for minor OCR/profile name mismatches, and DOB editing is fully usable.

- **Backjob Detail 'Not Found' Fallback Recovery (Worker Flow)**
  - Hardened mobile backjob detail param parsing for `jobId`/`disputeId` to prevent invalid route values from triggering false missing states.
  - Added direct dispute lookup path `GET /api/jobs/backjob/{dispute_id}` and made it the primary detail fetch path when `disputeId` is present.
  - Added fallback lookup via `GET /api/mobile/jobs/my-backjobs` when primary `backjob-status` lookup fails, then resolves the dispute by `dispute_id` (or `job_id`) and continues loading details.
  - **Impact**: Workers opening backjob detail from conversation/list routes no longer hit false `Backjob Not Found` screens when primary lookup fails on legacy/edge payloads.

- **Team Backjob On-The-Way State Sync + Worker Detail Visibility**
  - Added `assignment_id` to conversation attendance payload rows and updated mobile team attendance matching to use `assignment_id` in addition to worker/account IDs.
  - Updated mobile backjobs filtering for workers to include team assignments (not only direct assignedWorker jobs), with dual-profile fallback by account.
  - Updated backjob status lookup to consistently use the latest dispute cycle (`openedDate` desc).
  - **Impact**: Team workers no longer see `Mark On The Way` reappear after dispatch, client-side pending-arrival state updates reliably, and worker-side backjob detail no longer disappears in team flows.

- **GCash-Only Withdrawal Methods Enforcement**
  - Updated mobile payment methods management to only allow adding and displaying GCash accounts for payouts.
  - Updated mobile wallet withdrawal flow to only show verified GCash accounts and updated all prompts/copy accordingly.
  - **Impact**: Users can no longer select unsupported withdrawal destinations (Bank/Card/PayPal/Maya/GrabPay) from the mobile app.

- **Team Backjob On-The-Way Sequence + Legacy Cycle Compatibility**
  - Updated team backjob gating to separate `dispatch/on-the-way` from `arrival` so clients now see `Waiting for workers to mark on the way` before `Confirm arrivals first`.
  - Updated worker-side team backjob UI to render `Mark On The Way` in legacy team project branches instead of immediately showing `Waiting for client to confirm your arrival`.
  - Fixed misleading worker backjob status text so `Waiting for scheduled start...` now appears only when the scheduled date is genuinely in the future.
  - Added worker pre-start backjob action rendering so team workers scheduled for today can immediately tap `Mark On The Way` from the backjob card.
  - Updated future-date lock messaging to show exact schedule text: `Scheduled backjob is on <date>` and block early `Mark On The Way` attempts.
  - Updated backend schedule-confirm flow so backjob is marked initiated once worker schedule confirmation is completed.
  - Added backend compatibility for existing jobs/backjobs where base job status remains `COMPLETED`: worker check-in now supports active confirmed backjob cycles.
  - Expanded conversation attendance payload inclusion to active backjob cycles so existing records reflect dispatch/arrival updates without creating a new job.
  - **Impact**: Existing TEAM DAILY and TEAM PROJECT/FIXED backjobs can follow the intended flow: schedule confirm -> worker marks on the way -> client confirms arrival -> start/complete steps.

- **Direct Hire Category Selection Fallback (Worker + Agency)**
  - Fixed direct-hire job creation category loading when worker/agency skill mapping returns an empty set.
  - Worker direct-hire now falls back to full category list if worker-scoped categories are empty.
  - Agency direct-hire no longer hard-fails to an empty category list when specialization matching yields zero hits.
  - Improved empty-state copy to avoid showing `No categories found for ""` when no search query is entered.
  - **Impact**: Clients can select a category reliably in both `Hire Worker` and `Hire Agency` flows.

- **Agency PROJECT Finish Flow + Legacy Workflow Compatibility (Existing In-Progress Jobs)**
  - Updated client `Finish Job` behavior for agency PROJECT multi-day jobs to continue into payment method selection (Wallet/Cash) before closing.
  - Added legacy attendance fallback in client-side workflow checks so older in-progress jobs with valid attendance signals are not falsely blocked.
  - **Impact**: Existing agency PROJECT jobs can complete with the expected flow: dispatch → arrival confirmation → checkout/complete → payment method selection → job closes (reviews/backjob enabled).

- **Agency PROJECT Client Approval Workflow Guard (Prevents False 'Workflow Incomplete')**
  - Tightened client-side `Approve & Pay Agency` visibility to require full employee workflow completion: dispatched + arrival confirmed + agency marked complete.
  - Added a defensive pre-submit check before agency approval mutation so stale/partial workflow states are blocked client-side with a clear message.
  - **Impact**: Prevents backend rejection `Cannot approve - workflow incomplete` when client attempts to finish/approve before all agency workflow steps are truly complete.

- **Client Arrival Gating Requires Full Agency Dispatch (Team PROJECT)**
  - Updated client-side conversation flow so `Confirm Arrival` actions are hidden until all assigned agency employees are dispatched.
  - Added explicit per-employee pending dispatch messaging (e.g., `Employee X has not been dispatched.`) when dispatch is incomplete.
  - **Impact**: Clients now follow the intended workflow strictly: agency dispatches all assigned employees first, then client arrival confirmation becomes available.

- **Archived Agency Job Review Gate Recovery + Legacy Compatibility**
  - Fixed conversation review modal recovery when employee review submit returns duplicate (`already reviewed/rated`) so users are no longer trapped in a required-review dialog.
  - Added fallback state handling to close/sync the modal when no remaining employee reviews are pending after a duplicate response.
  - Added compatibility fallback in review gating to treat agency-client review flow as complete when backend reports no next review action but legacy review records already exist.
  - **Impact**: Archived agency jobs no longer re-block clients on already-reviewed employees, and duplicate-submit flows recover cleanly.

- **Insufficient Wallet Flow Parity for Agency + Team Job Creation**
  - Investigated single-job creation flow and matched its submit-time insufficient-balance prompt behavior.
  - Team job creation now shows the same `Insufficient Wallet Balance` alert on submit with direct `Deposit Funds` route to `/payments/deposit` and prefilled shortage amount.
  - Team submit button is no longer blocked solely by low balance so clients can trigger the deposit prompt flow consistently.
  - Agency job request wallet warning/deposit CTA visibility now uses computed required downpayment instead of raw budget text checks.
  - **Impact**: Agency and team create flows now mirror single-job deposit guidance and let clients top up directly from creation screens.

- **Job Request End-Date One-Day Checkbox Date Handling**
  - Fixed mobile job request date handling to use calendar-day comparisons (date-only), not raw timestamp math.
  - Fixed end-date behavior so selecting a next-day end date does not leave the `This job is one day or less` state enabled.
  - Updated payload date formatting to local `YYYY-MM-DD` output instead of UTC-based conversion to prevent date shifting.
  - **Impact**: Multi-day job requests now stay correctly recognized as multi-day when end date is the following day.

- **Backjob Legacy In-Progress Compatibility (Dispatch/Start Flow)**
  - Added compatibility fallback in mobile backjob status gating so legacy in-progress records with missing timestamp fields still count dispatched/arrived when boolean status is already true.
  - Prevents old active backjob threads from being blocked by strict cycle timestamp checks after workflow updates.
  - **Impact**: Existing in-progress backjobs can proceed through testing without creating a new job request.

- **Global Mandatory Review Gate (All Pending Jobs List)**
  - Upgraded mobile pending-review blocker to render all pending review jobs instead of only the first item.
  - Added per-job `Review Now` actions so users can jump directly into each required conversation.
  - Triggered pending-review refetch on auth-ready and app foreground to enforce review requirements after app reopen.
  - Expanded pending-review payload typing for team and agency review chains (`TEAM_WORKER`, `EMPLOYEE`, `AGENCY`).
  - **Impact**: Users can no longer bypass review requirements by app close/reopen, and can see every outstanding review obligation in one blocking modal.

- **Wallet Pending Filter Tab for Worker Payout Visibility**
  - Added a new `Pending` transaction filter tab in wallet/profile transactions.
  - Wired mobile filter mapping to request `PENDING_EARNING` transactions from backend.
  - Updated backend mobile transaction type mapping to accept `PENDING_EARNING` (and `PENDING` alias).
  - DAILY jobs now auto-release previous day pending payout(s) to wallet balance when worker checks in the following day.
  - Added a system note in team job conversation when that next-day auto-release happens so workers can see it in-chat.
  - Removed `Release Payment Now` action for DAILY jobs in conversation screen (kept for non-DAILY flows).
  - **Impact**: Worker day payouts held in buffer are now easy to find in transaction history and clearly follow the pending-earnings flow.

- **Team DAILY Client Waiting Status Card (On-The-Way Visibility)**
  - Extended team attendance row merging for client view to include DAILY team jobs, not just PROJECT multi-day.
  - Added placeholder team worker rows for DAILY when no attendance has been logged yet.
  - Added client-facing waiting card: `Awaiting workers to mark as on the way...` when all workers are still pending.
  - **Impact**: Clients can now see clear pre-arrival team status in DAILY jobs, matching PROJECT visibility.

- **DAILY Per-Click Payment Method Selection (Wallet or Cash Proof)**
  - Added per-attendance client prompt in conversation flow for DAILY jobs to choose `Wallet` or `Cash` when confirming a checked-out worker.
  - Added cash-proof image capture/upload support in DAILY attendance confirmation (`cash_proof_image` multipart payload).
  - Updated backend DAILY attendance confirmation to accept payment method + optional cash proof, and to persist payment metadata per attendance row.
  - Added attendance-level payout tracking fields (`payment_method`, `cash_payment_proof_url`, `cash_payment_verified`, timestamps) with migration.
  - **Impact**: DAILY payouts now support explicit method choice per worker/day confirmation while preserving existing wallet flow and backwards compatibility.

- **Team PROJECT Repeated-Backjob Review Freshness Parity**
  - Hardened conversation review refresh after edit by awaiting conversation refetch before advancing to the next editable review target.
  - Added conversation/messages cache invalidation on review edit success.
  - Updated backend conversation review selection to prioritize latest edited records (`updatedAt` then `createdAt`) for repeated backjob cycles.
  - **Impact**: In team PROJECT jobs, second-backjob review edits now reflect immediately and consistently instead of showing stale old review values.

- **Team Review List Scroll in View Reviews Modal**
  - Removed the review section height cap in the conversation review modal so long team worker review lists are no longer clipped.
  - Keeps modal scrolling handled by the existing outer `ScrollView`, allowing clients to scroll through all worker reviews.
  - **Impact**: Clients can now view the complete team review list (not just the first review card) in `View Reviews`.

- **Team DAILY Date-Range Duration Auto-Calc + Release-Now Stability**
  - Fixed team DAILY job creation to auto-calculate `duration_days` from selected start and end dates (inclusive), matching single-job DAILY behavior.
  - One-day team jobs now consistently set duration to `1` when one-day mode is enabled.
  - Fixed backend release-payment-now failure caused by updating a non-existent `updatedAt` field on `Transaction` during pending-earning release.
  - **Impact**: Team DAILY posts now compute duration correctly from dates, and release button no longer throws a 500 for valid jobs.

- **Team PROJECT Worker Helper Guidance Messages**
  - Added clearer worker-side helper guidance in conversation attendance UI for team PROJECT flows.
  - Added pre-action guidance before tapping `On The Way` so workers understand arrival verification and check-out dependencies.
  - Improved post check-out helper copy to explicitly explain waiting states:
    - waiting for client to confirm workday,
    - waiting for client to extend or finish+pay when configured duration is reached,
    - next-step guidance after confirmed day/payment.
  - **Impact**: Workers now see actionable next-step messages at each attendance stage, reducing confusion in team PROJECT rate workflows.

- **Backjob Schedule Date Picker Stability + Change Review Submit Fix**
  - Fixed backjob schedule modal date handling to normalize date-only values and avoid picker reversion while selecting dates.
  - Improved Android date picker event handling so only confirmed selections are applied (dismiss events no longer overwrite state).
  - Updated mobile review edit flow to submit full multi-criteria ratings and decimal overall rating for backjob review changes.
  - Updated mobile backend review edit endpoint/service typing to accept decimal ratings consistently.
  - Improved mobile API error parsing for Django Ninja `detail` validation arrays to prevent generic "unexpected error" messaging.
  - **Impact**: Clients can reliably set backjob schedule dates without snap-back behavior, and post-backjob "Yes, Change Review" submits successfully with clear error messaging when validation fails.

- **Team DAILY Completion Parity with Single DAILY Flow**
  - Updated active team job actions to block PROJECT-only team completion paths when the job is `DAILY`.
  - Routed client team DAILY end action to the daily finish flow so settlement follows the same attendance-driven model as single DAILY jobs.
  - Added a dedicated DAILY-specific `Finish Daily Job` client action in active job details for team daily jobs.
  - Added backend guardrails to reject PROJECT-style team completion endpoints for DAILY jobs and direct callers to the daily finish route.
  - Improved mobile attendance check-out assignment validation to properly recognize team-assigned workers.
  - **Impact**: Team DAILY jobs now follow the same completion and payout behavior as single DAILY jobs, preventing PROJECT-style approval drift.

- **Team Job Unified Receipt + Allocation Breakdown**
  - Added unified team receipt view showing full-transaction settlement (`Total Client Paid`, `Team Earnings Pool`, and `Platform Fee`) instead of role-specific single-worker totals.
  - Added explicit team allocation section (`Who gets what`) listing each assigned worker's skill slot and allocated amount.
  - Enhanced backend team receipt payload with `team_distribution` details (`worker_allocations`, allocated totals, unallocated amount, fee and client-paid summary).
  - Added synthetic receipt transaction row for platform fee when legacy/team flows bundled fee into escrow/payment records without a dedicated `FEE` transaction row.
  - Updated exported PDF receipt to use whole-transaction summary for team jobs (single receipt perspective for all parties).
  - **Impact**: Team receipts now consistently explain where funds go, who receives what, and where platform fee is applied, while preserving one shared transaction view.

- **Unified Job Receipt Model (Client + Worker Single View)**
  - Removed role-dependent total labels/values from job receipt modal for non-team jobs.
  - Job receipts now consistently show both sides in one settlement view: `Total Client Paid`, `Worker Earnings`, and `Platform Fee`.
  - Updated job receipt share text and PDF export to the same single-job unified structure.
  - **Impact**: Receipts are now tied to a single job ledger view for both client and worker, instead of separate perspective-based totals.

- **PROJECT Multi-Day Worked-Day Counter Sync + Dialog Accuracy**
  - Synced backend PROJECT multi-day progress tracking with confirmed attendance rows by updating `job.total_days_worked` after client confirmation and no-work confirmations.
  - Updated conversation end-action cards to display effective worked progress (`Worked X/Y day(s)`) using fallback duration and QA offset in TESTING mode.
  - Prevents phantom `0/3 days` messaging when QA skip-next-day is used and aligns UI progress text with completion gate behavior.
  - **Impact**: Clients now see accurate day progress before tapping `Job Finished`, and PROJECT multi-day finish gating matches tracked attendance in production and QA testing flows.

- **Team Job Posting Payment Model Selector (Project vs Daily)**
  - Added payment model selection in team job create screen: `Project Rate` or `Daily Rate`.
  - Added DAILY inputs for `daily rate per worker` and `duration (days)`.
  - Added automatic total-budget computation for DAILY team jobs: `daily rate x days x total workers`.
  - Updated payment summary and escrow label dynamically:
    - PROJECT: `50% Escrow (Downpayment)`
    - DAILY: `100% Escrow (Daily Job)`
  - Sent new payload fields from mobile to backend team-create API: `payment_model`, `daily_rate`, `duration_days`.
  - **Impact**: Clients can now explicitly choose team job payment mode during posting, aligning team create flow with DAILY/PROJECT backend behavior.

- **PROJECT Final Payment Prompt + Completion Sync Hardening**
  - Restored explicit `Wallet` / `Cash` selection when clients approve completion from Active Job details (solo + team), replacing the old hardcoded approval path.
  - Added cash-proof upload support to the team approval endpoint and hook so CASH team approvals follow the same proof flow as regular/agency PROJECT jobs.
  - Hardened backend completion flow to avoid leaving jobs completed when final payment processing fails (completion flags are rolled back and an error is returned).
  - Fixed team completion payment marking to use actual payment processing + `remainingPaymentPaidAt` instead of setting paid state without processing.
  - **Impact**: PROJECT jobs now consistently require explicit payment method selection and avoid false "completed-but-unpaid" states across solo/team/client->agency approval paths.

- **Client Backjob Banner Hidden After Payment Release**
  - Updated conversation banner visibility to hide backjob-request/review-reminder prompts once payment release rights are waived (`paymentBuffer.is_payment_released === true`).
  - Prevents outdated CTA prompts after client completes release-payment flow.
  - **Impact**: Conversation state now reflects post-release behavior and removes misleading backjob actions.

- **Team Multi-Day PROJECT Arrival Flow Unblocked**
  - Prevented legacy non-attendance team PROJECT blocks from rendering in multi-day flows, so workers are no longer forced into premature “waiting for client to confirm arrival” state.
  - Added guard so dispatched waiting state only appears when the worker has actually marked on-the-way (`worker_confirmed_at` present).
  - **Impact**: Team multi-day worker flow now starts correctly with “On The Way,” matching single DAILY attendance-first behavior while keeping final payment gated to job completion.

- **DAILY Skip-Day Absence Penalty + State Sync**
  - Client-approved DAILY skip-day now updates conversation state immediately with optimistic cache sync to prevent stale buttons and duplicate-click rejections.
  - Added attendance row patching for approved skip-day responses so ABSENT/payment-processed state appears without waiting for refetch.
  - Daily summary card now shows `Absent Penalty (10%)` and `Net Expected Earnings` when penalty data is present.
  - **Impact**: Prevents frontend/backend state mismatch for skip-day actions and makes absent-penalty effects visible in worker/client daily summaries.

- **PROJECT Multi-Day End-Flow Controls (Team + Single Project)**
  - Added PROJECT multi-day end-action card in conversation for clients when configured duration is reached.
  - Added `Extend +1 Day` action for PROJECT jobs (team and non-team) using new backend endpoint.
  - Added `Job Finished` action that routes to existing completion/payment flow:
    - Team PROJECT: client uses approve-and-pay team flow after all assignments are marked complete.
    - Single PROJECT: client uses approve completion/pay-final flow after worker marks complete.
  - **Impact**: Multi-day PROJECT jobs now have explicit extend-or-finish controls similar to DAILY end-flow behavior, while preserving final payout at completion.

- **QA Skip-Next-Day Support for Multi-Day PROJECT Jobs**
  - Extended mobile QA skip-next-day control to eligible multi-day `PROJECT` jobs (team and non-team), while preserving existing `DAILY` behavior.
  - Added backend eligibility support so QA day fast-forward works for `DAILY` and for `PROJECT` jobs with `duration_days > 1`.
  - Added generic QA route support (`/api/jobs/{job_id}/qa/skip-next-day`) and switched mobile mutation to the generic endpoint.
  - **Impact**: QA can fast-forward effective work day in multi-day project conversations without needing DAILY-only flow.

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
