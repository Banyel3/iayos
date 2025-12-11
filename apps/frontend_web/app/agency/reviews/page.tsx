"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/form_button";
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

function ReviewCard({ review }: { review: AgencyReview }) {
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
      </CardContent>
    </Card>
  );
}

export default function AgencyReviewsPage() {
  const [page, setPage] = useState(1);
  const [reviewTypeFilter, setReviewTypeFilter] =
    useState<ReviewTypeFilter>("ALL");
  const limit = 10;

  const { data, isLoading, error } = useAgencyReviews(
    page,
    limit,
    reviewTypeFilter
  );

  // Reset page when filter changes
  const handleFilterChange = (newFilter: ReviewTypeFilter) => {
    setReviewTypeFilter(newFilter);
    setPage(1);
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
                  <ReviewCard key={review.review_id} review={review} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
