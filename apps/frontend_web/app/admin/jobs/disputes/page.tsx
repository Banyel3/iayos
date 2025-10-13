"use client";

import { useState } from "react";
import { Sidebar } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Download,
  Eye,
  AlertTriangle,
  MessageSquare,
  Clock,
  XCircle,
  CheckCircle,
  User,
  DollarSign,
  FileText,
  Calendar,
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
  };
  worker: {
    id: string;
    name: string;
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
  }[];
  messages: number;
  assignedTo?: string;
}

const mockDisputes: JobDispute[] = [
  {
    id: "DISP-001",
    jobId: "JOB-045",
    jobTitle: "Painting Service - Incomplete Work",
    category: "Painting",
    disputedBy: "client",
    client: {
      id: "CLI-301",
      name: "Robert Thompson",
    },
    worker: {
      id: "WRK-201",
      name: "James Wilson",
    },
    reason: "Incomplete Work",
    description:
      "The worker only completed half of the painting job before leaving. Two rooms were left unpainted despite the agreement. Requesting partial refund for incomplete work.",
    openedDate: "2024-10-12T14:30:00",
    status: "open",
    priority: "high",
    jobAmount: 650,
    disputedAmount: 325,
    evidence: [
      {
        type: "Photos",
        description: "Images showing unpainted rooms",
      },
      {
        type: "Contract",
        description: "Original agreement specifying 4 rooms",
      },
    ],
    messages: 8,
    assignedTo: "Admin Support Team",
  },
  {
    id: "DISP-002",
    jobId: "JOB-067",
    jobTitle: "Electrical Installation - Damage Claim",
    category: "Electrical",
    disputedBy: "worker",
    client: {
      id: "CLI-302",
      name: "Sandra Martinez",
    },
    worker: {
      id: "WRK-202",
      name: "Michael Chen",
    },
    reason: "Payment Issue",
    description:
      "Client is refusing to release payment claiming damage to walls during installation. All work was completed professionally and any wall marks were from existing conditions. Requesting full payment release.",
    openedDate: "2024-10-11T09:15:00",
    status: "under_review",
    priority: "medium",
    jobAmount: 890,
    disputedAmount: 890,
    evidence: [
      {
        type: "Photos",
        description: "Before and after photos of installation",
      },
      {
        type: "Completion Certificate",
        description: "Signed completion document",
      },
      {
        type: "Messages",
        description: "Chat history with client",
      },
    ],
    messages: 15,
    assignedTo: "Senior Mediator - John Doe",
  },
  {
    id: "DISP-003",
    jobId: "JOB-089",
    jobTitle: "Plumbing Repair - Quality Issues",
    category: "Plumbing",
    disputedBy: "client",
    client: {
      id: "CLI-303",
      name: "David Anderson",
    },
    worker: {
      id: "WRK-203",
      name: "Carlos Rodriguez",
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
      "Worker agreed to return and fix the issue at no additional cost. Work completed successfully on 2024-10-13. Dispute closed.",
    resolvedDate: "2024-10-13",
    evidence: [
      {
        type: "Photos",
        description: "Images of recurring leak",
      },
      {
        type: "Video",
        description: "Video showing water damage",
      },
    ],
    messages: 12,
    assignedTo: "Admin Support Team",
  },
  {
    id: "DISP-004",
    jobId: "JOB-102",
    jobTitle: "Landscaping - Scope Disagreement",
    category: "Landscaping",
    disputedBy: "worker",
    client: {
      id: "CLI-304",
      name: "Patricia White",
    },
    worker: {
      id: "WRK-204",
      name: "Jose Garcia",
    },
    reason: "Scope Creep",
    description:
      "Client is requesting additional work not included in original agreement without additional payment. Original job was for basic lawn maintenance, now requesting tree trimming and mulching.",
    openedDate: "2024-10-09T11:20:00",
    status: "under_review",
    priority: "low",
    jobAmount: 350,
    disputedAmount: 150,
    evidence: [
      {
        type: "Original Agreement",
        description: "Contract showing agreed scope",
      },
      {
        type: "Messages",
        description: "Client's additional requests",
      },
    ],
    messages: 6,
    assignedTo: "Mediator - Jane Smith",
  },
  {
    id: "DISP-005",
    jobId: "JOB-115",
    jobTitle: "Home Cleaning - Damage Claim",
    category: "Home Cleaning",
    disputedBy: "client",
    client: {
      id: "CLI-305",
      name: "Linda Johnson",
    },
    worker: {
      id: "WRK-205",
      name: "Ana Silva",
    },
    reason: "Property Damage",
    description:
      "Client claims expensive vase was broken during cleaning service. Worker denies responsibility and states vase was already cracked. Requesting insurance claim or compensation.",
    openedDate: "2024-10-08T13:00:00",
    status: "open",
    priority: "critical",
    jobAmount: 180,
    disputedAmount: 850,
    evidence: [
      {
        type: "Photos",
        description: "Images of broken vase",
      },
      {
        type: "Receipt",
        description: "Vase purchase receipt from client",
      },
      {
        type: "Witness Statement",
        description: "Neighbor's testimony",
      },
    ],
    messages: 20,
    assignedTo: "Legal Team",
  },
];

export default function JobDisputesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredDisputes = mockDisputes.filter((dispute) => {
    const matchesSearch =
      dispute.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || dispute.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || dispute.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-4 w-4" />;
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

  const statusCounts = {
    all: mockDisputes.length,
    open: mockDisputes.filter((d) => d.status === "open").length,
    under_review: mockDisputes.filter((d) => d.status === "under_review")
      .length,
    resolved: mockDisputes.filter((d) => d.status === "resolved").length,
    closed: mockDisputes.filter((d) => d.status === "closed").length,
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Job Disputes
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and resolve conflicts between clients and workers
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Disputes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.all}</div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Open
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {statusCounts.open}
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Under Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {statusCounts.under_review}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {statusCounts.resolved}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Closed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {statusCounts.closed}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by job, client, worker, or reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-white"
                >
                  <option value="all">All Priority</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Disputes List */}
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <Card
                key={dispute.id}
                className="hover:shadow-lg transition-shadow border-l-4"
                style={{
                  borderLeftColor:
                    dispute.priority === "critical"
                      ? "#dc2626"
                      : dispute.priority === "high"
                        ? "#ea580c"
                        : dispute.priority === "medium"
                          ? "#ca8a04"
                          : "#2563eb",
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle
                          className={`h-5 w-5 ${
                            dispute.priority === "critical"
                              ? "text-red-600"
                              : dispute.priority === "high"
                                ? "text-orange-600"
                                : dispute.priority === "medium"
                                  ? "text-yellow-600"
                                  : "text-blue-600"
                          }`}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {dispute.jobTitle}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(
                            dispute.status
                          )}`}
                        >
                          {getStatusIcon(dispute.status)}
                          {dispute.status.replace("_", " ").toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${getPriorityColor(
                            dispute.priority
                          )}`}
                        >
                          {dispute.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>
                          Dispute ID:{" "}
                          <span className="font-medium">{dispute.id}</span>
                        </span>
                        <span>
                          Job ID:{" "}
                          <Link
                            href={`/admin/jobs/listings/${dispute.jobId}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {dispute.jobId}
                          </Link>
                        </span>
                        <span>
                          Category:{" "}
                          <span className="font-medium">
                            {dispute.category}
                          </span>
                        </span>
                        <span>
                          Disputed by:{" "}
                          <span className="font-medium capitalize">
                            {dispute.disputedBy}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Parties Involved */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Client</p>
                      <Link
                        href={`/admin/users/clients/${dispute.client.id}`}
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {dispute.client.name}
                        </span>
                      </Link>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Worker</p>
                      <Link
                        href={`/admin/users/workers/${dispute.worker.id}`}
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {dispute.worker.name}
                        </span>
                      </Link>
                    </div>
                  </div>

                  {/* Dispute Reason */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Reason:{" "}
                      <span className="text-red-600">{dispute.reason}</span>
                    </p>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                      {dispute.description}
                    </p>
                  </div>

                  {/* Financial Info */}
                  <div className="flex items-center gap-6 mb-4 p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">Job Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${dispute.jobAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Disputed Amount</p>
                      <p className="text-lg font-bold text-red-600">
                        ${dispute.disputedAmount}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">
                        Evidence Submitted
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {dispute.evidence.length} items
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Messages</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {dispute.messages}
                      </p>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Evidence:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dispute.evidence.map((evidence, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200"
                        >
                          {evidence.type}: {evidence.description}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resolution (if resolved) */}
                  {dispute.status === "resolved" && dispute.resolution && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900 mb-1">
                            Resolution:
                          </p>
                          <p className="text-sm text-green-800">
                            {dispute.resolution}
                          </p>
                          {dispute.resolvedDate && (
                            <p className="text-xs text-green-700 mt-2">
                              Resolved on:{" "}
                              {new Date(dispute.resolvedDate).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Opened: {new Date(dispute.openedDate).toLocaleString()}
                      </span>
                      {dispute.assignedTo && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          Assigned to: {dispute.assignedTo}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/jobs/disputes/${dispute.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages ({dispute.messages})
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Evidence
                      </Button>
                      {dispute.status === "open" && (
                        <Button size="sm" className="bg-blue-600 text-white">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDisputes.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No disputes found matching your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
