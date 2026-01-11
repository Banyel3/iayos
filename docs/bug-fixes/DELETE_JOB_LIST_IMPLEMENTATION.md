# Delete Job from List Implementation ✅

**Status**: ✅ COMPLETE  
**Date**: January 2025  
**Type**: UX Enhancement - Delete Jobs Directly from List  
**Time**: ~15 minutes

---

## Overview

Added delete functionality directly to job cards in the jobs list screen (`jobs.tsx`), allowing clients to delete their job postings without opening the job details screen. This improves UX by reducing navigation steps.

---

## Problem Statement

Previously, users could only delete jobs by:

1. Opening the jobs list
2. Tapping a job card to open details
3. Tapping the delete icon in the header
4. Confirming deletion

**User Request**: "make it available in the job lists themselves rather than the details"

---

## Solution Implemented

### 1. Added Delete Mutation Hook

**Location**: `apps/frontend_mobile/iayos_mobile/app/(tabs)/jobs.tsx`  
**Lines**: 107-124

```typescript
// Delete job mutation
const deleteJobMutation = useMutation({
  mutationFn: async (jobId: number) => {
    return await apiRequest(ENDPOINTS.DELETE_JOB(jobId), {
      method: "DELETE",
    });
  },
  onSuccess: () => {
    Alert.alert("Success", "Job deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["jobs", "my-jobs"] });
    refetch();
  },
  onError: (error: any) => {
    Alert.alert(
      "Error",
      error.message || "Failed to delete job. Please try again."
    );
  },
});
```

**Features**:

- Uses `useMutation` from React Query
- Calls `apiRequest` with DELETE method
- On success: Shows alert, invalidates cache, refetches list
- On error: Shows error alert with message

---

### 2. Added Delete Handler Function

**Location**: `apps/frontend_mobile/iayos_mobile/app/(tabs)/jobs.tsx`  
**Lines**: 126-149

```typescript
const handleDeleteJob = (jobId: number, status: string) => {
  // Prevent deletion of in-progress or completed jobs
  if (status === "IN_PROGRESS" || status === "COMPLETED") {
    Alert.alert(
      "Cannot Delete",
      "You cannot delete jobs that are in progress or completed"
    );
    return;
  }

  Alert.alert(
    "Delete Job",
    "Are you sure you want to delete this job? This action cannot be undone.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteJobMutation.mutate(jobId),
      },
    ]
  );
};
```

**Features**:

- Validates job status (blocks IN_PROGRESS and COMPLETED)
- Shows confirmation dialog with destructive action styling
- Cancel/Delete options
- Calls mutation only on confirm

---

### 3. Updated Job Card UI

**Location**: `apps/frontend_mobile/iayos_mobile/app/(tabs)/jobs.tsx`  
**Lines**: 202-232

**Before** (badges row):

```tsx
<View style={styles.badgesRow}>
  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
    <Text style={[styles.statusText, { color: statusColors.text }]}>
      {job.status.replace("_", " ")}
    </Text>
  </View>
  <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors.bg }]}>
    <Text style={[styles.urgencyText, { color: urgencyColors.text }]}>
      {job.urgency_level}
    </Text>
  </View>
</View>
```

**After** (with delete button):

```tsx
<View style={styles.badgesRow}>
  <View style={styles.badgesLeft}>
    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
      <Text style={[styles.statusText, { color: statusColors.text }]}>
        {job.status.replace("_", " ")}
      </Text>
    </View>
    <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors.bg }]}>
      <Text style={[styles.urgencyText, { color: urgencyColors.text }]}>
        {job.urgency_level}
      </Text>
    </View>
  </View>

  {/* Delete Button (only for clients on non-in-progress/completed jobs) */}
  {isClient && job.status !== "IN_PROGRESS" && job.status !== "COMPLETED" && (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={(e) => {
        e.stopPropagation(); // Prevent card press
        handleDeleteJob(job.job_id, job.status);
      }}
      activeOpacity={0.7}
    >
      <Ionicons name="trash-outline" size={20} color={Colors.error} />
    </TouchableOpacity>
  )}
</View>
```

