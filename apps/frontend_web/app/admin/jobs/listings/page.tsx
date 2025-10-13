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
} from "lucide-react";
import Link from "next/link";

interface JobListing {
  id: string;
  title: string;
  description: string;
  category: string;
  client: {
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
}

const mockJobListings: JobListing[] = [
  {
    id: "JOB-001",
    title: "Residential Plumbing Repair",
    description:
      "Need a professional plumber to fix leaking pipes in the kitchen and bathroom. Urgent repair needed.",
    category: "Plumbing",
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
  },
  {
    id: "JOB-002",
    title: "House Cleaning Service",
    description:
      "Looking for a thorough house cleaning service for a 3-bedroom apartment. Deep cleaning required.",
    category: "Home Cleaning",
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
  },
  {
    id: "JOB-003",
    title: "Electrical Installation - Smart Home",
    description:
      "Need an electrician to install smart switches, outlets, and lighting system throughout the house.",
    category: "Electrical",
    client: {
      name: "Emily Chen",
      rating: 4.9,
    },
    budget: 800,
    budgetType: "fixed",
    location: "Queens, NY",
    postedDate: "2024-10-10",
    status: "open",
    applicationsCount: 15,
    urgency: "medium",
    duration: "2-3 days",
  },
  {
    id: "JOB-004",
    title: "Interior Painting - Living Room",
    description:
      "Professional painting service needed for living room and dining area. Includes wall preparation.",
    category: "Painting",
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
  },
  {
    id: "JOB-005",
    title: "Custom Carpentry - Built-in Shelves",
    description:
      "Looking for an experienced carpenter to build custom shelving units in home office.",
    category: "Carpentry",
    client: {
      name: "Jessica Lee",
      rating: 4.7,
    },
    budget: 650,
    budgetType: "fixed",
    location: "Staten Island, NY",
    postedDate: "2024-10-08",
    status: "open",
    applicationsCount: 9,
    urgency: "low",
    duration: "3-4 days",
  },
  {
    id: "JOB-006",
    title: "HVAC System Maintenance",
    description:
      "Annual maintenance and inspection of HVAC system for a commercial property.",
    category: "HVAC",
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
  },
  {
    id: "JOB-007",
    title: "Landscaping and Garden Design",
    description:
      "Complete landscaping service for backyard including design, planting, and maintenance.",
    category: "Landscaping",
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
  },
  {
    id: "JOB-008",
    title: "Emergency Roof Leak Repair",
    description:
      "Urgent roof repair needed due to recent storm damage. Immediate attention required.",
    category: "Roofing",
    client: {
      name: "Thomas Garcia",
      rating: 4.3,
    },
    budget: 500,
    budgetType: "fixed",
    location: "Queens, NY",
    postedDate: "2024-10-12",
    status: "open",
    applicationsCount: 10,
    urgency: "high",
    duration: "1 day",
  },
];

export default function JobListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredJobs = mockJobListings.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || job.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <div className="text-2xl font-bold text-blue-600">
                  {
                    mockJobListings.filter(
                      (job) => job.status === "in_progress"
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {
                    mockJobListings.filter((job) => job.status === "completed")
                      .length
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
                          {job.applicationsCount} applications
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
                      <Link href={`/admin/jobs/applications?job=${job.id}`}>
                        <Button size="sm" variant="outline">
                          <Users className="h-4 w-4 mr-2" />
                          View Applications
                        </Button>
                      </Link>
                    </div>
                  </div>
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
