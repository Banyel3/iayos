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
import { toast } from "sonner";
import {
  Banknote,
  Search,
  TrendingUp,
  Clock,
  RefreshCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import {
  useWalletBalance,
  useWalletTransactions,
} from "@/lib/hooks/useHomeData";

// Extended Transaction type for agency with balance_after field
interface AgencyTransaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  payment_method?: string;
  reference_id?: string;
  balance_after?: number;
}

export default function AgencyTransactionsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const {
    data: walletBalance = 0,
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
  } = useWalletBalance(true);

  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useWalletTransactions(true);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx: AgencyTransaction) => {
    // Type filter
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;

    // Status filter
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;

    // Date range filter
    if (dateFrom && new Date(tx.created_at) < new Date(dateFrom)) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(tx.created_at) > end) return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = tx.description?.toLowerCase().includes(query);
      const matchesId = tx.id?.toString().includes(query);
      const matchesPaymentMethod = tx.payment_method?.toLowerCase().includes(query);
      if (!matchesDescription && !matchesId && !matchesPaymentMethod) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, searchQuery, dateFrom, dateTo]);

  const handleRefresh = () => {
    refetchWallet();
    refetchTransactions();
    toast.success("Transactions refreshed");
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Completed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            Failed
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
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            Deposit
          </Badge>
        );
      case "REFUND":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            Refund
          </Badge>
        );
      case "PAYMENT":
        return (
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
            Payment
          </Badge>
        );
      case "FEE":
      case "PLATFORM_FEE":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            Fee
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

  // Calculate summary stats
  const totalReceived = transactions
    .filter((t: AgencyTransaction) =>
      ["DEPOSIT", "EARNING", "PENDING_EARNING", "REFUND"].includes(t.type),
    )
    .filter((t: AgencyTransaction) => t.status === "COMPLETED")
    .reduce((sum: number, t: AgencyTransaction) => sum + t.amount, 0);

  const totalWithdrawn = transactions
    .filter((t: AgencyTransaction) => t.type === "WITHDRAWAL")
    .filter((t: AgencyTransaction) => t.status === "COMPLETED")
    .reduce((sum: number, t: AgencyTransaction) => sum + Math.abs(t.amount), 0);

  const pendingWithdrawals = transactions
    .filter((t: AgencyTransaction) => t.type === "WITHDRAWAL" && t.status === "PENDING")
    .reduce((sum: number, t: AgencyTransaction) => sum + Math.abs(t.amount), 0);

  if (isLoadingTransactions && transactions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
              <Banknote className="h-6 w-6 text-[#00BAF1] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Banknote className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              Monitor your financial activity and wallet history
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm transition-all"
              disabled={isLoadingTransactions}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoadingTransactions ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              className="bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white shadow-sm"
              onClick={() => toast.info("Export functionality coming soon")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Wallet className="h-5 w-5 text-[#00BAF1]" /></div>
              <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Current Balance</p>
            <p className="text-xl font-bold text-gray-900">₱{walletBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><ArrowDownLeft className="h-5 w-5 text-[#00BAF1]" /></div>
              <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full"></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Total Received</p>
            <p className="text-xl font-bold text-gray-900">₱{totalReceived.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><ArrowUpRight className="h-5 w-5 text-[#00BAF1]" /></div>
              <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full"></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Total Withdrawn</p>
            <p className="text-xl font-bold text-gray-900">₱{totalWithdrawn.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Clock className="h-5 w-5 text-[#00BAF1]" /></div>
              <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Pending Withdrawals</p>
            <p className="text-xl font-bold text-gray-900">₱{pendingWithdrawals.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#00BAF1] transition-colors" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-gray-200 focus:border-[#00BAF1] focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
          >
            <option value="all">All Types</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="EARNING">Earnings</option>
            <option value="PENDING_EARNING">Pending Earnings</option>
            <option value="REFUND">Refunds</option>
            <option value="PAYMENT">Payments</option>
            <option value="FEE">Fees</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
          >
            <option value="all">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
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
              className="pl-12 h-12 border-gray-200 focus:border-[#00BAF1] focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
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
              className="pl-12 h-12 border-gray-200 focus:border-[#00BAF1] focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-white pb-4">
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Overview of your wallet activity (Page {currentPage} of {totalPages || 1})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <Banknote className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No Transactions Found</h3>
                      <p className="text-gray-500">Try adjusting your filters or search query</p>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx: AgencyTransaction) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${["WITHDRAWAL", "FEE", "PAYMENT"].includes(tx.type) ? "bg-red-100/50" : "bg-green-100/50"}`}>
                            {["WITHDRAWAL", "FEE", "PAYMENT"].includes(tx.type) ? <ArrowUpRight className="h-4 w-4 text-red-600" /> : <ArrowDownLeft className="h-4 w-4 text-green-600" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 leading-none mb-1">{tx.description || tx.type}</span>
                            <span className="text-[10px] text-gray-400 font-mono">#{tx.id}{tx.payment_method && ` • ${tx.payment_method}`}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(tx.type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700 leading-none mb-1">
                            {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(tx.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-bold ${["WITHDRAWAL", "FEE", "PAYMENT"].includes(tx.type) ? "text-red-600" : "text-green-600"}`}>
                          {["WITHDRAWAL", "FEE", "PAYMENT"].includes(tx.type) ? "-" : "+"}
                          ₱{Math.abs(tx.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-600 font-medium">
                          ₱{(tx.balance_after ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
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
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${currentPage === 1 ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            if (totalPages > 7) {
              if (p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
                if (p === 2 || p === totalPages - 1) return <span key={p} className="w-4 text-center text-gray-400">...</span>;
                return null;
              }
            }
            return (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${p === currentPage ? "bg-[#00BAF1] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${currentPage === totalPages ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
