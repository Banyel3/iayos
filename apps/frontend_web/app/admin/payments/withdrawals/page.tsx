"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar, useMainContentClass, AdminPagination } from "../../components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Building,
  CreditCard,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { toast } from "sonner";

interface WithdrawalRequest {
  id: string;
  transaction_id?: number; // Legacy field
  user_id?: number;
  user_name?: string;
  user_email?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  amount: number;
  currency?: string;
  payment_method_type?:
  | "GCASH"
  | "BANK"
  | "PAYPAL"
  | "VISA"
  | "GRABPAY"
  | "MAYA";
  payment_method?: {
    type: string;
    account_name: string;
    account_number: string;
  };
  recipient_name?: string;
  account_number?: string;
  bank_name?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  created_at: string;
  processed_at?: string;
  disbursement_id?: string;
  reference_number?: string;
  description?: string;
  notes?: string;
  admin_reference_number?: string;
}

interface Statistics {
  pending_withdrawals: number;
  pending_amount: number;
  completed_today: number;
  completed_amount_today: number;
}

interface ApproveModalState {
  isOpen: boolean;
  transactionId: string | number | null;
  userName: string;
  amount: number;
}

interface RejectModalState {
  isOpen: boolean;
  transactionId: string | number | null;
  userName: string;
  amount: number;
}

// Helper to get transaction ID safely
const getTransactionId = (w: WithdrawalRequest): string => {
  return w.id || String(w.transaction_id || "");
};

