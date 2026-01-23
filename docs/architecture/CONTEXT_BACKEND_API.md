# iAyos Backend API - Complete Inventory

**Generated**: November 20, 2025  
**Total Endpoints**: 140+  
**Routers**: 7 modules

---

## 📊 API Statistics

| Router           | Endpoints | Auth Methods           | Purpose                       |
| ---------------- | --------- | ---------------------- | ----------------------------- |
| /api/accounts/   | 90+       | cookie_auth, dual_auth | Core auth, users, wallet, KYC |
| /api/mobile/     | 43        | jwt_auth               | Mobile-optimized endpoints    |
| /api/jobs/       | 45        | jwt_auth, cookie_auth  | Job management, applications  |
| /api/profiles/   | 15        | cookie_auth            | Chat, products, wallet        |
| /api/agency/     | 15        | cookie_auth            | Agency operations             |
| /api/client/     | 4         | cookie_auth            | Agency discovery              |
| /api/adminpanel/ | 25        | None (admin)           | KYC review, analytics         |

---

## 🔐 1. Accounts API (`/api/accounts/`)

**File**: `apps/backend/src/accounts/api.py`  
**Auth**: Primarily `cookie_auth`, some `dual_auth`

### Authentication Endpoints

| Method | Path                           | Auth        | Purpose                      |
| ------ | ------------------------------ | ----------- | ---------------------------- |
| GET    | `/auth/google/login`           | None        | Initiate Google OAuth        |
| GET    | `/auth/google/callback`        | None        | Handle Google OAuth callback |
| POST   | `/register`                    | None        | Individual user registration |
| POST   | `/register/agency`             | None        | Agency registration          |
| POST   | `/login`                       | None        | Email/password login         |
| POST   | `/assign-role`                 | None        | Assign CLIENT/WORKER role    |
| POST   | `/logout`                      | cookie_auth | Logout user                  |
| POST   | `/refresh`                     | cookie_auth | Refresh access token         |
| GET    | `/me`                          | cookie_auth | Get current user profile     |
| GET    | `/verify`                      | None        | Verify email with token      |
| POST   | `/forgot-password/send-verify` | None        | Request password reset       |
| POST   | `/forgot-password/verify`      | None        | Reset password with token    |

### KYC Endpoints

| Method | Path           | Auth        | Purpose                     |
| ------ | -------------- | ----------- | --------------------------- |
| POST   | `/upload/kyc`  | cookie_auth | Upload KYC documents        |
| GET    | `/kyc/history` | cookie_auth | Get KYC application history |

### Notification Endpoints

| Method | Path                            | Auth        | Purpose                      |
| ------ | ------------------------------- | ----------- | ---------------------------- |
| GET    | `/notifications`                | dual_auth   | Get user notifications       |
| POST   | `/notifications/{id}/mark-read` | cookie_auth | Mark notification as read    |
| POST   | `/notifications/mark-all-read`  | cookie_auth | Mark all as read             |
| GET    | `/notifications/unread-count`   | dual_auth   | Get unread count             |
| POST   | `/register-push-token`          | dual_auth   | Register Expo push token     |
| GET    | `/notification-settings`        | cookie_auth | Get notification preferences |
| PUT    | `/notification-settings`        | cookie_auth | Update preferences           |
| DELETE | `/notifications/{id}/delete`    | cookie_auth | Delete notification          |

### Worker Discovery Endpoints

| Method | Path                    | Auth        | Purpose                    |
| ------ | ----------------------- | ----------- | -------------------------- |
| GET    | `/users/workers`        | None        | Browse workers (public)    |
| GET    | `/users/workers/{id}`   | None        | Get worker profile         |
| PATCH  | `/workers/availability` | cookie_auth | Update worker availability |
| GET    | `/workers/availability` | cookie_auth | Get worker availability    |

### Location Endpoints

| Method | Path                       | Auth        | Purpose                         |
| ------ | -------------------------- | ----------- | ------------------------------- |
| POST   | `/location/update`         | cookie_auth | Update GPS coordinates          |
| GET    | `/location/me`             | cookie_auth | Get current location            |
| POST   | `/location/toggle-sharing` | cookie_auth | Enable/disable location sharing |
| POST   | `/location/nearby-workers` | None        | Find nearby workers             |

### Profile Image Upload

