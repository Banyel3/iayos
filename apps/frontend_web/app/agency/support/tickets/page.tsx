"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
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
  urgent: { label: "Urgent", color: "bg-red-50 text-red-600 border-red-100" },
  high: { label: "High", color: "bg-orange-50 text-orange-600 border-orange-100" },
  medium: { label: "Medium", color: "bg-amber-50 text-amber-600 border-amber-100" },
  low: { label: "Low", color: "bg-gray-50 text-gray-500 border-gray-100" },
};

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-sky-50 text-sky-600 border-sky-100", icon: Inbox },
  in_progress: { label: "Active", color: "bg-purple-50 text-purple-600 border-purple-100", icon: PlayCircle },
  waiting_user: { label: "Pending", color: "bg-amber-50 text-amber-600 border-amber-100", icon: PauseCircle },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-gray-50 text-gray-500 border-gray-100", icon: XCircle },
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
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
             <Ticket className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
             <div>
               <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Support History</h1>
               <p className="text-gray-500 text-sm sm:text-base">
                 Track and manage your existing support requests
               </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <Button
                onClick={() => router.push("/agency/support")}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-100 rounded-xl px-4 font-bold text-[10px] uppercase tracking-wider h-11 transition-all"
             >
                <Plus className="h-3 w-3 mr-2 text-[#00BAF1]" />
                New Ticket
             </Button>
             <Button
                variant="ghost"
                onClick={fetchTickets}
                className="w-11 h-11 p-0 rounded-xl hover:bg-gray-100 text-gray-400"
             >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
         {[
           { label: "Active", count: tickets.filter(t => t.status === "in_progress").length, icon: PlayCircle, color: "text-purple-600", bg: "bg-purple-50" },
           { label: "Pending", count: tickets.filter(t => t.status === "waiting_user").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
           { label: "Open", count: tickets.filter(t => t.status === "open").length, icon: Inbox, color: "text-sky-600", bg: "bg-sky-50" },
           { label: "Resolved", count: tickets.filter(t => t.status === "resolved" || t.status === "closed").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" }
         ].map((stat, i) => (
           <Card key={i} className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white group hover:shadow-xl transition-all">
              <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                       <p className="text-2xl font-black text-gray-900">{stat.count}</p>
                    </div>
                    <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl group-hover:scale-110 transition-transform`}>
                       <stat.icon className="h-5 w-5" />
                    </div>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      {/* Filters Hub */}
      <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
         {["all", "open", "in_progress", "waiting_user", "resolved"].map((status) => (
            <button
               key={status}
               onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
               className={`px-5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                  statusFilter === status 
                  ? "bg-white text-[#00BAF1] shadow-sm ring-1 ring-gray-100" 
                  : "text-gray-400 hover:text-gray-600"
               }`}
            >
               {status === "all" ? "All Requests" : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
            </button>
         ))}
      </div>

      {/* Tickets Main List */}
      <div className="space-y-4">
         {loading ? (
            <div className="space-y-4">
               {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 bg-gray-50 animate-pulse rounded-3xl" />
               ))}
            </div>
         ) : tickets.length === 0 ? (
            <Card className="border-0 shadow-xl rounded-3xl p-20 text-center bg-white border-2 border-dashed border-gray-100">
               <div className="p-4 bg-gray-50 rounded-3xl w-fit mx-auto mb-6">
                  <Inbox className="h-10 w-10 text-gray-300" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">No support requests</h3>
               <p className="text-gray-400 font-medium mt-2 max-w-sm mx-auto">
                  You haven't submitted any tickets matching this filter.
               </p>
               <Button onClick={() => router.push("/agency/support")} className="mt-8 bg-[#00BAF1] hover:bg-[#00BAF1]/90 rounded-xl px-10 h-12 font-extrabold text-[10px] uppercase tracking-widest shadow-lg shadow-sky-100">
                  Contact Helpdesk
               </Button>
            </Card>
         ) : (
            <div className="grid grid-cols-1 gap-4">
               {tickets.map((ticket) => (
                  <Card 
                     key={ticket.id} 
                     className="border-0 shadow-lg hover:shadow-xl transition-all rounded-3xl bg-white overflow-hidden group cursor-pointer"
                     onClick={() => router.push(`/agency/support/tickets/${ticket.id}`)}
                  >
                     <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-6">
                           <div className="flex items-center gap-5 flex-1 min-w-0">
                              <div className={`p-4 rounded-2xl flex items-center justify-center text-white ${STATUS_CONFIG[ticket.status]?.color || "bg-gray-100 text-gray-400"}`}>
                                 {React.createElement(STATUS_CONFIG[ticket.status]?.icon || Ticket, { className: "h-5 w-5" })}
                              </div>
                              <div className="space-y-1.5 flex-1 min-w-0">
                                 <div className="flex items-center gap-3">
                                    <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{ticket.subject}</p>
                                    <Badge className={`${PRIORITY_CONFIG[ticket.priority]?.color} text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 border-0`}>
                                       {ticket.priority}
                                    </Badge>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                       <span className="text-[#00BAF1]">#{ticket.id}</span>
                                       <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                       {ticket.category}
                                    </p>
                                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                       <Clock className="h-3 w-3" />
                                       {getTimeAgo(ticket.created_at)}
                                    </p>
                                    {ticket.reply_count > 0 && (
                                       <p className="text-[10px] font-extrabold text-[#00BAF1] uppercase tracking-widest flex items-center gap-1.5">
                                          <MessageSquare className="h-3 w-3" />
                                          {ticket.reply_count} UPDATES
                                       </p>
                                    )}
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="hidden sm:block">
                                 <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#00BAF1] group-hover:translate-x-1 transition-all" />
                              </div>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         )}
      </div>

      {/* Pagination Container */}
      {totalPages > 1 && (
         <div className="flex items-center justify-between bg-gray-50 p-4 rounded-3xl border border-gray-100 mt-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
               Page {currentPage} / {totalPages}
            </p>
            <div className="flex gap-2">
               <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="rounded-xl h-10 px-4 border-2 border-gray-200 font-bold text-[10px] uppercase"
               >
                  <ChevronLeft className="h-3 w-3 mr-2" />
                  Prev
               </Button>
               <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-xl h-10 px-4 border-2 border-gray-200 font-bold text-[10px] uppercase"
               >
                  Next
                  <ChevronRight className="h-3 w-3 ml-2" />
               </Button>
            </div>
         </div>
      )}
    </div>
  );
}
