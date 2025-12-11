"use client";

import { useState, useEffect, useCallback } from "react";

interface LocationSharingState {
  isLocationEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

export const useLocationSharing = (isAuthenticated: boolean) => {
  const [state, setState] = useState<LocationSharingState>({
    isLocationEnabled: false,
    isLoading: true,
    error: null,
    lastUpdate: null,
  });

  // Fetch initial location status from backend
  const checkLocationStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const response = await fetch(
        "http://localhost:8000/api/accounts/location/me",
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setState({
          isLocationEnabled: data.location_sharing_enabled || false,
          isLoading: false,
          error: null,
          lastUpdate: data.location_updated_at
            ? new Date(data.location_updated_at).toLocaleString()
            : null,
        });
      } else {
        setState({
          isLocationEnabled: false,
          isLoading: false,
          error: null,
          lastUpdate: null,
        });
      }
    } catch (err) {
      console.error("Error checking location status:", err);
      setState({
        isLocationEnabled: false,
        isLoading: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to check location status",
        lastUpdate: null,
      });
    }
  }, [isAuthenticated]);

  // Load location status on mount and when authentication changes
  useEffect(() => {
    checkLocationStatus();
  }, [checkLocationStatus]);

  const getCurrentLocation = (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = "Failed to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location permission denied. Please enable location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const updateLocationInBackend = async (
    latitude: number,
    longitude: number
  ) => {
    const response = await fetch(
      "http://localhost:8000/api/accounts/location/update",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update location in backend");
    }

    return await response.json();
  };

  const toggleLocationSharing = async (enabled: boolean) => {
    const response = await fetch(
      "http://localhost:8000/api/accounts/location/toggle-sharing",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to toggle location sharing");
    }

    return await response.json();
  };

  const handleLocationToggle = async (
    onLocationUpdate?: (latitude: number, longitude: number) => void
  ) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!state.isLocationEnabled) {
        // Enabling location - get GPS coordinates first
        console.log("📍 Getting current location...");
        const { latitude, longitude } = await getCurrentLocation();
        console.log(`✅ Location obtained: ${latitude}, ${longitude}`);

        // Update location in backend
        console.log("📤 Updating location in backend...");
        await updateLocationInBackend(latitude, longitude);
        console.log("✅ Location updated");

        // Enable location sharing
        console.log("🔓 Enabling location sharing...");
        await toggleLocationSharing(true);
        console.log("✅ Location sharing enabled");

        // Call the callback if provided
        if (onLocationUpdate) {
          onLocationUpdate(latitude, longitude);
        }

        setState({
          isLocationEnabled: true,
          isLoading: false,
          error: null,
          lastUpdate: new Date().toLocaleString(),
        });
      } else {
        // Disabling location
        console.log("🔒 Disabling location sharing...");
        await toggleLocationSharing(false);
        console.log("✅ Location sharing disabled");

        setState({
          isLocationEnabled: false,
          isLoading: false,
          error: null,
          lastUpdate: state.lastUpdate,
        });
      }
    } catch (err) {
      console.error("❌ Location error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update location";
      setState({
        isLocationEnabled: false,
        isLoading: false,
        error: errorMessage,
        lastUpdate: state.lastUpdate,
      });
    }
  };

  const refreshLocation = async (
    onLocationUpdate?: (latitude: number, longitude: number) => void
  ) => {
    if (!state.isLocationEnabled) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log("🔄 Refreshing location...");
      const { latitude, longitude } = await getCurrentLocation();
      console.log(`✅ New location: ${latitude}, ${longitude}`);

      await updateLocationInBackend(latitude, longitude);
      console.log("✅ Location refreshed");

      if (onLocationUpdate) {
        onLocationUpdate(latitude, longitude);
      }

      setState({
        isLocationEnabled: true,
        isLoading: false,
        error: null,
        lastUpdate: new Date().toLocaleString(),
      });
    } catch (err) {
      console.error("❌ Refresh error:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to refresh location",
      }));
    }
  };

  return {
    isLocationEnabled: state.isLocationEnabled,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    handleLocationToggle,
    refreshLocation,
  };
};
