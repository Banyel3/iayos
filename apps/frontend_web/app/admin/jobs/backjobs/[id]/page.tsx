"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar, useMainContentClass } from "../../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Send,
  User,
  DollarSign,
  FileText,
  Shield,
  ChevronRight,
  Calendar,
  RefreshCw,
  Image,
} from "lucide-react";
import Link from "next/link";

interface DisputeDetail {
  id: string;
  dispute_id: number;
  job_id: string;
  job_title: string;
  category: string | null;
  disputed_by: string;
  client: { id: string; name: string; email: string };
  worker: { id: string; name: string; email: string } | null;
  agency: { id: string; name: string } | null;
  reason: string;
  description: string;
  opened_date: string;
  updated_at: string;
  status: "open" | "in_negotiation" | "under_review" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  job_amount: number;
  disputed_amount: number;
  resolution: string | null;
  resolved_date: string | null;
  in_negotiation_at: string | null;
  admin_rejection_reason: string | null;
  conversation_id: number | null;
  can_admin_chat?: boolean;
  evidence: {
    id: number;
    image_url: string;
    description: string | null;
    uploaded_at: string;
  }[];
  backjob_started: boolean;
  worker_marked_complete: boolean;
  client_confirmed: boolean;
  scheduled_date: string | null;
}

interface ChatMessage {
  id: number;
  text: string;
  sender_type: "profile" | "agency" | "admin" | "system";
  sender_name: string;
  created_at: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
          \u23f3 Pending Review
        </Badge>
      );
    case "in_negotiation":
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
          \u2696\ufe0f In Negotiation
        </Badge>
      );
    case "under_review":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          \U0001f50d Under Review
        </Badge>
      );
    case "resolved":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          \u2705 Resolved
        </Badge>
      );
    case "closed":
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-200">
          \U0001f6ab Closed
        </Badge>
      );
    default:
      return <Badge className="bg-gray-100 text-gray-600">{status}</Badge>;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "critical":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          \U0001f534 Critical
        </Badge>
      );
    case "high":
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
          \U0001f7e0 High
        </Badge>
      );
    case "medium":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
          \U0001f7e1 Medium
        </Badge>
      );
    case "low":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          \U0001f7e2 Low
        </Badge>
      );
    default:
      return <Badge className="bg-gray-100 text-gray-600">{priority}</Badge>;
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

