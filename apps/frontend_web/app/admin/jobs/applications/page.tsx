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
  CheckCircle,
  XCircle,
  Clock,
  Star,
  FileText,
  User,
} from "lucide-react";
import Link from "next/link";

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  worker: {
    id: string;
    name: string;
    rating: number;
    completedJobs: number;
    profileImage?: string;
  };
  appliedDate: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  proposedRate: number;
  rateType: "fixed" | "hourly";
  coverLetter: string;
  estimatedDuration: string;
  availability: string;
  client: {
    name: string;
    id: string;
  };
}

const mockApplications: JobApplication[] = [
  {
    id: "APP-001",
    jobId: "JOB-001",
    jobTitle: "Residential Plumbing Repair",
    worker: {
      id: "WRK-101",
      name: "Mike Thompson",
      rating: 4.9,
      completedJobs: 127,
    },
    appliedDate: "2024-10-12T09:30:00",
    status: "pending",
    proposedRate: 240,
    rateType: "fixed",
    coverLetter:
      "I have 10+ years of experience in residential plumbing. I can complete this job within 24 hours with guaranteed quality work.",
    estimatedDuration: "1 day",
    availability: "Available immediately",
    client: {
      name: "Sarah Wilson",
      id: "CLI-201",
    },
  },
  {
    id: "APP-002",
    jobId: "JOB-001",
    jobTitle: "Residential Plumbing Repair",
    worker: {
      id: "WRK-102",
      name: "James Rodriguez",
      rating: 4.7,
      completedJobs: 89,
    },
    appliedDate: "2024-10-12T10:15:00",
    status: "pending",
    proposedRate: 250,
    rateType: "fixed",
    coverLetter:
      "Licensed plumber with expertise in leak repairs. I can provide same-day service with a warranty on all work.",
    estimatedDuration: "1-2 days",
    availability: "Can start today",
    client: {
      name: "Sarah Wilson",
      id: "CLI-201",
    },
  },
  {
    id: "APP-003",
    jobId: "JOB-002",
    jobTitle: "House Cleaning Service",
    worker: {
      id: "WRK-103",
      name: "Maria Garcia",
      rating: 4.8,
      completedJobs: 156,
    },
    appliedDate: "2024-10-11T14:20:00",
    status: "accepted",
    proposedRate: 32,
    rateType: "hourly",
    coverLetter:
      "Professional house cleaning specialist with eco-friendly products. Deep cleaning is my specialty!",
    estimatedDuration: "4-5 hours",
    availability: "Available this week",
    client: {
      name: "Michael Brown",
      id: "CLI-202",
    },
  },
  {
    id: "APP-004",
    jobId: "JOB-003",
    jobTitle: "Electrical Installation - Smart Home",
    worker: {
      id: "WRK-104",
      name: "Robert Chen",
      rating: 4.9,
      completedJobs: 203,
    },
    appliedDate: "2024-10-10T11:00:00",
    status: "pending",
    proposedRate: 750,
    rateType: "fixed",
    coverLetter:
      "Certified electrician specializing in smart home installations. I have extensive experience with all major smart home systems.",
    estimatedDuration: "2 days",
    availability: "Available next week",
    client: {
      name: "Emily Chen",
      id: "CLI-203",
    },
  },
  {
    id: "APP-005",
    jobId: "JOB-003",
    jobTitle: "Electrical Installation - Smart Home",
    worker: {
      id: "WRK-105",
      name: "David Kim",
      rating: 4.6,
      completedJobs: 78,
    },
    appliedDate: "2024-10-10T13:45:00",
    status: "rejected",
    proposedRate: 900,
    rateType: "fixed",
    coverLetter:
      "I can install your smart home system with premium quality components and provide ongoing support.",
    estimatedDuration: "3 days",
    availability: "Available in 2 weeks",
    client: {
      name: "Emily Chen",
      id: "CLI-203",
    },
  },
  {
    id: "APP-006",
    jobId: "JOB-005",
    jobTitle: "Custom Carpentry - Built-in Shelves",
    worker: {
      id: "WRK-106",
      name: "Thomas Anderson",
      rating: 4.9,
      completedJobs: 145,
    },
    appliedDate: "2024-10-08T16:30:00",
    status: "pending",
    proposedRate: 625,
    rateType: "fixed",
    coverLetter:
      "Master carpenter with 15 years experience. I specialize in custom built-ins and can provide design consultation.",
    estimatedDuration: "3-4 days",
    availability: "Available immediately",
    client: {
      name: "Jessica Lee",
      id: "CLI-204",
    },
  },
  {
    id: "APP-007",
    jobId: "JOB-007",
    jobTitle: "Landscaping and Garden Design",
    worker: {
      id: "WRK-107",
      name: "Carlos Martinez",
      rating: 4.7,
      completedJobs: 92,
    },
    appliedDate: "2024-10-06T09:00:00",
    status: "pending",
    proposedRate: 1150,
    rateType: "fixed",
    coverLetter:
      "Professional landscaper with design certification. I can create a beautiful outdoor space with sustainable plants.",
    estimatedDuration: "5-6 days",
    availability: "Available next month",
    client: {
      name: "Amanda White",
      id: "CLI-205",
    },
  },
  {
    id: "APP-008",
    jobId: "JOB-008",
    jobTitle: "Emergency Roof Leak Repair",
    worker: {
      id: "WRK-108",
      name: "John Williams",
      rating: 4.8,
      completedJobs: 134,
    },
    appliedDate: "2024-10-12T15:00:00",
    status: "accepted",
    proposedRate: 480,
    rateType: "fixed",
    coverLetter:
      "Emergency roofing specialist. I can be there within 2 hours and fix the leak today. All work comes with a warranty.",
    estimatedDuration: "1 day",
    availability: "Available now - Emergency service",
    client: {
      name: "Thomas Garcia",
      id: "CLI-206",
    },
  },
  {
    id: "APP-009",
    jobId: "JOB-002",
    jobTitle: "House Cleaning Service",
    worker: {
      id: "WRK-109",
      name: "Linda Johnson",
      rating: 4.5,
      completedJobs: 67,
    },
    appliedDate: "2024-10-11T16:45:00",
    status: "withdrawn",
    proposedRate: 38,
    rateType: "hourly",
    coverLetter:
      "Experienced cleaner with attention to detail. I use only eco-friendly cleaning products.",
    estimatedDuration: "5 hours",
    availability: "Available this weekend",
    client: {
      name: "Michael Brown",
      id: "CLI-202",
    },
  },
  {
    id: "APP-010",
    jobId: "JOB-001",
    jobTitle: "Residential Plumbing Repair",
    worker: {
      id: "WRK-110",
      name: "Ahmed Hassan",
      rating: 4.6,
      completedJobs: 98,
    },
    appliedDate: "2024-10-12T11:00:00",
    status: "pending",
    proposedRate: 260,
    rateType: "fixed",
    coverLetter:
      "Reliable plumber with quick turnaround time. I provide free estimates and guarantee satisfaction.",
    estimatedDuration: "1-2 days",
    availability: "Available tomorrow",
    client: {
      name: "Sarah Wilson",
      id: "CLI-201",
    },
  },
];

