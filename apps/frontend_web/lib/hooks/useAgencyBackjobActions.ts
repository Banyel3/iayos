// React Query Hooks for Agency Backjob Workflow Actions
// Handles 3-phase backjob completion: confirm started -> mark complete -> approve completion
// Backjobs are free remedial jobs rendered after a dispute is approved
// Agencies act as "worker entities" in the backjob workflow

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/api/config";

/**
 * Client confirms backjob work has started
 * This is the first step in the backjob workflow
 * Only clients can perform this action
 */
export function useConfirmBackjobStarted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(
        `${API_BASE}/api/jobs/${jobId}/backjob/confirm-started`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to confirm backjob started");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate messages to refetch with updated backjob status
      queryClient.invalidateQueries({ queryKey: ["agency-messages"] });
      queryClient.invalidateQueries({ queryKey: ["agency-conversations"] });
    },
    onError: (error: Error) => {
      console.error("Failed to confirm backjob started:", error.message);
    },
  });
}

/**
 * Agency/Worker marks backjob as complete
 * This is the second step in the backjob workflow
 * Only the assigned agency/worker can perform this action
 */
export function useMarkBackjobComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, notes }: { jobId: number; notes?: string }) => {
      const response = await fetch(
        `${API_BASE}/api/jobs/${jobId}/backjob/mark-complete`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes || "" }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to mark backjob complete");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-messages"] });
      queryClient.invalidateQueries({ queryKey: ["agency-conversations"] });
    },
    onError: (error: Error) => {
      console.error("Failed to mark backjob complete:", error.message);
    },
  });
}

/**
 * Client approves backjob completion
 * This is the final step - closes conversation and resolves dispute
 * No payment or reviews for backjobs (they are free remedial work)
 * Only clients can perform this action
 */
export function useApproveBackjobCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, notes }: { jobId: number; notes?: string }) => {
      const response = await fetch(
        `${API_BASE}/api/jobs/${jobId}/backjob/approve-completion`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes || "" }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to approve backjob completion");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-messages"] });
      queryClient.invalidateQueries({ queryKey: ["agency-conversations"] });
    },
    onError: (error: Error) => {
      console.error("Failed to approve backjob completion:", error.message);
    },
  });
}
