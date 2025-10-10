"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface LocationToggleProps {
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  className?: string;
}

export const LocationToggle: React.FC<LocationToggleProps> = ({
  onLocationUpdate,
  className = "",
}) => {
  const { isAuthenticated } = useAuth();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Check initial location status from backend
  useEffect(() => {
    if (isAuthenticated) {
      checkLocationStatus();
    }
  }, [isAuthenticated]);

  const checkLocationStatus = async () => {
    try {
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
        setLocationEnabled(data.location_sharing_enabled);
        if (data.location_updated_at) {
          setLastUpdate(new Date(data.location_updated_at).toLocaleString());
        }
      }
    } catch (err) {
      console.error("Error checking location status:", err);
    }
  };

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

  const handleToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!locationEnabled) {
        // Enabling location - get GPS coordinates first
        console.log("📍 Getting current location...");
        const { latitude, longitude } = await getCurrentLocation();
        console.log(`✅ Location obtained: ${latitude}, ${longitude}`);

        // Update location in backend
        console.log("📤 Updating location in backend...");
        const updateResult = await updateLocationInBackend(latitude, longitude);
        console.log("✅ Location updated:", updateResult);

        // Enable location sharing
        console.log("🔓 Enabling location sharing...");
        await toggleLocationSharing(true);
        console.log("✅ Location sharing enabled");

        setLocationEnabled(true);
        setLastUpdate(new Date().toLocaleString());

        // Call the callback if provided
        if (onLocationUpdate) {
          onLocationUpdate(latitude, longitude);
        }

        setError(null);
      } else {
        // Disabling location
        console.log("🔒 Disabling location sharing...");
        await toggleLocationSharing(false);
        console.log("✅ Location sharing disabled");

        setLocationEnabled(false);
      }
    } catch (err) {
      console.error("❌ Location error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update location"
      );
      setLocationEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = async () => {
    if (!locationEnabled) return;

    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Refreshing location...");
      const { latitude, longitude } = await getCurrentLocation();
      console.log(`✅ New location: ${latitude}, ${longitude}`);

      const result = await updateLocationInBackend(latitude, longitude);
      console.log("✅ Location refreshed:", result);

      setLastUpdate(new Date().toLocaleString());

      if (onLocationUpdate) {
        onLocationUpdate(latitude, longitude);
      }

      setError(null);
    } catch (err) {
      console.error("❌ Refresh error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh location"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="font-semibold text-gray-900">Location Sharing</h3>
          </div>
          <p className="text-sm text-gray-600">
            {locationEnabled
              ? "Your location is being shared for accurate distance calculations"
              : "Enable to help find workers near you"}
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            loading
              ? "opacity-50 cursor-not-allowed"
              : locationEnabled
                ? "bg-blue-600"
                : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              locationEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Last Update Info */}
      {locationEnabled && lastUpdate && (
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Last updated: {lastUpdate}</span>
          <button
            onClick={refreshLocation}
            disabled={loading}
            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center space-x-1"
          >
            <svg
              className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start space-x-2">
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-600">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>
            {locationEnabled ? "Refreshing location..." : "Getting location..."}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationToggle;
