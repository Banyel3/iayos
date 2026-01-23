# Worker Phase 1 - Quick Start Guide

## ✅ What's Been Done (4 hours)

### Backend Foundation Complete

1. **3 Database Models Created**
   - Enhanced `WorkerProfile` with bio, hourly_rate, profile_completion_percentage
   - New `WorkerCertification` model for professional credentials
   - New `WorkerPortfolio` model for work samples

2. **Migration File Created**
   - File: `0037_worker_phase1_profile_enhancements.py`
   - Status: Created but NOT YET APPLIED
   - Safe to apply (all fields have defaults)

3. **Helper Methods Added**
   - Profile completion calculation (0-100%)
   - Certification expiry checking
   - Profile completion auto-update

## 🎯 Next Steps to Continue Implementation

### Step 1: Apply Migration (10 minutes)

```bash
cd c:\code\iayos\apps\backend
python manage.py migrate accounts
```

Expected output:

```
Running migrations:
  Applying accounts.0037_worker_phase1_profile_enhancements... OK
```

### Step 2: Create Service Files (10-12 hours)

Create three new service files:

#### File 1: `apps/backend/src/accounts/worker_profile_service.py`

Functions needed:

- `update_worker_profile(worker, bio, description, hourly_rate)`
- `get_worker_profile_completion(worker)`

#### File 2: `apps/backend/src/accounts/certification_service.py`

Functions needed:

- `add_certification(worker, name, organization, dates, file)`
- `get_certifications(worker)`
- `delete_certification(worker, cert_id)`

#### File 3: `apps/backend/src/accounts/portfolio_service.py`

Functions needed:

- `upload_portfolio_image(worker, image_file, caption)`
- `get_portfolio(worker)`
- `delete_portfolio_image(worker, portfolio_id)`

### Step 3: Create API Endpoints (8-10 hours)

Add to `apps/backend/src/accounts/api.py`:

**Profile Endpoints**:

- `POST /api/accounts/worker/profile` - Update profile
- `GET /api/accounts/worker/profile-completion` - Get completion %

**Certification Endpoints**:

- `POST /api/accounts/worker/certifications` - Add (with file upload)
- `GET /api/accounts/worker/certifications` - List
- `DELETE /api/accounts/worker/certifications/{id}` - Delete

**Portfolio Endpoints**:

- `POST /api/accounts/worker/portfolio` - Upload image
- `GET /api/accounts/worker/portfolio` - List
- `DELETE /api/accounts/worker/portfolio/{id}` - Delete

### Step 4: Create Schemas (3-4 hours)

Add to `apps/backend/src/accounts/schemas.py`:

- `WorkerProfileUpdateSchema`
- `ProfileCompletionResponse`
- `CertificationSchema`
- `AddCertificationResponse`
- `PortfolioItemSchema`
- `UploadPortfolioResponse`

### Step 5: File Upload Utils (3-4 hours)

Add to `apps/backend/src/iayos_project/utils.py`:

- `upload_worker_certificate(file, file_name, worker_id)`
- `upload_worker_portfolio(file, file_name, worker_id)`

### Step 6: Frontend Components (18-24 hours)

Create in `apps/frontend_web/components/`:

- `WorkerProfileEditForm.tsx`
- `CertificationsManager.tsx`
- `PortfolioManager.tsx`
- `ProfileCompletionCard.tsx`

Create pages:

- `app/dashboard/profile/edit/page.tsx`
- `app/dashboard/profile/certifications/page.tsx`
- `app/dashboard/profile/portfolio/page.tsx`

## 📊 Implementation Status

```
Backend Models:     ████████████████████ 100% ✅
Migration:          ████████████████████ 100% ✅ (created, not applied)
Services:           ░░░░░░░░░░░░░░░░░░░░   0%
API Endpoints:      ░░░░░░░░░░░░░░░░░░░░   0%
Schemas:            ░░░░░░░░░░░░░░░░░░░░   0%
File Upload:        ░░░░░░░░░░░░░░░░░░░░   0%
Frontend:           ░░░░░░░░░░░░░░░░░░░░   0%
Testing:            ░░░░░░░░░░░░░░░░░░░░   0%
────────────────────────────────────────────
Overall:            ███░░░░░░░░░░░░░░░░░  15%
```

**Time Invested**: 4 hours  
**Time Remaining**: 56-76 hours  
**Estimated Completion**: 3 weeks with 1 full-time developer

## 🔧 Database Schema Quick Reference

### WorkerProfile (Enhanced)

