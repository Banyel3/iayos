# Authentication Wiring Fix - Mobile App

## 🔧 Issues Fixed

**Date:** November 8, 2025
**Problem:** Mobile app wasn't properly wired to mobile endpoints, causing authentication failures

---

## ❌ Problems Identified

### 1. Wrong Authentication Method
**Issue:** Mobile endpoints were using `cookie_auth` but mobile apps send `Bearer` tokens

**Error logs:**
```
🔐 CookieJWTAuth CALLED!
🔐 All cookies: {}
🔐 Access token present: False
❌ No access token in cookies
Unauthorized: /api/mobile/auth/profile
```

**Root Cause:**
- Mobile app sends: `Authorization: Bearer {token}`
- Backend expected: Cookie with token
- `cookie_auth` looks for cookies, not headers

### 2. JsonResponse Double-Wrapping
**Issue:** `generateCookie()` returns `JsonResponse` object, which Django Ninja was wrapping again

**Result:** Mobile app received malformed response with nested JSON

### 3. Refresh Token Method Mismatch
**Issue:** Refresh endpoint expected cookie, but mobile sends Bearer token

**Flutter code was:**
```dart
'Cookie': 'refresh=$refreshToken'  // ❌ Wrong for mobile
```

---

## ✅ Solutions Applied

### 1. Changed Authentication to Bearer Tokens

**File:** `apps/backend/src/accounts/mobile_api.py`

**Before:**
```python
from .authentication import cookie_auth

@mobile_router.get("/auth/profile", auth=cookie_auth)
```

**After:**
```python
from .authentication import jwt_auth  # Use Bearer token auth

@mobile_router.get("/auth/profile", auth=jwt_auth)
```

**Applied to all mobile endpoints:**
- `/auth/profile` ✅
- `/auth/logout` ✅
- `/auth/assign-role` ✅
- `/jobs/list` ✅
- `/jobs/{id}` ✅
- `/jobs/create` ✅
- `/jobs/search` ✅
- `/jobs/categories` ✅

### 2. Fixed JsonResponse Unwrapping

**File:** `apps/backend/src/accounts/mobile_api.py`

**Login endpoint fix:**
```python
@mobile_router.post("/auth/login")
def mobile_login(request, payload: logInSchema):
    from .services import login_account
    import json

    try:
        result = login_account(payload)

        # login_account returns JsonResponse, extract the content
        if hasattr(result, 'content'):
            # It's a JsonResponse, extract the JSON data
            response_data = json.loads(result.content.decode('utf-8'))
            return response_data
        else:
            # It's already a dict
            return result
```

**Why this works:**
- `login_account()` → `generateCookie()` → `JsonResponse`
- Extract `.content` from JsonResponse
- Decode and parse JSON
- Return as plain dict
- Django Ninja serializes correctly

### 3. Fixed Refresh Token Endpoint

**Backend change:**
```python
@mobile_router.post("/auth/refresh")  # No auth required to refresh
def mobile_refresh_token(request):
    import json

    try:
        # Get refresh token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return Response(
                {"error": "Refresh token required in Authorization header"},
                status=401
            )

        refresh_token_value = auth_header.replace('Bearer ', '')

        result = refresh_token_service(refresh_token_value)

        # Extract JSON from JsonResponse if needed
        if hasattr(result, 'content'):
            response_data = json.loads(result.content.decode('utf-8'))
            return response_data
        else:
            return result
```

**Flutter change:**
```dart
final response = await http.post(
  Uri.parse(ApiConfig.getUrl(ApiConfig.refreshToken)),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $refreshToken',  // ✅ Correct
  },
);
```

---

## 🎯 How Authentication Works Now

### Login Flow

**1. Flutter App:**
```dart
// User enters credentials
POST /api/mobile/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**2. Backend:**
```python
# mobile_login endpoint
→ login_account(payload)
  → Validate credentials
  → generateCookie(user)
    → Create access_token (1 hour)
    → Create refresh_token (7 days)
    → Return JsonResponse with tokens
→ Extract JSON from JsonResponse
→ Return plain dict
```

**3. Response:**
```json
{
  "message": "Login Successful",
  "access": "eyJhbGc...",
  "refresh": "eyJhbGc...",
  "user": {
    "accountID": 123,
    "email": "user@example.com",
    "isVerified": true
  }
}
```

**4. Flutter App:**
```dart
// Store tokens
await _storage.write(key: 'access_token', value: data['access']);
await _storage.write(key: 'refresh_token', value: data['refresh']);
```

### Authenticated Request Flow

**1. Flutter App:**
```dart
final accessToken = await _storage.read(key: 'access_token');

