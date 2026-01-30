"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  Star,
  Flag,
  EyeOff,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  MessageSquare,
} from "lucide-react";

interface FlaggedReview {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  app_version: string;
  platform: string;
  device_model: string;
  created_at: string;
  is_flagged: boolean;
  flag_reason: string;
  flag_severity: string;
  is_hidden: boolean;
}

export default function FlaggedReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedReviews, setSelectedReviews] = useState<Set<number>>(
    new Set(),
  );
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchFlaggedReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (severityFilter !== "all") params.append("severity", severityFilter);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/app-reviews/flagged?${params}`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch flagged reviews");

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
    fetchFlaggedReviews();
  }, [severityFilter, pagination.page]);

  const handleHide = async (reviewId: number) => {
    if (!confirm("Are you sure you want to hide this review?")) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/reviews/${reviewId}/hide`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reason: "Flagged review - inappropriate content",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to hide review");

      alert("Review hidden successfully");
      fetchFlaggedReviews();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to hide review");
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this review? This action cannot be undone.",
      )
    )
      return;

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reason: "Flagged review - violation of terms",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to delete review");

      alert("Review deleted successfully");
      fetchFlaggedReviews();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete review");
    }
  };

  const handleDismissFlag = async (reviewId: number) => {
    if (!confirm("Are you sure you want to dismiss this flag?")) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/app-reviews/${reviewId}/restore`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Failed to dismiss flag");

      alert("Flag dismissed successfully");
      fetchFlaggedReviews();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to dismiss flag");
    }
  };

  const handleSelectAll = () => {
    if (selectedReviews.size === reviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(reviews.map((r) => r.id)));
    }
  };

  const handleBulkHide = async () => {
    if (selectedReviews.size === 0) {
      alert("Please select reviews to hide");
      return;
    }

    if (!confirm(`Hide ${selectedReviews.size} selected reviews?`)) return;

    let successCount = 0;
    for (const reviewId of selectedReviews) {
      try {
        await fetch(`${API_BASE}/api/adminpanel/reviews/${reviewId}/hide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: "Bulk hide - flagged reviews" }),
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to hide review ${reviewId}:`, error);
      }
    }

    alert(
      `Successfully hidden ${successCount} of ${selectedReviews.size} reviews`,
    );
    setSelectedReviews(new Set());
    fetchFlaggedReviews();
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.size === 0) {
      alert("Please select reviews to delete");
      return;
    }

    if (
      !confirm(
        `Permanently delete ${selectedReviews.size} selected reviews? This action cannot be undone.`,
      )
    )
      return;

    let successCount = 0;
    for (const reviewId of selectedReviews) {
      try {
        await fetch(`${API_BASE}/api/adminpanel/reviews/${reviewId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: "Bulk delete - flagged reviews" }),
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to delete review ${reviewId}:`, error);
      }
    }

    alert(
      `Successfully deleted ${successCount} of ${selectedReviews.size} reviews`,
    );
    setSelectedReviews(new Set());
    fetchFlaggedReviews();
  };

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

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            🔴 High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            🟡 Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            🟢 Low
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            ⚪ Unknown
          </Badge>
        );
    }
  };

  const filteredReviews = reviews.filter((review) =>
    searchQuery
      ? review.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  if (loading && reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-red-600 mx-auto"></div>
                  <Flag className="h-6 w-6 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading flagged reviews...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="pl-72 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Back Button */}
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Button>

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <Flag className="h-8 w-8" />
                <h1 className="text-4xl font-bold">Flagged Reviews</h1>
              </div>
              <p className="text-red-100 text-lg">
                Reviews requiring moderation attention ({pagination.total}{" "}
                flagged)
              </p>
            </div>
          </div>

          {/* Filters and Actions */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative group md:col-span-2">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                    <Input
                      type="text"
                      placeholder="Search flagged reviews..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl"
                    />
                  </div>

                  {/* Severity Filter */}
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all font-medium text-gray-700"
                  >
                    <option value="all">🚩 All Severities</option>
                    <option value="high">🔴 High Severity</option>
                    <option value="medium">🟡 Medium Severity</option>
                    <option value="low">🟢 Low Severity</option>
                  </select>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={
                        selectedReviews.size === reviews.length &&
                        reviews.length > 0
                      }
                      onChange={handleSelectAll}
                      className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-600">
                      {selectedReviews.size > 0
                        ? `${selectedReviews.size} selected`
                        : "Select all"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedReviews.size > 0 && (
                      <>
                        <Button
                          onClick={handleBulkHide}
                          className="bg-orange-500 hover:bg-orange-600 text-white h-10 px-4 rounded-xl"
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Bulk Hide
                        </Button>
                        <Button
                          onClick={handleBulkDelete}
                          className="bg-red-600 hover:bg-red-700 text-white h-10 px-4 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Bulk Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Flagged Reviews
                  </h3>
                  <p className="text-gray-600">
                    All clear! There are no flagged reviews requiring attention.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredReviews.map((review) => (
                <Card
                  key={review.id}
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  <CardContent className="relative p-6">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedReviews.has(review.id)}
                        onChange={() => {
                          const newSelected = new Set(selectedReviews);
                          if (newSelected.has(review.id)) {
                            newSelected.delete(review.id);
                          } else {
                            newSelected.add(review.id);
                          }
                          setSelectedReviews(newSelected);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />

                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-semibold text-gray-900">
                                {review.user_name}
                              </p>
                              <span className="text-xs text-gray-500">
                                {review.platform === "ios"
                                  ? "🍎 iOS"
                                  : "🤖 Android"}
                              </span>
                              {getSeverityBadge(review.flag_severity)}
                              {review.is_hidden && (
                                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
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

                            <p className="text-gray-700 leading-relaxed">
                              {review.comment}
                            </p>

                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                              <p className="text-sm text-red-800">
                                <span className="font-semibold">
                                  Flag Reason:
                                </span>{" "}
                                {review.flag_reason}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>v{review.app_version}</span>
                              <span>•</span>
                              <span>{review.device_model}</span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  review.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t">
                          <Button
                            onClick={() =>
                              router.push(`/admin/reviews/${review.id}`)
                            }
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            View Details
                          </Button>
                          <Button
                            onClick={() => handleHide(review.id)}
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide
                          </Button>
                          <Button
                            onClick={() => handleDelete(review.id)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button
                            onClick={() => handleDismissFlag(review.id)}
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Dismiss Flag
                          </Button>
                        </div>
                      </div>
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
                className="h-11 px-6 border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-6 h-11 bg-red-50 border-2 border-red-200 rounded-xl">
                <span className="text-sm font-medium text-gray-700">
                  Page{" "}
                  <span className="text-red-600 font-bold">
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
                className="h-11 px-6 border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
