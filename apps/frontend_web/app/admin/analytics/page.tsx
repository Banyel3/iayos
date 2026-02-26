"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar, useMainContentClass } from "../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  Briefcase,
  CreditCard,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Package,
  Wallet,
  Banknote,
  UserCheck,
  Building2,
  Clock,
  Star,
  Activity,
} from "lucide-react";

interface OverviewStats {
  users: {
    total: number;
    new: number;
    active: number;
    growth_rate: number;
  };
  jobs: {
    total: number;
    active: number;
    completed: number;
    completion_rate: number;
  };
  revenue: {
    total: number;
    platform_fees: number;
    growth_rate: number;
  };
  transactions: {
    count: number;
    avg_value: number;
    payment_methods: { gcash: number; wallet: number; cash: number };
  };
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  transactions: number;
  users?: number;
}

export default function AnalyticsDashboard() {
  const mainClass = useMainContentClass("min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50");
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last_30_days");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/analytics/overview?period=${dateRange}`,
        { credentials: "include" },
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setRevenueData(data.revenue_timeline || []);
        setUserGrowthData(data.user_timeline || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-gray-500 text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={mainClass}>
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white shadow-xl mx-4 sm:mx-8 mt-4 sm:mt-8">
          {/* Blur Orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-4 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2 justify-center sm:justify-start">
                  <Activity className="h-6 w-6 sm:h-8 sm:w-8" />
                  <h1 className="text-2xl sm:text-3xl font-bold">Analytics Overview</h1>
                </div>
                <p className="text-blue-100 text-sm sm:text-lg">
                  Platform insights and performance metrics
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Date Range Selector */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-bold"
                >
                  <option value="today" className="text-gray-900">Today</option>
                  <option value="yesterday" className="text-gray-900">Yesterday</option>
                  <option value="last_7_days" className="text-gray-900">Last 7 Days</option>
                  <option value="last_30_days" className="text-gray-900">Last 30 Days</option>
                  <option value="this_month" className="text-gray-900">This Month</option>
                  <option value="last_month" className="text-gray-900">Last Month</option>
                </select>

                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  {/* Compare Toggle */}
                  <Button
                    onClick={() => setCompareEnabled(!compareEnabled)}
                    variant={compareEnabled ? "default" : "outline"}
                    className={`h-10 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${compareEnabled
                      ? "bg-white text-indigo-600 hover:bg-gray-100 shadow-lg"
                      : "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                      }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                    Compare
                  </Button>

                  {/* Refresh */}
                  <Button
                    onClick={fetchAnalytics}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 h-10 text-[11px] sm:text-xs font-bold rounded-xl"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh
                  </Button>
                </div>

                {/* Export */}
                <Button className="bg-white text-indigo-600 hover:bg-gray-100 h-10 text-xs sm:text-sm font-bold rounded-xl shadow-lg">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[10px] sm:text-xs font-bold text-blue-100 tracking-wider uppercase">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg">
                <Clock className="h-3 w-3" />
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg">
                <Activity className="h-3 w-3" />
                Live Sync Active
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Users Card */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="relative p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4 text-center sm:text-left">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge
                    variant={
                      (stats?.users.growth_rate || 0) >= 0
                        ? "default"
                        : "destructive"
                    }
                    className="flex items-center space-x-1 !text-white font-black text-[10px] sm:text-xs uppercase tracking-wider"
                  >
                    {(stats?.users.growth_rate || 0) >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(stats?.users.growth_rate || 0)}%</span>
                  </Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {formatNumber(stats?.users.total || 0)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Total Users</p>
                <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="text-gray-500 uppercase">
                    +{formatNumber(stats?.users.new || 0)} New
                  </span>
                  <span className="text-blue-600 uppercase">
                    {formatNumber(stats?.users.active || 0)} Active
                  </span>
                </div>
                {/* Mini Sparkline */}
                <div className="mt-4 h-10 flex items-end space-x-1">
                  {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-200 rounded-t-lg group-hover:bg-blue-600 transition-all duration-500"
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Jobs Card */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="relative p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4 text-center sm:text-left">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 hover:bg-green-100 text-green-800 border-0 font-black text-[10px] sm:text-xs uppercase tracking-wider">
                    {stats?.jobs.completion_rate || 0}% Rate
                  </Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {formatNumber(stats?.jobs.active || 0)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Active Jobs</p>
                <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="text-gray-500 uppercase">
                    {formatNumber(stats?.jobs.total || 0)} Total
                  </span>
                  <span className="text-green-600 uppercase">
                    {formatNumber(stats?.jobs.completed || 0)} Done
                  </span>
                </div>
                {/* Mini Bar Chart */}
                <div className="mt-4 h-10 flex items-end space-x-1">
                  {[30, 45, 40, 60, 55, 75, 70, 85, 80, 90].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-green-200 rounded-t-lg group-hover:bg-green-600 transition-all duration-500"
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Total Revenue Card */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="relative p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4 text-center sm:text-left">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Banknote className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge
                    variant={
                      (stats?.revenue.growth_rate || 0) >= 0
                        ? "default"
                        : "destructive"
                    }
                    className="flex items-center space-x-1 !text-white font-black text-[10px] sm:text-xs uppercase tracking-wider"
                  >
                    {(stats?.revenue.growth_rate || 0) >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(stats?.revenue.growth_rate || 0)}%</span>
                  </Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {formatCurrency(stats?.revenue.total || 0)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Total Revenue</p>
                <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="text-gray-500 uppercase">
                    {formatNumber(stats?.transactions.count || 0)} Trans.
                  </span>
                  <span className="text-purple-600 uppercase">
                    Avg: {formatCurrency(stats?.transactions.avg_value || 0)}
                  </span>
                </div>
                {/* Mini Line Chart */}
                <div className="mt-4 h-10 relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="3"
                      points="0,25 10,20 20,22 30,15 40,18 50,10 60,12 70,8 80,5 90,3 100,2"
                      className="group-hover:stroke-purple-600 transition-all duration-500"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Platform Fees Card */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="relative p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4 text-center sm:text-left">
                  <div className="p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-800 border-0 font-black text-[10px] sm:text-xs uppercase tracking-wider">
                    {stats?.revenue.platform_fees
                      ? (
                        (stats.revenue.platform_fees / stats.revenue.total) *
                        100
                      ).toFixed(1)
                      : 0}
                    % Share
                  </Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {formatCurrency(stats?.revenue.platform_fees || 0)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Platform Fees</p>
                <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold mb-2 uppercase tracking-tight text-gray-400">
                  <span>Of Total Revenue</span>
                  <span className="text-orange-600 font-black">
                    {stats?.revenue.platform_fees && stats.revenue.total ? ((stats.revenue.platform_fees / stats.revenue.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-1000 group-hover:scale-x-105"
                    style={{
                      width: `${stats?.revenue.platform_fees ? (stats.revenue.platform_fees / stats.revenue.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-0">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Revenue Trend</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-2">
                    {dateRange.replace(/_/g, " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  {/* Chart placeholder */}
                  <div className="text-center">
                    <Activity className="h-10 w-10 mx-auto mb-2 text-purple-400" />
                    <p className="text-xs font-bold uppercase tracking-widest leading-tight">Timeline Visualizer</p>
                    <p className="text-[10px] sm:text-xs mt-1 text-gray-300 font-bold">
                      {revenueData.length} data points
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Growth Chart */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-0">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm sm:text-lg font-black uppercase tracking-tight">User Growth</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-2">
                    New & Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  {/* Chart placeholder */}
                  <div className="text-center">
                    <Users className="h-10 w-10 mx-auto mb-2 text-blue-400" />
                    <p className="text-xs font-bold uppercase tracking-widest leading-tight">Growth Map</p>
                    <p className="text-[10px] sm:text-xs mt-1 text-gray-300 font-bold">
                      {userGrowthData.length} data points
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Jobs by Category */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Jobs by Category</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-4">
                  {[
                    { name: "Construction", count: 145, color: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" },
                    { name: "Plumbing", count: 98, color: "bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" },
                    { name: "Electrical", count: 87, color: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" },
                    { name: "Carpentry", count: 76, color: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]" },
                    { name: "Painting", count: 54, color: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]" },
                  ].map((category, i) => (
                    <div key={i} className="group/item">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-1.5">
                        <span className="text-gray-600 group-hover/item:text-gray-900 transition-colors">{category.name}</span>
                        <span className="font-black text-gray-900">{category.count}</span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${category.color} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${(category.count / 145) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-purple-600" />
                  <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Payment Methods</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="h-40 sm:h-48 flex items-center justify-center">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="15%"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="15%"
                        strokeDasharray="251.2"
                        strokeDashoffset="62.8"
                        className="transition-all duration-1000"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="15%"
                        strokeDasharray="251.2"
                        strokeDashoffset="138.16"
                        className="transition-all duration-1000 delay-200"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                          {stats?.transactions.count || 0}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1">Trans.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center">
                  <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
                    <span className="text-gray-500">GCash: <span className="text-gray-900 font-black">{stats?.transactions.payment_methods.gcash || 0}%</span></span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                    <span className="text-gray-500">Wallet: <span className="text-gray-900 font-black">{stats?.transactions.payment_methods.wallet || 0}%</span></span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded shadow-[0_0_8px_rgba(156,163,175,0.3)]"></div>
                    <span className="text-gray-500">Cash: <span className="text-gray-900 font-black">{stats?.transactions.payment_methods.cash || 0}%</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Types */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-sm sm:text-lg font-black uppercase tracking-tight">User Segmentation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group/item">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-blue-900 uppercase tracking-tight">Clients</span>
                    </div>
                    <Badge className="bg-blue-600 text-white border-0 font-black px-2.5 py-0.5 h-6">
                      {Math.floor((stats?.users.total || 0) * 0.45)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group/item">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-green-900 uppercase tracking-tight">Workers</span>
                    </div>
                    <Badge className="bg-green-600 text-white border-0 font-black px-2.5 py-0.5 h-6">
                      {Math.floor((stats?.users.total || 0) * 0.45)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group/item">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Building2 className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-purple-900 uppercase tracking-tight">Agencies</span>
                    </div>
                    <Badge className="bg-purple-600 text-white border-0 font-black px-2.5 py-0.5 h-6">
                      {Math.floor((stats?.users.total || 0) * 0.1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 text-center sm:text-left">
                  <div className="p-2 bg-green-50 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <Banknote className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                  {formatCurrency(stats?.transactions.avg_value || 0)}
                </p>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Avg Transaction</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 text-center sm:text-left">
                  <div className="p-2 bg-blue-50 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                  {stats?.jobs.completion_rate || 0}%
                </p>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Completion Rate</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 text-center sm:text-left">
                  <div className="p-2 bg-orange-50 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">3.2h</p>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Response Time</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 text-center sm:text-left">
                  <div className="p-2 bg-emerald-50 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                  {formatNumber(Math.floor((stats?.users.total || 0) * 0.45))}
                </p>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Active Workers</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 text-center sm:text-left">
                  <div className="p-2 bg-purple-50 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">67%</p>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Repeat Clients</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 text-center sm:text-left">
                  <div className="p-2 bg-amber-50 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">4.8</p>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Platform Rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Feed */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Recent Activity Log</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                {[
                  {
                    icon: Users,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    text: "New user registered",
                    time: "2 minutes ago",
                  },
                  {
                    icon: Briefcase,
                    color: "text-green-600",
                    bg: "bg-green-50",
                    text: "Job completed successfully",
                    time: "5 minutes ago",
                  },
                  {
                    icon: Banknote,
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                    text: "Payment processed",
                    time: "12 minutes ago",
                  },
                  {
                    icon: UserCheck,
                    color: "text-orange-600",
                    bg: "bg-orange-50",
                    text: "Worker verified",
                    time: "18 minutes ago",
                  },
                  {
                    icon: Briefcase,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    text: "New job posted",
                    time: "25 minutes ago",
                  },
                  {
                    icon: Star,
                    color: "text-yellow-600",
                    bg: "bg-yellow-50",
                    text: "New review received",
                    time: "32 minutes ago",
                  },
                  {
                    icon: CreditCard,
                    color: "text-green-600",
                    bg: "bg-green-50",
                    text: "Wallet top-up completed",
                    time: "45 minutes ago",
                  },
                  {
                    icon: Building2,
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                    text: "Agency account created",
                    time: "1 hour ago",
                  },
                ].map((activity, i) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group/item"
                    >
                      <div className={`p-2 ${activity.bg} rounded-lg shadow-sm group-hover/item:scale-110 transition-transform`}>
                        <Icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-700 truncate">
                          {activity.text}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 leading-none">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
