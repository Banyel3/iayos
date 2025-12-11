"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  RefreshCw,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useWalletBalance, useWalletTransactions } from "@/lib/hooks/useHomeData";

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

type TransactionFilter = "all" | "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "PAYMENT_RECEIVED";
type StatusFilter = "all" | "COMPLETED" | "PENDING" | "FAILED";

export default function AgencyTransactionsPage() {
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    
    // Search query (search in description, ID, or payment method)
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
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, searchQuery]);

  const handleRefresh = () => {
    refetchWallet();
    refetchTransactions();
    toast.success("Transactions refreshed");
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "WITHDRAWAL":
        return <ArrowUpRight className="h-5 w-5 text-red-600" />;
      case "DEPOSIT":
      case "PAYMENT_RECEIVED":
        return <ArrowDownLeft className="h-5 w-5 text-green-600" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "WITHDRAWAL":
        return (
          <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
            Withdrawal
          </span>
        );
      case "DEPOSIT":
        return (
          <span className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs font-medium">
            Deposit
          </span>
        );
      case "PAYMENT_RECEIVED":
        return (
          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
            Payment Received
          </span>
        );
      case "PAYMENT":
        return (
          <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-medium">
            Payment
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs font-medium">
            {type}
          </span>
        );
    }
  };

  // Calculate summary stats
  const totalDeposits = transactions
    .filter((t: AgencyTransaction) => t.type === "DEPOSIT" || t.type === "PAYMENT_RECEIVED")
    .filter((t: AgencyTransaction) => t.status === "COMPLETED")
    .reduce((sum: number, t: AgencyTransaction) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t: AgencyTransaction) => t.type === "WITHDRAWAL")
    .filter((t: AgencyTransaction) => t.status === "COMPLETED")
    .reduce((sum: number, t: AgencyTransaction) => sum + Math.abs(t.amount), 0);

  const pendingWithdrawals = transactions
    .filter((t: AgencyTransaction) => t.type === "WITHDRAWAL" && t.status === "PENDING")
    .reduce((sum: number, t: AgencyTransaction) => sum + Math.abs(t.amount), 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-1">View and manage your wallet transactions</p>
          </div>
          <Button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoadingTransactions}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTransactions ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {isLoadingWallet ? "..." : `₱${walletBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Received</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₱{totalDeposits.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <ArrowDownLeft className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Withdrawn</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₱{totalWithdrawals.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending Withdrawals</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ₱{pendingWithdrawals.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TransactionFilter)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="DEPOSIT">Deposits</option>
                  <option value="WITHDRAWAL">Withdrawals</option>
                  <option value="PAYMENT_RECEIVED">Payments Received</option>
                  <option value="PAYMENT">Payments Made</option>
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transaction History</span>
              <span className="text-sm font-normal text-gray-500">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : paginatedTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-lg">No transactions found</p>
                <p className="text-sm mt-1">
                  {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Transactions will appear here when you make deposits or withdrawals"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Transaction</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Balance After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((tx: AgencyTransaction) => (
                        <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                tx.type === "WITHDRAWAL" ? "bg-red-100" : "bg-green-100"
                              }`}>
                                {getTransactionIcon(tx.type)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {tx.description || tx.type}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {tx.id} {tx.payment_method && `• ${tx.payment_method}`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {getTypeBadge(tx.type)}
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900">
                              {new Date(tx.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(tx.created_at).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(tx.status)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <p className={`font-semibold ${
                              tx.type === "WITHDRAWAL" ? "text-red-600" : "text-green-600"
                            }`}>
                              {tx.type === "WITHDRAWAL" ? "-" : "+"}₱{Math.abs(tx.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <p className="text-sm text-gray-600">
                              ₱{(tx.balance_after ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{" "}
                      {filteredTransactions.length} transactions
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-4 py-2 text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
