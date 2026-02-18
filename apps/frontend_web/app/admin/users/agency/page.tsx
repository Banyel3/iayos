"use client";

import React, { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Search,
  Download,
  Users,
  Loader2,
  Briefcase,
  CheckSquare,
  Square,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../../components";

interface Agency {
  id: string;
  account_id: string;
  email: string;
  agency_name: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  kyc_status: string;
  join_date: string;
  is_verified: boolean;
  total_workers: number;
  total_jobs: number;
  completed_jobs: number;
  rating: number;
  review_count: number;
  employees?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    rating: number;
    total_jobs_completed: number;
    total_earnings: number;
    is_employee_of_month: boolean;
    avatar?: string;
  }>;
}

interface AgenciesResponse {
  success: boolean;
  agencies: Agency[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function AgencyPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "most_workers" | "most_jobs"
  >("newest");
  const [totalAgencies, setTotalAgencies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk selection state
  const [selectedAgencies, setSelectedAgencies] = useState<Set<string>>(
    new Set(),
  );
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<"suspend" | "activate" | null>(
    null,
  );
  const [bulkActionReason, setBulkActionReason] = useState("");

  // Expandable rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const mainClass = useMainContentClass("p-8 min-h-screen");

  const toggleRowExpansion = (agencyId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(agencyId)) {
      newExpanded.delete(agencyId);
    } else {
      newExpanded.add(agencyId);
    }
    setExpandedRows(newExpanded);
  };

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "50",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sortBy !== "newest") params.append("sort", sortBy);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/users/agencies?${params}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch agencies");
      }

      const data: AgenciesResponse = await response.json();

      if (data.success) {
        setAgencies(data.agencies);
        setTotalAgencies(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching agencies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
    setSelectedAgencies(new Set());
    setSelectAll(false);
  }, [currentPage, statusFilter, sortBy]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchAgencies();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAgencies(new Set());
    } else {
      setSelectedAgencies(new Set(agencies.map((a) => a.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectAgency = (agencyId: string) => {
    const newSelected = new Set(selectedAgencies);
    if (newSelected.has(agencyId)) {
      newSelected.delete(agencyId);
    } else {
      newSelected.add(agencyId);
    }
    setSelectedAgencies(newSelected);
    setSelectAll(newSelected.size === agencies.length);
  };

  // Export to CSV
  const handleExport = () => {
    const headers = [
      "ID",
      "Agency Name",
      "Email",
      "Phone",
      "Status",
      "Workers",
      "Total Jobs",
      "Completed Jobs",
      "Rating",
    ];
    const rows = agencies.map((a) => [
      a.id,
      a.agency_name,
      a.email,
      a.phone || "N/A",
      a.status,
      a.total_workers,
      a.total_jobs,
      a.completed_jobs,
      a.rating.toFixed(1),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agencies_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Bulk actions
  const handleBulkAction = async (action: "suspend" | "activate") => {
    setBulkAction(action);
    setShowBulkActionModal(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedAgencies.size === 0) return;

    setBulkActionLoading(true);
    const agencyIds = Array.from(selectedAgencies);
    let successCount = 0;
    let failCount = 0;

    for (const agencyId of agencyIds) {
      try {
        const endpoint =
          bulkAction === "suspend"
            ? `/api/adminpanel/users/${agencyId}/suspend`
            : `/api/adminpanel/users/${agencyId}/activate`;

        const body =
          bulkAction === "suspend" && bulkActionReason
            ? { reason: bulkActionReason }
            : {};

        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Failed to ${bulkAction} agency ${agencyId}:`, error);
        failCount++;
      }
    }

    setBulkActionLoading(false);
    setShowBulkActionModal(false);
    setBulkActionReason("");
    setSelectedAgencies(new Set());
    setSelectAll(false);

    alert(
      `${bulkAction === "suspend" ? "Suspended" : "Activated"} ${successCount} agencies successfully. ${failCount > 0 ? `${failCount} failed.` : ""}`,
    );

    fetchAgencies();
  };

  const activeAgencies = agencies.filter((a) => a.status === "active").length;
  const totalWorkers = agencies.reduce((sum, a) => sum + a.total_workers, 0);
  const totalJobs = agencies.reduce((sum, a) => sum + a.total_jobs, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <Building2 className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading agencies...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Please wait while we fetch the data
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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-8 w-8" />
                    <h1 className="text-4xl font-bold">Agency Management</h1>
                  </div>
                  <p className="text-purple-100 text-lg">
                    Manage all agencies and their employee networks
                  </p>
                </div>
                <Button
                  onClick={handleExport}
                  className="bg-white/20 hover:bg-white/30 border-0 backdrop-blur-sm"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Export Agencies
                </Button>
              </div>
            </div>
          </div>

          {/* Modern Summary Cards with gradients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Agencies
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalAgencies}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Registered agencies
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <Building2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Active Now
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {activeAgencies}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Currently operating
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Workers
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {totalWorkers}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Across all agencies
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Briefcase className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Jobs
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {totalJobs}
                </p>
                <p className="text-xs text-gray-500 mt-1">All agency jobs</p>
              </CardContent>
            </Card>
          </div>

          {/* Modern Filters Card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Search agencies by name, email, or business..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "active" | "inactive",
                    )
                  }
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="all">📋 All Status</option>
                  <option value="active">✓ Active</option>
                  <option value="inactive">✘ Inactive</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="newest">🆕 Newest First</option>
                  <option value="oldest">📅 Oldest First</option>
                  <option value="most_workers">👥 Most Workers</option>
                  <option value="most_jobs">💼 Most Jobs</option>
                </select>
              </div>

              {/* Bulk Actions Bar */}
              {selectedAgencies.size > 0 && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedAgencies.size} agency/agencies selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction("suspend")}
                      disabled={bulkActionLoading}
                    >
                      Suspend Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction("activate")}
                      disabled={bulkActionLoading}
                    >
                      Activate Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAgencies(new Set());
                        setSelectAll(false);
                      }}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agencies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Agencies List</CardTitle>
              <CardDescription>
                Overview of all agencies (Page {currentPage} of {totalPages})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">
                    Loading agencies...
                  </span>
                </div>
              ) : agencies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No agencies found
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-md">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">
                            <button
                              onClick={handleSelectAll}
                              className="flex items-center justify-center"
                            >
                              {selectAll ? (
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            #
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Agency Name
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Workers
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Jobs
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Rating
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            KYC
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {agencies.map((agency, index) => (
                          <React.Fragment key={agency.id}>
                            <tr className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => handleSelectAgency(agency.id)}
                                  className="flex items-center justify-center"
                                >
                                  {selectedAgencies.has(agency.id) ? (
                                    <CheckSquare className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Square className="h-4 w-4 text-gray-400" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <button
                                  onClick={() => toggleRowExpansion(agency.id)}
                                  className="flex items-center space-x-1"
                                >
                                  {expandedRows.has(agency.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span>
                                    {(currentPage - 1) * 50 + index + 1}
                                  </span>
                                </button>
                              </td>
                              <td className="px-4 py-2 text-sm font-medium">
                                {agency.agency_name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {agency.email}
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  {agency.total_workers}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                {agency.total_jobs}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                  <span>{agency.rating.toFixed(1)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${agency.kyc_status === "APPROVED"
                                      ? "bg-green-100 text-green-800"
                                      : agency.kyc_status === "PENDING"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : agency.kyc_status === "REJECTED"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {agency.kyc_status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${agency.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {agency.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/admin/users/agency/${agency.account_id}`,
                                    )
                                  }
                                >
                                  View
                                </Button>
                              </td>
                            </tr>

                            {/* Expandable Employee Details Row */}
                            {expandedRows.has(agency.id) &&
                              agency.employees &&
                              agency.employees.length > 0 && (
                                <tr
                                  key={`${agency.id}-employees`}
                                  className="bg-gray-50"
                                >
                                  <td colSpan={10} className="px-4 py-4">
                                    <div className="ml-8">
                                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                        Employees ({agency.employees.length})
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {agency.employees.map((employee) => (
                                          <div
                                            key={employee.id}
                                            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                          >
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                  <h5 className="text-sm font-medium text-gray-900">
                                                    {employee.name}
                                                  </h5>
                                                  {employee.is_employee_of_month && (
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                      ⭐ EOTM
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                  {employee.role}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                  {employee.email}
                                                </p>
                                                <div className="flex items-center space-x-4 mt-2">
                                                  <div className="flex items-center">
                                                    <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                                    <span className="text-xs font-medium">
                                                      {employee.rating.toFixed(
                                                        1,
                                                      )}
                                                    </span>
                                                  </div>
                                                  <div className="text-xs text-gray-600">
                                                    <span className="font-medium">
                                                      {
                                                        employee.total_jobs_completed
                                                      }
                                                    </span>{" "}
                                                    jobs
                                                  </div>
                                                  <div className="text-xs text-gray-600">
                                                    ₱
                                                    {(
                                                      employee.total_earnings ??
                                                      0
                                                    ).toLocaleString()}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bulk Action Confirmation Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Confirm Bulk{" "}
                  {bulkAction === "suspend" ? "Suspension" : "Activation"}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You are about to {bulkAction} {selectedAgencies.size}{" "}
                  agency/agencies. This action will affect their account status.
                </p>

                {bulkAction === "suspend" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Suspension (Optional)
                    </label>
                    <textarea
                      value={bulkActionReason}
                      onChange={(e) => setBulkActionReason(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter reason for suspension..."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkActionModal(false);
                  setBulkActionReason("");
                }}
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={executeBulkAction}
                disabled={bulkActionLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {bulkActionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Confirm ${bulkAction === "suspend" ? "Suspension" : "Activation"}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
