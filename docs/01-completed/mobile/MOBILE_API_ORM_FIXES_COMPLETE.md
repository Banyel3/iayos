# Mobile API ORM Fixes - Complete Summary

**Date**: November 16, 2025  
**Status**: ✅ COMPLETE  
**Files Modified**: 1 file (`mobile_services.py`)  
**Lines Changed**: ~50 lines across 7 functions  
**Time**: ~2 hours

## Problem Statement

Mobile API endpoints were failing with Django ORM errors due to incorrect field names and relationships. The mobile_services.py file was using field names that didn't match the actual Job model structure.

### Root Causes Identified

1. **Model Alias Confusion**: `JobPosting = Job` (line 1113 in models.py) - both names refer to same model
2. **Wrong Field Names**: Code used `clientFK`, `categoryFK`, `urgencyLevel` instead of correct `clientID`, `categoryID`, `urgency`
3. **Invalid prefetch_related**: Used `'specializations'` which doesn't exist on Job model
4. **Incomplete FK Chains**: Missing `profileID` in paths like `assignedWorkerID__accountFK`

## Job Model Structure (Confirmed)

```python
# From models.py lines 569-750
class Job(models.Model):
    jobID = models.BigAutoField(primary_key=True)

    # Foreign Keys (CORRECT names)
    clientID = models.ForeignKey(ClientProfile, ...)       # ← NOT clientFK
    categoryID = models.ForeignKey(Specializations, ...)   # ← NOT categoryFK or category
    assignedWorkerID = models.ForeignKey(WorkerProfile, ...)

    # Fields (CORRECT names)
    urgency = models.CharField(...)                         # ← NOT urgencyLevel
    expectedDuration = models.CharField(...)
    preferredStartDate = models.DateField(...)
    materialsNeeded = models.JSONField(...)

# Reverse Relationships
JobPhoto.jobID = FK to Job, related_name='photos'
JobApplication.jobID = FK to Job, related_name='applications'

# Correct ORM Pattern (from working web API)
JobPosting.objects.select_related(
    'categoryID',                              # Single FK
    'clientID__profileID__accountFK',          # Client account chain
    'assignedWorkerID__profileID__accountFK'   # Worker account chain
).prefetch_related('photos')                   # Reverse FK
```

## Fixes Applied

### 1. Fixed `get_mobile_job_detail()` (Line 137-145)

**Before** (BROKEN):

```python
job = JobPosting.objects.select_related(
    'clientID__profileID__accountFK',
    'assignedWorkerID__accountFK',  # ❌ Missing profileID
    'categoryID'
).prefetch_related(
    'photos',
    'specializations',  # ❌ Doesn't exist
    'applications'      # ❌ Not needed in detail view
).get(jobID=job_id)
```

**After** (FIXED):

```python
job = JobPosting.objects.select_related(
    'categoryID',                              # ✅ Correct order
    'clientID__profileID__accountFK',          # ✅ Complete chain
    'assignedWorkerID__profileID__accountFK'   # ✅ Fixed - added profileID
).prefetch_related(
    'photos'                                   # ✅ Only what's needed
).get(jobID=job_id)
```

### 2. Fixed `search_mobile_jobs()` (Line 417-426)

**Before** (BROKEN):

```python
queryset = JobPosting.objects.filter(...).select_related(
    'clientFK__accountFK',  # ❌ Wrong field name
    'category'              # ❌ Wrong field name
).distinct().order_by('-createdAt')
```

**After** (FIXED):

```python
queryset = JobPosting.objects.filter(
    Q(title__icontains=query) |
    Q(description__icontains=query) |
    Q(location__icontains=query) |
    Q(categoryID__specializationName__icontains=query),  # ✅ Fixed
    status='ACTIVE'
).select_related(
    'clientID__profileID__accountFK',  # ✅ Fixed field name
    'categoryID'                       # ✅ Fixed field name
).prefetch_related('photos').distinct().order_by('-createdAt')
```

### 3. Fixed `create_mobile_job()` (Line 300-310)

**Before** (BROKEN):

```python
job = JobPosting.objects.create(
    clientFK=client_profile,       # ❌ Wrong field name
    category=category,              # ❌ Wrong field name
    urgencyLevel=job_data.get(...), # ❌ Wrong field name
    ...
)
```

**After** (FIXED):

```python
job = JobPosting.objects.create(
    clientID=client_profile,        # ✅ Fixed
    categoryID=category,            # ✅ Fixed
    urgency=job_data.get(...),      # ✅ Fixed
    ...
)
```

### 4. Fixed `get_user_jobs()` - CLIENT Branch (Line 899-907)

**Before** (BROKEN):

```python
jobs_qs = JobPosting.objects.select_related(
    'clientID',                    # ❌ Incomplete - missing chain
    'clientID__profileFK',         # ❌ Wrong field name
    'categoryFK',                  # ❌ Wrong field name
    'assignedWorkerID'             # ❌ Incomplete - missing chain
).filter(
    clientID__profileFK__accountFK=user  # ❌ Wrong field path
)
```

**After** (FIXED):

```python
jobs_qs = JobPosting.objects.select_related(
    'clientID__profileID__accountFK',          # ✅ Complete chain
    'categoryID',                              # ✅ Fixed field name
    'assignedWorkerID__profileID__accountFK'   # ✅ Complete chain
).prefetch_related('photos').filter(
    clientID__profileID__accountFK=user        # ✅ Fixed path
)
```

