"use client";

import { useState } from "react";
import { Sidebar } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Download,
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Phone,
  Mail,
} from "lucide-react";
import Link from "next/link";

interface Applicant {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  phone: string;
  email: string;
  appliedDate: string;
  proposedRate?: number;
  coverLetter: string;
  status: "pending" | "accepted" | "rejected";
}

interface JobListing {
  id: string;
  title: string;
  description: string;
  category: string;
  jobType: "job_posting" | "worker_request";
  client: {
    name: string;
    rating: number;
  };
  worker?: {
    name: string;
    rating: number;
  };
  budget: number;
  budgetType: "fixed" | "hourly";
  location: string;
  postedDate: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  applicationsCount: number;
  urgency: "low" | "medium" | "high";
  duration: string;
  applicants: Applicant[];
}

const mockJobListings: JobListing[] = [
  {
    id: "JOB-001",
    title: "Residential Plumbing Repair",
    description:
      "Need a professional plumber to fix leaking pipes in the kitchen and bathroom. Urgent repair needed.",
    category: "Plumbing",
    jobType: "job_posting",
    client: {
      name: "Sarah Wilson",
      rating: 4.8,
    },
    budget: 250,
    budgetType: "fixed",
    location: "Brooklyn, NY",
    postedDate: "2024-10-12",
    status: "open",
    applicationsCount: 12,
    urgency: "high",
    duration: "1-2 days",
    applicants: [
      {
        id: "APP-001",
        name: "John Martinez",
        rating: 4.9,
        reviewCount: 87,
        completedJobs: 142,
        phone: "+1-555-0101",
        email: "john.martinez@example.com",
        appliedDate: "2024-10-12",
        proposedRate: 240,
        coverLetter:
          "I have 10+ years of plumbing experience and can fix your issue within 1 day.",
        status: "pending",
      },
      {
        id: "APP-002",
        name: "Robert Taylor",
        rating: 4.7,
        reviewCount: 65,
        completedJobs: 98,
        phone: "+1-555-0102",
        email: "robert.t@example.com",
        appliedDate: "2024-10-12",
        proposedRate: 250,
        coverLetter: "Licensed plumber with emergency repair expertise.",
        status: "pending",
      },
      {
        id: "APP-003",
        name: "Mike Williams",
        rating: 4.8,
        reviewCount: 52,
        completedJobs: 76,
        phone: "+1-555-0103",
        email: "mike.w@example.com",
        appliedDate: "2024-10-13",
        proposedRate: 230,
        coverLetter:
          "Available immediately, specialized in residential plumbing.",
        status: "pending",
      },
    ],
  },
  {
    id: "JOB-002",
    title: "House Cleaning Service",
    description:
      "Looking for a thorough house cleaning service for a 3-bedroom apartment. Deep cleaning required.",
    category: "Home Cleaning",
    jobType: "job_posting",
    client: {
      name: "Michael Brown",
      rating: 4.5,
    },
    budget: 35,
    budgetType: "hourly",
    location: "Manhattan, NY",
    postedDate: "2024-10-11",
    status: "in_progress",
    applicationsCount: 8,
    urgency: "medium",
    duration: "4-6 hours",
    applicants: [
      {
        id: "APP-004",
        name: "Maria Garcia",
        rating: 4.9,
        reviewCount: 143,
        completedJobs: 201,
        phone: "+1-555-0104",
        email: "maria.g@example.com",
        appliedDate: "2024-10-11",
        proposedRate: 35,
        coverLetter:
          "Professional cleaning service with eco-friendly products.",
        status: "accepted",
      },
      {
        id: "APP-005",
        name: "Lisa Chen",
        rating: 4.6,
        reviewCount: 89,
        completedJobs: 124,
        phone: "+1-555-0105",
        email: "lisa.c@example.com",
        appliedDate: "2024-10-11",
        proposedRate: 32,
        coverLetter: "Experienced in deep cleaning apartments.",
        status: "rejected",
      },
    ],
  },
  {
    id: "JOB-003",
    title: "Electrical Installation - Smart Home",
    description:
      "Need an electrician to install smart switches, outlets, and lighting system throughout the house.",
    category: "Electrical",
    jobType: "worker_request",
    client: {
      name: "Emily Chen",
      rating: 4.9,
    },
    worker: {
      name: "Thomas Anderson",
      rating: 4.8,
    },
    budget: 800,
    budgetType: "fixed",
    location: "Queens, NY",
    postedDate: "2024-10-10",
    status: "open",
    applicationsCount: 0,
    urgency: "medium",
    duration: "2-3 days",
    applicants: [],
  },
  {
    id: "JOB-004",
    title: "Interior Painting - Living Room",
    description:
      "Professional painting service needed for living room and dining area. Includes wall preparation.",
    category: "Painting",
    jobType: "job_posting",
    client: {
      name: "David Martinez",
      rating: 4.6,
    },
    budget: 450,
    budgetType: "fixed",
    location: "Bronx, NY",
    postedDate: "2024-10-09",
    status: "completed",
    applicationsCount: 6,
    urgency: "low",
    duration: "2 days",
    applicants: [],
  },
  {
    id: "JOB-005",
    title: "Custom Carpentry - Built-in Shelves",
    description:
      "Looking for an experienced carpenter to build custom shelving units in home office.",
    category: "Carpentry",
    jobType: "worker_request",
    client: {
      name: "Jessica Lee",
      rating: 4.7,
    },
    worker: {
      name: "Carlos Martinez",
      rating: 4.9,
    },
    budget: 650,
    budgetType: "fixed",
    location: "Staten Island, NY",
    postedDate: "2024-10-08",
    status: "open",
    applicationsCount: 0,
    urgency: "low",
    duration: "3-4 days",
    applicants: [],
  },
  {
    id: "JOB-006",
    title: "HVAC System Maintenance",
    description:
      "Annual maintenance and inspection of HVAC system for a commercial property.",
    category: "HVAC",
    jobType: "job_posting",
    client: {
      name: "Robert Johnson",
      rating: 4.4,
    },
    budget: 300,
    budgetType: "fixed",
    location: "Manhattan, NY",
    postedDate: "2024-10-07",
    status: "in_progress",
    applicationsCount: 5,
    urgency: "medium",
    duration: "1 day",
    applicants: [],
  },
  {
    id: "JOB-007",
    title: "Landscaping and Garden Design",
    description:
      "Complete landscaping service for backyard including design, planting, and maintenance.",
    category: "Landscaping",
    jobType: "job_posting",
    client: {
      name: "Amanda White",
      rating: 4.9,
    },
    budget: 1200,
    budgetType: "fixed",
    location: "Brooklyn, NY",
    postedDate: "2024-10-06",
    status: "open",
    applicationsCount: 18,
    urgency: "low",
    duration: "5-7 days",
    applicants: [],
  },
  {
    id: "JOB-008",
    title: "Emergency Roof Leak Repair",
    description:
      "Urgent roof repair needed due to recent storm damage. Immediate attention required.",
    category: "Roofing",
    jobType: "worker_request",
    client: {
      name: "Thomas Garcia",
      rating: 4.3,
    },
    worker: {
      name: "Lisa Rodriguez",
      rating: 4.7,
    },
    budget: 500,
    budgetType: "fixed",
    location: "Queens, NY",
    postedDate: "2024-10-12",
    status: "open",
    applicationsCount: 0,
    urgency: "high",
    duration: "1 day",
    applicants: [],
  },
];

