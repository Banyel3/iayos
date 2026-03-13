"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ArrowLeft,
  CalendarClock,
  Wallet,
  Info,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  Hourglass,
  ChevronRight,
  ShieldCheck,
  Banknote,
} from "lucide-react";
import { API_BASE } from "@/lib/api/config";

interface PendingEarning {
  id: number;
  amount: number;
  job_title: string;
  client_name: string;
  completed_at: string;
  release_date: string;
  days_until_release: number;
  status: string;
}

interface PendingEarningsResponse {
  pending_earnings: PendingEarning[];
  total_pending: number;
  total_count: number;
}

export default function AgencyPendingEarningsPage() {
  const router = useRouter();
  const [pendingEarnings, setPendingEarnings] = useState<PendingEarning[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchPendingEarnings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agency/wallet/pending-earnings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data: PendingEarningsResponse = await res.json();
        setPendingEarnings(data.pending_earnings || []);
        setTotalPending(data.total_pending || 0);
      }
    } catch (error) {
      console.error("Error fetching pending earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEarnings();
  }, []);

  const getStatusBadge = (daysUntilRelease: number) => {
    if (daysUntilRelease <= 0) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 font-bold text-[10px] uppercase">
          Ready
        </Badge>
      );
    } else if (daysUntilRelease <= 2) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 font-bold text-[10px] uppercase">
          Finalizing
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-bold text-[10px] uppercase">
          In Buffer
        </Badge>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-500 hover:text-[#00BAF1] hover:bg-[#00BAF1]/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Hourglass className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Held Earnings</h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              Funds currently in the 7-day security verification window
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           {/* Total Held Card */}
           <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-[#00BAF1] to-[#0092c1] text-white">
              <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
              <CardContent className="p-8 relative">
                 <div className="flex items-center justify-between">
                    <div>
                       <div className="flex items-center gap-2 mb-2 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full w-fit text-[10px] font-bold uppercase tracking-wider">
                          <ShieldCheck className="h-3 w-3" />
                          Escrow Protection
                       </div>
                       <p className="text-white/80 text-sm font-medium">Total Pending Release</p>
                       <p className="text-4xl font-extrabold tracking-tight mt-1">{formatCurrency(totalPending)}</p>
                       <p className="text-white/60 text-xs mt-2 font-bold uppercase tracking-widest">{pendingEarnings.length} Active Transitions</p>
                    </div>
                    <div className="hidden sm:block p-6 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                       <Banknote className="h-10 w-10 text-white" />
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Refresh Control */}
           <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Holds</h2>
              <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={fetchPendingEarnings} 
                 disabled={isLoading}
                 className="text-[#00BAF1] hover:bg-[#00BAF1]/5 h-8 px-3 rounded-lg font-bold text-[10px] uppercase"
              >
                 <RefreshCcw className={`h-3 w-3 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                 Refresh List
              </Button>
           </div>

           {/* List */}
           {isLoading ? (
             <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                   <Card key={i} className="border-gray-50 shadow-sm animate-pulse">
                      <CardContent className="h-24" />
                   </Card>
                ))}
             </div>
           ) : pendingEarnings.length === 0 ? (
              <Card className="border-0 shadow-lg py-20 text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarClock className="h-10 w-10 text-gray-200" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">No Earnings Held</h3>
                 <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">When your agency completes jobs, payments will be listed here during verification.</p>
                 <Button 
                    className="mt-8 bg-[#00BAF1] text-white font-bold rounded-xl"
                    onClick={() => router.push("/agency/jobs")}
                 >
                    View Active Jobs
                 </Button>
              </Card>
           ) : (
              <div className="space-y-4">
                 {pendingEarnings.map((earning) => (
                    <Card key={earning.id} className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                       <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                             <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-3">
                                   <h3 className="font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors">{earning.job_title}</h3>
                                   {getStatusBadge(earning.days_until_release)}
                                </div>
                                <p className="text-xs font-medium text-gray-500">Client: <span className="text-gray-900 font-bold">{earning.client_name}</span></p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-50">
                                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                      Done {formatDate(earning.completed_at)}
                                   </div>
                                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                                      <Clock className="h-3 w-3 text-[#00BAF1]" />
                                      Opens {formatDate(earning.release_date)}
                                   </div>
                                </div>
                             </div>
                             <div className="text-right flex flex-col items-start sm:items-end justify-between self-stretch">
                                <p className="text-2xl font-extrabold text-gray-900 leading-none">{formatCurrency(earning.amount)}</p>
                                <div className="mt-4 sm:mt-0">
                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-left sm:text-right">Release Stage</p>
                                   <div className="flex items-center gap-3">
                                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                         <div 
                                            className="h-full bg-[#00BAF1] rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, ((7 - earning.days_until_release) / 7) * 100)}%` }}
                                         />
                                      </div>
                                      <span className="text-[10px] font-extrabold text-[#00BAF1] uppercase">{7 - earning.days_until_release}/7d</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           )}
        </div>

        <div className="space-y-6">
           <Card className="border-0 shadow-lg bg-[#00BAF1]/5 border-2 border-[#00BAF1]/10">
              <CardContent className="p-6 space-y-4">
                 <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-[#00BAF1]" />
                    <span className="text-xs font-bold text-[#00BAF1] uppercase tracking-widest">Policy Overview</span>
                 </div>
                 <p className="text-[11px] text-sky-900 font-medium leading-relaxed italic">
                    All agency payouts are subject to a 7-day security buffer following job completion to ensure client satisfaction and platform integrity.
                 </p>
                 <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                       <CheckCircle className="h-3.5 w-3.5 text-[#00BAF1] mt-0.5" />
                       <p className="text-[10px] font-bold text-gray-600">Automatic release after 7 days</p>
                    </div>
                    <div className="flex items-start gap-3">
                       <CheckCircle className="h-3.5 w-3.5 text-[#00BAF1] mt-0.5" />
                       <p className="text-[10px] font-bold text-gray-600">Immediate availability once released</p>
                    </div>
                    <div className="flex items-start gap-3">
                       <CheckCircle className="h-3.5 w-3.5 text-[#00BAF1] mt-0.5" />
                       <p className="text-[10px] font-bold text-gray-600">24/7 Monitoring for secure payout</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Button
              onClick={() => router.push("/agency/wallet")}
              className="w-full h-12 bg-white hover:bg-[#00BAF1]/5 border-2 border-[#00BAF1] text-[#00BAF1] font-bold rounded-xl flex items-center justify-between px-6 group"
           >
              <span>Back to Wallet</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
           </Button>
        </div>
      </div>
    </div>
  );
}
