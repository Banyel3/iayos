"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Briefcase,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react";
import Link from "next/link";

interface JobStats {
  total_jobs: number;
  active_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  cancelled_jobs: number;
  total_applications: number;
  pending_applications: number;
  accepted_applications: number;
  total_budget: number;
  avg_budget: number;
  completion_rate: number;
}

export default function JobsManagementPage() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/adminpanel/jobs/dashboard-stats",
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching jobs stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading jobs statistics...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const recentActivity = [
    {
      id: 1,
      type: "new_job",
      message: "New job posted: Plumbing Repair",
      time: "5 minutes ago",
      user: "Sarah Wilson",
    },
    {
      id: 2,
      type: "application",
      message: "New application for Electrical Installation",
      time: "12 minutes ago",
      user: "Mike Thompson",
    },
    {
      id: 3,
      type: "completed",
      message: "Job completed: Home Cleaning",
      time: "1 hour ago",
      user: "Emma Davis",
    },
    {
      id: 4,
      type: "dispute",
      message: "Dispute opened for Painting Service",
      time: "2 hours ago",
      user: "John Martinez",
    },
  ];

  const topCategories = [
    { name: "Home Cleaning", count: 58, revenue: 24500 },
    { name: "Plumbing", count: 42, revenue: 31200 },
    { name: "Electrical", count: 38, revenue: 28900 },
    { name: "Painting", count: 35, revenue: 18700 },
    { name: "Carpentry", count: 29, revenue: 22400 },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Jobs Management
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage all job-related activities
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Jobs
                </CardTitle>
                <Briefcase className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.total_jobs || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  All time posted jobs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Progress
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.in_progress_jobs || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Currently in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Jobs
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.completed_jobs || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Successfully finished
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Applications
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.pending_applications || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">Awaiting review</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">
                  Total Budget
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  ₱{(stats?.total_budget || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900">
                  Avg Job Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  ₱{(stats?.avg_budget || 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-900">
                  Completion Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {stats?.completion_rate || 0}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-900">
                  Active Listings
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats?.active_jobs || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Link href="/admin/jobs/listings">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
                <CardHeader>
                  <ClipboardList className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle className="text-lg">Job Listings</CardTitle>
                  <CardDescription>View all posted jobs</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/jobs/applications">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
                <CardHeader>
                  <Users className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">Applications</CardTitle>
                  <CardDescription>Track job applications</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/jobs/active">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-500">
                <CardHeader>
                  <Clock className="h-8 w-8 text-orange-600 mb-2" />
                  <CardTitle className="text-lg">Active Jobs</CardTitle>
                  <CardDescription>Monitor ongoing work</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/jobs/completed">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
                <CardHeader>
                  <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">Completed</CardTitle>
                  <CardDescription>View finished jobs</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/jobs/disputes">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-red-500">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
                  <CardTitle className="text-lg">Disputes</CardTitle>
                  <CardDescription>Resolve conflicts</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest job-related events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 pb-3 border-b last:border-b-0"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          activity.type === "new_job"
                            ? "bg-blue-100"
                            : activity.type === "application"
                              ? "bg-purple-100"
                              : activity.type === "completed"
                                ? "bg-green-100"
                                : "bg-red-100"
                        }`}
                      >
                        {activity.type === "new_job" && (
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        )}
                        {activity.type === "application" && (
                          <ClipboardList className="h-4 w-4 text-purple-600" />
                        )}
                        {activity.type === "completed" && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {activity.type === "dispute" && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-600">
                          by {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Job Categories</CardTitle>
                <CardDescription>
                  Most popular service categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {category.name}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {category.count} jobs
                          </span>
                          <span className="text-xs text-gray-600 ml-2">
                            ${category.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(category.count / 60) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
