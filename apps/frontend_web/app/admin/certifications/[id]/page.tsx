"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  AlertCircle,
  ZoomIn,
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Clock,
  FileText,
  Building,
} from "lucide-react";
import Sidebar from "../../components/sidebar";

interface CertificationDetail {
  certification: {
    cert_id: number;
    certification_name: string;
    issuing_organization: string;
    certificate_url: string;
    issue_date: string | null;
    expiry_date: string | null;
    is_expired: boolean;
    days_until_expiry: number | null;
    submitted_at: string | null;
    skill_name: string | null;
  };
  worker: {
    worker_id: number;
    account_id: number | null;
    worker_name: string;
    worker_email: string;
    worker_phone: string | null;
    worker_location: string | null;
    profile_img: string | null;
  };
  verification_history: Array<{
    action: "APPROVED" | "REJECTED";
    reviewed_by_name: string;
    reviewed_at: string;
    reason: string | null;
  }>;
}

export default function CertificationDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const router = useRouter();
  const [detail, setDetail] = useState<CertificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const transformCertificationDetail = (raw: any): CertificationDetail => {
    const cert = raw?.certification ?? {};
    const workerProfile = raw?.worker_profile ?? raw?.worker ?? {};
    const submittedAt =
      cert?.submitted_at ?? cert?.uploaded_at ?? cert?.submittedAt ?? null;

    const computedWorkerName = [
      workerProfile?.first_name,
      workerProfile?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const workerName =
      workerProfile?.worker_name ??
      (computedWorkerName || undefined) ??
      workerProfile?.email ??
      "Unknown Worker";

    const history = Array.isArray(raw?.verification_history)
      ? raw.verification_history.map((entry: any) => {
          const action = (entry?.action ?? "APPROVED") as
            | "APPROVED"
            | "REJECTED";
          return {
            action,
            reviewed_by_name:
              entry?.reviewedBy ??
              entry?.reviewed_by_name ??
              entry?.reviewed_by ??
              "System",
            reviewed_at:
              entry?.reviewedAt ??
              entry?.reviewed_at ??
              new Date().toISOString(),
            reason: entry?.reason ?? null,
          };
        })
      : [];

    return {
      certification: {
        cert_id: cert?.certificationID ?? cert?.cert_id ?? 0,
        certification_name:
          cert?.certification_name ?? cert?.name ?? "Certification",
        issuing_organization: cert?.issuing_organization ?? "",
        certificate_url: cert?.certificate_url ?? "",
        issue_date: cert?.issue_date ?? null,
        expiry_date: cert?.expiry_date ?? null,
        is_expired: Boolean(cert?.is_expired),
        days_until_expiry: cert?.days_until_expiry ?? null,
        submitted_at: submittedAt,
        skill_name: cert?.skill_name ?? null,
      },
      worker: {
        worker_id: workerProfile?.worker_id ?? workerProfile?.id ?? 0,
        account_id: workerProfile?.account_id ?? null,
        worker_name: workerName,
        worker_email: workerProfile?.email ?? "",
        worker_phone:
          workerProfile?.worker_phone ?? workerProfile?.contact_num ?? null,
        worker_location:
          workerProfile?.worker_location ?? workerProfile?.location ?? null,
        profile_img: workerProfile?.profile_img ?? null,
      },
      verification_history: history,
    };
  };

  useEffect(() => {
    fetchCertificationDetail();
  }, [rawId]);

  const fetchCertificationDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!rawId) {
        setError("Invalid certification id");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/adminpanel/certifications/${rawId}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch certification: ${response.status}`);
      }

      const payload = await response.json();
      const result = payload.data ?? payload;
      setDetail(transformCertificationDetail(result));
    } catch (err) {
      console.error("Error fetching certification detail:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load certification"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!detail || !rawId) {
      toast.error("Invalid certification id");
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/certifications/${rawId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes || undefined }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve certification");
      }

      toast.success("Certification approved successfully");
      router.push("/admin/certifications/pending");
    } catch (err) {
      console.error("Error approving certification:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to approve certification"
      );
    } finally {
      setActionLoading(false);
      setShowApproveModal(false);
    }
  };

  const handleReject = async () => {
    if (!detail || !rawId) {
      toast.error("Invalid certification id");
      return;
    }

    if (!notes.trim() || notes.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/certifications/${rawId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: notes }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject certification");
      }

      toast.success("Certification rejected");
      router.push("/admin/certifications/pending");
    } catch (err) {
      console.error("Error rejecting certification:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to reject certification"
      );
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getExpiryStatus = () => {
    if (!detail) return null;
    const { is_expired, days_until_expiry } = detail.certification;

    if (is_expired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (days_until_expiry !== null && days_until_expiry <= 30) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-yellow-500 text-yellow-700"
        >
          <Clock className="h-3 w-3" />
          Expires in {days_until_expiry} days
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 border-green-500 text-green-700"
      >
        <CheckCircle className="h-3 w-3" />
        Valid
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto" />
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading certification details...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <Card className="max-w-2xl mx-auto mt-20">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Error Loading Certification
              </h2>
              <p className="text-gray-600 mb-6">
                {error || "Certification not found"}
              </p>
              <Button
                onClick={() => router.push("/admin/certifications/pending")}
              >
                Back to Pending List
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const certificateImage = detail.certification.certificate_url?.trim()
    ? detail.certification.certificate_url
    : null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/certifications/pending")}
            className="gap-2"
          >
            ← Back to Pending
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowApproveModal(true)}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
            <Button
              onClick={() => setShowRejectModal(true)}
              variant="destructive"
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Certificate Image */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Certificate Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certificateImage ? (
                  <div className="relative group">
                    <img
                      src={certificateImage}
                      alt={detail.certification.certification_name}
                      className="w-full rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-all"
                      onClick={() => setSelectedImage(certificateImage)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                      onClick={() => setSelectedImage(certificateImage)}
                    >
                      <ZoomIn className="h-4 w-4" />
                      View Full Size
                    </Button>
                  </div>
                ) : (
                  <div className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <Shield className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      No certificate image provided
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Ask the worker to upload a clear document
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certification Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Certification Information
                  </span>
                  {getExpiryStatus()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Certification Name
                    </p>
                    <p className="font-semibold text-gray-900">
                      {detail.certification.certification_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Issuing Organization
                    </p>
                    <p className="font-semibold text-gray-900">
                      {detail.certification.issuing_organization}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(detail.certification.issue_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Expiry Date</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(detail.certification.expiry_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Skill Category</p>
                    <p className="font-semibold text-gray-900">
                      {detail.certification.skill_name || "General"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Submitted</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(detail.certification.submitted_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification History */}
            {detail.verification_history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Verification History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {detail.verification_history.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {log.action === "APPROVED" ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900">
                              {log.action === "APPROVED"
                                ? "Approved"
                                : "Rejected"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(log.reviewed_at)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            By: {log.reviewed_by_name}
                          </p>
                          {log.reason && (
                            <p className="text-sm text-gray-500 mt-1 italic">
                              "{log.reason}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Worker Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Worker Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  {detail.worker.profile_img ? (
                    <img
                      src={detail.worker.profile_img}
                      alt={detail.worker.worker_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {detail.worker.worker_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {detail.worker.worker_id}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {detail.worker.worker_email}
                    </span>
                  </div>
                  {detail.worker.worker_phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {detail.worker.worker_phone}
                      </span>
                    </div>
                  )}
                  {detail.worker.worker_location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {detail.worker.worker_location}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 mt-4"
                  onClick={() => {
                    if (detail.worker.account_id) {
                      router.push(
                        `/admin/users/workers/${detail.worker.account_id}`
                      );
                    } else {
                      toast.error("Worker profile unavailable");
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Full-Screen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={selectedImage}
            alt="Certificate"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Approve Certification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to approve this certification? The worker
                will be notified.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the approval..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowApproveModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Confirm Approval"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Reject Certification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Please provide a reason for rejecting this certification. The
                worker will be notified with your feedback.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Rejection Reason (Required, min 10 characters)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain why this certification is being rejected..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {notes.length}/10 characters minimum
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setNotes("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={actionLoading || notes.trim().length < 10}
                  variant="destructive"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    "Confirm Rejection"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
