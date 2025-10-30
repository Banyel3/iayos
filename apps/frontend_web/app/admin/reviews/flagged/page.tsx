"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Star,
  Search,
  Flag,
  User,
  ArrowLeft,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { Sidebar } from "../../components";
import Link from "next/link";

interface FlaggedReview {
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
  is_flagged: boolean;
  flag_reason: string;
  flagged_by: {
    id: string;
    name: string;
  };
  status: string;
}

interface ReviewStats {
  flagged_reviews: number;
  total_reviews: number;
}

export default function FlaggedReviewsPage() {
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReviews();
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
        setStats({
          flagged_reviews: data.stats.flagged_reviews,
          total_reviews: data.stats.total_reviews,
        });
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/reviews/flagged?page=${page}&page_size=20`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching flagged reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter(
    (review) =>
      review.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.flag_reason.toLowerCase().includes(searchTerm.toLowerCase())
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
              <p className="mt-4 text-gray-600">Loading flagged reviews...</p>
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
                  Flagged Reviews
                </h1>
                <p className="text-gray-600 mt-1">
                  Reviews requiring moderation attention
                </p>
              </div>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Flagged Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {stats.flagged_reviews}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Require attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.total_reviews}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">All reviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Flag Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {stats.total_reviews > 0
                      ? (
                          (stats.flagged_reviews / stats.total_reviews) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Of all reviews</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search flagged reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Flag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Flagged Reviews
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "No flagged reviews match your search"
                    : "All reviews are in good standing"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card
                  key={review.id}
                  className="border-2 border-red-200 bg-red-50"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              review.reviewer.type === "CLIENT"
                                ? "bg-purple-100"
                                : "bg-blue-100"
                            }`}
                          >
                            <User
                              className={`h-6 w-6 ${
                                review.reviewer.type === "CLIENT"
                                  ? "text-purple-600"
                                  : "text-blue-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">
                              {review.reviewer.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {review.reviewer.type} reviewing{" "}
                              {review.reviewee.name} ({review.reviewee.type})
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">{renderStars(review.rating)}</div>

                        <div className="bg-white p-4 rounded-lg mb-4 border border-red-200">
                          <p className="text-sm text-gray-700">
                            {review.comment}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Job Title
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {review.job_title}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Review Date
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(review.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-red-900 text-sm mb-1">
                                Flag Reason
                              </p>
                              <p className="text-sm text-red-800">
                                {review.flag_reason}
                              </p>
                              <p className="text-xs text-red-700 mt-2">
                                Flagged by: {review.flagged_by.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                          <Flag className="h-3 w-3" />
                          FLAGGED
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-red-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600 hover:bg-gray-50"
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:bg-green-50 ml-auto"
                      >
                        Remove Flag
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