| Method | Path                    | Auth        | Purpose               |
| ------ | ----------------------- | ----------- | --------------------- |
| POST   | `/upload/profile-image` | cookie_auth | Upload profile avatar |

### Wallet Endpoints (Cookie Auth - Web)

| Method | Path                            | Auth        | Purpose                 |
| ------ | ------------------------------- | ----------- | ----------------------- |
| GET    | `/wallet/balance`               | cookie_auth | Get wallet balance      |
| POST   | `/wallet/deposit`               | cookie_auth | Deposit via Xendit      |
| POST   | `/wallet/withdraw`              | cookie_auth | Request withdrawal      |
| GET    | `/wallet/transactions`          | cookie_auth | Get transaction history |
| POST   | `/wallet/webhook`               | None        | Xendit webhook handler  |
| POST   | `/wallet/simulate-payment/{id}` | cookie_auth | Dev: simulate payment   |
| GET    | `/wallet/payment-status/{id}`   | cookie_auth | Get payment status      |

### Worker Phase 1 Endpoints (Profile Enhancement)

| Method | Path                             | Auth        | Purpose                                  |
| ------ | -------------------------------- | ----------- | ---------------------------------------- |
| POST   | `/worker/profile`                | cookie_auth | Update worker profile (bio, hourly_rate) |
| GET    | `/worker/profile-completion`     | cookie_auth | Get completion percentage                |
| POST   | `/worker/certifications`         | cookie_auth | Add certification                        |
| GET    | `/worker/certifications`         | cookie_auth | List certifications                      |
| PUT    | `/worker/certifications/{id}`    | cookie_auth | Update certification                     |
| DELETE | `/worker/certifications/{id}`    | cookie_auth | Delete certification                     |
| POST   | `/worker/portfolio`              | cookie_auth | Upload portfolio image                   |
| GET    | `/worker/portfolio`              | cookie_auth | List portfolio images                    |
| PUT    | `/worker/portfolio/{id}/caption` | cookie_auth | Update caption                           |
| PUT    | `/worker/portfolio/reorder`      | cookie_auth | Reorder portfolio images                 |
| DELETE | `/worker/portfolio/{id}`         | cookie_auth | Delete portfolio image                   |

### Review System Endpoints (Phase 8)

| Method | Path                   | Auth        | Purpose                     |
| ------ | ---------------------- | ----------- | --------------------------- |
| POST   | `/reviews/submit`      | cookie_auth | Submit job review           |
| GET    | `/reviews/worker/{id}` | None        | Get worker reviews (public) |
| GET    | `/reviews/stats/{id}`  | None        | Get review statistics       |
| GET    | `/reviews/my-reviews`  | cookie_auth | Get my reviews              |
| PUT    | `/reviews/{id}`        | cookie_auth | Edit my review              |
| POST   | `/reviews/{id}/report` | cookie_auth | Report inappropriate review |

---

## 📱 2. Mobile API (`/api/mobile/`)

**File**: `apps/backend/src/accounts/mobile_api.py`  
**Auth**: All use `jwt_auth` (Bearer token)

### Authentication

| Method | Path                    | Purpose                              |
| ------ | ----------------------- | ------------------------------------ |
| POST   | `/auth/register`        | Mobile registration (returns tokens) |
| POST   | `/auth/login`           | Mobile login (returns tokens)        |
| POST   | `/auth/logout`          | Mobile logout                        |
| GET    | `/auth/profile`         | Get current user                     |
| POST   | `/auth/assign-role`     | Assign CLIENT/WORKER role            |
| POST   | `/auth/refresh`         | Refresh access token                 |
| POST   | `/auth/forgot-password` | Request password reset               |
| POST   | `/auth/reset-password`  | Reset password                       |
| GET    | `/auth/verify`          | Verify email                         |

### Job Discovery

| Method | Path               | Purpose                                |
| ------ | ------------------ | -------------------------------------- |
| GET    | `/jobs/list`       | Browse jobs with filters               |
| GET    | `/jobs/categories` | Get job categories                     |
| GET    | `/jobs/{id}`       | Get job details                        |
| POST   | `/jobs/create`     | Create job (LISTING or INVITE)         |
| POST   | `/jobs/invite`     | Create direct hire job                 |
| GET    | `/jobs/search`     | Search jobs by keyword                 |
| GET    | `/jobs/available`  | Available jobs for worker              |
| GET    | `/jobs/my-jobs`    | My jobs (client or worker) **[FIXED]** |

