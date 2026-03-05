import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";

export type MobileReportType = "user" | "job" | "review" | "message" | "other";
export type MobileReportReason =
  | "spam"
  | "harassment"
  | "fraud"
  | "inappropriate"
  | "fake_profile"
  | "other";

export interface SubmitReportPayload {
  report_type: MobileReportType;
  reason: MobileReportReason;
  description: string;
  reported_user_id?: number;
  related_content_id?: number;
}

export interface SubmittedReport {
  id: number;
  report_type: MobileReportType;
  reason: MobileReportReason;
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  action_taken: string;
  related_content_id?: number | null;
  reported_user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface MyReportsResponse {
  reports: SubmittedReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitReportPayload) => {
      const response = await apiRequest(ENDPOINTS.REPORTS_CREATE, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to submit report"));
      }

      return data as { report_id: number; message: string; status: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
    },
  });
}

export function useMyReports(status: string = "all", page = 1, limit = 20) {
  return useQuery<MyReportsResponse>({
    queryKey: ["my-reports", status, page, limit],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (status && status !== "all") query.append("status", status);
      query.append("page", String(page));
      query.append("limit", String(limit));

      const response = await apiRequest(`${ENDPOINTS.MY_REPORTS}?${query.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(getErrorMessage(data, "Failed to fetch reports"));
      }

      return (await response.json()) as MyReportsResponse;
    },
    staleTime: 30000,
  });
}
