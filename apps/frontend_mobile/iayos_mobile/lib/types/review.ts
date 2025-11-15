/**
 * Review and Rating Type Definitions
 * Phase 8: Reviews & Ratings System
 */

export interface Review {
  review_id: number;
  job_id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_profile_img: string | null;
  reviewee_id: number;
  reviewer_type: "CLIENT" | "WORKER";
  rating: number; // 1.0 to 5.0
  comment: string;
  status: "ACTIVE" | "FLAGGED" | "HIDDEN" | "DELETED";
  is_flagged: boolean;
  helpful_count: number;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  can_edit: boolean; // True if within 24 hours
  worker_response?: string | null;
  worker_response_at?: string | null;
}

export interface RatingBreakdown {
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: RatingBreakdown;
  recent_reviews: Review[];
}

export interface ReviewListResponse {
  reviews: Review[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface MyReviewsResponse {
  reviews_given: Review[];
  reviews_received: Review[];
  stats: ReviewStats;
}

// ============================================================================
// API REQUEST PAYLOADS
// ============================================================================

export interface SubmitReviewRequest {
  job_id: number;
  reviewee_id: number; // Account ID of person being reviewed
  rating: number; // 1.0 to 5.0
  comment: string;
  reviewer_type: "CLIENT" | "WORKER";
}

export interface EditReviewRequest {
  comment: string;
  rating: number;
}

export interface ReportReviewRequest {
  reason: "spam" | "offensive" | "misleading" | "other";
  details?: string;
}

// ============================================================================
// UI-SPECIFIC TYPES
// ============================================================================

export interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  interactive?: boolean;
  showHalfStars?: boolean;
}

export interface ReviewCardProps {
  review: Review;
  onReport?: (reviewId: number) => void;
  onEdit?: (reviewId: number) => void;
  showActions?: boolean;
}

export interface RatingBreakdownProps {
  breakdown: RatingBreakdown;
  totalReviews: number;
}
