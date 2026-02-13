// Dual Profile Management Hooks
// React Query hooks for switching between WORKER and CLIENT profiles

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";

// ===== TYPES =====

export interface DualProfileStatus {
  success: boolean;
  has_worker_profile: boolean;
  has_client_profile: boolean;
  current_profile_type: "WORKER" | "CLIENT" | null;
  worker_profile_id: number | null;
  client_profile_id: number | null;
}

// ===== HOOKS =====

/**
 * Get dual profile status - which profiles exist
 */
export function useDualProfileStatus() {
  return useQuery<DualProfileStatus>({
    queryKey: ["dual-profile-status"],
    queryFn: async (): Promise<DualProfileStatus> => {
      const response = await apiRequest(ENDPOINTS.DUAL_PROFILE_STATUS);
      if (!response.ok) {
        throw new Error("Failed to fetch profile status");
      }
      return response.json() as Promise<DualProfileStatus>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create CLIENT profile for WORKER-only accounts
 */
export function useCreateClientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest(ENDPOINTS.CREATE_CLIENT_PROFILE, {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as any;
        throw new Error(getErrorMessage(error, "Failed to create client profile"));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dual-profile-status"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      Toast.show({
        type: "success",
        text1: "Client Profile Created",
        text2: "You can now post jobs and hire workers!",
        position: "top",
      });
    },
    onError: (error: Error) => {
      // If backend says "already exists", refetch status so UI shows "Switch"
      if (error.message.toLowerCase().includes("already exists")) {
        queryClient.invalidateQueries({ queryKey: ["dual-profile-status"] });
      }
      Toast.show({
        type: "error",
        text1: "Failed to Create Profile",
        text2: error.message,
        position: "top",
      });
    },
  });
}

/**
 * Create WORKER profile for CLIENT-only accounts
 */
export function useCreateWorkerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest(ENDPOINTS.CREATE_WORKER_PROFILE, {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as any;
        throw new Error(getErrorMessage(error, "Failed to create worker profile"));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dual-profile-status"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      Toast.show({
        type: "success",
        text1: "Worker Profile Created",
        text2: "You can now apply for jobs and offer services!",
        position: "top",
      });
    },
    onError: (error: Error) => {
      // If backend says "already exists", the Profile row exists but
      // WorkerProfile was missing (now fixed by backend). Refetch status
      // so the UI shows "Switch" instead of "Create".
      if (error.message.toLowerCase().includes("already exists")) {
        queryClient.invalidateQueries({ queryKey: ["dual-profile-status"] });
      }
      Toast.show({
        type: "error",
        text1: "Failed to Create Profile",
        text2: error.message,
        position: "top",
      });
    },
  });
}

/**
 * Switch to a different profile WITHOUT logging out
 * Uses the new instant profile switching via JWT update
 */
export function useSwitchProfile() {
  const queryClient = useQueryClient();
  const { switchProfile } = useAuth();

  return useMutation({
    mutationFn: async (profileType: "WORKER" | "CLIENT") => {
      console.log(`[useSwitchProfile] Starting mutation for ${profileType}`);
      try {
        const result = await switchProfile(profileType);
        console.log(
          `[useSwitchProfile] Mutation completed successfully for ${profileType}`
        );
        return result;
      } catch (error) {
        console.error(
          `[useSwitchProfile] Mutation failed for ${profileType}:`,
          error
        );
        throw error;
      }
    },
    onSuccess: async (_data, profileType) => {
      console.log(`[useSwitchProfile] onSuccess called for ${profileType}`);

      // Clear ALL cached queries to force fresh data with new profile
      await queryClient.clear();
      console.log(`[useSwitchProfile] Query cache cleared`);

      // Force refetch critical queries with staleTime: 0 to bypass cache
      await queryClient.refetchQueries({
        queryKey: ["dual-profile-status"],
        type: "all",
      });
      await queryClient.refetchQueries({
        queryKey: ["user"],
        type: "all",
      });

      // Also invalidate to mark as stale
      queryClient.invalidateQueries({ queryKey: ["dual-profile-status"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      console.log(
        `[useSwitchProfile] Critical queries refetched and invalidated`
      );

      Toast.show({
        type: "success",
        text1: "Profile Switched",
        text2: `You're now using your ${profileType} profile`,
        position: "top",
      });
    },
    onError: (error: Error) => {
      console.error(`[useSwitchProfile] onError called:`, error);
      Toast.show({
        type: "error",
        text1: "Failed to Switch Profile",
        text2: error.message,
        position: "top",
      });
    },
  });
}
