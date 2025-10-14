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
  UserCheck,
  UserX,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react";
import { Sidebar } from "../../components";

export default function UserAnalyticsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              User Analytics
            </h1>
            <p className="text-muted-foreground">
              User behavior and trends across the platform
            </p>
          </div>

          {/* User Stats */}
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
                <p className="text-xs text-muted-foreground">All registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workers</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,245</div>
                <p className="text-xs text-muted-foreground">49% of total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,298</div>
                <p className="text-xs text-muted-foreground">51% of total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">892</div>
                <p className="text-xs text-muted-foreground">35% activity rate</p>
              </CardContent>
            </Card>
          </div>

          {/* User Growth */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trends</CardTitle>
              <CardDescription>New user registrations over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">This Week</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">142 new users</span>
                    <span className="text-xs text-green-600">+18%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">This Month</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">589 new users</span>
                    <span className="text-xs text-green-600">+24%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">This Year</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">2,543 total users</span>
                    <span className="text-xs text-green-600">+156%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Engagement */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Activity patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Daily Active Users</span>
                      <span className="font-semibold">892</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-[35%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Weekly Active Users</span>
                      <span className="font-semibold">1,654</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 w-[65%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Monthly Active Users</span>
                      <span className="font-semibold">2,134</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 w-[84%]"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
                <CardDescription>Return rate metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Day 1 Retention</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 w-[78%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Day 7 Retention</span>
                      <span className="font-semibold">54%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-[54%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Day 30 Retention</span>
                      <span className="font-semibold">42%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 w-[42%]"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demographics */}
          <Card>
            <CardHeader>
              <CardTitle>User Demographics</CardTitle>
              <CardDescription>User distribution by location and type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium">Top Locations</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Metro Manila</span>
                      <span className="font-semibold">1,234 (48%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cebu City</span>
                      <span className="font-semibold">456 (18%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Davao City</span>
                      <span className="font-semibold">342 (13%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quezon City</span>
                      <span className="font-semibold">298 (12%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Others</span>
                      <span className="font-semibold">213 (9%)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">User Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Verified Workers</span>
                      <span className="font-semibold">892 (35%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Unverified Workers</span>
                      <span className="font-semibold">353 (14%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Clients</span>
                      <span className="font-semibold">987 (39%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Inactive Clients</span>
                      <span className="font-semibold">311 (12%)</span>
                    </div>
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
