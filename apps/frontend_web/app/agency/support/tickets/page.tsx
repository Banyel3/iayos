"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/lib/api/config";
import {
  ArrowLeft,
  Ticket,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Inbox,
  PlayCircle,
  PauseCircle,
  XCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

interface TicketData {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  created_at: string;
  last_reply_at: string;
  reply_count: number;
}

interface TicketsResponse {
  success: boolean;
  tickets: TicketData[];
  total: number;
  page: number;
  total_pages: number;
}

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
  high: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low: { label: "Low", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Inbox },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-700 border-purple-200", icon: PlayCircle },
  waiting_user: { label: "Awaiting Reply", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: PauseCircle },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700 border-gray-200", icon: XCircle },
};

const CATEGORY_CONFIG: Record<string, { color: string }> = {
  kyc: { color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  employees: { color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  payments: { color: "bg-green-100 text-green-700 border-green-200" },
  jobs: { color: "bg-orange-100 text-orange-700 border-orange-200" },
  account: { color: "bg-blue-100 text-blue-700 border-blue-200" },
  other: { color: "bg-gray-100 text-gray-700 border-gray-200" },
};

export default function AgencyTicketsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTickets();
  }, [currentPage, statusFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(
        `${API_BASE}/api/agency/support/tickets?${params.toString()}`,
        { credentials: "include" }
      );
      const data: TicketsResponse = await response.json();

      if (data.success) {
        setTickets(data.tickets || []);
        setTotalPages(data.total_pages || 1);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-10">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/agency/support")}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Support</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Ticket className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">My Support Tickets</h1>
                <p className="text-blue-100 mt-1">
                  Track and manage your support requests
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/agency/support")}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Inbox className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter((t) => t.status === "open").length}
                </p>
                <p className="text-xs text-gray-500">Open</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PlayCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter((t) => t.status === "in_progress").length}
                </p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <PauseCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter((t) => t.status === "waiting_user").length}
                </p>
                <p className="text-xs text-gray-500">Awaiting Reply</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter((t) => t.status === "resolved" || t.status === "closed").length}
                </p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {["all", "open", "in_progress", "waiting_user", "resolved", "closed"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                  >
                    {status === "all"
                      ? "All"
                      : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={fetchTickets}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center">
                <MessageSquare className="h-8 w-8 text-gray-400 animate-pulse mx-auto mb-2" />
                <p className="text-gray-500">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">No tickets yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Submit a support ticket when you need help
                </p>
                <Button onClick={() => router.push("/agency/support")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/agency/support/tickets/${ticket.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            #{ticket.id}
                          </span>
                          <Badge className={STATUS_CONFIG[ticket.status]?.color || "bg-gray-100"}>
                            {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                          </Badge>
                          <Badge className={PRIORITY_CONFIG[ticket.priority]?.color || "bg-gray-100"}>
                            {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge className={CATEGORY_CONFIG[ticket.category]?.color || "bg-gray-100"}>
                            {ticket.category}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(ticket.created_at)}
                          </span>
                          {ticket.reply_count > 0 && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.reply_count} replies
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="border-0 shadow-sm mt-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} ({total} tickets)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
