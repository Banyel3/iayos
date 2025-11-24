"use client";

import { useState, useEffect } from "react";
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
  UserCheck,
  Star,
  Search,
  Download,
  Loader2,
  Briefcase,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { Sidebar } from "../../components";
import { useRouter } from "next/navigation";

interface Worker {
  id: string;
  profile_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  kyc_status: string;
  join_date: string;
  is_verified: boolean;
  total_jobs?: number;
  jobs_active?: number;
  jobs_in_progress?: number;
  jobs_completed?: number;
  jobs_cancelled?: number;
  rating: number;
  review_count: number;
  skills?: Array<{ name: string; experience_years: number }>;
  skills_count?: number;
  total_earnings?: number;
}

interface WorkersResponse {
  success: boolean;
  workers: Worker[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function WorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [verificationFilter, setVerificationFilter] = useState<
    "all" | "verified" | "pending" | "unverified"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "top_rated" | "most_jobs"
  >("newest");
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk selection state
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<"suspend" | "activate" | null>(
    null
  );
  const [bulkActionReason, setBulkActionReason] = useState("");

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "50",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (verificationFilter !== "all")
        params.append("verification_status", verificationFilter);
      if (sortBy !== "newest") params.append("sort", sortBy);

      const response = await fetch(
        `http://localhost:8000/api/adminpanel/users/workers?${params}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch workers");
      }

      const data: WorkersResponse = await response.json();

      if (data.success) {
        setWorkers(data.workers);
        setTotalWorkers(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    setSelectedWorkers(new Set());
    setSelectAll(false);
  }, [currentPage, statusFilter, verificationFilter, sortBy]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchWorkers();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedWorkers(new Set());
    } else {
      setSelectedWorkers(new Set(workers.map((w) => w.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectWorker = (workerId: string) => {
    const newSelected = new Set(selectedWorkers);
    if (newSelected.has(workerId)) {
      newSelected.delete(workerId);
    } else {
      newSelected.add(workerId);
    }
    setSelectedWorkers(newSelected);
    setSelectAll(newSelected.size === workers.length);
  };

  // Export to CSV
  const handleExport = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Status",
      "KYC Status",
      "Completed Jobs",
      "Rating",
      "Verified",
    ];
    const rows = workers.map((w) => [
      w.id,
      `${w.first_name} ${w.last_name}`,
      w.email,
      w.phone || "N/A",
      w.status,
      w.kyc_status,
      w.jobs_completed || 0,
      w.rating.toFixed(1),
      w.is_verified ? "Yes" : "No",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workers_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Bulk actions
  const handleBulkAction = async (action: "suspend" | "activate") => {
    setBulkAction(action);
    setShowBulkActionModal(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedWorkers.size === 0) return;

    setBulkActionLoading(true);
    const workerIds = Array.from(selectedWorkers);
    let successCount = 0;
    let failCount = 0;

    for (const workerId of workerIds) {
      try {
        const endpoint =
          bulkAction === "suspend"
            ? `/api/adminpanel/users/${workerId}/suspend`
            : `/api/adminpanel/users/${workerId}/activate`;

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
        console.error(`Failed to ${bulkAction} worker ${workerId}:`, error);
        failCount++;
      }
    }

    setBulkActionLoading(false);
    setShowBulkActionModal(false);
    setBulkActionReason("");
    setSelectedWorkers(new Set());
    setSelectAll(false);

    alert(
      `${bulkAction === "suspend" ? "Suspended" : "Activated"} ${successCount} workers successfully. ${failCount > 0 ? `${failCount} failed.` : ""}`
    );

    fetchWorkers();
  };

  const activeWorkers = workers.filter((w) => w.status === "active").length;
  const totalCompletedJobs = workers.reduce(
    (sum, w) => sum + (w.jobs_completed || 0),
    0
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Workers Management
              </h1>
              <p className="text-muted-foreground">
                Manage all service providers in the platform
              </p>
            </div>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Workers
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Workers
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered workers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Workers
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeWorkers}</div>
                <p className="text-xs text-muted-foreground">Ready to work</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Verified Workers
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workers.filter((w) => w.is_verified).length}
                </div>
                <p className="text-xs text-muted-foreground">Email verified</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Jobs
                </CardTitle>
                <Briefcase className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCompletedJobs}</div>
                <p className="text-xs text-muted-foreground">Completed jobs</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find workers by name, email, or status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search workers..."
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
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="unverified">Unverified</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="top_rated">Top Rated</option>
                  <option value="most_jobs">Most Jobs</option>
                </select>
              </div>

              {/* Bulk Actions Bar */}
              {selectedWorkers.size > 0 && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedWorkers.size} worker(s) selected
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
                        setSelectedWorkers(new Set());
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

          {/* Workers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Workers List</CardTitle>
              <CardDescription>
                Overview of all workers (Page {currentPage} of {totalPages})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading workers...</span>
                </div>
              ) : workers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No workers found
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
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Skills
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
                        {workers.map((worker, index) => (
                          <tr
                            key={worker.id}
                            className="border-t hover:bg-gray-50"
                          >
                            <td className="px-4 py-2">
                              <button
                                onClick={() => handleSelectWorker(worker.id)}
                                className="flex items-center justify-center"
                              >
                                {selectedWorkers.has(worker.id) ? (
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
                              {worker.first_name} {worker.last_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {worker.email}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {worker.skills && worker.skills.length > 0
                                ? `${worker.skills
                                    .slice(0, 2)
                                    .map((s) => s.name)
                                    .join(
                                      ", "
                                    )}${worker.skills.length > 2 ? ` +${worker.skills.length - 2}` : ""}`
                                : "No skills"}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <div
                                className="text-gray-900 font-medium cursor-help"
                                title={`Total: ${worker.total_jobs || 0}\nActive: ${worker.jobs_active || 0}\nIn Progress: ${worker.jobs_in_progress || 0}\nCompleted: ${worker.jobs_completed || 0}\nCancelled: ${worker.jobs_cancelled || 0}`}
                              >
                                {worker.total_jobs || 0}
                                {(worker.total_jobs || 0) > 0 && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({worker.jobs_active || 0}A/
                                    {worker.jobs_in_progress || 0}P/
                                    {worker.jobs_completed || 0}C)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                <span>{worker.rating.toFixed(1)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  worker.kyc_status === "APPROVED"
                                    ? "bg-green-100 text-green-800"
                                    : worker.kyc_status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : worker.kyc_status === "REJECTED"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {worker.kyc_status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  worker.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {worker.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/admin/users/workers/${worker.id}`
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
                  You are about to {bulkAction} {selectedWorkers.size}{" "}
                  worker(s). This action will affect their account status.
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
