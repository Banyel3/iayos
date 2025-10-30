"use client";

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

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Users
                </CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.total_users.toLocaleString()}
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {stats.new_users_this_month} this month
                </p>
              </CardContent>
            </Card>

            {/* Active Jobs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Job Postings
                </CardTitle>
                <Briefcase className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.active_jobs}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {stats.in_progress_jobs} in progress
                </p>
              </CardContent>
            </Card>

            {/* Pending KYC */}
            <Card>
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
                <p className="text-xs text-gray-600 mt-2">
                  {stats.pending_individual_kyc} individual,{" "}
                  {stats.pending_agency_kyc} agency
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
                  {stats.active_users}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {((stats.active_users / stats.total_users) * 100).toFixed(1)}%
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
                  {stats.total_clients}
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
                  {stats.total_workers}
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
                  {stats.total_agencies}
                </div>
                <p className="text-xs text-gray-500 mt-1">Service agencies</p>
              </CardContent>
            </Card>
          </div>

          {/* Job Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Job Postings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total_jobs}
                </div>
                <p className="text-xs text-gray-500 mt-1">All job postings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.in_progress_jobs}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Currently being worked on
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completed_jobs}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Successfully finished
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Cancelled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.cancelled_jobs}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cancelled by clients
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/admin/kyc" className="block">
                  <div className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          KYC Verifications
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {stats.pending_kyc} pending
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>
                </Link>

                <Link href="/admin/users" className="block">
                  <div className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Manage Users
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {stats.total_users} total users
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </Link>

                <Link href="/admin/jobs" className="block">
                  <div className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Job Management
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {stats.active_jobs} active jobs
                        </p>
                      </div>
                      <Briefcase className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </Link>

                <Link href="/admin/reviews" className="block">
                  <div className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Reviews & Reports
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          View all reviews
                        </p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-purple-600" />
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
