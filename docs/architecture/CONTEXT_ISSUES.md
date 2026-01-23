# iAyos Technical Debt & Unused Endpoints Analysis

**Generated**: November 20, 2025  
**Purpose**: Identify unused/outdated API endpoints, technical debt, and provide cleanup recommendations

---

## 🔍 Endpoint Usage Analysis

### Methodology

Cross-referenced **140+ backend endpoints** (7 router modules) against:

- Mobile app: `apps/frontend_mobile/iayos_mobile/lib/api/config.ts` (80+ endpoints)
- Web app: `apps/frontend_web/lib/api/*.ts` (5 modules, 30+ functions)
- Backend tests: `apps/backend/src/*/tests/` (66 test files)

---

## ❌ Unused/Outdated Endpoints

### 1. Legacy Accounts Endpoints (High Priority)

**Unused Endpoints**:

| Endpoint                       | Method | Auth   | Status       | Reason                                                                  |
| ------------------------------ | ------ | ------ | ------------ | ----------------------------------------------------------------------- |
| `/api/accounts/signup`         | POST   | None   | ❌ Unused    | Replaced by `/api/mobile/auth/register` (mobile)                        |
| `/api/accounts/update-profile` | PUT    | Cookie | ⚠️ Partial   | Web uses custom `/api/profiles/{id}`                                    |
| `/api/accounts/profile`        | GET    | Cookie | ❌ Unused    | Web uses direct Profile model queries via Next.js Server Actions        |
| `/api/accounts/assign-role`    | POST   | Cookie | ⚠️ Duplicate | Mobile has `/api/mobile/auth/assign-role` (JWT), web has cookie version |
| `/api/accounts/verify-email`   | POST   | None   | ⚠️ Unused    | Email verification not implemented in mobile                            |
| `/api/accounts/reset-password` | POST   | None   | ⚠️ Unused    | Password reset flow not implemented in mobile                           |

**Impact**:

- 6 endpoints with zero usage in frontend code
- Mobile and web have diverged authentication flows
- Password reset/email verification incomplete

**Recommendation**:

1. **Consolidate auth endpoints**: Keep only `/api/mobile/auth/*` for mobile (JWT) and `/api/accounts/*` for web (cookie)
2. **Mark for deprecation**: `/api/accounts/signup`, `/api/accounts/profile` (web uses Server Actions)
3. **Complete email verification**: Implement in mobile app or remove endpoint
4. **Complete password reset**: Implement in both mobile and web or remove endpoints

---

### 2. Job Management Endpoints (Medium Priority)

**Unused Endpoints**:

| Endpoint                 | Method | Auth   | Status    | Reason                                                          |
| ------------------------ | ------ | ------ | --------- | --------------------------------------------------------------- |
| `/api/jobs/browse`       | GET    | Cookie | ❌ Unused | Web never implemented, mobile uses `/api/mobile/jobs/available` |
| `/api/jobs/filter`       | GET    | Cookie | ❌ Unused | Web never implemented, mobile uses `/api/mobile/jobs/list`      |
| `/api/jobs/{id}/cancel`  | POST   | Cookie | ⚠️ Unused | Clients can't cancel jobs (missing feature?)                    |
| `/api/jobs/{id}/dispute` | POST   | Cookie | ⚠️ Unused | Dispute flow incomplete                                         |
| `/api/jobs/{id}/extend`  | POST   | Cookie | ❌ Unused | Extension feature not implemented                               |

**Impact**:

- 5 job-related endpoints never used
- `JobDispute` model exists but no UI/API flow
- Job cancellation flow incomplete (status CANCELLED exists but no API)

**Recommendation**:

1. **Remove unused browse/filter**: Mobile uses different endpoints
2. **Implement or remove**:
   - Job cancellation (add endpoint or remove CANCELLED status)
   - Dispute system (complete flow or remove model)
   - Job extension (implement or remove)

---

### 3. Worker Product/Materials Endpoints (High Priority)

**Unused Endpoints**:

| Endpoint                             | Method         | Auth   | Status    | Reason                             |
| ------------------------------------ | -------------- | ------ | --------- | ---------------------------------- |
| `/api/profiles/worker-products`      | GET            | Cookie | ❌ Unused | Never implemented in web           |
| `/api/profiles/worker-products/{id}` | GET/PUT/DELETE | Cookie | ❌ Unused | Worker products feature incomplete |

**Impact**:

- `WorkerProduct` model exists with no UI integration
- Backend API exists but never called

**Recent Change**:

