"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
} from "lucide-react";
import { Sidebar } from "../../components";

export default function AnalyticsOverviewPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Analytics Overview
            </h1>
            <p className="text-muted-foreground">
              Platform performance and key metrics
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,543</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Jobs
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">186</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+8.2%</span> from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱1,245,680</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+23.1%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Platform Growth
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+18.2%</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Steady growth</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Last 7 days overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">New Registrations</span>
                    </div>
                    <span className="font-semibold">142</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Active Users</span>
                    </div>
                    <span className="font-semibold">1,856</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Avg. Session Time</span>
                    </div>
                    <span className="font-semibold">12m 34s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Activity</CardTitle>
                <CardDescription>Current job status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Pending Jobs</span>
                    </div>
                    <span className="font-semibold">54</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Active Jobs</span>
                    </div>
                    <span className="font-semibold">186</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Completed This Week</span>
                    </div>
                    <span className="font-semibold">312</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Job Completion Rate
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">94.2%</div>
                    <span className="text-xs text-green-600 flex items-center">
                      <ArrowUp className="h-3 w-3" />
                      +2.1%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 w-[94%]"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Average Response Time
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">2.4h</div>
                    <span className="text-xs text-green-600 flex items-center">
                      <ArrowDown className="h-3 w-3" />
                      -0.3h
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[76%]"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Customer Satisfaction
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">4.8/5</div>
                    <span className="text-xs text-green-600 flex items-center">
                      <ArrowUp className="h-3 w-3" />
                      +0.2
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-[96%]"></div>
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
