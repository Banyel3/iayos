# Agency Browse API Backend Fixes

**Date**: November 12, 2025  
**Issue**: `/api/client/agencies/browse` returning 500 Internal Server Error  
**Status**: ✅ RESOLVED

## Problem Summary

Frontend was successfully calling the agencies browse API, but backend was returning 500 errors due to multiple Django ORM `FieldError` exceptions caused by incorrect field names and relationship paths.

## Root Causes

### 1. Incorrect AgencyKYC Relationship Path (Line 33)

**Error**: `Cannot resolve keyword 'agencykyc' into field`

**Problem**:

```python
# ❌ WRONG - AgencyKYC doesn't directly link to Agency
agencies_query = Agency.objects.filter(
    agencykyc__status=kyc_status
)
```

**Solution**:

```python
# ✅ CORRECT - Join through accountFK (both link to Accounts)
agencies_query = Agency.objects.filter(
    accountFK__agencykyc__status=kyc_status
)
```

**Explanation**:

- `Agency` has `accountFK` → `Accounts`
- `AgencyKYC` has `accountFK` → `Accounts`
- Must join through the common `Accounts` relationship

---

### 2. Incorrect JobReview Relationship Path (Line 58)

**Error**: `Unsupported lookup 'jobreview' for BigAutoField or join on the field not permitted`

**Problem**:

```python
# ❌ WRONG - Field doesn't exist and wrong related_name
avg_rating=Avg('assigned_jobs__jobreview__agencyRating'),
total_reviews=Count('assigned_jobs__jobreview', distinct=True)
```

**Solution**:

```python
# ✅ CORRECT - Use proper related_name and field
avg_rating=Avg('assigned_jobs__reviews__rating'),
total_reviews=Count('assigned_jobs__reviews', distinct=True)
```

**Explanation**:

- `Job` model has `related_name='reviews'` for JobReview FK
- `JobReview` model has `rating` field, not `agencyRating`

---

### 3. Incorrect AgencyKYC Lookup in Loop (Line 89)

**Error**: `Cannot resolve keyword 'agencyID' into field`

**Problem**:

```python
# ❌ WRONG - AgencyKYC doesn't have agencyID field
kyc_record = AgencyKYC.objects.get(agencyID=agency)
```

**Solution**:

```python
# ✅ CORRECT - Use accountFK for lookup
kyc_record = AgencyKYC.objects.get(accountFK=agency.accountFK)
```

**Explanation**:

- `AgencyKYC` model only has `accountFK` field linking to `Accounts`
- Both `Agency` and `AgencyKYC` share the same `accountFK` value

---

### 4. Incorrect Specialization Field Name (Line 100)

**Error**: `Cannot resolve keyword 'categoryName' into field`

**Problem**:

```python
# ❌ WRONG - Field is named specializationName, not categoryName
specializations = list(
    Job.objects.filter(
        assignedAgencyFK=agency,
        status='COMPLETED'
    ).values_list('categoryID__categoryName', flat=True).distinct()[:5]
)
```

**Solution**:

```python
# ✅ CORRECT - Use specializationName
specializations = list(
    Job.objects.filter(
        assignedAgencyFK=agency,
        status='COMPLETED'
    ).values_list('categoryID__specializationName', flat=True).distinct()[:5]
)
```

**Explanation**:

- `categoryID` is a FK to `Specializations` model
- The field is named `specializationName`, not `categoryName`

---

## Files Modified

**File**: `apps/backend/src/client/services.py`

**Changes**:

1. Line 33: Fixed AgencyKYC filter path
2. Line 58-59: Fixed JobReview annotations
3. Line 89: Fixed AgencyKYC individual lookup
4. Line 100: Fixed Specialization field name

---

## Database Relationship Schema

```
Accounts (User)
    ↑ accountFK
    ├── Agency (businessName, city, etc.)
    │       ↑ assignedAgencyFK
    │       └── Job (assigned_jobs)
    │               ↑ jobID
    │               └── JobReview (reviews)
    │                       └── rating
    │
    └── AgencyKYC (status: APPROVED/PENDING/REJECTED)

Job
    ├── assignedAgencyFK → Agency
    ├── categoryID → Specializations
    │       └── specializationName
    └── reviews (JobReview)
            └── rating
```

---

## Testing

**Database Check**:

```bash
docker-compose -f docker-compose.dev.yml exec backend python src/manage.py shell -c \
  "from accounts.models import Agency; from agency.models import AgencyKYC; \
   print('Total agencies:', Agency.objects.count()); \
   print('Approved AgencyKYC:', AgencyKYC.objects.filter(status='APPROVED').count())"
```

**Result**:

- Total agencies: 1
- Total AgencyKYC records: 1
- Approved AgencyKYC: 1

**API Endpoint**: `GET /api/client/agencies/browse?page=1&limit=12&sort_by=rating`

**Expected Response**:

```json
{
  "agencies": [
    {
      "agencyId": 1,
      "businessName": "Example Agency",
      "averageRating": 4.5,
      "kycStatus": "APPROVED",
      "specializations": ["Plumbing", "Electrical"],
      ...
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

## Related Documentation

- **Feature Docs**: `docs/features/AGENCY_PHASE1_REFACTOR.md`
- **Summary**: `docs/features/AGENCY_PHASE1_REFACTOR_SUMMARY.md`
- **Memory File**: `AGENTS.md` (Agency Phase 1 section)

---

## Lessons Learned

1. **Always verify Django relationship paths** - Use `Model.objects.filter()` in Django shell to test queries
2. **Check related_name attributes** - Don't assume lowercase model name is the related_name
3. **Verify field names in models** - Field naming isn't always consistent (e.g., categoryName vs specializationName)
4. **Test with real data** - Check if records exist in database before testing API

---

## Additional Fix: Agency Profile Endpoint

**Date**: November 12, 2025  
**Endpoint**: `GET /api/client/agencies/{agency_id}`

### Issues Found

The `get_agency_profile()` function in `client/services.py` had the same field name errors as `browse_agencies()`:

1. **Line 217**: `AgencyKYC.objects.get(agencyID=agency)` ❌
   - Fixed to: `AgencyKYC.objects.get(accountFK=agency.accountFK)` ✅

2. **Line 232**: `reviews.aggregate(Avg('agencyRating'))` ❌
   - Fixed to: `reviews.aggregate(Avg('rating'))` ✅

3. **Line 256**: `values_list('categoryID__categoryName', flat=True)` ❌
   - Fixed to: `values_list('categoryID__specializationName', flat=True)` ✅

### Result

Both agency endpoints now working:

- ✅ `GET /api/client/agencies/browse` - Returns list of agencies
- ✅ `GET /api/client/agencies/{id}` - Returns detailed agency profile

---

**Status**: ✅ All backend errors resolved, both API endpoints now return data successfully
