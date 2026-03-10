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
import { useMainContentClass, AdminPagination } from "../../components";
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
  const mainClass = useMainContentClass("p-6 min-h-screen");
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
  const pageSize = 15;

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
      <div className="min-h-screen">
        <Sidebar />
        <main className={mainClass}>
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
    <div className="min-h-screen">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          {/* Header */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Verification History</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Complete audit trail of all certification verification actions
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => router.push("/admin/certifications/pending")}
                  className="bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 h-10 rounded-xl"
                >
                  <Shield className="h-4 w-4 mr-2 text-[#00BAF1]" />
                  Pending Review
                </Button>
                <Button
                  onClick={exportToCSV}
                  className="bg-[#00BAF1] hover:bg-[#0098C7] text-white h-10 rounded-xl"
                  disabled={filteredLogs.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#00BAF1] transition-colors" />
                <Input
                  placeholder="Search by certification, worker, or reviewer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
                />
              </div>

              <select
                value={actionFilter}
                onChange={(e) =>
                  setActionFilter(
                    e.target.value as "all" | "APPROVED" | "REJECTED",
                  )
                }
                className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
              >
                <option value="all">All Actions</option>
                <option value="APPROVED">Approved Only</option>
                <option value="REJECTED">Rejected Only</option>
              </select>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-12 px-6 rounded-xl border-2 transition-all font-medium ${showFilters
                    ? "border-[#00BAF1] bg-sky-50 text-[#00BAF1]"
                    : "border-gray-200 text-gray-700 hover:border-[#00BAF1]"
                  }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Dates
              </Button>

              {(searchTerm || actionFilter !== "all" || dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="h-12 px-4 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>
            )}
          </div>

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
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                {log.certification_name}
                              </h3>
                              <div className="w-fit">
                                {getActionBadge(log.action)}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
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

              <AdminPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalRecords}
                itemsPerPage={15}
                itemLabel="records"
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
