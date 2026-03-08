// React Query Hooks for Backjob Workflow Actions
// Handles 3-phase backjob completion: confirm started -> mark complete -> approve completion
// Backjobs are free remedial jobs rendered after a dispute is approved

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "../api/config";
import { getErrorMessage } from "../utils/parse-api-error";
import Toast from "react-native-toast-message";

/**
 * Client confirms backjob work has started
 * This is the first step in the backjob workflow
 */
export function useConfirmBackjobStarted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number) => {
      const url = ENDPOINTS.BACKJOB_CONFIRM_STARTED(jobId);
      const response = await apiRequest(url, {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(
          getErrorMessage(error, "Failed to confirm backjob started"),
        );
      }

      return response.json();
    },
    onSuccess: (_, jobId) => {
      Toast.show({
        type: "success",
        text1: "Backjob Started",
        text2: "Worker has been notified that backjob work has begun",
      });

      // Invalidate messages to refetch with updated backjob status
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["myBackjobs"] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Confirmation Failed",
        text2: error.message,
      });
    },
  });
}

/**
 * Worker marks backjob as complete
 * This is the second step in the backjob workflow
 */
export function useMarkBackjobComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, notes }: { jobId: number; notes?: string }) => {
      const url = ENDPOINTS.BACKJOB_MARK_COMPLETE(jobId);
      const response = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(
          getErrorMessage(error, "Failed to mark backjob complete"),
        );
      }

      return response.json();
    },
    onSuccess: (_, { jobId }) => {
      Toast.show({
        type: "success",
        text1: "Backjob Marked Complete",
        text2: "Waiting for client approval",
      });

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["myBackjobs"] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Failed to Mark Complete",
        text2: error.message,
      });
    },
  });
}

/**
 * Client approves backjob completion
 * This is the final step - closes conversation and resolves dispute
 * No payment or reviews for backjobs (they are free remedial work)
 */
export function useApproveBackjobCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, notes }: { jobId: number; notes?: string }) => {
      const url = ENDPOINTS.BACKJOB_APPROVE_COMPLETION(jobId);
      const response = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(
          getErrorMessage(error, "Failed to approve backjob completion"),
        );
      }

      return response.json();
    },
    onSuccess: (_, { jobId }) => {
      Toast.show({
        type: "success",
        text1: "Backjob Completed!",
        text2: "The dispute has been resolved",
      });

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["myBackjobs"] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Approval Failed",
        text2: error.message,
      });
    },
  });
}

/**
 * Client sets or updates scheduled date during backjob negotiation.
 */
export function useSetBackjobScheduledDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      scheduledDate,
    }: {
      jobId: number;
      scheduledDate: string;
    }) => {
      const url = ENDPOINTS.BACKJOB_SET_SCHEDULED_DATE(jobId);
      const response = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ scheduled_date: scheduledDate }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(
          getErrorMessage(error, "Failed to set backjob scheduled date"),
        );
      }

      return response.json();
    },
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Schedule Updated",
        text2: "Waiting for worker confirmation",
      });

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["myBackjobs"] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Schedule Update Failed",
        text2: error.message,
      });
    },
  });
}

/**
 * Worker/agency confirms client-proposed scheduled date.
 */
export function useConfirmBackjobScheduledDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId }: { jobId: number }) => {
      const url = ENDPOINTS.BACKJOB_CONFIRM_SCHEDULED_DATE(jobId);
      const response = await apiRequest(url, {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(
          getErrorMessage(error, "Failed to confirm backjob scheduled date"),
        );
      }

      return response.json();
    },
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Schedule Confirmed",
        text2: "Backjob is ready for scheduled execution",
      });

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["myBackjobs"] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Confirmation Failed",
        text2: error.message,
      });
    },
  });
}

/**
 * Participant requests re-negotiation for the SAME active backjob record.
 * This reopens admin negotiation and clears the currently scheduled date.
 */
export function useRequestBackjobRenegotiation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      reason,
    }: {
      jobId: number;
      reason?: string;
    }) => {
      const url = ENDPOINTS.BACKJOB_REQUEST_RENEGOTIATION(jobId);
      const response = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(
          getErrorMessage(error, "Failed to request backjob re-negotiation"),
        );
      }

      return response.json();
    },
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Re-negotiation Requested",
        text2: "Admin has been notified to reopen the schedule discussion",
      });

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["myBackjobs"] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Request Failed",
        text2: error.message,
      });
    },
  });
}
