"use client";"use client";



import { useState, useEffect } from "react";import { useState } from "react";

import { Sidebar } from "../../components";import { Sidebar } from "../../components";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/generic_button";import { Button } from "@/components/ui/generic_button";

import { Input } from "@/components/ui/input";import { Input } from "@/components/ui/input";

import {import {

  Search,  Search,

  Download,  Download,

  Eye,  Eye,

  CheckCircle,  CheckCircle,

  XCircle,  XCircle,

  Clock,  Clock,

  Star,  Star,

  FileText,  FileText,

  User,  User,

} from "lucide-react";} from "lucide-react";

import Link from "next/link";import Link from "next/link";



interface JobApplication {interface JobApplication {

  id: string;  id: string;

  job: {  jobId: string;

    id: string;  jobTitle: string;

    title: string;  worker: {

  };    id: string;

  worker: {    name: string;

    id: string;    rating: number;

    name: string;    completedJobs: number;

    rating: number;    profileImage?: string;

    completed_jobs: number;  };

  };  appliedDate: string;

  client: {  status: "pending" | "accepted" | "rejected" | "withdrawn";

    id: string;  proposedRate: number;

    name: string;  rateType: "fixed" | "hourly";

  };  coverLetter: string;

  proposed_budget: number;  estimatedDuration: string;

  budget_option: string;  availability: string;

  estimated_duration: string | null;  client: {

  proposal_message: string;    name: string;

  status: string;    id: string;

  applied_date: string;  };

  updated_at: string;}

}