### Location Services

| Method | Path                               | Purpose                |
| ------ | ---------------------------------- | ---------------------- |
| GET    | `/locations/cities`                | Get cities list        |
| GET    | `/locations/cities/{id}/barangays` | Get barangays for city |

### Dashboard

| Method | Path                           | Purpose              |
| ------ | ------------------------------ | -------------------- |
| GET    | `/dashboard/stats`             | Dashboard statistics |
| GET    | `/dashboard/recent-jobs`       | Recent jobs          |
| GET    | `/dashboard/available-workers` | Available workers    |

### Profile Management

| Method | Path                    | Purpose        |
| ------ | ----------------------- | -------------- |
| GET    | `/profile/me`           | Get my profile |
| PUT    | `/profile/update`       | Update profile |
| POST   | `/profile/upload-image` | Upload avatar  |

### Worker & Agency Discovery

| Method | Path                    | Purpose                 |
| ------ | ----------------------- | ----------------------- |
| GET    | `/workers/list`         | Browse workers          |
| GET    | `/workers/{id}`         | Get worker profile      |
| GET    | `/workers/detail/{id}`  | Detailed worker profile |
| GET    | `/agencies/list`        | Browse agencies         |
| GET    | `/agencies/detail/{id}` | Agency profile          |

### Wallet (Mobile)

| Method | Path                   | Purpose                  |
| ------ | ---------------------- | ------------------------ |
| GET    | `/wallet/balance`      | Get wallet balance       |
| POST   | `/wallet/deposit`      | Deposit funds via Xendit |
| GET    | `/wallet/transactions` | Transaction history      |

### Reviews (Mobile)

| Method | Path                   | Purpose            |
| ------ | ---------------------- | ------------------ |
| POST   | `/reviews/submit`      | Submit review      |
| GET    | `/reviews/worker/{id}` | Get worker reviews |
| GET    | `/reviews/job/{id}`    | Get job reviews    |
| GET    | `/reviews/my-reviews`  | My reviews         |
| GET    | `/reviews/stats/{id}`  | Review statistics  |
| PUT    | `/reviews/{id}`        | Edit review        |
| POST   | `/reviews/{id}/report` | Report review      |
| GET    | `/reviews/pending`     | Pending reviews    |

---

## 💼 3. Jobs API (`/api/jobs/`)

**File**: `apps/backend/src/jobs/api.py`  
**Auth**: Mix of `jwt_auth` and `cookie_auth`

### Job CRUD

| Method | Path               | Auth        | Purpose                          |
| ------ | ------------------ | ----------- | -------------------------------- |
| POST   | `/create`          | jwt_auth    | Create job (with escrow payment) |
| POST   | `/create-mobile`   | jwt_auth    | Mobile job creation              |
| GET    | `/my-jobs`         | cookie_auth | Get my posted jobs               |
| GET    | `/available`       | cookie_auth | Available jobs to apply          |
| GET    | `/in-progress`     | cookie_auth | Jobs in progress                 |
| GET    | `/completed`       | cookie_auth | Completed jobs                   |
| GET    | `/my-applications` | cookie_auth | My job applications              |
| GET    | `/{id}`            | cookie_auth | Get job details                  |
| PATCH  | `/{id}/cancel`     | cookie_auth | Cancel job                       |

### Job Applications

| Method | Path                                 | Auth        | Purpose                     |
| ------ | ------------------------------------ | ----------- | --------------------------- |
| GET    | `/{id}/applications`                 | cookie_auth | Get job applications        |
| POST   | `/{id}/apply`                        | cookie_auth | Apply to job                |
| POST   | `/{id}/accept`                       | cookie_auth | Accept application (legacy) |
| POST   | `/{id}/applications/{app_id}/accept` | cookie_auth | Accept specific application |
| POST   | `/{id}/applications/{app_id}/reject` | cookie_auth | Reject application          |

### Job Completion & Payment

| Method | Path                          | Auth        | Purpose                    |
| ------ | ----------------------------- | ----------- | -------------------------- |
| POST   | `/{id}/upload-image`          | cookie_auth | Upload job photos          |
| POST   | `/{id}/mark-complete`         | cookie_auth | Worker marks complete      |
| POST   | `/{id}/approve-completion`    | cookie_auth | Client approves completion |
| POST   | `/{id}/upload-cash-proof`     | cookie_auth | Upload cash payment proof  |
| POST   | `/{id}/confirm-final-payment` | cookie_auth | Confirm final payment      |

