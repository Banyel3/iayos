import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL, apiRequest } from "@/lib/api/config";

export type JobStatus = "active" | "in_progress" | "completed" | "all";
export type UserType = "WORKER" | "CLIENT";

export interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  status: string;
  urgency: string;
  expectedDuration: number;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    profileImg?: string;
  };
  worker?: {
    id: number;
    firstName: string;
    lastName: string;
    profileImg?: string;
  };
  category?: {
    id: number;
    name: string;
  };
  location?: {
    address: string;
    city: string;
    province: string;
  };
  applicationCount?: number;
  escrowPaid?: boolean;
  remainingPaymentPaid?: boolean;
}

export interface MyJobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function useMyJobs(
  status: JobStatus = "all",
  userType: UserType = "WORKER",
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ["my-jobs", status, userType, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (status !== "all") {
        // Map status to backend values
        const statusMap: Record<JobStatus, string> = {
          active: "ACTIVE",
          in_progress: "IN_PROGRESS",
          completed: "COMPLETED",
          all: "",
        };
        const backendStatus = statusMap[status];
        if (backendStatus) {
          params.append("status", backendStatus);
        }
      }

      params.append("page", page.toString());
      params.append("limit", limit.toString());

      // Different endpoints for workers vs clients
      const endpoint =
        userType === "WORKER"
          ? `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/my-jobs?${params.toString()}`
          : `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/my-requests?${params.toString()}`;

      const response = await apiRequest(endpoint);

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      return data as MyJobsResponse;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
    retry: 2,
  });
}

// Get application count for client jobs
export function useApplicationCounts() {
  return useQuery({
    queryKey: ["application-counts"],
    queryFn: async () => {
      const response = await apiRequest(
        `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/application-counts`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch application counts");
      }

      const data = await response.json();
      return data as Record<number, number>; // jobId -> count
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
