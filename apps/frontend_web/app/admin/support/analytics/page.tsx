"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  Download,
  RefreshCw,
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../../components";

interface Statistics {
  total_tickets: number;
  total_tickets_change: number;
  open_tickets: number;
  open_tickets_change: number;
  resolved_tickets: number;
  resolved_tickets_change: number;
  avg_response_time: number;
  avg_response_time_change: number;
  avg_resolution_time: number;
  avg_resolution_time_change: number;
  satisfaction_rate: number;
  satisfaction_rate_change: number;
  tickets_by_category: Array<{ category: string; count: number }>;
  tickets_by_priority: Array<{
    priority: string;
    open: number;
    in_progress: number;
    resolved: number;
  }>;
  response_time_trend: Array<{ date: string; time: number }>;
  top_agents: Array<{
    name: string;
    tickets_handled: number;
    avg_response_time: number;
  }>;
  common_issues: Array<{ category: string; count: number; percentage: number }>;
  active_users: Array<{
    name: string;
    ticket_count: number;
    open_count: number;
  }>;
}

export default function SupportAnalyticsPage() {
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const mainClassLoading = useMainContentClass("flex items-center justify-center min-h-screen");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [dateRange, setDateRange] = useState("7days");
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatistics();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/statistics?range=${dateRange}`,
        { credentials: "include" },
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.statistics);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (change: number, inverse = false) => {
    if (inverse) {
      if (change > 0) return "text-red-600";
      if (change < 0) return "text-green-600";
    } else {
      if (change > 0) return "text-green-600";
      if (change < 0) return "text-red-600";
    }
    return "text-gray-600";
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const handleExportReport = () => {
    alert("Exporting report as PDF...");
  };

  const handleExportData = () => {
    alert("Exporting data as CSV...");
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClassLoading}>
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 animate-pulse mx-auto" />
            <p className="text-gray-500 mt-4 text-lg">Loading analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-700 p-4 sm:p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold">Support Analytics</h1>
                  </div>
                  <p className="text-indigo-100 text-sm sm:text-lg text-center sm:text-left">
                    Track performance and satisfaction metrics
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportReport}
                    className="bg-white/10 border-white/20 hover:bg-white/20 h-9 sm:h-10 text-[11px] sm:text-sm font-bold rounded-xl"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    className="bg-white/10 border-white/20 hover:bg-white/20 h-9 sm:h-10 text-[11px] sm:text-sm font-bold rounded-xl"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    CSV Data
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 leading-none">Time Range</p>
                  <div className="flex overflow-x-auto pb-1 gap-2 custom-scrollbar -mx-1 px-1">
                    {[
                      { value: "today", label: "Today" },
                      { value: "7days", label: "7 Days" },
                      { value: "30days", label: "30 Days" },
                      { value: "90days", label: "90 Days" },
                    ].map((range) => (
                      <Button
                        key={range.value}
                        variant={dateRange === range.value ? "default" : "outline"}
                        size="sm"
                        className={`whitespace-nowrap px-4 h-9 rounded-xl font-bold ${dateRange === range.value ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border-2"}`}
                        onClick={() => setDateRange(range.value)}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-50 sm:border-0 sm:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchStatistics}
                    className="flex-1 sm:flex-none h-9 rounded-xl font-bold border-2 text-[11px]"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh
                  </Button>
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex-1 sm:flex-none h-9 rounded-xl font-bold border-2 text-[11px] ${autoRefresh ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : ""}`}
                  >
                    Auto {autoRefresh ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Total Tickets */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Total</p>
                  <div className={`flex items-center gap-0.5 ${getTrendColor(stats.total_tickets_change)}`}>
                    {getTrendIcon(stats.total_tickets_change)}
                    <span className="text-[10px] font-bold">{Math.abs(stats.total_tickets_change)}%</span>
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                  {stats.total_tickets}
                </p>
              </CardContent>
            </Card>

            {/* Open Tickets */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Open</p>
                  <div className={`flex items-center gap-0.5 ${getTrendColor(stats.open_tickets_change, true)}`}>
                    {getTrendIcon(stats.open_tickets_change)}
                    <span className="text-[10px] font-bold">{Math.abs(stats.open_tickets_change)}%</span>
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                  {stats.open_tickets}
                </p>
              </CardContent>
            </Card>

            {/* Resolved Tickets */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Resolved</p>
                  <div className={`flex items-center gap-0.5 ${getTrendColor(stats.resolved_tickets_change)}`}>
                    {getTrendIcon(stats.resolved_tickets_change)}
                    <span className="text-[10px] font-bold">{Math.abs(stats.resolved_tickets_change)}%</span>
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                  {stats.resolved_tickets}
                </p>
              </CardContent>
            </Card>

            {/* Avg Response Time */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Avg Resp</p>
                  <div className={`flex items-center gap-0.5 ${getTrendColor(stats.avg_response_time_change, true)}`}>
                    {getTrendIcon(stats.avg_response_time_change)}
                    <span className="text-[10px] font-bold">{Math.abs(stats.avg_response_time_change)}%</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <p className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                    {formatTime(stats.avg_response_time)}
                  </p>
                  <Badge className={`${stats.avg_response_time < 4 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"} border-0 font-bold px-1.5 py-0 text-[8px] uppercase tracking-tighter w-fit h-4`}>
                    Target 4h
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Avg Resolution Time */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Avg Resolv</p>
                  <div className={`flex items-center gap-0.5 ${getTrendColor(stats.avg_resolution_time_change, true)}`}>
                    {getTrendIcon(stats.avg_resolution_time_change)}
                    <span className="text-[10px] font-bold">{Math.abs(stats.avg_resolution_time_change)}%</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <p className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                    {formatTime(stats.avg_resolution_time)}
                  </p>
                  <Badge className={`${stats.avg_resolution_time < 24 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"} border-0 font-bold px-1.5 py-0 text-[8px] uppercase tracking-tighter w-fit h-4`}>
                    Target 24h
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Customer Satisfaction */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Customer CSAT</p>
                  <div className={`flex items-center gap-0.5 ${getTrendColor(stats.satisfaction_rate_change)}`}>
                    {getTrendIcon(stats.satisfaction_rate_change)}
                    <span className="text-[10px] font-bold">{Math.abs(stats.satisfaction_rate_change)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                    {stats.satisfaction_rate}%
                  </p>
                  <ThumbsUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets by Category */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-sm sm:text-lg font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  By Category
                </h3>
                <div className="space-y-6">
                  {(stats.tickets_by_category ?? []).map((item) => {
                    const total = (stats.tickets_by_category ?? []).reduce(
                      (sum, i) => sum + i.count,
                      0,
                    );
                    const percentage =
                      total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";
                    return (
                      <div key={item.category} className="group/item">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-gray-600 capitalize tracking-tight group-hover/item:text-indigo-600 transition-colors">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-black text-gray-400">
                            {item.count} <span className="text-gray-300 mx-0.5">/</span> {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Tickets by Priority */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-sm sm:text-lg font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                  By Priority & Status
                </h3>
                <div className="space-y-6">
                  {(stats.tickets_by_priority ?? []).map((item) => {
                    const total = item.open + item.in_progress + item.resolved;
                    return (
                      <div key={item.priority} className="group/item">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">
                            {item.priority}
                          </span>
                          <span className="text-[10px] font-black text-gray-400">
                            TOTAL: {total}
                          </span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                          <div
                            className="bg-red-500 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]"
                            style={{ width: `${(item.open / total) * 100}%` }}
                            title={`Open: ${item.open}`}
                          ></div>
                          <div
                            className="bg-amber-400 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]"
                            style={{
                              width: `${(item.in_progress / total) * 100}%`,
                            }}
                            title={`In Progress: ${item.in_progress}`}
                          ></div>
                          <div
                            className="bg-emerald-500 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]"
                            style={{
                              width: `${(item.resolved / total) * 100}%`,
                            }}
                            title={`Resolved: ${item.resolved}`}
                          ></div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            Open: {item.open}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            Working: {item.in_progress}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            Done: {item.resolved}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Response Time Trend */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-sm sm:text-lg font-black text-gray-900 mb-8 flex items-center gap-2 uppercase tracking-tight">
                <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                Response Time Trend
              </h3>
              <div className="h-48 sm:h-64 flex items-end gap-1 sm:gap-2">
                {(stats.response_time_trend ?? []).map((item, index) => {
                  const maxTime = Math.max(
                    ...(stats.response_time_trend ?? []).map((t) => t.time),
                    1,
                  );
                  const height = (item.time / maxTime) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center group/bar"
                    >
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${item.time < 4
                          ? "bg-emerald-500 group-hover/bar:bg-emerald-400"
                          : item.time < 8
                            ? "bg-amber-400 group-hover/bar:bg-amber-300"
                            : "bg-red-500 group-hover/bar:bg-red-400"
                          } shadow-sm`}
                        style={{ height: `${height}%` }}
                        title={`${formatTime(item.time)} on ${item.date}`}
                      ></div>
                      <span className="text-[9px] sm:text-xs font-bold text-gray-400 mt-3 whitespace-nowrap rotate-45 sm:rotate-0">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-10 pt-6 border-t border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>
                  <span>&lt; 4h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></div>
                  <span>4-8h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
                  <span>&gt; 8h</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-gray-200 mx-2"></div>
                <div className="text-gray-900 border-b-2 border-indigo-600 pb-0.5">
                  Target: 4H
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Most Active Agents */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-sm sm:text-lg font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  Top Agents
                </h3>
                <div className="space-y-3">
                  {(stats.top_agents ?? []).map((agent, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group/item"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {agent.name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          {agent.tickets_handled} tickets
                        </p>
                      </div>
                      <Badge
                        className={`${agent.avg_response_time < 4
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                          } border-0 font-black text-[9px] px-1.5 py-0 h-5 tracking-tighter uppercase`}
                      >
                        {formatTime(agent.avg_response_time)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Common Issues */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-sm sm:text-lg font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
                  Common Issues
                </h3>
                <div className="space-y-3">
                  {(stats.common_issues ?? []).map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 capitalize truncate">
                          {issue.category}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          {issue.count} tickets
                        </p>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700 border-0 font-black text-[9px] px-1.5 py-0 h-5 tracking-tighter uppercase">
                        {issue.percentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Users with Most Tickets */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-sm sm:text-lg font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                  Top Users
                </h3>
                <div className="space-y-3">
                  {(stats.active_users ?? []).map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          {user.ticket_count} total
                        </p>
                      </div>
                      {user.open_count > 0 && (
                        <Badge className="bg-red-100 text-red-700 border-0 font-black text-[10px] px-1.5 py-0 h-5 tracking-tighter uppercase">
                          {user.open_count} open
                        </Badge>
                      )}
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
