import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS } from "../api/config";

// Types
export interface EarningsSummary {
  totalEarnings: number; // alias for totalNet
  totalGross: number;
  totalFees: number;
  totalNet: number;
  availableBalance: number; // alias for currentBalance
  currentBalance: number;
  pendingPayments: number; // alias for pendingEarnings
  pendingEarnings: number;
  completedJobs: number;
  averageEarning: number;
}

export interface EarningsHistoryItem {
  id: number;
  jobId: number;
  jobTitle: string;
  clientName: string;
  amount: number; // alias for grossAmount
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  date: string; // alias for paidAt
  paidAt: string;
  status: "pending" | "released" | "withdrawn" | "completed";
}

export interface EarningsHistoryResponse {
  earnings: EarningsHistoryItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Hook: Get earnings summary
export const useEarningsSummary = () => {
  return useQuery<EarningsSummary>({
    queryKey: ["earningsSummary"],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.EARNINGS_SUMMARY, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch earnings summary");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook: Get earnings history
export const useEarningsHistory = (filters?: {
  page?: number;
  limit?: number;
  period?: "week" | "month" | "all";
  startDate?: string;
  endDate?: string;
  status?: "pending" | "released" | "withdrawn";
}) => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append("page", filters.page.toString());
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.startDate) queryParams.append("start_date", filters.startDate);
  if (filters?.endDate) queryParams.append("end_date", filters.endDate);
  if (filters?.status) queryParams.append("status", filters.status);

  const url = `${ENDPOINTS.EARNINGS_HISTORY}?${queryParams.toString()}`;

  return useQuery<EarningsHistoryResponse>({
    queryKey: ["earningsHistory", filters],
    queryFn: async () => {
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch earnings history");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
