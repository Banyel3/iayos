# PRD Implementation: Mobile-Only Enforcement + KYC Auto-Fill

## Overview

This document describes the implementation of the Product Requirements Document (PRD) for:

1. **Enforcing mobile-only usage** for workers and clients
2. **KYC auto-fill system** using AI/OCR extracted data
3. **Web access control** based on user roles

## Implementation Status

### ✅ Completed

#### 1. Backend Role Permission Utilities

**File:** `apps/backend/src/accounts/authentication.py`

Added comprehensive role-checking utilities:

- `ProfileType`, `AccountType`, `AdminRole` constants
- `get_user_profile()` - Fetches profile with caching
- `is_worker()`, `is_client()`, `is_agency()`, `is_admin()` - Role checks
- `require_profile_type()` - Decorator for profile type enforcement
- `require_agency()` - Decorator for agency-only endpoints
- `require_admin()` - Decorator for admin-only endpoints
- `require_web_access()` - Decorator for web-only actions
- `can_access_web_dashboard()` - Check if user can access web UI
- Feature flags: `ENABLE_WORKER_WEB_UI`, `ENABLE_CLIENT_WEB_UI`

#### 2. KYC Extracted Data Model

**File:** `apps/backend/src/accounts/models.py`
**Migration:** `apps/backend/src/accounts/migrations/0076_kyc_extracted_data.py`

New `KYCExtractedData` model with:

- **Extracted fields:** full_name, first_name, middle_name, last_name, birth_date, address, id_number, id_type, expiry_date, nationality, sex
- **Confidence scores:** Per-field confidence (0-1) and overall confidence
- **Confirmed fields:** User-confirmed values (parallel to extracted)
- **Status tracking:** PENDING → EXTRACTED → CONFIRMED (or FAILED)
- **Methods:** `get_autofill_data()`, `get_comparison_data()`

#### 3. KYC Extraction Parser

**File:** `apps/backend/src/accounts/kyc_extraction_parser.py`

Parser for extracting structured data from OCR text:

