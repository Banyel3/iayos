"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Calendar,
  User,
  Filter,
  X,
} from "lucide-react";
import Sidebar from "../../components/sidebar";
import { toast } from "sonner";

interface VerificationLog {
  cert_id: number;
  certification_name: string;
  worker_name: string;
  action: "APPROVED" | "REJECTED";
  reviewed_by_name: string;
  reviewed_at: string;
  reason: string | null;
}

export default function CertificationHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<
    "all" | "APPROVED" | "REJECTED"
  >("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, actionFilter, dateFrom, dateTo, page]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }
      if (actionFilter !== "all") {
        params.set("action", actionFilter);
      }
      if (dateFrom) {
        params.set("date_from", dateFrom);
      }
      if (dateTo) {
        params.set("date_to", dateTo);
      }

      const response = await fetch(
        `${API_BASE}/api/adminpanel/certifications/history?${params.toString()}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        throw new Error(`Failed to load history (${response.status})`);
      }

      const payload = await response.json();
      const data = payload?.data ?? payload;

      const normalized = Array.isArray(data?.history)
        ? data.history.map((entry: any) => ({
            cert_id:
              entry?.certification_id ??
              entry?.cert_id ??
              entry?.certificationID ??
              0,
            certification_name:
              entry?.certification_name ??
              entry?.certificationName ??
              "Certification",
            worker_name:
              entry?.worker_name ??
              entry?.workerName ??
              entry?.worker_email ??
              "Unknown Worker",
            action: (entry?.action ?? "APPROVED") as "APPROVED" | "REJECTED",
            reviewed_by_name:
              entry?.reviewed_by_name ??
              entry?.reviewedBy ??
              entry?.reviewed_by ??
              "System",
            reviewed_at:
              entry?.reviewed_at ??
              entry?.reviewedAt ??
              new Date().toISOString(),
            reason: entry?.reason ?? null,
          }))
        : [];

      setLogs(normalized);

      const pagination = data?.pagination ?? {};
      setTotalRecords(pagination?.total_records ?? normalized.length);
      setTotalPages(Math.max(1, pagination?.total_pages ?? 1));

      const serverPage = pagination?.page;
      if (
        typeof serverPage === "number" &&
        serverPage > 0 &&
        serverPage !== page
      ) {
        setPage(serverPage);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      toast.error("Failed to load verification history");
      setLogs([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setActionFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const exportToCSV = () => {
    // CSV headers
    const headers = [
      "Cert ID",
      "Certification Name",
      "Worker Name",
      "Action",
      "Reviewed By",
      "Reviewed At",
      "Reason",
    ];

    // Convert logs to CSV rows
    const rows = logs.map((log) => [
      log.cert_id,
      `"${log.certification_name}"`,
      `"${log.worker_name}"`,
      log.action,
      `"${log.reviewed_by_name}"`,
      new Date(log.reviewed_at).toLocaleString(),
      log.reason ? `"${log.reason}"` : "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `certification_history_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("History exported to CSV");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadge = (action: "APPROVED" | "REJECTED") => {
    if (action === "APPROVED") {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-green-500 text-green-700"
        >
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 border-red-500 text-red-700">
        <XCircle className="h-3 w-3" />
        Rejected
      </Badge>
    );
  };

  const filteredLogs = logs;

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord =
    totalRecords === 0 ? 0 : Math.min(page * pageSize, totalRecords);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-600 mx-auto"></div>
                <Clock className="h-6 w-6 text-gray-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading verification history...
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
      <main className="pl-72 p-8 min-h-screen">
        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-gray-700 to-gray-500 p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 pointer-events-none"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Verification History</h1>
              </div>
              <p className="text-gray-100 max-w-2xl">
                Complete audit trail of all certification verification actions
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/admin/certifications/pending")}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Shield className="h-4 w-4 mr-2" />
                Pending Review
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                disabled={filteredLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-600" />
                Search & Filters
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder="Search by certification, worker, or reviewer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Action Filter */}
              <select
                value={actionFilter}
                onChange={(e) =>
                  setActionFilter(
                    e.target.value as "all" | "APPROVED" | "REJECTED",
                  )
                }
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Actions</option>
                <option value="APPROVED">Approved Only</option>
                <option value="REJECTED">Rejected Only</option>
              </select>

              {/* Clear Filters */}
              {(searchTerm || actionFilter !== "all" || dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Date Range Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Records ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                  No verification records found
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {logs.length === 0
                    ? "No certifications have been reviewed yet"
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log, index) => (
                  <Card
                    key={index}
                    className="border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/certifications/${log.cert_id}`)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {log.certification_name}
                            </h3>
                            {getActionBadge(log.action)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>Worker: {log.worker_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-gray-400" />
                              <span>By: {log.reviewed_by_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{formatDate(log.reviewed_at)}</span>
                            </div>
                          </div>
                          {log.reason && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              "{log.reason}"
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {totalRecords > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between pt-4 mt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {startRecord}-{endRecord} of {totalRecords} records
                </p>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
