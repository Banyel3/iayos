"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Sidebar } from "../../components";

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
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<"suspend" | "activate" | null>(
    null
  );
  const [bulkActionReason, setBulkActionReason] = useState("");

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
        `http://localhost:8000/api/adminpanel/users/agencies?${params}`,
        {
          credentials: "include",
        }
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

        const response = await fetch(`http://localhost:8000${endpoint}`, {
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
      `${bulkAction === "suspend" ? "Suspended" : "Activated"} ${successCount} agencies successfully. ${failCount > 0 ? `${failCount} failed.` : ""}`
    );

    fetchAgencies();
  };

  const activeAgencies = agencies.filter((a) => a.status === "active").length;
  const totalWorkers = agencies.reduce((sum, a) => sum + a.total_workers, 0);
  const totalJobs = agencies.reduce((sum, a) => sum + a.total_jobs, 0);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Agency Management
              </h1>
              <p className="text-muted-foreground">
                Manage service agencies and their operations
              </p>
            </div>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Agencies
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Agencies
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAgencies}</div>
                <p className="text-xs text-muted-foreground">
                  Registered agencies
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Agencies
                </CardTitle>
                <Building2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAgencies}</div>
                <p className="text-xs text-muted-foreground">
                  Currently operating
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Workers
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  Across all agencies
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Jobs
                </CardTitle>
                <Briefcase className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalJobs}</div>
                <p className="text-xs text-muted-foreground">All agency jobs</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find agencies by name, email, or status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search agencies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "active" | "inactive"
                    )
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most_workers">Most Workers</option>
                  <option value="most_jobs">Most Jobs</option>
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
                          <tr
                            key={agency.id}
                            className="border-t hover:bg-gray-50"
                          >
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
                              {(currentPage - 1) * 50 + index + 1}
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
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  agency.kyc_status === "APPROVED"
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
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  agency.status === "active"
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
                                    `/admin/users/agency/${agency.account_id}`
                                  )
                                }
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
