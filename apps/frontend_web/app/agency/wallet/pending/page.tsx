"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ArrowLeft,
  CalendarClock,
  Wallet,
  Info,
  CheckCircle,
  AlertCircle,
  RefreshCw,
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
  earnings: PendingEarning[];
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
        setPendingEarnings(data.earnings || []);
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
        <Badge className="bg-green-100 text-green-700 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      );
    } else if (daysUntilRelease <= 2) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          {daysUntilRelease}d left
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-300">
          <Clock className="h-3 w-3 mr-1" />
          {daysUntilRelease}d left
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-8 py-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <CalendarClock className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pending Earnings</h1>
              <p className="text-orange-100 mt-1">Funds in 7-day security buffer</p>
            </div>
          </div>

          {/* Total Pending */}
          <Card className="mt-6 bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Pending Release</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalPending)}</p>
                  <p className="text-orange-200 text-sm mt-1">
                    {pendingEarnings.length} payment{pendingEarnings.length !== 1 ? "s" : ""} in buffer
                  </p>
                </div>
                <div className="p-4 bg-white/10 rounded-xl">
                  <Wallet className="h-10 w-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {/* Info Banner */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">7-Day Security Buffer</p>
                <p className="text-sm text-blue-700 mt-1">
                  After a job is completed and the client approves, payments are held for 7 days
                  to ensure quality and handle any disputes. After this period, funds are automatically
                  released to your available balance for withdrawal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={fetchPendingEarnings} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Pending Earnings List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : pendingEarnings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarClock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Earnings</h3>
              <p className="text-gray-500 mb-4">
                Complete jobs to start earning. Payments will appear here during the 7-day buffer period.
              </p>
              <Button onClick={() => router.push("/agency/jobs")} variant="outline">
                View Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingEarnings.map((earning) => (
              <Card key={earning.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {earning.job_title}
                        </h3>
                        {getStatusBadge(earning.days_until_release)}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Client: {earning.client_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          Completed {formatDate(earning.completed_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5 text-orange-500" />
                          Releases {formatDate(earning.release_date)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(earning.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Buffer Progress</span>
                      <span>
                        {earning.days_until_release <= 0
                          ? "Ready for release"
                          : `${7 - earning.days_until_release}/7 days`}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((7 - earning.days_until_release) / 7) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {pendingEarnings.length > 0 && (
          <Card className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ready for release within</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Math.max(...pendingEarnings.map((e) => e.days_until_release), 0)} days
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/agency/wallet")}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Back to Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
