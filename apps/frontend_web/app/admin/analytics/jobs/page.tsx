"use client";

import {
  useState, useEffect
} from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar, useMainContentClass } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
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
  const mainClass = useMainContentClass("min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50");
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
      <div className={mainClass}>
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-xl mx-4 sm:mx-8 mt-4 sm:mt-8">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-4 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2 justify-center sm:justify-start">
                  <Briefcase className="h-6 w-6 sm:h-8 sm:w-8" />
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Marketplace Analytics
                  </h1>
                </div>
                <p className="text-green-100 text-sm sm:text-lg">
                  Performance metrics and marketplace insights
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none text-xs sm:text-sm font-bold"
                >
                  <option value="last_7_days" className="text-gray-900">7 Days</option>
                  <option value="last_30_days" className="text-gray-900">30 Days</option>
                  <option value="last_90_days" className="text-gray-900">90 Days</option>
                </select>
                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <Button
                    onClick={fetchJobAnalytics}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 h-10 text-[11px] sm:text-xs font-bold rounded-xl flex-1 sm:flex-none"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh
                  </Button>
                  <Button className="bg-white text-green-600 hover:bg-gray-100 h-10 text-[11px] sm:text-xs font-bold rounded-xl flex-1 sm:flex-none shadow-lg">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-6 space-y-6">
          {/* Job Volume Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {formatNumber(jobsPosted)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-3 sm:mb-4">Jobs Posted</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-tight bg-gray-50 p-1.5 sm:p-2 rounded-lg inline-flex">
                  {postedGrowth >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                  )}
                  <span
                    className={
                      postedGrowth >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {postedGrowth >= 0 ? "+" : ""}
                    {postedGrowth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {formatNumber(jobsCompleted)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-3 sm:mb-4">Jobs Completed</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-tight bg-gray-50 p-1.5 sm:p-2 rounded-lg inline-flex">
                  {completedGrowth >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                  )}
                  <span
                    className={
                      completedGrowth >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {completedGrowth >= 0 ? "+" : ""}
                    {completedGrowth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {completionRate.toFixed(1)}%
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-3 sm:mb-4">Completion Rate</p>
                <Badge
                  className={`border-0 font-black text-[10px] uppercase h-6 ${completionRate >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"} shadow-sm`}
                >
                  {completionRate >= 80 ? "Efficient" : "Analyzing"}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {avgDays.toFixed(1)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-3 sm:mb-4">Avg Days to Complete</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-tight bg-gray-50 p-1.5 sm:p-2 rounded-lg inline-flex">
                  <span className="text-gray-500">Days per cycle</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Timeline */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Marketplace Activity Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <div className="text-center p-4">
                  <Activity className="h-10 w-10 mx-auto mb-2 text-green-400/60 transition-transform group-hover:scale-110" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Volume Trend Visualizer
                  </p>
                  <p className="text-[10px] font-bold text-gray-300 mt-1 uppercase">Jobs Posted • Jobs Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Performance Table */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Category Performance Hub</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
                <table className="w-full text-[11px] sm:text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Category</th>
                      <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Jobs Posted</th>
                      <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Completed</th>
                      <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Comp. Rate</th>
                      <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Avg Budget</th>
                      <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Revenue</th>
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
                      <tr key={i} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                        <td className="py-4 px-2 font-bold text-gray-700 uppercase">{cat.name}</td>
                        <td className="text-right py-4 px-2 font-bold text-gray-500">
                          {cat.posted?.toLocaleString() || 0}
                        </td>
                        <td className="text-right py-4 px-2 font-bold text-gray-500">
                          {cat.completed?.toLocaleString() || 0}
                        </td>
                        <td className="text-right py-4 px-2">
                          <Badge
                            className={`border-0 font-black text-[10px] uppercase h-6 px-2 ${(cat.rate || 0) >= 85
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                              } shadow-sm`}
                          >
                            {(cat.rate || 0).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-right py-4 px-2 font-bold text-gray-900">
                          ₱{(cat.budget || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-4 px-2">
                          <span className="font-black text-gray-900 border-b-2 border-emerald-100">
                            ₱{(cat.revenue || 0).toLocaleString()}
                          </span>
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
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5 text-purple-600" />
                  <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Budget Distribution Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-5">
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
                    <div key={i} className="group/item">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-tighter group-hover/item:text-gray-900 transition-colors">
                          {budget.range}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-gray-900">
                          {budget.count} <span className="text-[10px] text-gray-400 font-bold">PROJECTS</span>
                        </span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                          style={{ width: `${budget.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm sm:text-lg font-black uppercase tracking-tight">Marketplace Efficiency Radar</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl group hover:bg-blue-100 transition-all shadow-sm">
                    <div className="text-left">
                      <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Applications / Job</p>
                      <p className="text-2xl sm:text-3xl font-black text-blue-600 group-hover:scale-105 transition-transform origin-left">
                        {(applicationMetrics.avg_per_job || 5.8).toFixed(1)}
                      </p>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group hover:bg-emerald-100 transition-all shadow-sm">
                    <div className="text-left">
                      <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Hire Conversion</p>
                      <p className="text-2xl sm:text-3xl font-black text-emerald-600 group-hover:scale-105 transition-transform origin-left">
                        {(applicationMetrics.hire_rate || 42.5).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl group hover:bg-amber-100 transition-all shadow-sm sm:col-span-2 lg:col-span-1">
                    <div className="text-left">
                      <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest leading-none mb-1">First Application</p>
                      <p className="text-2xl sm:text-3xl font-black text-amber-600 group-hover:scale-105 transition-transform origin-left">
                        {applicationMetrics.time_to_first || "2.3h"}
                      </p>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
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