function withCacheBust(url: string, token: string) {
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${encodeURIComponent(token)}`;
}

export default function BackjobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mainClass = useMainContentClass();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [showScheduledDateModal, setShowScheduledDateModal] = useState(false);
  const [scheduledDateInput, setScheduledDateInput] = useState("");
  const [scheduledDateLoading, setScheduledDateLoading] = useState(false);

  const fetchDispute = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/adminpanel/jobs/disputes/${disputeId}`,
        {
          credentials: "include",
        },
      );
      const data = await res.json();
      if (data.success) {
        setDispute(data.dispute);
        setLoading(false);
      } else {
        setError(data.error || "Failed to load dispute");
        setLoading(false);
      }
    } catch {
      setError("Network error loading dispute");
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  const fetchMessages = useCallback(async (convId: number) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/adminpanel/conversations/${convId}/messages`,
        {
          credentials: "include",
        },
      );
      const data = await res.json();
      if (data.success && data.messages) setMessages(data.messages);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (dispute?.status === "in_negotiation" && dispute.conversation_id) {
      const convId = dispute.conversation_id;
      fetchMessages(convId);
      pollRef.current = setInterval(() => fetchMessages(convId), 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [dispute?.status, dispute?.conversation_id, fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAcceptNegotiation = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/adminpanel/jobs/disputes/${dispute!.dispute_id}/accept-negotiation`,
        { method: "POST", credentials: "include" },
      );
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Dispute moved to negotiation. Admin chat is now open.");
        fetchDispute();
      } else {
        alert(data.error || "Failed to accept negotiation");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveBackjob = async () => {
    if (!confirm("Approve this backjob? Both parties will be notified."))
      return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/adminpanel/jobs/disputes/${dispute!.dispute_id}/approve-backjob`,
        { method: "POST", credentials: "include" },
      );
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Backjob approved. Both parties have been notified.");
        fetchDispute();
      } else {
        alert(data.error || "Failed to approve backjob");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetScheduledDate = async () => {
    if (!scheduledDateInput) {
      alert("Please select a date.");
      return;
    }
    setScheduledDateLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/adminpanel/jobs/disputes/${dispute!.dispute_id}/set-scheduled-date`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduled_date: scheduledDateInput }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setShowScheduledDateModal(false);
        setScheduledDateInput("");
        setSuccessMsg(
          data.message || "Scheduled date updated. Both parties have been notified.",
        );
        fetchDispute();
      } else {
        alert(data.error || "Failed to set scheduled date");
      }
    } catch {
      alert("Network error");
    } finally {
      setScheduledDateLoading(false);
    }
  };

  const handleFinishNegotiation = async () => {
    if (!dispute) return;
    if (!confirm("Finish mediation and leave this negotiation chat?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/adminpanel/jobs/disputes/${dispute.dispute_id}/finish-negotiation`,
        { method: "POST", credentials: "include" },
      );
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          "Negotiation mediation finished. Admin chat is now closed.",
        );
        setMessages([]);
        fetchDispute();
      } else {
        alert(data.error || "Failed to finish negotiation");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    setRejectError("");
    if (rejectReason.trim().length < 10) {
      setRejectError("Reason must be at least 10 characters.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/adminpanel/jobs/disputes/${dispute!.dispute_id}/reject-backjob`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setShowRejectModal(false);
        setRejectReason("");
        setSuccessMsg(
          "Backjob request rejected. The client has been notified.",
        );
        fetchDispute();
      } else {
        setRejectError(data.error || "Failed to reject");
      }
    } catch {
      setRejectError("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !dispute?.conversation_id) return;
    setSendingChat(true);
    const text = chatMessage.trim();
    setChatMessage("");
    try {
      await fetch(
        `${API_BASE}/api/adminpanel/conversations/${dispute.conversation_id}/send-message`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
      );
      fetchMessages(dispute.conversation_id);
    } catch {
      alert("Failed to send message");
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <main className={mainClass}>
          <div className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 font-medium">
              {error || "Dispute not found"}
            </p>
            <Button className="mt-4" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const isOpen = dispute.status === "open";
  const isNegotiating = dispute.status === "in_negotiation";
  const canAdminChat = Boolean(
    dispute.can_admin_chat && dispute.conversation_id,
  );
  const isFinished = ["resolved", "closed"].includes(dispute.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Sidebar />

      <main className={`${mainClass} p-6 space-y-6`}>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Backjobs
          </button>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className="text-gray-700 font-medium">{dispute.id}</span>
        </div>

        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {getStatusBadge(dispute.status)}
                  {getPriorityBadge(dispute.priority)}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {dispute.job_title}
                </h1>
                <p className="text-gray-500 text-sm">
                  {dispute.id} &middot; Opened {fmtDate(dispute.opened_date)}
                </p>
                {dispute.in_negotiation_at && (
                  <p className="text-purple-600 text-sm mt-1">
                    Negotiation started {fmtDate(dispute.in_negotiation_at)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="bg-orange-50 rounded-xl px-4 py-2 text-center min-w-[100px]">
                  <p className="text-xs text-gray-500">Job Amount</p>
                  <p className="font-bold text-orange-600">
                    {formatCurrency(dispute.job_amount)}
                  </p>
                </div>
                {dispute.disputed_amount > 0 && (
                  <div className="bg-red-50 rounded-xl px-4 py-2 text-center min-w-[100px]">
                    <p className="text-xs text-gray-500">Disputed</p>
                    <p className="font-bold text-red-600">
                      {formatCurrency(dispute.disputed_amount)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-orange-500" />
                  Dispute Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Reason
                  </p>
                  <p className="text-gray-800 font-medium">{dispute.reason}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {dispute.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Disputed By
                    </p>
                    <p className="capitalize font-medium text-gray-800">
                      {dispute.disputed_by === "client" ? "Client" : "Worker"}
                    </p>
                  </div>
                  {dispute.category && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Category
                      </p>
                      <p className="font-medium text-gray-800">
                        {dispute.category}
                      </p>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Backjob Progress
                  </p>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    {[
                      { label: "Started", done: dispute.backjob_started },
                      {
                        label: "Worker Done",
                        done: dispute.worker_marked_complete,
                      },
                      {
                        label: "Client Confirmed",
                        done: dispute.client_confirmed,
                      },
                    ].map((step, i, arr) => (
                      <div key={step.label} className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            step.done
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {step.done ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {step.label}
                        </div>
                        {i < arr.length - 1 && (
                          <ChevronRight className="h-3 w-3 text-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                  {dispute.scheduled_date && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                        📅 Scheduled Date
                      </span>
                      <span className="text-sm font-semibold text-orange-700">
                        {fmtDate(dispute.scheduled_date)}
                      </span>
                    </div>
                  )}
                </div>
                {dispute.resolution && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Resolution
                    </p>
                    <p className="text-gray-700">{dispute.resolution}</p>
                    {dispute.resolved_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        {fmtDate(dispute.resolved_date)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {dispute.evidence.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Image className="h-5 w-5 text-orange-500" />
                    Evidence ({dispute.evidence.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {dispute.evidence.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() =>
                          setLightboxUrl(
                            withCacheBust(ev.image_url, dispute.updated_at),
                          )
                        }
                        className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={withCacheBust(ev.image_url, dispute.updated_at)}
                          alt={ev.description || `Evidence ${ev.id}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {ev.description && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                            {ev.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {isNegotiating && canAdminChat && (
              <Card className="border-0 shadow-xl">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    Negotiation Chat
                    <span className="ml-auto text-xs font-normal text-gray-400 flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      Live
                    </span>
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-1">
                    Visible to client, worker, and admin. Auto-refreshes every 5
                    seconds.
                  </p>
                </CardHeader>
                <CardContent
                  className="p-0 flex flex-col"
                  style={{ height: "420px" }}
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-8">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No messages yet. Start the negotiation below.
                      </div>
                    ) : (
                      messages.map((msg) => {
                        if (msg.sender_type === "system") {
                          return (
                            <div key={msg.id} className="text-center">
                              <span className="inline-block bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full italic">
                                {msg.text}
                              </span>
                            </div>
                          );
                        }
                        const isAdmin = msg.sender_type === "admin";
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                isAdmin
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {isAdmin ? (
                                <Shield className="h-4 w-4" />
                              ) : (
                                msg.sender_name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div
                              className={`max-w-[75%] flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}
                            >
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-xs font-semibold ${isAdmin ? "text-purple-600" : "text-gray-600"}`}
                                >
                                  {isAdmin ? "Admin" : msg.sender_name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {fmtDate(msg.created_at)}
                                </span>
                              </div>
                              <div
                                className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                                  isAdmin
                                    ? "bg-purple-600 text-white rounded-tr-sm"
                                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t border-gray-100 p-3 flex gap-2 items-end">
                    <Textarea
                      placeholder="Type a message as Admin (Enter to send, Shift+Enter for new line)"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                      className="flex-1 min-h-[60px] max-h-[120px] resize-none rounded-xl border-gray-200 text-sm"
                    />
                    <Button
                      onClick={handleSendChatMessage}
                      disabled={sendingChat || !chatMessage.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4 rounded-xl"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isNegotiating && !canAdminChat && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Negotiation mediation has been finished. Admin chat access
                    is now closed.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-orange-500" />
                  Parties Involved
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {dispute.client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Client</p>
                    <p className="font-semibold text-gray-800 truncate">
                      {dispute.client.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {dispute.client.email}
                    </p>
                  </div>
                  <Link href={`/admin/users/clients/${dispute.client.id}`}>
                    <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer text-xs">
                      View
                    </Badge>
                  </Link>
                </div>
                {dispute.worker && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                      {dispute.worker.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Worker</p>
                      <p className="font-semibold text-gray-800 truncate">
                        {dispute.worker.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {dispute.worker.email}
                      </p>
                    </div>
                    <Link href={`/admin/users/workers/${dispute.worker.id}`}>
                      <Badge className="bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer text-xs">
                        View
                      </Badge>
                    </Link>
                  </div>
                )}
                {dispute.agency && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                    <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                      {dispute.agency.name?.charAt(0) ?? "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Agency</p>
                      <p className="font-semibold text-gray-800 truncate">
                        {dispute.agency.name}
                      </p>
                    </div>
                    <Link href={`/admin/users/agencies/${dispute.agency.id}`}>
                      <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-200 cursor-pointer text-xs">
                        View
                      </Badge>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Opened</span>
                    <span className="text-gray-800 font-medium">
                      {fmtDate(dispute.opened_date)}
                    </span>
                  </div>
                  {dispute.in_negotiation_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-purple-500">Negotiation</span>
                      <span className="text-purple-700 font-medium">
                        {fmtDate(dispute.in_negotiation_at)}
                      </span>
                    </div>
                  )}
                  {dispute.resolved_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-500">Resolved</span>
                      <span className="text-green-700 font-medium">
                        {fmtDate(dispute.resolved_date)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-400">Last updated</span>
                    <span className="text-gray-600 text-xs">
                      {fmtDate(dispute.updated_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isFinished && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-orange-500" />
                    Admin Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isOpen && (
                    <>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={actionLoading}
                        onClick={handleAcceptNegotiation}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Accept for Negotiation
                      </Button>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionLoading}
                        onClick={handleApproveBackjob}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Directly
                      </Button>
                      <Button
                        className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        disabled={actionLoading}
                        onClick={() => setShowRejectModal(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Request
                      </Button>
                    </>
                  )}
                  {isNegotiating && (
                    <>
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-600">
                        Negotiation in progress. Use the chat to mediate, then
                        finish negotiation when done.
                      </div>
                      {canAdminChat && (
                        <Button
                          className="w-full bg-gray-700 hover:bg-gray-800 text-white"
                          disabled={actionLoading}
                          onClick={handleFinishNegotiation}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Finish Negotiation
                        </Button>
                      )}
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionLoading}
                        onClick={handleApproveBackjob}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Backjob
                      </Button>
                      <Button
                        className="w-full bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
                        disabled={actionLoading}
                        onClick={() => {
                          setScheduledDateInput(dispute.scheduled_date ? dispute.scheduled_date.split("T")[0] : "");
                          setShowScheduledDateModal(true);
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {dispute.scheduled_date ? "Update Scheduled Date" : "Set Scheduled Date"}
                      </Button>
                      <Button
                        className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        disabled={actionLoading}
                        onClick={() => setShowRejectModal(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject &amp; Close
                      </Button>
                    </>
                  )}
                  {dispute.status === "under_review" && (
                    <>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-600">
                        This dispute is under review.
                      </div>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionLoading}
                        onClick={handleApproveBackjob}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Backjob
                      </Button>
                      <Button
                        className="w-full bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
                        disabled={actionLoading}
                        onClick={() => {
                          setScheduledDateInput(dispute.scheduled_date ? dispute.scheduled_date.split("T")[0] : "");
                          setShowScheduledDateModal(true);
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {dispute.scheduled_date ? "Update Scheduled Date" : "Set Scheduled Date"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {isFinished && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div
                    className={`p-4 rounded-xl text-center ${
                      dispute.status === "resolved"
                        ? "bg-green-50 border border-green-200 text-green-600"
                        : "bg-gray-50 border border-gray-200 text-gray-500"
                    }`}
                  >
                    {dispute.status === "resolved" ? (
                      <>
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-semibold">Backjob Resolved</p>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-semibold">Request Closed</p>
                        {dispute.admin_rejection_reason && (
                          <p className="text-xs mt-1 opacity-70">
                            {dispute.admin_rejection_reason}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {showScheduledDateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {dispute?.scheduled_date ? "Update Scheduled Date" : "Set Scheduled Date"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Set the agreed date for when the backjob will be completed. Both parties will be notified.
            </p>
            {dispute?.scheduled_date && (
              <div className="mb-3 p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-700">
                Current: {fmtDate(dispute.scheduled_date)}
              </div>
            )}
            <input
              type="date"
              value={scheduledDateInput}
              onChange={(e) => setScheduledDateInput(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowScheduledDateModal(false);
                  setScheduledDateInput("");
                }}
                disabled={scheduledDateLoading}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleSetScheduledDate}
                disabled={scheduledDateLoading || !scheduledDateInput}
              >
                {scheduledDateLoading
                  ? "Saving..."
                  : dispute?.scheduled_date
                    ? "Update Date"
                    : "Set Date"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Reject Backjob Request
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Provide a clear reason. The client will be notified.
            </p>
            <Textarea
              placeholder="Reason for rejection (minimum 10 characters)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full min-h-[100px] rounded-xl border-gray-200 text-sm mb-2"
            />
            <div className="flex justify-between items-center mb-4">
              <span
                className={`text-xs ${rejectReason.length < 10 ? "text-red-400" : "text-green-500"}`}
              >
                {rejectReason.length} / 10 min characters
              </span>
              {rejectError && (
                <span className="text-xs text-red-500">{rejectError}</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={actionLoading}
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectError("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                disabled={actionLoading || rejectReason.trim().length < 10}
                onClick={handleRejectSubmit}
              >
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Evidence"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full h-9 w-9 flex items-center justify-center text-lg font-bold"
          >
            x
          </button>
        </div>
      )}
    </div>
  );
}
