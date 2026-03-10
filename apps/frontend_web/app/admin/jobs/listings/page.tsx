"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar, useMainContentClass } from "../../components";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Banknote,
  Search,
  Download,
  Eye,
  MapPin,
  Calendar,
  Users,
  Clock,
  Trash2,
  Briefcase,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
}

interface JobListing {
  id: string;
  title: string;
  description: string;
  category: Category | null;
  client: {
    id: string;
    name: string;
    rating: number;
  };
  worker: {
    id: string;
    name: string;
    rating: number;
  } | null;
  budget: number;
  location: string;
  urgency: string;
  status: string;
  applications_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export default function JobListingsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const mainClass = useMainContentClass("p-8 min-h-screen");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "15",
      });

      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/jobs/listings?${params}`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        // Filter out INVITE-type jobs if needed - standardizing logic from original
        const listingJobs = (data.jobs || []).filter(
          (job: any) =>
            job.job_type === "LISTING" ||
            job.jobType === "LISTING" ||
            !job.job_type,
        );
        setJobs(listingJobs);
        setTotalPages(data.total_pages);
        setTotalJobs(data.total || listingJobs.length);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchJobs();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const deleteJob = async (jobId: string, jobTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the job "${jobTitle}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setDeletingJobId(jobId);
      const response = await fetch(
        `${API_BASE}/api/adminpanel/jobs/listings/${jobId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Job deleted successfully");
        fetchJobs(); // Refresh the list
      } else {
        toast.error(data.error || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(getErrorMessage(error, "Failed to delete job"));
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Title",
      "Client",
      "Budget",
      "Location",
      "Status",
      "Applications",
      "Posted Date",
    ];
    const rows = jobs.map((job) => [
      job.id,
      job.title,
      job.client.name,
      `₱${(job.budget || 0).toLocaleString()}`,
      job.location,
      job.status,
      job.applications_count,
      new Date(job.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobs_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const activeJobs = jobs.filter((j) => j.status === "ACTIVE").length;

  if (loading && jobs.length === 0) {
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
                Loading job listings...
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
                  <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Job Listings</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Manage all open job posts and worker applications
                </p>
              </div>
              <Button
                onClick={handleExport}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm transition-all"
              >
                <Download className="mr-2 h-5 w-5" />
                Export Jobs
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><FileText className="h-5 w-5 text-[#00BAF1]" /></div>
                  <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Listings</p>
                <p className="text-xl font-bold text-gray-900">{totalJobs}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Clock className="h-5 w-5 text-[#00BAF1]" /></div>
                  <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Active Now</p>
                <p className="text-xl font-bold text-gray-900">{activeJobs}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Users className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Applications</p>
                <p className="text-xl font-bold text-gray-900">
                  {jobs.reduce((sum, job) => sum + job.applications_count, 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><AlertCircle className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">High Priority</p>
                <p className="text-xl font-bold text-gray-900">
                  {jobs.filter((job) => job.urgency === "HIGH").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <Input
                placeholder="Search jobs by title, client, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="">All Status</option>
            </select>
          </div>

          {/* Jobs List (reverted to Cards) */}
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="relative p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Title and Badges */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors">
                            {job.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : job.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-800"
                                : job.status === "COMPLETED"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {job.status.replace("_", " ")}
                          </span>
                          {job.urgency && (
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${job.urgency === "HIGH"
                                ? "bg-red-100 text-red-700"
                                : job.urgency === "MEDIUM"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                                }`}
                            >
                              {job.urgency}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 leading-relaxed line-clamp-2">
                          {job.description}
                        </p>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <Banknote className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Budget
                            </p>
                            <p className="font-bold text-gray-900">
                              ₱{(job.budget ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <MapPin className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Location
                            </p>
                            <p className="font-semibold text-gray-900 truncate">
                              {job.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <Users className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Applications
                            </p>
                            <p className="font-bold text-gray-900">
                              {job.applications_count}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <Calendar className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Posted
                            </p>
                            <p className="font-semibold text-gray-900">
                              {new Date(job.created_at).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Client and Category Info */}
                      <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Client:</span>
                          <Link
                            href={`/admin/users/clients/${job.client.id}`}
                            className="text-sm font-semibold text-gray-700 hover:text-[#00BAF1] hover:underline flex items-center gap-1"
                          >
                            {job.client.name}
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                        {job.category && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Category:
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              {job.category.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 md:flex md:flex-col gap-2 sm:gap-3">
                      <Button
                        size="sm"
                        className="w-full bg-[#00BAF1] hover:bg-sky-500 text-white shadow-md hover:shadow-lg transition-all text-xs sm:text-sm"
                        onClick={() => router.push(`/admin/jobs/listings/${job.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteJob(job.id, job.title)}
                        disabled={deletingJobId === job.id}
                        className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all text-xs sm:text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
                        {deletingJobId === job.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {jobs.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <AlertCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No jobs match your current filters. Try adjusting your search
                  criteria or status filter.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${page === 1 ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                if (totalPages > 7) {
                  if (p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                    if (p === 2 || p === totalPages - 1) return <span key={p} className="w-4 text-center text-gray-400">...</span>;
                    return null;
                  }
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${p === page ? "bg-[#00BAF1] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${page === totalPages ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
