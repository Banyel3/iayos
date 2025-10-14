"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle,
  Search,
  Eye,
  Download,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Sidebar } from "../../components";

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
      name: "Carlos Santos",
      email: "carlos@email.com",
    },
    toUser: {
      id: "worker_001",
      name: "Maria Garcia",
      email: "maria@email.com",
    },
    jobId: "job_001",
    jobTitle: "Washing Machine Repair",
    paymentMethod: "GCash",
    completedDate: "2024-01-14T15:30:00Z",
    platformFee: 120,
    netAmount: 1080,
  },
  {
    id: "pmt_comp_002",
    transactionId: "TXN-2024-001002",
    amount: 2500,
    currency: "PHP",
    fromUser: {
      id: "client_002",
      name: "Ana Reyes",
      email: "ana@email.com",
    },
    toUser: {
      id: "worker_002",
      name: "Pedro Cruz",
      email: "pedro@email.com",
    },
    jobId: "job_002",
    jobTitle: "Aircon Installation",
    paymentMethod: "Bank Transfer",
    completedDate: "2024-01-14T10:20:00Z",
    platformFee: 250,
    netAmount: 2250,
  },
  {
    id: "pmt_comp_003",
    transactionId: "TXN-2024-001003",
    amount: 800,
    currency: "PHP",
    fromUser: {
      id: "client_003",
      name: "Jose Tan",
      email: "jose@email.com",
    },
    toUser: {
      id: "worker_003",
      name: "Linda Ramos",
      email: "linda@email.com",
    },
    jobId: "job_003",
    jobTitle: "Electrical Wiring Fix",
    paymentMethod: "PayMaya",
    completedDate: "2024-01-13T16:45:00Z",
    platformFee: 80,
    netAmount: 720,
  },
  {
    id: "pmt_comp_004",
    transactionId: "TXN-2024-001004",
    amount: 3500,
    currency: "PHP",
    fromUser: {
      id: "client_004",
      name: "Miguel Santos",
      email: "miguel@email.com",
    },
    toUser: {
      id: "worker_004",
      name: "Rosa Mendoza",
      email: "rosa@email.com",
    },
    jobId: "job_004",
    jobTitle: "Full House Cleaning",
    paymentMethod: "Credit Card",
    completedDate: "2024-01-13T09:15:00Z",
    platformFee: 350,
    netAmount: 3150,
  },
];

export default function CompletedPaymentsPage() {
  const router = useRouter();
  const [payments] = useState<CompletedPayment[]>(mockCompletedPayments);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.fromUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.toUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPlatformFees = payments.reduce((acc, p) => acc + p.platformFee, 0);
  const totalNetAmount = payments.reduce((acc, p) => acc + p.netAmount, 0);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Completed Payments
              </h1>
              <p className="text-muted-foreground">
                Successfully processed payments
              </p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payments.length}</div>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Amount
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{totalAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Gross revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Platform Fees
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{totalPlatformFees.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">10% commission</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Net to Workers
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{totalNetAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">After fees</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Search Payments</CardTitle>
              <CardDescription>
                Find completed payments by transaction ID, user, or job title
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search completed payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
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
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {payment.transactionId}
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {payment.jobTitle}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Completed
                          </span>
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

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(payment.completedDate).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>{payment.paymentMethod}</span>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded p-3 text-sm">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-muted-foreground">
                              Gross Amount
                            </p>
                            <p className="font-semibold">
                              ₱{payment.amount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Platform Fee (10%)
                            </p>
                            <p className="font-semibold">
                              -₱{payment.platformFee.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Net to Worker
                            </p>
                            <p className="font-semibold text-green-600">
                              ₱{payment.netAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/admin/payments/completed/${payment.id}`
                            )
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
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
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No completed payments found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "No payments have been completed yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
