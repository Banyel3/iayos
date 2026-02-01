// Location Tracking Hooks
// React Query hooks for managing user location

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";

// ===== TYPES =====

export interface UserLocation {
  latitude: number;
  longitude: number;
  locationSharingEnabled: boolean;
  locationUpdatedAt: string | null;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
}

// ===== HOOKS =====

/**
 * Get current user's location from backend
 */
export function useMyLocation() {
  return useQuery<UserLocation>({
    queryKey: ["user-location"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.GET_MY_LOCATION);
      if (!response.ok) {
        throw new Error("Failed to fetch location");
      }
      const data = (await response.json()) as any;
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        locationSharingEnabled: data.location_sharing_enabled,
        locationUpdatedAt: data.location_updated_at,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update user's current location
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLocationRequest) => {
      const response = await apiRequest(ENDPOINTS.UPDATE_LOCATION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = (await response.json()) as any;
        throw new Error(getErrorMessage(error, "Failed to update location"));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-location"] });
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });

      // Show success message
      Toast.show({
        type: "success",
        text1: "Location Saved",
        text2: "Your current location has been updated successfully",
        position: "top",
      });
    },
  });
}

/**
 * Toggle location sharing on/off
 */
export function useToggleLocationSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest(ENDPOINTS.TOGGLE_LOCATION_SHARING, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        const error = (await response.json()) as any;
        throw new Error(getErrorMessage(error, "Failed to toggle location sharing"));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-location"] });
    },
  });
}

/**
 * Request location permissions and get current location
 */
export async function requestAndGetLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    // Request foreground permissions
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Location Package Required",
        "Please install expo-location package first: npx expo install expo-location",
        [{ text: "OK" }]
      );
      return null;
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    Alert.alert(
      "Location Error",
      "Failed to get your current location. Please try again.",
      [{ text: "OK" }]
    );
    return null;
  }
}

/**
 * Hook to scan and update current location
 */
export function useScanLocation() {
  const updateLocation = useUpdateLocation();

  return useMutation({
    mutationFn: async () => {
      const coords = await requestAndGetLocation();
      if (!coords) {
        throw new Error("Location access denied or unavailable");
      }

      // Update location in backend
      await updateLocation.mutateAsync(coords);

      return coords;
    },
  });
}