export default function WithdrawalsPage() {
  const mainClass = useMainContentClass("flex-1 p-8");
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [typeFilter, setTypeFilter] = useState("all");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveModal, setApproveModal] = useState<ApproveModalState>({
    isOpen: false,
    transactionId: null,
    userName: "",
    amount: 0,
  });
  const [rejectModal, setRejectModal] = useState<RejectModalState>({
    isOpen: false,
    transactionId: null,
    userName: "",
    amount: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("payment_method", typeFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/withdrawals?${params}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        setWithdrawals([]);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.withdrawals || []);
        setPagination((prev) => ({
          ...prev,
          total: data.total || 0,
          pages: data.total_pages || 0,
        }));
      } else {
        console.error("Failed to fetch withdrawals:", data.error);
        setWithdrawals([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    statusFilter,
    typeFilter,
    searchQuery,
  ]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/withdrawals/statistics`,
        { credentials: "include" },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.success) {
        setStatistics({
          pending_withdrawals: data.pending_withdrawals || 0,
          pending_amount: data.pending_amount || 0,
          completed_today: data.completed_today || 0,
          completed_amount_today: data.completed_amount_today || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
    fetchStatistics();
  }, [fetchWithdrawals, fetchStatistics]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchWithdrawals();
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = () => {
    if (pagination.page === 1) {
      fetchWithdrawals();
    } else {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const getPaymentMethodIcon = (type: string | undefined) => {
    switch (type ?? "") {
      case "GCASH":
        return <Phone className="h-4 w-4" />;
      case "BANK":
        return <Building className="h-4 w-4" />;
      case "PAYPAL":
        return <CreditCard className="h-4 w-4" />;
      case "VISA":
        return <CreditCard className="h-4 w-4" />;
      case "GRABPAY":
        return <Smartphone className="h-4 w-4" />;
      case "MAYA":
        return <Wallet className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getPaymentMethodBadge = (type: string | undefined) => {
    switch (type ?? "") {
      case "GCASH":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            GCash
          </Badge>
        );
      case "BANK":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Bank
          </Badge>
        );
      case "PAYPAL":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            PayPal
          </Badge>
        );
      case "VISA":
        return (
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
            Visa
          </Badge>
        );
      case "GRABPAY":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            GrabPay
          </Badge>
        );
      case "MAYA":
        return (
          <Badge className="bg-teal-100 text-teal-700 border-teal-200">
            Maya
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            Pending
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Completed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            Failed
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
    }
  };

  // Open approve modal instead of confirm
  const openApproveModal = (withdrawal: WithdrawalRequest) => {
    setReferenceNumber("");
    setApproveNotes("");
    setApproveModal({
      isOpen: true,
      transactionId: withdrawal.id || withdrawal.transaction_id || null,
      userName: withdrawal.user?.name || withdrawal.user_name || "",
      amount: withdrawal.amount,
    });
  };

  const closeApproveModal = () => {
    setApproveModal({
      isOpen: false,
      transactionId: null,
      userName: "",
      amount: 0,
    });
    setReferenceNumber("");
    setApproveNotes("");
  };

  const handleApprove = async () => {
    if (!approveModal.transactionId) return;

    if (!referenceNumber.trim()) {
      toast.error("Please enter a reference number for audit purposes (e.g., bank transaction ID, GCash reference)");
      return;
    }

    // Final confirmation dialog
    const confirmed = confirm(
      `⚠️ FINAL CONFIRMATION\n\n` +
      `You are about to approve a withdrawal of ₱${(approveModal.amount ?? 0).toLocaleString()} to ${approveModal.userName}.\n\n` +
      `Reference: ${referenceNumber.trim()}\n` +
      `Notes: ${approveNotes || "(none)"}\n\n` +
      `This action CANNOT be undone. The funds will be marked as paid.\n\n` +
      `Are you absolutely sure you want to proceed?`,
    );

    if (!confirmed) {
      return;
    }

    setApproving(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/withdrawals/${approveModal.transactionId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            notes: approveNotes || "Approved and processed manually",
            reference_number: referenceNumber.trim(),
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Withdrawal marked as completed!");
        closeApproveModal();
        fetchWithdrawals();
        fetchStatistics();
      } else {
        toast.error(data.error || "Failed to approve withdrawal");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(getErrorMessage(error, "Failed to approve withdrawal"));
    }
  };

  const openRejectModal = (withdrawal: WithdrawalRequest) => {
    setRejectReason("");
    setRejectModal({
      isOpen: true,
      transactionId: withdrawal.id || withdrawal.transaction_id || null,
      userName: withdrawal.user?.name || withdrawal.user_name || "",
      amount: withdrawal.amount,
    });
  };

  const closeRejectModal = () => {
    setRejectModal({
      isOpen: false,
      transactionId: null,
      userName: "",
      amount: 0,
    });
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectModal.transactionId) return;
    if (rejectReason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }

    setRejecting(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/withdrawals/${rejectModal.transactionId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: rejectReason.trim() }),
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Withdrawal rejected and funds refunded to user wallet!");
        closeRejectModal();
        fetchWithdrawals();
        fetchStatistics();
      } else {
        toast.error(data.error || "Failed to reject withdrawal");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(getErrorMessage(error, "Failed to reject withdrawal"));
    } finally {
      setRejecting(false);
    }
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                  <Wallet className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading withdrawals...
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
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          {/* Header */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Process pending withdrawal requests - GCash, Bank Transfers, and PayPal
                </p>
              </div>
              <Button
                onClick={() => {
                  toast.info("Export CSV coming soon");
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm transition-all"
              >
                <Download className="mr-2 h-5 w-5" />
                Export CSV
              </Button>
            </div>
          </div>


          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="py-1.5 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Clock className="h-5 w-5 text-[#00BAF1]" /></div>
                    <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Pending Requests</p>
                  <p className="text-xl font-bold text-gray-900">{(statistics?.pending_withdrawals ?? 0).toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="py-1.5 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Wallet className="h-5 w-5 text-[#00BAF1]" /></div>
                    <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Pending Amount</p>
                  <p className="text-xl font-bold text-gray-900">₱{(statistics?.pending_amount ?? 0).toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="py-1.5 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><CheckCircle className="h-5 w-5 text-[#00BAF1]" /></div>
                    <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full opacity-50"></div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Completed Today</p>
                  <p className="text-xl font-bold text-gray-900">{(statistics?.completed_today ?? 0).toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="py-1.5 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Download className="h-5 w-5 text-[#00BAF1]" /></div>
                    <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full opacity-50"></div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Completed Amount</p>
                  <p className="text-xl font-bold text-gray-900">₱{(statistics?.completed_amount_today ?? 0).toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#00BAF1] transition-colors" />
              <Input
                placeholder="Search user, email, or account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-12 h-12 border-gray-200 focus:border-[#00BAF1] focus:ring-2 focus:ring-[#00BAF1]/20 rounded-xl bg-white shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-[#00BAF1]/20 transition-all font-medium text-gray-700 shadow-sm outline-none"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-[#00BAF1]/20 transition-all font-medium text-gray-700 shadow-sm outline-none"
            >
              <option value="all">All Types</option>
              <option value="GCASH">GCash</option>
              <option value="BANK">Bank Transfer</option>
              <option value="PAYPAL">PayPal</option>
              <option value="VISA">Visa/Credit Card</option>
              <option value="GRABPAY">GrabPay</option>
              <option value="MAYA">Maya</option>
            </select>
            <Button
              onClick={fetchWithdrawals}
              className="h-12 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-sm"
            >
              <RefreshCcw className="h-5 w-5" />
            </Button>
          </div>

          {/* Withdrawals List */}
          <div className="space-y-4">
            {withdrawals.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No withdrawal requests found
                  </h3>
                  <p className="text-gray-500">
                    {statusFilter === "PENDING"
                      ? "All pending withdrawals have been processed!"
                      : "Try adjusting your filters"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              withdrawals.map((withdrawal) => (
                <Card
                  key={withdrawal.id || withdrawal.transaction_id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                            {withdrawal.user?.name ||
                              withdrawal.user_name ||
                              "Unknown"}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {getStatusBadge(withdrawal.status)}
                            {getPaymentMethodBadge(
                              withdrawal.payment_method?.type ||
                              withdrawal.payment_method_type,
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-500 mb-0.5">User Details</p>
                            <p className="font-medium text-gray-900 truncate">
                              {withdrawal.user?.email || withdrawal.user_email || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-0.5">Recipient</p>
                            <p className="font-medium text-gray-900 truncate">
                              {withdrawal.payment_method?.account_name || withdrawal.recipient_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-0.5">
                              {(withdrawal.payment_method?.type || withdrawal.payment_method_type) === "GCASH"
                                ? "GCash Number"
                                : "Account Number"}
                            </p>
                            <p className="font-medium text-gray-900 font-mono tracking-tight">
                              {withdrawal.payment_method?.account_number || withdrawal.account_number || "N/A"}
                            </p>
                          </div>
                          {withdrawal.bank_name && (
                            <div>
                              <p className="text-gray-500 mb-0.5">Bank Name</p>
                              <p className="font-medium text-gray-900 truncate">
                                {withdrawal.bank_name}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 mb-0.5">Created At</p>
                            <p className="font-medium text-gray-900">
                              {withdrawal.created_at ? new Date(withdrawal.created_at).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-0.5">Reference</p>
                            <p className="font-mono text-[10px] text-gray-600 truncate">
                              {withdrawal.reference_number || withdrawal.disbursement_id || "N/A"}
                            </p>
                          </div>
                        </div>

                        {(withdrawal.notes || withdrawal.description) && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-[10px] text-gray-500 font-medium uppercase mb-1">Notes</p>
                            <p className="text-xs sm:text-sm text-gray-900">
                              {withdrawal.notes || withdrawal.description}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        <div className="text-right">
                          <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase mb-0.5">Amount</p>
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                            ₱{(withdrawal.amount ?? 0).toLocaleString()}
                          </p>
                        </div>

                        {withdrawal.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openApproveModal(withdrawal)}
                              className="h-9 sm:h-10 bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm"
                            >
                              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Mark</span> Completed
                            </Button>
                            <Button
                              onClick={() => openRejectModal(withdrawal)}
                              variant="outline"
                              className="h-9 sm:h-10 border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 px-3 sm:px-4 text-xs sm:text-sm"
                            >
                              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: pagination.page - 1 }))}
                disabled={pagination.page === 1}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${pagination.page === 1 ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => {
                if (pagination.pages > 7) {
                  if (p !== 1 && p !== pagination.pages && Math.abs(p - pagination.page) > 1) {
                    if (p === 2 || p === pagination.pages - 1) return <span key={p} className="w-4 text-center text-gray-400">...</span>;
                    return null;
                  }
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${p === pagination.page ? "bg-[#00BAF1] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: pagination.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${pagination.page === pagination.pages ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Approve Modal with Reference Number */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 bg-white shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Approve Withdrawal
                  </h3>
                  <p className="text-sm text-gray-600">
                    Confirm payment sent to {approveModal.userName}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-700">Amount to be paid:</p>
                <p className="text-2xl font-bold text-green-800">
                  ₱{(approveModal.amount ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Reference Number{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g., GCash ref #, Bank txn ID, PayPal ID..."
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the reference number from your payment (required for
                    audit)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <Input
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={closeApproveModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  disabled={approving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                  disabled={approving || !referenceNumber.trim()}
                >
                  {approving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirm & Approve
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 bg-white shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reject Withdrawal</h3>
                  <p className="text-sm text-gray-600">
                    This will refund ₱{(rejectModal.amount ?? 0).toLocaleString()} back to {rejectModal.userName}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this withdrawal is rejected..."
                  className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">{rejectReason.trim().length}/10 minimum characters</p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={closeRejectModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  disabled={rejecting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={rejecting || rejectReason.trim().length < 10}
                >
                  {rejecting ? "Rejecting..." : "Confirm Reject"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
