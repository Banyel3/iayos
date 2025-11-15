/**
 * useReviews Hook
 * Phase 8: Reviews & Ratings System
 *
 * Custom hook for managing reviews using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
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
  workerStats: (workerId: number) =>
    [...reviewKeys.all, "stats", workerId] as const,
  myReviews: () => [...reviewKeys.all, "my-reviews"] as const,
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
        throw new Error(errorData.error || "Failed to fetch reviews");
      }

      return response.json();
    },
    enabled: !!workerId,
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
        throw new Error(errorData.error || "Failed to fetch review stats");
      }

      return response.json();
    },
    enabled: !!workerId,
    staleTime: 10 * 60 * 1000, // 10 minutes
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
        throw new Error(errorData.error || "Failed to fetch your reviews");
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
    mutationFn: async (data: SubmitReviewRequest): Promise<Review> => {
      const response = await apiRequest(ENDPOINTS.SUBMIT_REVIEW, {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
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
        throw new Error(errorData.error || "Failed to edit review");
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

export function useReportReview(reviewId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: ReportReviewRequest
    ): Promise<{ message: string }> => {
      const response = await apiRequest(ENDPOINTS.REPORT_REVIEW(reviewId), {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to report review");
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
