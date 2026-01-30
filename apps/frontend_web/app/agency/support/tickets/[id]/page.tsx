"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
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
  User,
  Send,
  RefreshCw,
  Inbox,
  PlayCircle,
  PauseCircle,
  XCircle,
  Shield,
} from "lucide-react";

interface Reply {
  id: string;
  user_name: string;
  is_admin: boolean;
  message: string;
  created_at: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  replies: Reply[];
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

export default function AgencyTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
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
      const response = await fetch(
        `${API_BASE}/api/agency/support/tickets/${ticketId}`,
        { credentials: "include" }
      );
      const data = await response.json();

      if (data.success) {
        setTicket(data.ticket);
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

    if (replyText.length < 10) {
      toast.error("Reply must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/agency/support/tickets/${ticketId}/reply`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: replyText }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Reply sent successfully");
        setReplyText("");
        fetchTicketDetail(); // Refresh to show new reply
      } else {
        toast.error(data.error || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="font-medium text-gray-900 mb-1">Ticket not found</h2>
          <Button onClick={() => router.push("/agency/support/tickets")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = STATUS_CONFIG[ticket.status]?.icon || Inbox;
  const isTicketClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/agency/support/tickets")}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Tickets</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <StatusIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/70 text-sm">Ticket #{ticket.id}</span>
                  <Badge className={STATUS_CONFIG[ticket.status]?.color || "bg-gray-100"}>
                    {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                  </Badge>
                  <Badge className={PRIORITY_CONFIG[ticket.priority]?.color || "bg-gray-100"}>
                    {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-white">{ticket.subject}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Original Message */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Original Request
                </CardTitle>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDate(ticket.created_at)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm text-gray-500">
                <span>Category: <span className="font-medium text-gray-700">{ticket.category}</span></span>
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          {ticket.replies && ticket.replies.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                Conversation ({ticket.replies.length} replies)
              </h3>
              {ticket.replies.map((reply) => (
                <Card
                  key={reply.id}
                  className={`border-0 shadow-sm ${
                    reply.is_admin ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {reply.is_admin ? (
                          <>
                            <div className="p-1.5 bg-blue-100 rounded-full">
                              <Shield className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-blue-700">
                              Support Team
                            </span>
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              Staff
                            </Badge>
                          </>
                        ) : (
                          <>
                            <div className="p-1.5 bg-gray-100 rounded-full">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {reply.user_name}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap ml-8">
                      {reply.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {!isTicketClosed ? (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  Send a Reply
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReply} className="space-y-4">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    required
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {replyText.length}/1000 characters
                    </p>
                    <Button
                      type="submit"
                      disabled={isSubmitting || replyText.length < 10}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm bg-gray-50">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-1">Ticket Closed</h3>
                <p className="text-sm text-gray-500">
                  This ticket has been {ticket.status}. If you need further assistance, 
                  please create a new ticket.
                </p>
                <Button
                  onClick={() => router.push("/agency/support")}
                  className="mt-4"
                  variant="outline"
                >
                  Create New Ticket
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