final response = await http.get(
  Uri.parse(ApiConfig.userProfile),
  headers: {
    'Authorization': 'Bearer $accessToken',  // ✅
  },
);
```

**2. Backend:**
```python
@mobile_router.get("/auth/profile", auth=jwt_auth)
#                                         ↑
#                                    Extracts Bearer token
def mobile_get_profile(request):
    user = request.auth  # ✅ Authenticated user object
    result = fetch_currentUser(user.accountID)
    return result
```

**3. JWTBearer Auth:**
```python
class JWTBearer(HttpBearer):
    def authenticate(self, request, token):
        # Extract token from "Authorization: Bearer {token}"
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        user = Accounts.objects.get(accountID=user_id)
        return user  # ✅ Returns user to request.auth
```

### Token Refresh Flow

**1. Flutter App (when 401 received):**
```dart
final refreshToken = await _storage.read(key: 'refresh_token');

final response = await http.post(
  Uri.parse(ApiConfig.refreshToken),
  headers: {
    'Authorization': 'Bearer $refreshToken',  // ✅
  },
);
```

**2. Backend:**
```python
@mobile_router.post("/auth/refresh")  # No auth needed
def mobile_refresh_token(request):
    # Extract refresh token from header
    auth_header = request.headers.get('Authorization', '')
    refresh_token_value = auth_header.replace('Bearer ', '')

    # Validate and create new access token
    result = refresh_token_service(refresh_token_value)
    return result  # New access token
```

**3. Response:**
```json
{
  "access": "eyJhbGc...",  // New access token
  "message": "Token refreshed successfully"
}
```

**4. Flutter App:**
```dart
await _storage.write(key: 'access_token', value: data['access']);
// Retry original request
```

---

## 📊 Comparison: Web vs Mobile

| Feature | Web (`/api/accounts/`) | Mobile (`/api/mobile/`) |
|---------|------------------------|-------------------------|
| **Auth Type** | Cookie-based | Bearer token |
| **Token Storage** | httpOnly cookies | FlutterSecureStorage |
| **Auth Header** | `Cookie: access={token}` | `Authorization: Bearer {token}` |
| **Auth Class** | `cookie_auth` | `jwt_auth` |
| **Token Refresh** | Cookie with refresh token | Bearer token in header |
| **Response Format** | JsonResponse (for Next.js) | Plain dict (for mobile) |

---

## ✅ Testing Checklist

### Backend
- [x] Mobile login returns tokens in JSON body
- [x] JWT Bearer auth accepts Authorization header
- [x] Profile endpoint works with Bearer token
- [x] Assign role works with Bearer token
- [x] Refresh token works with Bearer token
- [x] Job endpoints work with Bearer token

### Flutter
- [x] Login stores tokens correctly
- [x] All requests include Authorization header
- [x] Profile loads after login
- [x] Token refresh works on 401
- [x] Logout clears tokens

---

## 🔍 Debug Logs

### Successful Authentication
```
==========================================================
🔐 JWTBearer CALLED!
🔐 Request path: /api/mobile/auth/profile
🔐 Token present: True
🔐 Token validated - User ID: 123
✅ Authentication SUCCESS - User: user@example.com
HTTP GET /api/mobile/auth/profile 200
```

### Failed Authentication
```
==========================================================
🔐 JWTBearer CALLED!
🔐 Request path: /api/mobile/auth/profile
🔐 Token present: False
❌ No token provided
HTTP GET /api/mobile/auth/profile 401
```

---

## 📝 Files Modified

### Backend
1. `apps/backend/src/accounts/mobile_api.py`
   - Changed all `auth=cookie_auth` to `auth=jwt_auth`
   - Fixed login to unwrap JsonResponse
   - Fixed refresh token to accept Bearer header

### Flutter
1. `apps/frontend_mobile/iayos_mobile/lib/services/auth_service.dart`
   - Changed refresh token to use `Authorization: Bearer`

---

## ⚠️ Important Notes

### Web App Not Affected
- Web endpoints (`/api/accounts/`) still use cookies ✅
- `cookie_auth` still works for Next.js ✅
- No changes to web authentication ✅

### Mobile-Only Changes
- Only `/api/mobile/` endpoints modified ✅
- Complete separation from web auth ✅
- Independent authentication flow ✅

### Security
- Bearer tokens transmitted over HTTPS only (production)
- Tokens stored encrypted in FlutterSecureStorage
- 1-hour access token expiration
- 7-day refresh token expiration
- No token in URL or logs

---

## 🚀 Status

**Authentication:** ✅ Fixed and Working
**Profile Loading:** ✅ Working
**Token Refresh:** ✅ Working
**All Mobile Endpoints:** ✅ Properly Authenticated

**Ready for:** Week 2 Flutter UI development

---

**Last Updated:** November 8, 2025
**Issue:** Authentication wiring
**Status:** ✅ Resolved
