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
  DollarSign,
  MapPin,
  Star,
  Calendar,
  CheckCircle,
  User,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface CompletedJob {
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
  finalAmount: number;
  startDate: string;
  completionDate: string;
  duration: string;
  location: string;
  transactionId: string;
  paymentStatus: "paid" | "pending" | "processing";
  reviewStatus: "completed" | "pending" | "none";
  clientRating?: number;
  workerRating?: number;
  invoice: string;
}

const mockCompletedJobs: CompletedJob[] = [
  {
    id: "COMP-001",
    title: "Interior Painting - Living Room",
    description:
      "Professional painting service for living room and dining area. Includes wall preparation.",
    category: "Painting",
    client: {
      id: "CLI-203",
      name: "David Martinez",
      rating: 4.6,
    },
    worker: {
      id: "WRK-114",
      name: "Carlos Rivera",
      rating: 4.9,
    },
    budget: 450,
    budgetType: "fixed",
    finalAmount: 450,
    startDate: "2024-10-07",
    completionDate: "2024-10-09",
    duration: "2 days",
    location: "Bronx, NY",
    transactionId: "TXN-2024-101",
    paymentStatus: "paid",
    reviewStatus: "completed",
    clientRating: 5.0,
    workerRating: 4.8,
    invoice: "INV-2024-001",
  },
  {
    id: "COMP-002",
    title: "Bathroom Plumbing Installation",
    description:
      "Complete bathroom plumbing installation for new construction.",
    category: "Plumbing",
    client: {
      id: "CLI-210",
      name: "Lisa Anderson",
      rating: 4.7,
    },
    worker: {
      id: "WRK-115",
      name: "Robert Taylor",
      rating: 4.8,
    },
    budget: 850,
    budgetType: "fixed",
    finalAmount: 875,
    startDate: "2024-10-01",
    completionDate: "2024-10-05",
    duration: "4 days",
    location: "Brooklyn, NY",
    transactionId: "TXN-2024-102",
    paymentStatus: "paid",
    reviewStatus: "completed",
    clientRating: 4.9,
    workerRating: 4.7,
    invoice: "INV-2024-002",
  },
  {
    id: "COMP-003",
    title: "Garden Landscaping Design",
    description:
      "Complete backyard landscaping with plants and irrigation system.",
    category: "Landscaping",
    client: {
      id: "CLI-211",
      name: "Nancy Wilson",
      rating: 4.9,
    },
    worker: {
      id: "WRK-116",
      name: "Miguel Santos",
      rating: 4.9,
    },
    budget: 1800,
    budgetType: "fixed",
    finalAmount: 1850,
    startDate: "2024-09-25",
    completionDate: "2024-10-02",
    duration: "7 days",
    location: "Queens, NY",
    transactionId: "TXN-2024-103",
    paymentStatus: "paid",
    reviewStatus: "completed",
    clientRating: 5.0,
    workerRating: 5.0,
    invoice: "INV-2024-003",
  },
  {
    id: "COMP-004",
    title: "Home Office Electrical Setup",
    description: "Electrical wiring and outlet installation for home office.",
    category: "Electrical",
    client: {
      id: "CLI-212",
      name: "Kevin Brown",
      rating: 4.5,
    },
    worker: {
      id: "WRK-117",
      name: "Anthony Lee",
      rating: 4.7,
    },
    budget: 550,
    budgetType: "fixed",
    finalAmount: 550,
    startDate: "2024-10-03",
    completionDate: "2024-10-06",
    duration: "3 days",
    location: "Manhattan, NY",
    transactionId: "TXN-2024-104",
    paymentStatus: "processing",
    reviewStatus: "pending",
    invoice: "INV-2024-004",
  },
  {
    id: "COMP-005",
    title: "Deck Construction and Staining",
    description: "Build and stain a new wooden deck in backyard.",
    category: "Carpentry",
    client: {
      id: "CLI-213",
      name: "Patricia Moore",
      rating: 4.8,
    },
    worker: {
      id: "WRK-118",
      name: "William Harris",
      rating: 4.9,
    },
    budget: 2200,
    budgetType: "fixed",
    finalAmount: 2200,
    startDate: "2024-09-20",
    completionDate: "2024-09-30",
    duration: "10 days",
    location: "Staten Island, NY",
    transactionId: "TXN-2024-105",
    paymentStatus: "paid",
    reviewStatus: "completed",
    clientRating: 4.9,
    workerRating: 4.8,
    invoice: "INV-2024-005",
  },
  {
    id: "COMP-006",
    title: "Apartment Deep Cleaning",
    description: "Move-out deep cleaning for 2-bedroom apartment.",
    category: "Home Cleaning",
    client: {
      id: "CLI-214",
      name: "Steven Clark",
      rating: 4.4,
    },
    worker: {
      id: "WRK-119",
      name: "Isabella Martinez",
      rating: 4.6,
    },
    budget: 28,
    budgetType: "hourly",
    finalAmount: 168,
    startDate: "2024-10-08",
    completionDate: "2024-10-08",
    duration: "6 hours",
    location: "Manhattan, NY",
    transactionId: "TXN-2024-106",
    paymentStatus: "paid",
    reviewStatus: "completed",
    clientRating: 4.7,
    workerRating: 4.5,
    invoice: "INV-2024-006",
  },
  {
    id: "COMP-007",
    title: "Tile Installation - Kitchen Backsplash",
    description: "Custom tile backsplash installation in modern kitchen.",
    category: "Tile Work",
    client: {
      id: "CLI-215",
      name: "Christopher White",
      rating: 4.7,
    },
    worker: {
      id: "WRK-120",
      name: "Ricardo Lopez",
      rating: 4.8,
    },
    budget: 680,
    budgetType: "fixed",
    finalAmount: 680,
    startDate: "2024-10-05",
    completionDate: "2024-10-07",
    duration: "2 days",
    location: "Brooklyn, NY",
    transactionId: "TXN-2024-107",
    paymentStatus: "pending",
    reviewStatus: "none",
    invoice: "INV-2024-007",
  },
  {
    id: "COMP-008",
    title: "Window Replacement Service",
    description:
      "Replace 5 old windows with energy-efficient double pane windows.",
    category: "Windows & Doors",
    client: {
      id: "CLI-216",
      name: "Michelle Johnson",
      rating: 4.9,
    },
    worker: {
      id: "WRK-121",
      name: "Daniel Rodriguez",
      rating: 4.9,
    },
    budget: 1450,
    budgetType: "fixed",
    finalAmount: 1450,
    startDate: "2024-09-28",
    completionDate: "2024-10-01",
    duration: "3 days",
    location: "Queens, NY",
    transactionId: "TXN-2024-108",
    paymentStatus: "paid",
    reviewStatus: "completed",
    clientRating: 5.0,
    workerRating: 4.9,
    invoice: "INV-2024-008",
  },
];

