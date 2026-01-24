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
import { Sidebar } from "../../components";

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
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 animate-pulse mx-auto" />
            <p className="text-gray-500 mt-4 text-lg">Loading analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <BarChart3 className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-bold">Support Analytics</h1>
                  </div>
                  <p className="text-indigo-100 text-lg">
                    Track support performance and customer satisfaction metrics
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportReport}
                    className="bg-white/10 border-white/20 hover:bg-white/20"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    className="bg-white/10 border-white/20 hover:bg-white/20"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-gray-700 self-center">
                    Date Range:
                  </span>
                  {[
                    { value: "today", label: "Today" },
                    { value: "7days", label: "Last 7 Days" },
                    { value: "30days", label: "Last 30 Days" },
                    { value: "90days", label: "Last 90 Days" },
                  ].map((range) => (
                    <Button
                      key={range.value}
                      variant={
                        dateRange === range.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setDateRange(range.value)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={fetchStatistics}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    Auto-refresh (60s)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Tickets */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    Total Tickets
                  </p>
                  <div
                    className={`flex items-center gap-1 ${getTrendColor(stats.total_tickets_change)}`}
                  >
                    {getTrendIcon(stats.total_tickets_change)}
                    <span className="text-xs font-medium">
                      {Math.abs(stats.total_tickets_change)}%
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_tickets}
                </p>
              </CardContent>
            </Card>

            {/* Open Tickets */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    Open Tickets
                  </p>
                  <div
                    className={`flex items-center gap-1 ${getTrendColor(stats.open_tickets_change, true)}`}
                  >
                    {getTrendIcon(stats.open_tickets_change)}
                    <span className="text-xs font-medium">
                      {Math.abs(stats.open_tickets_change)}%
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.open_tickets}
                </p>
              </CardContent>
            </Card>

            {/* Resolved Tickets */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    Resolved Tickets
                  </p>
                  <div
                    className={`flex items-center gap-1 ${getTrendColor(stats.resolved_tickets_change)}`}
                  >
                    {getTrendIcon(stats.resolved_tickets_change)}
                    <span className="text-xs font-medium">
                      {Math.abs(stats.resolved_tickets_change)}%
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.resolved_tickets}
                </p>
              </CardContent>
            </Card>

            {/* Avg Response Time */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    Avg Response Time
                  </p>
                  <div
                    className={`flex items-center gap-1 ${getTrendColor(stats.avg_response_time_change, true)}`}
                  >
                    {getTrendIcon(stats.avg_response_time_change)}
                    <span className="text-xs font-medium">
                      {Math.abs(stats.avg_response_time_change)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {formatTime(stats.avg_response_time)}
                  </p>
                  <Badge
                    className={
                      stats.avg_response_time < 4
                        ? "bg-green-100 text-green-700"
                        : stats.avg_response_time < 8
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }
                  >
                    Target: 4h
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Avg Resolution Time */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    Avg Resolution Time
                  </p>
                  <div
                    className={`flex items-center gap-1 ${getTrendColor(stats.avg_resolution_time_change, true)}`}
                  >
                    {getTrendIcon(stats.avg_resolution_time_change)}
                    <span className="text-xs font-medium">
                      {Math.abs(stats.avg_resolution_time_change)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {formatTime(stats.avg_resolution_time)}
                  </p>
                  <Badge
                    className={
                      stats.avg_resolution_time < 24
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    Target: 24h
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Customer Satisfaction */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    Satisfaction Rate
                  </p>
                  <div
                    className={`flex items-center gap-1 ${getTrendColor(stats.satisfaction_rate_change)}`}
                  >
                    {getTrendIcon(stats.satisfaction_rate_change)}
                    <span className="text-xs font-medium">
                      {Math.abs(stats.satisfaction_rate_change)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.satisfaction_rate}%
                  </p>
                  <ThumbsUp className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets by Category */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Tickets by Category
                </h3>
                <div className="space-y-3">
                  {(stats.tickets_by_category ?? []).map((item) => {
                    const total = (stats.tickets_by_category ?? []).reduce(
                      (sum, i) => sum + i.count,
                      0,
                    );
                    const percentage =
                      total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";
                    return (
                      <div key={item.category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {item.category}
                          </span>
                          <span className="text-sm text-gray-600">
                            {item.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
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
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Tickets by Priority & Status
                </h3>
                <div className="space-y-4">
                  {(stats.tickets_by_priority ?? []).map((item) => {
                    const total = item.open + item.in_progress + item.resolved;
                    return (
                      <div key={item.priority}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 uppercase">
                            {item.priority}
                          </span>
                          <span className="text-sm text-gray-600">
                            Total: {total}
                          </span>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-red-500"
                            style={{ width: `${(item.open / total) * 100}%` }}
                            title={`Open: ${item.open}`}
                          ></div>
                          <div
                            className="bg-yellow-500"
                            style={{
                              width: `${(item.in_progress / total) * 100}%`,
                            }}
                            title={`In Progress: ${item.in_progress}`}
                          ></div>
                          <div
                            className="bg-green-500"
                            style={{
                              width: `${(item.resolved / total) * 100}%`,
                            }}
                            title={`Resolved: ${item.resolved}`}
                          ></div>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className="text-gray-600">
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                            Open: {item.open}
                          </span>
                          <span className="text-gray-600">
                            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                            In Progress: {item.in_progress}
                          </span>
                          <span className="text-gray-600">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            Resolved: {item.resolved}
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
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Response Time Trend
              </h3>
              <div className="h-64 flex items-end gap-2">
                {(stats.response_time_trend ?? []).map((item, index) => {
                  const maxTime = Math.max(
                    ...(stats.response_time_trend ?? []).map((t) => t.time),
                    1,
                  );
                  const height = (item.time / maxTime) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className={`w-full rounded-t ${
                          item.time < 4
                            ? "bg-green-500"
                            : item.time < 8
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${formatTime(item.time)} on ${item.date}`}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">&lt; 4h</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-600">4-8h</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">&gt; 8h</span>
                </div>
                <div className="border-l pl-4 ml-4">
                  <span className="text-gray-600">Target: 4 hours</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Most Active Agents */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Most Active Agents
                </h3>
                <div className="space-y-3">
                  {(stats.top_agents ?? []).map((agent, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {agent.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {agent.tickets_handled} tickets
                        </p>
                      </div>
                      <Badge
                        className={
                          agent.avg_response_time < 4
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      >
                        {formatTime(agent.avg_response_time)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Common Issues */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Most Common Issues
                </h3>
                <div className="space-y-3">
                  {(stats.common_issues ?? []).map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {issue.category}
                        </p>
                        <p className="text-xs text-gray-600">
                          {issue.count} tickets
                        </p>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700">
                        {issue.percentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Users with Most Tickets */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Users with Most Tickets
                </h3>
                <div className="space-y-3">
                  {(stats.active_users ?? []).map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {user.ticket_count} total tickets
                        </p>
                      </div>
                      {user.open_count > 0 && (
                        <Badge className="bg-red-100 text-red-700">
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
