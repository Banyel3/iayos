"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Search,
  Filter,
  UserPlus,
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
} from "lucide-react";
import { Sidebar } from "../../components";

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
};

export default function SupportTicketsPage() {
  const router = useRouter();
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

      const response = await fetch(
        `http://localhost:8000/api/adminpanel/support/tickets?${params.toString()}`,
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Ticket className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-bold">Support Tickets</h1>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Manage customer support tickets and inquiries
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/admin/support/tickets/new")}
                  className="bg-white text-blue-700 hover:bg-blue-50"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-red-50 to-red-100/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${stats.open > 50 ? "bg-red-600" : "bg-red-500"}`}
                  >
                    <Inbox className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Open Tickets
                    </p>
                    <p
                      className={`text-3xl font-bold ${stats.open > 50 ? "text-red-700" : "text-gray-900"}`}
                    >
                      {stats.open}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-600 rounded-lg">
                    <PlayCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      In Progress
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.in_progress}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-600 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Resolved Today
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.resolved_today}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${stats.avg_response_time < 4 ? "bg-green-600" : stats.avg_response_time < 8 ? "bg-yellow-600" : "bg-red-600"}`}
                  >
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Avg Response
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
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
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </form>

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
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
                <div className="flex flex-wrap gap-4">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
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
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="account">Account</option>
                    <option value="payment">Payment</option>
                    <option value="technical">Technical</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="general">General</option>
                  </select>

                  <select
                    value={assignedFilter}
                    onChange={(e) => setAssignedFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">All Assignments</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="me">Assigned to Me</option>
                    <option value="others">Assigned to Others</option>
                  </select>

                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
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

          {/* Tickets Table */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedTickets.length === tickets.length}
                          onChange={(e) =>
                            setSelectedTickets(
                              e.target.checked ? tickets.map((t) => t.id) : [],
                            )
                          }
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Last Reply
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <MessageSquare className="h-8 w-8 text-gray-400 animate-pulse" />
                            <p className="text-gray-500">Loading tickets...</p>
                          </div>
                        </td>
                      </tr>
                    ) : tickets.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Inbox className="h-12 w-12 text-gray-400" />
                            <p className="text-gray-500 font-medium">
                              No tickets found
                            </p>
                            <p className="text-sm text-gray-400">
                              Try adjusting your filters or search term
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(`/admin/support/tickets/${ticket.id}`)
                          }
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedTickets.includes(ticket.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelectTicket(ticket.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            #{ticket.id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 max-w-md truncate">
                                {ticket.subject}
                              </p>
                              {ticket.reply_count > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {ticket.reply_count}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {ticket.user_name}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                CATEGORY_CONFIG[ticket.category]?.color ||
                                "bg-gray-100"
                              }
                            >
                              {ticket.category.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={PRIORITY_CONFIG[ticket.priority].color}
                            >
                              {PRIORITY_CONFIG[ticket.priority].label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={STATUS_CONFIG[ticket.status].color}
                            >
                              {STATUS_CONFIG[ticket.status].label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {ticket.assigned_to_name || (
                              <span className="text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {getTimeAgo(ticket.last_reply_at)}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/admin/support/tickets/${ticket.id}`,
                                );
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