### 5. Fixed `get_user_jobs()` - WORKER Branch (Line 927-934)

**Before** (BROKEN):

```python
jobs_qs = JobPosting.objects.select_related(
    'clientID',             # ❌ Incomplete
    'clientID__profileFK',  # ❌ Wrong field
    'categoryFK',           # ❌ Wrong field
    'assignedWorkerID'      # ❌ Incomplete
).filter(...)
```

**After** (FIXED):

```python
jobs_qs = JobPosting.objects.select_related(
    'clientID__profileID__accountFK',          # ✅ Fixed
    'categoryID',                              # ✅ Fixed
    'assignedWorkerID__profileID__accountFK'   # ✅ Fixed
).prefetch_related('photos').filter(...)
```

### 6. Fixed `get_available_jobs_mobile()` (Line 1061-1069)

**Before** (BROKEN):

```python
jobs_qs = JobPosting.objects.select_related(
    'clientID',             # ❌ Incomplete
    'clientID__profileFK',  # ❌ Wrong field
    'categoryFK'            # ❌ Wrong field
).filter(...)
```

**After** (FIXED):

```python
jobs_qs = JobPosting.objects.select_related(
    'clientID__profileID__accountFK',  # ✅ Fixed
    'categoryID'                       # ✅ Fixed
).prefetch_related('photos').filter(...)
```

### 7. Fixed Job Data Building - Category Field Access (3 locations)

**Before** (BROKEN):

```python
'category_id': job.categoryFK.specializationID if job.categoryFK else None,
'category_name': job.categoryFK.specializationName if job.categoryFK else 'General',
'urgency_level': job.urgencyLevel,
```

**After** (FIXED):

```python
'category_id': job.categoryID.specializationID if job.categoryID else None,
'category_name': job.categoryID.specializationName if job.categoryID else 'General',
'urgency_level': job.urgency,
```

**Fixed in**:

- `get_user_jobs()` line 955-968
- `get_available_jobs_mobile()` line 1075-1088

## Files Modified

### `apps/backend/src/accounts/mobile_services.py`

| Function                    | Lines     | Issue Fixed                                                                            |
| --------------------------- | --------- | -------------------------------------------------------------------------------------- |
| `get_mobile_job_detail`     | 137-145   | Removed invalid `prefetch_related('specializations')`, fixed FK chains                 |
| `search_mobile_jobs`        | 417-426   | Changed `clientFK` → `clientID`, `category` → `categoryID`                             |
| `create_mobile_job`         | 300-310   | Changed `clientFK` → `clientID`, `category` → `categoryID`, `urgencyLevel` → `urgency` |
| `get_user_jobs` (CLIENT)    | 899-907   | Fixed all FK chains, field names, added `prefetch_related('photos')`                   |
| `get_user_jobs` (WORKER)    | 927-934   | Fixed all FK chains, field names, added `prefetch_related('photos')`                   |
| `get_available_jobs_mobile` | 1061-1069 | Fixed all FK chains, field names, added `prefetch_related('photos')`                   |
| Job data building           | 963, 1083 | Changed `categoryFK` → `categoryID`, `urgencyLevel` → `urgency`                        |

**Total Changes**: ~50 lines across 7 functions

## Testing

### Before Fixes

```
❌ AttributeError: Cannot find 'specializations' on Job object
❌ HTTP 400 Bad Request
❌ Mobile job detail screen shows "Error loading job"
```

### After Fixes

Backend auto-reloaded after detecting file changes:

```
✅ /app/apps/backend/src/accounts/mobile_services.py changed, reloading.
✅ System check identified no issues (0 silenced).
✅ Starting ASGI/Daphne version 4.1.2 development server
```

**Next Step**: Test job detail endpoint on mobile app to confirm 200 OK response

## Key Learnings

1. **Model Aliases**: `JobPosting = Job` can cause confusion - always verify actual model definition
2. **FK Chain Requirements**: Django select_related requires COMPLETE paths:
   - ❌ `assignedWorkerID__accountFK` (skips profileID)
   - ✅ `assignedWorkerID__profileID__accountFK` (complete)
3. **prefetch_related vs select_related**:
   - Use `select_related` for forward ForeignKey relationships
   - Use `prefetch_related` for reverse ForeignKey (related_name) or ManyToMany
4. **Field Name Consistency**: Always use exact model field names:
   - Job uses `clientID` not `clientFK`
   - Job uses `categoryID` not `categoryFK` or `category`
   - Job uses `urgency` not `urgencyLevel`
5. **Web API as Reference**: Working web API (jobs/api.py) provides correct ORM patterns

## Related Documentation

- Job model definition: `apps/backend/src/accounts/models.py` lines 569-750
- JobPhoto model: `apps/backend/src/accounts/models.py` lines 800-820
- JobApplication model: `apps/backend/src/accounts/models.py` lines 865-920
- Working web API: `apps/backend/src/jobs/api.py` lines 960-965 (job detail query)
- Mobile API endpoints: `apps/backend/src/accounts/mobile_api.py`

## Status

✅ **COMPLETE** - All ORM queries fixed and aligned with Job model structure  
✅ **Backend Restarted** - Django auto-reload detected changes  
🔄 **Ready for Testing** - Mobile app should now successfully load job details

---

**Completion Time**: November 16, 2025 21:07 UTC  
**Next Action**: Test `/api/mobile/jobs/7` endpoint on mobile app to verify 200 OK response
