"use client";

import { Sidebar } from "../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  Building2,
  FileCheck,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  // Mock statistics data
  const stats = {
    totalUsers: 1247,
    totalClients: 542,
    totalWorkers: 628,
    totalAgencies: 77,
    activeJobs: 156,
    completedJobs: 2341,
    totalRevenue: 487250,
    monthlyRevenue: 52430,
    pendingPayments: 23,
    pendingKYC: 18,
    activeUsers: 892,
    newUsersThisMonth: 127,
  };

  const recentActivity = [
    {
      id: 1,
      type: "job_completed",
      description: "House Cleaning Service completed",
      user: "Maria Garcia",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "payment",
      description: "Payment of $480 processed",
      user: "Thomas Garcia",
      time: "3 hours ago",
    },
    {
      id: 3,
      type: "new_user",
      description: "New worker registered",
      user: "Steven Clark",
      time: "5 hours ago",
    },
    {
      id: 4,
      type: "kyc_submitted",
      description: "KYC verification submitted",
      user: "Jennifer Taylor",
      time: "6 hours ago",
    },
    {
      id: 5,
      type: "job_posted",
      description: "New job posted: Electrical Panel Upgrade",
      user: "William Davis",
      time: "8 hours ago",
    },
  ];

  const pendingActions = [
    { id: 1, action: "KYC Verifications", count: 18, link: "/admin/kyc" },
    {
      id: 2,
      action: "Pending Payments",
      count: 23,
      link: "/admin/payments/pending",
    },
    {
      id: 3,
      action: "Dispute Resolution",
      count: 7,
      link: "/admin/jobs/disputes",
    },
    { id: 4, action: "User Reports", count: 12, link: "/admin/reviews" },
  ];

  const topCategories = [
    { name: "Home Cleaning", jobs: 342, revenue: 45230 },
    { name: "Plumbing", jobs: 289, revenue: 67840 },
    { name: "Electrical", jobs: 256, revenue: 89120 },
    { name: "Carpentry", jobs: 198, revenue: 125400 },
    { name: "HVAC", jobs: 167, revenue: 52340 },
  ];

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
            <Card className="hover:shadow-lg transition-shadow">
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
            <Card className="hover:shadow-lg transition-shadow">
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
            <Card className="hover:shadow-lg transition-shadow">
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
            <Card className="hover:shadow-lg transition-shadow">
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
            <Link href="/admin/users/clients">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Active job posters
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users/workers">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Service providers
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users/agency">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
            </Link>
          </div>

          {/* Pending Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Pending Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingActions.map((item) => (
                    <Link key={item.id} href={item.link}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">
                          {item.action}
                        </span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                          {item.count}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          activity.type === "job_completed"
                            ? "bg-green-100"
                            : activity.type === "payment"
                              ? "bg-blue-100"
                              : activity.type === "new_user"
                                ? "bg-purple-100"
                                : "bg-orange-100"
                        }`}
                      >
                        {activity.type === "job_completed" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : activity.type === "payment" ? (
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        ) : activity.type === "new_user" ? (
                          <Users className="h-4 w-4 text-purple-600" />
                        ) : (
                          <FileCheck className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top Service Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.map((category, index) => (
                  <div key={category.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {category.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {category.jobs} jobs
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ${category.revenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">revenue</p>
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

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Link href="/admin/jobs/listings">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                <CardContent className="pt-6">
                  <Briefcase className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="font-semibold text-gray-900">Job Listings</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/payments/pending">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="font-semibold text-gray-900">Payments</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/kyc">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                <CardContent className="pt-6">
                  <FileCheck className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <p className="font-semibold text-gray-900">
                    KYC Verification
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/reviews">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                <CardContent className="pt-6">
                  <AlertCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                  <p className="font-semibold text-gray-900">
                    Reviews & Reports
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
