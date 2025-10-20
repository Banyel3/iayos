"use client";

import { Sidebar } from "../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  UserCheck,
  Building2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { getAdminStats, mockApplications, mockJobListings } from "@/lib/mockData";

export default function AdminDashboardPage() {
  // Get actual statistics from mock data
  const adminStats = getAdminStats();

  const stats = {
    totalUsers: adminStats.totalUsers,
    totalClients: adminStats.totalClients,
    totalWorkers: adminStats.totalWorkers,
    totalAgencies: adminStats.totalAgencies,
    activeJobs: adminStats.activeJobs,
    completedJobs: adminStats.completedJobs,
    totalRevenue: adminStats.totalRevenue,
    monthlyRevenue: adminStats.monthlyRevenue,
    totalJobListings: adminStats.totalJobListings,
    openJobs: adminStats.openJobs,
    totalApplications: adminStats.totalApplications,
    pendingApplications: adminStats.pendingApplications,
    pendingPayments: 23, // Keep this as is (not in mock data yet)
    pendingKYC: 18, // Keep this as is (not in mock data yet)
    activeUsers: adminStats.activeUsers,
    newUsersThisMonth: 8, // Estimate based on mock data
  };

  // topCategories will be calculated from job listings below

  // AI-powered prediction data (mock for future feature)
  const trendingPredictions = [
    {
      id: 1,
      category: "Home Cleaning",
      currentDemand: 1,
      predictedDemand: 3,
      trend: "up",
      confidence: 87,
      change: "+200%",
    },
    {
      id: 2,
      category: "Plumbing",
      currentDemand: 1,
      predictedDemand: 2,
      trend: "up",
      confidence: 82,
      change: "+100%",
    },
    {
      id: 3,
      category: "HVAC",
      currentDemand: 1,
      predictedDemand: 2,
      trend: "up",
      confidence: 91,
      change: "+100%",
    },
    {
      id: 4,
      category: "Electrical",
      currentDemand: 2,
      predictedDemand: 3,
      trend: "up",
      confidence: 78,
      change: "+50%",
    },
    {
      id: 5,
      category: "Carpentry",
      currentDemand: 2,
      predictedDemand: 2,
      trend: "stable",
      confidence: 75,
      change: "0%",
    },
  ];

  const pendingActions = [
    {
      id: 1,
      action: "KYC Verifications",
      count: stats.pendingKYC,
      link: "/admin/kyc",
    },
    {
      id: 2,
      action: "Pending Payments",
      count: stats.pendingPayments,
      link: "/admin/payments/pending",
    },
    {
      id: 3,
      action: "Pending Applications",
      count: adminStats.pendingApplications,
      link: "/admin/jobs/applications",
    },
    { id: 4, action: "User Reports", count: 12, link: "/admin/reviews" },
  ];

  // Calculate top categories from actual job listings
  const categoryStats = mockJobListings.reduce(
    (acc, job) => {
      if (!acc[job.category]) {
        acc[job.category] = { jobs: 0, revenue: 0 };
      }
      acc[job.category].jobs += 1;
      acc[job.category].revenue += job.budget;
      return acc;
    },
    {} as Record<string, { jobs: number; revenue: number }>
  );

  const topCategories = Object.entries(categoryStats)
    .map(([name, stats]) => ({
      name,
      jobs: stats.jobs,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Overview of platform statistics and recent activity
            </p>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Users
                </CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {stats.newUsersThisMonth} this month
                </p>
              </CardContent>
            </Card>

            {/* Active Jobs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Jobs
                </CardTitle>
                <Briefcase className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.activeJobs}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {stats.completedJobs.toLocaleString()} completed
                </p>
              </CardContent>
            </Card>

            {/* Monthly Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Monthly Revenue
                </CardTitle>
                <DollarSign className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  ${stats.monthlyRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ${stats.totalRevenue.toLocaleString()} total
                </p>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Users
                </CardTitle>
                <UserCheck className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.activeUsers}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
                  of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Clients
                </CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalClients}
                </div>
                <p className="text-xs text-gray-500 mt-1">Active job posters</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Workers
                </CardTitle>
                <Briefcase className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalWorkers}
                </div>
                <p className="text-xs text-gray-500 mt-1">Service providers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Agencies
                </CardTitle>
                <Building2 className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalAgencies}
                </div>
                <p className="text-xs text-gray-500 mt-1">Service agencies</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top Service Categories
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Performance metrics and trends across service categories
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.map((category, index) => (
                  <div key={category.name}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                          <span className="text-xl font-bold text-blue-600">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-semibold text-gray-900 text-lg">
                              {category.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              <span className="font-medium">{category.jobs}</span>{" "}
                              total jobs
                            </span>
                            <span>•</span>
                            <span>
                              <span className="font-medium">{category.revenue.toLocaleString()}</span>{" "}
                              revenue
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <p className="text-2xl font-bold text-green-600">
                          ${category.revenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">total revenue</p>
                      </div>
                    </div>
                    {index < topCategories.length - 1 && (
                      <div className="border-b border-gray-100 mt-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI-Powered Trending Jobs Prediction */}
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    AI-Powered Job Demand Forecast
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Machine learning predictions for upcoming job demand trends
                    over the next 7 days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">
                    Next 7 Days
                  </p>
                  <p className="text-xs text-gray-500">Prediction Period</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingPredictions.map((prediction) => (
                  <div
                    key={prediction.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full ${
                          prediction.trend === "up"
                            ? "bg-green-100"
                            : prediction.trend === "down"
                              ? "bg-red-100"
                              : "bg-gray-100"
                        }`}
                      >
                        {prediction.trend === "up" ? (
                          <ArrowUpRight className="h-6 w-6 text-green-600" />
                        ) : prediction.trend === "down" ? (
                          <ArrowDownRight className="h-6 w-6 text-red-600" />
                        ) : (
                          <Minus className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold text-gray-900 text-lg">
                            {prediction.category}
                          </p>
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${
                              prediction.trend === "up"
                                ? "bg-green-100 text-green-700"
                                : prediction.trend === "down"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {prediction.change}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Current:{" "}
                            <span className="font-medium text-gray-900">
                              {prediction.currentDemand}
                            </span>{" "}
                            jobs
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-600">
                            Predicted:{" "}
                            <span className="font-bold text-blue-600">
                              {prediction.predictedDemand}
                            </span>{" "}
                            jobs
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <div className="w-24 bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              prediction.confidence >= 85
                                ? "bg-green-500"
                                : prediction.confidence >= 75
                                  ? "bg-blue-500"
                                  : "bg-yellow-500"
                            }`}
                            style={{ width: `${prediction.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-12">
                          {prediction.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {prediction.confidence >= 85
                          ? "High"
                          : prediction.confidence >= 75
                            ? "Good"
                            : "Moderate"}{" "}
                        confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      AI-Powered Insights
                    </p>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Our machine learning model analyzes historical job
                      patterns, seasonal trends, market indicators, and
                      real-time platform activity to predict upcoming demand.
                      Use these insights to optimize resource allocation and
                      prepare for high-demand periods.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
