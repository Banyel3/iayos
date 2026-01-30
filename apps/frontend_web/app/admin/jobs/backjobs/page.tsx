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
  AlertTriangle,
  Clock,
  CheckCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Users,
  ChevronRight,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface BackJob {
  id: string;
  dispute_id: number;
  job_id: string;
  job_title: string;
  category: string | null;
  requested_by: "client" | "worker";
  client: {
    id: string;
    name: string;
  };
  worker: {
    id: string;
    name: string;
  } | null;
  reason: string;
  description: string;
  requested_date: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  job_amount: number;
  backjob_amount: number;
  resolution?: string | null;
  resolved_date?: string | null;
  assigned_to?: string | null;
}

interface BackJobStats {
  total_requests: number;
  pending_requests: number;
  under_review: number;
  approved_requests: number;
  urgent_requests: number;
  total_backjob_amount: number;
}

export default function BackJobsPage() {
  const [backjobs, setBackjobs] = useState<BackJob[]>([]);
  const [stats, setStats] = useState<BackJobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [page, statusFilter, priorityFilter]);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/jobs/disputes/stats`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      let url = `${API_BASE}/api/adminpanel/jobs/disputes?page=${page}&page_size=20`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (priorityFilter !== "all") url += `&priority=${priorityFilter}`;

      const response = await fetch(url, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setBackjobs(data.disputes);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = backjobs.filter((job) => {
    const matchesSearch =
      job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
            ⏳ Pending Review
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
            👁 Under Review
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            ✓ Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            ✗ Rejected
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">
            ✔ Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            🔴 Urgent
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
            🟠 High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
            🟡 Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            🟢 Low
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <AlertTriangle className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading back jobs...
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
                <AlertTriangle className="h-8 w-8" />
                <h1 className="text-4xl font-bold">Back Jobs / Disputes</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Dispute resolutions and back job request management
              </p>
            </div>
          </div>

          {/* Modern Summary Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Requests
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total_requests}
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
                    Pending Review
                  </p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.pending_requests}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-xs font-medium text-green-600">
                      ✓
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Approved
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.approved_requests}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <span className="text-xs font-bold text-red-600">🔥</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Urgent
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.urgent_requests}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Modern Filters Card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Search by title, reason, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="all">📋 All Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="under_review">👁 Under Review</option>
                  <option value="approved">✓ Approved</option>
                  <option value="rejected">✗ Rejected</option>
                  <option value="completed">✔ Completed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700"
                >
                  <option value="all">🎯 All Priority</option>
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
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
                key={job.dispute_id || job.id}
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {job.job_title}
                          </h3>
                          {getStatusBadge(job.status)}
                          {getPriorityBadge(job.priority)}
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                            👤{" "}
                            {job.requested_by === "client"
                              ? "Client"
                              : "Worker"}{" "}
                            Request
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700">
                            <span className="text-gray-500">Reason:</span>{" "}
                            {job.reason}
                          </p>
                          <p className="text-gray-600 leading-relaxed line-clamp-2">
                            {job.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Job Amount
                            </p>
                            <p className="font-bold text-gray-900">
                              ₱{(job.job_amount ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-orange-100 rounded-lg">
                            <DollarSign className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Back Amount
                            </p>
                            <p className="font-bold text-gray-900">
                              ₱
                              {(
                                job.backjob_amount ??
                                job.job_amount ??
                                0
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Requested
                            </p>
                            <p className="font-semibold text-gray-900">
                              {job.requested_date
                                ? new Date(
                                  job.requested_date,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <FileText className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Dispute ID
                            </p>
                            <p className="font-bold text-gray-900">
                              #{job.dispute_id}
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
                              {job.category}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Link href={`/admin/jobs/backjobs/${job.dispute_id}`}>
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
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
                  <AlertTriangle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No back job requests
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No back job requests match your filters. Try adjusting your
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