- Supports Philippine government IDs (Passport, PhilSys, Driver's License, UMID, PhilHealth)
- Pattern-based extraction for dates, ID numbers, names, addresses
- Confidence scoring per extracted field
- Document type auto-detection

#### 4. KYC Extraction Service

**File:** `apps/backend/src/accounts/kyc_extraction_service.py`

Service functions:

- `process_kyc_extraction()` - Processes OCR text and populates model
- `get_kyc_autofill_data_for_user()` - Returns auto-fill data
- `trigger_kyc_extraction_after_upload()` - Called after KYC upload

#### 5. KYC Auto-Fill API Endpoints

**File:** `apps/backend/src/accounts/api.py`

New endpoints:

- `GET /api/accounts/kyc/autofill` - Get extracted fields for mobile auto-fill
- `POST /api/accounts/kyc/confirm` - Confirm/edit extracted data
- `GET /api/accounts/kyc/comparison` - Side-by-side comparison for admin

#### 6. KYC Upload Integration

**File:** `apps/backend/src/accounts/services.py`

Modified `upload_kyc_document()` to:

- Trigger extraction processing after successful upload
- Store structured data from OCR text

#### 7. Next.js Middleware for Role Enforcement

**File:** `apps/frontend_web/middleware.ts`

Middleware that:

- Decodes JWT from cookies
- Checks `profile_type`, `role`, `account_type`
- Redirects workers/clients to `/mobile-only`
- Allows admins and agencies full web access

#### 8. Mobile-Only Redirect Page

**File:** `apps/frontend_web/app/mobile-only/page.tsx`

User-friendly page that:

- Explains mobile-first design
- Shows feature comparison (mobile vs web)
- Provides app download CTAs
- Offers agency registration option

#### 9. Dashboard Layout with Role Guards

**File:** `apps/frontend_web/app/dashboard/layout.tsx`

Server-side role protection that:

- Redirects ADMIN to `/admin/dashboard`
- Redirects AGENCY to `/agency/dashboard`
- Redirects WORKER/CLIENT to `/mobile-only` (unless flags enabled)

#### 10. Test File

**File:** `tests/kyc_autofill_tests.http`

Comprehensive tests for new endpoints.

## Architecture

### Role-Based Access Flow

```
User Login
    │
    ▼
JWT Token Generated (includes profile_type, account_type, role)
    │
    ▼
Web Request to /dashboard/*
    │
    ├─── Middleware checks token ───┐
    │                               │
    │   ADMIN? ──────► Allow        │
    │   AGENCY? ─────► Allow        │
    │   WORKER? ─────► /mobile-only │
    │   CLIENT? ─────► /mobile-only │
    │                               │
    └───────────────────────────────┘
    │
    ▼
Layout.tsx (server-side double-check)
    │
    ▼
Page renders (if allowed)
```

### KYC Auto-Fill Flow

```
Mobile App: User uploads documents
    │
    ▼
Backend: upload_kyc_document()
    │
    ├── Files uploaded to Supabase
    ├── AI verification (face, quality)
    ├── OCR text extraction (Tesseract)
    │
    ▼
Backend: trigger_kyc_extraction_after_upload()
    │
    ├── Parse OCR text (kyc_extraction_parser.py)
    ├── Extract structured fields (name, DOB, address, etc.)
    ├── Calculate confidence scores
    └── Store in KYCExtractedData model
    │
    ▼
Mobile App: GET /api/accounts/kyc/autofill
    │
    ├── Receive extracted fields with confidence scores
    └── Pre-populate KYC form fields
    │
    ▼
Mobile App: User reviews/edits fields
    │
    ▼
Mobile App: POST /api/accounts/kyc/confirm
    │
    ├── Save confirmed values
    ├── Track edited fields
    └── Update status to CONFIRMED
    │
    ▼
Admin Panel: View extracted vs confirmed comparison
```

## Feature Flags

Located in:

- `apps/backend/src/accounts/authentication.py`
- `apps/frontend_web/middleware.ts`
- `apps/frontend_web/app/dashboard/layout.tsx`

```python
# Backend
ENABLE_WORKER_WEB_UI = False  # Set True to allow workers on web
ENABLE_CLIENT_WEB_UI = False  # Set True to allow clients on web
```

```typescript
// Frontend
const ENABLE_WORKER_WEB_UI = false;
const ENABLE_CLIENT_WEB_UI = false;
```

## API Reference

### GET /api/accounts/kyc/autofill

Get AI-extracted KYC data for mobile auto-fill.

**Response:**

```json
{
  "success": true,
  "has_extracted_data": true,
  "extraction_status": "EXTRACTED",
  "needs_confirmation": true,
  "extracted_at": "2025-01-01T12:00:00Z",
  "fields": {
    "full_name": "Juan Dela Cruz",
    "first_name": "Juan",
    "middle_name": "Santos",
    "last_name": "Dela Cruz",
    "birth_date": "1990-05-15",
    "address": "123 Main St, Zamboanga City",
    "id_number": "A1234567",
    "id_type": "PASSPORT",
    "nationality": "FILIPINO",
    "sex": "MALE",
    "confidence_scores": {
      "full_name": 0.85,
      "birth_date": 0.9,
      "address": 0.75,
      "id_number": 0.95,
      "overall": 0.82
    }
  }
}
```

### POST /api/accounts/kyc/confirm

Confirm or edit extracted data.

**Request:**

```json
{
  "full_name": "Juan Dela Cruz",
  "first_name": "Juan",
  "middle_name": "Santos",
  "last_name": "Dela Cruz",
  "birth_date": "1990-05-15",
  "address": "123 Main St, Zamboanga City",
  "id_number": "A1234567"
}
```

**Response:**

```json
{
  "success": true,
  "extraction_status": "CONFIRMED",
  "edited_fields": ["address"],
  "confirmed_at": "2025-01-01T12:30:00Z"
}
```

### GET /api/accounts/kyc/comparison

Get side-by-side comparison for admin review.

**Response:**

```json
{
    "success": true,
    "comparison": {
        "extracted": {
            "full_name": "JUAN DELA CRUZ",
            "birth_date": "1990-05-15",
            "address": "123 MAIN ST ZAMBOANGA"
        },
        "confirmed": {
            "full_name": "Juan Dela Cruz",
            "birth_date": "1990-05-15",
            "address": "123 Main St, Zamboanga City"
        },
        "confidence_scores": {...}
    },
    "user_edited_fields": ["address"],
    "overall_confidence": 0.82
}
```

## Files Created/Modified

### Created

1. `apps/backend/src/accounts/migrations/0076_kyc_extracted_data.py`
2. `apps/backend/src/accounts/kyc_extraction_parser.py`
3. `apps/backend/src/accounts/kyc_extraction_service.py`
4. `apps/frontend_web/middleware.ts`
5. `apps/frontend_web/app/mobile-only/page.tsx`
6. `apps/frontend_web/app/dashboard/layout.tsx`
7. `tests/kyc_autofill_tests.http`
8. `docs/01-completed/PRD_MOBILE_ONLY_KYC_AUTOFILL_IMPLEMENTATION.md`

### Modified

1. `apps/backend/src/accounts/authentication.py` - Added role utilities
2. `apps/backend/src/accounts/models.py` - Added KYCExtractedData model
3. `apps/backend/src/accounts/api.py` - Added KYC auto-fill endpoints
4. `apps/backend/src/accounts/services.py` - Added extraction trigger

## Deployment Steps

1. **Apply migration:**

   ```bash
   docker exec iayos-backend-dev python manage.py migrate accounts
   ```

2. **Restart backend:**

   ```bash
   docker-compose -f docker-compose.dev.yml restart backend
   ```

3. **Restart frontend:**

   ```bash
   docker-compose -f docker-compose.dev.yml restart frontend
   ```

4. **Test endpoints:**
   - Use `tests/kyc_autofill_tests.http` with VS Code REST Client

## Testing Checklist

### Web Access Control

- [ ] Worker login → Redirected to /mobile-only
- [ ] Client login → Redirected to /mobile-only
- [ ] Agency login → Can access /agency/dashboard
- [ ] Admin login → Can access /admin/dashboard
- [ ] Toggle ENABLE_WORKER_WEB_UI → Worker can access dashboard

### KYC Auto-Fill

- [ ] Upload KYC documents → Extraction triggered
- [ ] GET /kyc/autofill → Returns extracted fields
- [ ] Mobile app shows pre-filled form
- [ ] User edits fields → edited_fields tracked
- [ ] POST /kyc/confirm → Saves confirmed values
- [ ] Admin sees extracted vs confirmed comparison

### Error Cases

- [ ] No KYC submission → autofill returns has_extracted_data=false
- [ ] Invalid date format → Error handled gracefully
- [ ] OCR failed → extraction_status=FAILED

## Future Enhancements

1. **Mobile App Updates:** Update React Native KYC screens to use auto-fill API
2. **Admin UI:** Add side-by-side comparison view in admin KYC review
3. **Confidence Thresholds:** Add configurable thresholds for auto-approval
4. **OCR Improvements:** Add support for more document formats
5. **Audit Logging:** Log all data confirmations for compliance

## Notes

- Feature flags default to `False` (mobile-only enforced)
- Extraction runs asynchronously after upload
- Admins and agencies always have web access
- JWT tokens include `profile_type` for middleware checks