### Reviews

| Method | Path                 | Auth        | Purpose           |
| ------ | -------------------- | ----------- | ----------------- |
| POST   | `/{id}/review`       | cookie_auth | Submit job review |
| GET    | `/{id}/has-reviewed` | cookie_auth | Check if reviewed |

### Direct Hire (INVITE Jobs)

| Method | Path              | Auth        | Purpose                |
| ------ | ----------------- | ----------- | ---------------------- |
| POST   | `/create-invite`  | cookie_auth | Create direct hire job |
| GET    | `/my-invite-jobs` | cookie_auth | Get invite-type jobs   |

---

## 💬 4. Profiles API (`/api/profiles/`)

**File**: `apps/backend/src/profiles/api.py`  
**Auth**: All use `cookie_auth`

### Worker Products/Materials

| Method | Path                     | Purpose                 |
| ------ | ------------------------ | ----------------------- |
| GET    | `/profile/products/`     | List worker's materials |
| POST   | `/profile/products/add`  | Add material            |
| DELETE | `/profile/products/{id}` | Delete material         |

### Profile Image

| Method | Path                    | Purpose       |
| ------ | ----------------------- | ------------- |
| POST   | `/upload/profile-image` | Upload avatar |

### Wallet Operations

| Method | Path                            | Purpose                |
| ------ | ------------------------------- | ---------------------- |
| GET    | `/wallet/balance`               | Get balance            |
| POST   | `/wallet/deposit`               | Deposit funds          |
| POST   | `/wallet/withdraw`              | Withdraw funds         |
| GET    | `/wallet/transactions`          | Transaction history    |
| POST   | `/wallet/webhook`               | Xendit webhook         |
| POST   | `/wallet/simulate-payment/{id}` | Simulate payment (dev) |
| GET    | `/wallet/payment-status/{id}`   | Payment status         |

### Chat/Messaging

| Method | Path                                      | Purpose                        |
| ------ | ----------------------------------------- | ------------------------------ |
| GET    | `/chat/conversations`                     | List conversations             |
| GET    | `/chat/conversations/{id}`                | Get conversation messages      |
| POST   | `/chat/messages`                          | Send message                   |
| POST   | `/chat/messages/mark-read`                | Mark messages as read          |
| GET    | `/chat/unread-count`                      | Get unread message count       |
| POST   | `/chat/conversations/{id}/toggle-archive` | Archive/unarchive conversation |
| POST   | `/chat/{id}/upload-image`                 | Upload message image           |

---

## 🏢 5. Agency API (`/api/agency/`)

**File**: `apps/backend/src/agency/api.py`  
**Auth**: All use `cookie_auth`

### KYC

| Method | Path      | Purpose           |
| ------ | --------- | ----------------- |
| POST   | `/upload` | Upload agency KYC |
| GET    | `/status` | Get KYC status    |

### Employee Management

| Method | Path                          | Purpose                   |
| ------ | ----------------------------- | ------------------------- |
| GET    | `/employees`                  | List employees            |
| POST   | `/employees`                  | Add employee              |
| DELETE | `/employees/{id}`             | Remove employee           |
| PUT    | `/employees/{id}/rating`      | Update employee rating    |
| POST   | `/employees/{id}/set-eotm`    | Set Employee of the Month |
| GET    | `/employees/{id}/performance` | Get performance stats     |
| GET    | `/employees/leaderboard`      | Employee leaderboard      |

### Profile & Jobs

| Method | Path                | Purpose                 |
| ------ | ------------------- | ----------------------- |
| GET    | `/profile`          | Get agency profile      |
| POST   | `/profile/update`   | Update profile (legacy) |
| PUT    | `/profile`          | Update profile          |
| GET    | `/jobs`             | List agency jobs        |
| POST   | `/jobs/{id}/accept` | Accept INVITE job       |
| POST   | `/jobs/{id}/reject` | Reject INVITE job       |

---

## 👤 6. Client API (`/api/client/`)

**File**: `apps/backend/src/client/api.py`  
**Auth**: All use `cookie_auth`