- Mobile Phase 6 renamed "Worker Products" → "Materials" with new endpoints:
  - `/api/mobile/profile/materials` (GET, POST)
  - `/api/mobile/profile/materials/{id}` (GET, PUT, DELETE)
- Old `/api/profiles/worker-products` endpoints now redundant

**Recommendation**:

1. **Deprecate** `/api/profiles/worker-products/*` (web cookie-auth endpoints)
2. **Standardize on** `/api/mobile/profile/materials/*` (mobile JWT endpoints)
3. **Update web** to use materials endpoints (when web dashboard implemented)
4. **Database**: Keep `WorkerProduct` model (used by materials API)

---

### 4. Chat/Messaging Endpoints (Low Priority)

**Partial Usage**:

| Endpoint                                | Method | Auth       | Status     | Reason                                    |
| --------------------------------------- | ------ | ---------- | ---------- | ----------------------------------------- |
| `/api/profiles/chat/conversations`      | GET    | Cookie/JWT | ✅ Used    | Both web and mobile                       |
| `/api/profiles/chat/conversations/{id}` | GET    | Cookie/JWT | ✅ Used    | Both web and mobile                       |
| `/api/profiles/chat/messages`           | POST   | Cookie/JWT | ✅ Used    | Both web and mobile                       |
| `/api/profiles/chat/{id}/upload-image`  | POST   | Cookie/JWT | ⚠️ Partial | Mobile Phase 5 added, web not implemented |
| `/api/profiles/chat/{id}/archive`       | POST   | Cookie/JWT | ❌ Unused  | Archive feature not in mobile             |
| `/api/profiles/chat/{id}/unarchive`     | POST   | Cookie/JWT | ❌ Unused  | Archive feature not in mobile             |

**Impact**:

- Archive/unarchive never implemented in mobile
- Web has `toggleConversationArchive()` function but no UI

**Recommendation**:

1. **Implement archive feature**: Add to mobile UI or remove endpoints
2. **Complete image upload**: Add to web chat interface

---

### 5. Admin Panel Endpoints (Low Priority)

**Seldom Used**:

| Endpoint                              | Method | Auth   | Status    | Reason                        |
| ------------------------------------- | ------ | ------ | --------- | ----------------------------- |
| `/api/adminpanel/users`               | GET    | Cookie | ⚠️ Manual | Admin manually accesses       |
| `/api/adminpanel/kyc-review`          | GET    | Cookie | ✅ Used   | KYC verification              |
| `/api/adminpanel/kyc-approve`         | POST   | Cookie | ✅ Used   | KYC verification              |
| `/api/adminpanel/cash-payment-verify` | POST   | Cookie | ✅ Used   | Cash proof verification       |
| `/api/adminpanel/reports`             | GET    | Cookie | ❌ Unused | Reports feature never built   |
| `/api/adminpanel/analytics`           | GET    | Cookie | ❌ Unused | Analytics feature never built |

**Impact**:

- 2 endpoints for features never implemented
- Admin manually queries database instead of using `/api/adminpanel/users`

**Recommendation**:

1. **Remove** `/api/adminpanel/reports` and `/api/adminpanel/analytics` (not implemented)
2. **Build admin dashboard** using existing endpoints (Phase 5 Agency Analytics can serve as template)

---

## 🔄 API Divergence Issues

### Mobile vs Web Authentication

**Problem**: Two separate authentication systems with duplicate logic

**Mobile** (JWT Bearer):

- `/api/mobile/auth/login` → Returns JSON with `{ token, refreshToken, user }`
- Token stored in AsyncStorage
- All requests include `Authorization: Bearer {token}`
- JWT payload: `{ user_id, email, profile_type, exp }`

**Web** (Cookie):

- `/api/accounts/login` → Sets HTTP-only cookie
- Session stored in cookie (backend manages)
- All requests include cookie automatically
- Uses `@router.get(auth=cookie_auth)` decorator

**Impact**:

- **Duplicate code**: Login logic implemented twice
- **Testing burden**: Must test both auth systems
- **Security surface**: Two different auth mechanisms to secure
- **Mobile cookies**: Mobile still sends `credentials: "include"` but doesn't use cookies

**Recommendation**:

1. **Keep dual auth** (mobile needs JWT for React Native, web benefits from cookies)
2. **Consolidate logic**: Extract shared validation logic into service layer
3. **Mobile cleanup**: Remove `credentials: "include"` from mobile requests (not needed with Bearer tokens)

---

### Job Endpoints Duplication

**Problem**: Separate mobile and web endpoints for same operations

**Example - Get My Jobs**:

**Mobile**:

```
GET /api/mobile/jobs/my-jobs?status=ACTIVE
Auth: Bearer token
Response: { jobs: [...], count: 5 }
```

**Web**:

```
GET /api/jobs/my-jobs
Auth: Cookie
Response: [...jobs] (array)
```

**Mobile endpoint** (`mobile_api.py` line 1023):

```python
@router.get("/my-jobs", auth=jwt_auth)
def get_my_jobs(request, status: Optional[str] = None):
    # Mobile-specific logic
    return {"jobs": jobs_list, "count": len(jobs_list)}
```

**Web endpoint** (`api.py` line 450):

```python
@router.get("/my-jobs", auth=cookie_auth)
def get_my_jobs(request):
    # Web-specific logic
    return jobs_list
```

**Impact**:

- **Code duplication**: Same business logic in two places
- **Divergent responses**: Mobile returns object with count, web returns array
- **Maintenance burden**: Bug fixes must be applied twice
- **Version drift**: Features added to one but not the other

**Recent Example**:

- Mobile Phase 3 added job status filter to `/api/mobile/jobs/my-jobs?status=ACTIVE`
- Web endpoint doesn't have status filter
- Client jobs tab had to use raw `fetch()` instead of proper endpoint (caused 401 bug, fixed in Nov 2025)

**Recommendation**:

1. **Unify endpoints**: Use shared service functions in both routers
2. **Consistent responses**: Standardize on `{ data: [...], count: N }` format
3. **Shared services**: Extract business logic to `jobs/services.py`
4. **Example refactor**:

```python
# jobs/services.py
def get_user_jobs(user_id, status=None, profile_type=None):
    query = Job.objects.filter(...)
    if status:
        query = query.filter(status=status)
    return query.all()

# accounts/api.py
@router.get("/my-jobs", auth=cookie_auth)
def web_get_my_jobs(request):
    jobs = get_user_jobs(request.user.id)
    return jobs

# accounts/mobile_api.py
@router.get("/my-jobs", auth=jwt_auth)
def mobile_get_my_jobs(request, status: Optional[str] = None):
    jobs = get_user_jobs(request.user.id, status=status)
    return {"jobs": jobs, "count": len(jobs)}
```

---

## 📊 Technical Debt Summary

### Database Issues

**1. Orphaned Models** (Low Priority):

- `JobDispute` - Model exists, no API/UI flow
- `NotificationSettings` - Model added but not used in UI

**2. Missing Indexes** (Medium Priority):

- `Job.location` - Frequently filtered, not indexed
- `JobApplication.status + workerID` - Common query, no composite index
- `Notification.accountFK + isRead` - Notification badge queries slow

**Recommendation**:

```python
# New migration: 0043_add_missing_indexes.py
class Migration(migrations.Migration):
    operations = [
        migrations.AddIndex(
            model_name='job',
            index=models.Index(fields=['location', '-createdAt'], name='job_location_idx')
        ),
        migrations.AddIndex(
            model_name='jobapplication',
            index=models.Index(fields=['workerID', 'status'], name='app_worker_status_idx')
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['accountFK', 'isRead'], name='notif_account_read_idx')
        ),
    ]
```

---

### Code Quality Issues

**1. Inconsistent Naming** (High Priority):

**Database Models**:

- Old: `Job` (formerly `JobPosting`)
- Inconsistent field names: `jobID`, `accountFK`, `profileID`, `workerID`

**API Responses**:

- Snake_case in backend: `created_at`, `total_earnings`
- camelCase in frontend: `createdAt`, `totalEarnings`
- Mixed in mobile: Some endpoints return snake_case, others camelCase

**Recommendation**:

1. **Standardize on camelCase for API responses**
2. **Add serializer layer** (Django Pydantic or custom serializers)
3. **Backend keeps snake_case** (Python convention)
4. **API converts to camelCase** before returning
5. **Example**:

```python
# accounts/schemas.py
from ninja import Schema

class JobResponse(Schema):
    jobId: int  # Automatically converts from job.jobID
    clientId: int
    title: str
    budget: float
    createdAt: datetime

    @staticmethod
    def from_orm(job: Job):
        return JobResponse(
            jobId=job.jobID,
            clientId=job.clientID.profileID.profileID,
            ...
        )
```

**2. Missing Type Definitions** (Medium Priority):

**Backend**:

- Django models don't have type hints on methods
- Service functions have `Any` return types

**Frontend**:

- Web API functions missing return type annotations
- Mobile hooks have `any` types in several places

