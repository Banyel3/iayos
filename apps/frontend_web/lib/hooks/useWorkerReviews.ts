"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api/config";

// Types
export interface WorkerReview {
  review_id: number;
  job_id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_profile_img: string | null;
  reviewee_id: number;
  reviewer_type: "CLIENT" | "WORKER";
  rating: number;
  comment: string;
  status: string;
  is_flagged: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
}

export interface WorkerReviewsResponse {
  success: boolean;
  data?: {
    reviews: WorkerReview[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  error?: string;
}

export interface WorkerReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Fetch worker reviews
const fetchWorkerReviews = async (
  workerId: string,
  page: number = 1,
  limit: number = 10
): Promise<WorkerReviewsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/mobile/reviews/worker/${workerId}?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch worker reviews");
  }

  return response.json();
};

// Hook for fetching worker reviews
export function useWorkerReviews(
  workerId: string | undefined,
  page: number = 1,
  limit: number = 10
) {
  const query = useQuery({
    queryKey: ["workerReviews", workerId, page, limit],
    queryFn: () => fetchWorkerReviews(workerId!, page, limit),
    enabled: !!workerId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Extract convenience properties for easier consumption
  return {
    ...query,
    reviews: query.data?.data?.reviews ?? [],
    total_count: query.data?.data?.total_count ?? 0,
    total_pages: query.data?.data?.total_pages ?? 1,
  };
}

// StarRating - returns star string representation
export function StarRating(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return "★".repeat(fullStars) + (hasHalfStar ? "½" : "") + "☆".repeat(emptyStars);
}

// Format review date helper
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper function to format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "Just now" : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  const years = Math.floor(diffDays / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

// Helper to calculate review stats from reviews array
export function calculateReviewStats(
  reviews: WorkerReview[]
): WorkerReviewStats {
  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;

  reviews.forEach((review) => {
    const roundedRating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
    if (roundedRating >= 1 && roundedRating <= 5) {
      ratingBreakdown[roundedRating]++;
    }
    totalRating += review.rating;
  });

  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  return {
    average_rating: Math.round(averageRating * 10) / 10,
    total_reviews: reviews.length,
    rating_breakdown: ratingBreakdown,
  };
}

// Render star rating
export function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    "★".repeat(fullStars) + (hasHalfStar ? "½" : "") + "☆".repeat(emptyStars)
  );
}
