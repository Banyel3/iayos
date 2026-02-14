"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "../../../components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Briefcase,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";

interface DisputeDetail {
  dispute: {
    id: number;
    transaction_id: number;
    amount: number;
    reason: string;
    status: string;
    priority: string;
    filed_by: string;
    filed_at: string;
    resolved_at: string | null;
    resolution: string | null;
  };
  job: {
    id: number;
    title: string;
    budget: number;
    status: string;
  };
  client: {
    id: number;
    name: string;
    email: string;
  };
  worker: {
    id: number;
    name: string;
    email: string;
  };
  evidence: Array<{
    id: number;
    file_url: string;
    file_name: string;
    uploaded_by: string;
    uploaded_at: string;
  }>;
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const [detail, setDetail] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolution, setResolution] = useState("");
  const [decision, setDecision] = useState("favor_client");
  const [refundAmount, setRefundAmount] = useState("");

  const fetchDetail = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/disputes/${disputeId}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        console.warn("Dispute detail API not available");
        setDetail(null);
        return;
      }

      const data = await response.json();
      setDetail(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [disputeId]);

  const handleResolve = async () => {
    if (!resolution.trim()) {
      alert("Please provide a resolution explanation");
      return;
    }

    if (decision === "partial_refund" && !refundAmount) {
      alert("Please specify refund amount");
      return;
    }

    if (!confirm("Submit this resolution?")) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/disputes/${disputeId}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            resolution,
            decision,
            refund_amount:
              decision === "partial_refund"
                ? parseFloat(refundAmount)
                : decision === "favor_client"
                  ? detail?.dispute.amount
                  : 0,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to resolve dispute");

      alert("Dispute resolved successfully");
      setShowResolutionForm(false);
      fetchDetail();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to resolve dispute");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: "⏳ Pending", color: "bg-yellow-100 text-yellow-700" },
      resolved: { label: "✓ Resolved", color: "bg-green-100 text-green-700" },
      rejected: { label: "✗ Rejected", color: "bg-red-100 text-red-700" },
    };
    const badge = badges[status] || { label: status, color: "bg-gray-100" };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      low: { label: "🟢 Low", color: "bg-green-100 text-green-700" },
      medium: { label: "🟡 Medium", color: "bg-yellow-100 text-yellow-700" },
      high: { label: "🟠 High", color: "bg-orange-100 text-orange-700" },
      urgent: { label: "🔴 Urgent", color: "bg-red-100 text-red-700" },
    };
    const badge = badges[priority] || { label: priority, color: "bg-gray-100" };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-orange-600 mx-auto"></div>
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading dispute details...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-center text-gray-600">Dispute not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Back Button */}
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Disputes
          </Button>

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-8 w-8" />
                <h1 className="text-4xl font-bold">
                  Dispute #{detail.dispute.id}
                </h1>
              </div>
              <div className="flex gap-2 mt-4">
                {getStatusBadge(detail.dispute.status)}
                {getPriorityBadge(detail.dispute.priority)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dispute Details */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Dispute Details
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                      <p className="text-sm text-orange-700 mb-1">
                        Disputed Amount
                      </p>
                      <p className="text-3xl font-bold text-orange-900">
                        ₱{detail.dispute.amount.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Reason
                      </p>
                      <p className="text-gray-900 bg-gray-50 rounded-lg p-4">
                        {detail.dispute.reason}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Filed By</p>
                        <p className="font-semibold text-gray-900">
                          {detail.dispute.filed_by}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Filed At</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(detail.dispute.filed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {detail.dispute.resolved_at && (
                      <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                        <p className="text-sm text-green-700 mb-1">
                          Resolved At
                        </p>
                        <p className="font-semibold text-green-900">
                          {new Date(
                            detail.dispute.resolved_at,
                          ).toLocaleString()}
                        </p>
                        {detail.dispute.resolution && (
                          <div className="mt-3">
                            <p className="text-sm text-green-700 mb-1">
                              Resolution
                            </p>
                            <p className="text-green-900">
                              {detail.dispute.resolution}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Evidence */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Evidence
                  </h2>
                  {detail.evidence.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      No evidence files uploaded
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {detail.evidence.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {file.file_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Uploaded by {file.uploaded_by} •{" "}
                              {new Date(file.uploaded_at).toLocaleString()}
                            </p>
                          </div>
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resolution Form */}
              {detail.dispute.status === "pending" && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Resolve Dispute
                    </h2>
                    {!showResolutionForm ? (
                      <Button
                        onClick={() => setShowResolutionForm(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Start Resolution Process
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Decision
                          </label>
                          <select
                            value={decision}
                            onChange={(e) => setDecision(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                          >
                            <option value="favor_client">
                              ✓ Favor Client (Full Refund)
                            </option>
                            <option value="favor_worker">
                              ✓ Favor Worker (No Refund)
                            </option>
                            <option value="partial_refund">
                              ⚖️ Partial Refund
                            </option>
                          </select>
                        </div>

                        {decision === "partial_refund" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Refund Amount (₱)
                            </label>
                            <input
                              type="number"
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(e.target.value)}
                              max={detail.dispute.amount}
                              className="w-full p-3 border border-gray-300 rounded-lg"
                              placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Max: ₱{detail.dispute.amount.toLocaleString()}
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resolution Explanation (Required)
                          </label>
                          <textarea
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder="Explain your decision and reasoning..."
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            rows={5}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleResolve}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Submit Resolution
                          </Button>
                          <Button
                            onClick={() => setShowResolutionForm(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar (1/3) */}
            <div className="space-y-6">
              {/* Job Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    Job
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {detail.job.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Budget: ₱{detail.job.budget.toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">
                      {detail.job.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Client Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Client
                  </h3>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">
                      {detail.client.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {detail.client.email}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Worker Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-green-600" />
                    Worker
                  </h3>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">
                      {detail.worker.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {detail.worker.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
