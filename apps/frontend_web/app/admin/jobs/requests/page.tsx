"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Sidebar, useMainContentClass } from "../../components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  Send,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  FileText,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
}

interface JobRequest {
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
  job_type: string;
  invite_status: string | null;
  created_at: string;
  updated_at: string;
}

export default function JobRequestsPage() {
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const statusParam = statusFilter ? `&status=${statusFilter}` : "";
      const response = await fetch(
        `${API_BASE}/api/adminpanel/jobs/listings?page=${page}&page_size=100${statusParam}`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        const inviteJobs = (data.jobs || []).filter(
          (job: any) => job.job_type === "INVITE" || job.jobType === "INVITE",
        );
        setJobs(inviteJobs);
        setTotalPages(Math.ceil(inviteJobs.length / 20));
      }
    } catch (error) {
      console.error("Error fetching job requests:", error);
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "COMPLETED":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getInviteStatusBadge = (status: string | null) => {
    if (!status) return null;
    switch (status.toUpperCase()) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
            ⏳ Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            ✓ Accepted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            ✗ Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency.toUpperCase()) {
      case "HIGH":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            🔴 High Priority
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
            🟡 Medium
          </Badge>
        );
      case "LOW":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            🟢 Low
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <Send className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading job requests...
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <Send className="h-8 w-8" />
                <h1 className="text-4xl font-bold">Job Requests</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Direct hire invitations sent to specific workers or agencies
              </p>
            </div>
          </div>

          {/* Modern Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Requests
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {jobs.length}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Pending
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {
                    jobs.filter(
                      (job) =>
                        job.invite_status?.toUpperCase() === "PENDING" ||
                        job.status === "ACTIVE",
                    ).length
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600">✓</span>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Accepted
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {
                    jobs.filter(
                      (job) =>
                        job.invite_status?.toUpperCase() === "ACCEPTED" ||
                        job.status === "IN_PROGRESS",
                    ).length
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <span className="text-xs font-medium text-red-600">✗</span>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Rejected
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {
                    jobs.filter(
                      (job) => job.invite_status?.toUpperCase() === "REJECTED",
                    ).length
                  }
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="ACTIVE">⏳ Pending Requests</option>
                  <option value="IN_PROGRESS">✓ Accepted & In Progress</option>
                  <option value="COMPLETED">✔ Completed</option>
                  <option value="CANCELLED">✘ Cancelled</option>
                  <option value="">📋 All Status</option>
                </select>
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
                          <Badge
                            className={`${getStatusColor(job.status)} border font-medium`}
                          >
                            {job.status.replace("_", " ")}
                          </Badge>
                          {getInviteStatusBadge(job.invite_status)}
                          {getUrgencyBadge(job.urgency)}
                        </div>
                        <p className="text-gray-600 leading-relaxed line-clamp-2">
                          {job.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
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
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Type
                            </p>
                            <p className="font-bold text-gray-900">
                              Direct Invite
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-orange-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-orange-600" />
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
                  <AlertCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No requests found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No job requests match your current filters. Try adjusting your
                  search criteria.
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
