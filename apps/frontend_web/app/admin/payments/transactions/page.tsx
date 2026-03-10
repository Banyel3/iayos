"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, useMainContentClass, AdminPagination } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  TrendingUp,
  Clock,
  RefreshCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  Wallet,
  CreditCard,
  Banknote,
  Unlock,
  Loader2,
  Calendar,
} from "lucide-react";

// Backend returns this structure from get_transactions_list_optimized()
interface Transaction {
  id: string;
  type: string; // ESCROW, EARNING, WITHDRAWAL, etc.
  status: string;
  amount: number;
  currency: string;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  job_id: string | null;
  job_title: string | null;
  description: string | null;
  balance_after: number | null;
  reference: string | null; // xenditPaymentID or paymongoPaymentID
  created_at: string;
  completed_at: string | null;
}

interface Statistics {
  total_transactions: number;
  total_revenue: number;
  escrow_held: number;
  refunded_amount: number;
  platform_fees: number;
  pending_count?: number;
}

export default function TransactionsPage() {
  const router = useRouter();
  const mainClass = useMainContentClass("flex-1 p-8");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("transaction_type", typeFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/all?${params}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        setTransactions([]);
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        pages: data.total_pages || 0,
      }));
    } catch (error) {
      console.error("Error:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/statistics`,
        { credentials: "include" },
      );

      if (!response.ok) {
        setStatistics({
          total_transactions: 0,
          total_revenue: 0,
          escrow_held: 0,
          refunded_amount: 0,
          platform_fees: 0,
        });
        return;
      }

      const data = await response.json();
      setStatistics(
        data.stats ||
        data || {
          total_transactions: 0,
          total_revenue: 0,
          escrow_held: 0,
          refunded_amount: 0,
          platform_fees: 0,
        },
      );
    } catch (error) {
      console.error("Error:", error);
      // Set default values on error
      setStatistics({
        total_transactions: 0,
        total_revenue: 0,
        escrow_held: 0,
        refunded_amount: 0,
        platform_fees: 0,
      });
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, typeFilter, dateFrom, dateTo, pagination.page]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            Refunded
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case "ESCROW":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            Escrow
          </Badge>
        );
      case "PAYMENT":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            Payment
          </Badge>
        );
      case "EARNING":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Earning
          </Badge>
        );
      case "PENDING_EARNING":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            Pending Earning
          </Badge>
        );
      case "WITHDRAWAL":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            Withdrawal
          </Badge>
        );
      case "DEPOSIT":
        return (
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
            Deposit
          </Badge>
        );
      case "REFUND":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            Refund
          </Badge>
        );
      case "PLATFORM_FEE":
      case "FEE":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            Platform Fee
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            {type}
          </Badge>
        );
    }
  };

  const handleReleasePayment = async (transaction: Transaction) => {
    if (!transaction.job_id) {
      toast.error("Cannot release: No job associated with this transaction");
      return;
    }
    if (
      !confirm(
        `Release payment of ₱${transaction.amount.toLocaleString()} immediately?\n\nThis will skip the 7-day buffer period.`,
      )
    ) {
      return;
    }

    setReleasingId(transaction.id);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/payments/release-pending/${transaction.job_id}`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success(
          `Payment released successfully! Amount: ₱${data.amount?.toLocaleString() || transaction.amount.toLocaleString()}`,
        );
        fetchTransactions();
      } else {
        toast.error(
          `Failed to release payment: ${data.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error releasing payment:", error);
      toast.error("Error releasing payment. Please try again.");
    } finally {
      setReleasingId(null);
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method?.toLowerCase()) {
      case "gcash":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <CreditCard className="h-3 w-3 mr-1" />
            GCash
          </Badge>
        );
      case "wallet":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <Wallet className="h-3 w-3 mr-1" />
            Wallet
          </Badge>
        );
      case "cash":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            <Banknote className="h-3 w-3 mr-1" />
            Cash
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            {method}
          </Badge>
        );
    }
  };

  const exportToCSV = () => {
    toast.info("Export to CSV functionality - Coming soon");
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                  <Banknote className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading transactions...
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
                  <Banknote className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Monitor all payment transactions and financial flows
                </p>
              </div>
              <Button
                onClick={exportToCSV}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm transition-all"
              >
                <Download className="mr-2 h-5 w-5" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-5">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="py-1.5 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Banknote className="h-5 w-5 text-[#00BAF1]" /></div>
                    <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Total Txns</p>
                  <p className="text-xl font-bold text-gray-900">{statistics?.total_transactions?.toLocaleString() ?? "0"}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="py-1.5 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><TrendingUp className="h-5 w-5 text-[#00BAF1]" /></div>
                    <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">₱{statistics?.total_revenue?.toLocaleString() ?? "0"}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="py-1.5 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Clock className="h-5 w-5 text-[#00BAF1]" /></div>
                    <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full opacity-50"></div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Escrow Held</p>
                  <p className="text-xl font-bold text-gray-900">₱{statistics?.escrow_held?.toLocaleString() ?? "0"}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="py-1.5 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><RefreshCcw className="h-5 w-5 text-[#00BAF1]" /></div>
                    <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full opacity-50"></div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Refunded</p>
                  <p className="text-xl font-bold text-gray-900">₱{statistics?.refunded_amount?.toLocaleString() ?? "0"}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="py-1.5 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Wallet className="h-5 w-5 text-[#00BAF1]" /></div>
                    <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full opacity-50"></div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Pending</p>
                  <p className="text-xl font-bold text-gray-900">{statistics?.pending_count?.toLocaleString() ?? "0"}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#00BAF1] transition-colors" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && fetchTransactions()}
                  className="pl-12 h-12 border-gray-200 focus:border-[#00BAF1] focus:ring-2 focus:ring-[#00BAF1]/20 rounded-xl bg-white shadow-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-[#00BAF1]/20 transition-all font-medium text-gray-700 shadow-sm outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-[#00BAF1]/20 transition-all font-medium text-gray-700 shadow-sm outline-none"
              >
                <option value="all">All Types</option>
                <option value="ESCROW">Escrow</option>
                <option value="EARNING">Earning</option>
                <option value="PENDING_EARNING">Pending Earning</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="DEPOSIT">Deposit</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-12 h-12 border-gray-200 focus:border-[#00BAF1] focus:ring-2 focus:ring-[#00BAF1]/20 rounded-xl bg-white shadow-sm"
                />
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-12 h-12 border-gray-200 focus:border-[#00BAF1] focus:ring-2 focus:ring-[#00BAF1]/20 rounded-xl bg-white shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {/* Transactions List */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          ID
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Job
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                              No transactions found
                            </p>
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="hover:bg-blue-50 transition-colors cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/admin/payments/transactions/${transaction.id}`,
                              )
                            }
                          >
                            <td className="px-6 py-4 text-sm font-mono text-gray-900">
                              #{transaction.id}
                            </td>
                            <td className="px-6 py-4">
                              {getTypeBadge(transaction.type)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <div>
                                <p className="font-medium text-xs sm:text-sm">
                                  {transaction.user?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {transaction.user?.email || "-"}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              ₱{(transaction.amount ?? 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(transaction.status)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {transaction.job_title || transaction.job_id ? (
                                <div>
                                  {transaction.job_title && (
                                    <p className="font-medium text-gray-800 text-xs leading-tight">
                                      {transaction.job_title}
                                    </p>
                                  )}
                                  {transaction.job_id && (
                                    <span className="font-mono text-blue-600 text-xs">
                                      #{transaction.job_id}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(
                                transaction.created_at,
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {transaction.type === "PENDING_EARNING" &&
                                  transaction.status === "PENDING" && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReleasePayment(transaction);
                                      }}
                                      disabled={releasingId === transaction.id}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      {releasingId === transaction.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Unlock className="h-4 w-4 mr-1" />
                                          Release
                                        </>
                                      )}
                                    </Button>
                                  )}
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/admin/payments/transactions/${transaction.id}`,
                                    );
                                  }}
                                  className="bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white"
                                >
                                  View
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No transactions found
                    </p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 active:bg-gray-50 transition-colors"
                      onClick={() =>
                        router.push(
                          `/admin/payments/transactions/${transaction.id}`,
                        )
                      }
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-mono text-gray-500 mb-1">
                            #{transaction.id}
                          </p>
                          <p className="font-semibold text-gray-900">
                            ₱{(transaction.amount ?? 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(transaction.status)}
                          <p className="text-[10px] text-gray-400">
                            {new Date(
                              transaction.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {getTypeBadge(transaction.type)}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-blue-600">
                              U
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {transaction.user?.name || "Unknown"}
                            </p>
                          </div>
                        </div>

                        {transaction.job_title && (
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-purple-600">
                                J
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                                {transaction.job_title}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end mt-3 gap-2">
                        {transaction.type === "PENDING_EARNING" &&
                          transaction.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReleasePayment(transaction);
                              }}
                              disabled={releasingId === transaction.id}
                              className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50"
                            >
                              {releasingId === transaction.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Release"
                              )}
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-[#00BAF1] hover:bg-[#00BAF1]/10"
                        >
                          View Details →
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

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
    </div>
  );
}
