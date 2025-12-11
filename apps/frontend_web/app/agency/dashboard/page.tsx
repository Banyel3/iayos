"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/form_button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Briefcase,
  Star,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface AgencyStats {
  total_employees: number;
  avg_employee_rating: number | null;
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
}

interface RecentJob {
  id: string;
  title: string;
  status: string;
  inviteStatus: string;
  budget: number;
  updatedAt: string;
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
}

export default function AgencyDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentJob[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/profile`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.statistics);
      } else {
        toast.error("Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent jobs (IN_PROGRESS or recently updated)
      const res = await fetch(
        `${API_BASE}/api/agency/jobs?status=IN_PROGRESS&limit=5`,
        {
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        const jobs = data.jobs || [];
        setRecentActivity(
          jobs.map((job: any) => ({
            id: job.jobID,
            title: job.title,
            status: job.status,
            inviteStatus: job.inviteStatus,
            budget: job.budget,
            updatedAt: job.updatedAt,
            assignedEmployeeId: job.assignedEmployee?.employeeId,
            assignedEmployeeName: job.assignedEmployee?.name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const fetchPendingAssignments = async () => {
    try {
      // Fetch accepted jobs that need employee assignment
      // Filter by status=ACTIVE to exclude COMPLETED/CANCELLED jobs
      const res = await fetch(
        `${API_BASE}/api/agency/jobs?invite_status=ACCEPTED&status=ACTIVE&limit=10`,
        {
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        const jobs = data.jobs || [];
        // Filter to only show unassigned jobs (jobs without an assigned employee)
        // Backend returns assignedEmployee in camelCase
        const unassigned = jobs.filter(
          (job: any) => !job.assignedEmployee && !job.assignedEmployeeID
        );
        setPendingAssignments(
          unassigned.slice(0, 5).map((job: any) => ({
            id: job.jobID,
            title: job.title,
            status: job.status,
            inviteStatus: job.inviteStatus,
            budget: job.budget,
            updatedAt: job.updatedAt,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching pending assignments:", error);
    }
  };

  // Fetch stats on mount - auth is handled by layout
  useEffect(() => {
    const controller = new AbortController();
    fetchStats();
    fetchRecentActivity();
    fetchPendingAssignments();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Agency Dashboard</h1>
          <p className="text-muted-foreground mb-6">
            Loading your statistics...
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex items-center justify-between pb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Agency Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Simplified control panel focused on worker management and operations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">
                Total Employees
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_employees}</div>
              <p className="text-sm text-gray-500 mt-1">
                Active agency employees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">
                Average Rating
              </CardTitle>
              <Star className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.avg_employee_rating?.toFixed(1) || "N/A"}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Employee average rating
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">
                Active Jobs
              </CardTitle>
              <Briefcase className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.active_jobs}</div>
              <p className="text-sm text-gray-500 mt-1">
                Jobs currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">
                Completed Jobs
              </CardTitle>
              <Briefcase className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completed_jobs}</div>
              <p className="text-sm text-gray-500 mt-1">
                Total of {stats.total_jobs} jobs
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Operations</h2>
              <p className="text-sm text-gray-600">Quick actions and status</p>
            </div>
            <div className="space-x-2">
              <Button onClick={() => router.push("/agency/employees")}>
                Manage Employees
              </Button>
              <Button onClick={() => router.push("/agency/jobs")}>
                Jobs & Assignments
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Worker Activity</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/agency/jobs/active")}
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                        onClick={() =>
                          router.push(`/agency/jobs/active/${job.id}`)
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {job.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {job.assignedEmployeeName ? (
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {job.assignedEmployeeName}
                              </span>
                            ) : (
                              <span className="text-xs text-orange-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Unassigned
                              </span>
                            )}
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(job.updatedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="default"
                          className="bg-green-500 text-xs"
                        >
                          In Progress
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No active jobs in progress</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Assignments</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/agency/jobs")}
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {pendingAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {pendingAssignments.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 cursor-pointer transition border border-orange-200"
                        onClick={() => router.push(`/agency/jobs`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {job.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-green-600 font-medium">
                              ₱{job.budget.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-orange-600 font-medium">
                              Needs employee assignment
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
                    <p className="text-sm">All jobs have been assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
