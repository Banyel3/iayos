# iAyos API Authorization Matrix

**Quick Reference for QA Testing**

This matrix maps all API endpoints to their authentication requirements and allowed roles.

---

## Authentication Types

| Type          | Token Location                  | Platforms   | Usage                        |
| ------------- | ------------------------------- | ----------- | ---------------------------- |
| `jwt_auth`    | `Authorization: Bearer <token>` | Mobile Only | Mobile app endpoints         |
| `cookie_auth` | Session Cookie                  | Web Only    | Web dashboard/admin/agency   |
| `dual_auth`   | JWT OR Cookie                   | Both        | Shared endpoints (KYC, Chat) |
| `None`        | No auth required                | All         | Webhooks, public endpoints   |

---

## Accounts API (`/api/accounts/*`)

| Endpoint                         | Method | Auth          | Mobile | Web | Roles          |
| -------------------------------- | ------ | ------------- | ------ | --- | -------------- |
| `/logout`                        | POST   | `cookie_auth` | ❌     | ✅  | All            |
| `/refresh`                       | POST   | `cookie_auth` | ❌     | ✅  | All            |
| `/me`                            | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/profile/metrics`               | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/upload/kyc`                    | POST   | `dual_auth`   | ✅     | ✅  | WORKER, CLIENT |
| `/kyc/validate-document`         | POST   | `dual_auth`   | ✅     | ✅  | WORKER, CLIENT |
| `/kyc/history`                   | GET    | `dual_auth`   | ✅     | ✅  | All            |
| `/kyc-status`                    | GET    | `dual_auth`   | ✅     | ✅  | All            |
| `/kyc/autofill`                  | GET    | `dual_auth`   | ✅     | ✅  | WORKER, CLIENT |
| `/kyc/confirm`                   | POST   | `dual_auth`   | ✅     | ✅  | WORKER, CLIENT |
| `/kyc/comparison`                | GET    | `dual_auth`   | ✅     | ✅  | WORKER, CLIENT |
| `/notifications`                 | GET    | `dual_auth`   | ✅     | ✅  | All            |
| `/notifications/{id}/mark-read`  | POST   | `dual_auth`   | ✅     | ✅  | All            |
| `/notifications/mark-all-read`   | POST   | `dual_auth`   | ✅     | ✅  | All            |
| `/notifications/unread-count`    | GET    | `dual_auth`   | ✅     | ✅  | All            |
| `/register-push-token`           | POST   | `dual_auth`   | ✅     | ✅  | All            |
| `/notification-settings`         | GET    | `dual_auth`   | ✅     | ✅  | All            |
| `/notification-settings`         | PUT    | `dual_auth`   | ✅     | ✅  | All            |
| `/notifications/{id}/delete`     | DELETE | `dual_auth`   | ✅     | ✅  | All            |
| `/workers/availability`          | PATCH  | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/workers/availability`          | GET    | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/location/update`               | POST   | `dual_auth`   | ✅     | ✅  | All            |
| `/location/me`                   | GET    | `dual_auth`   | ✅     | ✅  | All            |
| `/location/toggle-sharing`       | POST   | `dual_auth`   | ✅     | ✅  | All            |
| `/upload/profile-image`          | POST   | `cookie_auth` | ❌     | ✅  | All            |
| `/wallet/balance`                | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/wallet/deposit`                | POST   | `cookie_auth` | ❌     | ✅  | CLIENT         |
| `/wallet/withdraw`               | POST   | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/wallet/transactions`           | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/wallet/webhook`                | POST   | `None`        | ✅     | ✅  | Webhook        |
| `/wallet/disbursement-webhook`   | POST   | `None`        | ✅     | ✅  | Webhook        |
| `/wallet/simulate-payment/{id}`  | POST   | `cookie_auth` | ❌     | ✅  | All (Dev)      |
| `/wallet/payment-status/{id}`    | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/worker/profile`                | POST   | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/worker/profile-completion`     | GET    | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/worker/certifications`         | POST   | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/worker/certifications`         | GET    | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/worker/certifications/{id}`    | PUT    | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/worker/certifications/{id}`    | DELETE | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/worker/materials`              | POST   | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/worker/materials`              | GET    | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/worker/materials/{id}`         | PUT    | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/worker/materials/{id}`         | DELETE | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/worker/portfolio`              | POST   | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/worker/portfolio`              | GET    | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/worker/portfolio/{id}/caption` | PUT    | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/worker/portfolio/reorder`      | PUT    | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/worker/portfolio/{id}`         | DELETE | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/reviews/submit`                | POST   | `dual_auth`   | ✅     | ✅  | All            |
| `/reviews/my-reviews`            | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/reviews/{id}`                  | PUT    | `cookie_auth` | ❌     | ✅  | All            |
| `/reviews/{id}/report`           | POST   | `cookie_auth` | ❌     | ✅  | All            |

