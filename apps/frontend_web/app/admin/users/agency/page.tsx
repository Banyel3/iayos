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
} from "lucide-react";
import { Sidebar } from "../../components";

interface Agency {
  id: string;
  account_id: string;
  email: string;
  agency_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website: string;
  description: string;
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [totalAgencies, setTotalAgencies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "50",
      });
      
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

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
  }, [currentPage, statusFilter]);

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
            <Button>
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
              <div className="flex gap-4">
                <div className="flex-1">
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
                  <span className="ml-2 text-gray-600">Loading agencies...</span>
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
                            Phone
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Location
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Workers
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Jobs
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
                        {agencies.map((agency, index) => (
                          <tr key={agency.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">
                              {(currentPage - 1) * 50 + index + 1}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium">
                              {agency.agency_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {agency.email}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {agency.phone || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {agency.city && agency.state ? `${agency.city}, ${agency.state}` : "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm text-center">
                              {agency.total_workers}
                            </td>
                            <td className="px-4 py-2 text-sm text-center">
                              {agency.total_jobs}
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
                                  router.push(`/admin/users/agency/${agency.id}`)
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
