// React Query Hooks for Backjob Workflow Actions
// Handles 3-phase backjob completion: confirm started -> mark complete -> approve completion
// Backjobs are free remedial jobs rendered after a dispute is approved

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "../api/config";
import { getErrorMessage } from "../utils/parse-api-error";
import Toast from "react-native-toast-message";

type BackjobMutationResult = {
  success?: boolean;
  already_processed?: boolean;
  message?: string;
};

async function refreshBackjobQueries(queryClient: ReturnType<typeof useQueryClient>, jobId?: number) {
  const refreshes = [
    queryClient.invalidateQueries({ queryKey: ["messages"] }),
    queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    queryClient.invalidateQueries({ queryKey: ["myJobs"] }),
    queryClient.invalidateQueries({ queryKey: ["myBackjobs"] }),
  ];

  if (typeof jobId === "number") {
    refreshes.push(queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] }));
  }

  await Promise.all(refreshes);
}

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
    onSuccess: async (result: BackjobMutationResult, jobId) => {
      Toast.show({
        type: "success",
        text1: result.already_processed ? "Already Confirmed" : "Backjob Started",
        text2:
          result.message ||
          (result.already_processed
            ? "Backjob start was already confirmed"
            : "Worker has been notified that backjob work has begun"),
      });

      // Awaited refresh keeps mutation in pending state until UI-sync queries are queued.
      await refreshBackjobQueries(queryClient, jobId);
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
    onSuccess: async (result: BackjobMutationResult, { jobId }) => {
      Toast.show({
        type: "success",
        text1: result.already_processed
          ? "Already Marked Complete"
          : "Backjob Marked Complete",
        text2:
          result.message ||
          (result.already_processed
            ? "Backjob was already marked complete"
            : "Waiting for client approval"),
      });

      await refreshBackjobQueries(queryClient, jobId);
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
    onSuccess: async (result: BackjobMutationResult, { jobId }) => {
      Toast.show({
        type: "success",
        text1: result.already_processed ? "Already Completed" : "Backjob Completed!",
        text2:
          result.message ||
          (result.already_processed
            ? "This backjob was already resolved"
            : "The dispute has been resolved"),
      });

      await refreshBackjobQueries(queryClient, jobId);
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
    onSuccess: async () => {
      Toast.show({
        type: "success",
        text1: "Schedule Updated",
        text2: "Waiting for worker confirmation",
      });

      await refreshBackjobQueries(queryClient);
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
        const error = (await response.json()) as {
          error?: string;
          message?: string;
          detail?: string;
        };
        const message = getErrorMessage(
          error,
          "Failed to confirm backjob scheduled date",
        );
        const normalized = String(message || "").toLowerCase();

        // Backend may return a non-2xx response when confirmation already succeeded
        // from another participant. Treat this as idempotent success for UI consistency.
        if (
          normalized.includes("already approved for execution") ||
          normalized.includes("already confirmed")
        ) {
          return {
            success: true,
            already_processed: true,
            message,
          };
        }

        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: async (result: BackjobMutationResult) => {
      Toast.show({
        type: "success",
        text1: result.already_processed ? "Already Confirmed" : "Schedule Confirmed",
        text2:
          result.message ||
          (result.already_processed
            ? "Schedule was already confirmed"
            : "Backjob is ready for scheduled execution"),
      });

      await refreshBackjobQueries(queryClient);
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
    onSuccess: async () => {
      Toast.show({
        type: "success",
        text1: "Re-negotiation Requested",
        text2: "Admin has been notified to reopen the schedule discussion",
      });

      await refreshBackjobQueries(queryClient);
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

/**
 * Client releases worker/agency payment early.
 * This waives remaining backjob rights for the job.
 */
export function useReleasePaymentNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId }: { jobId: number }) => {
      const url = ENDPOINTS.RELEASE_PAYMENT_NOW(jobId);
      const response = await apiRequest(url, {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(getErrorMessage(error, "Failed to release payment"));
      }

      return response.json();
    },
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Payment Released",
        text2: "Backjob window has been closed for this job",
      });

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails"] });
      queryClient.invalidateQueries({ queryKey: ["myBackjobs"] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Release Failed",
        text2: error.message,
      });
    },
  });
}
