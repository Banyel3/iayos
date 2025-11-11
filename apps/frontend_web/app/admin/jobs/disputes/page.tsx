"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Download,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  DollarSign,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface JobDispute {
  id: string;
  dispute_id: number;
  job_id: string;
  job_title: string;
  category: string | null;
  disputed_by: "client" | "worker";
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
  opened_date: string;
  status: "open" | "under_review" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  job_amount: number;
  disputed_amount: number;
  resolution?: string | null;
  resolved_date?: string | null;
  assigned_to?: string | null;
}

interface DisputeStats {
  total_disputes: number;
  open_disputes: number;
  under_review: number;
  resolved_disputes: number;
  critical_disputes: number;
  total_disputed_amount: number;
}

export default function JobDisputesPage() {
  const [disputes, setDisputes] = useState<JobDispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
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
        "http://localhost:8000/api/adminpanel/jobs/disputes/stats",
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching dispute stats:", error);
    }
  };

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "20",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (priorityFilter !== "all") {
        params.append("priority", priorityFilter);
      }

      const response = await fetch(
        `http://localhost:8000/api/adminpanel/jobs/disputes?${params}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setDisputes(data.disputes);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "low":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dispute.worker?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (isLoading && !stats) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading disputes...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Job Disputes</h1>
            <p className="text-gray-600 mt-1">
              Manage and resolve disputes between clients and workers
            </p>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total_disputes}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Open
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.open_disputes}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Under Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.under_review}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Critical
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.critical_disputes}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Disputed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₱{stats.total_disputed_amount.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search disputes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border rounded-md bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border rounded-md bg-white"
                >
                  <option value="all">All Priority</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <Card
                key={dispute.id}
                className="hover:shadow-lg transition-shadow border-l-4"
                style={{
                  borderLeftColor:
                    dispute.priority === "critical"
                      ? "#dc2626"
                      : dispute.priority === "high"
                      ? "#ea580c"
                      : dispute.priority === "medium"
                      ? "#ca8a04"
                      : "#2563eb",
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {dispute.job_title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            dispute.status
                          )}`}
                        >
                          {dispute.status.toUpperCase().replace("_", " ")}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(
                            dispute.priority
                          )}`}
                        >
                          {dispute.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {dispute.id}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(dispute.opened_date).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="font-medium">{dispute.reason}</span>
                        {dispute.category && (
                          <>
                            <span>•</span>
                            <span>{dispute.category}</span>
                          </>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4 text-sm">
                        {dispute.description}
                      </p>

                      <div className="flex items-center gap-6 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              dispute.disputed_by === "client"
                                ? "bg-purple-100"
                                : "bg-blue-100"
                            }`}
                          >
                            <User
                              className={`h-4 w-4 ${
                                dispute.disputed_by === "client"
                                  ? "text-purple-600"
                                  : "text-blue-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Disputed By
                            </p>
                            <p className="font-medium text-sm">
                              {dispute.disputed_by === "client"
                                ? dispute.client.name
                                : dispute.worker?.name || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">Job Amount</p>
                            <p className="font-semibold text-green-600">
                              ₱{dispute.job_amount}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-red-600" />
                          <div>
                            <p className="text-xs text-gray-500">
                              Disputed Amount
                            </p>
                            <p className="font-semibold text-red-600">
                              ₱{dispute.disputed_amount}
                            </p>
                          </div>
                        </div>

                        {dispute.assigned_to && (
                          <div className="ml-auto text-right">
                            <p className="text-xs text-gray-500">Assigned To</p>
                            <p className="font-medium text-sm">
                              {dispute.assigned_to}
                            </p>
                          </div>
                        )}
                      </div>

                      {dispute.resolution && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-green-800 mb-1">
                                Resolution
                              </p>
                              <p className="text-sm text-green-700">
                                {dispute.resolution}
                              </p>
                              {dispute.resolved_date && (
                                <p className="text-xs text-green-600 mt-1">
                                  Resolved on:{" "}
                                  {new Date(
                                    dispute.resolved_date
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDisputes.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Disputes Found
                </h3>
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                    ? "No disputes match your current filters"
                    : "There are currently no disputes to display"}
                </p>
              </CardContent>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
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
