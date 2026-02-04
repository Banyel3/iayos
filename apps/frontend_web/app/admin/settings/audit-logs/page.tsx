"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Download,
  Eye,
  Clock,
  User,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../../components";

interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  details: any;
  ip_address: string;
  timestamp: string;
  user_agent?: string;
  before_value?: any;
  after_value?: any;
}

interface AuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
  total: number;
  page: number;
  total_pages: number;
}

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "kyc_approval", label: "KYC Approval" },
  { value: "payment_release", label: "Payment Release" },
  { value: "user_ban", label: "User Ban" },
  { value: "settings_change", label: "Settings Change" },
  { value: "admin_create", label: "Admin Create" },
  { value: "admin_delete", label: "Admin Delete" },
];

export default function AuditLogsPage() {
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [adminFilter, setAdminFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Unique admins for filter
  const [admins, setAdmins] = useState<
    Array<{ id: string | number; email: string }>
  >([]);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, adminFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs();
        setLastRefresh(new Date());
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, currentPage, adminFilter, actionFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "100",
      });

      if (adminFilter !== "all") params.append("admin_id", adminFilter);
      if (actionFilter !== "all") params.append("action_type", actionFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/audit-logs?${params.toString()}`,
        {
          credentials: "include",
        },
      );
      const data: AuditLogsResponse = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(data.total_pages || 1);
        setTotal(data.total || 0);

        // Extract unique admins
        const logsArray = data.logs || [];
        const uniqueAdmins = Array.from(
          new Set(logsArray.map((log) => log.admin_email)),
        ).map((email) => {
          const log = logsArray.find((l) => l.admin_email === email);
          return { id: log?.admin_id || 0, email };
        });
        setAdmins(uniqueAdmins);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ["Timestamp", "Admin", "Action", "IP Address", "Details"];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.admin_email,
      log.action,
      log.ip_address,
      JSON.stringify(log.details),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      login: "bg-blue-100 text-blue-700 border-blue-200",
      kyc_approval: "bg-green-100 text-green-700 border-green-200",
      payment_release: "bg-purple-100 text-purple-700 border-purple-200",
      user_ban: "bg-red-100 text-red-700 border-red-200",
      settings_change: "bg-yellow-100 text-yellow-700 border-yellow-200",
      admin_create: "bg-indigo-100 text-indigo-700 border-indigo-200",
      admin_delete: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[action] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const formatActionLabel = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <FileText className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading audit logs...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Fetching activity history
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-600 via-gray-700 to-zinc-700 p-8 shadow-xl">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-slate-500 opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-zinc-500 opacity-20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
                <FileText className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
                  Activity Monitor
                </span>
              </div>
              <h1 className="mb-2 text-4xl font-bold text-white">Audit Logs</h1>
              <p className="text-lg text-slate-100">
                Track administrator actions and system events
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRefresh ? "bg-green-600" : "bg-gray-400"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRefresh ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                  <span className="text-sm text-white">Auto-refresh</span>
                </div>
                {autoRefresh && (
                  <span className="text-xs text-white/70">
                    {getTimeAgo(lastRefresh.toISOString())}
                  </span>
                )}
              </div>
              <Button
                onClick={handleExportCSV}
                className="gap-2 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin
                </label>
                <select
                  value={adminFilter}
                  onChange={(e) => {
                    setAdminFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="all">All Admins</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {ACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border-gray-200"
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border-gray-200"
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setCurrentPage(1);
                        fetchLogs();
                      }
                    }}
                    className="pl-10 border-gray-200"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activity Log ({total} total)</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Page {currentPage} of {totalPages}
              </p>
            </div>
            <Button
              onClick={() => fetchLogs()}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          No logs found
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try adjusting your filters
                        </p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {getTimeAgo(log.timestamp)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-900">
                              {log.admin_email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(
                              log.action,
                            )}`}
                          >
                            {formatActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 truncate max-w-md">
                            {typeof log.details === "string"
                              ? log.details
                              : JSON.stringify(log.details).substring(0, 100)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {log.ip_address}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            onClick={() => handleViewDetail(log)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4 flex items-center justify-between bg-gray-50">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Detail Modal */}
        {showDetailModal && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  Log Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedLog.admin_email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Type
                    </label>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(
                        selectedLog.action,
                      )}`}
                    >
                      {formatActionLabel(selectedLog.action)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IP Address
                    </label>
                    <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {selectedLog.ip_address}
                    </code>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timestamp
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedLog.user_agent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Agent
                    </label>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Details
                  </label>
                  <pre className="text-xs text-gray-900 bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>

                {(selectedLog.before_value || selectedLog.after_value) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.before_value && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Before
                        </label>
                        <pre className="text-xs text-gray-900 bg-red-50 p-3 rounded border border-red-200 overflow-x-auto">
                          {JSON.stringify(selectedLog.before_value, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.after_value && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          After
                        </label>
                        <pre className="text-xs text-gray-900 bg-green-50 p-3 rounded border border-green-200 overflow-x-auto">
                          {JSON.stringify(selectedLog.after_value, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <Button
                  onClick={() => setShowDetailModal(false)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