**Key Changes**:

1. Wrapped badges in `badgesLeft` container
2. Added conditional delete button on the right
3. Used `e.stopPropagation()` to prevent card tap when deleting
4. Conditional rendering: Only shows for clients on ACTIVE/PENDING jobs

---

### 4. Updated Styles

**Location**: `apps/frontend_mobile/iayos_mobile/app/(tabs)/jobs.tsx`  
**Lines**: 523-529, 682-688

```typescript
badgesRow: {
  flexDirection: "row",
  justifyContent: "space-between",  // Changed from default
  alignItems: "center",              // Added
  marginBottom: Spacing.sm,
},
badgesLeft: {                        // New style
  flexDirection: "row",
  gap: Spacing.sm,
},
deleteButton: {                      // New style
  padding: Spacing.xs,
  borderRadius: BorderRadius.sm,
  backgroundColor: Colors.errorLight,
  alignItems: "center",
  justifyContent: "center",
},
```

---

## Visual Design

### Delete Button Appearance

- **Icon**: Ionicons `trash-outline` (20px)
- **Color**: `Colors.error` (red)
- **Background**: `Colors.errorLight` (light red/pink)
- **Padding**: `Spacing.xs` (8px)
- **Border Radius**: `BorderRadius.sm` (4px)
- **Position**: Right side of badges row
- **Touch Feedback**: 70% opacity on press

### Layout

```
┌─────────────────────────────────────────┐
│  [ACTIVE] [HIGH]              [🗑️]      │  ← Badges row
│                                         │
│  Plumber Needed for Kitchen Sink       │  ← Title
│  Plumbing                               │  ← Category
│  Need urgent repair...                  │  ← Description
│                                         │
│  ──────────────────────────────────     │
│  👤 Worker: John Doe                    │  ← Worker info (if assigned)
│                                         │
│  📍 Zamboanga City        ₱1,500        │  ← Footer
└─────────────────────────────────────────┘
```

---

## Conditional Rendering Logic

Delete button only shows when **ALL** conditions are true:

1. ✅ `isClient === true` (user must be a client)
2. ✅ `job.status !== "IN_PROGRESS"` (not in progress)
3. ✅ `job.status !== "COMPLETED"` (not completed)

**Shows for**: `ACTIVE`, `PENDING` jobs posted by the client  
**Hidden for**: `IN_PROGRESS`, `COMPLETED` jobs, or worker profiles

---

## User Flow

### Happy Path (Delete Success)

1. **Client** opens Jobs tab → "My Jobs" list
2. Sees job card with status `ACTIVE` or `PENDING`
3. Taps 🗑️ delete icon on the right side
4. **Alert appears**: "Delete Job - Are you sure you want to delete this job? This action cannot be undone."
5. Taps **"Delete"** (destructive action)
6. Backend deletes job (removes from DB, applications, notifications)
7. **Success alert**: "Success - Job deleted successfully"
8. Jobs list refreshes → job card removed
9. User continues browsing updated list

### Error Path (Cannot Delete)

1. Client taps delete on `IN_PROGRESS` or `COMPLETED` job
2. **Alert appears**: "Cannot Delete - You cannot delete jobs that are in progress or completed"
3. No deletion occurs
4. User returns to list

### Error Path (Backend Failure)

1. Client confirms deletion
2. Backend returns error (network issue, unauthorized, etc.)
3. **Error alert**: "Error - [error message] or Failed to delete job. Please try again."
4. Job remains in list
5. User can retry deletion

---

## Backend Integration

### API Endpoint

**Method**: `DELETE`  
**URL**: `/api/mobile/jobs/{job_id}`  
**Auth**: JWT Bearer token required

**Backend Location**: `apps/backend/src/accounts/mobile_api.py` (lines 899-936)

**Service Function**: `delete_mobile_job` in `mobile_services.py` (lines 914-993)

### Backend Validations

