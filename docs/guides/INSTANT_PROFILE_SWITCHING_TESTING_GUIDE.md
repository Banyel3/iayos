# Testing Guide - Instant Profile Switching + Dual Profile Fixes ✅

**Status**: ✅ Ready for Testing  
**Backend**: Running on port 8000  
**Priority**: HIGH - Critical UX feature

---

## 🧪 Test Scenarios

### Scenario 1: Job List with Dual Profile ✅

**Fixed**: Line 124 dual profile error

**Steps**:

1. Login with account that has BOTH worker and client profiles
   - Example: `dump.temp.27@gmail.com`
2. Navigate to Jobs tab in mobile app
3. Browse available jobs

**Expected**:

- ✅ Jobs list loads successfully
- ✅ No 400 error "get() returned more than one Profile"
- ✅ "Apply" button shows correctly for jobs you haven't applied to
- ✅ "Applied" status shows for jobs you have applied to

**Status**: FIXED (was returning 400, now should work)

---

### Scenario 2: Switch to Client Profile ✅

**Fixed**: Profile switching + worker list (line 1160)

**Steps**:

1. While on WORKER profile, tap "Switch to Client Profile" button
2. Wait for success toast
3. Navigate to Browse Workers screen (if available in client mode)

**Expected**:

- ✅ Profile switches instantly (~2 seconds)
- ✅ No logout/login required
- ✅ Success toast appears
- ✅ Profile screen updates to show "CLIENT" badge
- ✅ Worker list loads successfully (no 400 error)

**Status**: FIXED (was returning 400 on worker list, now should work)

---

### Scenario 3: Switch Back to Worker Profile ✅

**Steps**:

1. While on CLIENT profile, tap "Switch to Worker Profile" button
2. Wait for success toast
3. Navigate back to Jobs tab

**Expected**:

- ✅ Profile switches back instantly
- ✅ Jobs list still works
- ✅ Can apply to jobs again
- ✅ Active jobs show correctly

**Status**: SHOULD WORK (all endpoints fixed)

---

### Scenario 4: Profile Operations After Switching ✅

**Fixed**: Lines 1043 (update), 1089 (avatar), 1695 (my jobs)

**Steps**:

1. Switch to CLIENT profile
2. Navigate to Profile → Edit Profile
3. Update your name
4. Save changes
5. Navigate to My Requests (CLIENT view of posted jobs)

**Expected**:

- ✅ Profile update saves to CLIENT profile only
- ✅ My Requests shows your posted jobs (as CLIENT)
- ✅ No 400 errors

**Steps** (continued):

1. Switch back to WORKER profile
2. Navigate to My Jobs (WORKER view)

**Expected**:

- ✅ My Jobs shows your applied/active jobs (as WORKER)
- ✅ Different data than CLIENT "My Requests"

**Status**: SHOULD WORK (fallback logic added)

---

### Scenario 5: Next Login Remembers Profile ✅

**Steps**:

1. Switch to CLIENT profile
2. Close and restart the mobile app
3. Login with same account

**Expected**:

- ✅ Logs directly into CLIENT profile (last used)
- ✅ No need to switch again

**Steps** (verify):

1. Close app again
2. Switch to WORKER profile
3. Close and restart app
4. Login again

**Expected**:

- ✅ Logs into WORKER profile now (last used)

**Status**: SHOULD WORK (backend fetches most recent profile)

---

## 🔍 Edge Cases to Test

### Edge Case 1: Single Profile User (Backwards Compatible)

**Steps**:

1. Login with account that has ONLY worker profile
2. Browse jobs, apply, etc.

**Expected**:

- ✅ Everything works normally
- ✅ No "Switch Profile" button shows (only one profile)
- ✅ No errors

**Status**: SHOULD WORK (fallback logic handles this)

---

### Edge Case 2: Network Errors During Switch

**Steps**:

1. Turn off WiFi/data
2. Tap "Switch to Client Profile"

**Expected**:

- ✅ Error toast appears
- ✅ Profile does NOT switch
- ✅ User stays on current profile
- ✅ Can retry after reconnecting

**Status**: Frontend has error handling

---

### Edge Case 3: Rapid Profile Switching

**Steps**:

1. Tap "Switch to Client"
2. Immediately tap "Switch to Worker" (before first completes)

**Expected**:

