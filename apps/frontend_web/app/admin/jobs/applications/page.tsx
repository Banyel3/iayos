"use client";

import { useState, useEffect } from "react";
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
  updated_at: string;
}

const mockApplications: JobApplication[] = [
  {
    id: "APP-001",
    jobId: "JOB-001",
    jobTitle: "Residential Plumbing Repair",
    worker: {
      id: "WRK-101",
      name: "Mike Thompson",
      rating: 4.8,
      completedJobs: 156,
      profileImage: "/worker1.jpg"
    },
    appliedDate: "2024-01-15T10:30:00Z",
    status: "pending",
    proposedRate: 2500,
    rateType: "fixed",
    coverLetter: "I have 8 years of experience in plumbing repairs...",
    estimatedDuration: "1-2 days",
    availability: "Available immediately",
    client: {
      name: "Sarah Johnson",
      id: "CLT-201"
    },
    updated_at: "2024-01-15T10:30:00Z"
  }
];

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setApplications(mockApplications);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.worker.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "withdrawn": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      case "withdrawn": return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
              <p className="text-gray-600">Manage applications from workers</p>
            </div>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Applications
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by job title or worker name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {application.jobTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Worker:</span>
                          <span className="font-medium">{application.worker.name}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500">{application.worker.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Proposed Rate:</span>
                          <span className="font-medium">₱{application.proposedRate.toLocaleString()}</span>
                          <span className="text-xs text-gray-500">({application.rateType})</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {application.coverLetter}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Applied: {new Date(application.appliedDate).toLocaleDateString()}</span>
                        <span>Duration: {application.estimatedDuration}</span>
                        <span>{application.availability}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link href={`/admin/jobs/applications/${application.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {application.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
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