# 🗺️ GPS Location Tracking - Complete Technical Flowchart

## 📋 Table of Contents

1. [Component Mount Flow](#1-component-mount-flow)
2. [User Clicks Toggle ON Flow](#2-user-clicks-toggle-on-flow)
3. [Browser Permission Flow](#3-browser-permission-flow)
4. [Backend Processing Flow](#4-backend-processing-flow)
5. [Database Flow](#5-database-flow)
6. [Refresh Location Flow](#6-refresh-location-flow)
7. [Toggle OFF Flow](#7-toggle-off-flow)
8. [Find Nearby Workers Flow](#8-find-nearby-workers-flow)

---

## 1. 📱 Component Mount Flow

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION: Opens Page with Navbar                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: desktop-sidebar.tsx OR mobile-nav.tsx                │
│  LINE: Component renders                                    │
│  - Desktop: Location icon in top navbar                     │
│  - Mobile: Location button in bottom nav (5th button)       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION: Clicks location icon/button                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: desktop-sidebar.tsx OR mobile-nav.tsx                │
│  FUNCTION: setShowLocationModal(true)                       │
│  ACTION: Opens modal overlay                                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  COMPONENT: LocationToggle renders inside modal             │
│  STATE: locationEnabled = false (initial)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  HOOK: useEffect() runs on mount                            │
│  LINE: 23-27                                                │
│  CONDITION: if (isAuthenticated)                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: checkLocationStatus()                            │
│  LINE: 29-49                                                │
│  ACTION: Check if user already has location enabled         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  HTTP REQUEST:                                              │
│  METHOD: GET                                                │
│  URL: http://localhost:8000/api/accounts/location/me       │
│  HEADERS:                                                   │
│    - Accept: application/json                               │
│    - Cookie: access_token (auto-sent via credentials)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND FILE: accounts/api.py                              │
│  ENDPOINT: @router.get("/location/me")                      │
│  LINE: 455-471                                              │
│  AUTH: cookie_auth (validates JWT token)                    │
│  FUNCTION: get_my_location(request)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND FILE: accounts/services.py                         │
│  FUNCTION: get_user_location(account_id)                    │
│  LINE: 1058-1074                                            │
│  ACTION: Query database for user's profile                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE QUERY:                                            │
│  SELECT latitude, longitude, location_updated_at,           │
│         location_sharing_enabled                            │
│  FROM accounts_profile                                      │
│  WHERE accountFK_id = {user_account_id}                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  RESPONSE TO FRONTEND:                                      │
│  {                                                          │
│    "profile_id": 123,                                       │
│    "latitude": null,                                        │
│    "longitude": null,                                       │
│    "location_updated_at": null,                             │
│    "location_sharing_enabled": false,                       │
│    "message": "Location retrieved successfully"             │
│  }                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: checkLocationStatus() - response handling        │
│  LINE: 40-45                                                │
│  STATE UPDATES:                                             │
│    - setLocationEnabled(false)                              │
│    - setLastUpdate(null)                                    │
│  UI SHOWS: Gray toggle, "Enable to help find workers"      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 🔘 User Clicks Toggle ON Flow

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION: Clicks toggle switch to enable location       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  ELEMENT: <button onClick={handleToggle}>                   │
│  LINE: 283                                                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: handleToggle()                                   │
│  LINE: 138-182                                              │
│  ACTION: Async function starts                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STATE UPDATE:                                              │
│  setLoading(true)     // Shows spinner                      │
│  setError(null)       // Clears previous errors             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CONDITION CHECK: if (!locationEnabled)                     │
│  LINE: 143                                                  │
│  RESULT: TRUE (user is enabling location)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: getCurrentLocation()                             │
│  LINE: 51-93                                                │
│  TYPE: Promise<{latitude: number, longitude: number}>       │
│  ACTION: Request GPS coordinates from browser               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌─────────────────┐                   ┌────────────────────┐
│  BROWSER CHECK  │                   │   IF SUPPORTED     │
│  navigator      │────────NO────────▶│   Reject Promise   │
│  .geolocation   │                   │   Show Error       │
│  exists?        │                   └────────────────────┘
└────────┬────────┘
         │ YES
         ▼
┌─────────────────────────────────────────────────────────────┐
│  BROWSER API CALL:                                          │
│  navigator.geolocation.getCurrentPosition(                  │
│    successCallback,                                         │
│    errorCallback,                                           │
│    options                                                  │
│  )                                                          │
│                                                             │
│  OPTIONS:                                                   │
│  {                                                          │
│    enableHighAccuracy: true,  // Use GPS, not WiFi/IP      │
│    timeout: 10000,            // 10 second timeout         │
│    maximumAge: 0              // Don't use cached data     │
│  }                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
```

---

## 3. 🔐 Browser Permission Flow

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER: Permission Request Triggered                      │
│  API: Geolocation API (Web API standard)                    │
│  SPEC: https://w3c.github.io/geolocation-api/              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BROWSER UI: Permission Prompt Appears                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📍 localhost:3000 wants to know your location     │   │
│  │                                                     │   │
│  │  [Block]                              [Allow]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  USER SEES: Native browser permission dialog                │
│  BLOCKING: Modal waits for user response                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────┐                   ┌───────────────────┐
│  USER CLICKS:    │                   │  USER CLICKS:     │
│  [Block]         │                   │  [Allow]          │
└────────┬─────────┘                   └─────────┬─────────┘
         │                                       │
         ▼                                       ▼
┌──────────────────────────┐         ┌────────────────────────┐
│  PERMISSION DENIED       │         │  PERMISSION GRANTED    │
└────────┬─────────────────┘         └─────────┬──────────────┘
         │                                     │
         ▼                                     ▼
┌──────────────────────────────────┐  ┌──────────────────────────────┐
│  errorCallback fires             │  │  successCallback fires       │
│  error.code = PERMISSION_DENIED  │  │  position object received    │
│  (value: 1)                      │  │                              │
└────────┬─────────────────────────┘  └─────────┬────────────────────┘
         │                                     │
         ▼                                     ▼
┌──────────────────────────────────┐  ┌──────────────────────────────┐
│  FILE: location-toggle.tsx       │  │  FILE: location-toggle.tsx   │
│  LINE: 67-74 (error handling)    │  │  LINE: 62-66 (success)       │
│                                  │  │                              │
│  switch(error.code) {            │  │  position.coords contains:   │
│    case PERMISSION_DENIED:       │  │  {                           │
│      errorMessage = "Location   │  │    latitude: 14.5995,        │
│      permission denied..."       │  │    longitude: 120.9842,      │
│  }                               │  │    accuracy: 20,             │
│  reject(new Error(errorMessage)) │  │    altitude: null,           │
│                                  │  │    altitudeAccuracy: null,   │
│                                  │  │    heading: null,            │
│                                  │  │    speed: null               │
│                                  │  │  }                           │
└────────┬─────────────────────────┘  │                              │
         │                            │  resolve({                    │
         ▼                            │    latitude: coords.latitude, │
┌──────────────────────────────────┐  │    longitude: coords.longitude│
│  PROMISE REJECTED                │  │  })                          │
│  catch block in handleToggle()   │  └─────────┬────────────────────┘
│  LINE: 172-177                   │            │
│                                  │            ▼
│  setError(errorMessage)          │  ┌──────────────────────────────┐
│  setLocationEnabled(false)       │  │  PROMISE RESOLVED            │
│  UI shows red error box          │  │  const {latitude, longitude} │
└──────────────────────────────────┘  │  LINE: 146                   │
                                      │                              │
                                      │  ✅ GPS COORDINATES OBTAINED │
                                      │  latitude: 14.5995           │
                                      │  longitude: 120.9842         │
                                      └─────────┬────────────────────┘
                                                │
                                                ▼
                    [Continues to Backend Update Flow]
```

### 🔍 Browser API Details:

**GeolocationPosition Object:**

```javascript
interface GeolocationPosition {
  coords: {
    latitude: number;        // Geographic latitude (-90 to 90)
    longitude: number;       // Geographic longitude (-180 to 180)
    accuracy: number;        // Accuracy in meters
    altitude: number | null; // Height above sea level
    altitudeAccuracy: number | null;
    heading: number | null;  // Direction of travel (degrees)
    speed: number | null;    // Speed in m/s
  };
  timestamp: number;         // Time when position was acquired
}
```

**Error Codes:**

```javascript
GeolocationPositionError.PERMISSION_DENIED = 1; // User denied
GeolocationPositionError.POSITION_UNAVAILABLE = 2; // GPS unavailable
GeolocationPositionError.TIMEOUT = 3; // Took too long
```

---

## 4. 🔄 Backend Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│  GPS COORDINATES OBTAINED:                                  │
│  latitude: 14.5995, longitude: 120.9842                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: handleToggle() - continues                       │
│  LINE: 149                                                  │
│  ACTION: Update location in backend                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: updateLocationInBackend(latitude, longitude)     │
│  LINE: 95-113                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  HTTP REQUEST:                                              │
│  METHOD: POST                                               │
│  URL: http://localhost:8000/api/accounts/location/update   │
│  HEADERS:                                                   │
│    - Content-Type: application/json                         │
│    - Cookie: access_token (JWT)                             │
│  BODY:                                                      │
│  {                                                          │
│    "latitude": 14.5995,                                     │
│    "longitude": 120.9842                                    │
│  }                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND FILE: accounts/api.py                              │
│  ENDPOINT: @router.post("/location/update")                 │
│  LINE: 421-445                                              │
│  AUTH: cookie_auth decorator                                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTHENTICATION MIDDLEWARE:                                 │
│  FILE: accounts/authentication.py                           │
│  CLASS: cookie_auth                                         │
│                                                             │
│  PROCESS:                                                   │
│  1. Extract JWT from cookie: request.COOKIES.get('access')  │
│  2. Decode JWT token: jwt.decode(token, SECRET_KEY)        │
│  3. Verify signature and expiration                         │
│  4. Extract user_id from token payload                      │
│  5. Query database: Accounts.objects.get(accountID=user_id) │
│  6. Attach user to request: request.auth = user             │
│                                                             │
│  IF INVALID: Return 401 Unauthorized                        │
│  IF VALID: Continue to endpoint function                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND FILE: accounts/api.py                              │
│  FUNCTION: update_location(request, payload)                │
│  LINE: 422-445                                              │
│                                                             │
│  VALIDATION:                                                │
│  - payload.latitude: float (validated by Pydantic)          │
│  - payload.longitude: float (validated by Pydantic)         │
│  - user = request.auth (authenticated user object)          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND FILE: accounts/services.py                         │
│  FUNCTION: update_user_location(account_id, lat, lon)       │
│  LINE: 994-1027                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE QUERY:                                            │
│  ORM: Django QuerySet                                       │
│  MODEL: Profile (accounts/models.py)                        │
│                                                             │
│  QUERY:                                                     │
│  profile = Profile.objects.filter(                          │
│    accountFK_id=account_id                                  │
│  ).first()                                                  │
│                                                             │
│  SQL EQUIVALENT:                                            │
│  SELECT * FROM accounts_profile                             │
│  WHERE accountFK_id = {account_id}                          │
│  LIMIT 1;                                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────┐                   ┌────────────────────┐
│  IF NOT FOUND    │                   │  IF FOUND          │
│  profile = None  │                   │  Update fields     │
└────────┬─────────┘                   └─────────┬──────────┘
         │                                       │
         ▼                                       ▼
┌──────────────────────────────────┐  ┌──────────────────────────────┐
│  raise ValueError(               │  │  profile.latitude = 14.5995  │
│    "Profile not found"           │  │  profile.longitude = 120.9842│
│  )                               │  │  profile.location_updated_at │
│                                  │  │    = timezone.now()          │
│  Returns 400 error to frontend   │  │  profile.location_sharing_   │
└──────────────────────────────────┘  │    enabled = True            │
                                      └─────────┬────────────────────┘
                                                │
                                                ▼
                                [Continues to Database Save Flow]
```

---

## 5. 💾 Database Flow

```
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: Profile object with updated location data         │
│  profile.latitude = 14.5995                                 │
│  profile.longitude = 120.9842                               │
│  profile.location_updated_at = 2025-10-10 15:30:45         │
│  profile.location_sharing_enabled = True                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND FILE: accounts/services.py                         │
│  LINE: 1018                                                 │
│  COMMAND: profile.save()                                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  DJANGO ORM: Generates SQL UPDATE statement                 │
│                                                             │
│  SQL:                                                       │
│  UPDATE accounts_profile                                    │
│  SET                                                        │
│    latitude = 14.5995,                                      │
│    longitude = 120.9842,                                    │
│    location_updated_at = '2025-10-10 15:30:45',            │
│    location_sharing_enabled = TRUE                          │
│  WHERE profileID = 123;                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE: PostgreSQL                                       │
│  TABLE: accounts_profile                                    │
│                                                             │
│  BEFORE:                                                    │
│  ┌────────────┬──────────┬───────────┬────────────────┐    │
│  │ profileID  │ latitude │ longitude │ location_...   │    │
│  ├────────────┼──────────┼───────────┼────────────────┤    │
│  │ 123        │ NULL     │ NULL      │ FALSE          │    │
│  └────────────┴──────────┴───────────┴────────────────┘    │
│                                                             │
│  AFTER:                                                     │
│  ┌────────────┬──────────┬───────────┬────────────────┐    │
│  │ profileID  │ latitude │ longitude │ location_...   │    │
│  ├────────────┼──────────┼───────────┼────────────────┤    │
│  │ 123        │ 14.5995  │ 120.9842  │ TRUE           │    │
│  └────────────┴──────────┴───────────┴────────────────┘    │
│                                                             │
│  ✅ 1 ROW UPDATED                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND FILE: accounts/services.py                         │
│  FUNCTION: update_user_location() - return statement        │
│  LINE: 1020-1027                                            │
│                                                             │
│  RETURN:                                                    │
│  {                                                          │
│    "profile_id": 123,                                       │
│    "latitude": 14.5995,                                     │
│    "longitude": 120.9842,                                   │
│    "location_updated_at": "2025-10-10T15:30:45Z",          │
│    "location_sharing_enabled": true,                        │
│    "message": "Location updated successfully"               │
│  }                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND FILE: accounts/api.py                              │
│  ENDPOINT: update_location() - return                       │
│  LINE: 435                                                  │
│  HTTP STATUS: 200 OK                                        │
│  RESPONSE: LocationResponseSchema                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  HTTP RESPONSE TO FRONTEND:                                 │
│  {                                                          │
│    "profile_id": 123,                                       │
│    "latitude": 14.5995,                                     │
│    "longitude": 120.9842,                                   │
│    "location_updated_at": "2025-10-10T15:30:45Z",          │
│    "location_sharing_enabled": true,                        │
│    "message": "Location updated successfully"               │
│  }                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: updateLocationInBackend() - response             │
│  LINE: 111                                                  │
│  ACTION: return await response.json()                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: handleToggle() - continues                       │
│  LINE: 150                                                  │
│  VARIABLE: updateResult contains response                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  NEXT STEP: Enable location sharing flag                    │
│  FILE: location-toggle.tsx                                  │
│  LINE: 153-155                                              │
│  FUNCTION: toggleLocationSharing(true)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  HTTP REQUEST:                                              │
│  METHOD: POST                                               │
│  URL: /api/accounts/location/toggle-sharing                 │
│  BODY: { "enabled": true }                                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: Similar flow as update                            │
│  - Validates request                                        │
│  - Updates profile.location_sharing_enabled = True          │
│  - Saves to database                                        │
│  - Returns success response                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: handleToggle() - final steps                     │
│  LINE: 157-169                                              │
│                                                             │
│  STATE UPDATES:                                             │
│  - setLocationEnabled(true)                                 │
│  - setLastUpdate(new Date().toLocaleString())              │
│  - onLocationUpdate(latitude, longitude) // callback        │
│  - setError(null)                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  UI UPDATE:                                                 │
│  - Toggle switch turns BLUE                                 │
│  - Shows "Your location is being shared..."                 │
│  - Displays timestamp: "Last updated: 10/10/2025, 3:30 PM" │
│  - Refresh button becomes visible                           │
│  - Loading spinner disappears                               │
│                                                             │
│  ✅ LOCATION TRACKING ENABLED                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 🔄 Refresh Location Flow

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION: Clicks "Refresh" button                       │
│  (Only visible when location is enabled)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  ELEMENT: <button onClick={refreshLocation}>                │
│  LINE: 324                                                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: refreshLocation()                                │
│  LINE: 184-210                                              │
│                                                             │
│  GUARD CHECK: if (!locationEnabled) return;                 │
│  (Prevents refresh if location is disabled)                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SAME FLOW AS INITIAL ENABLE:                               │
│  1. Call getCurrentLocation()                               │
│     → Browser Geolocation API                               │
│     → Gets fresh GPS coordinates                            │
│                                                             │
│  2. Call updateLocationInBackend(lat, lon)                  │
│     → POST /api/accounts/location/update                    │
│     → Updates database                                      │
│                                                             │
│  3. Update UI                                               │
│     → setLastUpdate(new Date())                             │
│     → Shows new timestamp                                   │
│                                                             │
│  DIFFERENCE: No toggle sharing step (already enabled)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. ⏹️ Toggle OFF Flow

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION: Clicks toggle switch to disable location      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: handleToggle()                                   │
│  LINE: 138-182                                              │
│                                                             │
│  CONDITION: if (!locationEnabled) → FALSE                   │
│  ELSE BLOCK: LINE 171-174                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE: location-toggle.tsx                                  │
│  FUNCTION: toggleLocationSharing(false)                     │
│  LINE: 115-130                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  HTTP REQUEST:                                              │
│  METHOD: POST                                               │
│  URL: /api/accounts/location/toggle-sharing                 │
│  BODY: { "enabled": false }                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: accounts/api.py                                   │
│  ENDPOINT: toggle_location_sharing_endpoint()               │
│  LINE: 474-492                                              │
│                                                             │
│  → Calls toggle_location_sharing(account_id, False)         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: accounts/services.py                              │
│  FUNCTION: toggle_location_sharing()                        │
│  LINE: 1030-1056                                            │
│                                                             │
│  DATABASE UPDATE:                                           │
│  UPDATE accounts_profile                                    │
│  SET location_sharing_enabled = FALSE                       │
│  WHERE profileID = 123;                                     │
│                                                             │
│  NOTE: Latitude/longitude data is NOT deleted               │
│        (Privacy: keeps last known location private)         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: State updates                                    │
│  - setLocationEnabled(false)                                │
│  - Toggle switch turns GRAY                                 │
│  - Text: "Enable to help find workers near you"            │
│  - Timestamp hidden                                         │
│  - Refresh button hidden                                    │
│                                                             │
│  ✅ LOCATION TRACKING DISABLED                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 🗺️ Find Nearby Workers Flow

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: Client wants to find workers                     │
│  FILE: app/dashboard/home/page.tsx (example)                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  HTTP REQUEST:                                              │
│  METHOD: POST                                               │
│  URL: /api/accounts/location/nearby-workers                 │
│  BODY:                                                      │
│  {                                                          │
│    "latitude": 14.5995,      // Client's location          │
│    "longitude": 120.9842,                                   │
│    "radius_km": 10.0,        // Search within 10km         │
│    "specialization_id": 3    // Optional: filter by skill  │
│  }                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: accounts/api.py                                   │
│  ENDPOINT: get_nearby_workers()                             │
│  LINE: 495-513                                              │
│  AUTH: NOT REQUIRED (public endpoint)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: accounts/services.py                              │
│  FUNCTION: find_nearby_workers()                            │
│  LINE: 1103-1182                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE QUERY:                                            │
│  SELECT * FROM accounts_profile                             │
│  WHERE                                                      │
│    profileType = 'WORKER'                                   │
│    AND location_sharing_enabled = TRUE                      │
│    AND latitude IS NOT NULL                                 │
│    AND longitude IS NOT NULL;                               │
│                                                             │
│  RETURNS: All workers with active location sharing          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PYTHON: Loop through each worker                           │
│  FILE: accounts/services.py                                 │
│  LINE: 1126-1177                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FUNCTION: calculate_distance()                             │
│  LINE: 1077-1100                                            │
│  ALGORITHM: Haversine Formula                               │
│                                                             │
│  INPUT:                                                     │
│  - lat1: 14.5995 (client)                                   │
│  - lon1: 120.9842 (client)                                  │
│  - lat2: 14.6123 (worker)                                   │
│  - lon2: 120.9756 (worker)                                  │
│                                                             │
│  FORMULA:                                                   │
│  a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)   │
│  c = 2 × atan2(√a, √(1−a))                                  │
│  distance = R × c                                           │
│  (where R = 6371 km = Earth's radius)                       │
│                                                             │
│  OUTPUT: 2.34 km                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CHECK: distance <= radius_km?                              │
│  2.34 km <= 10.0 km → YES, include this worker              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  QUERY: Get worker's specializations                        │
│  SELECT * FROM accounts_workerspecialization                │
│  WHERE workerID = {worker_id};                              │
│                                                             │
│  JOIN with accounts_specializations table                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  IF specialization_id provided:                             │
│    Filter workers by matching specialization                │
│  ELSE:                                                      │
│    Include all workers                                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BUILD WORKER OBJECT:                                       │
│  {                                                          │
│    "profile_id": 456,                                       │
│    "worker_id": 789,                                        │
│    "first_name": "Juan",                                    │
│    "last_name": "Dela Cruz",                                │
│    "profile_img": "/worker1.jpg",                           │
│    "latitude": 14.6123,                                     │
│    "longitude": 120.9756,                                   │
│    "distance_km": 2.34,                                     │
│    "availability_status": "AVAILABLE",                      │
│    "specializations": [                                     │
│      {                                                      │
│        "id": 3,                                             │
│        "name": "Plumbing",                                  │
│        "experience_years": 5,                               │
│        "certification": "Licensed Plumber"                  │
│      }                                                      │
│    ]                                                        │
│  }                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  REPEAT for all workers in database                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SORT: nearby_workers.sort(key=lambda x: x['distance_km']) │
│  LINE: 1179                                                 │
│                                                             │
│  RESULT: Workers ordered by distance (closest first)        │
│  [                                                          │
│    {distance_km: 2.34, ...},  // Closest                   │
│    {distance_km: 4.12, ...},                                │
│    {distance_km: 7.89, ...},                                │
│    {distance_km: 9.45, ...}   // Farthest within radius    │
│  ]                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  HTTP RESPONSE:                                             │
│  {                                                          │
│    "workers": [                                             │
│      { /* worker 1 - 2.34 km away */ },                     │
│      { /* worker 2 - 4.12 km away */ },                     │
│      { /* worker 3 - 7.89 km away */ },                     │
│      { /* worker 4 - 9.45 km away */ }                      │
│    ],                                                       │
│    "count": 4,                                              │
│    "search_location": {                                     │
│      "latitude": 14.5995,                                   │
│      "longitude": 120.9842,                                 │
│      "radius_km": 10.0                                      │
│    }                                                        │
│  }                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: Display workers sorted by distance               │
│  FILE: app/dashboard/home/page.tsx                          │
│  COMPONENT: "Workers Near You" section                      │
│                                                             │
│  UI SHOWS:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Workers Near You                                    │   │
│  │                                                     │   │
│  │ [Juan Dela Cruz]  ⭐4.9  📍2.3 km   ₱380/hr        │   │
│  │ [Maria Santos]    ⭐4.8  📍4.1 km   ₱450/hr        │   │
│  │ [Pedro Reyes]     ⭐4.7  📍7.9 km   ₱320/hr        │   │
│  │ [Ana Lopez]       ⭐5.0  📍9.5 km   ₱500/hr        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ✅ WORKERS DISPLAYED SORTED BY PROXIMITY                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Key Technologies Used

### Frontend:

- **React Hooks**: useState, useEffect for state management
- **Geolocation API**: `navigator.geolocation.getCurrentPosition()`
- **Fetch API**: HTTP requests with credentials
- **TypeScript**: Type safety for location data
- **Tailwind CSS**: UI styling

### Backend:

- **Django**: Web framework
- **Django Ninja**: API framework (FastAPI-style)
- **JWT**: Cookie-based authentication
- **Pydantic**: Request/response validation
- **Django ORM**: Database queries
- **PostgreSQL**: Database storage

### Browser APIs:

- **Geolocation API**: GPS coordinate access
- **Permissions API**: Location permission management
- **Cookies API**: JWT token storage

### Mathematical:

- **Haversine Formula**: Distance calculation between GPS coordinates
- **Python math library**: sin, cos, asin, sqrt, radians

---

## 📊 Data Flow Summary

```
User Click
    ↓
React Component (location-toggle.tsx)
    ↓
Browser Geolocation API (navigator.geolocation)
    ↓
Permission Dialog (Browser Native)
    ↓
GPS Coordinates (latitude, longitude)
    ↓
Fetch API (POST /api/accounts/location/update)
    ↓
Django Ninja Endpoint (accounts/api.py)
    ↓
JWT Authentication (cookie_auth)
    ↓
Service Function (accounts/services.py)
    ↓
Django ORM Query (Profile.objects.filter())
    ↓
PostgreSQL Database (UPDATE accounts_profile)
    ↓
HTTP Response (200 OK with location data)
    ↓
React State Update (setLocationEnabled, setLastUpdate)
    ↓
UI Re-render (blue toggle, timestamp display)
```

---

## 🎯 Complete File Tree

```
Frontend:
├── components/ui/location-toggle.tsx       [Main location component]
├── components/ui/desktop-sidebar.tsx       [Desktop nav with location]
├── components/ui/mobile-nav.tsx            [Mobile nav with location]
└── app/dashboard/home/page.tsx             [Uses location for workers]

Backend:
├── accounts/models.py                      [Profile model with GPS fields]
├── accounts/schemas.py                     [Request/response schemas]
├── accounts/services.py                    [Business logic]
├── accounts/api.py                         [API endpoints]
└── accounts/authentication.py              [JWT cookie auth]

Database:
└── accounts_profile table
    ├── latitude (DECIMAL 10,8)
    ├── longitude (DECIMAL 11,8)
    ├── location_updated_at (TIMESTAMP)
    └── location_sharing_enabled (BOOLEAN)
```

This flowchart shows every step from click to database! 🎉
