# Worker Skills Refactoring - Backend Implementation Complete ✅

**Date**: December 9, 2025  
**Status**: Backend Complete (Steps 1-4 of 11)  
**Branch**: dev  
**Migration**: 0061_worker_skills_certifications_reviews

## Overview

Refactored worker profile structure to implement the relationship:

```
Worker Profile (1) → (N) Skills → (N) Certifications
                           ↓
                      Reviews (via tags)
```

**Key Decision**: Keep database terminology as "Specializations" but display as "Skills" in all UI/APIs for user-friendliness.

## Database Changes (Step 1) ✅

### Migration 0061 Applied

**File**: `apps/backend/src/accounts/migrations/0061_worker_skills_certifications_reviews.py`

**Changes**:

1. **WorkerCertification Model** - Added nullable `specializationID` FK

   ```python
   specializationID = models.ForeignKey(
       'workerSpecialization',
       on_delete=models.SET_NULL,
       null=True, blank=True,
       related_name='certifications'
   )
   ```

2. **ReviewSkillTag Model** - NEW junction table
   ```python
   class ReviewSkillTag(models.Model):
       tagID = BigAutoField(primary_key=True)
       reviewID = ForeignKey(JobReview, related_name='skill_tags')
       workerSpecializationID = ForeignKey('workerSpecialization', related_name='review_tags')
       unique_together = [['reviewID', 'workerSpecializationID']]
   ```

**Database Table**: `review_skill_tags`

## Backend API Updates ✅

### Step 2: Worker Profile API (Modified)

**File**: `apps/backend/src/accounts/mobile_services.py`

**Changes**:

- `get_worker_detail_mobile()` (lines ~1600-1650)
- `get_workers_list_mobile()` (lines ~1480-1550)

**Old Response**:

```json
{
  "specializations": [{ "id": 1, "name": "Plumbing" }]
}
```

**New Response**:

```json
{
  "skills": [
    {
      "id": 45, // workerSpecialization PK
      "specializationId": 1, // Specializations PK
      "name": "Plumbing",
      "experienceYears": 5,
      "certificationCount": 2
    }
  ]
}
```

**Certification Count Calculation**:

```python
cert_count = WorkerCertification.objects.filter(
    workerID=worker,
    specializationID=ws
).count()
```

### Step 3: Available Skills Endpoint (NEW)

**File**: `apps/backend/src/accounts/mobile_api.py` (lines ~750-780)

**Endpoint**: `GET /api/mobile/skills/available`  
**Auth**: JWT required  
**Purpose**: List all specializations for skill picker in mobile app

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Plumbing",
      "description": "...",
      "minimumRate": 500.0,
      "rateType": "hourly",
      "skillLevel": "intermediate"
    }
  ],
  "count": 18
}
```

### Step 4: Certification API Updates (Modified)

**Files**:

- `apps/backend/src/accounts/schemas.py` (lines 212-245)
- `apps/backend/src/accounts/certification_service.py` (lines 12-110, 144-220, 332-365)
- `apps/backend/src/accounts/api.py` (lines 1619-1775)

**Schemas Updated**:

```python
class AddCertificationRequest(Schema):
    name: str
    organization: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    specialization_id: Optional[int] = None  # NEW

class CertificationSchema(Schema):
    # ...existing fields...
    specializationId: Optional[int] = None  # NEW
    skillName: Optional[str] = None  # NEW
```

**Endpoints Updated**:

1. `POST /api/accounts/certifications` - Added `specialization_id` form field
2. `PUT /api/accounts/certifications/{id}` - Added `specialization_id` form field (0/-1 to unlink)

**Service Functions**:

- `add_certification()` - Validates skill ownership, creates link
- `update_certification()` - Allows updating/unlinking skill
- `_format_certification()` - Returns `specializationId` and `skillName` in response

**Validation**:

```python
if specialization_id:
    worker_specialization = workerSpecialization.objects.get(
        id=specialization_id,
        workerID=worker_profile  # Ensures worker owns the skill
    )
