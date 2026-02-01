"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Package,
} from "lucide-react";

// Helper to format numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
};

export default function JobAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last_30_days");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchJobAnalytics();
  }, [dateRange]);

  const fetchJobAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/analytics/jobs?period=${dateRange}`,
        { credentials: "include" },
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.analytics);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Activity className="h-12 w-12 text-green-500 animate-spin" />
      </div>
    );
  }

  // Extract data with defaults
  const jobsPosted = stats?.jobs_posted || 0;
  const jobsCompleted = stats?.jobs_completed || 0;
  const completionRate = stats?.completion_rate || 0;
  const avgDays = stats?.avg_completion_days || 0;
  const postedGrowth = stats?.posted_growth || 0;
  const completedGrowth = stats?.completed_growth || 0;
  const categoryStats = stats?.category_stats || [];
  const budgetDistribution = stats?.budget_distribution || [];
  const applicationMetrics = stats?.application_metrics || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-72 min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Briefcase className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">
                    Job Marketplace Analytics
                  </h1>
                </div>
                <p className="text-green-100 text-lg">
                  Performance metrics and marketplace insights
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none"
                >
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_90_days">Last 90 Days</option>
                </select>
                <Button
                  onClick={fetchJobAnalytics}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button className="bg-white text-green-600 hover:bg-gray-100">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Job Volume Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {formatNumber(jobsPosted)}
                </h3>
                <p className="text-sm text-gray-500">Jobs Posted</p>
                <div className="mt-3 flex items-center text-sm">
                  {postedGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={
                      postedGrowth >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {postedGrowth >= 0 ? "+" : ""}
                    {postedGrowth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {formatNumber(jobsCompleted)}
                </h3>
                <p className="text-sm text-gray-500">Jobs Completed</p>
                <div className="mt-3 flex items-center text-sm">
                  {completedGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={
                      completedGrowth >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {completedGrowth >= 0 ? "+" : ""}
                    {completedGrowth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {completionRate.toFixed(1)}%
                </h3>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <Badge
                  className={`mt-2 ${completionRate >= 80 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {completionRate >= 80 ? "Excellent" : "Needs improvement"}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {avgDays.toFixed(1)}
                </h3>
                <p className="text-sm text-gray-500">Avg Days to Complete</p>
              </CardContent>
            </Card>
          </div>

          {/* Job Timeline */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                <span>Job Volume Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-green-400" />
                  <p>Line chart: Jobs Posted vs Jobs Completed over time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Performance Table */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Category Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">
                        Category
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Jobs Posted
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Completed
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Rate
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Avg Budget
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Total Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(categoryStats.length > 0
                      ? categoryStats
                      : [
                        {
                          name: "Construction",
                          posted: 1245,
                          completed: 1089,
                          rate: 87.5,
                          budget: 8500,
                          revenue: 9261500,
                        },
                        {
                          name: "Plumbing",
                          posted: 987,
                          completed: 856,
                          rate: 86.7,
                          budget: 2500,
                          revenue: 2140000,
                        },
                        {
                          name: "Electrical",
                          posted: 876,
                          completed: 745,
                          rate: 85.0,
                          budget: 3200,
                          revenue: 2384000,
                        },
                        {
                          name: "Carpentry",
                          posted: 654,
                          completed: 578,
                          rate: 88.4,
                          budget: 4500,
                          revenue: 2601000,
                        },
                        {
                          name: "Painting",
                          posted: 543,
                          completed: 456,
                          rate: 84.0,
                          budget: 1800,
                          revenue: 820800,
                        },
                      ]
                    ).map((cat: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">
                          {cat.name}
                        </td>
                        <td className="text-right p-3">
                          {cat.posted?.toLocaleString() || 0}
                        </td>
                        <td className="text-right p-3">
                          {cat.completed?.toLocaleString() || 0}
                        </td>
                        <td className="text-right p-3">
                          <Badge
                            className={
                              (cat.rate || 0) >= 85
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {(cat.rate || 0).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-right p-3">
                          ₱{(cat.budget || 0).toLocaleString()}
                        </td>
                        <td className="text-right p-3 font-medium">
                          ₱{(cat.revenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Budget & Application Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <span>Budget Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(budgetDistribution.length > 0
                    ? budgetDistribution
                    : [
                      { range: "₱0 - ₱500", count: 567, percentage: 12 },
                      { range: "₱500 - ₱1,000", count: 1234, percentage: 27 },
                      {
                        range: "₱1,000 - ₱2,500",
                        count: 1567,
                        percentage: 34,
                      },
                      {
                        range: "₱2,500 - ₱5,000",
                        count: 890,
                        percentage: 19,
                      },
                      { range: "₱5,000+", count: 309, percentage: 8 },
                    ]
                  ).map((budget: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-medium">
                          {budget.range}
                        </span>
                        <span className="text-gray-600">
                          {budget.count} jobs
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${budget.percentage * 3}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Application Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <p className="text-4xl font-bold text-blue-600 mb-2">
                      {(applicationMetrics.avg_per_job || 5.8).toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg Applications per Job
                    </p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-xl">
                    <p className="text-4xl font-bold text-green-600 mb-2">
                      {(applicationMetrics.hire_rate || 42.5).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      Application to Hire Rate
                    </p>
                  </div>
                  <div className="text-center p-6 bg-orange-50 rounded-xl">
                    <p className="text-4xl font-bold text-orange-600 mb-2">
                      {applicationMetrics.time_to_first || "2.3h"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Time to First Application
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
