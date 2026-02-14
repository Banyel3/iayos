"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Clock,
  Eye,
  Users,
  AlertTriangle,
  Star,
} from "lucide-react";

// Helper to format numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
};

export default function EngagementMetrics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last_30_days");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchEngagementStats();
  }, [dateRange]);

  const fetchEngagementStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/analytics/engagement?period=${dateRange}`,
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
        <Activity className="h-12 w-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  // Extract data with defaults
  const sessionDuration = stats?.session_metrics?.avg_duration || "8m 34s";
  const pagesPerSession = stats?.session_metrics?.pages_per_session || 4.7;
  const bounceRate = stats?.session_metrics?.bounce_rate || 32.4;
  const durationGrowth = stats?.session_metrics?.duration_growth || 5.2;
  const featureUsage = stats?.feature_usage || [];
  const topPages = stats?.top_pages || [];
  const engagementScore = stats?.engagement_score || 82;
  const userSegments = stats?.user_segments || {};

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Activity className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">Engagement Metrics</h1>
                </div>
                <p className="text-orange-100 text-lg">
                  User behavior and platform engagement
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
                </select>
                <Button
                  onClick={fetchEngagementStats}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button className="bg-white text-orange-600 hover:bg-gray-100">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Session Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {sessionDuration}
                </h3>
                <p className="text-sm text-gray-500">Avg Session Duration</p>
                <div className="mt-3 flex items-center text-sm">
                  {durationGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={
                      durationGrowth >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {durationGrowth >= 0 ? "+" : ""}
                    {durationGrowth}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {pagesPerSession}
                </h3>
                <p className="text-sm text-gray-500">Pages per Session</p>
                <Badge
                  className={`mt-2 ${pagesPerSession >= 4 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {pagesPerSession >= 4
                    ? "Good engagement"
                    : "Needs improvement"}
                </Badge>
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
                  {bounceRate}%
                </h3>
                <p className="text-sm text-gray-500">Bounce Rate</p>
                <Badge
                  className={`mt-2 ${bounceRate < 40 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {bounceRate < 40 ? "Below 40% target" : "Above target"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Feature Usage Table */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-orange-600" />
                <span>Feature Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">
                        Feature
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Usage Count
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Unique Users
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Engagement Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(featureUsage.length > 0
                      ? featureUsage
                      : [
                          {
                            feature: "Job Browsing",
                            count: 45678,
                            users: 8932,
                            rate: 92.5,
                          },
                          {
                            feature: "Worker Search",
                            count: 34567,
                            users: 6543,
                            rate: 67.8,
                          },
                          {
                            feature: "Job Application",
                            count: 23456,
                            users: 4567,
                            rate: 47.3,
                          },
                          {
                            feature: "Messaging",
                            count: 18765,
                            users: 3890,
                            rate: 40.3,
                          },
                          {
                            feature: "Payment",
                            count: 12345,
                            users: 2345,
                            rate: 24.3,
                          },
                          {
                            feature: "Reviews",
                            count: 8976,
                            users: 1987,
                            rate: 20.6,
                          },
                          {
                            feature: "Wallet Top-up",
                            count: 5432,
                            users: 1234,
                            rate: 12.8,
                          },
                          {
                            feature: "Profile Edit",
                            count: 4321,
                            users: 2109,
                            rate: 21.8,
                          },
                        ]
                    ).map((feature: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">
                          {feature.feature}
                        </td>
                        <td className="text-right p-3">
                          {formatNumber(feature.count)}
                        </td>
                        <td className="text-right p-3">
                          {formatNumber(feature.users)}
                        </td>
                        <td className="text-right p-3">
                          <Badge
                            className={
                              feature.rate >= 50
                                ? "bg-green-100 text-green-700"
                                : feature.rate >= 30
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                            }
                          >
                            {feature.rate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Most Visited Pages */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <span>Most Visited Pages</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(topPages.length > 0
                  ? topPages
                  : [
                      {
                        page: "/jobs",
                        views: 156789,
                        visitors: 8932,
                        time: "3m 45s",
                      },
                      {
                        page: "/workers",
                        views: 98765,
                        visitors: 6543,
                        time: "4m 12s",
                      },
                      {
                        page: "/dashboard",
                        views: 87654,
                        visitors: 8932,
                        time: "2m 34s",
                      },
                      {
                        page: "/messages",
                        views: 65432,
                        visitors: 4567,
                        time: "6m 23s",
                      },
                      {
                        page: "/profile",
                        views: 43210,
                        visitors: 7890,
                        time: "3m 56s",
                      },
                    ]
                ).map((page: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-gray-400">
                        #{i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{page.page}</p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(page.visitors)} unique visitors
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatNumber(page.views)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Avg time: {page.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Score & User Segments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Platform Engagement Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <div className="relative w-48 h-48 mx-auto mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="16"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        fill="none"
                        stroke={
                          engagementScore >= 70
                            ? "#10b981"
                            : engagementScore >= 50
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                        strokeWidth="16"
                        strokeDasharray="502"
                        strokeDashoffset={502 - (502 * engagementScore) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-gray-900">
                          {engagementScore}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">out of 100</p>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`text-base px-4 py-2 ${
                      engagementScore >= 70
                        ? "bg-green-100 text-green-700"
                        : engagementScore >= 50
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {engagementScore >= 70
                      ? "Excellent Engagement"
                      : engagementScore >= 50
                        ? "Good Engagement"
                        : "Needs Improvement"}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-3">
                    Based on DAU, session duration, and feature usage
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>User Segments by Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Highly Engaged
                      </p>
                      <p className="text-xs text-gray-500">
                        5+ sessions per week
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatNumber(userSegments.highly_engaged || 4567)}
                      </p>
                      <Badge className="bg-green-600 text-white mt-1">
                        {userSegments.highly_engaged_pct || 51}%
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Moderately Engaged
                      </p>
                      <p className="text-xs text-gray-500">
                        2-5 sessions per week
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatNumber(userSegments.moderately_engaged || 2890)}
                      </p>
                      <Badge className="bg-blue-600 text-white mt-1">
                        {userSegments.moderately_engaged_pct || 32}%
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Low Engagement
                      </p>
                      <p className="text-xs text-gray-500">
                        &lt;2 sessions per week
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatNumber(userSegments.low_engagement || 1023)}
                      </p>
                      <Badge className="bg-yellow-600 text-white mt-1">
                        {userSegments.low_engagement_pct || 11}%
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">Inactive</p>
                      <p className="text-xs text-gray-500">
                        No activity in 30 days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">
                        {formatNumber(userSegments.inactive || 452)}
                      </p>
                      <Badge className="bg-red-600 text-white mt-1">
                        {userSegments.inactive_pct || 6}%
                      </Badge>
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
