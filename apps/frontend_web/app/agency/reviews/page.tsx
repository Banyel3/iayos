"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/form_button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api/config";
import {
  useAgencyReviews,
  formatRelativeTime,
  getRatingColorClass,
  AgencyReview,
  ReviewTypeFilter,
} from "@/lib/hooks/useAgencyReviews";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Users,
  Reply,
  X,
  Send,
  Flag,
} from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : star - 0.5 <= rating
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

interface ReviewCardProps {
  review: AgencyReview;
  onRespond: (reviewId: number) => void;
  onReport: (reviewId: number) => void;
}

function ReviewCard({ review, onRespond, onReport }: ReviewCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {review.client_avatar ? (
              <img
                src={review.client_avatar}
                alt={review.client_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
            <div>
              <p className="font-medium">{review.client_name}</p>
              <p className="text-xs text-gray-500">
                {formatRelativeTime(review.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StarRating rating={review.rating} />
            <Badge
              variant={
                review.review_type === "AGENCY" ? "default" : "secondary"
              }
              className="text-xs"
            >
              {review.review_type === "AGENCY" ? (
                <>
                  <Building2 className="h-3 w-3 mr-1" />
                  Agency
                </>
              ) : (
                <>
                  <User className="h-3 w-3 mr-1" />
                  {review.employee_name}
                </>
              )}
            </Badge>
          </div>
        </div>

        <div className="mb-2">
          <p className="text-sm text-gray-600 font-medium">
            Job: {review.job_title}
          </p>
        </div>

        <p className="text-sm text-gray-700">{review.comment}</p>

        {/* Agency Response (if exists) */}
        {review.agency_response && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Reply className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Agency Response</span>
            </div>
            <p className="text-sm text-blue-700">{review.agency_response}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex items-center gap-2 border-t pt-3">
          {!review.agency_response && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRespond(review.review_id)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Reply className="h-4 w-4 mr-1" />
              Respond
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReport(review.review_id)}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <Flag className="h-4 w-4 mr-1" />
            Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgencyReviewsPage() {
  const [page, setPage] = useState(1);
  const [reviewTypeFilter, setReviewTypeFilter] =
    useState<ReviewTypeFilter>("ALL");
  const limit = 10;

  // Response modal state
  const [respondingToReviewId, setRespondingToReviewId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const { data, isLoading, error, refetch } = useAgencyReviews(
    page,
    limit,
    reviewTypeFilter
  );

  // Reset page when filter changes
  const handleFilterChange = (newFilter: ReviewTypeFilter) => {
    setReviewTypeFilter(newFilter);
    setPage(1);
  };

  const handleRespond = (reviewId: number) => {
    setRespondingToReviewId(reviewId);
    setResponseText("");
  };

  const handleSubmitResponse = async () => {
    if (!respondingToReviewId || !responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    if (responseText.length < 10) {
      toast.error("Response must be at least 10 characters");
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/agency/reviews/${respondingToReviewId}/respond`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response: responseText }),
        }
      );

      if (res.ok) {
        toast.success("Response submitted successfully");
        setRespondingToReviewId(null);
        setResponseText("");
        refetch();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit response");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Error submitting response");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleReport = (reviewId: number) => {
    if (confirm("Are you sure you want to report this review for inappropriate content?")) {
      toast.info("Review reported. Our team will review it shortly.");
      // In a real implementation, this would call an API
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Agency Reviews</h1>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading reviews...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Agency Reviews</h1>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <p className="text-red-600">
                Failed to load reviews. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    total_reviews: 0,
    average_rating: 0,
    positive_reviews: 0,
    neutral_reviews: 0,
    negative_reviews: 0,
    agency_reviews_count: 0,
    employee_reviews_count: 0,
  };

  const reviews = data?.reviews || [];
  const totalPages = data?.total_pages || 1;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Agency Reviews</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {stats.total_reviews}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                <MessageSquare className="inline h-3 w-3 mr-1" />
                {stats.agency_reviews_count} agency,{" "}
                {stats.employee_reviews_count} employee
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-yellow-900">
                  {stats.average_rating.toFixed(1)}
                </span>
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-yellow-600 mt-1">out of 5 stars</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Positive Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-green-900">
                  {stats.positive_reviews}
                </span>
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs text-green-600 mt-1">
                {stats.total_reviews > 0
                  ? Math.round(
                      (stats.positive_reviews / stats.total_reviews) * 100
                    )
                  : 0}
                % of total (4+ stars)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Other Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Minus className="h-4 w-4 text-yellow-500" />
                  <span className="text-lg font-semibold">
                    {stats.neutral_reviews}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <span className="text-lg font-semibold">
                    {stats.negative_reviews}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Neutral (3★) / Negative (&lt;3★)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={reviewTypeFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("ALL")}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            All Reviews
            <Badge variant="secondary" className="ml-1 text-xs">
              {stats.total_reviews}
            </Badge>
          </Button>
          <Button
            variant={reviewTypeFilter === "AGENCY" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("AGENCY")}
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            Agency Reviews
            <Badge variant="secondary" className="ml-1 text-xs">
              {stats.agency_reviews_count}
            </Badge>
          </Button>
          <Button
            variant={reviewTypeFilter === "EMPLOYEE" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("EMPLOYEE")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Employee Reviews
            <Badge variant="secondary" className="ml-1 text-xs">
              {stats.employee_reviews_count}
            </Badge>
          </Button>
        </div>

        {/* Reviews List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {reviewTypeFilter === "ALL"
                ? "All Reviews"
                : reviewTypeFilter === "AGENCY"
                  ? "Agency Reviews"
                  : "Employee Reviews"}
            </CardTitle>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  No reviews yet
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Reviews will appear here once clients rate your agency or
                  employees.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.review_id}
                    review={review}
                    onRespond={handleRespond}
                    onReport={handleReport}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Modal */}
        {respondingToReviewId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Reply className="h-5 w-5 text-blue-600" />
                  Respond to Review
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRespondingToReviewId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Your response will be visible to everyone. Keep it professional and helpful.
                </p>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response here... (min 10 characters)"
                  rows={4}
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {responseText.length}/500 characters
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRespondingToReviewId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={isSubmittingResponse || responseText.length < 10}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmittingResponse ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Response
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