```sql
ALTER TABLE worker_profile
ADD COLUMN bio VARCHAR(200) DEFAULT '',
ADD COLUMN hourly_rate DECIMAL(10,2) NULL,
ADD COLUMN profile_completion_percentage INT DEFAULT 0;
```

### WorkerCertification (New Table)

```sql
CREATE TABLE worker_certifications (
    certificationID BIGSERIAL PRIMARY KEY,
    workerID INT REFERENCES worker_profile,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    certificate_url VARCHAR(1000),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by INT REFERENCES accounts,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
```

### WorkerPortfolio (New Table)

```sql
CREATE TABLE worker_portfolio (
    portfolioID BIGSERIAL PRIMARY KEY,
    workerID INT REFERENCES worker_profile,
    image_url VARCHAR(1000) NOT NULL,
    caption TEXT,
    display_order INT DEFAULT 0,
    file_name VARCHAR(255),
    file_size INT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
```

## 📁 Files Modified/Created

### Created Files ✅

1. `apps/backend/src/accounts/migrations/0037_worker_phase1_profile_enhancements.py`
2. `docs/features/WORKER_PHASE1_IMPLEMENTATION.md`
3. `docs/features/WORKER_PHASE1_QUICK_START.md` (this file)

### Modified Files ✅

1. `apps/backend/src/accounts/models.py` - Added 2 models, enhanced WorkerProfile
2. `AGENTS.md` - Updated with Worker Phase 1 status

### Files To Create (Next Steps)

1. `apps/backend/src/accounts/worker_profile_service.py`
2. `apps/backend/src/accounts/certification_service.py`
3. `apps/backend/src/accounts/portfolio_service.py`
4. API endpoint additions to `apps/backend/src/accounts/api.py`
5. Schema additions to `apps/backend/src/accounts/schemas.py`
6. File upload utils in `apps/backend/src/iayos_project/utils.py`
7. Frontend components (7 components)
8. Frontend pages (3 pages)

## 🚨 Important Notes

### Before Applying Migration

- ✅ Migration is safe (all fields have defaults)
- ✅ No data loss will occur
- ✅ Existing worker profiles will get default values
- ✅ Can be rolled back if needed

### Profile Completion Calculation

The system checks 7 fields:

1. Bio (filled)
2. Description (filled)
3. Hourly rate (set)
4. Profile image (uploaded)
5. Specializations (at least 1)
6. Certifications (at least 1)
7. Portfolio (at least 1 image)

Each field = ~14% completion

### File Size Limits

- Certificates: No hard limit (recommend 5MB)
- Portfolio images: 5MB maximum
- Formats: JPEG, PNG (certificates can be PDF)

### Supabase Storage Paths

- Certificates: `workers/{workerID}/certificates/`
- Portfolio: `workers/{workerID}/portfolio/`

## 💡 Implementation Tips

### Service Layer

- Always validate worker ownership before operations
- Update profile completion after any change
- Create notifications for important events
- Handle Supabase upload errors gracefully

### API Layer

- Use `cookie_auth` for all endpoints
- Verify user is a WORKER (check profile type)
- Use `Form()` for file uploads
- Return detailed error messages

### Frontend

- Use TanStack Query for API integration
- Implement optimistic updates for better UX
- Show progress bars for file uploads
- Auto-save on profile edits
- Real-time profile completion updates

## 📚 Additional Documentation

- **Full Implementation Plan**: `docs/features/WORKER_PHASE1_IMPLEMENTATION.md`
- **Agency Phase 2 Reference**: `docs/features/AGENCY_PHASE2_PART2_IMPLEMENTATION.md` (similar patterns)
- **File Upload Reference**: `apps/backend/src/iayos_project/utils.py` (see `upload_kyc_doc`)

## 🎯 Success Criteria

### Phase 1 Complete When:

- [ ] Migration applied successfully
- [ ] All 10 API endpoints working
- [ ] File uploads to Supabase functional
- [ ] Profile completion calculation accurate
- [ ] Worker can edit profile via frontend
- [ ] Worker can manage certifications
- [ ] Worker can upload portfolio
- [ ] Client can view enhanced worker profile
- [ ] Unit tests passing
- [ ] Integration tests passing

### Key Metrics:

- 70%+ workers with >50% profile completion
- 50%+ workers with at least 1 certification
- 60%+ workers with at least 3 portfolio images

---

**Last Updated**: November 13, 2025  
**Phase Status**: Backend Foundation Complete (15%)  
**Next Milestone**: Service Layer Implementation (Target: Week 1)  
**Estimated Total Time**: 60-80 hours
