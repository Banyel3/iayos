"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, useMainContentClass } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
} from "lucide-react";

interface Dispute {
  id: number;
  transaction_id: number;
  job_id: number;
  job_title: string;
  client_id: number;
  client_name: string;
  worker_id: number;
  worker_name: string;
  amount: number;
  reason: string;
  status: string;
  priority: string;
  filed_by: string;
  filed_at: string;
  resolved_at: string | null;
}

interface Statistics {
  total_disputes: number;
  average_resolution_days: number;
  by_status?: Record<string, number>;
  old_open_disputes?: number;
}

type StatusFilter = "all" | "pending" | "resolved" | "rejected";
type PriorityFilter = "all" | "low" | "medium" | "high" | "urgent";

export default function DisputesPage() {
  const mainClass = useMainContentClass("flex-1 p-8");
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchDisputes = async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/disputes?${params}`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch disputes");

      const data = await response.json();
      setDisputes(data.disputes || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/disputes/statistics`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchDisputes();
    fetchStatistics();
  }, [page, statusFilter, priorityFilter, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDisputes();
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: "⏳ Pending", color: "bg-yellow-100 text-yellow-700" },
      resolved: { label: "✓ Resolved", color: "bg-green-100 text-green-700" },
      rejected: { label: "✗ Rejected", color: "bg-red-100 text-red-700" },
    };
    const badge = badges[status] || { label: status, color: "bg-gray-100" };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      low: { label: "🟢 Low", color: "bg-green-100 text-green-700" },
      medium: { label: "🟡 Medium", color: "bg-yellow-100 text-yellow-700" },
      high: { label: "🟠 High", color: "bg-orange-100 text-orange-700" },
      urgent: { label: "🔴 Urgent", color: "bg-red-100 text-red-700" },
    };
    const badge = badges[priority] || { label: priority, color: "bg-gray-100" };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <AlertTriangle className="h-16 w-16 text-orange-600 animate-pulse mx-auto" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading disputes...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-4 sm:p-8 text-white shadow-xl text-center sm:text-left">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 mb-1 sm:mb-2 text-center sm:text-left">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8" />
                <h1 className="text-2xl sm:text-4xl font-bold">Payment Disputes</h1>
              </div>
              <p className="text-blue-100 text-sm sm:text-lg">
                Review and resolve payment disputes
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 sm:p-3 bg-orange-100 rounded-xl">
                      <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 uppercase font-semibold">Total Disputes</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {statistics.total_disputes}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 sm:p-3 bg-yellow-100 rounded-xl">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 uppercase font-semibold">Pending</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {statistics.by_status?.OPEN ?? 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 sm:p-3 bg-green-100 rounded-xl">
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 uppercase font-semibold">Resolved</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {statistics.by_status?.RESOLVED ?? 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 uppercase font-semibold">
                    Avg Res (days)
                  </p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {statistics.average_resolution_days}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <form onSubmit={handleSearch} className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search disputes..."
                    className="w-full pl-10 h-11 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-sm"
                  />
                  <button type="submit" className="hidden">Search</button>
                </form>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as StatusFilter);
                      setPage(1);
                    }}
                    className="h-11 pl-3 pr-8 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white outline-none text-xs font-medium text-gray-700"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value as PriorityFilter);
                      setPage(1);
                    }}
                    className="h-11 pl-3 pr-8 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white outline-none text-xs font-medium text-gray-700"
                  >
                    <option value="all">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disputes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {disputes.length === 0 ? (
              <div className="col-span-2">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No disputes found</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              disputes.map((dispute) => (
                <Card
                  key={dispute.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group"
                  onClick={() =>
                    router.push(`/admin/payments/disputes/${dispute.id}`)
                  }
                >
                  <CardContent className="p-4 sm:p-6 relative">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors truncate">
                          {dispute.job_title}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
                          {getStatusBadge(dispute.status)}
                          {getPriorityBadge(dispute.priority)}
                        </div>
                      </div>
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-blue-50/50 border border-blue-50 rounded-xl p-3">
                          <p className="text-[10px] text-blue-500 uppercase font-semibold mb-1">Client</p>
                          <p className="font-bold text-blue-900 text-xs sm:text-sm truncate">
                            {dispute.client_name}
                          </p>
                        </div>
                        <div className="bg-green-50/50 border border-green-50 rounded-xl p-3">
                          <p className="text-[10px] text-green-500 uppercase font-semibold mb-1">Worker</p>
                          <p className="font-bold text-green-900 text-xs sm:text-sm truncate">
                            {dispute.worker_name}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white border-2 border-gray-50 rounded-xl p-3 sm:p-4 shadow-sm group-hover:border-blue-100 transition-all">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">
                          Amount in Dispute
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-gray-900">
                          ₱{(dispute.amount ?? 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-gray-50/50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Reason</p>
                        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2 leading-relaxed italic">
                          "{dispute.reason}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] sm:text-xs border-t border-gray-50 pt-3">
                        <span className="text-gray-400 font-medium">
                          Filed by {dispute.filed_by}
                        </span>
                        <span className="text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                          {new Date(dispute.filed_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-4">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  className="h-10 px-3 sm:px-6 border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-gray-500 text-sm">Page</span>
                  <span className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg font-bold text-sm">
                    {page}
                  </span>
                </div>
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={disputes.length < pageSize}
                  variant="outline"
                  className="h-10 px-3 sm:px-6 border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