export default function CompletedJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [reviewFilter, setReviewFilter] = useState<string>("all");

  const filteredJobs = mockCompletedJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment =
      paymentFilter === "all" || job.paymentStatus === paymentFilter;
    const matchesReview =
      reviewFilter === "all" || job.reviewStatus === reviewFilter;
    return matchesSearch && matchesPayment && matchesReview;
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "none":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalRevenue = mockCompletedJobs
    .filter((job) => job.paymentStatus === "paid")
    .reduce((sum, job) => sum + job.finalAmount, 0);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Completed Jobs</h1>
            <p className="text-gray-600 mt-1">
              View finished jobs and payment status
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockCompletedJobs.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    mockCompletedJobs.filter(
                      (job) => job.paymentStatus === "pending"
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Reviewed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {
                    mockCompletedJobs.filter(
                      (job) => job.reviewStatus === "completed"
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
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  value={reviewFilter}
                  onChange={(e) => setReviewFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-white"
                >
                  <option value="all">All Reviews</option>
                  <option value="completed">Reviewed</option>
                  <option value="pending">Pending Review</option>
                  <option value="none">No Review</option>
                </select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Completed Jobs List */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
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
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getReviewStatusColor(
                            job.reviewStatus
                          )}`}
                        >
                          {job.reviewStatus === "completed"
                            ? "REVIEWED"
                            : job.reviewStatus === "pending"
                              ? "REVIEW PENDING"
                              : "NO REVIEW"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {job.description}
                      </p>
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
                      <p className="text-2xl font-bold text-green-600">
                        ${job.finalAmount.toLocaleString()}
                      </p>
                      {job.budgetType === "hourly" && (
                        <p className="text-xs text-gray-600">
                          (${job.budget}/hr)
                        </p>
                      )}
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
                      <p className="text-xs text-gray-500 mb-1">
                        Completion Date
                      </p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {new Date(job.completionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {job.duration}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {job.category}
                      </p>
                    </div>
                  </div>

                  {/* Ratings */}
                  {job.reviewStatus === "completed" && (
                    <div className="flex gap-6 mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-2" />
                        <span className="text-sm text-gray-700">
                          Client Rating:{" "}
                          <span className="font-bold">{job.clientRating}</span>
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-2" />
                        <span className="text-sm text-gray-700">
                          Worker Rating:{" "}
                          <span className="font-bold">{job.workerRating}</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Transaction & Invoice Info */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="text-gray-600">
                      Transaction ID:{" "}
                      <Link
                        href={`/admin/payments/transactions/${job.transactionId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {job.transactionId}
                      </Link>
                    </span>
                    <span className="text-gray-600">
                      Invoice:{" "}
                      <span className="font-medium">{job.invoice}</span>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link href={`/admin/jobs/completed/${job.id}`}>
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
                      <FileText className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                    {job.reviewStatus === "completed" && (
                      <Link href={`/admin/reviews?job=${job.id}`}>
                        <Button size="sm" variant="outline">
                          <Star className="h-4 w-4 mr-2" />
                          View Reviews
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">
                  No completed jobs found matching your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
