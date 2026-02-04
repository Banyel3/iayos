"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { API_BASE } from "@/lib/api/config";

const API_BASE_URL = API_BASE;

// Types
export interface AgencyReview {
  review_id: number;
  job_id: number;
  job_title: string;
  client_name: string;
  client_avatar: string | null;
  rating: number;
  comment: string;
  created_at: string;
  review_type: "AGENCY" | "EMPLOYEE";
  employee_name: string | null;
  employee_id: number | null;
  agency_response?: string | null;
}

export interface AgencyReviewsStats {
  total_reviews: number;
  average_rating: number;
  positive_reviews: number;
  neutral_reviews: number;
  negative_reviews: number;
  agency_reviews_count: number;
  employee_reviews_count: number;
}

export interface AgencyReviewsResponse {
  success: boolean;
  reviews: AgencyReview[];
  stats: AgencyReviewsStats;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export type ReviewTypeFilter = "ALL" | "AGENCY" | "EMPLOYEE";

// Fetch function
async function fetchAgencyReviews(
  page: number = 1,
  limit: number = 10,
  reviewType: ReviewTypeFilter = "ALL",
): Promise<AgencyReviewsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (reviewType !== "ALL") {
    params.append("review_type", reviewType);
  }

  const response = await fetch(
    `${API_BASE_URL}/agency/reviews?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized - Please log in again");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, "Failed to fetch reviews"));
  }

  return response.json();
}

// Hook
export function useAgencyReviews(
  page: number = 1,
  limit: number = 10,
  reviewType: ReviewTypeFilter = "ALL",
) {
  return useQuery({
    queryKey: ["agencyReviews", page, limit, reviewType],
    queryFn: () => fetchAgencyReviews(page, limit, reviewType),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

// Helper function to format rating as stars
export function formatRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    "★".repeat(fullStars) + (hasHalfStar ? "½" : "") + "☆".repeat(emptyStars)
  );
}

// Helper function to get rating color class
export function getRatingColorClass(rating: number): string {
  if (rating >= 4) return "text-green-600";
  if (rating >= 3) return "text-yellow-600";
  return "text-red-600";
}

// Helper function to format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
