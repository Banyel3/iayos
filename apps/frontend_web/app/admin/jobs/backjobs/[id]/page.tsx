"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "../../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ImageIcon,
  History,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface ActivityLog {
  id: number;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  notes: string | null;
  created_at: string;
  is_backjob_event: boolean;
}

interface BackjobWorkflow {
  backjob_started: boolean;
  backjob_started_at: string | null;
  worker_marked_complete: boolean;
  worker_marked_complete_at: string | null;
  client_confirmed: boolean;
  client_confirmed_at: string | null;
}

interface JobDispute {
  id: string;
  jobId: string;
  jobTitle: string;
  category: string;
  disputedBy: "client" | "worker";
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  worker: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  reason: string;
  description: string;
  openedDate: string;
  status: "open" | "under_review" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  jobAmount: number;
  disputedAmount: number;
  resolution?: string;
  resolvedDate?: string;
  evidence: {
    type: string;
    description: string;
    submittedBy: string;
    submittedDate: string;
  }[];
  evidenceImages: string[];
  messages: {
    id: string;
    sender: string;
    role: string;
    message: string;
    timestamp: string;
  }[];
  timeline: {
    event: string;
    description: string;
    timestamp: string;
  }[];
  assignedTo?: string;
  activityLogs?: ActivityLog[];
  backjobWorkflow?: BackjobWorkflow;
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;
  const [dispute, setDispute] = useState<JobDispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputeDetail();
  }, [disputeId]);

  const fetchDisputeDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/transactions/disputes/${disputeId}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication required. Please log in again.");
        } else if (response.status === 404) {
          setError("Dispute not found.");
        } else {
          setError(`Failed to fetch dispute: ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success && data.dispute) {
        // Transform backend response to frontend interface
        const d = data.dispute;
        setDispute({
          id: d.id?.toString() || d.dispute_id?.toString() || disputeId,
          jobId: d.job?.id?.toString() || d.job_id?.toString() || "",
          jobTitle: d.job?.title || d.job_title || "Unknown Job",
          category: d.job?.category || d.category || "General",
          disputedBy:
            d.disputed_by?.toLowerCase() === "worker" ? "worker" : "client",
          client: {
            id: d.client?.id?.toString() || d.client_id?.toString() || "",
            name: d.client?.name || d.client_name || "Unknown Client",
            email: d.client?.email || d.client_email || "",
            phone: d.client?.phone || d.client_phone || "",
          },
          worker: {
            id: d.worker?.id?.toString() || d.worker_id?.toString() || "",
            name: d.worker?.name || d.worker_name || "Unknown Worker",
            email: d.worker?.email || d.worker_email || "",
            phone: d.worker?.phone || d.worker_phone || "",
          },
          reason: d.reason || "Not specified",
          description: d.description || "",
          openedDate: d.created_at || d.opened_date || new Date().toISOString(),
          status: (d.status?.toLowerCase()?.replace(" ", "_") || "open") as any,
          priority: (d.priority?.toLowerCase() || "medium") as any,
          jobAmount: d.job_amount || d.job?.budget || 0,
          disputedAmount: d.disputed_amount || d.job_amount || 0,
          resolution: d.resolution,
          resolvedDate: d.resolved_date || d.resolved_at,
          evidence: d.evidence || [],
          evidenceImages: d.evidence_images || [],
          messages: d.messages || [],
          timeline: d.timeline || [],
          assignedTo: d.assigned_to || d.worker?.name || "Unassigned",
          activityLogs: d.activity_logs || [],
          backjobWorkflow: d.backjob_workflow || null,
        });
      } else {
        setError(data.error || "Failed to load dispute details.");
      }
    } catch (err) {
      console.error("Error fetching dispute:", err);
      setError("Failed to load dispute. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <p className="text-muted-foreground">
                Loading dispute details...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {error || "Dispute Not Found"}
                </h2>
                <p className="text-gray-600 mb-6">
                  The requested dispute could not be loaded.
                </p>
                <Link href="/admin/jobs/backjobs">
                  <Button>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Disputes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "low":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4" />;
      case "under_review":
        return <Clock className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "closed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/admin/jobs/backjobs">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Backjobs
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {dispute.jobTitle}
                </h1>
                <p className="text-gray-600 mt-1">Dispute ID: {dispute.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2 ${getStatusColor(
                    dispute.status
                  )}`}
                >
                  {getStatusIcon(dispute.status)}
                  {dispute.status.replace("_", " ").toUpperCase()}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-bold rounded ${getPriorityColor(
                    dispute.priority
                  )}`}
                >
                  {dispute.priority.toUpperCase()} PRIORITY
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dispute Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Dispute Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Reason
                    </p>
                    <p className="text-lg font-semibold text-red-600">
                      {dispute.reason}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Description
                    </p>
                    <p className="text-gray-700">{dispute.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Job Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${dispute.jobAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Disputed Amount
                      </p>
                      <p className="text-xl font-bold text-red-600">
                        ${dispute.disputedAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Category</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {dispute.category}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parties Involved */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Parties Involved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Client</p>
                        <Link
                          href={`/admin/users/clients/${dispute.client.id}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          {dispute.client.name}
                        </Link>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Worker</p>
                        <Link
                          href={`/admin/users/workers/${dispute.worker.id}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          {dispute.worker.name}
                        </Link>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Disputed by</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {dispute.disputedBy}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evidence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Evidence Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Evidence Images */}
                  {dispute.evidenceImages &&
                    dispute.evidenceImages.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">
                          <ImageIcon className="h-4 w-4 inline mr-1" />
                          Photos ({dispute.evidenceImages.length})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {dispute.evidenceImages.map((imageUrl, index) => (
                            <a
                              key={index}
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all bg-gray-100"
                            >
                              <img
                                src={imageUrl}
                                alt={`Evidence ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  target.parentElement!.innerHTML = `
                                    <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                      <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                      <span class="text-xs">Image unavailable</span>
                                    </div>
                                  `;
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Text Evidence */}
                  <div className="space-y-2">
                    {dispute.evidence.map((evidence, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {evidence.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted by {evidence.submittedBy.split(" (")[0]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Chat */}
              {dispute.status === "resolved" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      Resolution Discussion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dispute.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg border ${
                            message.role === "Staff"
                              ? "bg-blue-50 border-blue-200"
                              : message.role === "Client"
                                ? "bg-gray-50 border-gray-200"
                                : "bg-green-50 border-green-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  message.role === "Staff"
                                    ? "text-blue-700"
                                    : message.role === "Client"
                                      ? "text-gray-700"
                                      : "text-green-700"
                                }`}
                              >
                                {message.sender}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  message.role === "Staff"
                                    ? "bg-blue-200 text-blue-800"
                                    : message.role === "Client"
                                      ? "bg-gray-200 text-gray-800"
                                      : "bg-green-200 text-green-800"
                                }`}
                              >
                                {message.role}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(message.timestamp).toLocaleDateString()}{" "}
                              {new Date(message.timestamp).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {message.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resolution Summary */}
              {dispute.status === "resolved" && dispute.resolution && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-900">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Resolution Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-800 mb-3">
                      {dispute.resolution}
                    </p>
                    <div className="pt-3 border-t border-green-200">
                      <p className="text-xs text-green-700 font-medium">
                        Dispute Resolved •{" "}
                        {new Date(dispute.resolvedDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Backjob Workflow Progress */}
              {dispute.status === "under_review" && dispute.backjobWorkflow && (
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-900">
                      <PlayCircle className="h-5 w-5 text-orange-600" />
                      Backjob Workflow Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Step 1: Client confirms work started */}
                      <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                        dispute.backjobWorkflow.backjob_started 
                          ? "bg-green-50 border-green-200" 
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          dispute.backjobWorkflow.backjob_started 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-300 text-gray-600"
                        }`}>
                          {dispute.backjobWorkflow.backjob_started ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">1</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            dispute.backjobWorkflow.backjob_started ? "text-green-800" : "text-gray-600"
                          }`}>
                            Client Confirms Work Started
                          </p>
                          {dispute.backjobWorkflow.backjob_started_at && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ {new Date(dispute.backjobWorkflow.backjob_started_at).toLocaleString()}
                            </p>
                          )}
                          {!dispute.backjobWorkflow.backjob_started && (
                            <p className="text-xs text-gray-500 mt-1">Waiting for client...</p>
                          )}
                        </div>
                      </div>

                      {/* Step 2: Worker marks complete */}
                      <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                        dispute.backjobWorkflow.worker_marked_complete 
                          ? "bg-green-50 border-green-200" 
                          : dispute.backjobWorkflow.backjob_started
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          dispute.backjobWorkflow.worker_marked_complete 
                            ? "bg-green-500 text-white" 
                            : dispute.backjobWorkflow.backjob_started
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-300 text-gray-600"
                        }`}>
                          {dispute.backjobWorkflow.worker_marked_complete ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">2</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            dispute.backjobWorkflow.worker_marked_complete 
                              ? "text-green-800" 
                              : dispute.backjobWorkflow.backjob_started
                                ? "text-yellow-800"
                                : "text-gray-600"
                          }`}>
                            Worker Marks Complete
                          </p>
                          {dispute.backjobWorkflow.worker_marked_complete_at && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ {new Date(dispute.backjobWorkflow.worker_marked_complete_at).toLocaleString()}
                            </p>
                          )}
                          {dispute.backjobWorkflow.backjob_started && !dispute.backjobWorkflow.worker_marked_complete && (
                            <p className="text-xs text-yellow-600 mt-1">⏳ In progress...</p>
                          )}
                          {!dispute.backjobWorkflow.backjob_started && (
                            <p className="text-xs text-gray-500 mt-1">Pending step 1</p>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Client confirms completion */}
                      <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                        dispute.backjobWorkflow.client_confirmed 
                          ? "bg-green-50 border-green-200" 
                          : dispute.backjobWorkflow.worker_marked_complete
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          dispute.backjobWorkflow.client_confirmed 
                            ? "bg-green-500 text-white" 
                            : dispute.backjobWorkflow.worker_marked_complete
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-300 text-gray-600"
                        }`}>
                          {dispute.backjobWorkflow.client_confirmed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">3</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            dispute.backjobWorkflow.client_confirmed 
                              ? "text-green-800" 
                              : dispute.backjobWorkflow.worker_marked_complete
                                ? "text-yellow-800"
                                : "text-gray-600"
                          }`}>
                            Client Confirms Completion
                          </p>
                          {dispute.backjobWorkflow.client_confirmed_at && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ {new Date(dispute.backjobWorkflow.client_confirmed_at).toLocaleString()}
                            </p>
                          )}
                          {dispute.backjobWorkflow.worker_marked_complete && !dispute.backjobWorkflow.client_confirmed && (
                            <p className="text-xs text-yellow-600 mt-1">⏳ Waiting for client approval...</p>
                          )}
                          {!dispute.backjobWorkflow.worker_marked_complete && (
                            <p className="text-xs text-gray-500 mt-1">Pending step 2</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Activity Log */}
              {dispute.activityLogs && dispute.activityLogs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-indigo-600" />
                      Activity Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {dispute.activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-3 rounded-lg border ${
                            log.is_backjob_event
                              ? "bg-orange-50 border-orange-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                log.is_backjob_event
                                  ? "bg-orange-200 text-orange-800"
                                  : "bg-gray-200 text-gray-700"
                              }`}>
                                {log.new_status.replace(/_/g, " ")}
                              </span>
                              {log.old_status && log.old_status !== log.new_status && (
                                <span className="text-xs text-gray-400">
                                  from {log.old_status.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-sm text-gray-700 mt-1">{log.notes}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            By: {log.changed_by}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar Info */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dispute Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Job ID</p>
                    <Link
                      href={`/admin/jobs/listings/${dispute.jobId}`}
                      className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {dispute.jobId}
                      <span className="text-xs">
                        #{dispute.jobId.split("-")[1]}
                      </span>
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Category</p>
                    <p className="text-sm font-medium text-gray-900">
                      {dispute.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Opened</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(dispute.openedDate).toLocaleDateString()}
                    </p>
                  </div>
                  {dispute.resolvedDate && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Resolved</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(dispute.resolvedDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {dispute.assignedTo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                      <p className="text-sm font-medium text-blue-600">
                        {dispute.assignedTo}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {(dispute.status === "open" ||
                dispute.status === "under_review") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dispute.status === "open" && (
                      <>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Approve this backjob request? The worker/agency will be notified."
                              )
                            )
                              return;
                            try {
                              const res = await fetch(
                                `http://localhost:8000/api/adminpanel/jobs/disputes/${disputeId}/approve-backjob`,
                                {
                                  method: "POST",
                                  credentials: "include",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    priority: dispute.priority,
                                  }),
                                }
                              );
                              const data = await res.json();
                              if (data.success) {
                                alert(
                                  "Backjob approved! Worker/agency has been notified."
                                );
                                fetchDisputeDetail();
                              } else {
                                alert(
                                  data.error || "Failed to approve backjob"
                                );
                              }
                            } catch (err) {
                              alert("Error approving backjob");
                            }
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Backjob
                        </Button>
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          onClick={async () => {
                            const reason = prompt("Enter rejection reason:");
                            if (!reason) return;
                            try {
                              const res = await fetch(
                                `http://localhost:8000/api/adminpanel/jobs/disputes/${disputeId}/reject-backjob`,
                                {
                                  method: "POST",
                                  credentials: "include",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ reason }),
                                }
                              );
                              const data = await res.json();
                              if (data.success) {
                                alert(
                                  "Backjob rejected. Client has been notified."
                                );
                                fetchDisputeDetail();
                              } else {
                                alert(data.error || "Failed to reject backjob");
                              }
                            } catch (err) {
                              alert("Error rejecting backjob");
                            }
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Backjob
                        </Button>
                      </>
                    )}
                    {dispute.status === "under_review" && (
                      <div className="text-center py-2">
                        <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                          ⏳ Waiting for worker/agency to complete the backjob
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
