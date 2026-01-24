"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar } from "../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  DollarSign,
  CreditCard,
  Calendar,
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
  Eye,
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
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last_30_days");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchAnalytics();
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white">
          {/* Blur Orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Activity className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">Analytics Overview</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Comprehensive platform insights and performance metrics
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {/* Date Range Selector */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                </select>

                {/* Compare Toggle */}
                <Button
                  onClick={() => setCompareEnabled(!compareEnabled)}
                  variant={compareEnabled ? "default" : "outline"}
                  className={
                    compareEnabled
                      ? "bg-white text-indigo-600 hover:bg-gray-100"
                      : "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                  }
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Compare Period
                </Button>

                {/* Refresh */}
                <Button
                  onClick={fetchAnalytics}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>

                {/* Export */}
                <Button className="bg-white text-indigo-600 hover:bg-gray-100">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 text-sm text-blue-100">
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users Card */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge
                    variant={
                      (stats?.users.growth_rate || 0) >= 0
                        ? "default"
                        : "destructive"
                    }
                    className="flex items-center space-x-1"
                  >
                    {(stats?.users.growth_rate || 0) >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(stats?.users.growth_rate || 0)}%</span>
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {formatNumber(stats?.users.total || 0)}
                </h3>
                <p className="text-sm text-gray-500 mb-3">Total Users</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    +{formatNumber(stats?.users.new || 0)} new
                  </span>
                  <span className="text-green-600 font-medium">
                    {formatNumber(stats?.users.active || 0)} active
                  </span>
                </div>
                {/* Mini Sparkline */}
                <div className="mt-3 h-8 flex items-end space-x-1">
                  {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-200 rounded-t group-hover:bg-blue-400 transition-colors"
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Jobs Card */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    {stats?.jobs.completion_rate || 0}% completed
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {formatNumber(stats?.jobs.active || 0)}
                </h3>
                <p className="text-sm text-gray-500 mb-3">Active Jobs</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {formatNumber(stats?.jobs.total || 0)} total
                  </span>
                  <span className="text-green-600 font-medium">
                    {formatNumber(stats?.jobs.completed || 0)} completed
                  </span>
                </div>
                {/* Mini Bar Chart */}
                <div className="mt-3 h-8 flex items-end space-x-1">
                  {[30, 45, 40, 60, 55, 75, 70, 85, 80, 90].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-green-200 rounded-t group-hover:bg-green-400 transition-colors"
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Total Revenue Card */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge
                    variant={
                      (stats?.revenue.growth_rate || 0) >= 0
                        ? "default"
                        : "destructive"
                    }
                    className="flex items-center space-x-1"
                  >
                    {(stats?.revenue.growth_rate || 0) >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(stats?.revenue.growth_rate || 0)}%</span>
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(stats?.revenue.total || 0)}
                </h3>
                <p className="text-sm text-gray-500 mb-3">Total Revenue</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {formatNumber(stats?.transactions.count || 0)} transactions
                  </span>
                  <span className="text-purple-600 font-medium">
                    Avg: {formatCurrency(stats?.transactions.avg_value || 0)}
                  </span>
                </div>
                {/* Mini Line Chart */}
                <div className="mt-3 h-8 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 30">
                    <polyline
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2"
                      points="0,25 10,20 20,22 30,15 40,18 50,10 60,12 70,8 80,5 90,3 100,2"
                      className="group-hover:stroke-purple-600 transition-colors"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Platform Fees Card */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                    {stats?.revenue.platform_fees
                      ? (
                          (stats.revenue.platform_fees / stats.revenue.total) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(stats?.revenue.platform_fees || 0)}
                </h3>
                <p className="text-sm text-gray-500 mb-3">Platform Fees</p>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-600">Of total revenue</span>
                </div>
                {/* Progress Bar */}
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500 group-hover:from-orange-500 group-hover:to-amber-500"
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
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Revenue Trend</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Last {dateRange.replace(/_/g, " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  {/* Chart placeholder - integrate Chart.js or Recharts here */}
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-2 text-purple-400" />
                    <p>Revenue timeline chart</p>
                    <p className="text-xs mt-1">
                      {revenueData.length} data points
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Growth Chart */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>User Growth</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    New & Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  {/* Chart placeholder */}
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 text-blue-400" />
                    <p>User growth area chart</p>
                    <p className="text-xs mt-1">
                      {userGrowthData.length} data points
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Jobs by Category */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span>Jobs by Category</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Construction", count: 145, color: "bg-blue-500" },
                    { name: "Plumbing", count: 98, color: "bg-green-500" },
                    { name: "Electrical", count: 87, color: "bg-yellow-500" },
                    { name: "Carpentry", count: 76, color: "bg-purple-500" },
                    { name: "Painting", count: 54, color: "bg-orange-500" },
                  ].map((category, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{category.name}</span>
                        <span className="font-medium">{category.count}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${category.color} rounded-full transition-all duration-500`}
                          style={{ width: `${(category.count / 145) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-purple-600" />
                  <span>Payment Methods</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="20"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray="440"
                        strokeDashoffset="110"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray="440"
                        strokeDashoffset="242"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {stats?.transactions.count || 0}
                        </p>
                        <p className="text-xs text-gray-500">Transactions</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>GCash</span>
                    </div>
                    <span className="font-medium">
                      {stats?.transactions.payment_methods.gcash || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Wallet</span>
                    </div>
                    <span className="font-medium">
                      {stats?.transactions.payment_methods.wallet || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded"></div>
                      <span>Cash</span>
                    </div>
                    <span className="font-medium">
                      {stats?.transactions.payment_methods.cash || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Types */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span>User Types</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-700">Clients</span>
                    </div>
                    <Badge className="bg-blue-600">
                      {Math.floor((stats?.users.total || 0) * 0.45)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-700">Workers</span>
                    </div>
                    <Badge className="bg-green-600">
                      {Math.floor((stats?.users.total || 0) * 0.45)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-700">
                        Agencies
                      </span>
                    </div>
                    <Badge className="bg-purple-600">
                      {Math.floor((stats?.users.total || 0) * 0.1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.transactions.avg_value || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Avg Transaction</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.jobs.completion_rate || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Completion Rate</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">3.2h</p>
                <p className="text-xs text-gray-500 mt-1">Response Time</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(Math.floor((stats?.users.total || 0) * 0.45))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Active Workers</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">67%</p>
                <p className="text-xs text-gray-500 mt-1">Repeat Clients</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
                <p className="text-xs text-gray-500 mt-1">Platform Rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Feed */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
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
                    icon: DollarSign,
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
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 ${activity.bg} rounded-lg`}>
                        <Icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {activity.text}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
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
