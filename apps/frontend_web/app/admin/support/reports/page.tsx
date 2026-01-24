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
} from "lucide-react";
import { Sidebar } from "../../components";

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
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(
    null
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
        { credentials: "include" }
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
        { credentials: "include" }
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
        }
      );

      setShowWarningModal(false);
      setShowDetailModal(false);
      fetchReports();
      alert("Warning sent successfully");
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
        }
      );

      setShowSuspendModal(false);
      setShowDetailModal(false);
      fetchReports();
      alert("User suspended successfully");
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
        }
      );

      setShowBanModal(false);
      setShowDetailModal(false);
      fetchReports();
      alert("User banned successfully");
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
        }
      );

      setShowDetailModal(false);
      fetchReports();
      alert("Report dismissed");
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-pink-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <AlertTriangle className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-bold">User Reports</h1>
                  </div>
                  <p className="text-red-100 text-lg">
                    Review and moderate reported content and users
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by reporter, reported user, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 self-center">
                    Status:
                  </span>
                  {[
                    "all",
                    "pending",
                    "investigating",
                    "resolved",
                    "dismissed",
                  ].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === "all"
                        ? "All"
                        : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
                            ?.label}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 self-center">
                    Type:
                  </span>
                  {["all", "user", "job", "review", "message"].map((type) => (
                    <Button
                      key={type}
                      variant={typeFilter === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTypeFilter(type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)} Report
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Report ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reporter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reported User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Content Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center">
                          <AlertTriangle className="h-8 w-8 text-gray-400 animate-pulse mx-auto" />
                          <p className="text-gray-500 mt-2">
                            Loading reports...
                          </p>
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center">
                          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto" />
                          <p className="text-gray-500 font-medium mt-2">
                            No reports found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr
                          key={report.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            #{report.id}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {report.reporter_name}
                              </p>
                              {report.reporter_total_reports > 1 && (
                                <p className="text-xs text-gray-500">
                                  {report.reporter_total_reports} reports
                                  submitted
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {report.reported_user_name}
                              </p>
                              {report.reported_user_total_reports > 3 && (
                                <Badge className="bg-red-100 text-red-700 text-xs mt-1">
                                  {report.reported_user_total_reports} times
                                  reported
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                CONTENT_TYPE_CONFIG[
                                  report.reported_content_type
                                ]?.color
                              }
                            >
                              {report.reported_content_type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={REASON_CONFIG[report.reason]?.color}
                            >
                              {report.reason}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <p
                              className="text-sm text-gray-700 max-w-xs truncate"
                              title={report.description}
                            >
                              {report.description}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={STATUS_CONFIG[report.status].color}
                            >
                              {STATUS_CONFIG[report.status].label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(report.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetail(report.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
