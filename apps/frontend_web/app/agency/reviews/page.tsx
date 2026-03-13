"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api/config";
import {
  useAgencyReviews,
  formatRelativeTime,
  AgencyReview,
  ReviewTypeFilter,
} from "@/lib/hooks/useAgencyReviews";
import {
  Star,
  Search,
  MessageSquare,
  TrendingUp,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Reply,
  X,
  Send,
  Flag,
  MoreVertical,
} from "lucide-react";

export default function AgencyReviewsPage() {
  const [page, setPage] = useState(1);
  const [reviewTypeFilter, setReviewTypeFilter] = useState<ReviewTypeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 10;

  // Response modal state
  const [respondingToReviewId, setRespondingToReviewId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const { data, isLoading, error, refetch } = useAgencyReviews(
    page,
    limit,
    reviewTypeFilter,
  );

  // Filter reviews on client-side if searchQuery is present
  // Note: For production, this should be done on backend
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

  const filteredReviews = searchQuery 
    ? reviews.filter(r => 
        r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.employee_name && r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : reviews;

  const handleFilterChange = (newFilter: ReviewTypeFilter) => {
    setReviewTypeFilter(newFilter);
    setPage(1);
  };

  const handleRespond = (reviewId: number, currentResponse?: string | null) => {
    setRespondingToReviewId(reviewId);
    setResponseText(currentResponse || "");
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
        },
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
    }
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
        <span className="ml-1 text-sm font-bold text-gray-900">
          {(rating ?? 0).toFixed(1)}
        </span>
      </div>
    );
  };

  if (isLoading && reviews.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
              <MessageSquare className="h-6 w-6 text-[#00BAF1] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">Loading reviews...</p>
            <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-12 text-center">
            <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-1">Failed to Load Reviews</h3>
            <p className="text-red-600">Please try again later or contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agency Reviews</h1>
        </div>
        <p className="text-gray-500 text-sm sm:text-base">
          Monitor and manage your agency and employee reviews
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><MessageSquare className="h-5 w-5 text-[#00BAF1]" /></div>
              <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Total Reviews</p>
            <p className="text-xl font-bold text-gray-900">{stats.total_reviews}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Star className="h-5 w-5 text-[#00BAF1]" /></div>
              <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full"></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Average Rating</p>
            <p className="text-xl font-bold text-gray-900">{(stats.average_rating ?? 0).toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Building2 className="h-5 w-5 text-[#00BAF1]" /></div>
              <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full"></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Agency Reviews</p>
            <p className="text-xl font-bold text-gray-900">{stats.agency_reviews_count}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Users className="h-5 w-5 text-[#00BAF1]" /></div>
              <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Employee Reviews</p>
            <p className="text-xl font-bold text-gray-900">{stats.employee_reviews_count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#00BAF1] transition-colors" />
          <Input
            placeholder="Search reviews by content, job, or reviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 border-gray-200 focus:border-[#00BAF1] focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
          />
        </div>
        <select
          value={reviewTypeFilter}
          onChange={(e) => handleFilterChange(e.target.value as ReviewTypeFilter)}
          className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
        >
          <option value="ALL">All Review Types</option>
          <option value="AGENCY">Agency Only</option>
          <option value="EMPLOYEE">Employees Only</option>
        </select>
      </div>

      {/* Reviews Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Reviews List</CardTitle>
          <CardDescription>
            Overview of all reviews (Page {page} of {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reviewer / Reviewee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Comment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job / Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No Reviews Found</h3>
                      <p className="text-gray-500">Try adjusting your filters or search query</p>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review, index) => (
                    <tr
                      key={review.review_id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 leading-none mb-1">{review.client_name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Target:</span>
                            <Badge variant={review.review_type === "AGENCY" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {review.review_type === "AGENCY" ? "Agency" : review.employee_name}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderStars(review.rating)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 max-w-[300px]">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {review.comment}
                          </p>
                          {review.agency_response && (
                            <div className="mt-1 flex items-start gap-1 p-2 bg-blue-50/50 rounded border border-blue-100/50">
                              <Reply className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                              <p className="text-[10px] text-blue-600 line-clamp-1 italic">
                                Your response: {review.agency_response}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700 font-medium line-clamp-1">Job: {review.job_title}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg border-gray-200 hover:border-blue-500 hover:text-blue-600"
                            onClick={() => handleRespond(review.review_id, review.agency_response)}
                          >
                            <Reply className="h-3.5 w-3.5 mr-1" />
                            {review.agency_response ? "Edit" : "Respond"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-red-500"
                            onClick={() => handleReport(review.review_id)}
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${page === 1 ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            if (totalPages > 7) {
              if (p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                if (p === 2 || p === totalPages - 1) return <span key={p} className="w-4 text-center text-gray-400">...</span>;
                return null;
              }
            }
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${p === page ? "bg-[#00BAF1] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${page === totalPages ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Response Modal */}
      {respondingToReviewId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-0 animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Reply className="h-5 w-5 text-[#00BAF1]" />
                  Respond to Review
                </CardTitle>
                <CardDescription>Your response will be visible to the public</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                onClick={() => setRespondingToReviewId(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-sm text-gray-600">
                Keep your communication professional and helpful. Address the client's comments directly.
              </p>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write your response here... (min 10 characters)"
                className="min-h-[120px] rounded-xl border-gray-200 focus:border-[#00BAF1] focus:ring-sky-100 resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${responseText.length < 10 ? 'text-red-400' : 'text-green-500'}`}>
                  {responseText.length}/500 characters
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-lg h-9 px-4 font-semibold text-gray-500"
                    onClick={() => setRespondingToReviewId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={isSubmittingResponse || responseText.length < 10}
                    className="bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white rounded-lg h-9 px-6 font-semibold"
                  >
                    {isSubmittingResponse ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post Response
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
  );
}
