"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCcw,
  Download,
  ChevronRight,
  Wallet,
  CreditCard,
  Banknote,
  Unlock,
  Loader2,
} from "lucide-react";

// Backend returns this structure from get_transactions_list_optimized()
interface Transaction {
  id: string;
  type: string;  // ESCROW, EARNING, WITHDRAWAL, etc.
  status: string;
  amount: number;
  currency: string;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  job_id: string | null;
  reference: string | null;  // xenditPaymentID or paymongoPaymentID
  created_at: string;
  updated_at: string;
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
    limit: 50,
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
      if (typeFilter !== "all")
        params.append("transaction_type", typeFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/all?${params}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        // Backend endpoint not yet implemented - using mock data
        console.warn("Transactions API not available, using mock data");
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
        // Backend endpoint not yet implemented - using mock data
        console.warn("Statistics API not available, using mock data");
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
            ✓ Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            ⏳ Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            ✗ Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            ↩ Refunded
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
            🔒 Escrow
          </Badge>
        );
      case "EARNING":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            💰 Earning
          </Badge>
        );
      case "PENDING_EARNING":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            ⏳ Pending Earning
          </Badge>
        );
      case "WITHDRAWAL":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            📤 Withdrawal
          </Badge>
        );
      case "DEPOSIT":
        return (
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
            📥 Deposit
          </Badge>
        );
      case "PLATFORM_FEE":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            🏢 Platform Fee
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
      alert("Cannot release: No job associated with this transaction");
      return;
    }
    if (!confirm(`Release payment of ₱${transaction.amount.toLocaleString()} immediately?\n\nThis will skip the 7-day buffer period.`)) {
      return;
    }

    setReleasingId(transaction.id);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/payments/release-pending/${transaction.job_id}`,
        { 
          method: "POST",
          credentials: "include" 
        }
      );
      const data = await response.json();
      if (data.success) {
        alert(`✅ Payment released successfully!\nAmount: ₱${data.amount?.toLocaleString() || transaction.amount.toLocaleString()}`);
        fetchTransactions();
      } else {
        alert(`❌ Failed to release payment: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error releasing payment:", error);
      alert("Error releasing payment. Please try again.");
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
    alert("Export to CSV functionality - Coming soon");
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                  <DollarSign className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
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
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-8 w-8" />
                <h1 className="text-4xl font-bold">Transactions</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Monitor all payment transactions and financial flows
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {statistics?.total_transactions?.toLocaleString() ?? "0"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total Transactions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    ₱{statistics?.total_revenue?.toLocaleString() ?? "0"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    ₱{statistics?.escrow_held?.toLocaleString() ?? "0"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Escrow Held</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <RefreshCcw className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    ₱{statistics?.refunded_amount?.toLocaleString() ?? "0"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Refunded</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Wallet className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {statistics?.pending_count?.toLocaleString() ?? "0"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative group lg:col-span-2">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && fetchTransactions()}
                    className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="all">📊 All Status</option>
                  <option value="completed">✓ Completed</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="failed">✗ Failed</option>
                  <option value="refunded">↩ Refunded</option>
                </select>

                {/* Payment Method Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="all">💳 All Types</option>
                  <option value="ESCROW">🔒 Escrow</option>
                  <option value="EARNING">💰 Earning</option>
                  <option value="PENDING_EARNING">⏳ Pending Earning</option>
                  <option value="WITHDRAWAL">📤 Withdrawal</option>
                  <option value="DEPOSIT">📥 Deposit</option>
                </select>

                {/* Export Button */}
                <Button
                  onClick={exportToCSV}
                  className="h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
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
                          <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
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
                              <p className="font-medium">{transaction.user?.name || "Unknown"}</p>
                              <p className="text-xs text-gray-500">{transaction.user?.email || "-"}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            ₱{(transaction.amount ?? 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(transaction.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {transaction.job_id ? (
                              <span className="font-mono text-blue-600">#{transaction.job_id}</span>
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
                              {/* Release button for pending earnings */}
                              {transaction.type === "PENDING_EARNING" && transaction.status === "PENDING" && (
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
                                className="bg-blue-600 hover:bg-blue-700 text-white"
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
            </CardContent>
          </Card>

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
