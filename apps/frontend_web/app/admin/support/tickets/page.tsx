"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Search,
  Download,
  Calendar,
  Loader2,
  Inbox,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../../components";
import { toast } from "sonner";

interface TicketData {
  id: string;
  user_id: string;
  user_name: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_at: string;
  last_reply_at: string;
  reply_count: number;
  ticket_type?: "individual" | "agency";
  agency_id?: number | null;
  agency_name?: string | null;
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
  high: {
    label: "High",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  low: { label: "Low", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Inbox,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: PlayCircle,
  },
  waiting_user: {
    label: "Waiting User",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: PauseCircle,
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  closed: {
    label: "Closed",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: XCircle,
  },
};

const CATEGORY_CONFIG: Record<string, { color: string }> = {
  account: { color: "bg-blue-100 text-blue-700 border-blue-200" },
  payment: { color: "bg-green-100 text-green-700 border-green-200" },
  technical: { color: "bg-purple-100 text-purple-700 border-purple-200" },
  feature_request: { color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  bug_report: { color: "bg-red-100 text-red-700 border-red-200" },
  general: { color: "bg-gray-100 text-gray-700 border-gray-200" },
  kyc: { color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  employees: { color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  jobs: { color: "bg-orange-100 text-orange-700 border-orange-200" },
};

const TICKET_TYPE_CONFIG = {
  individual: {
    label: "Individual",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  agency: {
    label: "Agency",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
};

export default function SupportTicketsPage() {
  const router = useRouter();
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [dateRange, setDateRange] = useState("last_30_days");
  const [ticketTypeFilter, setTicketTypeFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    open: 0,
    in_progress: 0,
    resolved_today: 0,
    avg_response_time: 0,
  });

  useEffect(() => {
    fetchTickets();
  }, [
    currentPage,
    statusFilter,
    priorityFilter,
    categoryFilter,
    assignedFilter,
    dateRange,
    ticketTypeFilter,
  ]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (assignedFilter !== "all")
        params.append("assigned_to", assignedFilter);
      if (searchTerm) params.append("search", searchTerm);
      if (ticketTypeFilter !== "all")
        params.append("ticket_type", ticketTypeFilter);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/tickets?${params.toString()}`,
        { credentials: "include" },
      );
      const data: TicketsResponse = await response.json();

      if (data.success) {
        const ticketsArray = data.tickets || [];
        setTickets(ticketsArray);
        setTotalPages(data.total_pages || 1);
        setTotalTickets(data.total || 0);

        // Calculate stats
        const openCount = ticketsArray.filter(
          (t) => t.status === "open",
        ).length;
        const inProgressCount = ticketsArray.filter(
          (t) => t.status === "in_progress",
        ).length;
        const resolvedToday = ticketsArray.filter(
          (t) => t.status === "resolved" && isToday(t.last_reply_at),
        ).length;

        const resolvedWithTimes = ticketsArray.filter(
          (t) => t.status === "resolved" && t.last_reply_at && t.created_at,
        );
        const avgResponseTime =
          resolvedWithTimes.length > 0
            ? Math.round(
              (resolvedWithTimes.reduce((sum, t) => {
                const created = new Date(t.created_at).getTime();
                const replied = new Date(t.last_reply_at).getTime();
                return sum + Math.max(0, (replied - created) / 3600000);
              }, 0) /
                resolvedWithTimes.length) *
              10,
            ) / 10
            : 0;

        setStats({
          open: openCount,
          in_progress: inProgressCount,
          resolved_today: resolvedToday,
          avg_response_time: avgResponseTime,
        });
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
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

  const toggleSelectTicket = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId],
    );
  };

  const handleBulkAssign = () => {
    // TODO: Implement bulk assign modal
    toast.info(`Bulk assign: ${selectedTickets.length} ticket(s) selected`, {
      description: "Bulk assignment UI coming soon.",
    });
  };

  const handleBulkClose = () => {
    // TODO: Implement bulk close modal
    toast.info(`Bulk close: ${selectedTickets.length} ticket(s) selected`, {
      description: "Bulk close UI coming soon.",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTickets();
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Subject",
      "User",
      "Type",
      "Category",
      "Priority",
      "Status",
      "Last Reply",
    ];
    const rows = tickets.map((t) => [
      t.id,
      t.subject,
      t.user_name,
      t.ticket_type === "agency" ? "Agency" : "Individual",
      t.category,
      t.priority,
      t.status,
      t.last_reply_at,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
                  <Ticket className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Support Tickets</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Manage customer support tickets and inquiries
                </p>
              </div>
              <Button
                onClick={handleExport}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm transition-all"
              >
                <Download className="mr-2 h-5 w-5" />
                Export Tickets
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Inbox className="h-5 w-5 text-[#00BAF1]" /></div>
                  <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Open Tickets</p>
                <p className="text-xl font-bold text-gray-900">{stats.open}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><PlayCircle className="h-5 w-5 text-[#00BAF1]" /></div>
                  <MessageSquare className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Active</p>
                <p className="text-xl font-bold text-gray-900">{stats.in_progress}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><CheckCircle2 className="h-5 w-5 text-[#00BAF1]" /></div>
                  <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Resolved Today</p>
                <p className="text-xl font-bold text-gray-900">{stats.resolved_today}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Clock className="h-5 w-5 text-[#00BAF1]" /></div>
                  <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Response Time</p>
                <p className="text-xl font-bold text-gray-900">{stats.avg_response_time}h</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-sky-500 transition-colors" />
                <Input
                  placeholder="Search tickets by subject, user, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-sky-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
              >
                <option value="all">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={ticketTypeFilter}
                onChange={(e) => {
                  setTicketTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white hover:border-sky-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none text-sm"
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="agency">Agency</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white hover:border-sky-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white hover:border-sky-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none text-sm"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_CONFIG).map(([key]) => (
                  <option key={key} value={key}>{key.replace("_", " ")}</option>
                ))}
              </select>

              <select
                value={assignedFilter}
                onChange={(e) => {
                  setAssignedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white hover:border-sky-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700 shadow-sm outline-none text-sm"
              >
                <option value="all">All Staff</option>
                <option value="unassigned">Unassigned</option>
                <option value="me">Me</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedTickets.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm">
              <span className="text-sm font-medium text-blue-900 ml-2">
                {selectedTickets.length} ticket(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkAssign}
                  className="rounded-lg"
                >
                  Bulk Assign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkClose}
                  className="rounded-lg"
                >
                  Bulk Close
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedTickets([])}
                  className="rounded-lg"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Tickets List */}
          <Card>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Tickets List</h2>
              <p className="text-sm text-gray-500 mt-1">
                Overview of all tickets (Page {currentPage} of {totalPages})
              </p>
            </div>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-10 w-10 text-[#00BAF1] animate-spin" />
                  <p className="text-gray-500 font-medium">Fetching tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="p-4 bg-gray-50 rounded-full">
                    <Inbox className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">No tickets found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      We couldn't find any tickets matching your current filters. Try adjusting your search or filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left w-12">
                            <input
                              type="checkbox"
                              className="rounded-md border-gray-300 text-[#00BAF1] focus:ring-[#00BAF1]"
                              checked={
                                selectedTickets.length === tickets.length &&
                                tickets.length > 0
                              }
                              onChange={(e) =>
                                setSelectedTickets(
                                  e.target.checked ? tickets.map((t) => t.id) : [],
                                )
                              }
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Subject
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            User / Agency
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Category
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Priority
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Last Reply
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tickets.map((ticket) => (
                          <tr
                            key={ticket.id}
                            className="hover:bg-gray-50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                className="rounded-md border-gray-300 text-[#00BAF1] focus:ring-[#00BAF1]"
                                checked={selectedTickets.includes(ticket.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectTicket(ticket.id);
                                }}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-500">
                              #{ticket.id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors line-clamp-1">
                                  {ticket.subject}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    className={`${ticket.ticket_type === "agency" ? TICKET_TYPE_CONFIG.agency.color : TICKET_TYPE_CONFIG.individual.color} border-0 font-bold text-[10px] px-1.5 py-0 shadow-none`}
                                  >
                                    {ticket.ticket_type === "agency" ? "Agency" : "User"}
                                  </Badge>
                                  {ticket.reply_count > 0 && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {ticket.reply_count} replies
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-gray-900 truncate tracking-tight">
                                  {ticket.user_name}
                                </span>
                                {ticket.ticket_type === "agency" &&
                                  ticket.agency_name && (
                                    <span className="text-[10px] text-[#00BAF1] font-bold tracking-tight">
                                      {ticket.agency_name}
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={`${CATEGORY_CONFIG[ticket.category]?.color || "bg-gray-100 text-gray-600"} border-0 font-bold px-2 py-0.5 shadow-none`}
                              >
                                {ticket.category.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={`${PRIORITY_CONFIG[ticket.priority].color} border-0 font-bold px-2 py-0.5 shadow-none`}
                              >
                                {PRIORITY_CONFIG[ticket.priority].label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={`${STATUS_CONFIG[ticket.status].color} border-0 font-bold px-2 py-0.5 flex items-center gap-1.5 w-fit shadow-none`}
                              >
                                {(() => {
                                  const Icon = STATUS_CONFIG[ticket.status].icon;
                                  return <Icon className="h-3 w-3" />;
                                })()}
                                {STATUS_CONFIG[ticket.status].label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-500 tracking-tight">
                              {getTimeAgo(ticket.last_reply_at)}
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/admin/support/tickets/${ticket.id}`)
                                }
                                className="rounded-lg hover:border-[#00BAF1] hover:text-[#00BAF1]"
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
                    <div className="flex flex-col items-center gap-4 py-8 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Showing <span className="font-semibold text-gray-700">{tickets.length}</span> of <span className="font-semibold text-gray-700">{totalTickets}</span> tickets
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${currentPage === 1 ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                          if (totalPages > 7) {
                            if (p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
                              if (p === 2 || p === totalPages - 1) return <span key={p} className="w-4 text-center text-gray-400">...</span>;
                              return null;
                            }
                          }
                          return (
                            <button
                              key={p}
                              onClick={() => setCurrentPage(p)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${p === currentPage ? "bg-[#00BAF1] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
                            >
                              {p}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${currentPage === totalPages ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1]"}`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
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


