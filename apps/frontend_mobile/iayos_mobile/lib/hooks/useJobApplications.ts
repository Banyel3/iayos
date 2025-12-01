/**
 * Job Applications Hooks
 *
 * Manages job applications for clients viewing applicants
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, apiRequest, fetchJson } from "@/lib/api/config";

interface Worker {
  id: number;
  name: string;
  avatar: string | null;
  rating: number;
  skills: string[];
  profile_completion: number;
}

interface Application {
  id: number;
  worker: Worker;
  proposed_budget: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  created_at: string;
  cover_letter?: string;
  estimated_duration?: string;
}

interface EstimatedCompletion {
  predicted_hours: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  confidence_level: 'high' | 'medium' | 'low';
  formatted_duration: string;
  source: 'ml' | 'fallback';
}

interface JobApplicationsResponse {
  job_id: number;
  job_title: string;
  applications: Application[];
  total_count: number;
  estimated_completion?: EstimatedCompletion | null;
}

/**
 * Fetch all applications for a specific job
 */
export function useJobApplications(jobId: number) {
  return useQuery<JobApplicationsResponse>({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      const url = `${API_BASE_URL}/jobs/${jobId}/applications`;
      return fetchJson<JobApplicationsResponse>(url);
    },
    enabled: !!jobId && jobId > 0,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes (cacheTime)
  });
}

/**
 * Accept or reject a job application
 */
export function useManageApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      applicationId,
      action,
    }: {
      jobId: number;
      applicationId: number;
      action: "ACCEPTED" | "REJECTED";
    }) => {
      const url = `${API_BASE_URL}/jobs/${jobId}/application/${applicationId}`;
      try {
        return await fetchJson<any>(url, {
          method: "PUT",
          body: JSON.stringify({ status: action }),
        });
      } catch (e: any) {
        throw new Error(
          e?.message || `Failed to ${action.toLowerCase()} application`
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate job applications list
      queryClient.invalidateQueries({
        queryKey: ["job-applications", variables.jobId],
      });

      // Invalidate my jobs list (to update application counts)
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