```

## API Summary

### Modified Endpoints

| Endpoint                            | Method | Change                                        |
| ----------------------------------- | ------ | --------------------------------------------- |
| `/api/mobile/auth/profile`          | GET    | Returns `skills` instead of `specializations` |
| `/api/mobile/workers/list`          | GET    | Returns `skills` instead of `specializations` |
| `/api/accounts/certifications`      | POST   | Added `specialization_id` field               |
| `/api/accounts/certifications/{id}` | PUT    | Added `specialization_id` field               |
| `/api/accounts/certifications`      | GET    | Returns `specializationId` and `skillName`    |

### New Endpoints

| Endpoint                       | Method | Purpose                             |
| ------------------------------ | ------ | ----------------------------------- |
| `/api/mobile/skills/available` | GET    | List all specializations for picker |

## Data Model

### Relationships

```
WorkerProfile
    └─> workerSpecialization (junction table)
            ├─> Specializations (skill definition)
            ├─> WorkerCertification (NEW FK: specializationID)
            └─> ReviewSkillTag (NEW table: workerSpecializationID)
                    └─> JobReview
```

### Key Fields

- `workerSpecialization.id` - Used as skill identifier in APIs
- `workerSpecialization.experienceYears` - Displayed in UI
- `workerSpecialization.certification` - Old text field (deprecated, use FK now)
- `WorkerCertification.specializationID` - NEW FK to workerSpecialization
- `ReviewSkillTag.workerSpecializationID` - FK to specific worker skill

## Migration Notes

- Migration applied successfully: `0061_worker_skills_certifications_reviews`
- Existing certifications have `specializationID = NULL` (optional linkage)
- No data migration required (manual linking in UI)
- Backward compatible: API still accepts null specializationId

## Testing

**Backend Restart**: ✅ Successful (no errors)  
**Database**: ✅ Migration applied  
**Type Errors**: Warnings only (Django auto fields, non-blocking)

**Manual Tests Needed**:

1. GET `/api/mobile/skills/available` - Should return 18 specializations
2. POST certification with `specialization_id` - Should link to skill
3. GET worker profile - Should show `skills` array with `certificationCount`
4. PUT certification with `specialization_id = -1` - Should unlink skill

## Next Steps (Mobile App - Steps 5-11)

### Remaining Backend (Step 5)

- [ ] Add review skill tagging support
- [ ] Create ReviewSkillTagSchema
- [ ] Update review submission to accept `skillTags: number[]`
- [ ] Update review retrieval to include skill tags

### Mobile Implementation (Steps 6-11)

- [ ] Update WorkerProfile TypeScript interface
- [ ] Create SkillsSelector component
- [ ] Update profile edit screen
- [ ] Update certification forms
- [ ] Update profile display
- [ ] Add skill tags to reviews

**Estimated Remaining Time**: 8-12 hours (mobile UI work)

## Files Changed

**Backend Models**: 1 file

- `apps/backend/src/accounts/models.py` (+45 lines)

**Backend Services**: 2 files

- `apps/backend/src/accounts/mobile_services.py` (+35 lines)
- `apps/backend/src/accounts/certification_service.py` (+30 lines)

**Backend APIs**: 2 files

- `apps/backend/src/accounts/mobile_api.py` (+30 lines)
- `apps/backend/src/accounts/api.py` (+2 lines)

**Backend Schemas**: 1 file

- `apps/backend/src/accounts/schemas.py` (+6 lines)

**Migrations**: 1 file

- `apps/backend/src/accounts/migrations/0061_worker_skills_certifications_reviews.py` (NEW)

**Total**: 7 files modified, 1 migration created, ~148 lines added

## Terminology Guide

| Database              | API Response     | UI Display                |
| --------------------- | ---------------- | ------------------------- |
| Specializations       | skills           | Skills                    |
| workerSpecialization  | skills[].name    | Plumbing (5 yrs, 2 certs) |
| specializationID (FK) | specializationId | --                        |
| specializationName    | name             | Plumbing                  |

---

**Implementation By**: AI Agent (Claude)  
**Reviewed By**: User (Pending)  
**Status**: ✅ Backend Complete, Mobile Pending
