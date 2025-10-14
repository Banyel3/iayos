"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign,
  Calendar,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

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

// Mock data - should match the data from pending payments list
const mockPendingPayments: PendingPayment[] = [
  {
    id: "1",
    transactionId: "TXN-2024-001",
    amount: 350.0,
    currency: "₱",
    fromUser: {
      id: "client_001",
      name: "Sarah Wilson",
      email: "sarah.wilson@example.com",
      type: "client",
    },
    toUser: {
      id: "worker_001",
      name: "John Smith",
      email: "john.smith@example.com",
      type: "worker",
    },
    jobId: "job_001",
    jobTitle: "Plumbing Repair - Kitchen Sink",
    paymentMethod: "Credit Card",
    initiatedDate: "2024-01-15T10:30:00Z",
    status: "pending_confirmation",
    reason: "Awaiting client confirmation of job completion",
  },
  {
    id: "2",
    transactionId: "TXN-2024-002",
    amount: 850.0,
    currency: "₱",
    fromUser: {
      id: "client_002",
      name: "David Chen",
      email: "david.chen@example.com",
      type: "client",
    },
    toUser: {
      id: "worker_002",
      name: "Maria Garcia",
      email: "maria.garcia@example.com",
      type: "worker",
    },
    jobId: "job_002",
    jobTitle: "Electrical Wiring Installation",
    paymentMethod: "Bank Transfer",
    initiatedDate: "2024-01-15T14:20:00Z",
    status: "processing",
    reason: "Bank transfer in progress",
  },
  {
    id: "3",
    transactionId: "TXN-2024-003",
    amount: 1500.0,
    currency: "₱",
    fromUser: {
      id: "client_003",
      name: "Emily Rodriguez",
      email: "emily.r@techstartup.com",
      type: "client",
    },
    toUser: {
      id: "worker_003",
      name: "Tom Wilson",
      email: "tom.wilson@example.com",
      type: "worker",
    },
    jobId: "job_003",
    jobTitle: "Complete Home Renovation - Multiple Services",
    paymentMethod: "Wire Transfer",
    initiatedDate: "2024-01-15T16:45:00Z",
    status: "pending_review",
    reason: "Large transaction - manual review required",
  },
];

export default function PaymentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<PendingPayment | null>(null);

  useEffect(() => {
    // Mock fetch - replace with actual API call
    const foundPayment = mockPendingPayments.find((p) => p.id === id);
    if (foundPayment) {
      setPayment(foundPayment);
    }
  }, [id]);

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending_confirmation":
        return {
          label: "Pending Confirmation",
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
        };
      case "processing":
        return {
          label: "Processing",
          color: "bg-blue-100 text-blue-800",
          icon: Clock,
        };
      case "pending_review":
        return {
          label: "Pending Review",
          color: "bg-orange-100 text-orange-800",
          icon: AlertCircle,
        };
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
        };
    }
  };

  const statusInfo = getStatusInfo(payment.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push("/admin/payments/pending")}
      >
        ← Back to Pending Payments
      </Button>

      {/* Payment Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Details</h1>
          <p className="text-muted-foreground mt-1">
            Transaction #{payment.transactionId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusInfo.color}`}
          >
            <StatusIcon className="h-4 w-4" />
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Payment Info */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            {/* Amount Display */}
            <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Payment Amount
              </p>
              <h2 className="text-5xl font-bold text-blue-600">
                {payment.currency} {payment.amount.toLocaleString()}
              </h2>
            </div>

            {/* Payment Details Grid */}
            <div className="grid grid-cols-2 gap-6 border-t pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Transaction ID
                </p>
                <p className="font-semibold">{payment.transactionId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Payment Method
                </p>
                <p className="font-semibold">{payment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Initiated Date
                </p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {new Date(payment.initiatedDate).toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Job ID</p>
                <p className="font-semibold">#{payment.jobId}</p>
              </div>
            </div>

            {/* Job Information */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-lg mb-2">{payment.jobTitle}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/admin/jobs/listings/${payment.jobId}`)
                  }
                >
                  View Job Details
                </Button>
              </div>
            </div>

            {/* User Information */}
            <div className="grid grid-cols-2 gap-6 border-t pt-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  From (Client)
                </h3>
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{payment.fromUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.fromUser.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {payment.fromUser.id}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      router.push(`/admin/users/clients/${payment.fromUser.id}`)
                    }
                  >
                    View Profile
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  To (Worker)
                </h3>
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{payment.toUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.toUser.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {payment.toUser.id}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      router.push(`/admin/users/workers/${payment.toUser.id}`)
                    }
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Reason/Notes */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">
                Payment Status Reason
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm">{payment.reason}</p>
              </div>
            </div>

            {/* Tabs for Additional Info */}
            <Tabs defaultValue="timeline" className="border-t pt-6">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="notes">Admin Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="timeline" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm border-l-2 border-blue-500 pl-4 py-2">
                    <div>
                      <p className="font-medium">Payment Initiated</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.initiatedDate).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Client initiated payment for job completion
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm border-l-2 border-yellow-500 pl-4 py-2">
                    <div>
                      <p className="font-medium">Awaiting Confirmation</p>
                      <p className="text-xs text-muted-foreground">
                        Current status
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  No additional history available
                </p>
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <textarea
                  placeholder="Add admin notes about this payment..."
                  className="w-full rounded border border-gray-200 p-3 text-sm resize-none h-32"
                />
                <Button size="sm" className="mt-2">
                  Save Notes
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side: Actions */}
        <div className="space-y-4">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="default"
                className="w-full justify-start"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Payment
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Clock className="w-4 h-4 mr-2" />
                Request More Info
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Payment
              </Button>
              <div className="border-t pt-3 mt-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Flag for Review
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Payment ID</dt>
                <dd className="font-medium text-xs">#{payment.id}</dd>

                <dt className="text-muted-foreground">Currency</dt>
                <dd className="font-medium">{payment.currency}</dd>

                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">Service Payment</dd>

                <dt className="text-muted-foreground">Platform Fee</dt>
                <dd className="font-medium text-xs">
                  {payment.currency} {(payment.amount * 0.1).toFixed(2)}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
