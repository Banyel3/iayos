"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sidebar, useMainContentClass } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  CreditCard,
  Wallet,
  Banknote,
  AlertTriangle,
  Activity,
} from "lucide-react";

export default function FinancialReports() {
  const mainClass = useMainContentClass("min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50");
  const [dateRange, setDateRange] = useState("last_30_days");

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={mainClass}>
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <DollarSign className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">Financial Reports</h1>
                </div>
                <p className="text-purple-100 text-lg">
                  Revenue analytics and financial performance
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none"
                >
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_quarter">This Quarter</option>
                  <option value="this_year">This Year</option>
                </select>
                <Button
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                  onClick={() => toast.info("Refresh coming soon", { description: "Real-time data refresh will be available once financial analytics backend is implemented." })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  onClick={() => toast.info("Export coming soon", { description: "Report export will be available once financial analytics backend is implemented." })}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Revenue Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  ₱2.85M
                </h3>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <div className="mt-3 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">+22.5%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">₱237K</h3>
                <p className="text-sm text-gray-500">MRR</p>
                <p className="text-xs text-gray-400 mt-1">
                  Monthly Recurring Revenue
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  ₱2.84M
                </h3>
                <p className="text-sm text-gray-500">ARR</p>
                <p className="text-xs text-gray-400 mt-1">
                  Annual Recurring Revenue
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">18.5%</h3>
                <p className="text-sm text-gray-500">Growth Rate</p>
                <Badge className="mt-2 bg-green-100 text-green-700">
                  Year over Year
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Timeline */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span>Revenue Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-purple-400" />
                  <p>
                    Line chart: Daily/Weekly/Monthly revenue with transaction
                    volume bars
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Category & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      category: "Construction",
                      revenue: 926150,
                      percentage: 33,
                    },
                    { category: "Plumbing", revenue: 642000, percentage: 23 },
                    { category: "Electrical", revenue: 570000, percentage: 20 },
                    { category: "Carpentry", revenue: 456000, percentage: 16 },
                    { category: "Painting", revenue: 246850, percentage: 8 },
                  ].map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-medium">
                          {cat.category}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 font-semibold">
                            ₱{cat.revenue.toLocaleString()}
                          </span>
                          <Badge variant="outline">{cat.percentage}%</Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${cat.percentage * 3}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Payment Methods Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Wallet className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">GCash</p>
                        <p className="text-xs text-gray-500">
                          1,854 transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₱1.28M</p>
                      <Badge className="bg-blue-600 text-white mt-1">45%</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Wallet</p>
                        <p className="text-xs text-gray-500">
                          1,443 transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₱997K</p>
                      <Badge className="bg-green-600 text-white mt-1">
                        35%
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-200 rounded-lg">
                        <Banknote className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Cash</p>
                        <p className="text-xs text-gray-500">
                          826 transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₱570K</p>
                      <Badge className="bg-gray-600 text-white mt-1">20%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Fees & Transaction Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <span>Platform Fees</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-orange-50 rounded-xl">
                    <p className="text-4xl font-bold text-orange-600 mb-2">
                      ₱142.3K
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Total Fees Collected
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: "5%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      5% of total revenue
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">₱34.50</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Avg Fee per Transaction
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">4,123</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Total Transactions
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Refund Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-red-50 rounded-xl">
                    <p className="text-4xl font-bold text-red-600 mb-2">1.8%</p>
                    <p className="text-sm text-gray-600 mb-2">Refund Rate</p>
                    <Badge className="bg-green-100 text-green-700">
                      Below 2% target
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        ₱51.2K
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Total Refunded
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">74</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Refund Requests
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Top Refund Reasons:
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Job cancellation</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Worker no-show</span>
                        <span className="font-medium">30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality issues</span>
                        <span className="font-medium">25%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Health Indicators */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Financial Health Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600 mb-2">94.2%</p>
                  <p className="text-sm text-gray-600">Gross Margin</p>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    ₱2.71M
                  </p>
                  <p className="text-sm text-gray-600">Net Revenue</p>
                  <p className="text-xs text-gray-500 mt-1">After refunds</p>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-xl">
                  <p className="text-3xl font-bold text-purple-600 mb-2">
                    ₱222
                  </p>
                  <p className="text-sm text-gray-600">Revenue per User</p>
                </div>
                <div className="text-center p-6 bg-orange-50 rounded-xl">
                  <p className="text-3xl font-bold text-orange-600 mb-2">
                    ₱690
                  </p>
                  <p className="text-sm text-gray-600">Avg Transaction Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
