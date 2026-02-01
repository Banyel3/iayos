"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar } from "../../components";
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
  const dauGrowth = stats?.active_users?.dau_growth || 0;
  const wauGrowth = stats?.active_users?.wau_growth || 0;
  const mauGrowth = stats?.active_users?.mau_growth || 0;
  const churnRate = stats?.churn_analysis?.churn_rate || 0;
  const atRiskUsers = stats?.churn_analysis?.at_risk_users || 0;
  const retentionRate = stats?.churn_analysis?.retention_rate || 0;
  const demographics = stats?.demographics || [];
  const topCities = stats?.top_cities || [];
  const retentionCohorts = stats?.retention_cohorts || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-72 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">User Analytics</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Growth, retention, and demographic insights
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_90_days">Last 90 Days</option>
                </select>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="all">All Users</option>
                  <option value="clients">Clients</option>
                  <option value="workers">Workers</option>
                  <option value="agencies">Agencies</option>
                </select>
                <Button
                  onClick={fetchUserAnalytics}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* User Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">DAU</Badge>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {formatNumber(dau)}
                </h3>
                <p className="text-sm text-gray-500">Daily Active Users</p>
                <div className="mt-3 flex items-center text-sm">
                  {dauGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={
                      dauGrowth >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {dauGrowth >= 0 ? "+" : ""}
                    {dauGrowth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">WAU</Badge>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {formatNumber(wau)}
                </h3>
                <p className="text-sm text-gray-500">Weekly Active Users</p>
                <div className="mt-3 flex items-center text-sm">
                  {wauGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={
                      wauGrowth >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {wauGrowth >= 0 ? "+" : ""}
                    {wauGrowth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">MAU</Badge>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {formatNumber(mau)}
                </h3>
                <p className="text-sm text-gray-500">Monthly Active Users</p>
                <div className="mt-3 flex items-center text-sm">
                  {mauGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={
                      mauGrowth >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {mauGrowth >= 0 ? "+" : ""}
                    {mauGrowth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Timeline */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Registration Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-blue-400" />
                  <p>
                    Stacked area chart: Clients, Workers, Agencies over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retention Cohort Analysis */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Retention Cohort Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">
                        Cohort
                      </th>
                      <th className="text-center p-3 font-medium text-gray-700">
                        Day 1
                      </th>
                      <th className="text-center p-3 font-medium text-gray-700">
                        Day 7
                      </th>
                      <th className="text-center p-3 font-medium text-gray-700">
                        Day 30
                      </th>
                      <th className="text-center p-3 font-medium text-gray-700">
                        Day 90
                      </th>
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
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{cohort.month}</td>
                        <td className="text-center p-3">
                          <div
                            className={`inline-block px-3 py-1 rounded ${cohort.d1 >= 90 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                          >
                            {cohort.d1}%
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <div
                            className={`inline-block px-3 py-1 rounded ${cohort.d7 >= 70 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                          >
                            {cohort.d7}%
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <div
                            className={`inline-block px-3 py-1 rounded ${cohort.d30 >= 50 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {cohort.d30}%
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <div
                            className={`inline-block px-3 py-1 rounded ${cohort.d90 >= 40 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
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
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>User Demographics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                      "bg-blue-500",
                      "bg-green-500",
                      "bg-purple-500",
                      "bg-orange-500",
                    ];
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">
                            {demo.age_range}
                          </span>
                          <span className="text-sm font-medium">
                            {formatNumber(demo.count)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[i % colors.length]} rounded-full`}
                            style={{ width: `${demo.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span>Top 10 Cities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 w-6">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {city.city}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatNumber(city.users)} users
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{city.percentage}%</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Churn Analysis */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Churn Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-orange-50 rounded-xl">
                  <p className="text-4xl font-bold text-orange-600 mb-2">
                    {churnRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Monthly Churn Rate</p>
                  <Badge
                    className={`mt-2 ${churnRate < 5 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {churnRate < 5 ? "Below 5% target" : "Above target"}
                  </Badge>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-xl">
                  <p className="text-4xl font-bold text-red-600 mb-2">
                    {formatNumber(atRiskUsers)}
                  </p>
                  <p className="text-sm text-gray-600">At-Risk Users</p>
                  <Badge className="mt-2 bg-red-100 text-red-700">
                    Inactive 30+ days
                  </Badge>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <p className="text-4xl font-bold text-blue-600 mb-2">
                    {retentionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Retention Rate</p>
                  <Badge
                    className={`mt-2 ${retentionRate >= 90 ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {retentionRate >= 90 ? "Excellent" : "Needs improvement"}
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
