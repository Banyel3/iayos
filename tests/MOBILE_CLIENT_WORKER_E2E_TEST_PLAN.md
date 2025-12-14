# Mobile Client & Worker E2E Test Plan (React Native)

**Goal**: Execute full-flow QA on the mobile app by role (Client vs Worker), covering payments, identity, communication, and job lifecycle features.  
**Platforms**: Android + iOS (Expo).  
**Environments**: Point the app to the test backend (API/WS) and seed test accounts for both roles.

## Test Readiness
- [ ] Backend REST + WebSocket reachable from device/emulator
- [ ] Mobile build on Expo Go or dev client installed
- [ ] Seed accounts: at least 2 Clients and 2 Workers with KYC-ready data
- [ ] Wallet funding route available for payment tests (GCash/Web checkout + wallet top-up)
- [ ] Media upload bucket reachable for photos/IDs/receipts

---

## Client Flows
### Account, Identity, & Profile
- [ ] Register/login, password reset, session refresh
- [ ] Switch profile role to Client where applicable
- [ ] Profile edit (name, contact, address) saves and reloads correctly
- [ ] KYC: status transitions (Not Submitted → Pending → Approved/Rejected), rejection reasons, resubmission

### Job Creation & Management
- [ ] Post job with required fields (title, budget, category, location, photos)
- [ ] Edit/cancel job; verify status updates in Worker feeds
- [ ] Application triage: view applicants, accept/decline, assign worker
- [ ] Job timeline shows status history and supports pull-to-refresh

### Payments (Client side)
- [ ] Escrow/downpayment: 50% + platform fee calculation per method (GCash, wallet, cash upload)
- [ ] Final payment: remaining 50% + fee, shows escrow summary
- [ ] Payment status polling + timeline (pending/completed/failed/refunded)
- [ ] Receipts: render breakdown, share/download, history list
- [ ] Wallet: deposit presets/custom, balance refresh, transaction list
- [ ] Refund/void paths (failed or cancelled jobs) update balances and timeline

### Communication & Notifications
- [ ] Real-time chat per job: send/receive text + images; offline queue behavior
- [ ] Typing indicators and archive/unarchive behavior
- [ ] Push notifications + in-app center for job, payment, KYC, review, dispute events

### Reviews, Disputes, & Settings
- [ ] Leave/edit review after job completion; rating aggregates update
- [ ] Dispute creation with evidence upload and status updates
- [ ] App settings: theme, notification toggles, language (if available), logout

---

## Worker Flows
### Account, Onboarding, & Profile
- [ ] Register/login as Worker; complete onboarding checklist
- [ ] Profile completion widgets update (bio, hourly rate, phone)
- [ ] Skills, certifications (with/without specialization link), and materials CRUD
- [ ] Portfolio/avatar upload, reorder, and compression handling

### Job Discovery & Applications
- [ ] Browse/search/filter jobs by category, location, budget, keywords
- [ ] Save/unsave jobs; recent searches
- [ ] Submit application with proposal; withdraw/edit before decision
- [ ] Receive accept/decline decisions; accepted jobs appear in Active list

### Active Job Execution
- [ ] Two-phase completion flow (Worker Complete → Client Approval → Completed)
- [ ] Upload progress photos (limits, compression, retry on failure)
- [ ] Timeline/status badges update in real time and after refresh

### Payments & Earnings (Worker side)
- [ ] Earnings dashboard reflects escrow release + final payment
- [ ] Wallet balance updates after payment release; transaction history accuracy
- [ ] Cash verification status reflected when client chooses cash upload
- [ ] Withdraw/transfer (if enabled) honors limits and shows receipts

### Communication, Notifications, & Feedback
- [ ] Chat parity with Client (real-time messages, images, offline queue)
- [ ] Notification center shows job/payment/review/dispute events
- [ ] Reviews received are visible; averages and breakdowns render correctly

### Edge/Platform Cases
- [ ] Offline/poor network behavior for fetches, uploads, and websocket reconnects
- [ ] iOS vs Android differences (permission prompts, file pickers, back navigation)
- [ ] Large data sets (many jobs/messages/transactions) keep UI performant

---

## API Endpoint Coverage (sample paths)
- [ ] Auth/session: `/api/auth/*` (login, refresh, password reset)
- [ ] Profiles/KYC: `/api/mobile/profile/*`, `/api/mobile/kyc/*`
- [ ] Jobs: `/api/mobile/jobs/*`, `/api/mobile/applications/*`, `/api/mobile/jobs/{id}`
- [ ] Payments: `/api/mobile/payments/*`, `/api/mobile/wallet/*`, `/api/mobile/payments/timeline`
- [ ] Chat: `/api/profiles/chat/*` + WS `ws://.../ws/inbox/`
- [ ] Reviews: `/api/mobile/reviews/*`
- [ ] Notifications: `/api/mobile/notifications/*`
- [ ] Disputes/Support: `/api/mobile/disputes/*` (if available)
- [ ] Validate request/response schemas, auth guards, role-based access (Client vs Worker) for each flow above.

---

## Reporting
- [ ] Capture screenshots/recordings for regressions
- [ ] Log defects with steps, expected/actual, build info, and affected endpoint
- [ ] Summarize pass/fail per role and per feature area (payments, jobs, chat, KYC, reviews)