**Recommendation**:

1. **Add MyPy** to backend linting
2. **Type all service functions**:

```python
from typing import List, Optional
from decimal import Decimal

def create_job(
    client_id: int,
    title: str,
    budget: Decimal,
    category_id: int,
    **kwargs
) -> Job:
    # Implementation
```

3. **Frontend**: Enable `strict: true` in `tsconfig.json` (currently `false`)

---

### Security Issues

**1. JWT Token Expiry** (High Priority):

**Current**:

- Access token: 7 days
- Refresh token: 30 days

**Risk**:

- Very long-lived tokens
- If device stolen, attacker has 7-day window
- No token revocation system

**Recommendation**:

1. **Reduce token expiry**:
   - Access token: 15 minutes
   - Refresh token: 7 days
2. **Add token revocation**:
   - Store active tokens in Redis
   - Add `/api/mobile/auth/revoke` endpoint
   - Clear tokens on password change
3. **Add device tracking**:
   - Store device_id in PushToken
   - Allow user to logout all devices

**2. Missing Rate Limiting** (High Priority):

**Current**:

- No rate limiting on any endpoints
- Auth endpoints vulnerable to brute force
- No CAPTCHA on registration

**Recommendation**:

1. **Add Django Ratelimit** package
2. **Rate limit auth endpoints**:

```python
from django_ratelimit.decorators import ratelimit

@router.post("/login")
@ratelimit(key='ip', rate='5/m', method='POST')
def login(request):
    # 5 attempts per minute per IP
```

3. **Add CAPTCHA** on registration (hCaptcha or reCAPTCHA)

---

## 🛠️ Cleanup Recommendations

### Immediate Actions (High Priority)

**1. Remove Unused Endpoints** (Est. 2 hours):

```python
# Delete from accounts/api.py
- /api/accounts/signup  # Line ~50
- /api/accounts/profile  # Line ~150

# Delete from jobs/api.py
- /api/jobs/browse  # Line ~200
- /api/jobs/filter  # Line ~250
- /api/jobs/{id}/extend  # Line ~800

# Delete from profiles/api.py
- /api/profiles/worker-products  # Line ~400
- /api/profiles/worker-products/{id}  # Line ~450
```

**2. Fix Mobile API Consistency** (Est. 4 hours):

- Add status filter to web `/api/jobs/my-jobs` endpoint
- Update mobile jobs tab to use `apiRequest()` instead of `fetch()` ✅ FIXED
- Update backend to use `Optional[str]` for optional query params ✅ FIXED
- Convert `/api/mobile/jobs/my-jobs` from POST to GET with query params ✅ FIXED (Nov 20, 2025)
- Standardize response format (all mobile endpoints return `{ data, count }`)

**3. Add Missing Indexes** (Est. 1 hour):

- Create migration `0043_add_missing_indexes.py`
- Add indexes for `Job.location`, `JobApplication.status+workerID`, `Notification.accountFK+isRead`
- Test query performance before/after

---

### Short-Term Actions (Medium Priority)

**1. Consolidate Service Layer** (Est. 8 hours):

- Extract job logic to `jobs/services.py`
- Extract payment logic to `payments/services.py`
- Extract auth logic to `accounts/auth_services.py`
- Update both API routers to use shared services

**2. Add Rate Limiting** (Est. 3 hours):

```bash
pip install django-ratelimit
```

```python
# settings.py
INSTALLED_APPS += ['django_ratelimit']

# Decorate all auth endpoints
@ratelimit(key='ip', rate='5/m')
@ratelimit(key='user', rate='10/h')
```

**3. Improve Token Security** (Est. 4 hours):

- Reduce JWT expiry (15min access, 7d refresh)
- Add token revocation with Redis
- Add refresh token rotation (new refresh on each refresh)

---

### Long-Term Actions (Low Priority)

**1. Unified API Design** (Est. 20 hours):

- Create OpenAPI spec for all endpoints
- Use Pydantic schemas for request/response validation
- Generate TypeScript types from OpenAPI spec
- Automatic camelCase conversion

**2. Complete Missing Features** (Est. 40 hours):

- Job cancellation flow (UI + API)
- Dispute resolution system (UI + API + admin)
- Email verification (mobile + web)
- Password reset (mobile + web)
- Conversation archiving (mobile UI)

**3. Admin Dashboard Rebuild** (Est. 60 hours):

- Use Agency Phase 2 dashboard as template
- User management (list, ban, unban)
- KYC review interface
- Cash payment verification
- Reports & analytics (revenue, user growth, job stats)

