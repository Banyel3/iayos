"use client";

import { API_BASE } from "@/lib/api/config";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Search,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  UserX,
  Ban,
  Eye,
  TrendingUp,
  ShieldAlert,
  FileText
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../../components";
import { toast } from "sonner";

interface UserReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reported_user_id: string;
  reported_user_name: string;
  reported_content_type: string;
  reported_content_id: string;
  reason: string;
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  created_at: string;
  reporter_total_reports: number;
  reported_user_total_reports: number;
}

interface ReportDetail extends UserReport {
  reported_content: string;
  screenshot_url?: string;
  admin_notes?: string;
  previous_actions?: Array<{
    action: string;
    admin_name: string;
    date: string;
  }>;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
  investigating: {
    label: "Investigating",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  dismissed: {
    label: "Dismissed",
    color: "bg-gray-100 text-gray-700",
    icon: XCircle,
  },
};

const REASON_CONFIG: Record<string, { color: string }> = {
  spam: { color: "bg-orange-100 text-orange-700" },
  inappropriate: { color: "bg-red-100 text-red-700" },
  fraud: { color: "bg-purple-100 text-purple-700" },
  scam: { color: "bg-purple-100 text-purple-700" },
  harassment: { color: "bg-pink-100 text-pink-700" },
  other: { color: "bg-gray-100 text-gray-700" },
};

const CONTENT_TYPE_CONFIG: Record<string, { color: string }> = {
  user: { color: "bg-blue-100 text-blue-700" },
  job: { color: "bg-green-100 text-green-700" },
  review: { color: "bg-purple-100 text-purple-700" },
  message: { color: "bg-indigo-100 text-indigo-700" },
};

export default function UserReportsPage() {
  const router = useRouter();
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // Bulk selection state
  const [selectedReports, setSelectedReports] = useState<Set<string>>(
    new Set(),
  );
  const [selectAll, setSelectAll] = useState(false);

  // Action forms
  const [adminNotes, setAdminNotes] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7");
  const [suspendReason, setSuspendReason] = useState("");
  const [banReason, setBanReason] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "15",
      });
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/reports?${params.toString()}`,
        { credentials: "include" },
      );
      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
        setTotalReports(data.total || data.reports.length);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    setSelectedReports(new Set());
    setSelectAll(false);
  }, [currentPage, statusFilter, typeFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchReports();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(reports.map((r) => r.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectReport = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
    setSelectAll(newSelected.size === reports.length);
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Reporter",
      "Reported User",
      "Type",
      "Reason",
      "Status",
      "Date",
    ];
    const rows = reports.map((r) => [
      r.id,
      r.reporter_name,
      r.reported_user_name,
      r.reported_content_type,
      r.reason,
      r.status,
      r.created_at,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetail = async (reportId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/reports/${reportId}`,
        { credentials: "include" },
      );
      const data = await response.json();

      if (data.success) {
        setSelectedReport(data.report);
        setAdminNotes(data.report.admin_notes || "");
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error fetching report detail:", error);
    }
  };

  const handleSendWarning = async () => {
    if (!selectedReport) return;

    try {
      await fetch(
        `${API_BASE}/api/adminpanel/support/reports/${selectedReport.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "warning",
            notes: warningMessage,
          }),
        },
      );

      setShowWarningModal(false);
      setShowDetailModal(false);
      fetchReports();
      toast.success("Warning sent successfully");
    } catch (error) {
      console.error("Error sending warning:", error);
    }
  };

  const handleSuspend = async () => {
    if (!selectedReport) return;

    try {
      await fetch(
        `${API_BASE}/api/adminpanel/support/reports/${selectedReport.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "suspend",
            duration: parseInt(suspendDuration),
            notes: suspendReason,
          }),
        },
      );

      setShowSuspendModal(false);
      setShowDetailModal(false);
      fetchReports();
      toast.success("User suspended successfully");
    } catch (error) {
      console.error("Error suspending user:", error);
    }
  };

  const handleBan = async () => {
    if (!selectedReport) return;

    try {
      await fetch(
        `${API_BASE}/api/adminpanel/support/reports/${selectedReport.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "ban",
            notes: banReason,
          }),
        },
      );

      setShowBanModal(false);
      setShowDetailModal(false);
      fetchReports();
      toast.success("User banned successfully");
    } catch (error) {
      console.error("Error banning user:", error);
    }
  };

  const handleDismiss = async () => {
    if (!selectedReport) return;

    try {
      await fetch(
        `${API_BASE}/api/adminpanel/support/reports/${selectedReport.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "dismiss",
            notes: adminNotes,
          }),
        },
      );

      setShowDetailModal(false);
      fetchReports();
      toast.success("Report dismissed");
    } catch (error) {
      console.error("Error dismissing report:", error);
    }
  };

  const stats = {
    total: totalReports,
    pending: reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    highRisk: reports.filter(r => r.reported_user_total_reports > 3).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          {/* Header */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Reports</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Review and moderate reported content and users
                </p>
              </div>
              <Button
                onClick={handleExport}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm transition-all"
              >
                <Download className="mr-2 h-5 w-5" />
                Export Reports
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><FileText className="h-5 w-5 text-[#00BAF1]" /></div>
                  <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Reports</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><AlertCircle className="h-5 w-5 text-[#00BAF1]" /></div>
                  <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Pending Review</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><CheckCircle className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Resolved</p>
                <p className="text-xl font-bold text-gray-900">{stats.resolved}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><ShieldAlert className="h-5 w-5 text-[#00BAF1]" /></div>
                  <div className="h-1.5 w-1.5 bg-red-600 rounded-full"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">High Risk Users</p>
                <p className="text-xl font-bold text-gray-900">{stats.highRisk}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-sky-500 transition-colors" />
                <Input
                  placeholder="Search by reporter, reported user, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-sky-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
              >
                <option value="all">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-sky-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
              >
                <option value="all">All Types</option>
                <option value="user">User Report</option>
                <option value="job">Job Report</option>
                <option value="review">Review Report</option>
                <option value="message">Message Report</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedReports.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm">
              <span className="text-sm font-medium text-blue-900 ml-2">
                {selectedReports.size} report(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedReports(new Set());
                    setSelectAll(false);
                  }}
                  className="rounded-lg"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Reports List */}
          <Card>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Reports List</h2>
              <p className="text-sm text-gray-500 mt-1">
                Overview of all moderation reports (Page {currentPage} of {totalPages})
              </p>
            </div>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-10 w-10 text-[#00BAF1] animate-spin" />
                  <p className="text-gray-500 font-medium">Fetching reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="p-4 bg-gray-50 rounded-full">
                    <AlertTriangle className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">No reports found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      No reports match your current filters. Try adjusting your search or filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left w-12">
                            <input
                              type="checkbox"
                              className="rounded-md border-gray-300 text-[#00BAF1] focus:ring-[#00BAF1]"
                              checked={selectAll}
                              onChange={handleSelectAll}
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Users
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Type & Reason
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Description
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reports.map((report) => (
                          <tr
                            key={report.id}
                            className="hover:bg-gray-50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                className="rounded-md border-gray-300 text-[#00BAF1] focus:ring-[#00BAF1]"
                                checked={selectedReports.has(report.id)}
                                onChange={() => handleSelectReport(report.id)}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-500">
                              #{report.id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-400">By:</span>
                                  <span className="text-sm font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors">{report.reporter_name}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-xs text-gray-400">Against:</span>
                                  <span className="text-sm font-bold text-gray-700">{report.reported_user_name}</span>
                                  {report.reported_user_total_reports > 3 && (
                                    <Badge className="bg-red-100 text-red-600 border-0 text-[10px] px-1 py-0 shadow-none">High Risk</Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <Badge className={`${CONTENT_TYPE_CONFIG[report.reported_content_type]?.color} border-0 font-bold text-[10px] px-1.5 py-0 shadow-none w-fit`}>
                                  {report.reported_content_type.toUpperCase()}
                                </Badge>
                                <Badge className={`${REASON_CONFIG[report.reason]?.color || "bg-gray-100 text-gray-600"} border-0 font-bold text-[10px] px-1.5 py-0 shadow-none w-fit`}>
                                  {report.reason.toUpperCase()}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-gray-500 line-clamp-2 max-w-xs">{report.description}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`${STATUS_CONFIG[report.status].color} border-0 font-bold px-2 py-0.5 flex items-center gap-1.5 w-fit shadow-none text-[10px]`}>
                                {(() => {
                                  const Icon = STATUS_CONFIG[report.status].icon;
                                  return <Icon className="h-3 w-3" />;
                                })()}
                                {STATUS_CONFIG[report.status].label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-500 tracking-tight">
                              {new Date(report.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(report.id)}
                                className="rounded-lg hover:border-[#00BAF1] hover:text-[#00BAF1]"
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-4 py-8 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Showing <span className="font-semibold text-gray-700">{reports.length}</span> of <span className="font-semibold text-gray-700">{totalReports}</span> reports
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${currentPage === 1 ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                          if (totalPages > 7) {
                            if (p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
                              if (p === 2 || p === totalPages - 1) return <span key={p} className="w-4 text-center text-gray-400">...</span>;
                              return null;
                            }
                          }
                          return (
                            <button
                              key={p}
                              onClick={() => setCurrentPage(p)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${p === currentPage ? "bg-[#00BAF1] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
                            >
                              {p}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${currentPage === totalPages ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">
                  Report Detail #{selectedReport.id}
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Reporter</h3>
                      <p className="text-sm">
                        <strong>Name:</strong> {selectedReport.reporter_name}
                      </p>
                      <p className="text-sm">
                        <strong>Total Reports:</strong>{" "}
                        {selectedReport.reporter_total_reports}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Reported User</h3>
                      <p className="text-sm">
                        <strong>Name:</strong>{" "}
                        {selectedReport.reported_user_name}
                      </p>
                      <p className="text-sm">
                        <strong>Times Reported:</strong>{" "}
                        {selectedReport.reported_user_total_reports}
                      </p>
                      {selectedReport.reported_user_total_reports > 3 && (
                        <Badge className="bg-red-100 text-red-700 mt-2">
                          Multiple Reports
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Reported Content</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Badge>{selectedReport.reported_content_type}</Badge>
                        <Badge>{selectedReport.reason}</Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        {selectedReport.description}
                      </p>
                      {selectedReport.reported_content && (
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-sm">
                            {selectedReport.reported_content}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Admin Notes (Internal)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    className="w-full min-h-[100px] px-4 py-3 border rounded-lg resize-y"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setShowWarningModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Send Warning
                  </Button>
                  <Button
                    onClick={() => setShowSuspendModal(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Suspend User
                  </Button>
                  <Button
                    onClick={() => setShowBanModal(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban Permanently
                  </Button>
                  <Button variant="outline" onClick={handleDismiss}>
                    Dismiss Report
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDetailModal(false)}
                    className="ml-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Send Warning</h3>
              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Warning message to user..."
                className="w-full min-h-[120px] px-4 py-3 border rounded-lg resize-y mb-4"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendWarning}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  Send Warning
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Suspend User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration
                  </label>
                  <select
                    value={suspendDuration}
                    onChange={(e) => setSuspendDuration(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reason
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Reason for suspension..."
                    className="w-full min-h-[100px] px-4 py-3 border rounded-lg resize-y"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSuspendModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSuspend}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Suspend
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4 text-red-600">
                Ban User Permanently
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This action is permanent and cannot be undone. The user will
                lose access to the platform.
              </p>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for permanent ban..."
                className="w-full min-h-[120px] px-4 py-3 border rounded-lg resize-y mb-4"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBanModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBan}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Ban Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
