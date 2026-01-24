"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Download,
  AlertCircle,
  Loader2,
  User,
  Filter,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  kycId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client" | "agency";
  action: "approved" | "rejected" | "submitted" | "under_review";
  performedBy: string;
  timestamp: string;
  notes?: string;
  previousStatus?: string;
  newStatus?: string;
}

import { Sidebar } from "../../components";

export default function KYCAuditLogPage() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the real KYC logs endpoint
      const response = await fetch(
        `${API_BASE}/api/adminpanel/kyc/logs`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication required. Please log in again.");
        } else {
          setError(`Failed to fetch audit logs: ${response.status}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.logs) {
        // Transform backend response to frontend interface
        const transformedLogs: AuditLogEntry[] = data.logs.map((log: any) => ({
          id: log.kycLogID?.toString() || "",
          kycId: log.kycID?.toString() || "",
          userName: log.userEmail?.split("@")[0] || "Unknown User",
          userEmail: log.userEmail || "",
          userType: (log.kycType === "AGENCY" ? "agency" : "worker") as
            | "worker"
            | "client"
            | "agency",
          action:
            log.action?.toLowerCase() === "approved"
              ? "approved"
              : log.action?.toLowerCase() === "rejected"
                ? "rejected"
                : "submitted",
          performedBy: log.reviewedBy || "System",
          timestamp:
            log.reviewedAt || log.createdAt || new Date().toISOString(),
          notes: log.reason || undefined,
          previousStatus: "pending",
          newStatus:
            log.action?.toLowerCase() === "approved"
              ? "approved"
              : log.action?.toLowerCase() === "rejected"
                ? "rejected"
                : "pending",
        }));
        setAuditLogs(transformedLogs);
      } else {
        setAuditLogs([]);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to load audit logs. Please try again.");
      setAuditLogs([]);
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "submitted":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "under_review":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "submitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "under_review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    Error Loading Audit Logs
                  </h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <Button
                    onClick={fetchAuditLogs}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  KYC Audit Log
                </h1>
                <p className="text-muted-foreground">
                  Track all KYC verification activities and changes
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/kyc")}
                >
                  Back to KYC
                </Button>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Export Audit Log
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Actions
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auditLogs.length}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Approved
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {auditLogs.filter((l) => l.action === "approved").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Rejected
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {auditLogs.filter((l) => l.action === "rejected").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Submissions
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {auditLogs.filter((l) => l.action === "submitted").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Audit Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by user name, email, or admin..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Actions</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="under_review">Under Review</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Audit Log Timeline */}
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <Card
                  key={log.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(log.action)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium border ${getActionColor(
                                  log.action
                                )}`}
                              >
                                {log.action.toUpperCase()}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg">
                              {log.userName}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                ({log.userType})
                              </span>
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {log.userEmail}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/kyc/${log.kycId}`)
                            }
                          >
                            View KYC
                          </Button>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center text-sm">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Performed by:{" "}
                            </span>
                            <span className="ml-1 font-medium">
                              {log.performedBy}
                            </span>
                          </div>

                          {log.previousStatus && log.newStatus && (
                            <div className="flex items-center text-sm">
                              <span className="text-muted-foreground">
                                Status changed:{" "}
                              </span>
                              <span className="ml-1">
                                <span className="font-medium">
                                  {log.previousStatus}
                                </span>
                                <span className="mx-2">→</span>
                                <span className="font-medium">
                                  {log.newStatus}
                                </span>
                              </span>
                            </div>
                          )}

                          {log.notes && (
                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Notes:
                              </p>
                              <p className="text-sm text-gray-600">
                                {log.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {index < filteredLogs.length - 1 && (
                      <div className="mt-4 border-t" />
                    )}
                  </CardContent>
                </Card>
              ))}

              {filteredLogs.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">
                      No Audit Logs Found
                    </h3>
                    <p className="text-muted-foreground">
                      No matching audit log entries
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