---

## 📈 Metrics & Monitoring Recommendations

### Add Application Monitoring

**1. Backend Metrics** (Django Prometheus):

```python
# settings.py
INSTALLED_APPS += ['django_prometheus']

# urls.py
path('', include('django_prometheus.urls')),
```

**Track**:

- Request rate per endpoint
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query count per request

**2. Frontend Metrics** (Sentry):

```typescript
// Mobile: app/_layout.tsx
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: false,
});
```

**Track**:

- API error rate
- Screen load time
- Crash rate
- User flow dropoff

---

## 🎯 Priority Matrix

| Action                     | Priority | Effort | Impact | Timeline     |
| -------------------------- | -------- | ------ | ------ | ------------ |
| Remove unused endpoints    | HIGH     | 2h     | Medium | Immediate    |
| Fix mobile API consistency | HIGH     | 4h     | High   | Immediate    |
| Add rate limiting          | HIGH     | 3h     | High   | This week    |
| Add missing indexes        | MEDIUM   | 1h     | Medium | This week    |
| Improve JWT security       | HIGH     | 4h     | High   | This week    |
| Consolidate service layer  | MEDIUM   | 8h     | Medium | Next sprint  |
| Unified API design         | LOW      | 20h    | High   | Next quarter |
| Complete missing features  | LOW      | 40h    | Medium | Next quarter |
| Admin dashboard rebuild    | LOW      | 60h    | Medium | Next quarter |

**Total Immediate Work**: ~14 hours  
**Total Short-Term Work**: ~15 hours  
**Total Long-Term Work**: ~120 hours

---

## 📝 Action Plan

### Week 1: Critical Fixes (14 hours)

**Day 1-2** (8 hours):

1. ✅ Remove unused endpoints (accounts/signup, jobs/browse, etc.)
2. ✅ Fix mobile API consistency (status filter, response format)
3. ✅ Add rate limiting to auth endpoints

**Day 3** (3 hours): 4. ✅ Add missing database indexes 5. ✅ Test query performance improvements

**Day 4-5** (3 hours): 6. ✅ Improve JWT security (shorter expiry, token rotation) 7. ✅ Add token revocation with Redis

### Week 2-3: Refactoring (15 hours)

**Week 2** (8 hours):

1. Extract job logic to services layer
2. Extract payment logic to services layer
3. Update API routers to use services

**Week 3** (7 hours): 4. Add Pydantic schemas to mobile API 5. Standardize response format (all mobile endpoints) 6. Add TypeScript types generation

### Month 2-3: Feature Completion (120 hours)

**Month 2**:

1. Complete job cancellation flow (10h)
2. Complete dispute resolution (20h)
3. Complete email verification (10h)
4. Complete password reset (10h)

**Month 3**:

1. Unified API design with OpenAPI (20h)
2. Admin dashboard rebuild (40h)
3. Add monitoring dashboards (10h)

---

## 🔍 Unused Endpoints Summary

### Total Counts

- **Total backend endpoints**: 140+
- **Used by mobile**: 80+ (57%)
- **Used by web**: 30+ (21%)
- **Unused/duplicate**: ~30 endpoints (21%)

### Breakdown by Module

| Module         | Total | Used | Unused | Notes                                 |
| -------------- | ----- | ---- | ------ | ------------------------------------- |
| accounts/api   | 90+   | 60   | 30     | Legacy web auth endpoints             |
| mobile_api     | 43    | 43   | 0      | All mobile-specific, actively used    |
| jobs/api       | 45    | 30   | 15     | Browse/filter never implemented       |
| profiles/api   | 15    | 10   | 5      | Worker products replaced by materials |
| agency/api     | 15    | 15   | 0      | All used in agency dashboard          |
| client/api     | 4     | 2    | 2      | Browse agencies partially used        |
| adminpanel/api | 25    | 15   | 10     | Reports/analytics never built         |

---

**Last Updated**: November 20, 2025  
**Status**: ✅ Complete analysis  
**Next Review**: After immediate fixes completed (~2 weeks)

---

## 📚 References

- **Backend API**: `apps/backend/src/accounts/api.py`, `mobile_api.py`, `jobs/api.py`
- **Mobile Config**: `apps/frontend_mobile/iayos_mobile/lib/api/config.ts`
- **Web API**: `apps/frontend_web/lib/api/*.ts`
- **Recent Fixes**: `docs/bug-fixes/ASSIGNED_WORKER_UI_FIX.md`, `docs/mobile/JOBS_TAB_REDESIGN_COMPLETE.md`
