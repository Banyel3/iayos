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
import { Sidebar } from "../components";
import {
  CreditCard,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Search,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";

interface PaymentOverview {
  totalTransactions: number;
  totalRevenue: number;
  pendingPayments: number;
  disputes: number;
  refunds: number;
  monthlyGrowth: number;
  avgTransactionValue: number;
  successRate: number;
}

interface RecentTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "disputed";
  type: "payment" | "refund" | "payout";
  date: string;
  method: "card" | "bank_transfer" | "digital_wallet";
}

const mockPaymentOverview: PaymentOverview = {
  totalTransactions: 12543,
  totalRevenue: 987654.32,
  pendingPayments: 23,
  disputes: 7,
  refunds: 45,
  monthlyGrowth: 15.7,
  avgTransactionValue: 78.65,
  successRate: 96.8,
};

const mockRecentTransactions: RecentTransaction[] = [
  {
    id: "txn_001",
    userId: "user_1",
    userName: "John Doe",
    amount: 125.5,
    status: "completed",
    type: "payment",
    date: "2024-03-20T10:30:00Z",
    method: "card",
  },
  {
    id: "txn_002",
    userId: "user_2",
    userName: "Jane Smith",
    amount: 89.0,
    status: "pending",
    type: "payment",
    date: "2024-03-20T09:15:00Z",
    method: "bank_transfer",
  },
  {
    id: "txn_003",
    userId: "user_3",
    userName: "Mike Johnson",
    amount: 45.25,
    status: "disputed",
    type: "payment",
    date: "2024-03-19T14:22:00Z",
    method: "digital_wallet",
  },
];

export default function PaymentsPage() {
  const [paymentData] = useState<PaymentOverview>(mockPaymentOverview);
  const [transactions] = useState<RecentTransaction[]>(mockRecentTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "pending" | "failed" | "disputed"
  >("all");

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "disputed":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-blue-100 text-blue-800";
      case "refund":
        return "bg-purple-100 text-purple-800";
      case "payout":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Payments Management
            </h1>
            <p className="text-muted-foreground">
              Monitor transactions, disputes, and payment processing
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Payments
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Payment Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${paymentData.totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />+
                {paymentData.monthlyGrowth}% from last month
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentData.totalTransactions.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Avg. ${paymentData.avgTransactionValue} per transaction
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentData.successRate}%
              </div>
              <div className="text-xs text-muted-foreground">
                Payment processing success
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Disputes
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentData.disputes}</div>
              <div className="text-xs text-muted-foreground">
                {paymentData.pendingPayments} pending payments
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>All Transactions</span>
              </CardTitle>
              <CardDescription>
                View and manage all payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentData.totalTransactions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total transactions processed
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Payment Disputes</span>
              </CardTitle>
              <CardDescription>
                Resolve payment disputes and chargebacks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentData.disputes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active disputes to resolve
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 text-purple-600" />
                <span>Refunds</span>
              </CardTitle>
              <CardDescription>
                Process and track refund requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentData.refunds}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Refunds processed this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest payment activities on the platform
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All Transactions
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
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
                      | "completed"
                      | "pending"
                      | "failed"
                      | "disputed"
                  )
                }
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{transaction.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {transaction.id}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()} •{" "}
                        {transaction.method.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        {transaction.type === "refund" ? "-" : ""}$
                        {transaction.amount.toFixed(2)}
                      </div>
                      <div className="flex space-x-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
                        >
                          {transaction.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}
                        >
                          {transaction.type}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
