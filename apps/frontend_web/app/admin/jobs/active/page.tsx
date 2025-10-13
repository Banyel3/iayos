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
  MessageSquare,
  TrendingUp,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";

interface ActiveJob {
  id: string;
  title: string;
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
  paymentStatus: "pending" | "escrow" | "partial" | "released";
  startDate: string;
  expectedCompletion: string;
  progress: number; // 0-100
  location: string;
  transactionId: string;
  lastUpdate: string;
  hoursWorked?: number;
  milestones: {
    title: string;
    completed: boolean;
    dueDate: string;
  }[];
}

const mockActiveJobs: ActiveJob[] = [
  {
    id: "ACT-001",
    title: "House Cleaning Service",
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
    budget: 32,
    budgetType: "hourly",
    paymentStatus: "escrow",
    startDate: "2024-10-11",
    expectedCompletion: "2024-10-11",
    progress: 75,
    location: "Manhattan, NY",
    transactionId: "TXN-2024-001",
    lastUpdate: "2 hours ago",
    hoursWorked: 3.5,
    milestones: [
      {
        title: "Kitchen and dining area",
        completed: true,
        dueDate: "2024-10-11",
      },
      { title: "Bedrooms", completed: true, dueDate: "2024-10-11" },
      { title: "Bathrooms", completed: false, dueDate: "2024-10-11" },
      { title: "Final inspection", completed: false, dueDate: "2024-10-11" },
    ],
  },
  {
    id: "ACT-002",
    title: "HVAC System Maintenance",
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
    paymentStatus: "escrow",
    startDate: "2024-10-07",
    expectedCompletion: "2024-10-14",
    progress: 60,
    location: "Manhattan, NY",
    transactionId: "TXN-2024-002",
    lastUpdate: "1 day ago",
    milestones: [
      { title: "System inspection", completed: true, dueDate: "2024-10-07" },
      { title: "Filter replacement", completed: true, dueDate: "2024-10-08" },
      { title: "Duct cleaning", completed: false, dueDate: "2024-10-13" },
      { title: "Final testing", completed: false, dueDate: "2024-10-14" },
    ],
  },
  {
    id: "ACT-003",
    title: "Emergency Roof Leak Repair",
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
    paymentStatus: "escrow",
    startDate: "2024-10-12",
    expectedCompletion: "2024-10-13",
    progress: 40,
    location: "Queens, NY",
    transactionId: "TXN-2024-003",
    lastUpdate: "3 hours ago",
    milestones: [
      { title: "Damage assessment", completed: true, dueDate: "2024-10-12" },
      { title: "Temporary patch", completed: true, dueDate: "2024-10-12" },
      { title: "Permanent repair", completed: false, dueDate: "2024-10-13" },
      { title: "Quality check", completed: false, dueDate: "2024-10-13" },
    ],
  },
  {
    id: "ACT-004",
    title: "Kitchen Renovation",
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
    paymentStatus: "partial",
    startDate: "2024-10-01",
    expectedCompletion: "2024-10-20",
    progress: 55,
    location: "Brooklyn, NY",
    transactionId: "TXN-2024-004",
    lastUpdate: "5 hours ago",
    milestones: [
      { title: "Demolition", completed: true, dueDate: "2024-10-03" },
      { title: "Cabinet installation", completed: true, dueDate: "2024-10-10" },
      {
        title: "Countertop installation",
        completed: false,
        dueDate: "2024-10-15",
      },
      { title: "Finishing touches", completed: false, dueDate: "2024-10-20" },
    ],
  },
  {
    id: "ACT-005",
    title: "Electrical Panel Upgrade",
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
    paymentStatus: "escrow",
    startDate: "2024-10-09",
    expectedCompletion: "2024-10-15",
    progress: 70,
    location: "Queens, NY",
    transactionId: "TXN-2024-005",
    lastUpdate: "4 hours ago",
    milestones: [
      { title: "Old panel removal", completed: true, dueDate: "2024-10-09" },
      {
        title: "New panel installation",
        completed: true,
        dueDate: "2024-10-11",
      },
      { title: "Circuit rewiring", completed: false, dueDate: "2024-10-14" },
      { title: "Inspection", completed: false, dueDate: "2024-10-15" },
    ],
  },
];

export default function ActiveJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const filteredJobs = mockActiveJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment =
      paymentFilter === "all" || job.paymentStatus === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "escrow":
        return "bg-blue-100 text-blue-800";
      case "partial":
        return "bg-orange-100 text-orange-800";
      case "released":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const averageProgress =
    mockActiveJobs.reduce((sum, job) => sum + job.progress, 0) /
    mockActiveJobs.length;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Active Jobs</h1>
            <p className="text-gray-600 mt-1">
              Monitor ongoing work and progress
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
                  Avg Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {averageProgress.toFixed(0)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  In Escrow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {
                    mockActiveJobs.filter(
                      (job) => job.paymentStatus === "escrow"
                    ).length
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
                  $
                  {mockActiveJobs
                    .reduce(
                      (sum, job) => sum + job.budget * (job.hoursWorked || 1),
                      0
                    )
                    .toLocaleString()}
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
                  <option value="pending">Pending</option>
                  <option value="escrow">Escrow</option>
                  <option value="partial">Partial Payment</option>
                  <option value="released">Released</option>
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
                  <div className="flex items-start justify-between mb-4">
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
                          {job.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Client:{" "}
                          <Link
                            href={`/admin/users/clients/${job.client.id}`}
                            className="text-blue-600 hover:underline ml-1"
                          >
                            {job.client.name}
                          </Link>
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
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${job.budget}
                        {job.budgetType === "hourly" && "/hr"}
                      </p>
                      {job.hoursWorked && (
                        <p className="text-xs text-gray-600">
                          {job.hoursWorked} hours worked
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progress
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {job.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${getProgressColor(
                          job.progress
                        )} h-3 rounded-full transition-all`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Milestones:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {job.milestones.map((milestone, index) => (
                        <div
                          key={index}
                          className={`flex items-center text-sm p-2 rounded ${
                            milestone.completed
                              ? "bg-green-50 text-green-800"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={milestone.completed}
                            readOnly
                            className="mr-2"
                          />
                          <span
                            className={
                              milestone.completed ? "line-through" : ""
                            }
                          >
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Job Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Start Date</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(job.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Expected End</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(job.expectedCompletion).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Last Update</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {job.lastUpdate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {job.category}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link href={`/admin/jobs/active/${job.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link
                      href={`/admin/payments/transactions/${job.transactionId}`}
                    >
                      <Button size="sm" variant="outline">
                        <DollarSign className="h-4 w-4 mr-2" />
                        View Transaction
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Messages
                    </Button>
                    <Button size="sm" variant="outline">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Progress Report
                    </Button>
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
