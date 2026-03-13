"use client";

import React, { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  Trophy,
  Activity,
  Wrench
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AgencyStats {
  total_employees: number;
  avg_employee_rating: number | null;
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  total_revenue?: number;
  escrow_held?: number;
  revenue_chart_data?: {
    '7d': { name: string, value: number }[];
    '30d': { name: string, value: number }[];
    'All': { name: string, value: number }[];
  };
  specialization_ratings?: { name: string, rating: number }[];
  revenue_growth?: number;
}

interface LeaderboardEntry {
  employeeId: number;
  name: string;
  rating: number;
  totalJobsCompleted: number;
}

// Local data removed as we are now using real data from the employees list 
function getColor(index: number) {
  const colors = ["#00BAF1", "#008bb6", "#005d7a", "#003e51", "#001f28"];
  return colors[index % colors.length];
}

export default function AgencyDashboardPage() {
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pieData, setPieData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [specRatings, setSpecRatings] = useState<{ name: string, rating: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueFilter, setRevenueFilter] = useState<'7d' | '30d' | 'All'>("7d");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const completionRate = stats?.total_jobs && stats.total_jobs > 0
    ? Math.round((stats.completed_jobs / stats.total_jobs) * 100)
    : 100;

  const fetchStats = async (signal?: AbortSignal) => {
    try {
      // 1. Fetch agency profile statistics
      const res = await fetch(`${API_BASE}/api/agency/profile`, {
        credentials: "include",
        signal,
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.statistics);
      }

      // 2. Fetch all employees to derive leaderboard and specialization metrics
      // This is the source of truth for 29 employees mentioned
      const empRes = await fetch(`${API_BASE}/api/agency/employees`, {
        credentials: "include",
        signal,
      });

      if (empRes.ok) {
        const empData = await empRes.json();
        const employees = empData.employees || [];

        // A. Derive Leaderboard (Automatic EOTM selection)
        // Sort by Rating (desc), then Jobs Completed (desc)
        const sortedForLeaderboard = [...employees]
          .map((emp: any) => ({
            employeeId: Number(emp.employeeId || emp.id),
            name: emp.fullName || emp.name,
            rating: Number(emp.rating || 0),
            totalJobsCompleted: Number(emp.totalJobsCompleted || 0)
          }))
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.totalJobsCompleted - a.totalJobsCompleted;
          });
        setLeaderboard(sortedForLeaderboard);

        // B. Derive Specialization Ratings
        const specMap: Record<string, { totalRating: number, count: number }> = {};
        employees.forEach(emp => {
          const specs = emp.specializations || (emp.role ? [emp.role] : []);
          const rating = Number(emp.rating || 0);
          if (rating > 0) {
            specs.forEach((s: string) => {
              if (!specMap[s]) specMap[s] = { totalRating: 0, count: 0 };
              specMap[s].totalRating += rating;
              specMap[s].count += 1;
            });
          }
        });
        const derivedSpecRatings = Object.entries(specMap)
          .map(([name, data]) => ({
            name,
            rating: data.totalRating / data.count
          }))
          .sort((a, b) => b.rating - a.rating);
        setSpecRatings(derivedSpecRatings);

        // C. Derive Staff Specialization counts for Pie Chart
        const countMap: Record<string, number> = {};
        employees.forEach((emp: any) => {
          const specs = emp.specializations || (emp.role ? [emp.role] : []);
          specs.forEach((s: string) => {
            countMap[s] = (countMap[s] || 0) + 1;
          });
        });
        const derivedPieData = Object.entries(countMap)
          .map(([name, value], idx) => ({
            name,
            value,
            color: getColor(idx)
          }))
          .sort((a, b) => b.value - a.value);
        setPieData(derivedPieData);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Error fetching dashboard data:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agency Dashboard</h1>
          <p className="text-gray-600 mb-6">Platform overview and business health metrics</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse shadow-sm border-gray-100 bg-white">
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Agency Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and business health metrics</p>
      </div>

      {/* Row 1: Revenue + Operations Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue Insights (2/3 width on LG) */}
        <Card className="lg:col-span-2 h-full flex flex-col shadow-sm border-gray-100 bg-white">
          <CardHeader className="flex flex-row items-start justify-between pb-2 pt-5">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                ₱{(stats?.total_revenue || 0).toLocaleString()}
              </CardTitle>
              <p className="text-sm font-bold text-gray-900 mt-2">
                Total Revenue
              </p>
              <div className={`flex items-center mt-1 text-sm ${(stats?.revenue_growth || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {(stats?.revenue_growth || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span className="font-semibold text-xs">
                  {(stats?.revenue_growth || 0) >= 0 ? "+" : ""}
                  {(stats?.revenue_growth || 0).toFixed(1)}% vs last month
                </span>
              </div>
            </div>

            <div className="flex bg-gray-50 border border-gray-200 rounded-md p-1 mt-1">
              {(["7d", "30d", "All"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRevenueFilter(filter)}
                  className={`px-3 py-1 text-xs font-medium rounded ${revenueFilter === filter
                    ? "text-gray-900 bg-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0">
            <div className="flex-1 w-full min-h-[180px] relative flex flex-col items-center justify-center border-t border-gray-100 mt-4 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.revenue_chart_data?.[revenueFilter] || []}
                  style={{ outline: "none" }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border border-gray-100 shadow-sm rounded-md text-xs">
                            <p className="font-bold text-gray-900">₱{payload[0].value?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#00BAF1"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center mt-4 pb-2 px-1">
              <div className="flex items-center justify-between px-4 py-3 bg-amber-50 rounded-xl">
                <div className="flex items-center text-sm font-bold text-amber-900 mr-2">
                  <Lock className="w-4 h-4 mr-2" />
                  Funds in Escrow
                </div>
                <span className="text-xl font-bold text-amber-900">₱{(stats?.escrow_held || 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations Overview (1/3 width on LG) */}
        <Card className="h-full flex flex-col shadow-sm border-gray-100 bg-white">
          <CardHeader className="pb-4 pt-5">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-[#00BAF1]" />
              Operations Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <p className="text-xs font-medium text-gray-600">Total Jobs:</p>
              <p className="text-xs font-medium text-gray-900">{stats?.total_jobs || 0}</p>
            </div>

            {/* Job Pipeline - Vertical Stack matching Admin Dashboard */}
            <div className="flex flex-col gap-2">
              <div className="bg-[#f0f9ff] px-4 py-2.5 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#00BAF1] uppercase tracking-wider">Active</span>
                  <div className="text-xl font-bold text-[#008bb6] leading-tight">{stats?.active_jobs || 0}</div>
                </div>
                <Briefcase className="h-4 w-4 text-[#00BAF1]" />
              </div>

              <div className="bg-amber-50 px-4 py-2.5 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Job Invitations</span>
                  <div className="text-xl font-bold text-amber-900 leading-tight">—</div>
                </div>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>

              <div className="bg-green-50 px-4 py-2.5 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Available Employees</span>
                  <div className="text-xl font-bold text-green-900 leading-tight">{stats?.total_employees || 0}</div>
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>

              <div className="bg-red-50 px-4 py-2.5 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Jobs Near Deadline</span>
                  <div className="text-xl font-bold text-red-900 leading-tight">—</div>
                </div>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Three Equal Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Staff Specialization */}
        <Card className="shadow-sm border-gray-100 bg-white h-full flex flex-col">
          <CardHeader className="pb-0 pt-5">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-[#00BAF1]" />
              Staff Specialization
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 items-center justify-start pt-2 pb-5">
            <div className="w-full h-40 relative mb-0">
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
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={63}
                    paddingAngle={5}
                    cornerRadius={20}
                    dataKey="value"
                    stroke="none"
                    // @ts-ignore - Recharts internal prop type mismatch
                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                    onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    labelLine={false}
                    label={(props: any) => {
                      const { cx, cy, midAngle, outerRadius, value, name, index } = props;
                      if (index !== activeIndex || midAngle === undefined) return null;

                      const RADIAN = Math.PI / 180;
                      const labelRadius = outerRadius + 15;
                      const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
                      const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

                      const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);
                      const percentage = ((value / totalValue) * 100).toFixed(0);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#111827"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-[12px] font-bold chart-fade-in pointer-events-none"
                        >
                          {name}: {value} ({percentage}%)
                        </text>
                      );
                    }}
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none', border: 'none' }} tabIndex={-1} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Total Count in center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {stats?.total_employees || 0}
                </p>
                <p className="text-[10px] leading-tight mt-1 uppercase text-gray-500 font-bold">
                  Total<br />Workers
                </p>
              </div>
            </div>

            <div className="w-full space-y-3 mt-4 px-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {(() => {
                const totalAssignments = pieData.reduce((sum, item) => sum + item.value, 0);
                return pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center min-w-0">
                      <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="font-bold text-gray-900 truncate">
                        {item.name} ({((item.value / totalAssignments) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 ml-4">{item.value}</span>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Reputation & Trust */}
        <Card className="shadow-sm border-gray-100 bg-white h-full flex flex-col">
          <CardHeader className="pb-4 pt-5">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center">
              <Star className="h-5 w-5 mr-2 text-[#00BAF1]" />
              Reputation & Trust
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 flex flex-col flex-1 gap-4">
            <div className="flex flex-col items-center pt-0 flex-1">
              <p className="text-5xl leading-none font-bold text-[#00BAF1] mb-2 tracking-tighter">
                {stats?.avg_employee_rating?.toFixed(1) || "0.0"}
              </p>
              <div className="text-sm font-bold text-gray-900 mb-2">Overall Agency Rating</div>
              <div className="flex items-center text-xs text-green-500 font-bold mb-6">
                <TrendingUp className="w-4 h-4 mr-1" />
                {completionRate}% Completion Rate
              </div>

              <div className="w-full mt-2">
                <div className="text-xs font-bold text-gray-900 mb-6 flex items-center justify-center uppercase tracking-wide">
                  Average Rating per Specialization
                </div>
                <div className="h-[196px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                  <div className="grid grid-cols-1 gap-y-3 px-6">
                    {specRatings.map((spec: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                        <span className="text-gray-600 font-medium truncate">{spec.name}</span>
                        <span className="font-bold text-gray-900">{spec.rating.toFixed(1)}</span>
                      </div>
                    ))}
                    {specRatings.length === 0 && (
                      <div className="col-span-2 text-center text-gray-400 text-xs italic py-4">
                        No specialization data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Leaderboard */}
        <Card className="shadow-sm border-gray-100 bg-white h-full flex flex-col lg:col-span-1">
          <CardHeader className="pb-0 pt-5">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-[#00BAF1]" />
              Employee Leaderboard
            </CardTitle>
            <div className="flex justify-end pt-0">
              <div className="flex gap-8 text-xs font-bold text-gray-900 pr-2">
                <span>Ratings</span>
                <span>Jobs</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col relative pt-0 pb-5">
            <div className="space-y-0 relative z-10 flex-1">
              {leaderboard.length > 0 ? (
                leaderboard.slice(0, 5).map((emp, idx) => (
                  <div key={emp.employeeId} className={`flex items-center justify-between py-2.5 ${idx < leaderboard.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center gap-3">
                      {idx === 0 ? (
                        <Award className="w-4 h-4 text-[#00BAF1]" />
                      ) : (
                        <span className="text-sm font-bold text-gray-500 w-4 text-center">{idx + 1}</span>
                      )}
                      {idx === 0 ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#00BAF1] uppercase tracking-wider mb-0.5">Employee of the Month</span>
                          <span className="text-sm font-bold text-gray-900">{emp.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-gray-900">{emp.name}</span>
                      )}
                    </div>
                    <div className="flex gap-12 text-sm text-gray-500 w-[120px] justify-end pr-3">
                      <span className="font-semibold">{Number(emp.rating || 0).toFixed(1)}</span>
                      <span className="font-semibold">{emp.totalJobsCompleted || 0}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">
                  No leaderboard data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