export default function JobApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredApplications = mockApplications.filter((app) => {
    const matchesSearch =
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "withdrawn":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const statusCounts = {
    all: mockApplications.length,
    pending: mockApplications.filter((app) => app.status === "pending").length,
    accepted: mockApplications.filter((app) => app.status === "accepted")
      .length,
    rejected: mockApplications.filter((app) => app.status === "rejected")
      .length,
    withdrawn: mockApplications.filter((app) => app.status === "withdrawn")
      .length,
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Job Applications
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage all job applications
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.all}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {statusCounts.pending}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Accepted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {statusCounts.accepted}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {statusCounts.rejected}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Withdrawn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {statusCounts.withdrawn}
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
                    placeholder="Search by job title, worker, or client..."
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
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card
                key={application.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.worker.name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                            {application.worker.rating}
                          </div>
                          <span className="text-sm text-gray-500">
                            • {application.worker.completedJobs} jobs completed
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Applied for:{" "}
                          <Link
                            href={`/admin/jobs/listings/${application.jobId}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {application.jobTitle}
                          </Link>
                        </p>
                        <p className="text-sm text-gray-600">
                          Client:{" "}
                          <Link
                            href={`/admin/users/clients/${application.client.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {application.client.name}
                          </Link>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {getStatusIcon(application.status)}
                        {application.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Proposed Rate
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        ${application.proposedRate}{" "}
                        {application.rateType === "hourly" && "/hr"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {application.estimatedDuration}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Availability</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {application.availability}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Applied On</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(application.appliedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Cover Letter:
                    </p>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                      {application.coverLetter}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/users/workers/${application.worker.id}`}
                    >
                      <Button size="sm" variant="outline">
                        <User className="h-4 w-4 mr-2" />
                        View Worker Profile
                      </Button>
                    </Link>
                    <Link href={`/admin/jobs/listings/${application.jobId}`}>
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        View Job Details
                      </Button>
                    </Link>
                    {application.status === "accepted" && (
                      <Link href={`/admin/jobs/active`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Active Job
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredApplications.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">
                  No applications found matching your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
