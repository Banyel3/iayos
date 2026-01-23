# Dual Profile System Implementation

**Status**: ✅ COMPLETE  
**Date**: November 23, 2025  
**Type**: Account Management Feature

## Overview

Users can now have both WORKER and CLIENT profiles on the same account, allowing them to seamlessly switch between hiring workers and offering services.

## Features

### 1. Profile Status Detection

- Backend checks which profiles exist for an account
- Returns current profile type and available profiles
- Endpoint: `GET /api/mobile/profile/dual-status`

### 2. Profile Creation

- **Create Client Profile** (from Worker account)
  - Endpoint: `POST /api/mobile/profile/create-client`
  - Copies basic info from worker profile
  - Creates blank ClientProfile with default values
- **Create Worker Profile** (from Client account)
  - Endpoint: `POST /api/mobile/profile/create-worker`
  - Copies basic info from client profile
  - Creates blank WorkerProfile with default values

### 3. Profile Switching UI

#### Worker Account UI:

- **Has Client Profile**: Shows "Switch to Client Profile" button
  - Icon: briefcase
  - Description: "Post jobs and hire workers"
  - Action: Logout and re-login with CLIENT profile

- **No Client Profile**: Shows "Want to hire workers too?" card
  - Icon: briefcase-outline
  - Description: Explains benefits of client profile
  - Button: "Create Client Profile"
  - Action: Creates client profile via API

#### Client Account UI:

- **Has Worker Profile**: Shows "Switch to Worker Profile" button
  - Icon: hammer
  - Description: "Find jobs and offer your services"
  - Action: Logout and re-login with WORKER profile

- **No Worker Profile**: Shows "Want to work on jobs too?" card
  - Icon: hammer-outline
  - Description: Explains benefits of worker profile
  - Button: "Create Worker Profile"
  - Action: Creates worker profile via API

## Implementation Details

### Backend (Django)

**Files Modified**:

- `apps/backend/src/accounts/mobile_api.py` (+200 lines)
  - Added 3 new endpoints in dual profile management section

**Endpoints**:

```python
@mobile_router.get("/profile/dual-status", auth=jwt_auth)
@mobile_router.post("/profile/create-client", auth=jwt_auth)
@mobile_router.post("/profile/create-worker", auth=jwt_auth)
```

**Profile Creation Logic**:

- Checks if profile already exists (prevents duplicates)
- Copies basic info (name, contact, birthdate, avatar) from existing profile
- Creates profile with opposite type (WORKER ↔ CLIENT)
- Creates corresponding WorkerProfile or ClientProfile entry
- Returns success with new profile ID

### Frontend (React Native)

**Files Created** (1 file):

- `lib/hooks/useDualProfile.ts` (123 lines)
  - `useDualProfileStatus()` - Get profile status
  - `useCreateClientProfile()` - Create client profile
  - `useCreateWorkerProfile()` - Create worker profile

**Files Modified** (2 files):

- `lib/api/config.ts` - Added 3 endpoints
- `app/(tabs)/profile.tsx` - Added profile switcher UI (+250 lines)

**UI Components**:

1. **Switch Profile Card** (when other profile exists)
   - White card with shadow
   - Icon in colored circle
   - Title and description
   - Chevron indicator

2. **Create Profile Card** (when other profile doesn't exist)
   - White card with shadow
   - Header with icon and title
   - Description text
   - Create button with loading state

### User Flow

#### Creating Second Profile:

1. User taps "Create [Type] Profile" button
2. Confirmation dialog appears explaining the feature
3. User confirms creation
4. API call creates new profile with copied basic info
5. Success toast appears
6. Profile status refreshes automatically

#### Switching Profiles:

1. User taps "Switch to [Type] Profile" button
2. Warning dialog appears (logout required)
3. User confirms switch
4. App logs out user
5. User logs back in
6. Backend returns token for other profile type
7. App loads with switched profile

## Profile Data Handling

### Copied Between Profiles:

- ✅ First Name
- ✅ Middle Name
- ✅ Last Name
- ✅ Contact Number
- ✅ Birth Date
- ✅ Profile Image/Avatar

### NOT Copied (Profile-Specific):

- ❌ Bio/Description
- ❌ Ratings
- ❌ Earnings/Jobs Posted
- ❌ Skills/Categories
- ❌ Certifications
- ❌ Portfolio
- ❌ Materials

## Technical Notes

### Why Logout for Switching?

- JWT tokens contain profile type in claims
- Each login session is tied to one profile type
- Backend authentication checks profile type for permissions
- Logout ensures clean session management

### Profile Type Determination:

- Login endpoint returns user with most recent profile by default
- Future: Could add "last used profile" preference
- Future: Could add profile selector during login

## Testing Checklist

- [ ] Worker can see client profile option
- [ ] Client can see worker profile option
- [ ] Creating client profile works (from worker)
- [ ] Creating worker profile works (from client)
- [ ] Basic info copied correctly
- [ ] Switch button appears after creation
- [ ] Logout warning shows when switching
- [ ] Profile status refreshes after creation
- [ ] Toast notifications appear correctly
- [ ] Loading states work during creation
- [ ] Error handling for duplicate profiles
- [ ] Error handling for failed API calls

## Future Enhancements

1. **Profile Selector During Login**
   - If user has both profiles, show selector
   - Remember last used profile preference

2. **Quick Switch Without Logout**
   - Generate new token with different profile type
   - Switch in-app without full logout

3. **Profile Type Badge**
   - Show indicator when both profiles exist
   - Quick access to switch from any screen

4. **Profile Activity Summary**
   - Show stats for both profiles
   - Compare earnings/jobs across profiles

## Statistics

- **Backend**: +200 lines (3 endpoints)
- **Frontend**: +373 lines (1 hook file + UI updates)
- **Total**: ~573 lines of production code
- **Time**: ~2 hours implementation

---

**Status**: ✅ Feature complete and ready for testing
