// Team Job Hooks - React Query hooks for multi-skill multi-worker team jobs
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { Alert } from "react-native";

// ============================================================================
// Types
// ============================================================================

export interface SkillSlot {
  skill_slot_id: number;
  specialization_id: number;
  specialization_name: string;
  workers_needed: number;
  workers_assigned: number;
  openings_remaining: number;
  budget_allocated: number;
  budget_per_worker: number;
  skill_level_required: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  status: "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CLOSED";
  notes: string | null;
}

export interface WorkerAssignment {
  assignment_id: number;
  worker_id: number;
  worker_name: string;
  worker_avatar: string | null;
  worker_rating: number | null;
  skill_slot_id: number;
  specialization_name: string;
  slot_position: number;
  assignment_status: "ACTIVE" | "COMPLETED" | "REMOVED" | "WITHDRAWN";
  assigned_at: string;
  worker_marked_complete: boolean;
  individual_rating: number | null;
}

export interface TeamJobDetail {
  job_id: number;
  title: string;
  description: string;
  location: string;
  total_budget: number;
  status: string;
  is_team_job: boolean;
  budget_allocation_type: string;
  team_start_threshold: number;
  total_workers_needed: number;
  total_workers_assigned: number;
  team_fill_percentage: number;
  can_start: boolean;
  skill_slots: SkillSlot[];
  worker_assignments: WorkerAssignment[];
  client_id: number | null;
  client_name: string;
  created_at: string;
}

export interface TeamJobApplication {
  application_id: number;
  worker_id: number;
  worker_name: string;
  worker_avatar: string | null;
  worker_rating: number | null;
  skill_slot_id: number;
  specialization_name: string;
  proposal_message: string;
  proposed_budget: number;
  budget_option: "ACCEPT" | "NEGOTIATE";
  estimated_duration: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  applied_at: string;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch team job details including skill slots and worker assignments
 */
export function useTeamJobDetail(jobId: number, enabled: boolean = true) {
  return useQuery<TeamJobDetail>({
    queryKey: ["team-job", jobId],
    queryFn: async (): Promise<TeamJobDetail> => {
      const response = await apiRequest(ENDPOINTS.TEAM_JOB_DETAIL(jobId));
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(getErrorMessage(error, "Failed to fetch team job details"));
      }
      return response.json() as Promise<TeamJobDetail>;
    },
    enabled: enabled && jobId > 0,
  });
}

/**
 * Apply to a specific skill slot in a team job (for workers)
 */
export function useApplyToSkillSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      skillSlotId,
      proposalMessage,
      proposedBudget,
      budgetOption = "ACCEPT",
      estimatedDuration,
    }: {
      jobId: number;
      skillSlotId: number;
      proposalMessage: string;
      proposedBudget: number;
      budgetOption?: "ACCEPT" | "NEGOTIATE";
      estimatedDuration?: string;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.TEAM_APPLY_SKILL_SLOT(jobId),
        {
          method: "POST",
          body: JSON.stringify({
            skill_slot_id: skillSlotId,
            proposal_message: proposalMessage,
            proposed_budget: proposedBudget,
            budget_option: budgetOption,
            estimated_duration: estimatedDuration,
          }),
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to submit application"));
      }
      return data;
    },
    onSuccess: (data, variables) => {
      Alert.alert(
        "Application Submitted!",
        data.message || "Your application has been submitted successfully.",
      );
      queryClient.invalidateQueries({
        queryKey: ["team-job", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["jobs", variables.jobId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["jobs", "applications"] });
    },
    onError: (error: Error) => {
      Alert.alert("Application Failed", error.message);
    },
  });
}

/**
 * Accept a worker's application to a team job skill slot (for clients)
 */
