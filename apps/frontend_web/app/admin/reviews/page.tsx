"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Search,
  User,
  Briefcase,
  Calendar,
  TrendingUp,
  Flag,
} from "lucide-react";
import { Sidebar } from "../components";
import Link from "next/link";

interface JobReview {
  job_id: string;
  job_title: string;
  category: string | null;
  completion_date: string | null;
  client: {
    id: string;
    name: string;
  };
  worker: {
    id: string;
    name: string;
  } | null;
  client_review?: {
    id: string;
    rating: number;
    comment: string;
    date: string;
    is_flagged: boolean;
    status: string;
  };
  worker_review?: {
    id: string;
    rating: number;
    comment: string;
    date: string;
    is_flagged: boolean;
    status: string;
  };
  review_status: "completed" | "pending" | "none";
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
  review_completion_rate: number;
}

export default function ReviewsPage() {
  const [jobReviews, setJobReviews] = useState<JobReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchJobReviews();
  }, [page]);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/adminpanel/reviews/stats",
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

  const fetchJobReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/reviews/by-job?page=${page}&page_size=20`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setJobReviews(data.job_reviews);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching job reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = jobReviews.filter((review) =>
    review.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (review.worker?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedReviews = filteredReviews.filter(
    (r) => r.review_status === "completed"
  );
  const pendingReviews = filteredReviews.filter(
    (r) => r.review_status === "pending"
  );
  const noReviews = filteredReviews.filter((r) => r.review_status === "none");

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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
            <p className="text-gray-600 mt-1">
              Monitor reviews by job with client and worker feedback
            </p>
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
                  <p className="text-xs text-gray-500">All active reviews</p>
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
                  <p className="text-xs text-gray-500">Overall average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    5 Star Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.five_star}
                  </div>
                  <p className="text-xs text-gray-500">4.5+ ratings</p>
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
                  <p className="text-xs text-gray-500">Needs attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.review_completion_rate.toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-500">Jobs with reviews</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Link href="/admin/reviews">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Reviews by Job
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {jobReviews.length}
                      </p>
                    </div>
                    <Briefcase className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/reviews/all">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        All General Reviews
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {stats?.total_reviews || 0}
                      </p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/reviews/flagged">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">
                        Flagged Reviews
                      </p>
                      <p className="text-2xl font-bold text-red-900">
                        {stats?.flagged_reviews || 0}
                      </p>
                    </div>
                    <Flag className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by job title, client, or worker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.job_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {review.job_title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            review.review_status === "completed"
                              ? "bg-green-100 text-green-800"
                              : review.review_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {review.review_status.toUpperCase()}
                        </span>
                        {review.category && (
                          <span className="text-sm text-gray-500">
                            • {review.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {review.job_id}
                        </span>
                        {review.completion_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Completed:{" "}
                              {new Date(review.completion_date).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="h-5 w-5 text-purple-600" />
                            <p className="font-semibold text-purple-900">
                              Client Review
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {review.client.name} about{" "}
                            {review.worker?.name || "Worker"}
                          </p>
                          {review.client_review ? (
                            <div>
                              {renderStars(review.client_review.rating)}
                              <p className="text-sm text-gray-700 mt-2">
                                {review.client_review.comment}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(
                                  review.client_review.date
                                ).toLocaleDateString()}
                              </p>
                              {review.client_review.is_flagged && (
                                <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
                                  <Flag className="h-3 w-3" />
                                  <span>Flagged</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No review yet
                            </p>
                          )}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="h-5 w-5 text-blue-600" />
                            <p className="font-semibold text-blue-900">
                              Worker Review
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {review.worker?.name || "Worker"} about{" "}
                            {review.client.name}
                          </p>
                          {review.worker_review ? (
                            <div>
                              {renderStars(review.worker_review.rating)}
                              <p className="text-sm text-gray-700 mt-2">
                                {review.worker_review.comment}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(
                                  review.worker_review.date
                                ).toLocaleDateString()}
                              </p>
                              {review.worker_review.is_flagged && (
                                <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
                                  <Flag className="h-3 w-3" />
                                  <span>Flagged</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No review yet
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
                    ? "No reviews match your search"
                    : "No job reviews available yet"}
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
