"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  TrendingUp,
  CreditCard,
  RefreshCw,
  ChevronRight,
  Hourglass,
  AlertCircle,
  Calendar,
  Banknote,
  Send,
} from "lucide-react";
import { API_BASE } from "@/lib/api/config";
import { useWalletBalance, useWalletTransactions } from "@/lib/hooks/useHomeData";
import { formatDistanceToNow } from "date-fns";

interface PendingEarning {
  job_id: number;
  job_title: string;
  amount: number;
  completed_at: string;
  release_date: string;
  days_until_release: number;
  has_active_backjob: boolean;
  status: string;
}

interface PendingEarningsData {
  total_pending: number;
  count: number;
  buffer_days: number;
  items: PendingEarning[];
  info_message: string;
}

export default function AgencyWalletPage() {
  const router = useRouter();
  const [pendingEarnings, setPendingEarnings] = useState<PendingEarningsData | null>(null);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

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

  useEffect(() => {
    fetchPendingEarnings();
    fetchPaymentMethodsCount();
  }, []);

  const fetchPendingEarnings = async () => {
    setIsLoadingPending(true);
    try {
      const res = await fetch(`${API_BASE}/api/agency/wallet/pending-earnings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPendingEarnings(data);
      }
    } catch (error) {
      console.error("Error fetching pending earnings:", error);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const fetchPaymentMethodsCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/payment-methods`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.payment_methods || []);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchWallet(), refetchTransactions(), fetchPendingEarnings()]);
    toast.success("Wallet refreshed");
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-green-700 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <Wallet className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Wallet</h1>
                <p className="text-green-100 mt-1">Manage your agency finances</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Balance Card */}
          <Card className="mt-8 bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Available Balance</p>
                  {isLoadingWallet ? (
                    <div className="h-10 w-40 bg-white/20 animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-4xl font-bold mt-1">{formatCurrency(walletBalance)}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push("/agency/wallet/deposit")}
                    className="bg-white text-green-700 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Funds
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowWithdrawModal(true)}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Pending */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="p-2 bg-green-100 rounded-lg inline-block mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      transactions
                        .filter((t: any) => t.type === "PAYMENT_RECEIVED")
                        .reduce((sum: number, t: any) => sum + t.amount, 0)
                    )}
                  </p>
                  <p className="text-sm text-gray-500">Total Earned</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="p-2 bg-yellow-100 rounded-lg inline-block mb-2">
                    <Hourglass className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(pendingEarnings?.total_pending || 0)}
                  </p>
                  <p className="text-sm text-gray-500">Pending Release</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="p-2 bg-blue-100 rounded-lg inline-block mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{paymentMethods.length}</p>
                  <p className="text-sm text-gray-500">Payment Methods</p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Earnings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hourglass className="h-5 w-5 text-yellow-600" />
                  Due Balance (7-Day Buffer)
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/agency/wallet/pending")}
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingPending ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : !pendingEarnings || pendingEarnings.count === 0 ? (
                  <div className="text-center py-8">
                    <Hourglass className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No pending earnings</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Completed job payments will appear here during the 7-day hold
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Info Banner */}
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700">{pendingEarnings.info_message}</p>
                    </div>

                    {pendingEarnings.items.slice(0, 3).map((item) => (
                      <div
                        key={item.job_id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.job_title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Releases {formatDistanceToNow(new Date(item.release_date), { addSuffix: true })}
                            </span>
                            {item.has_active_backjob && (
                              <Badge variant="destructive" className="text-xs">
                                Backjob Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatCurrency(item.amount)}</p>
                          <p className="text-xs text-gray-400">{item.days_until_release} days left</p>
                        </div>
                      </div>
                    ))}

                    {pendingEarnings.count > 3 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push("/agency/wallet/pending")}
                      >
                        View all {pendingEarnings.count} pending payments
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Transactions */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/agency/transactions")}
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((tx: any) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              tx.type === "DEPOSIT" || tx.type === "PAYMENT_RECEIVED"
                                ? "bg-green-100"
                                : "bg-red-100"
                            }`}
                          >
                            {tx.type === "DEPOSIT" || tx.type === "PAYMENT_RECEIVED" ? (
                              <ArrowDownLeft
                                className={`h-4 w-4 ${
                                  tx.type === "DEPOSIT" || tx.type === "PAYMENT_RECEIVED"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{tx.description}</p>
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`font-semibold ${
                            tx.type === "DEPOSIT" || tx.type === "PAYMENT_RECEIVED"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.type === "DEPOSIT" || tx.type === "PAYMENT_RECEIVED" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/agency/wallet/deposit")}
                >
                  <Plus className="h-4 w-4 mr-2 text-green-600" />
                  Add Funds via GCash
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/agency/profile?tab=payment-methods")}
                >
                  <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                  Manage Payment Methods
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/agency/transactions")}
                >
                  <Clock className="h-4 w-4 mr-2 text-purple-600" />
                  View Transaction History
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
