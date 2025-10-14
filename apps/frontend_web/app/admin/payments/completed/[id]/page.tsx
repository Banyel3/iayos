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
  Download,
  Receipt,
  Loader2,
} from "lucide-react";

interface CompletedPayment {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
  };
  toUser: {
    id: string;
    name: string;
    email: string;
  };
  jobId: string;
  jobTitle: string;
  paymentMethod: string;
  completedDate: string;
  platformFee: number;
  netAmount: number;
}

const mockCompletedPayments: CompletedPayment[] = [
  {
    id: "pmt_comp_001",
    transactionId: "TXN-2024-001001",
    amount: 1200,
    currency: "PHP",
    fromUser: {
      id: "client_001",
      name: "Maria Santos",
      email: "maria@email.com",
    },
    toUser: {
      id: "worker_001",
      name: "Juan Dela Cruz",
      email: "juan@email.com",
    },
    jobId: "job_001",
    jobTitle: "Plumbing Services",
    paymentMethod: "GCash",
    completedDate: "2024-01-15T14:30:00Z",
    platformFee: 120,
    netAmount: 1080,
  },
];

export default function CompletedPaymentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<CompletedPayment | null>(null);

  useEffect(() => {
    const foundPayment = mockCompletedPayments.find((p) => p.id === id);
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

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="outline"
        onClick={() => router.push("/admin/payments/completed")}
      >
        ← Back to Completed Payments
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Completed Payment</h1>
          <p className="text-muted-foreground mt-1">
            Transaction #{payment.transactionId}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4" />
          Completed
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            <div className="text-center py-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
              <h2 className="text-5xl font-bold text-green-600">
                {payment.currency} {payment.amount.toLocaleString()}
              </h2>
            </div>

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
                  Completed Date
                </p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {new Date(payment.completedDate).toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Job ID</p>
                <p className="font-semibold">#{payment.jobId}</p>
              </div>
            </div>

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

            <Tabs defaultValue="breakdown" className="border-t pt-6">
              <TabsList>
                <TabsTrigger value="breakdown">Payment Breakdown</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="receipt">Receipt</TabsTrigger>
              </TabsList>
              <TabsContent value="breakdown" className="mt-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross Amount</span>
                    <span className="font-semibold">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Platform Fee (10%)
                    </span>
                    <span className="font-semibold text-red-600">
                      - {payment.currency}{" "}
                      {payment.platformFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Net to Worker</span>
                    <span className="font-bold text-green-600 text-lg">
                      {payment.currency} {payment.netAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="timeline" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm border-l-2 border-green-500 pl-4 py-2">
                    <div>
                      <p className="font-medium">Payment Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.completedDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="receipt" className="mt-4">
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Official payment receipt
                  </p>
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Send Receipt Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Payment ID</dt>
                <dd className="font-medium text-xs">#{payment.id}</dd>

                <dt className="text-muted-foreground">Currency</dt>
                <dd className="font-medium">{payment.currency}</dd>

                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-green-600">Completed</dd>

                <dt className="text-muted-foreground">Platform Fee</dt>
                <dd className="font-medium text-xs">
                  {payment.currency} {payment.platformFee.toLocaleString()}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
