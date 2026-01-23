# Assigned Worker UI Display Fix

**Date**: January 2025  
**Issue**: Job details screen not showing assigned worker for INVITE jobs (direct worker hire)  
**Status**: ✅ FIXED

## Problem

When creating a job request with direct worker assignment (wallet or GCash payment), the backend correctly:

- Created job as `jobType=INVITE`
- Auto-created JobApplication with status=ACCEPTED
- Returned `assigned_worker` object in API response

However, the frontend job details screen did **not display** the assigned worker information.

## Root Cause

The frontend `JobDetail` interface and data transformation were missing:

1. `jobType` field (INVITE vs LISTING)
2. `assignedWorker` field (worker info for INVITE jobs)
3. UI rendering logic for assigned worker section

## API Response Structure

```json
{
  "id": 26,
  "title": "Job Title",
  "job_type": "INVITE",
  "assigned_worker": {
    "id": 2,
    "name": "Worker Name",
    "avatar": "https://...",
    "rating": 4.7
  },
  "client": {
    "id": 1,
    "name": "Client Name",
    "avatar": "https://...",
    "rating": 5.0
  },
  "budget": 1000.0,
  ...
}
```

## Solution

### 1. Updated JobDetail Interface

**File**: `apps/frontend_mobile/iayos_mobile/app/jobs/[id].tsx`  
**Lines**: 32-62

```typescript
interface JobDetail {
  // ... existing fields ...
  jobType?: "INVITE" | "LISTING";
  assignedWorker?: {
    id: number;
    name: string;
    avatar: string;
    rating: number;
  };
}
```

### 2. Updated Data Transformation

**File**: `apps/frontend_mobile/iayos_mobile/app/jobs/[id].tsx`  
**Lines**: 151-179

```typescript
return {
  // ... existing field mappings ...
  jobType: jobData.job_type,
  assignedWorker: jobData.assigned_worker,
} as JobDetail;
```

### 3. Added Assigned Worker UI Section

**File**: `apps/frontend_mobile/iayos_mobile/app/jobs/[id].tsx`  
**Lines**: 492-518

```typescript
{/* Assigned Worker - Only for INVITE jobs */}
{job.jobType === "INVITE" && job.assignedWorker && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Assigned Worker</Text>
    <View style={styles.posterCard}>
      <Image
        source={{
          uri: job.assignedWorker.avatar || "https://via.placeholder.com/60",
        }}
        style={styles.posterAvatar}
      />
      <View style={styles.posterInfo}>
        <Text style={styles.posterName}>
          {job.assignedWorker.name}
        </Text>
        <View style={styles.posterRating}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.posterRatingText}>
            {job.assignedWorker.rating.toFixed(1)} rating
          </Text>
        </View>
      </View>
    </View>
  </View>
)}
```

## UI Behavior

### For INVITE Jobs (Direct Hire)

- ✅ Shows "Assigned Worker" section above "Posted By"
- ✅ Displays worker name, avatar, and rating
- ✅ Uses same card style as "Posted By" for consistency
- ✅ Conditional rendering (only shows when `jobType === "INVITE"` and `assignedWorker` exists)

### For LISTING Jobs (Public Posts)

- ✅ No "Assigned Worker" section displayed
- ✅ Shows only "Posted By" (client info)
- ✅ Normal job browsing/application flow

## Testing Checklist

- [ ] Create job request with wallet payment (direct worker hire)
- [ ] Verify "Assigned Worker" section appears in job details
- [ ] Verify worker name, avatar, and rating displayed correctly
- [ ] Create public job posting (no worker assigned)
- [ ] Verify "Assigned Worker" section does NOT appear
- [ ] Verify "Posted By" section always shows client info
- [ ] Test both payment methods (wallet and GCash)

## Files Modified

1. `apps/frontend_mobile/iayos_mobile/app/jobs/[id].tsx`
   - Added `jobType` and `assignedWorker` to JobDetail interface
   - Updated data transformation to map new fields
   - Added conditional UI section for assigned worker
   - **Total Changes**: 35 lines added

## Related Issues

- ✅ Platform fee (5%) now charged on all payment methods
- ✅ Job type system (INVITE vs LISTING) implemented
- ✅ Job listings filter out INVITE jobs (private)
- ✅ Notification messages updated ("Worker Requested" vs "Job Posted")
- ✅ Backend returns `assigned_worker` field for INVITE jobs
- ✅ Frontend now displays assigned worker in UI

## Status

✅ **COMPLETE** - Assigned worker now displays in job details for INVITE jobs

## Next Steps

- Test with production data
- Verify UI styling matches design system
- Consider adding "Contact Worker" button for assigned worker
- Add worker profile navigation on tap
