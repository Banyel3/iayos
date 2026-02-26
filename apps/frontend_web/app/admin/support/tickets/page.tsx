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
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  User,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Inbox,
  PlayCircle,
  PauseCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../../components";

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
  individual: { label: "Individual", color: "bg-gray-100 text-gray-700 border-gray-200" },
  agency: { label: "Agency", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
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
  const [total, setTotal] = useState(0);

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
        limit: "30",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (assignedFilter !== "all")
        params.append("assigned_to", assignedFilter);
      if (searchTerm) params.append("search", searchTerm);
      if (ticketTypeFilter !== "all") params.append("ticket_type", ticketTypeFilter);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/tickets?${params.toString()}`,
        { credentials: "include" },
      );
      const data: TicketsResponse = await response.json();

      if (data.success) {
        const ticketsArray = data.tickets || [];
        setTickets(ticketsArray);
        setTotalPages(data.total_pages || 1);
        setTotal(data.total || 0);

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

        setStats({
          open: openCount,
          in_progress: inProgressCount,
          resolved_today: resolvedToday,
          avg_response_time: 3.5, // Mock value
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
    alert(`Bulk assign ${selectedTickets.length} tickets`);
  };

  const handleBulkClose = () => {
    // TODO: Implement bulk close modal
    alert(`Bulk close ${selectedTickets.length} tickets`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTickets();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-4 sm:p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Ticket className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold">Support Tickets</h1>
                  </div>
                  <p className="text-blue-100 text-sm sm:text-lg">
                    Manage customer support tickets and inquiries
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-red-50 to-red-100/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`p-2 sm:p-3 rounded-lg ${stats.open > 50 ? "bg-red-600" : "bg-red-500"}`}
                  >
                    <Inbox className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Open
                    </p>
                    <p
                      className={`text-xl sm:text-3xl font-black ${stats.open > 50 ? "text-red-700" : "text-gray-900"}`}
                    >
                      {stats.open}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-purple-600 rounded-lg">
                    <PlayCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Active
                    </p>
                    <p className="text-xl sm:text-3xl font-black text-gray-900">
                      {stats.in_progress}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-600 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Resolved
                    </p>
                    <p className="text-xl sm:text-3xl font-black text-gray-900">
                      {stats.resolved_today}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`p-2 sm:p-3 rounded-lg ${stats.avg_response_time < 4 ? "bg-green-600" : stats.avg_response_time < 8 ? "bg-yellow-600" : "bg-red-600"}`}
                  >
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Response
                    </p>
                    <p className="text-xl sm:text-3xl font-black text-gray-900">
                      {stats.avg_response_time}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search tickets by subject or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                  <Button type="submit" className="h-10 px-6 text-white">Search</Button>
                </form>

                {/* Status Tabs */}
                <div className="flex overflow-x-auto pb-1 gap-2 custom-scrollbar -mx-1 px-1">
                  {[
                    "all",
                    "open",
                    "in_progress",
                    "waiting_user",
                    "resolved",
                    "closed",
                  ].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      className={`whitespace-nowrap rounded-xl h-9 px-4 font-bold ${statusFilter === status ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 border-2"}`}
                      onClick={() => {
                        setStatusFilter(status);
                        setCurrentPage(1);
                      }}
                    >
                      {status === "all"
                        ? "All"
                        : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
                          ?.label || status}
                    </Button>
                  ))}
                </div>

                {/* Additional Filters */}
                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3">
                  <select
                    value={ticketTypeFilter}
                    onChange={(e) => {
                      setTicketTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2.5 border-2 border-gray-100 rounded-xl text-xs sm:text-sm bg-gray-50/50 font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="all">All Types</option>
                    <option value="individual">Individual</option>
                    <option value="agency">Agency</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2.5 border-2 border-gray-100 rounded-xl text-xs sm:text-sm bg-gray-50/50 font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2.5 border-2 border-gray-100 rounded-xl text-xs sm:text-sm bg-gray-50/50 font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="all">All Categories</option>
                    <option value="account">Account</option>
                    <option value="payment">Payment</option>
                    <option value="technical">Technical</option>
                    <option value="feature_request">Features</option>
                    <option value="bug_report">Bugs</option>
                    <option value="general">General</option>
                    <option value="kyc">KYC</option>
                    <option value="employees">Employees</option>
                    <option value="jobs">Jobs</option>
                  </select>

                  <select
                    value={assignedFilter}
                    onChange={(e) => setAssignedFilter(e.target.value)}
                    className="px-3 py-2.5 border-2 border-gray-100 rounded-xl text-xs sm:text-sm bg-gray-50/50 font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="all">All Staff</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="me">Me</option>
                    <option value="others">Others</option>
                  </select>

                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="col-span-2 md:col-span-1 px-3 py-2.5 border-2 border-gray-100 rounded-xl text-xs sm:text-sm bg-gray-50/50 font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedTickets.length > 0 && (
            <Card className="border-0 shadow-lg bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {selectedTickets.length} ticket(s) selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkAssign}
                    >
                      Bulk Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkClose}
                    >
                      Bulk Close
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedTickets([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tickets Table / Cards */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left w-12">
                        <input
                          type="checkbox"
                          className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedTickets.length === tickets.length && tickets.length > 0}
                          onChange={(e) =>
                            setSelectedTickets(
                              e.target.checked ? tickets.map((t) => t.id) : [],
                            )
                          }
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest leading-none">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Subject</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest leading-none">User / Agency</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Priority</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Last Reply</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                            <p className="text-gray-500 font-medium tracking-tight">Syncing tickets...</p>
                          </div>
                        </td>
                      </tr>
                    ) : tickets.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-20 text-center">
                          <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                            <div className="p-4 bg-gray-100 rounded-full">
                              <Inbox className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-bold text-gray-900 leading-tight">No tickets match your filters</p>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">Try broadening your search criteria or resetting filters to find what you're looking for.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                          onClick={() => router.push(`/admin/support/tickets/${ticket.id}`)}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selectedTickets.includes(ticket.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelectTicket(ticket.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-gray-400">#{ticket.id}</td>
                          <td className="px-6 py-4">
                            <Badge className={`${ticket.ticket_type === "agency" ? TICKET_TYPE_CONFIG.agency.color : TICKET_TYPE_CONFIG.individual.color} border-0 font-bold px-2 py-0.5`}>
                              {ticket.ticket_type === "agency" ? "Agency" : "User"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-900 max-xs truncate group-hover:text-blue-600 transition-colors">
                                {ticket.subject}
                              </p>
                              {ticket.reply_count > 0 && (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                  {ticket.reply_count}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-gray-900 truncate tracking-tight">{ticket.user_name}</span>
                              {ticket.ticket_type === "agency" && ticket.agency_name && (
                                <span className="text-[10px] text-blue-600 font-bold tracking-tight">
                                  {ticket.agency_name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${CATEGORY_CONFIG[ticket.category]?.color || "bg-gray-100"} border-0 font-bold px-2 py-0.5`}>
                              {ticket.category.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${PRIORITY_CONFIG[ticket.priority].color} border-0 font-bold px-2 py-0.5`}>
                              {PRIORITY_CONFIG[ticket.priority].label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${STATUS_CONFIG[ticket.status].color} border-0 font-bold px-2 py-0.5 flex items-center gap-1.5 w-fit`}>
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
                            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-100">
                {loading ? (
                  <div className="p-12 text-center">
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500 tracking-tight">Loading ticket database...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="p-12 text-center">
                    <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-bold text-gray-900 mb-1">No tickets found</p>
                    <p className="text-xs text-gray-500 font-medium">Try different filter settings</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 bg-white active:bg-blue-50 transition-colors"
                      onClick={() => router.push(`/admin/support/tickets/${ticket.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase leading-none">#{ticket.id}</span>
                            <Badge className={`${ticket.ticket_type === "agency" ? TICKET_TYPE_CONFIG.agency.color : TICKET_TYPE_CONFIG.individual.color} border-0 font-black text-[9px] px-1.5 py-0 leading-none h-4 uppercase`}>
                              {ticket.ticket_type === "agency" ? "Agency" : "User"}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight truncate">
                            {ticket.subject}
                          </h3>
                        </div>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectTicket(ticket.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-[11px] font-bold text-gray-700 leading-none truncate max-w-[100px]">
                            {ticket.user_name}
                          </span>
                        </div>
                        <Badge className={`${STATUS_CONFIG[ticket.status].color} border-0 font-black text-[9px] px-1.5 py-0 leading-none h-5 flex items-center gap-1 uppercase tracking-wider`}>
                          {(() => {
                            const Icon = STATUS_CONFIG[ticket.status].icon;
                            return <Icon className="h-2.5 w-2.5" />;
                          })()}
                          {STATUS_CONFIG[ticket.status].label}
                        </Badge>
                        <Badge className={`${PRIORITY_CONFIG[ticket.priority].color} border-0 font-black text-[9px] px-1.5 py-0 leading-none h-5 uppercase tracking-wider`}>
                          {PRIORITY_CONFIG[ticket.priority].label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 tracking-tight">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(ticket.last_reply_at)}
                          </div>
                          {ticket.reply_count > 0 && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 tracking-tight">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.reply_count}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 text-[11px] font-black uppercase tracking-widest leading-none">
                          View Details
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing page {currentPage} of {totalPages} ({total} total
                    tickets)
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
      </main>
    </div>
  );
}
