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
  Eye,
  Ban,
  UserX,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
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

  // Action forms
  const [adminNotes, setAdminNotes] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7");
  const [suspendReason, setSuspendReason] = useState("");
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/reports?${params.toString()}`,
        { credentials: "include" },
      );
      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
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

  const filteredReports = reports.filter((report) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        report.reporter_name.toLowerCase().includes(search) ||
        report.reported_user_name.toLowerCase().includes(search) ||
        report.description.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-pink-700 p-4 sm:p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold">
                      User Reports
                    </h1>
                  </div>
                  <p className="text-red-100 text-sm sm:text-lg">
                    Review and moderate reported content and users
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by reporter, reported user, or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 leading-none">
                      Status
                    </p>
                    <div className="flex overflow-x-auto pb-1 gap-2 custom-scrollbar -mx-1 px-1">
                      {[
                        "all",
                        "pending",
                        "investigating",
                        "resolved",
                        "dismissed",
                      ].map((status) => (
                        <Button
                          key={status}
                          variant={
                            statusFilter === status ? "default" : "outline"
                          }
                          size="sm"
                          className={`whitespace-nowrap px-4 h-9 rounded-xl font-bold ${statusFilter === status ? "bg-red-600 text-white shadow-md shadow-red-100" : "text-gray-600 hover:bg-red-50 hover:text-red-600 border-2"}`}
                          onClick={() => setStatusFilter(status)}
                        >
                          {status === "all"
                            ? "All"
                            : STATUS_CONFIG[
                                status as keyof typeof STATUS_CONFIG
                              ]?.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 leading-none">
                      Type
                    </p>
                    <div className="flex overflow-x-auto pb-1 gap-2 custom-scrollbar -mx-1 px-1">
                      {["all", "user", "job", "review", "message"].map(
                        (type) => (
                          <Button
                            key={type}
                            variant={
                              typeFilter === type ? "default" : "outline"
                            }
                            size="sm"
                            className={`whitespace-nowrap px-4 h-9 rounded-xl font-bold ${typeFilter === type ? "bg-red-600 text-white shadow-md shadow-red-100" : "text-gray-600 hover:bg-red-50 hover:text-red-600 border-2"}`}
                            onClick={() => setTypeFilter(type)}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}{" "}
                            Report
                          </Button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table / Cards */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        Report ID
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        Reporter
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        Reported User
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        Type & Reason
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse mx-auto mb-3" />
                          <p className="text-gray-500 font-bold tracking-tight">
                            Syncing reports...
                          </p>
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-20 text-center">
                          <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                            <div className="p-4 bg-gray-50 rounded-full">
                              <AlertTriangle className="h-8 w-8 text-gray-300" />
                            </div>
                            <p className="text-lg font-bold text-gray-900 leading-tight">
                              No reports match your filters
                            </p>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">
                              Try broadening your search criteria or resetting
                              filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr
                          key={report.id}
                          className="hover:bg-red-50/30 transition-colors group cursor-pointer"
                          onClick={() => handleViewDetail(report.id)}
                        >
                          <td className="px-6 py-4 text-sm font-black text-gray-400">
                            #{report.id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-gray-900 truncate tracking-tight">
                                {report.reporter_name}
                              </span>
                              {report.reporter_total_reports > 1 && (
                                <span className="text-[10px] text-gray-400 font-bold tracking-tight">
                                  {report.reporter_total_reports} reports
                                  submitted
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-gray-900 truncate tracking-tight">
                                {report.reported_user_name}
                              </span>
                              {report.reported_user_total_reports > 3 && (
                                <span className="text-[10px] text-red-600 font-black tracking-tight uppercase">
                                  {report.reported_user_total_reports} times
                                  reported
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <Badge
                                className={`${CONTENT_TYPE_CONFIG[report.reported_content_type]?.color} border-0 font-bold px-2 py-0.5 text-[9px] uppercase tracking-wider w-fit h-4`}
                              >
                                {report.reported_content_type}
                              </Badge>
                              <Badge
                                className={`${REASON_CONFIG[report.reason]?.color} border-0 font-bold px-2 py-0.5 text-[9px] uppercase tracking-wider w-fit h-4`}
                              >
                                {report.reason}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p
                              className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs truncate"
                              title={report.description}
                            >
                              {report.description}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={`${STATUS_CONFIG[report.status].color} border-0 font-bold px-2 py-0.5 flex items-center gap-1.5 w-fit h-5 uppercase text-[9px] tracking-widest`}
                            >
                              {(() => {
                                const Icon = STATUS_CONFIG[report.status].icon;
                                return <Icon className="h-2.5 w-2.5" />;
                              })()}
                              {STATUS_CONFIG[report.status].label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-[11px] font-bold text-gray-500 tracking-tight">
                            {new Date(report.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-red-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
                                <Eye className="h-4 w-4" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="lg:hidden divide-y divide-gray-100">
                {loading ? (
                  <div className="p-12 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500 tracking-tight">
                      Loading reports...
                    </p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-bold text-gray-900 mb-1">
                      No reports found
                    </p>
                    <p className="text-xs text-gray-500 font-bold">
                      Try different filter settings
                    </p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 bg-white active:bg-red-50 transition-colors"
                      onClick={() => handleViewDetail(report.id)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase leading-none">
                              #{report.id}
                            </span>
                            <Badge
                              className={`${STATUS_CONFIG[report.status].color} border-0 font-black text-[9px] px-1.5 py-0 leading-none h-4 uppercase tracking-widest flex items-center gap-1`}
                            >
                              {(() => {
                                const Icon = STATUS_CONFIG[report.status].icon;
                                return <Icon className="h-2 w-2" />;
                              })()}
                              {STATUS_CONFIG[report.status].label}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">
                            Report against {report.reported_user_name}
                          </h3>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Badge
                          className={`${CONTENT_TYPE_CONFIG[report.reported_content_type]?.color} border-0 font-black text-[9px] px-1.5 py-0 leading-none h-5 uppercase tracking-wider`}
                        >
                          {report.reported_content_type}
                        </Badge>
                        <Badge
                          className={`${REASON_CONFIG[report.reason]?.color} border-0 font-black text-[9px] px-1.5 py-0 leading-none h-5 uppercase tracking-wider`}
                        >
                          {report.reason}
                        </Badge>
                        {report.reported_user_total_reports > 3 && (
                          <Badge className="bg-red-600 text-white border-0 font-black text-[9px] px-1.5 py-0 leading-none h-5 uppercase tracking-wider">
                            High Risk!
                          </Badge>
                        )}
                      </div>

                      <div className="p-3 bg-gray-50 rounded-xl mb-4 border border-gray-100">
                        <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-2 italic">
                          "{report.description}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 tracking-tight uppercase">
                          <Clock className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400">
                          By{" "}
                          <span className="text-gray-900">
                            {report.reporter_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
