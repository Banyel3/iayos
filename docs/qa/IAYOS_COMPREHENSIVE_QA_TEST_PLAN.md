# iAyos Platform - Comprehensive QA Test Plan

**Version**: 1.0  
**Date**: December 2025  
**Author**: QA Engineering Team  
**Status**: Ready for Execution

---

## Table of Contents

1. [Test Coverage Matrix](#1-test-coverage-matrix)
2. [Role & Platform Separation Tests](#2-role--platform-separation-tests)
3. [KYC OCR & Auto-Fill E2E Tests](#3-kyc-ocr--auto-fill-e2e-tests)
4. [Core Business Flow Tests](#4-core-business-flow-tests)
5. [Security & Authorization Tests](#5-security--authorization-tests)
6. [Error Handling & Edge Case Tests](#6-error-handling--edge-case-tests)
7. [Regression Test Suite](#7-regression-test-suite)

---

## 1. Test Coverage Matrix

### 1.1 Roles × Platforms × Domains Matrix

| Domain               | Worker (Mobile)           | Client (Mobile)            | Agency (Web)             | Admin (Web)         |
| -------------------- | ------------------------- | -------------------------- | ------------------------ | ------------------- |
| **Authentication**   | ✅ JWT Login/Register     | ✅ JWT Login/Register      | ✅ Cookie Login          | ✅ Cookie Login     |
| **KYC Verification** | ✅ Full Flow + Auto-fill  | ✅ Full Flow + Auto-fill   | ✅ Agency KYC Upload     | ✅ Review & Approve |
| **Job Listing**      | ✅ Browse LISTING Jobs    | ❌ N/A (Posts Only)        | ✅ View INVITE Jobs      | ✅ Admin CRUD       |
| **Job Creation**     | ❌ N/A                    | ✅ Create LISTING + INVITE | ❌ N/A                   | ✅ Admin Create     |
| **Job Applications** | ✅ Apply to LISTING Jobs  | ✅ Review Applications     | ❌ N/A                   | ✅ View All         |
| **Job Invites**      | ✅ Accept/Reject INVITE   | ✅ Send INVITE to Workers  | ✅ Accept/Reject INVITE  | ✅ Admin View       |
| **Job Completion**   | ✅ Mark Complete + Photos | ✅ Approve Completion      | ✅ Via Assigned Employee | ✅ Admin Override   |
| **Payments**         | ✅ Receive Earnings       | ✅ Escrow + Final Pay      | ✅ Agency Billing        | ✅ Transaction Mgmt |
| **Wallet**           | ✅ Balance + Withdraw     | ✅ Balance + Deposit       | ❌ N/A                   | ✅ Admin View       |
| **Reviews**          | ✅ Submit + Receive       | ✅ Submit + Receive        | ✅ Agency Reviews        | ✅ Moderate Reviews |
| **Chat/Messaging**   | ✅ Job Conversations      | ✅ Job Conversations       | ✅ Agency Chat           | ✅ View All Chats   |
| **Notifications**    | ✅ Push + In-App          | ✅ Push + In-App           | ✅ In-App                | ✅ In-App           |
| **Profile Mgmt**     | ✅ Worker Profile         | ✅ Client Profile          | ✅ Agency Profile        | ✅ User Management  |
| **Certifications**   | ✅ Upload + View          | ❌ N/A                     | ❌ N/A                   | ✅ Verify Certs     |
| **Portfolio**        | ✅ Upload + Manage        | ❌ N/A                     | ❌ N/A                   | ❌ N/A              |
| **Team Jobs**        | ✅ Apply to Slots         | ✅ Create Team Jobs        | ❌ N/A                   | ✅ Admin View       |
| **Back Jobs**        | ✅ View Status            | ✅ Request Back Job        | ❌ N/A                   | ✅ Approve/Reject   |

### 1.2 Platform Access Rules

| Platform              | Allowed Roles  | Auth Method      | Feature Flag                                               |
| --------------------- | -------------- | ---------------- | ---------------------------------------------------------- |
| **Mobile App**        | WORKER, CLIENT | JWT Bearer Token | Default: Enabled                                           |
| **Web Dashboard**     | WORKER, CLIENT | Cookie           | `ENABLE_WORKER_WEB_UI=false`, `ENABLE_CLIENT_WEB_UI=false` |
| **Web Agency Portal** | AGENCY         | Cookie           | Self-protected route `/agency`                             |
| **Web Admin Panel**   | ADMIN          | Cookie           | Self-protected route `/admin`                              |

### 1.3 API Authentication Matrix

| Endpoint Pattern       | Auth Type     | Mobile   | Web | Notes                                           |
| ---------------------- | ------------- | -------- | --- | ----------------------------------------------- |
| `/api/mobile/*`        | `jwt_auth`    | ✅       | ❌  | Mobile-only endpoints                           |
| `/api/accounts/kyc/*`  | `dual_auth`   | ✅       | ✅  | Both platforms                                  |
| `/api/jobs/*`          | `cookie_auth` | ⚠️ Proxy | ✅  | Web endpoints, mobile uses `/api/mobile/jobs/*` |
| `/api/agency/*`        | `cookie_auth` | ❌       | ✅  | Agency-only                                     |
| `/api/adminpanel/*`    | `cookie_auth` | ❌       | ✅  | Admin-only                                      |
| `/api/profiles/chat/*` | `dual_auth`   | ✅       | ✅  | Both platforms                                  |

---

## 2. Role & Platform Separation Tests

### 2.1 Web Access Control Tests

#### TC-WEB-001: Worker Cannot Access Web Dashboard (Feature Flag Off)

**Precondition**: `ENABLE_WORKER_WEB_UI = false` in middleware  
**Steps**:

1. Log in as WORKER user via web (`/auth/login`)
2. Navigate to `/dashboard`
3. Verify redirect behavior

**Expected**: Redirect to `/mobile-only` page with message "This feature is only available on our mobile app"  
**Pass Criteria**: HTTP 302 redirect, landing page shows mobile-only message

#### TC-WEB-002: Client Cannot Access Web Dashboard (Feature Flag Off)

**Precondition**: `ENABLE_CLIENT_WEB_UI = false` in middleware  
**Steps**:

1. Log in as CLIENT user via web
2. Navigate to `/dashboard`
3. Verify redirect behavior

**Expected**: Redirect to `/mobile-only` page  
**Pass Criteria**: HTTP 302 redirect to `/mobile-only`

#### TC-WEB-003: Agency Can Access Agency Portal

**Precondition**: User has `account_type = AGENCY`  
**Steps**:

1. Log in as AGENCY user via web
2. Navigate to `/agency`
3. Verify access granted

**Expected**: Agency dashboard loads successfully  
**Pass Criteria**: HTTP 200, agency dashboard renders with profile data

#### TC-WEB-004: Agency Cannot Access Admin Panel

**Precondition**: User has `account_type = AGENCY`  
**Steps**:

1. Log in as AGENCY user via web
2. Navigate to `/admin`
3. Verify access denied

**Expected**: Redirect to unauthorized page or login  
**Pass Criteria**: HTTP 302/403, access denied message

#### TC-WEB-005: Admin Can Access Admin Panel

**Precondition**: User has `role = ADMIN` in SystemRoles  
**Steps**:

1. Log in as ADMIN user via web
2. Navigate to `/admin`
3. Verify access granted

**Expected**: Admin panel loads with full functionality  
**Pass Criteria**: HTTP 200, admin sidebar and dashboard visible

#### TC-WEB-006: Non-Admin Cannot Access Admin Panel

**Precondition**: User is WORKER/CLIENT (no admin role)  
**Steps**:

1. Log in as WORKER via web
2. Navigate to `/admin`
3. Verify access denied

**Expected**: Redirect to unauthorized or login  
**Pass Criteria**: No admin content exposed

### 2.2 API Authorization Tests

#### TC-API-001: Mobile Endpoint Rejects Cookie Auth

**Endpoint**: `POST /api/mobile/auth/login`  
**Steps**:

1. Send request with cookie session (no JWT)
2. Verify response

**Expected**: Request succeeds (public endpoint) or proper auth flow  
**Pass Criteria**: No server error, proper response structure

#### TC-API-002: Cookie Endpoint Rejects JWT

**Endpoint**: `GET /api/jobs/my-jobs`  
**Steps**:

1. Send request with Bearer token only (no cookie)
2. Verify 401 response

**Expected**: 401 Unauthorized  
**Pass Criteria**: `{"detail": "Unauthorized"}` response

#### TC-API-003: Dual Auth Accepts JWT

**Endpoint**: `GET /api/accounts/kyc/autofill`  
**Steps**:

1. Send request with valid JWT Bearer token
2. Verify successful response

**Expected**: 200 OK with KYC data  
**Pass Criteria**: Response contains `extracted_fields` object

#### TC-API-004: Dual Auth Accepts Cookie

**Endpoint**: `GET /api/accounts/kyc/autofill`  
**Steps**:

1. Send request with valid session cookie
2. Verify successful response

**Expected**: 200 OK with KYC data  
**Pass Criteria**: Response contains `extracted_fields` object

#### TC-API-005: Agency Endpoint Requires Agency Account Type

**Endpoint**: `GET /api/agency/profile`  
**Steps**:

1. Log in as WORKER with cookie auth
2. Call `/api/agency/profile`
3. Verify rejection

**Expected**: 403 Forbidden or 401 Unauthorized  
**Pass Criteria**: Access denied, no agency data exposed

#### TC-API-006: Admin Endpoint Requires Admin Role

**Endpoint**: `GET /api/adminpanel/jobs/listings`  
**Steps**:

1. Log in as CLIENT with cookie auth
2. Call `/api/adminpanel/jobs/listings`
3. Verify rejection

**Expected**: 403 Forbidden  
**Pass Criteria**: No admin data exposed

### 2.3 Cross-Role Data Isolation Tests

#### TC-ISO-001: Worker Cannot See Other Worker's Certifications

**Steps**:

1. Worker A uploads certification
2. Worker B calls `GET /api/worker/certifications`
3. Verify only Worker B's certifications returned

**Expected**: Empty list or Worker B's certs only  
**Pass Criteria**: No Worker A certification data in response

#### TC-ISO-002: Client Cannot See Other Client's Job Applications

**Steps**:

1. Client A creates job, Worker applies
2. Client B calls `GET /api/jobs/{client_a_job_id}/applications`
3. Verify rejection

**Expected**: 403 Forbidden (not job owner)  
**Pass Criteria**: Application data not exposed

#### TC-ISO-003: Agency Cannot See Other Agency's Employees

**Steps**:

1. Agency A adds employees
2. Agency B calls `GET /api/agency/employees`
3. Verify only Agency B's employees returned

**Expected**: Agency B's employee list only  
**Pass Criteria**: No Agency A employee data exposed

---

## 3. KYC OCR & Auto-Fill E2E Tests

### 3.1 Positive Test Cases

#### TC-KYC-001: Complete KYC Upload Flow with Auto-Fill

**Precondition**: User registered, not KYC verified  
**Steps**:

1. Upload front ID (valid government ID image)
2. Upload back ID
3. Upload selfie
4. Call `POST /api/accounts/upload/kyc`
5. Wait for AI verification (or mock response)
6. Call `GET /api/accounts/kyc/autofill`
7. Verify extracted data returned

**Expected**:

- Upload returns `success: true`
- Auto-fill returns extracted fields with confidence scores
- Fields include: `first_name`, `last_name`, `birth_date`, `address`, `id_number`

**Pass Criteria**:

- All 3 files uploaded successfully
- `extraction_status = PENDING` or `EXTRACTED`
- At least one field has `confidence > 0.5`

#### TC-KYC-002: User Confirms Extracted Data

**Precondition**: KYC uploaded, auto-fill data available  
**Steps**:

1. Call `GET /api/accounts/kyc/autofill` to get extracted data
2. Modify one field (e.g., correct first name spelling)
3. Call `POST /api/accounts/kyc/confirm` with:
   ```json
   {
     "first_name": "CorrectedName",
     "last_name": "ExtractedLastName",
     "birth_date": "1990-01-01",
     "edited_fields": ["first_name"]
   }
   ```
4. Verify confirmation saved

**Expected**:

- Response: `success: true`
- `extraction_status` changes to `CONFIRMED`
- Confirmed values stored separately from extracted values

**Pass Criteria**:

- `confirmed_first_name = "CorrectedName"`
- `extracted_first_name` unchanged
- `edited_fields` contains `["first_name"]`

#### TC-KYC-003: Auto-Approval When Thresholds Met

**Precondition**:

- `autoApproveKYC = true` in PlatformSettings
- `kycAutoApproveMinConfidence = 0.85`
- `kycRequireUserConfirmation = true`

**Steps**:

1. Upload high-quality ID documents
2. AI extracts data with `overall_confidence = 0.92`
3. User confirms data via `POST /api/accounts/kyc/confirm`
4. Verify auto-approval

**Expected**:

- KYC status changes to `APPROVED`
- User receives notification "KYC Verified! ✅"
- Response includes `auto_approved: true`

**Pass Criteria**:

- `kyc.kyc_status = "APPROVED"`
- `kyc.reviewedBy` includes "AI_AUTO_APPROVAL"
- Notification created for user

#### TC-KYC-004: Admin Views Extracted vs Confirmed Comparison

**Precondition**: User confirmed KYC data with edits  
**Steps**:

1. Admin logs in via web
2. Navigate to `/admin/kyc/{kyc_id}`
3. View extracted data comparison component
4. Verify discrepancies highlighted

**Expected**:

- Side-by-side comparison table visible
- Edited fields marked with "✏️" indicator
- Confidence badges color-coded (green > 0.8, yellow > 0.6, red < 0.6)

**Pass Criteria**:

- All extracted fields displayed with confidence percentages
- All confirmed fields displayed
- Mismatches clearly highlighted

### 3.2 Negative Test Cases

#### TC-KYC-NEG-001: Auto-Fill Fails - No KYC Record

**Precondition**: User has no KYC submission  
**Steps**:

1. Call `GET /api/accounts/kyc/autofill` without uploading KYC

**Expected**: Error response indicating no KYC data  
**Pass Criteria**: HTTP 404 or `{"error": "No KYC data found"}`

#### TC-KYC-NEG-002: Auto-Fill Fails - No Extraction Data

**Precondition**: KYC uploaded but AI extraction failed  
**Steps**:

1. Upload invalid/corrupt images
2. Call `GET /api/accounts/kyc/autofill`

**Expected**: Empty or minimal extraction data  
**Pass Criteria**: Response includes `extraction_status: FAILED` or empty fields

#### TC-KYC-NEG-003: Auto-Approval Blocked - Confidence Below Threshold

**Precondition**:

- `autoApproveKYC = true`
- `kycAutoApproveMinConfidence = 0.90`
- User's extraction has `overall_confidence = 0.75`

**Steps**:

1. User confirms data via `POST /api/accounts/kyc/confirm`
2. Verify no auto-approval

**Expected**:

- KYC status remains `PENDING`
- `auto_approved: false` in response
- Queued for manual admin review

**Pass Criteria**:

- `kyc.kyc_status = "PENDING"`
- No auto-approval notification sent

#### TC-KYC-NEG-004: Auto-Approval Blocked - User Confirmation Required But Missing

**Precondition**:

- `autoApproveKYC = true`
- `kycRequireUserConfirmation = true`
- `extraction_status = EXTRACTED` (not confirmed)

**Steps**:

1. Upload KYC (AI extracts with high confidence)
2. Do NOT call `/kyc/confirm`
3. Check if auto-approved

**Expected**: No auto-approval until user confirms  
**Pass Criteria**: Status remains `PENDING`

#### TC-KYC-NEG-005: Confirm Fails - Invalid Data Format

**Steps**:

1. Call `POST /api/accounts/kyc/confirm` with invalid birth_date format:
   ```json
   {
     "first_name": "Test",
     "birth_date": "invalid-date"
   }
   ```

**Expected**: 400 Bad Request with validation error  
**Pass Criteria**: Error message indicates invalid date format

#### TC-KYC-NEG-006: AI Rejects Document - No Face Detected

**Steps**:

1. Upload ID image with no visible face
2. Check AI verification status

**Expected**:

- `ai_verification_status = FAILED`
- `ai_rejection_reason = NO_FACE_DETECTED`

**Pass Criteria**: Appropriate error message for user

### 3.3 Edge Cases

#### TC-KYC-EDGE-001: Special Characters in Name

**Steps**:

1. Upload ID for user with name containing special chars (e.g., "José María Ñoño")
2. Verify OCR extraction handles Unicode

**Expected**: Name extracted correctly with accents preserved  
**Pass Criteria**: `extracted_full_name` contains original characters

#### TC-KYC-EDGE-002: Expired Document Detection

**Steps**:

1. Upload expired ID document
2. Check if expiry detected and flagged

**Expected**: Warning or rejection based on expiry date OCR  
**Pass Criteria**: `ai_warnings` includes expiry warning if detected

#### TC-KYC-EDGE-003: Multiple Resubmissions

**Precondition**: User rejected 2 times, `maxResubmissions = 3`  
**Steps**:

1. User uploads new documents (3rd attempt)
2. Verify `resubmissionCount` incremented
3. Check if 4th attempt blocked

**Expected**:

- 3rd attempt accepted
- 4th attempt blocked with "Maximum resubmissions reached"

**Pass Criteria**: `can_resubmit()` returns False after max attempts

---

## 4. Core Business Flow Tests

### 4.1 Worker Flow Tests

#### TC-WORKER-001: Complete Worker Registration to First Job

**Steps**:

1. Register as WORKER via mobile (`POST /api/mobile/auth/register`)
2. Verify email
3. Complete KYC upload
4. Wait for KYC approval (or auto-approve)
5. Browse available jobs (`GET /api/mobile/jobs/available`)
6. Apply to LISTING job (`POST /api/mobile/jobs/{id}/apply`)
7. Get accepted by client
8. Receive notification
9. Start conversation
10. Mark job complete with photos
11. Receive review from client
12. Submit review for client

**Expected**: Full flow completes without errors  
**Pass Criteria**:

- Account created with `is_active = true`
- KYC approved (`KYCVerified = true`)
- Application status changes to `ACCEPTED`
- Job status progresses through lifecycle
- Wallet balance updated after job payment

#### TC-WORKER-002: Worker Manages Certifications

**Steps**:

1. Add certification (`POST /api/accounts/worker/certifications`)
2. Upload certificate image
3. View certifications list
4. Update certification details
5. Delete expired certification

**Expected**: Full CRUD operations succeed  
**Pass Criteria**:

- Certification created with `is_verified = false`
- Image URL saved
- List returns all worker's certs
- Update modifies correct record
- Delete removes record

#### TC-WORKER-003: Worker Profile Completion Tracking

**Precondition**: New worker profile  
**Steps**:

1. Check initial completion percentage
2. Add bio
3. Add profile image
4. Add certifications
5. Add portfolio items
6. Check final completion percentage

**Expected**: Completion percentage increases with each addition  
**Pass Criteria**:

- Initial: 0-30%
- With bio: +12.5%
- With image: +12.5%
- With cert: +12.5%
- Final: >75%

### 4.2 Client Flow Tests

#### TC-CLIENT-001: Create and Manage LISTING Job

**Steps**:

1. Register/login as CLIENT
2. Complete KYC verification
3. Deposit funds to wallet (`POST /api/accounts/wallet/deposit`)
4. Create LISTING job (`POST /api/jobs/create-mobile`)
5. View job applications
6. Accept an application
7. Confirm worker arrival
8. Approve job completion
9. Submit review

**Expected**: Full job lifecycle completes  
**Pass Criteria**:

- Job created with `status = ACTIVE`, `jobType = LISTING`
- Escrow payment created (50% downpayment)
- Worker assignment recorded
- Final payment released after approval
- Both reviews submitted

#### TC-CLIENT-002: Create INVITE Job (Direct Hire)

**Steps**:

1. Browse workers (`GET /api/mobile/workers/list`)
2. View worker profile
3. Create INVITE job for specific worker
4. Wait for worker acceptance
5. Complete job flow

**Expected**: INVITE job created and assigned to specific worker  
**Pass Criteria**:

- Job created with `jobType = INVITE`
- Target worker receives notification
- Worker can accept/reject
- Conversation created on acceptance

#### TC-CLIENT-003: Create Team Job with Multiple Slots

**Steps**:

1. Create team job (`POST /api/jobs/team/create`) with:
   - 2 plumber slots
   - 1 electrician slot
2. Workers apply to specific slots
3. Accept applications for each slot
4. Start team job when all filled
5. Individual workers mark complete
6. Client approves final completion

**Expected**: Team job with per-slot tracking  
**Pass Criteria**:

- JobSkillSlot records created per slot
- JobWorkerAssignment per accepted worker
- Team conversation with all parties
- Individual completion timestamps tracked

### 4.3 Agency Flow Tests

#### TC-AGENCY-001: Agency Receives and Accepts INVITE Job

**Steps**:

1. Client creates INVITE job targeting agency
2. Agency views incoming invites (`GET /api/agency/jobs`)
3. Agency accepts invite (`POST /api/agency/jobs/{id}/accept`)
4. Conversation created
5. Agency assigns employee (`POST /api/agency/jobs/{id}/assign-employee`)
6. Employee completes work
7. Client approves completion

**Expected**: Full agency job flow  
**Pass Criteria**:

- Agency receives invite notification
- Job status changes to `ACCEPTED` after agency accepts
- Employee assignment tracked
- Conversation includes agency + client

#### TC-AGENCY-002: Agency Employee Management

**Steps**:

1. Add employee to agency roster
2. View employee performance stats
3. Set employee of the month
4. Update employee rating
5. View leaderboard

**Expected**: Full employee management functionality  
**Pass Criteria**:

- Employee linked to agency
- Performance stats calculated
- EOTM badge applied
- Leaderboard sorted correctly

#### TC-AGENCY-003: Agency KYC Verification

**Steps**:

1. Register as agency
2. Upload agency KYC documents (`POST /api/agency/upload`)
3. View KYC status (`GET /api/agency/status`)
4. Admin reviews and approves
5. Agency can now receive jobs

**Expected**: Agency KYC separate from individual KYC  
**Pass Criteria**:

- AgencyKYC record created
- Status tracked independently
- Admin approval required

### 4.4 Admin Flow Tests

#### TC-ADMIN-001: Admin Reviews Pending KYC

**Steps**:

1. Admin logs in
2. Navigate to KYC pending list
3. View individual KYC details
4. View AI extraction comparison
5. Approve KYC with notes
6. Verify user notified

**Expected**: Full KYC review workflow  
**Pass Criteria**:

- Pending KYC list loads
- Extracted vs confirmed comparison visible
- Approval updates KYC status
- KYCLog audit record created
- User notification sent

#### TC-ADMIN-002: Admin Rejects KYC with Reason

**Steps**:

1. View pending KYC
2. Reject with category `INVALID_DOCUMENT`
3. Provide rejection reason (min 10 chars)
4. Verify user notification includes reason

**Expected**: Rejection recorded with audit trail  
**Pass Criteria**:

- KYC status = `REJECTED`
- `rejectionCategory` saved
- `rejectionReason` saved
- User can see reason
- Resubmission counter ready

#### TC-ADMIN-003: Admin Configures Auto-Approval Thresholds

**Steps**:

1. Navigate to Platform Settings
2. Enable `autoApproveKYC`
3. Set `kycAutoApproveMinConfidence = 0.85`
4. Set `kycFaceMatchMinSimilarity = 0.90`
5. Enable `kycRequireUserConfirmation`
6. Save settings
7. Verify new KYC submissions use new thresholds

**Expected**: Settings persist and affect KYC processing  
**Pass Criteria**:

- Settings saved to database
- Next KYC confirm checks new thresholds
- Audit log of settings change

#### TC-ADMIN-004: Admin Manages User Accounts

**Steps**:

1. Search for user
2. View user profile
3. Suspend user temporarily
4. Verify suspended user cannot log in
5. Activate user
6. Verify user can log in again
7. Ban user permanently
8. Verify ban prevents all access

**Expected**: Full user lifecycle management  
**Pass Criteria**:

- Suspension updates `is_suspended`, `suspended_until`
- Suspended user gets 403 on login
- Activation clears suspension
- Ban updates `is_banned`, `banned_reason`
- Banned user permanently blocked

#### TC-ADMIN-005: Admin Reviews Back Job Dispute

**Steps**:

1. Client requests back job
2. Admin views disputes list
3. Admin reviews dispute details
4. Admin approves back job
5. Verify job reopened for worker

**Expected**: Dispute resolution workflow  
**Pass Criteria**:

- Dispute status changes to `APPROVED`
- Back job workflow initiated
- Worker notified
- Job timeline updated

---

## 5. Security & Authorization Tests

### 5.1 Authentication Security Tests

#### TC-SEC-001: JWT Token Expiration

**Steps**:

1. Login and get JWT token
2. Note token expiry time
3. Wait for expiry (or manipulate timestamp)
4. Make request with expired token

**Expected**: 401 Unauthorized  
**Pass Criteria**: Proper expiry handling, refresh flow works

#### TC-SEC-002: Cookie Session Security

**Steps**:

1. Login via web (cookie auth)
2. Verify cookie attributes:
   - HttpOnly flag
   - Secure flag (in production)
   - SameSite policy

**Expected**: Secure cookie configuration  
**Pass Criteria**: All security flags set appropriately

#### TC-SEC-003: CSRF Protection

**Steps**:

1. Attempt state-changing request without CSRF token
2. Verify rejection

**Expected**: 403 Forbidden for CSRF violation  
**Pass Criteria**: CSRF tokens required for POST/PUT/DELETE

#### TC-SEC-004: Password Hashing Verification

**Steps**:

1. Register user with known password
2. Query database for stored password
3. Verify hash, not plaintext

**Expected**: Password stored as bcrypt hash  
**Pass Criteria**: Password hash starts with `$2b$` (bcrypt indicator)

### 5.2 Input Validation Tests

#### TC-VAL-001: SQL Injection Prevention

**Endpoints**: All search/filter endpoints  
**Steps**:

1. Send malicious input: `' OR '1'='1`
2. Verify no SQL error or data leak

**Expected**: Input sanitized, ORM protection active  
**Pass Criteria**: Normal error response, no database error

#### TC-VAL-002: XSS Prevention in User Content

**Steps**:

1. Submit job description with script tag: `<script>alert('xss')</script>`
2. View job detail
3. Verify script not executed

**Expected**: HTML escaped on output  
**Pass Criteria**: Script renders as text, not executed

#### TC-VAL-003: File Upload Validation

**Endpoint**: KYC upload, portfolio upload  
**Steps**:

1. Attempt to upload non-image file with image extension
2. Attempt to upload oversized file
3. Verify rejections

**Expected**:

- Non-image rejected with "Invalid file type"
- Oversized rejected with "File too large"

**Pass Criteria**: Proper validation errors returned

### 5.3 Rate Limiting Tests

#### TC-RATE-001: Login Rate Limiting

**Steps**:

1. Attempt 10 rapid login failures
2. Verify rate limit triggered

**Expected**: 429 Too Many Requests after threshold  
**Pass Criteria**: Rate limit message returned

#### TC-RATE-002: API Rate Limiting

**Steps**:

1. Make 100 rapid API requests
2. Verify rate limit behavior

**Expected**: Throttling after threshold  
**Pass Criteria**: 429 response or queue behavior

---

## 6. Error Handling & Edge Case Tests

### 6.1 API Error Response Tests

#### TC-ERR-001: 400 Bad Request Format

**Steps**:

1. Send malformed JSON to any POST endpoint
2. Verify error response format

**Expected**:

```json
{
  "error": "Invalid request format",
  "details": {...}
}
```

**Pass Criteria**: Consistent error structure

#### TC-ERR-002: 401 Unauthorized Format

**Steps**:

1. Access protected endpoint without auth
2. Verify error response

**Expected**:

```json
{
  "detail": "Unauthorized"
}
```

**Pass Criteria**: No sensitive data leaked

#### TC-ERR-003: 404 Not Found Format

**Steps**:

1. Request non-existent resource
2. Verify error response

**Expected**:

```json
{
  "error": "Resource not found"
}
```

**Pass Criteria**: No stack traces exposed

#### TC-ERR-004: 500 Internal Error Handling

**Steps**:

1. Trigger server error (if possible in test env)
2. Verify error response

**Expected**: Generic error message, no stack trace  
**Pass Criteria**: Sensitive info not exposed to client

### 6.2 Edge Case Tests

#### TC-EDGE-001: Self-Hiring Prevention

**Steps**:

1. Create dual-profile user (WORKER + CLIENT)
2. As CLIENT, create job
3. As WORKER (same account), attempt to apply

**Expected**: 403 Forbidden "Cannot apply to your own job"  
**Pass Criteria**: Self-application blocked

#### TC-EDGE-002: Dual Profile Switching

**Steps**:

1. Login as dual-profile user
2. Switch profile (`POST /api/mobile/profile/switch-profile`)
3. Verify new JWT contains updated `profile_type`
4. Verify API responses filtered by new profile

**Expected**: Instant profile switch without re-login  
**Pass Criteria**: New token issued, profile-specific data returned

#### TC-EDGE-003: Concurrent Job Application Race Condition

**Steps**:

1. Create job with single worker slot
2. Two workers submit applications simultaneously
3. Client accepts first
4. Verify second application handled

**Expected**: Only one worker assigned, second application rejected or queued  
**Pass Criteria**: No double-assignment, data integrity maintained

#### TC-EDGE-004: Wallet Insufficient Balance

**Steps**:

1. Attempt payment exceeding wallet balance
2. Verify rejection

**Expected**: 400 with "Insufficient balance"  
**Pass Criteria**: Transaction not created, balance unchanged

#### TC-EDGE-005: Job Cancellation After Worker Assigned

**Steps**:

1. Create job, worker accepted
2. Client attempts to cancel

**Expected**: Cancellation blocked or requires refund flow  
**Pass Criteria**: Appropriate business logic enforced

---

## 7. Regression Test Suite

### 7.1 Critical Path Regression Tests

These tests should run on every deployment:

| Test ID | Test Name                  | Priority |
| ------- | -------------------------- | -------- |
| REG-001 | User Registration (Mobile) | P0       |
| REG-002 | User Login (Mobile)        | P0       |
| REG-003 | User Login (Web)           | P0       |
| REG-004 | KYC Upload                 | P0       |
| REG-005 | Job Creation (Client)      | P0       |
| REG-006 | Job Application (Worker)   | P0       |
| REG-007 | Payment Processing         | P0       |
| REG-008 | Chat Message Send          | P1       |
| REG-009 | Notification Delivery      | P1       |
| REG-010 | Admin KYC Approval         | P1       |

### 7.2 Legacy Behavior Verification

#### REG-LEGACY-001: Job Status Transitions

**Verify**: All valid status transitions still work:

- ACTIVE → IN_PROGRESS
- IN_PROGRESS → PENDING_APPROVAL
- PENDING_APPROVAL → COMPLETED
- Any → CANCELLED (with conditions)

#### REG-LEGACY-002: Escrow Payment Flow

**Verify**: 50% downpayment + 5% platform fee calculation unchanged

#### REG-LEGACY-003: Two-Phase Job Completion

**Verify**: Worker marks complete → Client approves → Both review

#### REG-LEGACY-004: Notification Types

**Verify**: All notification types still created:

- JOB_APPLICATION_RECEIVED
- APPLICATION_ACCEPTED
- JOB_COMPLETED
- REVIEW_RECEIVED
- KYC_APPROVED/REJECTED
- PAYMENT_RECEIVED

### 7.3 API Contract Regression Tests

| Endpoint                            | Expected Response Fields                           | Verify |
| ----------------------------------- | -------------------------------------------------- | ------ |
| `GET /api/mobile/jobs/list`         | `jobs[]`, `total`, `page`                          | ✅     |
| `GET /api/accounts/kyc/autofill`    | `extracted_fields{}`, `extraction_status`          | ✅     |
| `POST /api/accounts/kyc/confirm`    | `success`, `auto_approved`, `auto_approval_reason` | ✅     |
| `GET /api/agency/profile`           | `agencyId`, `businessName`, `kycStatus`            | ✅     |
| `GET /api/adminpanel/jobs/listings` | `jobs[]`, `total`, `page`, `stats{}`               | ✅     |

---

## Appendix A: Test Environment Setup

### A.1 Required Test Data

1. **Test Users**:
   - 1 WORKER (verified KYC)
   - 1 WORKER (unverified)
   - 1 CLIENT (verified KYC)
   - 1 AGENCY (verified)
   - 1 ADMIN

2. **Test Jobs**:
   - 1 ACTIVE LISTING job
   - 1 IN_PROGRESS job
   - 1 COMPLETED job
   - 1 INVITE job

3. **Test Images**:
   - Valid passport image
   - Valid national ID image
   - Blurry image (for negative tests)
   - Non-face image (for negative tests)

### A.2 Environment Variables

```bash
# Test environment
ENABLE_WORKER_WEB_UI=false
ENABLE_CLIENT_WEB_UI=false
AUTO_APPROVE_KYC=false  # Toggle for auto-approval tests
KYC_MIN_CONFIDENCE=0.85
```

### A.3 Mock Services

- CompreFace API: Mock for face detection tests
- Xendit API: Mock for payment tests
- Supabase: Mock for file upload tests

---

## Appendix B: Test Automation Framework Recommendations

### B.1 Backend API Tests

- **Framework**: pytest + pytest-django
- **Coverage Target**: >80% line coverage
- **CI Integration**: Run on every PR

### B.2 Mobile E2E Tests

- **Framework**: Detox or Maestro
- **Devices**: iOS Simulator, Android Emulator
- **Scenarios**: Critical paths only

### B.3 Web E2E Tests

- **Framework**: Playwright
- **Browsers**: Chrome, Firefox, Safari
- **Coverage**: Admin + Agency portals

---

**Document Version History**:

- v1.0 (Dec 2025): Initial comprehensive test plan post-refactor
