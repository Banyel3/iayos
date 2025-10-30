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
  Calendar,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Sidebar } from "../../components";

interface Client {
  id: string;
  profile_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  status: "active" | "inactive";
  kyc_status: string;
  join_date: string;
  is_verified: boolean;
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [totalClients, setTotalClients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "50",
      });
      
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(
        `http://localhost:8000/api/adminpanel/users/clients?${params}`,
        {
          credentials: "include",
        }
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
  }, [currentPage, statusFilter]);

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

  const activeClients = clients.filter((c) => c.status === "active").length;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Clients Management
              </h1>
              <p className="text-muted-foreground">
                Manage all service requesters in the platform
              </p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Clients
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clients
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  Registered clients
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Clients
                </CardTitle>
                <Building2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeClients}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Verified Clients
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.filter((c) => c.is_verified).length}
                </div>
                <p className="text-xs text-muted-foreground">Email verified</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find clients by name, email, or status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "all" | "active" | "inactive")
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </CardContent>
          </Card>

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
                            Phone
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Location
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
                          <tr key={client.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">
                              {(currentPage - 1) * 50 + index + 1}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium">
                              {client.first_name} {client.last_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {client.email}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {client.phone || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {client.location || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  client.kyc_status === "APPROVED"
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
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  client.status === "active"
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
                                  router.push(`/admin/users/clients/${client.id}`)
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
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
    </div>
  );
}
