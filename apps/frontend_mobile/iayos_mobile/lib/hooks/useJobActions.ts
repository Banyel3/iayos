// React Query Hooks for Job Actions
// Handles confirm work started, mark complete, approve completion

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest, API_BASE_URL } from "../api/config";
import { getErrorMessage } from "../utils/parse-api-error";
import Toast from "react-native-toast-message";

/**
 * Client confirms worker has arrived and work has started
 */
export function useConfirmWorkStarted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number) => {
      const url = ENDPOINTS.CONFIRM_WORK_STARTED(jobId);
      const response = await apiRequest(url, {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(getErrorMessage(error, "Failed to confirm work started"));
      }

      return response.json();
    },
    onSuccess: (_, jobId) => {
      Toast.show({
        type: "success",
        text1: "Work Started Confirmed",
        text2: "Worker has been notified that you confirmed work started",
      });

      // Invalidate messages to refetch with updated job status
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
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
 * Client confirms a team worker has arrived (for team jobs)
 */
export function useConfirmTeamWorkerArrival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      assignmentId,
    }: {
      jobId: number;
      assignmentId: number;
    }) => {
      const url = `${API_BASE_URL}/jobs/${jobId}/team/confirm-arrival/${assignmentId}`;
      const response = await apiRequest(url, {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(getErrorMessage(error, "Failed to confirm worker arrival"));
      }

      return response.json();
    },
    onSuccess: (data: any, { jobId }) => {
      Toast.show({
        type: "success",
        text1: "Worker Arrival Confirmed",
        text2: `${data.worker_name} has been notified`,
      });

      // Invalidate messages to refetch with updated arrival status
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] });
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
 * Worker marks their team assignment as complete (for team jobs)
 */
export function useMarkTeamAssignmentComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      assignmentId,
      notes,
    }: {
      jobId: number;
      assignmentId: number;
      notes?: string;
    }) => {
      const url = `${API_BASE_URL}/jobs/team/assignments/${assignmentId}/complete`;
      const response = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ notes: notes || "" }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(getErrorMessage(error, "Failed to mark assignment complete"));
      }

      return response.json();
    },
    onSuccess: (data: any, { jobId }) => {
      Toast.show({
        type: "success",
        text1: "Assignment Marked Complete",
        text2: "Client will review your work",
      });

      // Invalidate messages to refetch with updated completion status
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
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
 * Client approves team job completion and processes final payment (for team jobs)
 */
export function useApproveTeamJobCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      paymentMethod,
      cashProofImage,
    }: {
      jobId: number;
      paymentMethod: "WALLET" | "CASH";
      cashProofImage?: string;
    }) => {
      const url = `${API_BASE_URL}/jobs/${jobId}/team/approve-completion`;

      let body: any;
      let headers: Record<string, string> | undefined;

      if (paymentMethod === "CASH" && cashProofImage) {
        // Use FormData for cash proof image upload
        const formData = new FormData();
        formData.append("payment_method", paymentMethod);
        formData.append("cash_proof_image", {
          uri: cashProofImage,
          type: "image/jpeg",
          name: "cash_proof.jpg",
        } as any);
        body = formData;
        headers = undefined; // Let browser set multipart boundary
      } else {
        // JSON for wallet payment
        body = JSON.stringify({ payment_method: paymentMethod });
        headers = { "Content-Type": "application/json" };
      }

      const response = await apiRequest(url, {
        method: "POST",
        body,
        ...(headers && { headers }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(getErrorMessage(error, "Failed to approve team job completion"));
      }

      return response.json();
    },
    onSuccess: (data: any, { jobId }) => {
      Toast.show({
        type: "success",
        text1: "Team Job Completed!",
        text2: "Payment processed and workers notified",
      });

      // Invalidate messages to refetch with updated approval status
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
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
 * Worker marks job as complete
 */
export function useMarkComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      notes,
      photos,
    }: {
      jobId: number;
      notes?: string;
      photos?: string[];
    }) => {
      const url = ENDPOINTS.MARK_COMPLETE(jobId);
      const response = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ notes, photos }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(getErrorMessage(error, "Failed to mark job complete"));
      }

      return response.json();
    },
    onSuccess: (_, { jobId }) => {
      Toast.show({
        type: "success",
        text1: "Job Marked Complete",
        text2: "Waiting for client approval",
      });

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
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
 * Client approves job completion and selects payment method
 */
export function useApproveCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      paymentMethod,
      cashProofImage,
    }: {
      jobId: number;
      paymentMethod: "WALLET" | "GCASH" | "CASH";
      cashProofImage?: string;
    }) => {
      const url = ENDPOINTS.APPROVE_COMPLETION(jobId);

      // For cash payment with proof, use FormData
      if (paymentMethod === "CASH" && cashProofImage) {
        const formData = new FormData();
        formData.append("payment_method", paymentMethod);
        formData.append("cash_proof_image", {
          uri: cashProofImage,
          type: "image/jpeg",
          name: `cash_proof_${jobId}_${Date.now()}.jpg`,
        } as any);

        const response = await apiRequest(url, {
          method: "POST",
          body: formData as any,
        });

        if (!response.ok) {
          const error = (await response.json()) as { error?: string };
          throw new Error(getErrorMessage(error, "Failed to approve completion"));
        }

        return response.json();
      }

      // For wallet/gcash, use JSON
      const response = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ payment_method: paymentMethod }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(getErrorMessage(error, "Failed to approve completion"));
      }

      return response.json();
    },
    onSuccess: (data: any, { jobId, paymentMethod }) => {
      if (paymentMethod === "GCASH" && data.invoice_url) {
        Toast.show({
          type: "success",
          text1: "Redirecting to GCash",
          text2: "Complete payment to finish approval",
        });
      } else if (paymentMethod === "CASH") {
        Toast.show({
          type: "success",
          text1: "Proof Uploaded Successfully",
          text2: "You can now leave a review for the worker",
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Job Completed!",
          text2: "Payment processed successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetails", jobId] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
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
