"use client";

import { useState, useEffect } from "react";
import { Sidebar, useMainContentClass } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Banknote,
  Search,
  Download,
  Eye,
  CheckCircle,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight,
  Star,
  Users,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Category {
  id: number;
  name: string;
}

interface CompletedJob {
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

export default function CompletedJobsPage() {
  const router = useRouter();
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const fetchCompletedJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "15",
        status: "COMPLETED",
      });

      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/jobs/listings?${params.toString()}`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        setTotalPages(data.total_pages);
        setTotalJobs(data.total || data.jobs.length);
      }
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedJobs();
  }, [page]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchCompletedJobs();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleExport = () => {
    const headers = [
      "ID",
      "Title",
      "Client",
      "Worker",
      "Paid",
      "Location",
      "Completed Date",
    ];
    const rows = jobs.map((job) => [
      job.id,
      job.title,
      job.client.name,
      job.worker?.name || "N/A",
      `₱${(job.budget || 0).toLocaleString()}`,
      job.location,
      job.completed_at ? new Date(job.completed_at).toLocaleDateString() : new Date(job.updated_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `completed_jobs_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPaid = jobs.reduce((sum, job) => sum + job.budget, 0);
  const avgRating = jobs.reduce((sum, job) => sum + (job.client.rating || 0), 0) / (jobs.length || 1);
  const successRate = 100; // Since they are all completed

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <CheckCircle className="h-6 w-6 text-[#00BAF1] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading completed jobs...
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
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Completed Jobs</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Successfully finished jobs with full payment completion
                </p>
              </div>
              <Button
                onClick={handleExport}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm transition-all"
              >
                <Download className="mr-2 h-5 w-5" />
                Export Completed Jobs
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Award className="h-5 w-5 text-[#00BAF1]" /></div>
                  <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Completed</p>
                <p className="text-xl font-bold text-gray-900">{totalJobs}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><CheckCircle className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Success Rate</p>
                <p className="text-xl font-bold text-gray-900">{successRate}%</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Banknote className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Paid</p>
                <p className="text-xl font-bold text-gray-900">₱{(totalPaid ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Star className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Avg Rating</p>
                <p className="text-xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <Input
                placeholder="Search completed jobs by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Completed Job Cards */}
          <div className="space-y-4">
            {loading && jobs.length > 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : jobs.map((job) => (
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
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                            ✓ Completed
                          </span>
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
                            <p className="text-xs text-gray-500 font-medium">Paid</p>
                            <p className="font-bold text-gray-900">₱{(job.budget ?? 0).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <MapPin className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Location</p>
                            <p className="font-semibold text-gray-900 truncate">{job.location}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <Calendar className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Finished</p>
                            <p className="font-semibold text-gray-900">
                              {job.completed_at
                                ? new Date(job.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                : new Date(job.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <Star className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Rating</p>
                            <p className="font-bold text-gray-900">
                              {job.client.rating ? `${job.client.rating.toFixed(1)} ⭐` : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Client / Worker Info */}
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
                        {job.worker && (
                          <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
                            <span className="text-sm text-gray-500">Worker:</span>
                            <Link
                              href={`/admin/users/workers/${job.worker.id}`}
                              className="text-sm font-semibold text-gray-700 hover:text-[#00BAF1] hover:underline flex items-center gap-1"
                            >
                              {job.worker.name}
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                        {job.category && (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              {job.category.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex md:flex-col gap-2 sm:gap-3">
                      <Button
                        size="sm"
                        className="w-full bg-[#00BAF1] hover:bg-sky-500 text-white shadow-md hover:shadow-lg transition-all"
                        onClick={() => router.push(`/admin/jobs/listings/${job.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
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
                  <CheckCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No completed jobs found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  There are no completed jobs matching your search yet.
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
