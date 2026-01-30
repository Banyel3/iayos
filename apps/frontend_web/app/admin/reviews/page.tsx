"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Star,
  Flag,
  EyeOff,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface Review {
  id: number;
  job_id: number;
  job_title: string;
  reviewer_id: number;
  reviewer_name: string;
  reviewee_id: number;
  reviewee_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_flagged: boolean;
  is_hidden: boolean;
  status: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append("search", searchQuery);
      if (ratingFilter !== "all") params.append("rating_filter", ratingFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (userTypeFilter !== "all") params.append("user_type", userTypeFilter);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/app-reviews/all?${params}`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      setReviews(data.reviews || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error("Error:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchReviews();
    }, 300);

    return () => clearTimeout(debounce);
  }, [
    searchQuery,
    ratingFilter,
    statusFilter,
    userTypeFilter,
    pagination.page,
  ]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
              }`}
          />
        ))}
      </div>
    );
  };

  const flaggedCount = reviews.filter((r) => r.is_flagged).length;
  const hiddenCount = reviews.filter((r) => r.is_hidden).length;
  const avgRating =
    reviews.length > 0
      ? (
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      ).toFixed(1)
      : "0.0";

  if (loading && reviews.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8 pl-72">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                  <MessageSquare className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading reviews...
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Please wait while we fetch the data
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 pl-72">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="h-8 w-8" />
                    <h1 className="text-4xl font-bold">Reviews & Ratings</h1>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Monitor and moderate platform reviews and ratings
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/admin/reviews/flagged">
                    <Button className="bg-red-500 hover:bg-red-600 text-white px-6 h-12 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
                      <Flag className="h-5 w-5 mr-2" />
                      Flagged Reviews
                    </Button>
                  </Link>
                  <Link href="/admin/reviews/analytics">
                    <Button className="bg-white text-blue-700 hover:bg-blue-50 px-6 h-12 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Analytics
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Reviews
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {pagination.total}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-yellow-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Average Rating
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  ⭐ {avgRating}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <Flag className="h-6 w-6 text-red-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Flagged
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {flaggedCount}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <EyeOff className="h-6 w-6 text-orange-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Hidden</p>
                <p className="text-3xl font-bold text-orange-600">
                  {hiddenCount}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                </div>

                {/* Rating Filter */}
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="all">⭐ All Ratings</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                  <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                  <option value="3">⭐⭐⭐ 3 Stars</option>
                  <option value="2">⭐⭐ 2 Stars</option>
                  <option value="1">⭐ 1 Star</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="all">📋 All Status</option>
                  <option value="active">✓ Active</option>
                  <option value="flagged">🚩 Flagged</option>
                  <option value="hidden">👁️ Hidden</option>
                </select>

                {/* User Type Filter */}
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="all">👥 All Types</option>
                  <option value="client_to_worker">👔 Client → Worker</option>
                  <option value="worker_to_client">👷 Worker → Client</option>
                </select>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {reviews.length} of {pagination.total} reviews
                </p>
                <Button
                  variant="outline"
                  className="h-10 px-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl font-medium"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Reviews Found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters or search query
                  </p>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card
                  key={review.id}
                  onClick={() => router.push(`/admin/reviews/${review.id}`)}
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.reviewer_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              reviewed {review.reviewee_name}
                            </p>
                          </div>
                          {review.is_flagged && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                              🚩 Flagged
                            </Badge>
                          )}
                          {review.is_hidden && (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
                              👁️ Hidden
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {renderStars(review.rating)}
                          <span className="text-lg font-bold text-gray-900">
                            {review.rating}.0
                          </span>
                        </div>

                        <p className="text-gray-700 leading-relaxed line-clamp-2">
                          {review.comment}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Job: {review.job_title}</span>
                          <span>•</span>
                          <span>
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="h-11 px-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-6 h-11 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <span className="text-sm font-medium text-gray-700">
                  Page{" "}
                  <span className="text-blue-600 font-bold">
                    {pagination.page}
                  </span>{" "}
                  of {pagination.pages}
                </span>
              </div>
              <Button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.pages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.pages}
                className="h-11 px-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
