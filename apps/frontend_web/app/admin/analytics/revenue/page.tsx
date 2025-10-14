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
  DollarSign,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Wallet,
} from "lucide-react";
import { Sidebar } from "../../components";

export default function RevenueAnalyticsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Revenue Analytics
            </h1>
            <p className="text-muted-foreground">
              Financial performance and revenue insights
            </p>
          </div>

          {/* Revenue Stats */}
          <div className="grid gap-4 md:grid-cols-4">
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
                  Platform Fees
                </CardTitle>
                <Wallet className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱124,568</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+18.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  This Month
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱342,150</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+15.2%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Transaction
                </CardTitle>
                <CreditCard className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱1,850</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+5.3%</span> from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Revenue by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">GCash</span>
                    <span className="font-semibold">₱456,780 (37%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[37%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Bank Transfer</span>
                    <span className="font-semibold">₱398,450 (32%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 w-[32%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">PayMaya</span>
                    <span className="font-semibold">₱248,910 (20%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 w-[20%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Credit/Debit Card</span>
                    <span className="font-semibold">₱141,540 (11%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-[11%]"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">January 2024</span>
                    <span className="font-semibold">₱198,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">February 2024</span>
                    <span className="font-semibold">₱234,120</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">March 2024</span>
                    <span className="font-semibold">₱267,890</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">April 2024</span>
                    <span className="font-semibold">₱289,340</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">May 2024</span>
                    <span className="font-semibold">₱312,760</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">June 2024</span>
                    <span className="font-semibold text-blue-600">₱342,150</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Top earning service categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Appliance Repair</span>
                    <span className="font-semibold">₱445,380</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Plumbing</span>
                    <span className="font-semibold">₱378,920</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Electrical Work</span>
                    <span className="font-semibold">₱298,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cleaning</span>
                    <span className="font-semibold">₱189,340</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Others</span>
                    <span className="font-semibold">₱133,590</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Overall financial health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Gross Revenue</p>
                  <div className="text-2xl font-bold">₱1,245,680</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-full"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Platform Fees (10%)</p>
                  <div className="text-2xl font-bold text-green-600">
                    ₱124,568
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 w-[10%]"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">To Workers</p>
                  <div className="text-2xl font-bold text-purple-600">
                    ₱1,121,112
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 w-[90%]"></div>
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