---

## Jobs API (`/api/jobs/*`)

| Endpoint                                      | Method | Auth          | Mobile | Web | Roles          |
| --------------------------------------------- | ------ | ------------- | ------ | --- | -------------- |
| `/create`                                     | POST   | `jwt_auth`    | ✅     | ❌  | CLIENT         |
| `/create-mobile`                              | POST   | `jwt_auth`    | ✅     | ❌  | CLIENT         |
| `/my-jobs`                                    | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/available`                                  | GET    | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/in-progress`                                | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/completed`                                  | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/my-applications`                            | GET    | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/{job_id}`                                   | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/{job_id}/cancel`                            | PATCH  | `cookie_auth` | ❌     | ✅  | CLIENT (owner) |
| `/{job_id}/applications`                      | GET    | `cookie_auth` | ❌     | ✅  | CLIENT (owner) |
| `/{job_id}/apply`                             | POST   | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/{job_id}/applications/{app_id}/accept`      | POST   | `cookie_auth` | ❌     | ✅  | CLIENT (owner) |
| `/{job_id}/applications/{app_id}/reject`      | POST   | `cookie_auth` | ❌     | ✅  | CLIENT (owner) |
| `/{job_id}/reject-invite`                     | POST   | `dual_auth`   | ✅     | ✅  | WORKER, AGENCY |
| `/{job_id}/accept-invite`                     | POST   | `dual_auth`   | ✅     | ✅  | WORKER, AGENCY |
| `/{job_id}/upload-image`                      | POST   | `cookie_auth` | ❌     | ✅  | WORKER         |
| `/{job_id}/confirm-work-started`              | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/{job_id}/mark-complete`                     | POST   | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/{job_id}/approve-completion`                | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/{job_id}/upload-cash-proof`                 | POST   | `cookie_auth` | ❌     | ✅  | CLIENT         |
| `/{job_id}/review`                            | POST   | `dual_auth`   | ✅     | ✅  | All            |
| `/{job_id}/has-reviewed`                      | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/{job_id}/confirm-final-payment`             | POST   | `cookie_auth` | ❌     | ✅  | CLIENT         |
| `/create-invite`                              | POST   | `cookie_auth` | ❌     | ✅  | CLIENT         |
| `/my-invite-jobs`                             | GET    | `cookie_auth` | ❌     | ✅  | All            |
| `/{job_id}/request-backjob`                   | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/my-backjobs`                                | GET    | `jwt_auth`    | ✅     | ❌  | WORKER         |
| `/{job_id}/backjob-status`                    | GET    | `dual_auth`   | ✅     | ✅  | All            |
| `/{job_id}/backjob/confirm-started`           | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/{job_id}/backjob/mark-complete`             | POST   | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/{job_id}/backjob/approve-completion`        | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/{job_id}/complete-backjob`                  | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/team/create`                                | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/team/{job_id}`                              | GET    | `dual_auth`   | ✅     | ✅  | All            |
| `/team/{job_id}/apply`                        | POST   | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/team/{job_id}/applications/{app_id}/accept` | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/team/{job_id}/applications/{app_id}/reject` | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/team/{job_id}/start`                        | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/team/assignments/{id}/complete`             | POST   | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/team/{job_id}/applications`                 | GET    | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/{job_id}/team/confirm-arrival/{id}`         | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/{job_id}/team/approve-completion`           | POST   | `dual_auth`   | ✅     | ✅  | CLIENT         |
| `/{job_id}/team/worker-complete/{id}`         | POST   | `dual_auth`   | ✅     | ✅  | WORKER         |
| `/{job_id}/receipt`                           | GET    | `dual_auth`   | ✅     | ✅  | All            |

