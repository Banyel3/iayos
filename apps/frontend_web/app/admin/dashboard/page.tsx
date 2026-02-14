"use client";

import { API_BASE } from "@/lib/api/config";
import { useState, useEffect } from "react";
import { Sidebar } from "../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  TrendingUp,
  UserCheck,
  Building2,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface DashboardStats {
  total_users: number;
  total_clients: number;
  total_workers: number;
  total_agencies: number;
  active_users: number;
  new_users_this_month: number;
  pending_kyc: number;
  pending_individual_kyc: number;
  pending_agency_kyc: number;
  total_jobs: number;
  active_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  cancelled_jobs: number;
  open_jobs: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/adminpanel/dashboard/stats`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      } else {
        toast.error("Failed to fetch dashboard statistics");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchStats();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Admin Dashboard
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <p className="text-red-600">Failed to load dashboard data</p>
          </div>
        </main>
      </div>
    );
  }
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
            <Link href="/admin/users">
              <Card className="cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Users
                  </CardTitle>
                  <Users className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {(stats.total_users ?? 0).toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />+
                      {stats.new_users_this_month} this month
                    </p>
                    <p className="text-xs text-gray-500">
                      {((stats.active_users / stats.total_users) * 100).toFixed(
                        0,
                      )}
                      % active
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Active Jobs */}
            <Link href="/admin/jobs">
              <Card className="cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Jobs
                  </CardTitle>
                  <Briefcase className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {(stats.total_jobs ?? 0).toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-blue-600">
                      {stats.active_jobs} active
                    </p>
                    <p className="text-xs text-green-600">
                      {stats.completed_jobs} completed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Pending KYC */}
            <Link href="/admin/kyc/pending">
              <Card className="cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Pending KYC
                  </CardTitle>
                  <FileText className="h-5 w-5 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.pending_kyc}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-600">
                      {stats.pending_individual_kyc} individual
                    </p>
                    <p className="text-xs text-gray-600">
                      {stats.pending_agency_kyc} agency
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Completion Rate */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-purple-900">
                  Job Completion Rate
                </CardTitle>
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">
                  {stats.total_jobs > 0
                    ? ((stats.completed_jobs / stats.total_jobs) * 100).toFixed(
                        1,
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-purple-700 mt-2">
                  {stats.completed_jobs} of {stats.total_jobs} jobs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Platform Health Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Platform Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Job Status Breakdown */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Active Jobs
                    </span>
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.active_jobs}
                  </div>
                  <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${stats.total_jobs > 0 ? (stats.active_jobs / stats.total_jobs) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-900">
                      In Progress
                    </span>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-amber-900">
                    {stats.in_progress_jobs}
                  </div>
                  <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600 rounded-full"
                      style={{
                        width: `${stats.total_jobs > 0 ? (stats.in_progress_jobs / stats.total_jobs) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">
                      Completed
                    </span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {stats.completed_jobs}
                  </div>
                  <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{
                        width: `${stats.total_jobs > 0 ? (stats.completed_jobs / stats.total_jobs) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-900">
                      Cancelled
                    </span>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {stats.cancelled_jobs}
                  </div>
                  <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{
                        width: `${stats.total_jobs > 0 ? (stats.cancelled_jobs / stats.total_jobs) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Clients */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Clients
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {(stats.total_clients ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{
                          width: `${stats.total_users > 0 ? (stats.total_clients / stats.total_users) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {stats.total_users > 0
                        ? (
                            (stats.total_clients / stats.total_users) *
                            100
                          ).toFixed(1)
                        : 0}
                      % of total users
                    </span>
                  </div>

                  {/* Workers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Workers
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {(stats.total_workers ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{
                          width: `${stats.total_users > 0 ? (stats.total_workers / stats.total_users) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {stats.total_users > 0
                        ? (
                            (stats.total_workers / stats.total_users) *
                            100
                          ).toFixed(1)
                        : 0}
                      % of total users
                    </span>
                  </div>

                  {/* Agencies */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Agencies
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        {(stats.total_agencies ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{
                          width: `${stats.total_users > 0 ? (stats.total_agencies / stats.total_users) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {stats.total_users > 0
                        ? (
                            (stats.total_agencies / stats.total_users) *
                            100
                          ).toFixed(1)
                        : 0}
                      % of total users
                    </span>
                  </div>

                  {/* Active Users */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <UserCheck className="h-4 w-4 mr-1 text-emerald-600" />
                        Verified Active
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {(stats.active_users ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{
                          width: `${stats.total_users > 0 ? (stats.active_users / stats.total_users) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {stats.total_users > 0
                        ? (
                            (stats.active_users / stats.total_users) *
                            100
                          ).toFixed(1)
                        : 0}
                      % verification rate
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KYC Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-yellow-600" />
                  KYC Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Individual KYC */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Individual Verification
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                          <span className="text-sm text-gray-600">Pending</span>
                        </div>
                        <span className="text-sm font-bold text-yellow-600">
                          {stats.pending_individual_kyc}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Agency Verification
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                          <span className="text-sm text-gray-600">Pending</span>
                        </div>
                        <span className="text-sm font-bold text-yellow-600">
                          {stats.pending_agency_kyc}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total Pending Summary */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-900">
                          Total Awaiting Review
                        </span>
                      </div>
                      <span className="text-xl font-bold text-yellow-900">
                        {stats.pending_kyc}
                      </span>
                    </div>
                    <Link
                      href="/admin/kyc/pending"
                      className="text-xs text-yellow-700 hover:text-yellow-900 mt-2 inline-flex items-center"
                    >
                      Review pending submissions →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Statistics - Removed (now in Platform Health Overview) */}

          {/* Quick Actions & Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Key Performance Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Verification Rate */}
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-900">
                    {stats.total_users > 0
                      ? (
                          (stats.active_users / stats.total_users) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-blue-700 mt-2 font-medium">
                    Verification Rate
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {stats.active_users} of {stats.total_users} users
                  </div>
                </div>

                {/* Job Success Rate */}
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-900">
                    {stats.total_jobs > 0
                      ? (
                          (stats.completed_jobs / stats.total_jobs) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-green-700 mt-2 font-medium">
                    Job Success Rate
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {stats.completed_jobs} of {stats.total_jobs} jobs
                  </div>
                </div>

                {/* Cancellation Rate */}
                <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                  <div className="text-3xl font-bold text-red-900">
                    {stats.total_jobs > 0
                      ? (
                          (stats.cancelled_jobs / stats.total_jobs) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-red-700 mt-2 font-medium">
                    Cancellation Rate
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {stats.cancelled_jobs} cancelled
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/admin/kyc/pending" className="block">
                  <div className="p-4 border rounded-lg cursor-pointer bg-yellow-50 border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Review Pending KYC
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {stats.pending_kyc} submissions awaiting verification
                        </p>
                      </div>
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </Link>

                <Link href="/admin/jobs" className="block">
                  <div className="p-4 border rounded-lg cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Manage Job Postings
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {stats.active_jobs} active jobs across platform
                        </p>
                      </div>
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </Link>

                <Link href="/admin/users" className="block">
                  <div className="p-4 border rounded-lg cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          User Management
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          View and manage all platform users
                        </p>
                      </div>
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </Link>

                <Link href="/admin/reports" className="block">
                  <div className="p-4 border rounded-lg cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Platform Reports
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          View detailed analytics and reports
                        </p>
                      </div>
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
