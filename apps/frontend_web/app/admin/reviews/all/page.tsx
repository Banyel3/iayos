"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Star,
  Search,
  MessageSquare,
  User,
  Filter,
  ArrowLeft,
  Flag,
} from "lucide-react";
import { Sidebar } from "../../components";
import Link from "next/link";

interface Review {
  id: string;
  reviewer: {
    id: string;
    name: string;
    type: string;
  };
  reviewee: {
    id: string;
    name: string;
    type: string;
  };
  rating: number;
  comment: string;
  job_title: string;
  date: string;
  status: string;
  is_flagged: boolean;
  flag_reason?: string;
}

interface ReviewStats {
  total_reviews: number;
  client_reviews: number;
  worker_reviews: number;
  avg_rating_all: number;
  flagged_reviews: number;
  five_star: number;
  four_star: number;
  three_star: number;
  below_three: number;
}

export default function AllReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [reviewerTypeFilter, setReviewerTypeFilter] = useState<string>("ALL");
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter, reviewerTypeFilter, minRatingFilter]);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/reviews/stats`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      let url = `${API_BASE}/api/adminpanel/reviews/all?page=${page}&page_size=20`;
      
      if (statusFilter && statusFilter !== "ALL") {
        url += `&status=${statusFilter}`;
      }
      if (reviewerTypeFilter && reviewerTypeFilter !== "ALL") {
        url += `&reviewer_type=${reviewerTypeFilter}`;
      }
      if (minRatingFilter > 0) {
        url += `&min_rating=${minRatingFilter}`;
      }

      const response = await fetch(url, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter(
    (review) =>
      review.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (isLoading && !stats) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading reviews...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/reviews">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  All Reviews
                </h1>
                <p className="text-gray-600 mt-1">
                  General feed of all user reviews
                </p>
              </div>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_reviews}</div>
                  <p className="text-xs text-gray-500">All reviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Client Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.client_reviews}
                  </div>
                  <p className="text-xs text-gray-500">From clients</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Worker Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.worker_reviews}
                  </div>
                  <p className="text-xs text-gray-500">From workers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Avg Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.avg_rating_all.toFixed(1)}
                    </div>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="text-xs text-gray-500">Overall</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Flagged
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.flagged_reviews}
                  </div>
                  <p className="text-xs text-gray-500">Issues</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="FLAGGED">Flagged</option>
                  <option value="HIDDEN">Hidden</option>
                </select>

                <select
                  value={reviewerTypeFilter}
                  onChange={(e) => {
                    setReviewerTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Reviewers</option>
                  <option value="CLIENT">Clients Only</option>
                  <option value="WORKER">Workers Only</option>
                </select>

                <select
                  value={minRatingFilter}
                  onChange={(e) => {
                    setMinRatingFilter(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0">All Ratings</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="3.0">3.0+ Stars</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((review) => (
              <Card
                key={review.id}
                className={`hover:shadow-lg transition-shadow ${
                  review.is_flagged ? "border-2 border-red-200 bg-red-50" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          review.reviewer.type === "CLIENT"
                            ? "bg-purple-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <User
                          className={`h-5 w-5 ${
                            review.reviewer.type === "CLIENT"
                              ? "text-purple-600"
                              : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {review.reviewer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {review.reviewer.type}
                        </p>
                      </div>
                    </div>
                    {review.is_flagged && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <Flag className="h-4 w-4" />
                        <span>Flagged</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">{renderStars(review.rating)}</div>

                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {review.comment}
                  </p>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-600">
                          Review for:{" "}
                          <span className="font-medium text-gray-900">
                            {review.reviewee.name}
                          </span>
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {review.reviewee.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600 font-medium">
                          {review.job_title}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(review.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {review.is_flagged && review.flag_reason && (
                    <div className="mt-3 p-2 bg-red-100 rounded-md">
                      <p className="text-xs text-red-800">
                        <strong>Flag Reason:</strong> {review.flag_reason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredReviews.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Reviews Found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "No reviews match your search criteria"
                    : "No reviews available with current filters"}
                </p>
              </CardContent>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
