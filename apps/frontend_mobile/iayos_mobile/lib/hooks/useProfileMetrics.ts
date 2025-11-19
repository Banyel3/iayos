import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

export interface ProfileMetrics {
  profile_type?: string | null;
  payment_method_verified: boolean;
  payment_method_verified_at?: string | null;
  response_rate?: number | null;
  response_rate_sample?: number;
  rating?: number;
  total_reviews?: number;
  rating_breakdown?: Record<string, number> | null;
  generated_at?: string;
}

interface UseProfileMetricsOptions {
  enabled?: boolean;
}

export function useProfileMetrics(options: UseProfileMetricsOptions = {}) {
  const { enabled = true } = options;

  return useQuery<ProfileMetrics>({
    queryKey: ["profile-metrics"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.PROFILE_METRICS);

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to fetch profile metrics");
      }

      return (await response.json()) as ProfileMetrics;
    },
  });
}
