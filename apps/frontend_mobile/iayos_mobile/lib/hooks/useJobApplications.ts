/**
 * Job Applications Hooks
 *
 * Manages job applications for clients viewing applicants
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ENDPOINTS,
  fetchJson,
  getAbsoluteMediaUrl,
} from "@/lib/api/config";

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
  confidence_level: "high" | "medium" | "low";
  formatted_duration: string;
  source: "ml" | "fallback";
}

interface JobApplicationsResponse {
  job_id: number;
  job_title: string;
  applications: Application[];
  total_count: number;
  total?: number;
  estimated_completion?: EstimatedCompletion | null;
}

/**
 * Fetch all applications for a specific job
 */
export function useJobApplications(jobId: number) {
  return useQuery<JobApplicationsResponse>({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      const url = ENDPOINTS.JOB_APPLICATIONS(jobId);
      const data = await fetchJson<JobApplicationsResponse>(url);
      // Transform avatar URLs to absolute URLs for local storage compatibility
      return {
        ...data,
        total_count:
          data.total_count ?? data.total ?? data.applications?.length ?? 0,
        applications: data.applications.map((app) => ({
          ...app,
          proposed_budget: Number(app.proposed_budget ?? 0),
          estimated_duration: app.estimated_duration || "",
          worker: {
            ...app.worker,
            avatar: getAbsoluteMediaUrl(app.worker.avatar),
            rating: Number(app.worker?.rating ?? 0),
            skills: Array.isArray(app.worker?.skills) ? app.worker.skills : [],
            profile_completion: Number(app.worker?.profile_completion ?? 0),
          },
        })),
      };
    },
    enabled: !!jobId && jobId > 0,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
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
      const url =
        action === "ACCEPTED"
          ? ENDPOINTS.ACCEPT_APPLICATION(jobId, applicationId)
          : ENDPOINTS.REJECT_APPLICATION(jobId, applicationId);
      try {
        return await fetchJson<any>(url, {
          method: "POST",
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
