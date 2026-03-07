"use client";

import { API_BASE } from "@/lib/api/config";
import { useState, useEffect } from "react";
import { Sidebar, useMainContentClass } from "../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  UserCheck,
  LayoutGrid,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";

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
  new_jobs_this_month: number;
  total_revenue: number;
  escrow_held: number;
  platform_fees: number;
  global_avg_rating: number;
  platform_fee_trend?: number;
  top_job_categories?: { name: string, earnings: number, posts: number }[];
  revenue_chart_data?: {
    '7d': { name: string, TotalRevenue: number, PlatformCut: number }[];
    '30d': { name: string, TotalRevenue: number, PlatformCut: number }[];
    'All': { name: string, TotalRevenue: number, PlatformCut: number }[];
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [revenueFilter, setRevenueFilter] = useState<'7d' | '30d' | 'All'>('7d');
  const mainClassName = useMainContentClass("p-6 bg-gray-50 min-h-screen");

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

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
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div>
        <Sidebar />
        <main className={mainClassName}>
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 mb-6">Platform overview and business health metrics</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
      <div>
        <Sidebar />
        <main className={mainClassName}>
          <div className="max-w-7xl mx-auto text-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Failed to load dashboard</h2>
            <p className="text-gray-600 mt-2">There was an error fetching the latest statistics.</p>
            <button
              onClick={() => { setLoading(true); fetchStats(); }}
              className="mt-4 px-4 py-2 bg-[#00BAF1] text-white rounded-md hover:bg-[#0098c7] transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Row 2 Col 1: Donut Chart Data - Sorted by value
  const userData = [
    { name: 'Clients', value: stats.total_clients, color: '#00BAF1' },
    { name: 'Workers', value: stats.total_workers, color: '#008bb6' },
    { name: 'Agencies', value: stats.total_agencies, color: '#005d7a' },
  ].sort((a, b) => b.value - a.value);

  // Transform chart data for stacking: split TotalRevenue into NetRevenue + PlatformCut
  const chartData = (stats.revenue_chart_data?.[revenueFilter] || []).map((d) => ({
    ...d,
    NetRevenue: d.TotalRevenue - d.PlatformCut,
  }));

  // Custom tooltip for stacked bars
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const gmv = (payload[0]?.payload?.TotalRevenue ?? 0);
    const fee = (payload[0]?.payload?.PlatformCut ?? 0);
    return (
      <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900">GMV: ₱{gmv.toLocaleString()}</p>
        <p className="text-sm font-bold text-[#00BAF1]">Platform Fee: ₱{fee.toLocaleString()}</p>
      </div>
    );
  };

  return (
    <div>
      <Sidebar />
      <main className={mainClassName}>
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Platform overview and business health metrics</p>
          </div>

          {/* Row 1: Revenue + Side Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Left wide column (2/3 width on LG) */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col shadow-sm border-gray-100 bg-white">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-4xl font-bold text-gray-900">
                      ₱{(stats.total_revenue ?? 0).toLocaleString()}
                    </CardTitle>
                    <p className="text-sm font-bold text-gray-900 mt-2">
                      Gross Merchandise Value (GMV)
                    </p>
                    {stats.platform_fee_trend !== undefined && (
                      <div className={`flex items-center mt-1 text-sm ${stats.platform_fee_trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <TrendingUp className={`h-4 w-4 mr-1 ${stats.platform_fee_trend < 0 ? 'rotate-180 transform' : ''}`} />
                        <span className="font-semibold text-xs">{Math.abs(stats.platform_fee_trend)}% vs last month</span>
                      </div>
                    )}
                  </div>
                  <div className="flex bg-gray-50 border border-gray-200 rounded-md p-1 mt-1">
                    <button
                      onClick={() => setRevenueFilter('7d')}
                      className={`px-3 py-1 text-xs font-medium rounded ${revenueFilter === '7d' ? 'text-gray-900 bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >7d</button>
                    <button
                      onClick={() => setRevenueFilter('30d')}
                      className={`px-3 py-1 text-xs font-medium rounded ${revenueFilter === '30d' ? 'text-gray-900 bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >30d</button>
                    <button
                      onClick={() => setRevenueFilter('All')}
                      className={`px-3 py-1 text-xs font-medium rounded ${revenueFilter === 'All' ? 'text-gray-900 bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >All</button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-0">
                  <div className="flex-1 w-full min-h-[250px] relative flex flex-col items-center justify-center border-t border-gray-100 mt-4 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                        />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Bar barSize={40} dataKey="NetRevenue" stackId="a" fill="#00BAF1" radius={[0, 0, 0, 0]} name="GMV" />
                        <Bar barSize={40} dataKey="PlatformCut" stackId="a" fill="#a5f3fc" radius={[4, 4, 0, 0]} name="Platform Fee" />
                      </BarChart>
                    </ResponsiveContainer>
                    {!stats.revenue_chart_data && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/80 px-4 py-2 rounded-md shadow-sm border border-gray-100 backdrop-blur-sm">
                          <p className="text-gray-500 text-sm italic font-medium">Chart data coming soon</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 pb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-[#00BAF1] mr-2"></div>
                      <span className="text-sm font-bold text-gray-900">GMV</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-[#a5f3fc] mr-2"></div>
                      <span className="text-sm font-bold text-gray-900">Platform Fee (10%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column (1/3 width on LG) */}
            <div className="flex flex-col gap-4">
              {/* Platform Cut */}
              <Card className="flex-1 shadow-sm border-gray-100 bg-white flex flex-col justify-center">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#00BAF1]" />
                    <CardTitle className="text-sm font-bold text-gray-900">
                      Platform Earnings (10%)
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-4xl font-bold text-gray-900">
                    ₱{(stats.platform_fees ?? 0).toLocaleString()}
                  </div>
                  {stats.platform_fee_trend !== undefined && (
                    <div className={`flex items-center mt-3 text-sm ${stats.platform_fee_trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <TrendingUp className={`h-4 w-4 mr-1 ${stats.platform_fee_trend < 0 ? 'rotate-180 transform' : ''}`} />
                      <span className="font-semibold text-xs">{Math.abs(stats.platform_fee_trend)}% vs last month</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Funds in Escrow */}
              <Card className="flex-1 shadow-sm border-gray-100 bg-white flex flex-col justify-center">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#00BAF1]" />
                    <CardTitle className="text-sm font-bold text-gray-900">
                      Funds in Escrow
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-4xl font-bold text-gray-900 flex items-center gap-1">
                    <span>₱</span>
                    <span>{(stats.escrow_held ?? 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Row 2: Three Equal Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Column 1: Total Users Donut Chart */}
            <Card className="shadow-sm border-gray-100 bg-white flex flex-col h-full">
              <CardHeader className="pb-0 pt-5">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-[#00BAF1]" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 items-center justify-center pt-2 pb-5">
                <div className="w-full h-60 relative mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart style={{ outline: 'none', border: 'none' }} className="outline-none focus:outline-none">
                      <defs>
                        <style>
                          {`
                            .recharts-surface:focus { outline: none; }
                            @keyframes chartFadeIn {
                              from { opacity: 0; }
                              to { opacity: 1; }
                            }
                            .chart-fade-in {
                              animation: chartFadeIn 0.3s ease-in-out forwards;
                            }
                          `}
                        </style>
                      </defs>
                      <Pie
                        data={userData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={105}
                        paddingAngle={8}
                        cornerRadius={10}
                        dataKey="value"
                        stroke="none"
                        activeIndex={activeIndex !== null ? activeIndex : undefined}
                        onMouseEnter={(data, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        labelLine={false}
                        label={(props) => {
                          const { cx, cy, midAngle, outerRadius, value, name, index } = props;
                          if (index !== activeIndex || midAngle === undefined) return null;

                          const RADIAN = Math.PI / 180;
                          const labelRadius = outerRadius + 15;
                          const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
                          const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

                          const percentage = stats ? ((value / stats.total_users) * 100).toFixed(0) : 0;

                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#111827"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              className="text-[12px] font-bold chart-fade-in pointer-events-none"
                            >
                              {name}: {value.toLocaleString()} ({percentage}%)
                            </text>
                          );
                        }}
                      >
                        {userData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{ outline: 'none', border: 'none' }}
                            tabIndex={-1}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Total Count in center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-5xl font-extrabold text-gray-900 tracking-tight">
                      {stats.total_users.toLocaleString()}
                    </p>
                    <p className="text-[10px] leading-tight mt-1 uppercase text-gray-500 font-bold">
                      Total<br />Users
                    </p>
                  </div>
                </div>

                <div className="w-full space-y-3 mt-auto px-2">
                  {userData.map((entry, index) => {
                    const percentage = stats ? ((entry.value / stats.total_users) * 100).toFixed(0) : 0;
                    return (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: entry.color }}></div>
                          <span className="font-bold text-gray-900">{entry.name} ({percentage}%):</span>
                        </div>
                        <span className="font-bold text-gray-900">{entry.value.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Column 2: Customer Satisfaction & Job Pipeline */}
            <Card className="shadow-sm border-gray-100 bg-white h-full flex flex-col">
              <CardHeader className="pb-4 pt-5">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-[#00BAF1]" />
                  Customer Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex flex-col gap-4">
                <div className="flex flex-col">
                  <p className="text-xl font-bold text-gray-900">{(stats.global_avg_rating ?? 0).toFixed(1)} / 5.0</p>
                </div>

                <div className="flex items-center gap-2 px-1">
                  <p className="text-xs font-medium text-gray-600">Total Jobs:</p>
                  <p className="text-xs font-medium text-gray-900">{stats.total_jobs.toLocaleString()}</p>
                </div>

                {/* Job Pipeline - Vertical Stack */}
                <div className="flex flex-col gap-2">
                  <div className="bg-[#f0f9ff] px-4 py-2.5 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#00BAF1] uppercase tracking-wider">Active</span>
                      <div className="text-xl font-bold text-[#008bb6] leading-tight">{stats.active_jobs.toLocaleString()}</div>
                    </div>
                    <Briefcase className="h-4 w-4 text-[#00BAF1]" />
                  </div>

                  <div className="bg-amber-50 px-4 py-2.5 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">In Progress</span>
                      <div className="text-xl font-bold text-amber-900 leading-tight">{stats.in_progress_jobs.toLocaleString()}</div>
                    </div>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>

                  <div className="bg-green-50 px-4 py-2.5 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Completed</span>
                      <div className="text-xl font-bold text-green-900 leading-tight">{stats.completed_jobs.toLocaleString()}</div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>

                  <div className="bg-red-50 px-4 py-2.5 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Cancelled</span>
                      <div className="text-xl font-bold text-red-900 leading-tight">{stats.cancelled_jobs.toLocaleString()}</div>
                    </div>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Column 3: Top Job Categories Placeholder */}
            <Card className="shadow-sm border-gray-100 bg-white h-full flex flex-col">
              <CardHeader className="pb-4 pt-5">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center">
                  <LayoutGrid className="h-5 w-5 mr-2 text-[#00BAF1]" />
                  Top Job Categories
                </CardTitle>
                <div className="flex justify-end pt-3">
                  <div className="flex gap-8 text-xs font-bold text-gray-900 pr-2">
                    <span>Earnings</span>
                    <span>Posts</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col relative pt-0 pb-5">
                <div className="space-y-0 relative z-10 flex-1">
                  {stats.top_job_categories && stats.top_job_categories.length > 0 ? (
                    stats.top_job_categories.map((cat, idx) => (
                      <div key={idx} className={`flex items-center justify-between py-3.5 ${idx < stats.top_job_categories!.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                        <div className="flex gap-12 text-sm text-gray-500 w-[120px] justify-end pr-3">
                          <span className="font-semibold">₱{cat.earnings.toLocaleString()}</span>
                          <span className="font-semibold">{cat.posts}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 pt-8">
                      <p className="text-sm">No job categories data available.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
