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

      const formData = new FormData();
      formData.append("payment_method", paymentMethod);

      if (paymentMethod === "CASH" && cashProofImage) {
        formData.append("cash_proof_image", {
          uri: cashProofImage,
          type: "image/jpeg",
          name: "cash_proof.jpg",
        } as any);
      }

      const response = await apiRequest(url, {
        method: "POST",
        body: formData as any,
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

      // Always use FormData to match backend Form() annotation
      const formData = new FormData();
      formData.append("payment_method", paymentMethod);

      if (paymentMethod === "CASH" && cashProofImage) {
        formData.append("cash_proof_image", {
          uri: cashProofImage,
          type: "image/jpeg",
          name: `cash_proof_${jobId}_${Date.now()}.jpg`,
        } as any);
      }

      const response = await apiRequest(url, {
        method: "POST",
        body: formData as any,
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

// =============================================================================
// AGENCY PROJECT JOB WORKFLOW
// =============================================================================
// Workflow steps: Agency dispatches → Client confirms arrival → Agency marks complete → Client approves & pays

/**
 * Agency dispatches an employee for a PROJECT-based job
 */
export function useDispatchProjectEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, employeeId }: { jobId: number; employeeId: number }): Promise<{ employee_name: string }> => {
      const url = ENDPOINTS.AGENCY_DISPATCH_PROJECT_EMPLOYEE(jobId, employeeId);
      const response = await apiRequest(url, { method: "POST" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to dispatch employee"));
      }

      return response.json() as Promise<{ employee_name: string }>;
    },
    onSuccess: (data: { employee_name: string }) => {
      Toast.show({
        type: "success",
        text1: "Employee Dispatched",
        text2: `${data.employee_name} is on the way`,
      });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Dispatch Failed",
        text2: error.message,
      });
    },
  });
}

/**
 * Client confirms an agency employee has arrived (PROJECT jobs)
 */
export function useConfirmProjectArrival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, employeeId }: { jobId: number; employeeId: number }): Promise<{ employee_name: string }> => {
      const url = ENDPOINTS.AGENCY_CONFIRM_PROJECT_ARRIVAL(jobId, employeeId);
      const response = await apiRequest(url, { method: "POST" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to confirm arrival"));
      }

      return response.json() as Promise<{ employee_name: string }>;
    },
    onSuccess: (data: { employee_name: string }) => {
      Toast.show({
        type: "success",
        text1: "Arrival Confirmed",
        text2: `${data.employee_name} is now on site`,
      });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
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
 * Agency marks an employee's work as complete (PROJECT jobs)
 */
export function useAgencyMarkProjectComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, employeeId, notes }: { jobId: number; employeeId: number; notes?: string }): Promise<{ employee_name: string; all_complete: boolean }> => {
      const url = ENDPOINTS.AGENCY_MARK_PROJECT_COMPLETE(jobId, employeeId);
      const response = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ notes: notes || "" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to mark as complete"));
      }

      return response.json() as Promise<{ employee_name: string; all_complete: boolean }>;
    },
    onSuccess: (data: { employee_name: string; all_complete: boolean }) => {
      Toast.show({
        type: "success",
        text1: "Work Marked Complete",
        text2: data.all_complete ? "All employees complete! Waiting for client approval" : `${data.employee_name}'s work marked complete`,
      });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
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
 * Client approves agency PROJECT job and pays
 */
export function useApproveAgencyProjectJob() {
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
      const url = ENDPOINTS.AGENCY_APPROVE_PROJECT_JOB(jobId);

      const formData = new FormData();
      formData.append("payment_method", paymentMethod);

      if (paymentMethod === "CASH" && cashProofImage) {
        formData.append("cash_proof_image", {
          uri: cashProofImage,
          type: "image/jpeg",
          name: `cash_proof_${jobId}_${Date.now()}.jpg`,
        } as any);
      }

      const response = await apiRequest(url, {
        method: "POST",
        body: formData as any,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to approve agency job"));
      }

      return response.json();
    },
    onSuccess: (data, { paymentMethod }) => {
      if (paymentMethod === "CASH") {
        Toast.show({
          type: "success",
          text1: "Payment Proof Uploaded",
          text2: "Agency job completed! You can now leave reviews.",
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Job Completed!",
          text2: "Agency job approved and payment processed",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["messages"] });
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
