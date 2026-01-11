# Preventing UI Flickering - Loading States Best Practices

## Problem Statement

When components render with default values before fetching data from the backend, users experience "flickering" - the UI briefly shows incorrect information before updating to the correct state. This creates a poor user experience.

### Common Examples:

- Availability toggle shows "Unavailable" for a split second, then changes to "Available"
- Profile information shows placeholder values before real data loads
- Location status shows "Disabled" before checking actual status
- User preferences show defaults before fetching from database

---

## Root Cause

The flickering occurs due to this sequence:

```
1. Component mounts with default values (isAvailable = false)
   ↓ User sees: "Unavailable" ❌
2. API call initiated
   ↓ Still showing: "Unavailable" ❌
3. API response received (actual value: true)
   ↓ UI updates to: "Available" ✅

Result: User sees the toggle flip from "Unavailable" to "Available"
even though they didn't interact with it!
```

---

## Solution: Loading States

The solution is to track the loading state and render a loading indicator instead of default values:

```
1. Component mounts with loading state (isLoading = true)
   ↓ User sees: "Loading..." ⏳
2. API call initiated
   ↓ Still showing: "Loading..." ⏳
3. API response received (actual value: true)
   ↓ UI updates to: "Available" ✅

Result: Smooth transition from loading to actual value!
```

---

## Implementation Guide

### Step 1: Add Loading State to Hooks

**Before:**

```typescript
export const useWorkerAvailability = (
  isWorker: boolean,
  isAuthenticated: boolean
) => {
  const [isAvailable, setIsAvailable] = useState(false); // ❌ Shows "false" immediately

  useEffect(() => {
    const fetchAvailability = async () => {
      const response = await fetch("/api/availability");
      const data = await response.json();
      setIsAvailable(data.isAvailable);
    };
    fetchAvailability();
  }, []);

  return { isAvailable };
};
```

**After:**

```typescript
export const useWorkerAvailability = (
  isWorker: boolean,
  isAuthenticated: boolean
) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ✅ Track loading state

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!isAuthenticated || !isWorker) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true); // Start loading
        const response = await fetch("/api/availability");
        const data = await response.json();
        setIsAvailable(data.isAvailable);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false); // ✅ Always stop loading
      }
    };
    fetchAvailability();
  }, [isAuthenticated, isWorker]);

  return {
    isAvailable,
    isLoading, // ✅ Return loading state
    handleAvailabilityToggle,
  };
};
```

### Step 2: Use Loading State in Components

**Before:**

```typescript
const HomePage = () => {
  const { isAvailable, handleAvailabilityToggle } = useWorkerAvailability(true, true);

  return (
    <DesktopNavbar
      isAvailable={isAvailable} // ❌ Shows default value immediately
      onAvailabilityToggle={handleAvailabilityToggle}
    />
  );
};
```

**After:**

```typescript
const HomePage = () => {
  const {
    isAvailable,
    isLoading: isLoadingAvailability, // ✅ Destructure loading state
    handleAvailabilityToggle
  } = useWorkerAvailability(true, true);

  return (
    <DesktopNavbar
      isAvailable={isAvailable}
      isLoadingAvailability={isLoadingAvailability} // ✅ Pass loading state
      onAvailabilityToggle={handleAvailabilityToggle}
    />
  );
};
```

### Step 3: Render Loading State in UI

**Before:**

```typescript
const DesktopNavbar = ({ isAvailable }) => {
  return (
    <div>
      <div className={isAvailable ? 'bg-green-500' : 'bg-gray-400'} />
      <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
      {/* ❌ Immediately shows "Unavailable" with gray dot */}
    </div>
  );
};
```

**After:**

```typescript
const DesktopNavbar = ({ isAvailable, isLoadingAvailability }) => {
  return (
    <div>
      {isLoadingAvailability ? (
        // ✅ Show loading state while fetching
        <>
          <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
          <span className="text-gray-400">Loading...</span>
        </>
      ) : (
        // ✅ Only show actual value after loading
        <>
          <div className={isAvailable ? 'bg-green-500' : 'bg-gray-400'} />
          <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
        </>
      )}
    </div>
  );
};
```