| Method | Path                     | Purpose            |
| ------ | ------------------------ | ------------------ |
| GET    | `/agencies/browse`       | Browse agencies    |
| GET    | `/agencies/search`       | Search agencies    |
| GET    | `/agencies/{id}`         | Get agency profile |
| GET    | `/agencies/{id}/reviews` | Get agency reviews |

---

## 🛡️ 7. Admin Panel API (`/api/adminpanel/`)

**File**: `apps/backend/src/adminpanel/api.py`  
**Auth**: None (admin authentication separate)

### Dashboard

| Method | Path               | Purpose              |
| ------ | ------------------ | -------------------- |
| GET    | `/dashboard/stats` | Dashboard statistics |

### KYC Management

| Method | Path                  | Purpose                 |
| ------ | --------------------- | ----------------------- |
| GET    | `/kyc/all`            | Get all KYC submissions |
| POST   | `/kyc/review`         | Start KYC review        |
| POST   | `/kyc/approve`        | Approve individual KYC  |
| POST   | `/kyc/approve-agency` | Approve agency KYC      |
| POST   | `/kyc/reject`         | Reject individual KYC   |
| POST   | `/kyc/reject-agency`  | Reject agency KYC       |
| POST   | `/kyc/create-agency`  | Create agency from KYC  |
| GET    | `/kyc/logs`           | Get KYC review logs     |

### User Management

| Method | Path                   | Purpose        |
| ------ | ---------------------- | -------------- |
| GET    | `/users/clients`       | List clients   |
| GET    | `/users/clients/{id}`  | Client details |
| GET    | `/users/workers`       | List workers   |
| GET    | `/users/workers/{id}`  | Worker details |
| GET    | `/users/agencies`      | List agencies  |
| GET    | `/users/agencies/{id}` | Agency details |

### Job Management

| Method | Path                    | Purpose            |
| ------ | ----------------------- | ------------------ |
| GET    | `/jobs/dashboard-stats` | Job statistics     |
| GET    | `/jobs/listings`        | All job listings   |
| GET    | `/jobs/applications`    | All applications   |
| GET    | `/jobs/categories`      | Job categories     |
| GET    | `/jobs/disputes/stats`  | Dispute statistics |
| GET    | `/jobs/disputes`        | All disputes       |

### Review Management

| Method | Path               | Purpose           |
| ------ | ------------------ | ----------------- |
| GET    | `/reviews/stats`   | Review statistics |
| GET    | `/reviews/all`     | All reviews       |
| GET    | `/reviews/by-job`  | Reviews by job    |
| GET    | `/reviews/flagged` | Flagged reviews   |

---

## 🔑 Authentication Methods

### `cookie_auth`

- **Location**: `apps/backend/src/accounts/authentication.py`
- **Type**: JWT in HttpOnly cookies
- **Usage**: Web app endpoints
- **Token Storage**: Browser cookies
- **Refresh**: Automatic via `/api/accounts/refresh`

### `jwt_auth`

- **Location**: `apps/backend/src/accounts/authentication.py`
- **Type**: JWT Bearer token
- **Usage**: Mobile app endpoints
- **Token Storage**: AsyncStorage (React Native)
- **Refresh**: Manual via `/api/mobile/auth/refresh`

### `dual_auth`

- **Location**: `apps/backend/src/accounts/authentication.py`
- **Type**: Accepts both cookie and Bearer token
- **Usage**: Endpoints shared by web and mobile
- **Example**: Notifications, unread counts

---

## 📊 Endpoint Usage Patterns

### High-Traffic Endpoints

- `/api/mobile/auth/profile` - Every app launch
- `/api/mobile/jobs/list` - Job browsing
- `/api/accounts/notifications` - Real-time updates
- `/api/profiles/chat/conversations` - Messaging
- `/api/wallet/balance` - Frequent balance checks

### Critical Payment Endpoints

- `/api/jobs/create` - Job creation with escrow
- `/api/wallet/deposit` - Xendit integration
- `/api/wallet/webhook` - Payment callbacks
- `/api/jobs/{id}/confirm-final-payment` - Final payment release

### Admin-Only Endpoints

- `/api/adminpanel/kyc/*` - KYC verification
- `/api/adminpanel/users/*` - User management
- `/api/adminpanel/jobs/*` - Job moderation

---

**Last Updated**: November 20, 2025  
**Total Endpoints Documented**: 140+  
**Status**: ✅ Complete inventory