1. ✅ User must be job owner (posted by this client)
2. ✅ Job status must NOT be `IN_PROGRESS`
3. ✅ Deletes: Job record, applications, notifications
4. ✅ Updates: Transaction records (marks refunded if applicable)
5. ✅ Removes: Uploaded job photos from storage

**Success Response** (200):

```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

**Error Response** (400):

```json
{
  "error": "You can only delete jobs that are not in progress"
}
```

---

## Files Modified

### 1. `apps/frontend_mobile/iayos_mobile/app/(tabs)/jobs.tsx`

**Lines Changed**: ~70 lines

**Imports Added** (lines 1-23):

- `Alert` from `react-native`
- `useMutation`, `useQueryClient` from `@tanstack/react-query`
- `apiRequest` from `lib/api/config`

**Hooks Added** (lines 51-52):

- `queryClient` from `useQueryClient()`

**Mutation Added** (lines 107-124):

- `deleteJobMutation` with success/error handling

**Function Added** (lines 126-149):

- `handleDeleteJob` with validation and confirmation dialog

**UI Updated** (lines 202-232):

- Restructured badges row to add delete button
- Conditional rendering based on client status and job status

**Styles Updated** (lines 523-529, 682-688):

- `badgesRow` - Added space-between layout
- `badgesLeft` - New container for badges
- `deleteButton` - New button styling

---

## Testing Checklist

### Unit Testing

- [x] TypeScript compilation (0 errors)
- [x] Import statements correct
- [x] Function signatures valid
- [x] Conditional rendering logic correct

### Integration Testing

- [ ] Delete button appears only for clients
- [ ] Delete button hidden on IN_PROGRESS jobs
- [ ] Delete button hidden on COMPLETED jobs
- [ ] Delete button visible on ACTIVE jobs
- [ ] Delete button visible on PENDING jobs
- [ ] Tapping delete button shows confirmation dialog
- [ ] Cancel button dismisses dialog without deletion
- [ ] Delete button triggers backend API call
- [ ] Success alert appears after deletion
- [ ] Job list refreshes and removes deleted job
- [ ] Error alert appears on failure
- [ ] Event propagation stopped (card doesn't navigate on delete tap)

### Edge Cases

- [ ] Test with slow network (loading state)
- [ ] Test with no network (error handling)
- [ ] Test rapid deletion attempts (mutation disabled during request)
- [ ] Test on jobs with assigned workers
- [ ] Test on jobs with applications
- [ ] Test on jobs with payments

---

## Metrics

**Lines of Code**: ~70 lines  
**Files Modified**: 1 file  
**Time to Implement**: ~15 minutes  
**TypeScript Errors**: 0  
**Dependencies Added**: 0 (reused existing)

---

## Related Documentation

- **Backend Implementation**: `docs/bug-fixes/DELETE_JOB_IMPLEMENTATION.md`
- **Job Details Delete**: Job details screen already has delete in header (lines 260-310, 491-517 in `app/jobs/[id].tsx`)
- **API Endpoint**: `apps/backend/src/accounts/mobile_api.py` (DELETE /api/mobile/jobs/{job_id})
- **Service Layer**: `apps/backend/src/accounts/mobile_services.py` (delete_mobile_job function)

---

## Next Steps

### Recommended Enhancements

1. **Undo Functionality**: Add 5-second undo toast before permanent deletion
2. **Batch Delete**: Allow selecting multiple jobs for deletion
3. **Archive Instead**: Add "archive" option for soft-delete
4. **Analytics**: Track deletion reasons (cancelled, mistake, duplicate)
5. **Confirmation Step**: Ask "Why are you deleting?" with options

### Future Considerations

- Add delete to worker's job list (for withdrawing applications)
- Add admin delete functionality for moderation
- Add restore functionality for accidental deletions
- Log deletion events for audit trail

---

## Status

✅ **COMPLETE** - Delete functionality now available directly in job list cards  
✅ **TESTED** - TypeScript compilation successful (0 errors)  
✅ **DOCUMENTED** - Full implementation details recorded  
✅ **READY** - Ready for production testing

**Last Updated**: January 2025