---

## Agency API (`/api/agency/*`)

| Endpoint                        | Method | Auth          | Mobile | Web | Roles  |
| ------------------------------- | ------ | ------------- | ------ | --- | ------ |
| `/upload`                       | POST   | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/status`                       | GET    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/employees`                    | GET    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/employees`                    | POST   | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/employees/{id}`               | DELETE | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/profile`                      | GET    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/profile/update`               | POST   | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/profile`                      | PUT    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/jobs`                         | GET    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/jobs/{id}`                    | GET    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/jobs/{id}/accept`             | POST   | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/jobs/{id}/reject`             | POST   | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/employees/{id}/rating`        | PUT    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/employees/{id}/set-eotm`      | POST   | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/employees/{id}/performance`   | GET    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/employees/leaderboard`        | GET    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/jobs/{id}/assign-employee`    | POST   | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/jobs/{id}/unassign-employee`  | POST   | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/employees/{id}/workload`      | GET    | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/jobs/{id}/assign-employees`   | POST   | `cookie_auth` | ❌     | ✅  | AGENCY |
| `/jobs/{id}/employees/{emp_id}` | DELETE | `cookie_auth` | ❌     | ✅  | AGENCY |

---

## Admin API (`/api/adminpanel/*`)

| Endpoint                                   | Method | Auth          | Mobile | Web | Roles |
| ------------------------------------------ | ------ | ------------- | ------ | --- | ----- |
| `/agency-kyc`                              | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/agency-kyc/{id}/review`                  | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/jobs/listings/{id}`                      | DELETE | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/jobs/{id}/invoice`                       | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/jobs/disputes/{id}/approve-backjob`      | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/jobs/disputes/{id}/reject-backjob`       | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/users/{id}/suspend`                      | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/users/{id}/ban`                          | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/users/{id}/activate`                     | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/users/{id}/delete`                       | DELETE | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/users/{id}/status`                       | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/all`                        | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/statistics`                 | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/{id}/detail`                | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/{id}/release-escrow`        | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/{id}/refund`                | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/escrow`                     | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/escrow/statistics`          | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/escrow/bulk-release`        | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/worker-earnings`            | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/worker-earnings/statistics` | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/payout`                     | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/disputes`                   | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/disputes/statistics`        | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/disputes/{id}`              | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/disputes/{id}/resolve`      | POST   | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/revenue-trends`             | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/payment-methods-breakdown`  | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/transactions/top-performers`             | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/settings/audit-logs`                     | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/settings/audit-logs/{id}`                | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/settings/audit-logs/export`              | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/settings/audit-logs/statistics`          | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |
| `/settings/audit-logs/admin/{id}/activity` | GET    | `cookie_auth` | ❌     | ✅  | ADMIN |

---

## Chat/Profiles API (`/api/profiles/*`)

| Endpoint                                  | Method | Auth          | Mobile | Web | Roles   |
| ----------------------------------------- | ------ | ------------- | ------ | --- | ------- |
| `/profile/products/`                      | GET    | `cookie_auth` | ❌     | ✅  | WORKER  |
| `/profile/products/{id}`                  | DELETE | `cookie_auth` | ❌     | ✅  | WORKER  |
| `/profile/products/add`                   | POST   | `cookie_auth` | ❌     | ✅  | WORKER  |
| `/upload/profile-image`                   | POST   | `cookie_auth` | ❌     | ✅  | All     |
| `/wallet/balance`                         | GET    | `cookie_auth` | ❌     | ✅  | All     |
| `/wallet/deposit`                         | POST   | `cookie_auth` | ❌     | ✅  | CLIENT  |
| `/wallet/withdraw`                        | POST   | `cookie_auth` | ❌     | ✅  | WORKER  |
| `/wallet/transactions`                    | GET    | `cookie_auth` | ❌     | ✅  | All     |
| `/wallet/webhook`                         | POST   | `None`        | ✅     | ✅  | Webhook |
| `/wallet/simulate-payment/{id}`           | POST   | `cookie_auth` | ❌     | ✅  | Dev     |
| `/wallet/payment-status/{id}`             | GET    | `cookie_auth` | ❌     | ✅  | All     |
| `/chat/conversations`                     | GET    | `dual_auth`   | ✅     | ✅  | All     |
| `/chat/conversation-by-job/{id}`          | GET    | `dual_auth`   | ✅     | ✅  | All     |
| `/chat/conversations/{id}`                | GET    | `dual_auth`   | ✅     | ✅  | All     |
| `/chat/messages`                          | POST   | `dual_auth`   | ✅     | ✅  | All     |
| `/chat/messages/mark-read`                | POST   | `dual_auth`   | ✅     | ✅  | All     |
| `/chat/unread-count`                      | GET    | `dual_auth`   | ✅     | ✅  | All     |
| `/chat/conversations/{id}/toggle-archive` | POST   | `dual_auth`   | ✅     | ✅  | All     |
| `/chat/{id}/upload-image`                 | POST   | `dual_auth`   | ✅     | ✅  | All     |

---

## Client API (`/api/client/*`)

| Endpoint                 | Method | Auth          | Mobile | Web | Roles  |
| ------------------------ | ------ | ------------- | ------ | --- | ------ |
| `/agencies/browse`       | GET    | `cookie_auth` | ❌     | ✅  | CLIENT |
| `/agencies/search`       | GET    | `cookie_auth` | ❌     | ✅  | CLIENT |
| `/agencies/{id}`         | GET    | `cookie_auth` | ❌     | ✅  | CLIENT |
| `/agencies/{id}/reviews` | GET    | `cookie_auth` | ❌     | ✅  | CLIENT |

---

## Mobile API (`/api/mobile/*`)

All Mobile API endpoints use `jwt_auth` unless otherwise specified.

| Endpoint                  | Method | Auth       | Roles              |
| ------------------------- | ------ | ---------- | ------------------ |
| `/auth/register`          | POST   | `None`     | Public             |
| `/auth/login`             | POST   | `None`     | Public             |
| `/auth/verify-email`      | POST   | `None`     | Public             |
| `/auth/forgot-password`   | POST   | `None`     | Public             |
| `/auth/reset-password`    | POST   | `None`     | Public             |
| `/auth/logout`            | POST   | `jwt_auth` | All                |
| `/auth/refresh`           | POST   | `jwt_auth` | All                |
| `/auth/me`                | GET    | `jwt_auth` | All                |
| `/profile/switch-profile` | POST   | `jwt_auth` | Dual Profile Users |
| `/jobs/list`              | GET    | `jwt_auth` | WORKER             |
| `/jobs/available`         | GET    | `jwt_auth` | WORKER             |
| `/jobs/{id}`              | GET    | `jwt_auth` | All                |
| `/jobs/{id}/apply`        | POST   | `jwt_auth` | WORKER             |
| `/jobs/my-jobs`           | GET    | `jwt_auth` | All                |
| `/workers/list`           | GET    | `jwt_auth` | CLIENT             |
| `/workers/{id}`           | GET    | `jwt_auth` | CLIENT             |

---

## Test Verification Checklist

For each endpoint in this matrix, verify:

1. ✅ **Auth Required**: Unauthenticated requests return 401
2. ✅ **Correct Auth Type**: Wrong auth type returns 401
3. ✅ **Role Required**: Wrong role returns 403
4. ✅ **Data Isolation**: Users only see their own data
5. ✅ **Input Validation**: Invalid inputs return 400 with descriptive error
6. ✅ **Response Format**: Matches documented schema

---

**Last Updated**: December 2025
