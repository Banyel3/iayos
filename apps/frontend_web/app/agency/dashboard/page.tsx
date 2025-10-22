"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/form_button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAgencyStats } from "@/lib/mockData";
import { Building2, UserCheck, Briefcase, Star } from "lucide-react";

export default function AgencyDashboardPage() {
  const router = useRouter();
  const stats = getAgencyStats();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Agency Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Simplified control panel focused on worker management and operations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">
                Total Workers
              </CardTitle>
              <UserCheck className="h-5 w-5 text-blue-600 agency-verified:text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalWorkers}</div>
              <p className="text-sm text-gray-500 mt-1">
                Active agency employees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">
                Active Jobs
              </CardTitle>
              <Briefcase className="h-5 w-5 text-blue-600 agency-verified:text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeJobs}</div>
              <p className="text-sm text-gray-500 mt-1">
                Jobs currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">
                Average Rating
              </CardTitle>
              <Star className="h-5 w-5 text-blue-600 agency-verified:text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgRating}</div>
              <p className="text-sm text-gray-500 mt-1">
                Based on {stats.reviewCount} reviews
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
