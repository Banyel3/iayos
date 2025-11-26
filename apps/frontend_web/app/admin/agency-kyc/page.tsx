"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/form_button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface AgencyKYCSubmission {
  agency_kyc_id: number;
  account_id: number;
  account_email: string;
  business_name: string;
  business_desc: string;
  registration_number: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  reviewed_at: string | null;
  reviewed_by_email: string | null;
  submitted_at: string;
  files: Array<{
    file_id: number;
    file_type: string;
    file_url: string;
    file_name: string;
  }>;
}

const AdminAgencyKYC = () => {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<AgencyKYCSubmission[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<AgencyKYCSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [processing, setProcessing] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const statusParam = filter === "ALL" ? "" : `?status=${filter}`;
      const res = await fetch(`${API_BASE}/api/adminpanel/agency-kyc${statusParam}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        showToast({ type: "error", title: "Error", message: "Failed to fetch KYC submissions" });
        return;
      }

      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error(err);
      showToast({ type: "error", title: "Error", message: "Failed to load submissions" });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submissionId: number, action: "APPROVE" | "REJECT", notes: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/adminpanel/agency-kyc/${submissionId}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast({ 
          type: "error", 
          title: "Review Failed", 
          message: data?.message || "Failed to submit review" 
        });
        return;
      }

      showToast({
        type: "success",
        title: action === "APPROVE" ? "Approved" : "Rejected",
        message: `KYC submission ${action === "APPROVE" ? "approved" : "rejected"} successfully`,
      });

      // Close modal and refresh
      setSelectedSubmission(null);
      setReviewNotes("");
      setReviewAction(null);
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      showToast({ type: "error", title: "Error", message: "Failed to submit review" });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">✓ Verified</Badge>;
    }
    if (status === "REJECTED") {
      return <Badge className="bg-red-100 text-red-800 border-red-200">✗ Rejected</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⏳ Pending</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderModal = () => {
    if (!selectedSubmission) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
          {/* Modal Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">KYC Review</h2>
                <p className="text-blue-100">{selectedSubmission.account_email}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Business Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Business Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Business Name</p>
                  <p className="font-semibold text-gray-900">{selectedSubmission.business_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-semibold text-gray-900">{selectedSubmission.registration_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{selectedSubmission.business_desc || "No description provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted On</p>
                  <p className="text-gray-900">{formatDate(selectedSubmission.submitted_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
              </div>
            </div>

            {/* Documents Grid */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Submitted Documents ({selectedSubmission.files.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSubmission.files.map((file) => (
                  <Card key={file.file_id} className="border-2 hover:border-blue-300 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {file.file_type.replace(/_/g, " ").toLowerCase()}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{file.file_name}</p>
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Document
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Review History (if previously reviewed) */}
            {selectedSubmission.reviewed_at && (
              <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-gray-400">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Previous Review</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reviewed by:</span> {selectedSubmission.reviewed_by_email || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date:</span> {formatDate(selectedSubmission.reviewed_at)}
                  </p>
                  {selectedSubmission.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border">{selectedSubmission.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Actions */}
            {selectedSubmission.status === "PENDING" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Review Notes {reviewAction === "REJECT" && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={reviewAction === "REJECT" ? "Explain why the submission is rejected (required)" : "Optional feedback for the agency"}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={4}
                  />
                  {reviewAction === "REJECT" && !reviewNotes && (
                    <p className="text-xs text-red-600 mt-1">Rejection reason is required</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setReviewAction("APPROVE");
                      handleReview(selectedSubmission.agency_kyc_id, "APPROVE", reviewNotes);
                    }}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    {processing && reviewAction === "APPROVE" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve KYC
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      if (!reviewNotes.trim()) {
                        showToast({ type: "warning", title: "Missing Notes", message: "Please provide a rejection reason" });
                        return;
                      }
                      setReviewAction("REJECT");
                      handleReview(selectedSubmission.agency_kyc_id, "REJECT", reviewNotes);
                    }}
                    disabled={processing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    {processing && reviewAction === "REJECT" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject KYC
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Already Reviewed Message */}
            {selectedSubmission.status !== "PENDING" && (
              <div className={`p-4 rounded-lg border-2 ${selectedSubmission.status === "APPROVED" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <p className="text-sm font-medium text-gray-900">
                  This submission has already been {selectedSubmission.status.toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Agency KYC Review</h1>
              <p className="text-blue-100 mt-1">Verify agency identities and business documents</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total", value: submissions.length, color: "blue" },
              { label: "Pending", value: submissions.filter(s => s.status === "PENDING").length, color: "yellow" },
              { label: "Approved", value: submissions.filter(s => s.status === "APPROVED").length, color: "green" },
              { label: "Rejected", value: submissions.filter(s => s.status === "REJECTED").length, color: "red" },
            ].map((stat, i) => (
              <Card key={i} className="bg-white/95 backdrop-blur-sm border-0">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">No {filter !== "ALL" ? filter.toLowerCase() : ""} submissions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.agency_kyc_id} className="hover:shadow-xl transition-all border-2">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{submission.business_name}</h3>
                        {getStatusBadge(submission.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{submission.account_email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Registration</p>
                          <p className="font-medium text-gray-900">{submission.registration_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Submitted</p>
                          <p className="font-medium text-gray-900">{formatDate(submission.submitted_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Documents</p>
                          <p className="font-medium text-gray-900">{submission.files.length} files</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedSubmission(submission)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {renderModal()}
    </div>
  );
};

export default AdminAgencyKYC;
