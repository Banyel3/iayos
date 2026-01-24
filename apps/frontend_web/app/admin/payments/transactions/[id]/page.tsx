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
  DollarSign,
  User,
  Briefcase,
  Clock,
  ChevronRight,
  Download,
  RefreshCcw,
  Unlock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface TransactionDetail {
  transaction: {
    id: number;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
  };
  job: {
    id: number;
    title: string;
    budget: number;
    status: string;
  };
  payer: {
    id: number;
    name: string;
    email: string;
    profile_type: string;
  };
  payee: {
    id: number;
    name: string;
    email: string;
    profile_type: string;
  };
  escrow_details: {
    downpayment_amount: number;
    final_payment_amount: number;
    released_at: string | null;
  } | null;
  audit_trail: Array<{
    action: string;
    admin_id: number;
    admin_name: string;
    reason: string;
    timestamp: string;
  }>;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [releaseNote, setReleaseNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundTo, setRefundTo] = useState("payer");

  const fetchDetail = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/${transactionId}/detail`,
        { credentials: "include" }
      );

      if (!response.ok) {
        console.warn("Transaction detail API not available");
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
  }, [transactionId]);

  const handleReleaseEscrow = async () => {
    if (!confirm("Are you sure you want to release this escrow payment?"))
      return;

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/${transactionId}/release-escrow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: releaseNote }),
        }
      );

      if (!response.ok) throw new Error("Failed to release escrow");

      alert("Escrow released successfully");
      setShowReleaseModal(false);
      fetchDetail();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to release escrow");
    }
  };

  const handleRefund = async () => {
    if (!refundAmount || !refundReason) {
      alert("Please fill in all required fields");
      return;
    }

    if (!confirm(`Process refund of ₱${refundAmount}?`)) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/${transactionId}/refund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            amount: parseFloat(refundAmount),
            reason: refundReason,
            refund_to: refundTo,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to process refund");

      alert("Refund processed successfully");
      setShowRefundModal(false);
      fetchDetail();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process refund");
    }
  };

  const downloadReceipt = () => {
    alert("Download receipt functionality - Coming soon");
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
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading transaction details...
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
            <p className="text-center text-gray-600">Transaction not found</p>
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
            Back to Transactions
          </Button>

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-8 w-8" />
                <h1 className="text-4xl font-bold">
                  Transaction #{detail.transaction.id}
                </h1>
              </div>
              <p className="text-blue-100 text-lg">
                View and manage transaction details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Transaction Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Transaction Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₱{(detail.transaction?.amount ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <Badge
                        className={`${
                          detail.transaction.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : detail.transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {detail.transaction.status}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Payment Method
                      </p>
                      <p className="font-semibold text-gray-900">
                        {detail.transaction.payment_method}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Created</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(
                          detail.transaction.created_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Escrow Details */}
              {detail.escrow_details && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      Escrow Details
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                        <p className="text-sm text-yellow-700 mb-1">
                          Downpayment (50%)
                        </p>
                        <p className="text-2xl font-bold text-yellow-900">
                          ₱
                          {(
                            detail.escrow_details?.downpayment_amount ?? 0
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                        <p className="text-sm text-green-700 mb-1">
                          Final Payment (50%)
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          ₱
                          {(
                            detail.escrow_details?.final_payment_amount ?? 0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {detail.escrow_details.released_at && (
                      <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          Released on:{" "}
                          {new Date(
                            detail.escrow_details.released_at
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Audit Trail */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Audit Trail
                  </h2>
                  {(detail.audit_trail ?? []).length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      No actions taken yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {(detail.audit_trail ?? []).map((item, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-lg"
                        >
                          <p className="font-semibold text-gray-900">
                            {item.action}
                          </p>
                          <p className="text-sm text-gray-600">
                            By: {item.admin_name}
                          </p>
                          {item.reason && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Reason:</span>{" "}
                              {item.reason}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar (1/3) */}
            <div className="space-y-6">
              {/* Payer Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Payer
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {detail.payer?.name ?? "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {detail.payer?.email ?? "N/A"}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">
                      {detail.payer?.profile_type ?? "Unknown"}
                    </Badge>
                    {detail.payer?.id && (
                      <Link href={`/admin/users/${detail.payer.id}`}>
                        <Button
                          variant="outline"
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          View Profile
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payee Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-green-600" />
                    Payee
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {detail.payee?.name ?? "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {detail.payee?.email ?? "N/A"}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      {detail.payee?.profile_type ?? "Unknown"}
                    </Badge>
                    {detail.payee?.id && (
                      <Link href={`/admin/users/${detail.payee.id}`}>
                        <Button
                          variant="outline"
                          className="w-full border-green-600 text-green-600 hover:bg-green-50"
                        >
                          View Profile
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

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
                        {detail.job?.title ?? "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Budget: ₱{(detail.job?.budget ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">
                      {detail.job?.status ?? "Unknown"}
                    </Badge>
                    {detail.job?.id && (
                      <Link href={`/admin/jobs/listings/${detail.job.id}`}>
                        <Button
                          variant="outline"
                          className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                        >
                          View Job
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowReleaseModal(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Release Escrow
                    </Button>
                    <Button
                      onClick={() => setShowRefundModal(true)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Process Refund
                    </Button>
                    <Button
                      onClick={downloadReceipt}
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Release Escrow Modal */}
          {showReleaseModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Release Escrow Payment
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to release this escrow payment to the
                    payee?
                  </p>
                  <textarea
                    value={releaseNote}
                    onChange={(e) => setReleaseNote(e.target.value)}
                    placeholder="Optional note..."
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReleaseEscrow}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Confirm Release
                    </Button>
                    <Button
                      onClick={() => setShowReleaseModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Refund Modal */}
          {showRefundModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Process Refund
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Refund Amount (₱)
                      </label>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        max={detail.transaction?.amount ?? 0}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max: ₱
                        {(detail.transaction?.amount ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Refund To
                      </label>
                      <select
                        value={refundTo}
                        onChange={(e) => setRefundTo(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      >
                        <option value="payer">Refund to Payer (Client)</option>
                        <option value="payee">Refund to Payee (Worker)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason (Required)
                      </label>
                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Explain why this refund is being processed..."
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRefund}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Process Refund
                      </Button>
                      <Button
                        onClick={() => setShowRefundModal(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
