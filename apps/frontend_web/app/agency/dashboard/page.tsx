"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/form_button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Briefcase, Star, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AgencyStats {
  total_employees: number;
  avg_employee_rating: number | null;
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
}

export default function AgencyDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AgencyStats | null>(null);
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

  // Fetch stats on mount - auth is handled by layout
  useEffect(() => {
    const controller = new AbortController();
    fetchStats();
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
              <CardHeader>
                <CardTitle>Recent Worker Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  No recent activity to show (mock).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">No pending jobs (mock).</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
