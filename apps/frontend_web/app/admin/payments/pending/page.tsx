"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Calendar,
} from "lucide-react";
import { Sidebar } from "../../components";

interface PendingPayment {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
    type: "client" | "worker";
  };
  toUser: {
    id: string;
    name: string;
    email: string;
    type: "client" | "worker";
  };
  jobId: string;
  jobTitle: string;
  paymentMethod: string;
  initiatedDate: string;
  status: "pending_confirmation" | "processing" | "pending_review";
  reason: string;
}

const mockPendingPayments: PendingPayment[] = [
  {
    id: "pmt_001",
    transactionId: "TXN-2024-001234",
    amount: 1500,
    currency: "PHP",
    fromUser: {
      id: "client_001",
      name: "Maria Santos",
      email: "maria@email.com",
      type: "client",
    },
    toUser: {
      id: "worker_001",
      name: "Juan Dela Cruz",
      email: "juan@email.com",
      type: "worker",
    },
    jobId: "job_001",
    jobTitle: "Refrigerator Repair",
    paymentMethod: "GCash",
    initiatedDate: "2024-01-15T10:30:00Z",
    status: "pending_confirmation",
    reason: "Awaiting payment provider confirmation",
  },
  {
    id: "pmt_002",
    transactionId: "TXN-2024-001235",
    amount: 2500,
    currency: "PHP",
    fromUser: {
      id: "client_002",
      name: "Pedro Reyes",
      email: "pedro@email.com",
      type: "client",
    },
    toUser: {
      id: "worker_002",
      name: "Anna Cruz",
      email: "anna@email.com",
      type: "worker",
    },
    jobId: "job_002",
    jobTitle: "Aircon Servicing",
    paymentMethod: "Bank Transfer",
    initiatedDate: "2024-01-15T14:20:00Z",
    status: "processing",
    reason: "Bank processing payment",
  },
  {
    id: "pmt_003",
    transactionId: "TXN-2024-001236",
    amount: 5000,
    currency: "PHP",
    fromUser: {
      id: "client_003",
      name: "Lisa Tan",
      email: "lisa@email.com",
      type: "client",
    },
    toUser: {
      id: "worker_003",
      name: "Mike Garcia",
      email: "mike@email.com",
      type: "worker",
    },
    jobId: "job_003",
    jobTitle: "Plumbing Emergency",
    paymentMethod: "PayMaya",
    initiatedDate: "2024-01-15T16:45:00Z",
    status: "pending_review",
    reason: "Large transaction - manual review required",
  },
];

export default function PendingPaymentsPage() {
  const [payments] = useState<PendingPayment[]>(mockPendingPayments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending_confirmation" | "processing" | "pending_review"
  >("all");

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.fromUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.toUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_confirmation: {
        label: "Pending Confirmation",
        className: "bg-yellow-100 text-yellow-800",
      },
      processing: {
        label: "Processing",
        className: "bg-blue-100 text-blue-800",
      },
      pending_review: {
        label: "Pending Review",
        className: "bg-orange-100 text-orange-800",
      },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.processing;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Pending Payments
              </h1>
              <p className="text-muted-foreground">
                Payments awaiting confirmation or processing
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payments.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting action</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Amount
                </CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱
                  {payments
                    .reduce((acc, p) => acc + p.amount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total value</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Awaiting Confirmation
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    payments.filter((p) => p.status === "pending_confirmation")
                      .length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Need confirmation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Manual Review
                </CardTitle>
                <Eye className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {payments.filter((p) => p.status === "pending_review").length}
                </div>
                <p className="text-xs text-muted-foreground">Requires review</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find payments by transaction ID, user, or job title
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "all"
                        | "pending_confirmation"
                        | "processing"
                        | "pending_review"
                    )
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending_confirmation">
                    Pending Confirmation
                  </option>
                  <option value="processing">Processing</option>
                  <option value="pending_review">Pending Review</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <Card
                key={payment.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {payment.transactionId}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {payment.jobTitle}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">
                            From (Client)
                          </p>
                          <p className="font-medium">{payment.fromUser.name}</p>
                          <p className="text-muted-foreground">
                            {payment.fromUser.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">
                            To (Worker)
                          </p>
                          <p className="font-medium">{payment.toUser.name}</p>
                          <p className="text-muted-foreground">
                            {payment.toUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(payment.initiatedDate).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{payment.paymentMethod}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm">
                          <span className="font-medium">Reason: </span>
                          {payment.reason}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="default" size="sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Payment
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="destructive" size="sm">
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No pending payments found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search criteria"
                    : "All payments have been processed"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
