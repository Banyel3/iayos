"use client";

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
} from "lucide-react";
import Link from "next/link";

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
}

// Mock data - Extended version with more details
const mockDisputeDetails: Record<string, JobDispute> = {
  "DISP-003": {
    id: "DISP-003",
    jobId: "JOB-089",
    jobTitle: "Plumbing Repair - Quality Issues",
    category: "Plumbing",
    disputedBy: "client",
    client: {
      id: "CLI-303",
      name: "David Anderson",
      email: "david.anderson@email.com",
      phone: "+1 (555) 789-4561",
    },
    worker: {
      id: "WRK-203",
      name: "Carlos Rodriguez",
      email: "carlos.rodriguez@email.com",
      phone: "+1 (555) 234-7890",
    },
    reason: "Poor Quality",
    description:
      "The plumbing repair started leaking again after 3 days. Worker claims it's a different issue but the leak is in the same location. Requesting redo or full refund.",
    openedDate: "2024-10-10T16:45:00",
    status: "resolved",
    priority: "high",
    jobAmount: 425,
    disputedAmount: 425,
    resolution:
      "After mediation, worker initially refused to return claiming the work was done correctly. IAYOS Support invoked the quality guarantee policy requiring repairs within 7 days to be covered under original work. Worker agreed to return and successfully fixed the connection issue at no additional cost. Client confirmed leak resolved. Dispute closed successfully.",
    resolvedDate: "2024-10-13T14:30:00",
    evidence: [
      {
        type: "Photos",
        description: "leak_under_sink_photo1.jpg",
        submittedBy: "David Anderson (Client)",
        submittedDate: "2024-10-10T17:00:00",
      },
      {
        type: "Video",
        description: "water_damage_leak_video.mp4",
        submittedBy: "David Anderson (Client)",
        submittedDate: "2024-10-10T17:15:00",
      },
      {
        type: "Work Order",
        description: "original_repair_invoice_089.pdf",
        submittedBy: "Carlos Rodriguez (Worker)",
        submittedDate: "2024-10-11T09:30:00",
      },
      {
        type: "Photos",
        description: "before_repair_work_photos.jpg",
        submittedBy: "Carlos Rodriguez (Worker)",
        submittedDate: "2024-10-11T09:30:00",
      },
    ],
    messages: [
      {
        id: "MSG-001",
        sender: "IAYOS Support",
        role: "Staff",
        message:
          "Hello David, we've received your dispute regarding the plumbing repair. We're reviewing the evidence you submitted. We'll contact the worker and work towards a resolution.",
        timestamp: "2024-10-10T18:00:00",
      },
      {
        id: "MSG-002",
        sender: "David Anderson",
        role: "Client",
        message:
          "Thank you. I really need this fixed properly. The leak is causing water damage to my cabinet.",
        timestamp: "2024-10-10T18:15:00",
      },
      {
        id: "MSG-003",
        sender: "IAYOS Support",
        role: "Staff",
        message:
          "Hello Carlos, we've received a dispute from your client David Anderson regarding Job #089. He's reporting that the repair is leaking again in the same location. Can you review the evidence and let us know your assessment?",
        timestamp: "2024-10-11T09:00:00",
      },
      {
        id: "MSG-004",
        sender: "Carlos Rodriguez",
        role: "Worker",
        message:
          "I've looked at the photos. The work I did was solid, but I can see there is a leak. However, I already completed this job and was paid. This might be a different issue.",
        timestamp: "2024-10-11T10:30:00",
      },
      {
        id: "MSG-005",
        sender: "IAYOS Support",
        role: "Staff",
        message:
          "Carlos, we understand your concern. However, looking at the video evidence, the leak appears to be from the same connection point you repaired. We'd like to propose that you return to redo the work at no additional charge to maintain quality standards.",
        timestamp: "2024-10-11T11:00:00",
      },
      {
        id: "MSG-006",
        sender: "Carlos Rodriguez",
        role: "Worker",
        message:
          "I don't think that's fair. I did the work correctly. If I go back, I want to be paid for my time.",
        timestamp: "2024-10-11T11:45:00",
      },
      {
        id: "MSG-007",
        sender: "IAYOS Support",
        role: "Staff",
        message:
          "Carlos, we appreciate your perspective. However, as per our quality guarantee policy, if a repair fails within 7 days, it's considered part of the original work scope. The evidence clearly shows the same location is leaking. We need you to honor the quality guarantee.",
        timestamp: "2024-10-11T13:00:00",
      },
      {
        id: "MSG-008",
        sender: "Carlos Rodriguez",
        role: "Worker",
        message:
          "Fine. I'll go back tomorrow afternoon and check it out. But if it's a completely different issue, we'll need to discuss additional payment.",
        timestamp: "2024-10-11T14:30:00",
      },
      {
        id: "MSG-009",
        sender: "IAYOS Support",
        role: "Staff",
        message:
          "Thank you Carlos for agreeing to return. David, Carlos will come by tomorrow afternoon to inspect and fix the issue. Please let us know once the work is completed.",
        timestamp: "2024-10-11T14:45:00",
      },
      {
        id: "MSG-010",
        sender: "David Anderson",
        role: "Client",
        message:
          "Great, thank you! Tomorrow afternoon works for me. I'll be home after 2pm.",
        timestamp: "2024-10-11T15:00:00",
      },
      {
        id: "MSG-011",
        sender: "Carlos Rodriguez",
        role: "Worker",
        message:
          "Work completed. I found the issue - the connection wasn't properly tightened during the first repair. I've fixed it and tested it thoroughly. Should be good now.",
        timestamp: "2024-10-13T16:00:00",
      },
      {
        id: "MSG-012",
        sender: "David Anderson",
        role: "Client",
        message:
          "Yes, confirmed! The leak has stopped. Thank you Carlos for coming back and fixing it properly. And thank you IAYOS support for helping resolve this.",
        timestamp: "2024-10-13T18:00:00",
      },
      {
        id: "MSG-013",
        sender: "IAYOS Support",
        role: "Staff",
        message:
          "Excellent! We're glad this was resolved. Carlos, thank you for honoring our quality guarantee. David, thank you for your patience. We're marking this dispute as resolved.",
        timestamp: "2024-10-13T18:30:00",
      },
    ],
    timeline: [
      {
        event: "Dispute Opened",
        description: "Client filed dispute claiming poor quality work",
        timestamp: "2024-10-10T16:45:00",
      },
      {
        event: "Evidence Submitted",
        description: "Client submitted photos and video of leak",
        timestamp: "2024-10-10T17:15:00",
      },
      {
        event: "Assigned to Admin",
        description: "Dispute assigned to Admin Support Team for review",
        timestamp: "2024-10-10T18:00:00",
      },
      {
        event: "Worker Response",
        description: "Worker submitted original work documentation",
        timestamp: "2024-10-11T09:30:00",
      },
      {
        event: "Admin Review",
        description: "Admin requested worker to inspect and resolve issue",
        timestamp: "2024-10-11T10:00:00",
      },
      {
        event: "Resolution Agreed",
        description: "Worker agreed to return and fix issue at no cost",
        timestamp: "2024-10-11T14:30:00",
      },
      {
        event: "Work Completed",
        description: "Worker completed repair work successfully",
        timestamp: "2024-10-13T14:15:00",
      },
      {
        event: "Client Confirmation",
        description: "Client confirmed issue is resolved",
        timestamp: "2024-10-13T16:30:00",
      },
      {
        event: "Dispute Resolved",
        description: "Dispute closed successfully by admin",
        timestamp: "2024-10-13T17:00:00",
      },
    ],
    assignedTo: "Admin Support Team",
  },
};

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const dispute = mockDisputeDetails[disputeId];

  if (!dispute) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Dispute Not Found
                </h2>
                <p className="text-gray-600 mb-6">
                  The requested dispute could not be found.
                </p>
                <Link href="/admin/jobs/disputes">
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
            <Link href="/admin/jobs/disputes">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Disputes
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
              {dispute.status === "open" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full bg-green-600 text-white">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </Button>
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button
                      className="w-full bg-red-600 text-white"
                      variant="outline"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Close Dispute
                    </Button>
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
