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
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  User,
  Star,
} from "lucide-react";
import Link from "next/link";

interface ActiveJob {
  id: string;
  title: string;
  description: string;
  category: string;
  client: {
    id: string;
    name: string;
    rating: number;
  };
  worker: {
    id: string;
    name: string;
    rating: number;
  };
  budget: number;
  budgetType: "fixed" | "hourly";
  paymentStatus: "50% paid" | "fully_paid" | "pending_payment";
  startDate: string;
  duration: string;
  location: string;
  status: "in_progress" | "awaiting_completion";
}

const mockActiveJobs: ActiveJob[] = [
  {
    id: "ACT-001",
    title: "House Cleaning Service",
    description:
      "Looking for a thorough house cleaning service for a 3-bedroom apartment. Deep cleaning required.",
    category: "Home Cleaning",
    client: {
      id: "CLI-202",
      name: "Michael Brown",
      rating: 4.5,
    },
    worker: {
      id: "WRK-103",
      name: "Maria Garcia",
      rating: 4.8,
    },
    budget: 180,
    budgetType: "fixed",
    paymentStatus: "50% paid",
    startDate: "2024-10-11",
    duration: "4-6 hours",
    location: "Manhattan, NY",
    status: "in_progress",
  },
  {
    id: "ACT-002",
    title: "HVAC System Maintenance",
    description:
      "Regular maintenance check and cleaning of HVAC system for residential property.",
    category: "HVAC",
    client: {
      id: "CLI-207",
      name: "Robert Johnson",
      rating: 4.4,
    },
    worker: {
      id: "WRK-111",
      name: "Kevin Martinez",
      rating: 4.7,
    },
    budget: 300,
    budgetType: "fixed",
    paymentStatus: "50% paid",
    startDate: "2024-10-07",
    duration: "1 week",
    location: "Manhattan, NY",
    status: "in_progress",
  },
  {
    id: "ACT-003",
    title: "Emergency Roof Leak Repair",
    description:
      "Urgent repair needed for roof leak in residential property. Water damage prevention required.",
    category: "Roofing",
    client: {
      id: "CLI-206",
      name: "Thomas Garcia",
      rating: 4.3,
    },
    worker: {
      id: "WRK-108",
      name: "John Williams",
      rating: 4.8,
    },
    budget: 480,
    budgetType: "fixed",
    paymentStatus: "fully_paid",
    startDate: "2024-10-12",
    duration: "2 days",
    location: "Queens, NY",
    status: "awaiting_completion",
  },
  {
    id: "ACT-004",
    title: "Kitchen Renovation",
    description:
      "Complete kitchen renovation including cabinet installation and countertop replacement.",
    category: "Carpentry",
    client: {
      id: "CLI-208",
      name: "Jennifer Taylor",
      rating: 4.9,
    },
    worker: {
      id: "WRK-112",
      name: "Daniel Foster",
      rating: 4.9,
    },
    budget: 2500,
    budgetType: "fixed",
    paymentStatus: "50% paid",
    startDate: "2024-10-01",
    duration: "3 weeks",
    location: "Brooklyn, NY",
    status: "in_progress",
  },
  {
    id: "ACT-005",
    title: "Electrical Panel Upgrade",
    description:
      "Upgrade old electrical panel to modern standards with increased capacity.",
    category: "Electrical",
    client: {
      id: "CLI-209",
      name: "William Davis",
      rating: 4.6,
    },
    worker: {
      id: "WRK-113",
      name: "Steven Clark",
      rating: 4.8,
    },
    budget: 1200,
    budgetType: "fixed",
    paymentStatus: "50% paid",
    startDate: "2024-10-09",
    duration: "1 week",
    location: "Queens, NY",
    status: "in_progress",
  },
];

export default function ActiveJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredJobs = mockActiveJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment =
      paymentFilter === "all" || job.paymentStatus === paymentFilter;
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesPayment && matchesStatus;
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "50% paid":
        return "bg-orange-100 text-orange-800";
      case "fully_paid":
        return "bg-green-100 text-green-800";
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "awaiting_completion":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalValue = mockActiveJobs.reduce((sum, job) => sum + job.budget, 0);
  const paidJobs = mockActiveJobs.filter(
    (job) =>
      job.paymentStatus === "50% paid" || job.paymentStatus === "fully_paid"
  ).length;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Active Jobs</h1>
            <p className="text-gray-600 mt-1">
              Jobs that are currently in progress with workers assigned
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockActiveJobs.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  With Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {paidJobs}
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
                    mockActiveJobs.filter((job) => job.status === "in_progress")
                      .length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${totalValue.toLocaleString()}
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
                    placeholder="Search by job, client, worker, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-white"
                >
                  <option value="all">All Payment Status</option>
                  <option value="50% paid">50% Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                  <option value="pending_payment">Pending Payment</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="in_progress">In Progress</option>
                  <option value="awaiting_completion">
                    Awaiting Completion
                  </option>
                </select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Jobs List */}
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
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                            job.paymentStatus
                          )}`}
                        >
                          {job.paymentStatus === "50% paid"
                            ? "50% PAID"
                            : job.paymentStatus.toUpperCase().replace("_", " ")}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status.toUpperCase().replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 max-w-3xl">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Client:{" "}
                          <Link
                            href={`/admin/users/clients/${job.client.id}`}
                            className="text-blue-600 hover:underline ml-1"
                          >
                            {job.client.name}
                          </Link>
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 ml-1" />
                          <span className="ml-0.5">{job.client.rating}</span>
                        </span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Worker:{" "}
                          <Link
                            href={`/admin/users/workers/${job.worker.id}`}
                            className="text-blue-600 hover:underline ml-1"
                          >
                            {job.worker.name}
                          </Link>
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 ml-1" />
                          <span className="ml-0.5">{job.worker.rating}</span>
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Started:{" "}
                          {new Date(job.startDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Duration: {job.duration}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {job.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <p className="text-2xl font-bold text-green-600">
                          ${job.budget.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {job.budgetType === "fixed"
                          ? "Fixed Price"
                          : "Per Hour"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Link href={`/admin/jobs/active/${job.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">
                  No active jobs found matching your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
