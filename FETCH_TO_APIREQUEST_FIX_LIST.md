# Mobile App: fetch() to apiRequest() Migration

## Problem

Many hooks and components use raw `fetch()` with `credentials: "include"` which only sends cookies.
Mobile app uses JWT Bearer tokens stored in AsyncStorage, not cookies.
This causes dual-profile users to get wrong profile data.

## Solution

Replace all `fetch()` calls with `apiRequest()` helper which automatically:

- Adds Bearer token from AsyncStorage
- Includes profile_type from JWT
- Properly authenticates dual-profile users

## Files That Need Fixing

### ✅ ALREADY FIXED

**All Hooks** (8 files, 21 fetch calls):
- [x] `lib/hooks/useMessages.ts` - conversation messages & image upload
- [x] `lib/hooks/useWebSocket.ts` - HTTP fallback for sending messages
- [x] `lib/hooks/useKYC.ts` - KYC status & history (2 calls)
- [x] `lib/hooks/useNotifications.ts` - All notification operations (8 calls)
- [x] `lib/hooks/usePortfolioManagement.ts` - Portfolio CRUD (4 calls)
- [x] `lib/hooks/useSaveJob.ts` - Save/unsave jobs (2 calls)
- [x] `lib/hooks/useWorkerEarnings.ts` - Earnings data (2 calls)
- [x] `lib/hooks/usePayments.ts` - Cash proof upload (1 FormData call)
- [x] `lib/hooks/useCertifications.ts` - Already using apiRequest

**All Components** (12 files, ~20 fetch calls):
- [x] `app/kyc/upload.tsx` - KYC document upload (FormData)
- [x] `app/profile/avatar.tsx` - Profile & avatar operations
- [x] `app/profile/index.tsx` - Profile fetch
- [x] `app/profile/edit.tsx` - Profile fetch & update
- [x] `app/applications/[id].tsx` - Application detail & withdraw
- [x] `app/applications/index.tsx` - My applications
- [x] `app/jobs/active.tsx` - Active jobs
- [x] `app/jobs/active/[id].tsx` - Job operations & photo upload
- [x] `app/jobs/categories.tsx` - Categories
- [x] `app/jobs/saved.tsx` - Saved jobs operations
- [x] `app/jobs/search.tsx` - Search operations
- [x] `app/jobs/browse/[categoryId].tsx` - Browse by category

### ✅ MIGRATION COMPLETE!

All 21 files have been fixed. All `fetch()` calls now use `apiRequest()` for proper Bearer token authentication.

## Migration Pattern

### Before (❌ Wrong):

```typescript
const response = await fetch(ENDPOINTS.SOME_ENDPOINT, {
  credentials: "include",
  // ... other options
});
```

### After (✅ Correct):

```typescript
import { apiRequest } from "../api/config"; // or "@/lib/api/config"

const response = await apiRequest(ENDPOINTS.SOME_ENDPOINT, {
  // ... other options (no credentials needed)
});
```

### For FormData uploads:

```typescript
const response = await apiRequest(ENDPOINTS.UPLOAD, {
  method: "POST",
  body: formData, // apiRequest handles FormData properly
});
```

## Testing Checklist

After each fix:

1. Test as WORKER profile
2. Test as CLIENT profile
3. Switch profiles and verify data changes correctly
4. Check backend logs for correct profile_type in JWT

## Priority Order

1. Fix hooks first (lib/hooks/\*.ts) - affects entire app
2. Fix component-level fetches second
3. Test thoroughly with dual-profile account
