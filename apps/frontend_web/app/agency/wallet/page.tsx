"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/generic_button";
import { toast } from "sonner";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  TrendingUp,
  CreditCard,
  RefreshCcw,
  ChevronRight,
  Hourglass,
  AlertCircle,
  Calendar,
  Banknote,
  Send,
  Plus,
  ShieldCheck,
  Zap,
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
    toast.success("Wallet data updated");
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const recentTransactions = transactions.slice(0, 5);

  const totalEarned = transactions
    .filter((t: any) => ["EARNING", "PENDING_EARNING", "DEPOSIT", "REFUND"].includes(t.type))
    .filter((t: any) => t.status === "COMPLETED")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wallet</h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              Manage your agency funds and payment settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm transition-all"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Balance Card */}
      <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-[#00BAF1] to-[#0092c1] text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full w-fit">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Secure Escrow Protection</span>
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Available Balance</p>
                {isLoadingWallet ? (
                  <div className="h-12 w-48 bg-white/20 animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-5xl font-extrabold tracking-tight mt-1">{formatCurrency(walletBalance)}</p>
                )}
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-[#00BAF1] bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Zap className="h-3 w-3" />
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#00BAF1] bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] font-bold">
                    1h
                  </div>
                </div>
                <p className="text-xs text-white/70">Average withdrawal processing time: <span className="text-white font-bold text-[10px]">1-24 HOURS</span></p>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <Button 
                onClick={() => router.push("/agency/wallet/withdraw")}
                className="bg-white text-[#00BAF1] hover:bg-white/90 font-bold h-12 px-8 rounded-xl shadow-lg border-0"
                disabled={walletBalance < 100}
              >
                Withdraw Now
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/agency/profile?tab=payment-methods")}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm h-12 px-8 rounded-xl"
              >
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><TrendingUp className="h-5 w-5 text-[#00BAF1]" /></div>
              <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full"></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Total Earnings</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalEarned)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Clock className="h-5 w-5 text-[#00BAF1]" /></div>
              <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Pending Release</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(pendingEarnings?.total_pending || 0)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 col-span-2 md:col-span-1">
          <CardContent className="py-2.5 px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><CreditCard className="h-5 w-5 text-[#00BAF1]" /></div>
              <Plus 
                className="h-4 w-4 text-[#00BAF1] cursor-pointer hover:scale-110 transition-transform" 
                onClick={() => router.push("/agency/profile?tab=payment-methods")}
              />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Payment Methods</p>
            <p className="text-xl font-bold text-gray-900">{paymentMethods.length || 0} Connected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Left: Pending Earnings List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hourglass className="h-5 w-5 text-[#00BAF1]" />
                    Held in Escrow
                  </CardTitle>
                  <CardDescription>Earnings waiting for the 7-day buffer period</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#00BAF1] hover:bg-[#00BAF1]/10"
                  onClick={() => router.push("/agency/wallet/pending")}
                >
                  View Detail <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingPending ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : !pendingEarnings || pendingEarnings.count === 0 ? (
                <div className="text-center py-20 px-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Hourglass className="h-10 w-10 text-gray-200" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No pending earnings</h3>
                  <p className="text-gray-500 max-w-xs mx-auto mt-1">When you complete jobs, funds will be held here for 7 days before becoming available.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="p-4 bg-sky-50/50 border-b border-sky-100 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#00BAF1] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-sky-900 font-medium leading-relaxed">{pendingEarnings.info_message}</p>
                  </div>
                  {pendingEarnings.items.slice(0, 3).map((item) => (
                    <div
                      key={item.job_id}
                      className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-all cursor-pointer group"
                      onClick={() => router.push(`/agency/wallet/pending`)}
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors">{item.job_title}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(item.release_date), { addSuffix: true })}
                          </div>
                          {item.has_active_backjob && (
                            <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50 text-[10px] font-bold">
                              Backjob Active
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                        <p className="text-[10px] font-bold text-[#00BAF1] uppercase tracking-wider">{item.days_until_release} days remaining</p>
                      </div>
                    </div>
                  ))}
                  {pendingEarnings.count > 3 && (
                    <button
                      className="w-full py-4 text-sm font-bold text-gray-500 hover:text-[#00BAF1] bg-gray-50/30 hover:bg-gray-50/80 transition-all border-t border-gray-100 uppercase tracking-widest text-[10px]"
                      onClick={() => router.push("/agency/wallet/pending")}
                    >
                      Show all {pendingEarnings.count} held transactions
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Recent Activity & Actions */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Activity</CardTitle>
                <button
                   onClick={() => router.push("/agency/transactions")}
                   className="text-xs font-bold text-[#00BAF1] hover:underline"
                >
                  History
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTransactions ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 4].map((i) => (
                    <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="py-12 text-center">
                  <Banknote className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentTransactions.map((tx: any) => {
                    const isIncoming = ["DEPOSIT", "EARNING", "PENDING_EARNING", "REFUND"].includes(tx.type);
                    return (
                      <div
                        key={tx.id}
                        className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl scale-90 ${isIncoming ? "bg-green-100" : "bg-red-100"}`}>
                            {isIncoming ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{tx.description}</span>
                            <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <span className={`text-[11px] font-bold ${isIncoming ? "text-green-600" : "text-red-600"}`}>
                          {isIncoming ? "+" : "-"}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border-0 shadow-lg overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="h-12 w-12 text-[#00BAF1]" />
             </div>
             <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Access</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3 pb-6">

                <Button
                  variant="outline"
                  className="w-full justify-between h-12 rounded-xl border-gray-100 hover:border-[#00BAF1] hover:bg-[#00BAF1]/5 group/btn"
                  onClick={() => router.push("/agency/profile?tab=payment-methods")}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg group-hover/btn:bg-[#00BAF1]/20 transition-colors">
                      <CreditCard className="h-3.5 w-3.5 text-[#00BAF1]" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Payout Settings</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-12 rounded-xl border-gray-100 hover:border-[#00BAF1] hover:bg-[#00BAF1]/5 group/btn"
                  onClick={() => router.push("/agency/transactions")}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg group-hover/btn:bg-[#00BAF1]/20 transition-colors">
                      <Clock className="h-3.5 w-3.5 text-[#00BAF1]" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Recent History</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
