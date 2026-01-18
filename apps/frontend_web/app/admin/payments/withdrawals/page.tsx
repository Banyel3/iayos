"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "../../components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCcw,
  ChevronRight,
  Phone,
  Building,
  CreditCard,
} from "lucide-react";

interface WithdrawalRequest {
  transaction_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  amount: number;
  payment_method_type: "GCASH" | "BANK" | "PAYPAL";
  recipient_name: string;
  account_number: string;
  bank_name?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  created_at: string;
  disbursement_id: string;
  notes?: string;
}

interface Statistics {
  pending_withdrawals: number;
  pending_amount: number;
  completed_today: number;
  completed_amount_today: number;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
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
        `http://localhost:8000/api/adminpanel/withdrawals?${params}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        console.warn("Withdrawals API not available");
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
  }, [pagination.page, pagination.limit, statusFilter, typeFilter, searchQuery]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/withdrawals/statistics`,
        { credentials: "include" }
      );

      if (!response.ok) {
        console.warn("Withdrawals statistics API not available");
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

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case "GCASH":
        return <Phone className="h-4 w-4" />;
      case "BANK":
        return <Building className="h-4 w-4" />;
      case "PAYPAL":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getPaymentMethodBadge = (type: string) => {
    switch (type) {
      case "GCASH":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {getPaymentMethodIcon(type)}
            <span className="ml-1">GCash</span>
          </Badge>
        );
      case "BANK":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            {getPaymentMethodIcon(type)}
            <span className="ml-1">Bank</span>
          </Badge>
        );
      case "PAYPAL":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            {getPaymentMethodIcon(type)}
            <span className="ml-1">PayPal</span>
          </Badge>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleApprove = async (transactionId: number) => {
    if (!confirm("Mark this withdrawal as completed? Ensure you have sent the funds manually via PayMongo, bank transfer, or PayPal.")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/withdrawals/${transactionId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ notes: "Approved and processed manually" }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(data.message || "Withdrawal marked as completed!");
        fetchWithdrawals();
        fetchStatistics();
      } else {
        alert(data.error || "Failed to approve withdrawal");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    }
  };

  const handleReject = async (transactionId: number) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/withdrawals/${transactionId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(data.message || "Withdrawal rejected and funds refunded to user wallet!");
        fetchWithdrawals();
        fetchStatistics();
      } else {
        alert(data.error || "Failed to reject withdrawal");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    }
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
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
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="h-8 w-8" />
                <h1 className="text-4xl font-bold">Withdrawal Requests</h1>
              </div>
              <p className="text-orange-100 text-lg">
                Manually process pending withdrawal requests - GCash, Bank Transfers, and PayPal
              </p>
            </div>
          </div>

          {/* Alert Banner for Manual Processing */}
          <Card className="border-l-4 border-l-amber-500 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    Manual Processing Required
                  </h3>
                  <p className="text-amber-800 mb-4">
                    All withdrawal requests require manual approval and fund transfer. Follow these steps:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-amber-800 text-sm">
                    <li><strong>GCash:</strong> Send money via GCash app to the recipient's number</li>
                    <li><strong>Bank Transfer:</strong> Use InstaPay/PESONet to transfer funds to the bank account</li>
                    <li><strong>PayPal:</strong> Send payment via PayPal to the recipient's email</li>
                    <li>After sending funds, click "Mark as Completed" to update the status</li>
                    <li>If there's an issue, click "Reject" to refund the amount to user's wallet</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {statistics.pending_withdrawals.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Pending Requests</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform">
                      <Wallet className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    ₱{statistics.pending_amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Pending Amount</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {statistics.completed_today.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Completed Today</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-emerald-100 rounded-xl group-hover:scale-110 transition-transform">
                      <Download className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    ₱{statistics.completed_amount_today.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Completed Amount Today</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by user name, email, or account number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="GCASH">GCash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="PAYPAL">PayPal</option>
                </select>
                <Button onClick={fetchWithdrawals} className="flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

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
                  key={withdrawal.transaction_id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {withdrawal.user_name}
                          </h3>
                          {getStatusBadge(withdrawal.status)}
                          {getPaymentMethodBadge(withdrawal.payment_method_type)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{withdrawal.user_email}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Recipient Name</p>
                            <p className="font-medium text-gray-900">{withdrawal.recipient_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">
                              {withdrawal.payment_method_type === "GCASH" 
                                ? "GCash Number" 
                                : withdrawal.payment_method_type === "BANK"
                                ? "Account Number"
                                : "PayPal Email"}
                            </p>
                            <p className="font-medium text-gray-900">{withdrawal.account_number}</p>
                          </div>
                          {withdrawal.bank_name && (
                            <div>
                              <p className="text-gray-600">Bank Name</p>
                              <p className="font-medium text-gray-900">{withdrawal.bank_name}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-600">Disbursement ID</p>
                            <p className="font-mono text-xs text-gray-700">{withdrawal.disbursement_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Created At</p>
                            <p className="font-medium text-gray-900">
                              {new Date(withdrawal.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {withdrawal.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Notes</p>
                            <p className="text-sm text-gray-900">{withdrawal.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex flex-col items-end gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="text-3xl font-bold text-gray-900">
                            ₱{withdrawal.amount.toLocaleString()}
                          </p>
                        </div>

                        {withdrawal.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(withdrawal.transaction_id)}
                              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark Completed
                            </Button>
                            <Button
                              onClick={() => handleReject(withdrawal.transaction_id)}
                              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                            >
                              <XCircle className="h-4 w-4" />
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
            <div className="flex justify-center gap-2">
              <Button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-4 py-2 text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.pages}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
