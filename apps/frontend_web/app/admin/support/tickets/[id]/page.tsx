"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Lock,
  User,
  Mail,
  Clock,
  MessageSquare,
  Edit2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Sidebar } from "../../../components";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  is_admin: boolean;
  message: string;
  created_at: string;
  is_internal: boolean;
}

interface TicketDetail {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_profile_type: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_at: string;
  messages: Message[];
  attachments: Array<{ id: string; filename: string; url: string }>;
  history: Array<{ action: string; admin_name: string; timestamp: string }>;
  user_total_tickets: number;
  user_open_tickets: number;
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_user", label: "Waiting User" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingSubject, setEditingSubject] = useState(false);
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetail();
      const interval = setInterval(fetchTicketDetail, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [ticketId]);

  useEffect(() => {
    // Auto-save draft to localStorage
    if (replyMessage) {
      localStorage.setItem(`ticket_draft_${ticketId}`, replyMessage);
    }
  }, [replyMessage, ticketId]);

  useEffect(() => {
    // Load draft from localStorage
    const draft = localStorage.getItem(`ticket_draft_${ticketId}`);
    if (draft) {
      setReplyMessage(draft);
    }
  }, [ticketId]);

  const fetchTicketDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/tickets/${ticketId}`,
        { credentials: "include" },
      );
      const data = await response.json();

      if (data.success) {
        // Merge messages from root level into ticket object
        const ticketWithMessages = {
          ...data.ticket,
          messages: data.messages || [],
        };
        setTicket(ticketWithMessages);
        setNewSubject(data.ticket.subject);
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/tickets/${ticketId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            message: replyMessage,
            is_internal_note: isInternalNote,
          }),
        },
      );

      if (response.ok) {
        setReplyMessage("");
        setIsInternalNote(false);
        localStorage.removeItem(`ticket_draft_${ticketId}`);
        fetchTicketDetail();
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await fetch(
        `${API_BASE}/api/adminpanel/support/tickets/${ticketId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        },
      );
      fetchTicketDetail();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    try {
      await fetch(
        `${API_BASE}/api/adminpanel/support/tickets/${ticketId}/priority`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ priority: newPriority }),
        },
      );
      fetchTicketDetail();
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const handleCloseTicket = async () => {
    const resolution = prompt("Enter resolution note:");
    if (!resolution) return;

    try {
      await fetch(
        `${API_BASE}/api/adminpanel/support/tickets/${ticketId}/close`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ resolution_note: resolution }),
        },
      );
      fetchTicketDetail();
    } catch (error) {
      console.error("Error closing ticket:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSendReply();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="flex items-center justify-center h-full">
            <MessageSquare className="h-12 w-12 text-gray-400 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="text-center">
            <p className="text-gray-500">Ticket not found</p>
            <Button
              onClick={() => router.push("/admin/support/tickets")}
              className="mt-4"
            >
              Back to Tickets
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="pl-72 p-8 min-h-screen">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/support/tickets")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
            <span className="text-sm text-gray-500">Ticket #{ticket.id}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left 70% */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Header */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {editingSubject ? (
                      <div className="flex gap-2">
                        <Input
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            // TODO: Update subject API call
                            setEditingSubject(false);
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                          {ticket.subject}
                        </h1>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSubject(true)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        {ticket.status}
                      </Badge>
                      <Badge className="bg-orange-100 text-orange-700">
                        {ticket.priority}
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-700">
                        {ticket.category}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-500">
                      Created {new Date(ticket.created_at).toLocaleString()}
                    </p>

                    <div className="pt-4 border-t">
                      <p className="text-gray-700">{ticket.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversation Thread */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {ticket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_admin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-4 ${message.is_internal
                              ? "bg-yellow-50 border border-yellow-200"
                              : message.is_admin
                                ? "bg-blue-50 border border-blue-200"
                                : "bg-gray-50 border border-gray-200"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {message.sender_name}
                            </span>
                            {message.is_internal && (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Internal Note
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reply Box */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your reply... (Ctrl/Cmd + Enter to send)"
                      className="w-full min-h-[120px] px-4 py-3 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={isInternalNote}
                            onChange={(e) =>
                              setIsInternalNote(e.target.checked)
                            }
                          />
                          <Lock className="h-4 w-4" />
                          Internal Note
                        </label>
                        <Button variant="outline" size="sm">
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach File
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCloseTicket}>
                          Close Ticket
                        </Button>
                        <Button
                          onClick={handleSendReply}
                          disabled={sending || !replyMessage.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sending ? "Sending..." : "Send Reply"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right 30% */}
            <div className="space-y-6">
              {/* User Info Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{ticket.user_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{ticket.user_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Profile Type</p>
                      <Badge>{ticket.user_profile_type}</Badge>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-500">Ticket Stats</p>
                      <p className="text-sm">
                        Total: {ticket.user_total_tickets}
                      </p>
                      <p className="text-sm">
                        Open: {ticket.user_open_tickets}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        router.push(`/admin/users/${ticket.user_profile_type?.toLowerCase()}s/${ticket.user_id}`)
                      }
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Ticket Details Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Ticket Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Priority</p>
                      <select
                        value={ticket.priority}
                        onChange={(e) => handleUpdatePriority(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        {PRIORITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Category</p>
                      <p className="font-medium">{ticket.category}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                      <select className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="">Unassigned</option>
                        <option value="1">Admin 1</option>
                        <option value="2">Admin 2</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timeline
                  </h3>
                  <div className="space-y-4">
                    {ticket.history.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-gray-500">
                            by {item.admin_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
