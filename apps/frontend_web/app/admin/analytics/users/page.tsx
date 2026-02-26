"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar, useMainContentClass } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
} from "lucide-react";

// Helper to format numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
};

export default function UserAnalytics() {
  const mainClass = useMainContentClass("min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last_30_days");
  const [segment, setSegment] = useState("all");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchUserAnalytics();
  }, [dateRange, segment]);

  const fetchUserAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/analytics/users?period=${dateRange}&segment=${segment}`,
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
        <Activity className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Extract data with defaults
  const dau = stats?.active_users?.dau || 0;
  const wau = stats?.active_users?.wau || 0;
  const mau = stats?.active_users?.mau || 0;
  const dauGrowth = stats?.active_users?.dau_change || 0;
  const wauGrowth = stats?.active_users?.wau_change || 0;
  const mauGrowth = stats?.active_users?.mau_change || 0;
  const churnRate = stats?.churn_analysis?.churn_rate || 0;
  const atRiskUsers = stats?.churn_analysis?.at_risk_users || 0;
  const retentionRate = stats?.churn_analysis?.retention_rate || 0;
  const demographics = stats?.demographics || [];
  const topCities = stats?.top_cities || [];
  const retentionCohorts = stats?.retention_cohorts || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={mainClass}>
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl mx-4 sm:mx-8 mt-4 sm:mt-8">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-4 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2 justify-center sm:justify-start">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                  <h1 className="text-2xl sm:text-3xl font-bold">User Analytics</h1>
                </div>
                <p className="text-blue-100 text-sm sm:text-lg">
                  Growth, retention, and demographic insights
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm font-bold"
                  >
                    <option value="last_7_days" className="text-gray-900">7 Days</option>
                    <option value="last_30_days" className="text-gray-900">30 Days</option>
                    <option value="last_90_days" className="text-gray-900">90 Days</option>
                  </select>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm font-bold"
                  >
                    <option value="all" className="text-gray-900">All Users</option>
                    <option value="clients" className="text-gray-900">Clients</option>
                    <option value="workers" className="text-gray-900">Workers</option>
                    <option value="agencies" className="text-gray-900">Agencies</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <Button
                    onClick={fetchUserAnalytics}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 h-10 text-[11px] sm:text-xs font-bold rounded-xl flex-1 sm:flex-none"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh
                  </Button>
                  <Button className="bg-white text-blue-600 hover:bg-gray-100 h-10 text-[11px] sm:text-xs font-bold rounded-xl flex-1 sm:flex-none shadow-lg">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-6 space-y-6">
          {/* User Growth Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 sm:p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-0 font-black text-[10px] sm:text-xs uppercase tracking-widest">DAU</Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {formatNumber(dau)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-4">Daily Active Users</p>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-tight bg-gray-50 p-2 rounded-lg inline-flex">
                  {dauGrowth >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                  )}
                  <span
                    className={
                      dauGrowth >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {dauGrowth >= 0 ? "+" : ""}
                    {dauGrowth.toFixed(1)}% vs prev
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 sm:p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0 font-black text-[10px] sm:text-xs uppercase tracking-widest">WAU</Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {formatNumber(wau)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-4">Weekly Active Users</p>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-tight bg-gray-50 p-2 rounded-lg inline-flex">
                  {wauGrowth >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                  )}
                  <span
                    className={
                      wauGrowth >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {wauGrowth >= 0 ? "+" : ""}
                    {wauGrowth.toFixed(1)}% vs prev
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white sm:col-span-2 lg:col-span-1">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 sm:p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-0 font-black text-[10px] sm:text-xs uppercase tracking-widest">MAU</Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  {formatNumber(mau)}
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-4">Monthly Active Users</p>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-tight bg-gray-50 p-2 rounded-lg inline-flex">
                  {mauGrowth >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                  )}
                  <span
                    className={
                      mauGrowth >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {mauGrowth >= 0 ? "+" : ""}
                    {mauGrowth.toFixed(1)}% vs prev
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Timeline */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Registration Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <div className="text-center p-4">
                  <Activity className="h-10 w-10 mx-auto mb-2 text-blue-400/60" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Segmented growth analyzer
                  </p>
                  <p className="text-[10px] font-bold text-gray-300 mt-1 uppercase">Clients • Workers • Agencies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retention Cohort Analysis */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-lg font-black uppercase tracking-tight">Retention Cohort Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
                <table className="w-full text-[11px] sm:text-sm border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Cohort</th>
                      <th className="text-center py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Day 1</th>
                      <th className="text-center py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Day 7</th>
                      <th className="text-center py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Day 30</th>
                      <th className="text-center py-3 px-2 font-black text-gray-400 uppercase tracking-widest">Day 90</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(retentionCohorts.length > 0
                      ? retentionCohorts
                      : [
                        {
                          month: "Jan 2025",
                          d1: 95,
                          d7: 78,
                          d30: 62,
                          d90: 45,
                        },
                        {
                          month: "Dec 2024",
                          d1: 93,
                          d7: 75,
                          d30: 58,
                          d90: 42,
                        },
                        {
                          month: "Nov 2024",
                          d1: 91,
                          d7: 72,
                          d30: 55,
                          d90: 38,
                        },
                        {
                          month: "Oct 2024",
                          d1: 89,
                          d7: 70,
                          d30: 52,
                          d90: 35,
                        },
                      ]
                    ).map((cohort: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group">
                        <td className="py-4 px-2 font-bold text-gray-700 uppercase">{cohort.month}</td>
                        <td className="text-center py-4 px-2">
                          <div
                            className={`inline-flex items-center justify-center w-12 h-8 sm:w-16 rounded-lg font-black ${cohort.d1 >= 90 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"} shadow-sm`}
                          >
                            {cohort.d1}%
                          </div>
                        </td>
                        <td className="text-center py-4 px-2">
                          <div
                            className={`inline-flex items-center justify-center w-12 h-8 sm:w-16 rounded-lg font-black ${cohort.d7 >= 70 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"} shadow-sm`}
                          >
                            {cohort.d7}%
                          </div>
                        </td>
                        <td className="text-center py-4 px-2">
                          <div
                            className={`inline-flex items-center justify-center w-12 h-8 sm:w-16 rounded-lg font-black ${cohort.d30 >= 50 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"} shadow-sm`}
                          >
                            {cohort.d30}%
                          </div>
                        </td>
                        <td className="text-center py-4 px-2">
                          <div
                            className={`inline-flex items-center justify-center w-12 h-8 sm:w-16 rounded-lg font-black ${cohort.d90 >= 40 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"} shadow-sm`}
                          >
                            {cohort.d90}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Demographics & Top Cities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-sm sm:text-lg font-black uppercase tracking-tight">User Demographics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-6">
                  {(demographics.length > 0
                    ? demographics
                    : [
                      { age_range: "18-24", count: 2345, percentage: 25 },
                      { age_range: "25-34", count: 4567, percentage: 48 },
                      { age_range: "35-44", count: 1890, percentage: 20 },
                      { age_range: "45+", count: 645, percentage: 7 },
                    ]
                  ).map((demo: any, i: number) => {
                    const colors = [
                      "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]",
                      "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
                      "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]",
                      "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]",
                    ];
                    return (
                      <div key={i} className="group/item">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-bold text-gray-600 group-hover/item:text-gray-900 transition-colors uppercase tracking-tight">
                            {demo.age_range} Years
                          </span>
                          <span className="text-xs sm:text-sm font-black text-gray-900 border-b-2 border-indigo-100">
                            {formatNumber(demo.count)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${demo.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Top Geographic Hubs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {(topCities.length > 0
                    ? topCities
                    : [
                      { city: "Zamboanga City", users: 3456, percentage: 27 },
                      { city: "Manila", users: 2890, percentage: 22 },
                      { city: "Cebu City", users: 2134, percentage: 17 },
                      { city: "Davao City", users: 1567, percentage: 12 },
                      { city: "Cagayan de Oro", users: 1234, percentage: 10 },
                    ]
                  )
                    .slice(0, 5)
                    .map((city: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all group/item border border-transparent hover:border-gray-100"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-xs font-black text-indigo-400 w-5">
                            0{i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                              {city.city}
                            </p>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tighter">
                              {formatNumber(city.users)} ACTIVE USERS
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-700 border-0 font-black text-[10px] sm:text-xs px-2 py-0.5 h-6">
                          {city.percentage}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Churn Analysis */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Churn & Consistency Radar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-orange-50 border-2 border-orange-100 rounded-2xl group hover:bg-orange-100 transition-all shadow-sm">
                  <p className="text-3xl sm:text-4xl font-black text-orange-600 mb-1 group-hover:scale-110 transition-transform">
                    {churnRate.toFixed(1)}%
                  </p>
                  <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest leading-none mb-3">Monthly Churn</p>
                  <Badge
                    className={`border-0 font-black text-[10px] uppercase h-6 ${churnRate < 5 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {churnRate < 5 ? "On Target" : "Critical Area"}
                  </Badge>
                </div>
                <div className="text-center p-6 bg-red-50 border-2 border-red-100 rounded-2xl group hover:bg-red-100 transition-all shadow-sm">
                  <p className="text-3xl sm:text-4xl font-black text-red-600 mb-1 group-hover:scale-110 transition-transform">
                    {formatNumber(atRiskUsers)}
                  </p>
                  <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest leading-none mb-3">At-Risk Users</p>
                  <Badge className="bg-red-200 text-red-800 border-0 font-black text-[10px] uppercase h-6">
                    Needs Action
                  </Badge>
                </div>
                <div className="text-center p-6 bg-indigo-50 border-2 border-indigo-100 rounded-2xl group hover:bg-indigo-100 transition-all shadow-sm">
                  <p className="text-3xl sm:text-4xl font-black text-indigo-600 mb-1 group-hover:scale-110 transition-transform">
                    {retentionRate.toFixed(1)}%
                  </p>
                  <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest leading-none mb-3">Retention Rate</p>
                  <Badge
                    className={`border-0 font-black text-[10px] uppercase h-6 ${retentionRate >= 90 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {retentionRate >= 90 ? "Excellent" : "Increasing"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
