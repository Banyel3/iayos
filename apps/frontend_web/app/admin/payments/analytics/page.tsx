"use client";

import { useState, useEffect } from "react";
import { Sidebar, useMainContentClass } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Briefcase,
  CreditCard,
} from "lucide-react";

interface Statistics {
  total_revenue: number;
  total_transactions: number;
  total_escrow_held: number;
  total_refunded: number;
  platform_fees: number;
  average_transaction: number;
  revenue_change_percent: number;
  transactions_change_percent: number;
  escrow_change_percent: number;
  refunded_change_percent: number;
  fees_change_percent: number;
  avg_transaction_change_percent: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  transactions: number;
}

interface PaymentMethodBreakdown {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

interface TopClient {
  id: number;
  name: string;
  email: string;
  total_spent: number;
  transactions_count: number;
}

interface TopWorker {
  id: number;
  name: string;
  email: string;
  total_earned: number;
  jobs_completed: number;
}

interface TopCategory {
  id: number;
  name: string;
  revenue: number;
  jobs_count: number;
}

export default function AnalyticsPage() {
  const mainClass = useMainContentClass("flex-1 p-8");
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<
    PaymentMethodBreakdown[]
  >([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [topWorkers, setTopWorkers] = useState<TopWorker[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last_30_days");

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/statistics?period=${dateRange}`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchRevenueTrends = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/revenue-trends?period=${dateRange}`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch trends");

      const data = await response.json();
      setRevenueTrends(data.trends || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/payment-methods-breakdown?period=${dateRange}`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch payment methods");

      const data = await response.json();
      setPaymentMethods(data.methods || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchTopPerformers = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/top-performers?period=${dateRange}`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch top performers");

      const data = await response.json();
      setTopClients(data.top_clients || []);
      setTopWorkers(data.top_workers || []);
      setTopCategories(data.top_categories || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchRevenueTrends();
    fetchPaymentMethods();
    fetchTopPerformers();
  }, [dateRange]);

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      gcash: "bg-blue-500",
      wallet: "bg-purple-500",
      cash: "bg-gray-500",
    };
    return colors[method.toLowerCase()] || "bg-gray-400";
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      gcash: "💳",
      wallet: "💰",
      cash: "💵",
    };
    return icons[method.toLowerCase()] || "💰";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <BarChart3 className="h-16 w-16 text-blue-600 animate-pulse mx-auto" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading analytics...
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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="h-8 w-8" />
                    <h1 className="text-4xl font-bold">Financial Analytics</h1>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Revenue insights and performance metrics
                  </p>
                </div>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="p-3 rounded-xl bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm"
                >
                  <option value="last_7_days" className="text-gray-900">
                    Last 7 Days
                  </option>
                  <option value="last_30_days" className="text-gray-900">
                    Last 30 Days
                  </option>
                  <option value="last_90_days" className="text-gray-900">
                    Last 90 Days
                  </option>
                  <option value="this_year" className="text-gray-900">
                    This Year
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge
                      className={`${
                        statistics.revenue_change_percent >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {statistics.revenue_change_percent >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(statistics.revenue_change_percent).toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₱{(statistics.total_revenue ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <Badge
                      className={`${
                        statistics.transactions_change_percent >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {statistics.transactions_change_percent >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(statistics.transactions_change_percent).toFixed(
                        1,
                      )}
                      %
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Transactions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.total_transactions}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <Badge
                      className={`${
                        statistics.escrow_change_percent >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {statistics.escrow_change_percent >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(statistics.escrow_change_percent).toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Escrow Held</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₱{(statistics.total_escrow_held ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <TrendingDown className="h-6 w-6 text-orange-600" />
                    </div>
                    <Badge
                      className={`${
                        statistics.refunded_change_percent <= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {Math.abs(statistics.refunded_change_percent).toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Refunded</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₱{(statistics.total_refunded ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                    <Badge
                      className={`${
                        statistics.fees_change_percent >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {statistics.fees_change_percent >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(statistics.fees_change_percent).toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Platform Fees</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₱{(statistics.platform_fees ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-indigo-600" />
                    </div>
                    <Badge
                      className={`${
                        statistics.avg_transaction_change_percent >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {statistics.avg_transaction_change_percent >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(
                        statistics.avg_transaction_change_percent,
                      ).toFixed(1)}
                      %
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Avg Transaction</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₱{(statistics.average_transaction ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Revenue Trend
                </h2>
                {revenueTrends.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No revenue data available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {revenueTrends.map((trend, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {trend.date
                              ? new Date(trend.date).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {trend.transactions || 0} transactions
                          </p>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          ₱{(trend.revenue || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods Breakdown */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Payment Methods
                </h2>
                {paymentMethods.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No payment method data available
                  </p>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {getPaymentMethodIcon(method.method)}
                            </span>
                            <span className="font-semibold text-gray-900 capitalize">
                              {method.method}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              ₱{(method.amount || 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {method.count || 0} transactions
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`${getPaymentMethodColor(
                              method.method,
                            )} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${method.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 text-right">
                          {method.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Clients */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Top Clients
                </h2>
                {topClients.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No client data
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topClients.map((client, index) => (
                      <div
                        key={client.id}
                        className="bg-blue-50 rounded-lg p-3 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {client.name || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {client.transactions_count || 0} transactions
                            </p>
                            <p className="text-lg font-bold text-blue-600 mt-1">
                              ₱{(client.total_spent || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Workers */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Workers
                </h2>
                {topWorkers.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No worker data
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topWorkers.map((worker, index) => (
                      <div
                        key={worker.id}
                        className="bg-green-50 rounded-lg p-3 hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {worker.name || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {worker.jobs_completed || 0} jobs
                            </p>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              ₱{(worker.total_earned || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  Top Categories
                </h2>
                {topCategories.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No category data
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topCategories.map((category, index) => (
                      <div
                        key={category.id}
                        className="bg-purple-50 rounded-lg p-3 hover:bg-purple-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {category.name || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {category.jobs_count || 0} jobs
                            </p>
                            <p className="text-lg font-bold text-purple-600 mt-1">
                              ₱{(category.revenue || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
