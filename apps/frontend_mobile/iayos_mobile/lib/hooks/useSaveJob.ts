import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { Alert } from "react-native";

interface UseSaveJobOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useSaveJob(options?: UseSaveJobOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest(ENDPOINTS.SAVE_JOB(jobId), {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to save job");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "saved"] });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      Alert.alert("Error", "Failed to save job. Please try again.");
      options?.onError?.(error);
    },
  });
}

export function useUnsaveJob(options?: UseSaveJobOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest(ENDPOINTS.UNSAVE_JOB(jobId), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to unsave job");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "saved"] });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      Alert.alert("Error", "Failed to unsave job. Please try again.");
      options?.onError?.(error);
    },
  });
}

export function useToggleSaveJob(options?: UseSaveJobOptions) {
  const saveJob = useSaveJob(options);
  const unsaveJob = useUnsaveJob(options);

  const toggleSave = (jobId: number, isSaved: boolean) => {
    if (isSaved) {
      unsaveJob.mutate(jobId);
    } else {
      saveJob.mutate(jobId);
    }
  };

  return {
    toggleSave,
    isLoading: saveJob.isPending || unsaveJob.isPending,
  };
}