const mockApplications: JobApplication[] = [

export default function JobApplicationsPage() {  {

  const [applications, setApplications] = useState<JobApplication[]>([]);    id: "APP-001",

  const [isLoading, setIsLoading] = useState(true);    jobId: "JOB-001",

  const [searchQuery, setSearchQuery] = useState("");    jobTitle: "Residential Plumbing Repair",

  const [statusFilter, setStatusFilter] = useState<string>("all");    worker: {

  const [page, setPage] = useState(1);      id: "WRK-101",

  const [totalPages, setTotalPages] = useState(1);      name: "Mike Thompson",

      rating: 4.9,

  useEffect(() => {      completedJobs: 127,

    fetchApplications();    },

  }, [page, statusFilter]);    appliedDate: "2024-10-12T09:30:00",

    status: "pending",

  const fetchApplications = async () => {    proposedRate: 240,

    try {    rateType: "fixed",

      setIsLoading(true);    coverLetter:

      const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";      "I have 10+ years of experience in residential plumbing. I can complete this job within 24 hours with guaranteed quality work.",

      const response = await fetch(    estimatedDuration: "1 day",

        `http://localhost:8000/api/adminpanel/jobs/applications?page=${page}&page_size=20${statusParam}`,    availability: "Available immediately",

        {    client: {

          credentials: "include",      name: "Sarah Wilson",

        }      id: "CLI-201",

      );    },

      const data = await response.json();  },

      if (data.success) {  {

        setApplications(data.applications);    id: "APP-002",

        setTotalPages(data.total_pages);    jobId: "JOB-001",

      }    jobTitle: "Residential Plumbing Repair",

    } catch (error) {    worker: {

      console.error("Error fetching applications:", error);      id: "WRK-102",

    } finally {      name: "James Rodriguez",

      setIsLoading(false);      rating: 4.7,

    }      completedJobs: 89,

  };    },

    appliedDate: "2024-10-12T10:15:00",

  const filteredApplications = applications.filter((app) => {    status: "pending",

    const matchesSearch =    proposedRate: 250,

      app.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||    rateType: "fixed",

      app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||    coverLetter:

      app.client.name.toLowerCase().includes(searchQuery.toLowerCase());      "Licensed plumber with expertise in leak repairs. I can provide same-day service with a warranty on all work.",

    return matchesSearch;    estimatedDuration: "1-2 days",

  });    availability: "Can start today",

    client: {

  const getStatusColor = (status: string) => {      name: "Sarah Wilson",

    switch (status.toUpperCase()) {      id: "CLI-201",

      case "PENDING":    },

        return "bg-yellow-100 text-yellow-800";  },

      case "ACCEPTED":  {

        return "bg-green-100 text-green-800";    id: "APP-003",

      case "REJECTED":    jobId: "JOB-002",

        return "bg-red-100 text-red-800";    jobTitle: "House Cleaning Service",

      case "WITHDRAWN":    worker: {

        return "bg-gray-100 text-gray-800";      id: "WRK-103",

      default:      name: "Maria Garcia",

        return "bg-gray-100 text-gray-800";      rating: 4.8,

    }      completedJobs: 156,

  };    },

    appliedDate: "2024-10-11T14:20:00",

  const getStatusIcon = (status: string) => {    status: "accepted",

    switch (status.toUpperCase()) {    proposedRate: 32,

      case "PENDING":    rateType: "hourly",

        return <Clock className="h-3 w-3" />;    coverLetter:

      case "ACCEPTED":      "Professional house cleaning specialist with eco-friendly products. Deep cleaning is my specialty!",

        return <CheckCircle className="h-3 w-3" />;    estimatedDuration: "4-5 hours",

      case "REJECTED":    availability: "Available this week",

        return <XCircle className="h-3 w-3" />;    client: {

      default:      name: "Michael Brown",

        return <FileText className="h-3 w-3" />;      id: "CLI-202",

    }    },

  };  },

  {

  if (isLoading) {    id: "APP-004",

    return (    jobId: "JOB-003",

      <div className="flex">    jobTitle: "Electrical Installation - Smart Home",

        <Sidebar />    worker: {

        <main className="flex-1 p-6 bg-gray-50">      id: "WRK-104",

          <div className="flex items-center justify-center h-screen">      name: "Robert Chen",

            <div className="text-center">      rating: 4.9,

              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>      completedJobs: 203,

              <p className="mt-4 text-gray-600">Loading applications...</p>    },

            </div>    appliedDate: "2024-10-10T11:00:00",

          </div>    status: "pending",

        </main>    proposedRate: 750,

      </div>    rateType: "fixed",

    );    coverLetter:

  }      "Certified electrician specializing in smart home installations. I have extensive experience with all major smart home systems.",

    estimatedDuration: "2 days",

  return (    availability: "Available next week",

    <div className="flex">    client: {

      <Sidebar />      name: "Emily Chen",

      <main className="flex-1 p-6 bg-gray-50">      id: "CLI-203",

        <div className="max-w-7xl mx-auto">    },

          {/* Header */}  },

          <div className="mb-6">  {

            <h1 className="text-3xl font-bold text-gray-900">    id: "APP-005",

              Job Applications    jobId: "JOB-003",

            </h1>    jobTitle: "Electrical Installation - Smart Home",

            <p className="text-gray-600 mt-1">    worker: {

              Track and manage all job applications      id: "WRK-105",

            </p>      name: "David Kim",

          </div>      rating: 4.6,

      completedJobs: 78,

          {/* Summary Cards */}    },

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">    appliedDate: "2024-10-10T13:45:00",

            <Card>    status: "rejected",

              <CardHeader className="pb-2">    proposedRate: 900,

                <CardTitle className="text-sm font-medium text-gray-600">    rateType: "fixed",

                  Total Applications    coverLetter:

                </CardTitle>      "I can install your smart home system with premium quality components and provide ongoing support.",

              </CardHeader>    estimatedDuration: "3 days",

              <CardContent>    availability: "Available in 2 weeks",

                <div className="text-2xl font-bold">{applications.length}</div>    client: {

              </CardContent>      name: "Emily Chen",

            </Card>      id: "CLI-203",

            <Card>    },

              <CardHeader className="pb-2">  },

                <CardTitle className="text-sm font-medium text-gray-600">  {

                  Pending    id: "APP-006",

                </CardTitle>    jobId: "JOB-005",

              </CardHeader>    jobTitle: "Custom Carpentry - Built-in Shelves",

              <CardContent>    worker: {

                <div className="text-2xl font-bold text-yellow-600">      id: "WRK-106",

                  {applications.filter((app) => app.status === "PENDING").length}      name: "Thomas Anderson",

                </div>      rating: 4.9,

              </CardContent>      completedJobs: 145,

            </Card>    },

            <Card>    appliedDate: "2024-10-08T16:30:00",

              <CardHeader className="pb-2">    status: "pending",

                <CardTitle className="text-sm font-medium text-gray-600">    proposedRate: 625,

                  Accepted    rateType: "fixed",

                </CardTitle>    coverLetter:

              </CardHeader>      "Master carpenter with 15 years experience. I specialize in custom built-ins and can provide design consultation.",

              <CardContent>    estimatedDuration: "3-4 days",

                <div className="text-2xl font-bold text-green-600">    availability: "Available immediately",

                  {applications.filter((app) => app.status === "ACCEPTED").length}    client: {

                </div>      name: "Jessica Lee",

              </CardContent>      id: "CLI-204",

            </Card>    },

            <Card>  },

              <CardHeader className="pb-2">  {

                <CardTitle className="text-sm font-medium text-gray-600">    id: "APP-007",

                  Rejected    jobId: "JOB-007",

                </CardTitle>    jobTitle: "Landscaping and Garden Design",

              </CardHeader>    worker: {

              <CardContent>      id: "WRK-107",

                <div className="text-2xl font-bold text-red-600">      name: "Carlos Martinez",

                  {applications.filter((app) => app.status === "REJECTED").length}      rating: 4.7,

                </div>      completedJobs: 92,

              </CardContent>    },

            </Card>    appliedDate: "2024-10-06T09:00:00",

          </div>    status: "pending",

    proposedRate: 1150,

          {/* Filters and Search */}    rateType: "fixed",

          <Card className="mb-6">    coverLetter:

            <CardContent className="pt-6">      "Professional landscaper with design certification. I can create a beautiful outdoor space with sustainable plants.",

              <div className="flex flex-col md:flex-row gap-4">    estimatedDuration: "5-6 days",

                <div className="flex-1 relative">    availability: "Available next month",

                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />    client: {

                  <Input      name: "Amanda White",

                    placeholder="Search by worker name, job title, or client..."      id: "CLI-205",

                    value={searchQuery}    },

                    onChange={(e) => setSearchQuery(e.target.value)}  },

                    className="pl-10"  {

                  />    id: "APP-008",

                </div>    jobId: "JOB-008",

                <select    jobTitle: "Emergency Roof Leak Repair",

                  value={statusFilter}    worker: {

                  onChange={(e) => setStatusFilter(e.target.value)}      id: "WRK-108",

                  className="px-4 py-2 border rounded-md bg-white"      name: "John Williams",

                >      rating: 4.8,

                  <option value="all">All Status</option>      completedJobs: 134,

                  <option value="PENDING">Pending</option>    },

                  <option value="ACCEPTED">Accepted</option>    appliedDate: "2024-10-12T15:00:00",

                  <option value="REJECTED">Rejected</option>    status: "accepted",

                  <option value="WITHDRAWN">Withdrawn</option>    proposedRate: 480,

                </select>    rateType: "fixed",

                <Button variant="outline">    coverLetter:

                  <Download className="h-4 w-4 mr-2" />      "Emergency roofing specialist. I can be there within 2 hours and fix the leak today. All work comes with a warranty.",

                  Export    estimatedDuration: "1 day",

                </Button>    availability: "Available now - Emergency service",

              </div>    client: {

            </CardContent>      name: "Thomas Garcia",

          </Card>      id: "CLI-206",

    },

          {/* Applications List */}  },

          <div className="space-y-4">  {

            {filteredApplications.map((application) => (    id: "APP-009",

              <Card    jobId: "JOB-002",

                key={application.id}    jobTitle: "House Cleaning Service",

                className="hover:shadow-lg transition-shadow"    worker: {

              >      id: "WRK-109",

                <CardContent className="p-6">      name: "Linda Johnson",

                  <div className="flex items-start justify-between mb-4">      rating: 4.5,

                    <div className="flex items-start gap-4 flex-1">      completedJobs: 67,

                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">    },

                        <User className="h-6 w-6 text-blue-600" />    appliedDate: "2024-10-11T16:45:00",

                      </div>    status: "withdrawn",

                      <div className="flex-1">    proposedRate: 38,

                        <div className="flex items-center gap-2 mb-1">    rateType: "hourly",

                          <h3 className="text-lg font-semibold text-gray-900">    coverLetter:

                            <Link      "Experienced cleaner with attention to detail. I use only eco-friendly cleaning products.",

                              href={`/admin/users/workers/${application.worker.id}`}    estimatedDuration: "5 hours",

                              className="hover:text-blue-600"    availability: "Available this weekend",

                            >    client: {

                              {application.worker.name}      name: "Michael Brown",

                            </Link>      id: "CLI-202",

                          </h3>    },

                          <div className="flex items-center text-sm text-gray-600">  },

                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />  {

                            {application.worker.rating}    id: "APP-010",

                          </div>    jobId: "JOB-001",

                          <span className="text-sm text-gray-500">    jobTitle: "Residential Plumbing Repair",

                            • {application.worker.completed_jobs} jobs completed    worker: {

                          </span>      id: "WRK-110",

                        </div>      name: "Ahmed Hassan",

                        <p className="text-sm text-gray-600 mb-2">      rating: 4.6,

                          Applied for:{" "}      completedJobs: 98,

                          <Link    },

                            href={`/admin/jobs/listings/${application.job.id}`}    appliedDate: "2024-10-12T11:00:00",

                            className="text-blue-600 hover:underline font-medium"    status: "pending",

                          >    proposedRate: 260,

                            {application.job.title}    rateType: "fixed",

                          </Link>    coverLetter:

                        </p>      "Reliable plumber with quick turnaround time. I provide free estimates and guarantee satisfaction.",

                        <p className="text-sm text-gray-600">    estimatedDuration: "1-2 days",

                          Client:{" "}    availability: "Available tomorrow",

                          <Link    client: {

                            href={`/admin/users/clients/${application.client.id}`}      name: "Sarah Wilson",

                            className="text-blue-600 hover:underline"      id: "CLI-201",

                          >    },

                            {application.client.name}  },

                          </Link>];

                        </p>

                      </div>export default function JobApplicationsPage() {

                    </div>  const [searchQuery, setSearchQuery] = useState("");

                    <div className="flex items-center gap-2">  const [statusFilter, setStatusFilter] = useState<string>("all");

                      <span

                        className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(  const filteredApplications = mockApplications.filter((app) => {

                          application.status    const matchesSearch =

                        )}`}      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||

                      >      app.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||

                        {getStatusIcon(application.status)}      app.client.name.toLowerCase().includes(searchQuery.toLowerCase());

                        {application.status}    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

                      </span>    return matchesSearch && matchesStatus;

                    </div>  });

                  </div>

  const getStatusColor = (status: string) => {

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">    switch (status) {

                    <div>      case "pending":

                      <p className="text-xs text-gray-500 mb-1">        return "bg-yellow-100 text-yellow-800";

                        Proposed Budget      case "accepted":

                      </p>        return "bg-green-100 text-green-800";

                      <p className="text-sm font-semibold text-gray-900">      case "rejected":

                        ₱{application.proposed_budget}        return "bg-red-100 text-red-800";

                      </p>      case "withdrawn":

                      <p className="text-xs text-gray-500">        return "bg-gray-100 text-gray-800";

                        ({application.budget_option === "ACCEPT" ? "Accept Client's Budget" : "Negotiated"})      default:

                      </p>        return "bg-gray-100 text-gray-800";

                    </div>    }

                    <div>  };

                      <p className="text-xs text-gray-500 mb-1">Duration</p>

                      <p className="text-sm font-semibold text-gray-900">  const getStatusIcon = (status: string) => {

                        {application.estimated_duration || "Not specified"}    switch (status) {

                      </p>      case "pending":

                    </div>        return <Clock className="h-4 w-4" />;

                    <div>      case "accepted":

                      <p className="text-xs text-gray-500 mb-1">Applied Date</p>        return <CheckCircle className="h-4 w-4" />;

                      <p className="text-sm font-semibold text-gray-900">      case "rejected":

                        {new Date(application.applied_date).toLocaleDateString()}        return <XCircle className="h-4 w-4" />;

                      </p>      case "withdrawn":

                    </div>        return <XCircle className="h-4 w-4" />;

                    <div>      default:

                      <p className="text-xs text-gray-500 mb-1">Last Updated</p>        return <Clock className="h-4 w-4" />;

                      <p className="text-sm font-semibold text-gray-900">    }

                        {new Date(application.updated_at).toLocaleDateString()}  };

                      </p>

                    </div>  const statusCounts = {

                  </div>    all: mockApplications.length,

    pending: mockApplications.filter((app) => app.status === "pending").length,

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">    accepted: mockApplications.filter((app) => app.status === "accepted")

                    <h4 className="text-sm font-semibold text-gray-900 mb-2">      .length,

                      Proposal Message:    rejected: mockApplications.filter((app) => app.status === "rejected")

                    </h4>      .length,

                    <p className="text-sm text-gray-700 italic">    withdrawn: mockApplications.filter((app) => app.status === "withdrawn")

                      "{application.proposal_message}"      .length,

                    </p>  };

                  </div>

  return (

                  <div className="flex items-center gap-2">    <div className="flex">

                    <Link href={`/admin/users/workers/${application.worker.id}`}>      <Sidebar />

                      <Button size="sm" variant="outline">      <main className="flex-1 p-6 bg-gray-50">

                        <Eye className="h-4 w-4 mr-2" />        <div className="max-w-7xl mx-auto">

                        View Worker Profile          {/* Header */}

                      </Button>          <div className="mb-6">

                    </Link>            <h1 className="text-3xl font-bold text-gray-900">

                    <Link href={`/admin/jobs/listings/${application.job.id}`}>              Job Applications

                      <Button size="sm" variant="outline">            </h1>

                        <Eye className="h-4 w-4 mr-2" />            <p className="text-gray-600 mt-1">

                        View Job Details              Track and manage all job applications

                      </Button>            </p>

                    </Link>          </div>

                  </div>

                </CardContent>          {/* Summary Cards */}

              </Card>          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">

            ))}            <Card>

          </div>              <CardHeader className="pb-2">

                <CardTitle className="text-sm font-medium text-gray-600">

          {filteredApplications.length === 0 && (                  Total Applications

            <Card>                </CardTitle>

              <CardContent className="p-12 text-center">              </CardHeader>

                <p className="text-gray-500">              <CardContent>

                  No applications found matching your filters                <div className="text-2xl font-bold">{statusCounts.all}</div>

                </p>              </CardContent>

              </CardContent>            </Card>

            </Card>            <Card>

          )}              <CardHeader className="pb-2">

                <CardTitle className="text-sm font-medium text-gray-600">

          {/* Pagination */}                  Pending Review

          {totalPages > 1 && (                </CardTitle>

            <div className="mt-6 flex items-center justify-center gap-2">              </CardHeader>

              <Button              <CardContent>

                variant="outline"                <div className="text-2xl font-bold text-yellow-600">

                onClick={() => setPage(page - 1)}                  {statusCounts.pending}

                disabled={page === 1}                </div>

              >              </CardContent>

                Previous            </Card>

              </Button>            <Card>

              <span className="text-sm text-gray-600">              <CardHeader className="pb-2">

                Page {page} of {totalPages}                <CardTitle className="text-sm font-medium text-gray-600">

              </span>                  Accepted

              <Button                </CardTitle>

                variant="outline"              </CardHeader>

                onClick={() => setPage(page + 1)}              <CardContent>

                disabled={page === totalPages}                <div className="text-2xl font-bold text-green-600">

              >                  {statusCounts.accepted}

                Next                </div>

              </Button>              </CardContent>

            </div>            </Card>

          )}            <Card>

        </div>              <CardHeader className="pb-2">

      </main>                <CardTitle className="text-sm font-medium text-gray-600">

    </div>                  Rejected

  );                </CardTitle>

}              </CardHeader>

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
