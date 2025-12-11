import { API_BASE_URL } from "./config";

export interface ProfileMetrics {
  profile_type: "WORKER" | "CLIENT" | null;
  payment_method_verified: boolean;
  payment_method_verified_at?: string | null;
  response_rate: number | null;
  response_rate_sample: number;
  rating: number;
  total_reviews: number;
  rating_breakdown?: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  } | null;
  generated_at?: string;
}

export async function fetchProfileMetrics(): Promise<ProfileMetrics> {
  const response = await fetch(`${API_BASE_URL}/accounts/profile/metrics`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch profile metrics");
  }

  const data = await response.json();
  return data as ProfileMetrics;
}
