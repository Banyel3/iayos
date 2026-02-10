/**
 * useReviews Hook
 * Phase 8: Reviews & Ratings System
 *
 * Custom hook for managing reviews using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest, getAbsoluteMediaUrl } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import {
  Review,
  ReviewListResponse,
  ReviewStats,
  MyReviewsResponse,
  SubmitReviewRequest,
  EditReviewRequest,
  ReportReviewRequest,
} from "@/lib/types/review";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const reviewKeys = {
  all: ["reviews"] as const,
  workerReviews: (workerId: number) =>
    [...reviewKeys.all, "worker", workerId] as const,
  clientReviews: (clientId: number) =>
    [...reviewKeys.all, "client", clientId] as const,
  workerStats: (workerId: number) =>
    [...reviewKeys.all, "stats", workerId] as const,
  myReviews: () => [...reviewKeys.all, "my-reviews"] as const,
  pendingReviews: () => [...reviewKeys.all, "pending"] as const,
};

// ============================================================================
// FETCH WORKER REVIEWS
// ============================================================================

export function useWorkerReviews(
  workerId: number,
  page = 1,
  limit = 20,
  sort: "latest" | "highest" | "lowest" = "latest"
) {
  return useQuery({
    queryKey: [...reviewKeys.workerReviews(workerId), page, limit, sort],
    queryFn: async (): Promise<ReviewListResponse> => {
      const response = await apiRequest(
        ENDPOINTS.WORKER_REVIEWS(workerId, page, limit, sort)
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData, "Failed to fetch reviews"));
      }

      const data = await response.json();
      // Transform reviewer profile image URLs for local storage compatibility
      return {
        ...data,
        reviews: data.reviews.map((review: Review) => ({
          ...review,
          reviewer_profile_img: getAbsoluteMediaUrl(
            review.reviewer_profile_img
          ),
        })),
      };
    },
    enabled: !!workerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
  });
}

// ============================================================================
// FETCH CLIENT REVIEWS
// ============================================================================

export function useClientReviews(clientId: number, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...reviewKeys.clientReviews(clientId), page, limit],
    queryFn: async (): Promise<ReviewListResponse> => {
      const response = await apiRequest(
        ENDPOINTS.CLIENT_REVIEWS(clientId, page, limit)
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData, "Failed to fetch client reviews"));
      }

      const data = await response.json();
      // Transform reviewer profile image URLs for local storage compatibility
      return {
        ...data,
        reviews: data.reviews.map((review: Review) => ({
          ...review,
          reviewer_profile_img: getAbsoluteMediaUrl(
            review.reviewer_profile_img
          ),
        })),
      };
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// FETCH REVIEW STATISTICS
// ============================================================================

export function useReviewStats(workerId: number) {
  return useQuery({
    queryKey: reviewKeys.workerStats(workerId),
    queryFn: async (): Promise<ReviewStats> => {
      const response = await apiRequest(ENDPOINTS.REVIEW_STATS(workerId));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData, "Failed to fetch review stats"));
      }

      return response.json();
    },
    enabled: !!workerId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
  });
}

// ============================================================================
// FETCH MY REVIEWS
// ============================================================================

export function useMyReviews() {
  return useQuery({
    queryKey: reviewKeys.myReviews(),
    queryFn: async (): Promise<MyReviewsResponse> => {
      const response = await apiRequest(ENDPOINTS.MY_REVIEWS);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData, "Failed to fetch your reviews"));
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// SUBMIT REVIEW
// ============================================================================

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitReviewRequest): Promise<any> => {
      // Use the jobs API endpoint which supports agency employee reviews and team job reviews
      const response = await apiRequest(ENDPOINTS.SUBMIT_REVIEW(data.job_id), {
        method: "POST",
        body: JSON.stringify({
          // Multi-criteria ratings
          rating_quality: data.rating_quality,
          rating_communication: data.rating_communication,
          rating_punctuality: data.rating_punctuality,
          rating_professionalism: data.rating_professionalism,
          message: data.comment,
          review_target: data.review_target, // "EMPLOYEE" or "AGENCY" for agency jobs
          employee_id: data.employee_id, // For multi-employee agency jobs
          worker_id: data.worker_id, // For team jobs: specific worker to review
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData, "Failed to submit review"));
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate worker reviews
      queryClient.invalidateQueries({
        queryKey: reviewKeys.workerReviews(variables.reviewee_id),
      });
      // Invalidate worker stats
      queryClient.invalidateQueries({
        queryKey: reviewKeys.workerStats(variables.reviewee_id),
      });
      // Invalidate my reviews
      queryClient.invalidateQueries({
        queryKey: reviewKeys.myReviews(),
      });
      // Invalidate pending reviews (force review modal)
      queryClient.invalidateQueries({
        queryKey: reviewKeys.pendingReviews(),
      });
    },
  });
}

// ============================================================================
// EDIT REVIEW
// ============================================================================

export function useEditReview(reviewId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EditReviewRequest): Promise<Review> => {
      const response = await apiRequest(
        `${ENDPOINTS.EDIT_REVIEW(reviewId)}?comment=${encodeURIComponent(data.comment)}&rating=${data.rating}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData, "Failed to edit review"));
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all review queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: reviewKeys.all,
      });
    },
  });
}

// ============================================================================
// REPORT REVIEW
// ============================================================================

type ReportReviewVariables = ReportReviewRequest & { reviewId: number };

export function useReportReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      variables: ReportReviewVariables
    ): Promise<{ message: string }> => {
      const { reviewId, ...data } = variables;
      const response = await apiRequest(ENDPOINTS.REPORT_REVIEW(reviewId), {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData, "Failed to report review"));
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all review queries
      queryClient.invalidateQueries({
        queryKey: reviewKeys.all,
      });
    },
  });
}

// ============================================================================
// PENDING REVIEWS (Force Review Feature)
// ============================================================================

export interface PendingReview {
  job_id: number;
  job_title: string;
  completed_at: string | null;
  reviewee_id: number;
  reviewee_name: string;
  review_type: "WORKER_TO_CLIENT" | "CLIENT_TO_WORKER";
  conversation_id: number | null;
}

export interface PendingReviewsResponse {
  pending_reviews: PendingReview[];
  count: number;
}

/**
 * Fetch pending reviews for the current user.
 * Used by PendingReviewModal to force users to review after job completion.
 */
export function usePendingReviews(enabled = true) {
  return useQuery<PendingReviewsResponse>({
    queryKey: reviewKeys.pendingReviews(),
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.PENDING_REVIEWS);
      if (!response.ok) {
        throw new Error("Failed to fetch pending reviews");
      }
      const json = await response.json();
      return json.data || { pending_reviews: [], count: 0 };
    },
    enabled,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format relative time for review date
 */
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 30) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}
