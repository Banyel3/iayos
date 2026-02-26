"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sidebar, useMainContentClass } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-xl mx-4 sm:mx-8 mt-4 sm:mt-8">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-4 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2 justify-center sm:justify-start">
                  <Banknote className="h-6 w-6 sm:h-8 sm:w-8" />
                  <h1 className="text-2xl sm:text-3xl font-bold">Financial Analysis</h1>
                </div>
                <p className="text-purple-100 text-sm sm:text-lg">
                  Revenue analytics and financial performance
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none text-xs sm:text-sm font-bold"
                >
                  <option value="this_month" className="text-gray-900">This Month</option>
                  <option value="last_month" className="text-gray-900">Last Month</option>
                  <option value="this_quarter" className="text-gray-900">This Quarter</option>
                  <option value="this_year" className="text-gray-900">This Year</option>
                </select>
                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <Button
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 h-10 text-[11px] sm:text-xs font-bold rounded-xl flex-1 sm:flex-none"
                    onClick={() => toast.info("Refresh coming soon", { description: "Real-time data refresh will be available soon." })}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh
                  </Button>
                  <Button
                    className="bg-white text-purple-600 hover:bg-gray-100 h-10 text-[11px] sm:text-xs font-bold rounded-xl flex-1 sm:flex-none shadow-lg"
                    onClick={() => toast.info("Export coming soon", { description: "Report export will be available soon." })}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-6 space-y-6">
          {/* Revenue Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  ₱2.85M
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-3 sm:mb-4">Total Revenue</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-tight bg-gray-50 p-1.5 sm:p-2 rounded-lg inline-flex">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">+22.5%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">₱237K</h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-3 sm:mb-4">MRR</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-tight bg-gray-50 p-1.5 sm:p-2 rounded-lg inline-flex">
                  <span className="text-gray-400">Monthly Recurring</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                  ₱2.84M
                </h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-3 sm:mb-4">ARR</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-tight bg-gray-50 p-1.5 sm:p-2 rounded-lg inline-flex">
                  <span className="text-gray-400">Annual Recurring</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">18.5%</h3>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-3 sm:mb-4">Growth Rate</p>
                <Badge
                  className="border-0 font-black text-[10px] uppercase h-6 bg-emerald-100 text-emerald-700 shadow-sm"
                >
                  Year over Year
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Timeline */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Revenue Progression Hub</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <div className="text-center p-4">
                  <Activity className="h-10 w-10 mx-auto mb-2 text-purple-400/60 transition-transform group-hover:scale-110" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Revenue Trend Visualizer
                  </p>
                  <p className="text-[10px] font-bold text-gray-300 mt-1 uppercase">Daily Revenue • Transaction Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Category & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm sm:text-lg font-black uppercase tracking-tight">Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-5">
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
                    <div key={i} className="group/item">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-tighter group-hover/item:text-gray-900 transition-colors">
                          {cat.category}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm sm:text-base font-black text-gray-900">
                            ₱{cat.revenue.toLocaleString()}
                          </span>
                          <Badge variant="outline" className="border-2 font-black text-[10px] uppercase h-6 px-1.5">
                            {cat.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-sm sm:text-lg font-black uppercase tracking-tight">Payment Ecosystem Hub</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl group hover:bg-blue-100 transition-all shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 sm:p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 uppercase tracking-tight">GCash</p>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">
                          1,854 transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 text-sm sm:text-lg">₱1.28M</p>
                      <Badge className="border-0 font-black text-[10px] uppercase h-6 bg-blue-600 text-white mt-1 shadow-sm">45% Share</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group hover:bg-emerald-100 transition-all shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 sm:p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 uppercase tracking-tight">Wallet</p>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">
                          1,443 transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 text-sm sm:text-lg">₱997K</p>
                      <Badge className="border-0 font-black text-[10px] uppercase h-6 bg-emerald-600 text-white mt-1 shadow-sm">
                        35% Share
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl group hover:bg-slate-100 transition-all shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 sm:p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 uppercase tracking-tight">Cash</p>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">
                          826 transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 text-sm sm:text-lg">₱570K</p>
                      <Badge className="border-0 font-black text-[10px] uppercase h-6 bg-slate-600 text-white mt-1 shadow-sm">20% Share</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Fees & Transaction Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5 text-orange-600" />
                  <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Platform Fee Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-6">
                  <div className="text-center p-6 bg-orange-50 border-2 border-orange-100 rounded-2xl group hover:bg-orange-100 transition-all shadow-sm">
                    <p className="text-3xl sm:text-5xl font-black text-orange-600 mb-2 group-hover:scale-105 transition-transform">
                      ₱142.3K
                    </p>
                    <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                      Revenue Capture
                    </p>
                    <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner max-w-xs mx-auto">
                      <div
                        className="h-full bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                        style={{ width: "5%" }}
                      ></div>
                    </div>
                    <p className="text-[10px] font-bold text-orange-400 mt-2 uppercase tracking-tighter">
                      5% Standard Platform Capture Rate
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl group hover:bg-blue-100 transition-all">
                      <p className="text-xl sm:text-2xl font-black text-blue-600 group-hover:scale-110 transition-transform">₱34.50</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        Avg / TXN
                      </p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group hover:bg-emerald-100 transition-all">
                      <p className="text-xl sm:text-2xl font-black text-emerald-600 group-hover:scale-110 transition-transform">4,123</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        TXN Count
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-sm sm:text-lg font-black uppercase tracking-tight">Financial Risk Radar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-4">
                  <div className="text-center p-6 bg-red-50 border-2 border-red-100 rounded-2xl group hover:bg-red-100 transition-all shadow-sm">
                    <p className="text-3xl sm:text-5xl font-black text-red-600 mb-2 group-hover:scale-105 transition-transform">1.8%</p>
                    <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Refund Volatility</p>
                    <Badge className="border-0 font-black text-[10px] uppercase h-6 bg-emerald-100 text-emerald-700 shadow-sm">
                      Target Optimized
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl">
                      <p className="text-xl sm:text-2xl font-black text-amber-600">₱51.2K</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        Reversals
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 border-2 border-purple-100 rounded-2xl">
                      <p className="text-xl sm:text-2xl font-black text-purple-600">74</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        Requests
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                      Volatility Drivers:
                    </p>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-black uppercase">
                          <span className="text-slate-500">Job Cancellations</span>
                          <span className="text-slate-900">45%</span>
                        </div>
                        <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-black uppercase">
                          <span className="text-slate-500">Worker Absence</span>
                          <span className="text-slate-900">30%</span>
                        </div>
                        <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Health Indicators */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-sm sm:text-lg font-black uppercase tracking-tight">Macro Health Indicators</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center p-4 sm:p-6 bg-blue-50 border-2 border-blue-100 rounded-2xl group hover:bg-blue-100 transition-all shadow-sm">
                  <p className="text-xl sm:text-3xl font-black text-blue-600 mb-1 group-hover:scale-105 transition-transform">94.2%</p>
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Gross Margin</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group hover:bg-emerald-100 transition-all shadow-sm">
                  <p className="text-xl sm:text-3xl font-black text-emerald-600 mb-1 group-hover:scale-105 transition-transform">₱2.71M</p>
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Net Revenue</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-purple-50 border-2 border-purple-100 rounded-2xl group hover:bg-purple-100 transition-all shadow-sm">
                  <p className="text-xl sm:text-3xl font-black text-purple-600 mb-1 group-hover:scale-105 transition-transform">₱222</p>
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Rev / User</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-amber-50 border-2 border-amber-100 rounded-2xl group hover:bg-amber-100 transition-all shadow-sm">
                  <p className="text-xl sm:text-3xl font-black text-amber-600 mb-1 group-hover:scale-105 transition-transform">₱690</p>
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Avg TXN</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