---

## Applied Solution: Availability Toggle

### Files Updated

#### 1. Hook: `useWorkerAvailability.ts`

Already had `isLoading` state but it was being returned ✅

#### 2. Component: `desktop-sidebar.tsx`

**Added loading state prop and conditional rendering:**

```typescript
interface DesktopNavbarProps {
  isWorker?: boolean;
  userName?: string;
  userAvatar?: string;
  onLogout?: () => void;
  isAvailable?: boolean;
  isLoadingAvailability?: boolean; // ✅ New prop
  onAvailabilityToggle?: () => void;
}

export const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  // ... other props
  isAvailable = true,
  isLoadingAvailability = false, // ✅ Default to false
  onAvailabilityToggle,
}) => {
  return (
    // ... navbar content
    {isWorker && (
      <div className="flex items-center space-x-2">
        {isLoadingAvailability ? (
          // ✅ Loading state - prevents flickering
          <>
            <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-400">
              Loading...
            </span>
          </>
        ) : (
          // ✅ Actual state - only shown after loading
          <>
            <div className={`w-3 h-3 rounded-full ${
              isAvailable ? "bg-green-500" : "bg-gray-400"
            }`}></div>
            <span onClick={onAvailabilityToggle}>
              {isAvailable ? "Available" : "Unavailable"}
            </span>
          </>
        )}
      </div>
    )}
  );
};
```

#### 3. Pages: `home/page.tsx` and `myRequests/page.tsx`

**Destructured and passed loading state:**

```typescript
// Destructure isLoading from hook
const {
  isAvailable,
  isLoading: isLoadingAvailability, // ✅ Rename to avoid conflict
  handleAvailabilityToggle,
} = useWorkerAvailability(isWorker, isAuthenticated);

// Pass to navbar
<DesktopNavbar
  isWorker={isWorker}
  userName={userName}
  onLogout={logout}
  isAvailable={isAvailable}
  isLoadingAvailability={isLoadingAvailability} // ✅ Pass loading state
  onAvailabilityToggle={handleAvailabilityToggle}
/>
```

---

## General Pattern for Any Data

This pattern works for ANY data that needs to be fetched:

### 1. Location Toggle

```typescript
const LocationToggle = () => {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocationStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/location/status');
        const data = await response.json();
        setEnabled(data.enabled);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocationStatus();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Toggle
      enabled={enabled}
      onChange={handleToggle}
    />
  );
};
```

### 2. User Profile Data

```typescript
const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/profile');
        const data = await response.json();
        setProfile(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return <ProfileSkeleton />; // ✅ Skeleton loader
  }

  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.email}</p>
    </div>
  );
};
```

### 3. Settings & Preferences

```typescript
const useUserSettings = () => {
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    language: 'en'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/settings');
        const data = await response.json();
        setSettings(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return { settings, isLoading };
};

// Usage
const SettingsPage = () => {
  const { settings, isLoading } = useUserSettings();

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <ThemeToggle theme={settings.theme} />
      <NotificationToggle enabled={settings.notifications} />
    </div>
  );
};
```

---

## Loading UI Best Practices

### 1. Skeleton Loaders

Use for structured content like cards, lists, profiles:

```typescript
const ProfileSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-20 w-20 bg-gray-200 rounded-full mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);
```

### 2. Spinners

Use for actions and small components:

```typescript
const LoadingSpinner = () => (
  <div className="flex items-center space-x-2">
    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <span>Loading...</span>
  </div>
);
```

### 3. Pulsing Dots

Use for inline status indicators:

```typescript
const LoadingDot = () => (
  <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
);
```

### 4. Text Shimmer

Use for text that's loading:

```typescript
const ShimmerText = () => (
  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer"></div>
);
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Not Returning Loading State from Hook

```typescript
// Bad
const useData = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // ... fetch logic
  return { data }; // ❌ Forgot to return isLoading
};
```

### ✅ Fix:

```typescript
return { data, isLoading }; // ✅ Always return loading state
```

### ❌ Mistake 2: Not Setting Loading to False in Finally Block

```typescript
// Bad
const fetchData = async () => {
  setIsLoading(true);
  const response = await fetch("/api/data");
  const data = await response.json();
  setIsLoading(false); // ❌ Won't run if error occurs
};
```

### ✅ Fix:

```typescript
const fetchData = async () => {
  try {
    setIsLoading(true);
    const response = await fetch("/api/data");
    const data = await response.json();
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoading(false); // ✅ Always runs
  }
};
```

### ❌ Mistake 3: Showing Default Value During Loading

```typescript
// Bad
return (
  <div>
    {data || "No data"} {/* ❌ Shows "No data" while loading */}
  </div>
);
```

### ✅ Fix:

```typescript
if (isLoading) {
  return <div>Loading...</div>; // ✅ Show loading state
}

if (!data) {
  return <div>No data</div>; // ✅ Show empty state after loading
}

return <div>{data}</div>; // ✅ Show actual data
```

### ❌ Mistake 4: Not Handling Initial Load vs Refetch

```typescript
// Bad - always shows full page loader
if (isLoading) {
  return <FullPageSpinner />; // ❌ Also shows on refetch
}
```

### ✅ Fix:

```typescript
const [data, setData] = useState(null);
const [isInitialLoading, setIsInitialLoading] = useState(true);
const [isRefetching, setIsRefetching] = useState(false);

// Initial load
if (isInitialLoading) {
  return <FullPageSpinner />; // ✅ Only on first load
}

return (
  <div>
    {isRefetching && <InlineSpinner />} {/* ✅ Small loader on refetch */}
    {/* ... content */}
  </div>
);
```

---

## Performance Considerations

### 1. Debounce Rapid Loading States

If data updates frequently, debounce the loading indicator:

```typescript
const [showLoading, setShowLoading] = useState(false);

useEffect(() => {
  if (isLoading) {
    // Only show loading if it takes > 200ms
    const timer = setTimeout(() => setShowLoading(true), 200);
    return () => clearTimeout(timer);
  } else {
    setShowLoading(false);
  }
}, [isLoading]);
```

### 2. Optimistic Updates

For user actions, update UI immediately:

```typescript
const handleToggle = async () => {
  // ✅ Update UI immediately
  setIsAvailable(!isAvailable);

  try {
    await updateAvailability(!isAvailable);
  } catch (error) {
    // ❌ Revert on error
    setIsAvailable(isAvailable);
    alert("Failed to update");
  }
};
```

### 3. Cache Data

Prevent unnecessary refetches:

```typescript
const cache = new Map();

const fetchData = async (id) => {
  if (cache.has(id)) {
    return cache.get(id); // ✅ Return cached data
  }

  const response = await fetch(`/api/data/${id}`);
  const data = await response.json();
  cache.set(id, data);
  return data;
};
```

---

## Testing Loading States

### 1. Unit Tests

```typescript
test('shows loading state while fetching', async () => {
  render(<MyComponent />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Available')).toBeInTheDocument();
  });
});
```

### 2. Slow Network Simulation

```typescript
// Add delay to test loading states
await new Promise((resolve) => setTimeout(resolve, 2000));
```

### 3. Visual Regression Tests

Take screenshots of loading states to ensure they look correct.

---

## Checklist for New Features

When implementing any new data-fetching feature:

- [ ] Add `isLoading` state to hook/component
- [ ] Initialize `isLoading` to `true`
- [ ] Set `isLoading` to `false` in finally block
- [ ] Return `isLoading` from custom hooks
- [ ] Pass `isLoading` to child components
- [ ] Render loading UI when `isLoading` is true
- [ ] Only render actual data when `isLoading` is false
- [ ] Handle error states separately
- [ ] Test loading state visually
- [ ] Test with slow network (throttling)

---

## Summary

**The golden rule:**

> Never render actual data values until you know what they should be.

**The pattern:**

1. Start with `isLoading = true`
2. Fetch data
3. Set data and `isLoading = false`
4. Render loading UI while loading
5. Render actual data after loading

This prevents flickering and creates a professional, polished user experience.

---

**Last Updated:** October 12, 2025  
**Status:** Implemented for availability toggle  
**Next Steps:** Apply pattern to LocationToggle and other dynamic components
