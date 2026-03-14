"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api/config";
import {
  ArrowLeft,
  Ticket,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Send,
  RefreshCw,
  Inbox,
  PlayCircle,
  PauseCircle,
  XCircle,
  Shield,
  Briefcase,
  Layers,
} from "lucide-react";

interface Reply {
  id: string;
  sender_name: string;
  is_admin: boolean;
  content: string;
  is_system_message: boolean;
  created_at: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
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

export default function AgencyTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetail();
    }
  }, [ticketId]);

  const fetchTicketDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/agency/support/tickets/${ticketId}`, { credentials: "include" });
      const data = await response.json();

      if (data.success) {
        setTicket(data.ticket);
        setMessages(data.messages || []);
      } else {
        toast.error(data.error || "Failed to load ticket");
        router.push("/agency/support/tickets");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast.error("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error("Please enter a reply message");
      return;
    }
    if (replyText.trim().length < 10) {
      toast.error("Reply must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/agency/support/tickets/${ticketId}/reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Reply sent!");
        setReplyText("");
        fetchTicketDetail();
      } else {
        toast.error(data.error || "Failed to send reply");
      }
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pt-40 px-4 text-center">
        <RefreshCw className="h-8 w-8 text-[#00BAF1] animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hydrating Ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-7xl mx-auto pt-40 px-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
        <p className="text-sm font-bold text-gray-700 mb-2">Ticket not found</p>
        <p className="text-xs font-medium text-gray-400 mb-6">This ticket may have been removed or you don't have access.</p>
        <Button
          onClick={() => router.push("/agency/support/tickets")}
          variant="outline"
          className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-100 rounded-xl px-5 font-bold text-[10px] uppercase tracking-wider h-11"
        >
          <ArrowLeft className="h-3 w-3 mr-2" />
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
             <Ticket className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
             <div>
               <div className="flex items-center gap-2 mb-1">
                  <p className="text-[#00BAF1] text-[10px] font-black uppercase tracking-widest">#{ticket.id}</p>
                  <Badge className={`${STATUS_CONFIG[ticket.status]?.color} text-[8px] font-black uppercase tracking-tighter px-2 border-0`}>
                     {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                  </Badge>
               </div>
               <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{ticket.subject}</h1>
             </div>
          </div>
          <Button
            onClick={() => router.push("/agency/support/tickets")}
            variant="outline"
            className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-100 rounded-xl px-5 font-bold text-[10px] uppercase tracking-wider h-11 transition-all"
          >
            <ArrowLeft className="h-3 w-3 mr-2" />
            Inbox
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Chat/Conversation */}
         <div className="lg:col-span-2 space-y-8">
            <SettingsSection title="Conversation History">
               <div className="divide-y divide-gray-50">
                  {messages.map((message, idx) => (
                     <div key={message.id} className={`p-6 transition-colors ${message.is_admin ? "bg-[#00BAF1]/[0.02]" : "bg-white"}`}>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${message.is_admin ? "bg-[#00BAF1] text-white shadow-lg shadow-sky-100" : "bg-gray-100 text-gray-400"}`}>
                                 {message.is_admin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              </div>
                              <div>
                                 <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                                    {message.is_admin ? "iayos Support Team" : message.sender_name}
                                 </p>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    {message.is_admin ? "Verified Agent" : "Agency Owner"}
                                 </p>
                              </div>
                           </div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{formatDate(message.created_at)}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap ml-12">
                           {message.content}
                        </p>
                     </div>
                  ))}
               </div>
            </SettingsSection>

            {/* Reply Input */}
            {ticket.status !== "closed" && ticket.status !== "resolved" ? (
               <Card className="border-0 shadow-2xl rounded-3xl bg-white overflow-hidden">
                  <CardHeader className="p-6 border-b border-gray-50 bg-gray-50/50">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Reply</p>
                  </CardHeader>
                  <CardContent className="p-6">
                     <form onSubmit={handleSubmitReply} className="space-y-4">
                        <Textarea
                           value={replyText}
                           onChange={(e) => setReplyText(e.target.value)}
                           placeholder="Describe your follow-up details here..."
                           className="min-h-[150px] bg-gray-50 border-gray-100 focus:bg-white rounded-2xl p-5 font-bold text-sm resize-none transition-all outline-none"
                        />
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {replyText.length} / 1000 characters
                           </p>
                           <Button
                              type="submit"
                              disabled={isSubmitting || replyText.length < 10}
                              className="bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white rounded-xl h-12 px-8 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-sky-100"
                           >
                              {isSubmitting ? "Sending..." : "Post Reply"}
                           </Button>
                        </div>
                     </form>
                  </CardContent>
               </Card>
            ) : (
               <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 text-center">
                  <div className="p-3 bg-emerald-100 rounded-2xl w-fit mx-auto mb-4">
                     <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900">Issue Resolved</h3>
                  <p className="text-sm font-medium text-emerald-600/80 mt-1">This ticket has been finalised and is no longer accepting replies.</p>
                  <Button 
                     onClick={() => router.push("/agency/support")}
                     className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 px-8 font-bold text-[10px] uppercase tracking-widest border-0"
                  >
                     Open New Request
                  </Button>
               </div>
            )}
         </div>

         {/* Sidebar Metadata */}
         <div className="space-y-6">
            <SettingsSection title="Ticket Metadata">
               <div className="p-6 space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority Ranking</label>
                     <div className="pt-1">
                        <Badge className={`${PRIORITY_CONFIG[ticket.priority]?.color} text-[10px] font-black uppercase px-3 py-1 border-0`}>
                           {ticket.priority} Priority
                        </Badge>
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service Item</label>
                     <p className="text-sm font-bold text-gray-800">{ticket.category}</p>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Activity</label>
                     <p className="text-sm font-bold text-gray-800">{formatDate(ticket.updated_at)}</p>
                  </div>
               </div>
            </SettingsSection>

            <Card className="border-0 shadow-lg bg-gray-50/50 rounded-3xl p-6 overflow-hidden relative">
               <div className="relative z-10 space-y-2">
                  <p className="text-[10px] font-black text-[#00BAF1] uppercase tracking-widest">Support Policy</p>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed">
                     Please allow up to 24 hours for our staff to review your follow-up. For urgent security issues, please use the account lock feature.
                  </p>
               </div>
               <Layers className="absolute -bottom-4 -right-4 h-20 w-20 text-gray-100 -rotate-12" />
            </Card>
         </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string, children: React.ReactNode }) {
   return (
     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="mb-4">
         <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
           {title}
         </h3>
       </div>
       <Card className="border-0 shadow-xl overflow-hidden rounded-3xl bg-white">
         <CardContent className="p-0">
           {children}
         </CardContent>
       </Card>
     </div>
   );
 }