- ✅ Buttons disabled during switch
- ✅ No race conditions
- ✅ Final profile is last requested

**Status**: Frontend has loading states

---

## 🐛 What Was Broken (Before Fixes)

### Error Messages You Should NO LONGER See:

1. **Job List**:

   ```
   ❌ "get() returned more than one Profile -- it returned 2!"
   ❌ HTTP 400 Bad Request on /api/mobile/jobs/list
   ```

   **Status**: FIXED ✅ (line 124)

2. **Worker List**:

   ```
   ❌ "get() returned more than one Profile -- it returned 2!"
   ❌ HTTP 400 Bad Request on /api/mobile/workers/list
   ```

   **Status**: FIXED ✅ (line 1160)

3. **My Jobs**:

   ```
   ❌ HTTP 400 on /api/mobile/jobs/my-jobs
   ```

   **Status**: FIXED ✅ (line 1695)

4. **Profile Update**:
   ```
   ❌ HTTP 400 on /api/mobile/profile/update
   ```
   **Status**: FIXED ✅ (line 1043)

---

## 📱 How to Test on Mobile

### Option 1: Using Expo Dev Client

```bash
# Start mobile app
cd apps/frontend_mobile/iayos_mobile
npx expo start

# Scan QR code with Expo Go app
# or press 'a' for Android, 'i' for iOS
```

### Option 2: Using Physical Device

1. Open Expo Go app
2. Scan QR code from terminal
3. App loads with instant profile switching enabled

### Option 3: Using curl (Backend API Testing)

```bash
# 1. Login to get token
curl -X POST http://localhost:8000/api/accounts/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dump.temp.27@gmail.com","password":"your_password"}'

# 2. Test job list (should work now)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/mobile/jobs/list

# 3. Switch profile
curl -X POST http://localhost:8000/api/mobile/profile/switch-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profile_type":"CLIENT"}'

# 4. Test worker list (should work now)
curl -H "Authorization: Bearer NEW_TOKEN" \
  http://localhost:8000/api/mobile/workers/list
```

---

## ✅ Success Criteria

### Must Pass:

- ✅ Job list loads for dual profile users
- ✅ Worker list loads after switching to CLIENT
- ✅ Profile switches instantly without logout
- ✅ Next login remembers last profile
- ✅ Profile updates save to correct profile

### Nice to Have:

- ✅ All transitions are smooth (<2 seconds)
- ✅ Toast notifications are clear
- ✅ Loading states prevent double-taps
- ✅ Error messages are helpful

---

## 🚨 If Something Still Breaks

### Debugging Steps:

1. **Check Backend Logs**:

   ```bash
   docker logs iayos-backend-dev --tail 100
   ```

   Look for: "MultipleObjectsReturned" or "Profile.objects.get"

2. **Check Mobile Console**:
   - Look for network errors (400, 500)
   - Check token structure (should include `profile_type`)

3. **Verify JWT Token**:
   - Decode token at jwt.io
   - Should contain: `{ user_id, email, profile_type: "WORKER"|"CLIENT", exp, iat }`

4. **Check Profile Type in Token**:
   ```javascript
   // In mobile app console
   const token = await AsyncStorage.getItem("accessToken");
   const decoded = jwt_decode(token);
   console.log("Profile Type:", decoded.profile_type); // Should be "WORKER" or "CLIENT"
   ```

### Report Issues:

- Screenshot of error
- Backend logs from `docker logs iayos-backend-dev`
- Steps to reproduce
- Expected vs actual behavior

---

## 📚 Documentation References

- **Full Implementation**: `docs/mobile/INSTANT_PROFILE_SWITCHING_IMPLEMENTATION.md`
- **Quick Summary**: `docs/mobile/INSTANT_PROFILE_SWITCHING_SUMMARY.md`
- **Bug Fixes**: `docs/mobile/INSTANT_PROFILE_SWITCHING_DUAL_PROFILE_FIXES.md`
- **Backend Code**: `apps/backend/src/accounts/mobile_services.py` (14 fixes)
- **Frontend Code**: `apps/frontend_mobile/iayos_mobile/context/AuthContext.tsx`

---

**Last Updated**: January 2025  
**Backend Status**: ✅ RUNNING (no errors)  
**Fixes Applied**: 14 / 14 (100%)  
**Ready for Testing**: ✅ YES