export default function JobListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");

  const filteredJobs = mockJobListings.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || job.category === categoryFilter;
    const matchesJobType =
      jobTypeFilter === "all" || job.jobType === jobTypeFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesJobType;
  });

  const categories = Array.from(
    new Set(mockJobListings.map((job) => job.category))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
            <p className="text-gray-600 mt-1">
              View and manage all posted job listings
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockJobListings.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Job Postings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {
                    mockJobListings.filter(
                      (job) => job.jobType === "job_posting"
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Worker Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {
                    mockJobListings.filter(
                      (job) => job.jobType === "worker_request"
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Open Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {
                    mockJobListings.filter((job) => job.status === "open")
                      .length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {
                    mockJobListings.filter(
                      (job) => job.status === "in_progress"
                    ).length
                  }
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
                    placeholder="Search jobs by title, description, or category..."
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
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="job_posting">Job Postings</option>
                  <option value="worker_request">Worker Requests</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Job Listings */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            job.jobType === "job_posting"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {job.jobType === "job_posting"
                            ? "JOB POSTING"
                            : "WORKER REQUEST"}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status.replace("_", " ").toUpperCase()}
                        </span>
                        <span
                          className={`text-xs font-medium ${getUrgencyColor(
                            job.urgency
                          )}`}
                        >
                          {job.urgency.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {job.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span className="font-medium">
                            ${job.budget} {job.budgetType === "hourly" && "/hr"}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {job.jobType === "job_posting"
                            ? `${job.applicationsCount} applications`
                            : "Direct Request"}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.duration}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Client:{" "}
                          <span className="font-medium">{job.client.name}</span>
                        </span>
                        <span className="text-gray-600">
                          Rating: ⭐ {job.client.rating}
                        </span>
                        {job.jobType === "worker_request" && job.worker && (
                          <>
                            <span className="text-gray-600">→</span>
                            <span className="text-gray-600">
                              Worker:{" "}
                              <span className="font-medium text-blue-600">
                                {job.worker.name}
                              </span>
                            </span>
                            <span className="text-gray-600">
                              Rating: ⭐ {job.worker.rating}
                            </span>
                          </>
                        )}
                        <span className="text-gray-600">
                          Category:{" "}
                          <span className="font-medium">{job.category}</span>
                        </span>
                        <span className="text-gray-600">
                          Posted:{" "}
                          {new Date(job.postedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Link href={`/admin/jobs/listings/${job.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {job.jobType === "job_posting" &&
                        job.applicants.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setExpandedJobs({
                                ...expandedJobs,
                                [job.id]: !expandedJobs[job.id],
                              })
                            }
                          >
                            {expandedJobs[job.id] ? (
                              <ChevronUp className="h-4 w-4 mr-2" />
                            ) : (
                              <ChevronDown className="h-4 w-4 mr-2" />
                            )}
                            {expandedJobs[job.id] ? "Hide" : "Show"} Applicants
                            ({job.applicants.length})
                          </Button>
                        )}
                    </div>
                  </div>

                  {/* Collapsible Applicants Section - Only for Job Postings */}
                  {job.jobType === "job_posting" &&
                    expandedJobs[job.id] &&
                    job.applicants.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-sm text-gray-700 mb-3">
                          Applicants ({job.applicants.length})
                        </h4>
                        <div className="space-y-2">
                          {job.applicants.map((applicant) => (
                            <div
                              key={applicant.id}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Link
                                      href={`/admin/users/workers/${applicant.id}`}
                                      className="font-medium text-gray-900 hover:text-blue-600"
                                    >
                                      {applicant.name}
                                    </Link>
                                    <span
                                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                        applicant.status === "accepted"
                                          ? "bg-green-100 text-green-800"
                                          : applicant.status === "rejected"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {applicant.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                                    <span className="flex items-center">
                                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                      {applicant.rating} (
                                      {applicant.reviewCount} reviews)
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {applicant.completedJobs} jobs completed
                                    </span>
                                    {applicant.proposedRate && (
                                      <>
                                        <span>•</span>
                                        <span className="font-medium text-green-600">
                                          Proposed: ${applicant.proposedRate}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 italic mb-2">
                                    "{applicant.coverLetter}"
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {applicant.email}
                                    </span>
                                    <span className="flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {applicant.phone}
                                    </span>
                                    <span>
                                      Applied:{" "}
                                      {new Date(
                                        applicant.appliedDate
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Worker Request Info - Only for Worker Requests */}
                  {job.jobType === "worker_request" && job.worker && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <svg
                              className="h-5 w-5 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900 mb-1">
                              Direct Worker Request
                            </h4>
                            <p className="text-sm text-blue-800">
                              This is a direct hiring request. The client{" "}
                              <span className="font-medium">
                                {job.client.name}
                              </span>{" "}
                              has specifically requested worker{" "}
                              <span className="font-medium">
                                {job.worker.name}
                              </span>{" "}
                              for this job. No open applications are being
                              accepted.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">
                  No jobs found matching your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
