"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Eye,
  CheckCircle,
  DollarSign,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";

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
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCompletedJobs();
  }, [page]);

  const fetchCompletedJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE}/api/adminpanel/jobs/listings?page=${page}&page_size=20&status=COMPLETED`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.category?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPaid = jobs.reduce((sum, job) => sum + job.budget, 0);
  const avgRating =
    jobs.reduce((sum, job) => sum + (job.client.rating || 0), 0) /
    (jobs.length || 1);
  const successRate = jobs.length > 0 ? 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <CheckCircle className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
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
      <main className="pl-72 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-8 w-8" />
                <h1 className="text-4xl font-bold">Completed Jobs</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Successfully finished jobs with full payment completion
              </p>
            </div>
          </div>

          {/* Modern Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Award className="h-6 w-6 text-gray-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Completed
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {jobs.length}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-green-600">✓</span>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Success Rate
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {successRate.toFixed(0)}%
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-xs font-bold text-purple-600">₱</span>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Paid
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  ₱{(totalPaid ?? 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <span className="text-xs font-medium text-yellow-600">
                    ⭐
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Avg Rating
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {avgRating.toFixed(1)}
                </p>
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
                    placeholder="Search by title, description, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-12 px-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl font-medium"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Modern Job Cards */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 border font-medium">
                            ✓ Completed
                          </Badge>
                        </div>
                        <p className="text-gray-600 leading-relaxed line-clamp-2">
                          {job.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <DollarSign className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Paid
                            </p>
                            <p className="font-bold text-gray-900">
                              ₱{(job.budget ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <MapPin className="h-4 w-4 text-blue-600" />
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
                          <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Finished
                            </p>
                            <p className="font-semibold text-gray-900">
                              {job.completed_at
                                ? new Date(job.completed_at).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )
                                : new Date(job.updated_at).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-yellow-100 rounded-lg">
                            <Star className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Rating
                            </p>
                            <p className="font-bold text-gray-900">
                              {job.client.rating
                                ? `${job.client.rating.toFixed(1)} ⭐`
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Client:</span>
                          <Link
                            href={`/admin/users/clients/${job.client.id}`}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                          >
                            {job.client.name}
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                        {job.worker && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              → Worker:
                            </span>
                            <Link
                              href={`/admin/users/workers/${job.worker.id}`}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                              {job.worker.name}
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                        {job.category && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Category:
                            </span>
                            <Badge variant="secondary" className="font-medium">
                              {job.category.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Link href={`/admin/jobs/listings/${job.id}`}>
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <CheckCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No completed jobs
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  There are no completed jobs yet. Completed jobs will appear
                  here.
                </p>
              </CardContent>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="h-11 px-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-6 h-11 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <span className="text-sm font-medium text-gray-700">
                  Page <span className="text-blue-600 font-bold">{page}</span>{" "}
                  of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="h-11 px-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
