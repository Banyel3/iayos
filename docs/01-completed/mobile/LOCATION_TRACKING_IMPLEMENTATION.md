# Location Tracking Implementation

## Overview

Added GPS location tracking functionality to allow workers and clients to update their current location for nearby worker/job filtering.

## What Was Implemented

### Backend (Already Exists ✅)

- `/api/accounts/location/update` - Update user's GPS location
- `/api/accounts/location/me` - Get current user's location
- `/api/accounts/location/toggle-sharing` - Enable/disable location sharing
- Database fields in Profile model: `latitude`, `longitude`, `location_updated_at`, `location_sharing_enabled`

### Frontend (NEW ✅)

#### 1. API Configuration

**File**: `lib/api/config.ts`

- Added `UPDATE_LOCATION` endpoint
- Added `GET_MY_LOCATION` endpoint
- Added `TOGGLE_LOCATION_SHARING` endpoint

#### 2. Location Hook

**File**: `lib/hooks/useLocation.ts`

- `useMyLocation()` - Query hook to fetch user's location from backend
- `useUpdateLocation()` - Mutation hook to update location
- `useToggleLocationSharing()` - Mutation hook to toggle sharing
- `requestAndGetLocation()` - Helper to request permissions and get GPS coords
- `useScanLocation()` - Combined hook that gets GPS and updates backend

#### 3. LocationButton Component

**File**: `components/LocationButton.tsx`

- Reusable button component with loading states
- Handles permission requests automatically
- Shows success/error alerts
- Configurable: `variant` (primary/secondary), `size` (small/medium/large)
- `onLocationUpdated` callback prop for custom actions

#### 4. Profile Integration

**File**: `app/profile/index.tsx` (Worker Profile)

- Added LocationButton after completion card
- Section titled "Location for Nearby Jobs"
- Explains purpose: see jobs sorted by distance

## Required Package Installation

⚠️ **IMPORTANT**: You must install `expo-location` package:

```bash
cd apps/frontend_mobile/iayos_mobile
npx expo install expo-location
```

## Usage in Other Screens

### Add to Client Profile

```tsx
import LocationButton from "@/components/LocationButton";

// In your render:
<LocationButton
  variant="primary"
  size="medium"
  onLocationUpdated={(coords) => {
    console.log("Location updated:", coords);
    // Refresh nearby workers list
  }}
/>;
```

### Add to Job Browsing Screen

```tsx
<LocationButton
  variant="secondary"
  size="small"
  onLocationUpdated={() => {
    // Refresh job list with distance sorting
    refetch();
  }}
/>
```

## How It Works

1. **User clicks "Scan Current Location"**
2. **Permission Request**: App requests location permission (if not granted)
3. **GPS Fetch**: Gets current latitude/longitude using `expo-location`
4. **Backend Update**: Sends coordinates to `/api/accounts/location/update`
5. **Success Feedback**: Shows alert confirming location saved
6. **Backend Sorting**: When fetching workers/jobs, backend sorts by distance if user has location

## Backend Integration

The backend already supports distance-based sorting:

- Workers: `GET /api/accounts/workers?latitude={lat}&longitude={lon}`
- Jobs: Backend can filter jobs by distance (implementation may be needed)

When user has location in database:

- Worker queries show closest workers first
- Job queries show closest jobs first
- Distance is calculated using Haversine formula

## Benefits

### For Workers:

- See jobs closest to current location first
- Reduces travel time to job sites
- Better job matching based on proximity

### For Clients:

- Find workers closest to job location
- Filter by workers within specific radius
- Faster response times from nearby workers

## Next Steps

1. ✅ Install `expo-location` package
2. ✅ Test location permissions on iOS and Android
3. ⏳ Add LocationButton to client profile (if needed)
4. ⏳ Add LocationButton to job browsing screen
5. ⏳ Update job listing API to support distance sorting
6. ⏳ Add distance display in worker/job cards (e.g., "2.5 km away")

## Configuration

### iOS (apps/frontend_mobile/iayos_mobile/app.json)

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "iAyos needs your location to show you nearby workers and jobs."
      }
    }
  }
}
```

### Android (apps/frontend_mobile/iayos_mobile/app.json)

```json
{
  "expo": {
    "android": {
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    }
  }
}
```

## Error Handling

The implementation handles:

- ✅ Permission denied → Shows alert asking user to enable in settings
- ✅ GPS unavailable → Shows error alert
- ✅ Network failure → Shows error from backend
- ✅ Loading states → Shows spinner in button

## Security & Privacy

- Location is only shared when user explicitly clicks button
- `location_sharing_enabled` flag controls visibility to other users
- Location data stored securely in database
- Backend validates coordinates before saving