export function useAcceptTeamApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      applicationId,
    }: {
      jobId: number;
      applicationId: number;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.TEAM_ACCEPT_APPLICATION(jobId, applicationId),
        { method: "POST" },
      );

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
        worker_name?: string;
      };
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to accept application"));
      }
      return data;
    },
    onSuccess: (data, variables) => {
      Alert.alert(
        "Worker Assigned!",
        data.message ||
          `${data.worker_name || "Worker"} has been assigned to the team.`,
      );
      queryClient.invalidateQueries({
        queryKey: ["team-job", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["team-job-applications", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["jobs", variables.jobId.toString()],
      });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });
}

/**
 * Reject a worker's application to a team job skill slot (for clients)
 */
export function useRejectTeamApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      applicationId,
      reason,
    }: {
      jobId: number;
      applicationId: number;
      reason?: string;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.TEAM_REJECT_APPLICATION(jobId, applicationId),
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to reject application"));
      }
      return data;
    },
    onSuccess: (data, variables) => {
      Alert.alert(
        "Application Rejected",
        data.message || "The application has been rejected.",
      );
      queryClient.invalidateQueries({
        queryKey: ["team-job", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["team-job-applications", variables.jobId],
      });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });
}

/**
 * Worker marks their assignment as complete
 */
export function useWorkerCompleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      assignmentId,
      completionNotes,
    }: {
      jobId: number;
      assignmentId: number;
      completionNotes?: string;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.TEAM_WORKER_COMPLETE(jobId, assignmentId),
        {
          method: "POST",
          body: JSON.stringify({ completion_notes: completionNotes }),
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to mark assignment complete"));
      }
      return data;
    },
    onSuccess: (data, variables) => {
      Alert.alert(
        "Marked Complete!",
        data.message || "Your assignment has been marked as complete.",
      );
      queryClient.invalidateQueries({
        queryKey: ["team-job", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["jobs", variables.jobId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["jobs", "my-jobs"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });
}

/**
 * Client approves the entire team job completion
 */
export function useClientApproveTeamJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      ratings,
    }: {
      jobId: number;
      ratings?: Record<number, number>; // assignment_id -> rating (1-5)
    }) => {
      const response = await apiRequest(
        ENDPOINTS.TEAM_APPROVE_COMPLETION(jobId),
        {
          method: "POST",
          body: JSON.stringify({ ratings }),
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to approve team job"));
      }
      return data;
    },
    onSuccess: (data, variables) => {
      Alert.alert(
        "Job Completed!",
        data.message || "The team job has been marked as complete. Thank you!",
      );
      queryClient.invalidateQueries({
        queryKey: ["team-job", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["jobs", variables.jobId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["jobs", "my-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });
}

/**
 * Start team job with available workers (Option C - partial team after threshold/time)
 */
export function useStartTeamJobWithAvailable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId }: { jobId: number }) => {
      const response = await apiRequest(ENDPOINTS.TEAM_START_AVAILABLE(jobId), {
        method: "POST",
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to start team job"));
      }
      return data;
    },
    onSuccess: (data, variables) => {
      Alert.alert(
        "Team Job Started!",
        data.message || "The team job has started with available workers.",
      );
      queryClient.invalidateQueries({
        queryKey: ["team-job", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["jobs", variables.jobId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["jobs", "my-jobs"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });
}

/**
 * Fetch applications for a team job grouped by skill slot (for clients)
 */
export function useTeamJobApplications(jobId: number, enabled: boolean = true) {
  return useQuery<{ applications: TeamJobApplication[]; total: number }>({
    queryKey: ["team-job-applications", jobId],
    queryFn: async (): Promise<{
      applications: TeamJobApplication[];
      total: number;
    }> => {
      const response = await apiRequest(ENDPOINTS.TEAM_JOB_APPLICATIONS(jobId));
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(getErrorMessage(error, "Failed to fetch team job applications"));
      }
      return response.json() as Promise<{
        applications: TeamJobApplication[];
        total: number;
      }>;
    },
    enabled: enabled && jobId > 0,
  });
}
