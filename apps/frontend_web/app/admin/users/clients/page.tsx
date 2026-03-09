"use client";

import {
  useState, useEffect
} from "react";
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
  Calendar,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
  Star,
  TrendingUp,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../../components";
import { toast } from "sonner";

interface Client {
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
  jobs_posted?: number;
  jobs_active?: number;
  jobs_in_progress?: number;
  jobs_completed?: number;
  jobs_cancelled?: number;
  total_spent?: number;
  rating?: number;
  review_count?: number;
  is_agency?: boolean;
  agency_info?: {
    business_name: string;
    employee_count: number;
  };
}

interface ClientsResponse {
  success: boolean;
  clients: Client[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "most_jobs" | "highest_spending"
  >("newest");
  const [totalClients, setTotalClients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk selection state
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set(),
  );
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<"suspend" | "activate" | null>(
    null,
  );
  const [bulkActionReason, setBulkActionReason] = useState("");
  const mainClass = useMainContentClass("p-8 min-h-screen");

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "15",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sortBy !== "newest") params.append("sort", sortBy);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/users/clients?${params}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }

      const data: ClientsResponse = await response.json();

      if (data.success) {
        setClients(data.clients);
        setTotalClients(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    setSelectedClients(new Set()); // Clear selection on page/filter change
    setSelectAll(false);
  }, [currentPage, statusFilter, sortBy]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchClients();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(clients.map((c) => c.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
    setSelectAll(newSelected.size === clients.length);
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
      "Verified",
      "Join Date",
    ];
    const rows = clients.map((c) => [
      c.id,
      `${c.first_name} ${c.last_name}`,
      c.email,
      c.phone || "N/A",
      c.status,
      c.kyc_status,
      c.is_verified ? "Yes" : "No",
      c.join_date,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Bulk actions
  const handleBulkAction = async (action: "suspend" | "activate") => {
    setBulkAction(action);
    setShowBulkActionModal(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedClients.size === 0) return;

    setBulkActionLoading(true);
    const clientIds = Array.from(selectedClients);
    let successCount = 0;
    let failCount = 0;

    for (const clientId of clientIds) {
      try {
        const endpoint =
          bulkAction === "suspend"
            ? `/api/adminpanel/users/${clientId}/suspend`
            : `/api/adminpanel/users/${clientId}/activate`;

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
        console.error(`Failed to ${bulkAction} client ${clientId}:`, error);
        failCount++;
      }
    }

    setBulkActionLoading(false);
    setShowBulkActionModal(false);
    setBulkActionReason("");
    setSelectedClients(new Set());
    setSelectAll(false);

    toast.success(
      `${bulkAction === "suspend" ? "Suspended" : "Activated"} ${successCount} clients successfully. ${failCount > 0 ? `${failCount} failed.` : ""}`,
    );

    fetchClients();
  };

  const activeClients = clients.filter((c) => c.status === "active").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <Briefcase className="h-6 w-6 text-[#00BAF1] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading clients...
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
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          {/* Header */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clients Management</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Manage all job posters and service requesters
                </p>
              </div>
              <Button
                onClick={handleExport}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm transition-all"
              >
                <Download className="mr-2 h-5 w-5" />
                Export Clients
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Building2 className="h-5 w-5 text-[#00BAF1]" /></div>
                  <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Clients</p>
                <p className="text-xl font-bold text-gray-900">{totalClients}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Building2 className="h-5 w-5 text-[#00BAF1]" /></div>
                  <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Active Now</p>
                <p className="text-xl font-bold text-gray-900">{activeClients}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Star className="h-5 w-5 text-[#00BAF1]" /></div>
                  <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full opacity-50"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Verified Clients</p>
                <p className="text-xl font-bold text-gray-900">
                  {clients.filter((c) => c.is_verified).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <Input
                placeholder="Search clients by name, email, or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "active" | "inactive",
                )
              }
              className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_jobs">Most Jobs</option>
              <option value="highest_spending">Highest Spending</option>
            </select>
          </div>

          {/* Bulk Actions Bar */}
          {selectedClients.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 shadow-sm">
              <span className="text-sm font-medium text-blue-900 ml-2">
                {selectedClients.size} client(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("suspend")}
                  disabled={bulkActionLoading}
                  className="rounded-lg"
                >
                  Suspend Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("activate")}
                  disabled={bulkActionLoading}
                  className="rounded-lg"
                >
                  Activate Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedClients(new Set());
                    setSelectAll(false);
                  }}
                  className="rounded-lg"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Clients List</CardTitle>
              <CardDescription>
                Overview of all clients (Page {currentPage} of {totalPages})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading clients...</span>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No clients found
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
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Phone
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Jobs
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Rating
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Total Spent
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            KYC Status
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
                        {clients.map((client, index) => (
                          <tr
                            key={client.id}
                            className="border-t hover:bg-gray-50"
                          >
                            <td className="px-4 py-2">
                              <button
                                onClick={() => handleSelectClient(client.id)}
                                className="flex items-center justify-center"
                              >
                                {selectedClients.has(client.id) ? (
                                  <CheckSquare className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Square className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {(currentPage - 1) * 15 + index + 1}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium">
                              {client.first_name} {client.last_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {client.email}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {client.is_agency && client.agency_info ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-[#00BAF1]">
                                    Agency
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {client.agency_info.employee_count}{" "}
                                    {client.agency_info.employee_count === 1
                                      ? "employee"
                                      : "employees"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-600">
                                  Individual
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {client.phone || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <div
                                className="text-gray-900 font-medium cursor-help"
                                title={`Total: ${client.jobs_posted || 0}\nActive: ${client.jobs_active || 0}\nIn Progress: ${client.jobs_in_progress || 0}\nCompleted: ${client.jobs_completed || 0}\nCancelled: ${client.jobs_cancelled || 0}`}
                              >
                                {client.jobs_posted || 0}
                                {(client.jobs_posted || 0) > 0 && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({client.jobs_active || 0}A/
                                    {client.jobs_in_progress || 0}P/
                                    {client.jobs_completed || 0}C)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {client.rating && client.rating > 0 ? (
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                  <span>{client.rating.toFixed(1)}</span>
                                  <span className="text-gray-400 ml-1">
                                    ({client.review_count || 0})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">
                                  No reviews
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              ₱{(client.total_spent || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${client.kyc_status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : client.kyc_status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : client.kyc_status === "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                              >
                                {client.kyc_status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${client.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                                  }`}
                              >
                                {client.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/admin/users/clients/${client.id}`,
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
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${currentPage === 1 ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        // Simple pagination: only show a few pages if there are many
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
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bulk Action Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-2" />
              <h2 className="text-xl font-semibold">
                {bulkAction === "suspend" ? "Suspend" : "Activate"} Clients
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to {bulkAction} {selectedClients.size}{" "}
              client(s)?
            </p>
            {bulkAction === "suspend" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={bulkActionReason}
                  onChange={(e) => setBulkActionReason(e.target.value)}
                  className="w-full border rounded-md p-2"
                  rows={3}
                  placeholder="Enter reason for suspension..."
                />
              </div>
            )}
            {bulkActionLoading && (
              <div className="mb-4 flex items-center text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </div>
            )}
            <div className="flex gap-2 justify-end">
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
                className={
                  bulkAction === "suspend" ? "bg-red-600 hover:bg-red-700" : ""
                }
              >
                {bulkAction === "suspend" ? "Suspend" : "Activate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
