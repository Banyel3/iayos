"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { CreditCard, Search, Download, Eye } from "lucide-react";

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: "completed" | "pending" | "failed" | "cancelled";
  type: "payment" | "refund" | "payout";
  method: "card" | "bank_transfer" | "digital_wallet";
  date: string;
  description: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "txn_001",
    userId: "user_1",
    userName: "John Doe",
    amount: 125.50,
    fee: 3.78,
    netAmount: 121.72,
    status: "completed",
    type: "payment",
    method: "card",
    date: "2024-03-20T10:30:00Z",
    description: "Plumbing service payment"
  },
  {
    id: "txn_002",
    userId: "user_2",
    userName: "Jane Smith",
    amount: 89.00,
    fee: 2.67,
    netAmount: 86.33,
    status: "pending",
    type: "payment",
    method: "bank_transfer",
    date: "2024-03-20T09:15:00Z",
    description: "House cleaning service"
  }
];

export default function TransactionsPage() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed" | "cancelled">("all");

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
          <p className="text-muted-foreground">
            Complete transaction history and details
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Transactions
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${transactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Transaction volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find transactions by user, ID, or status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
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
              onChange={(e) => setStatusFilter(e.target.value as "all" | "completed" | "pending" | "failed" | "cancelled")}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                      {transaction.id} • {transaction.description}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.method.replace("_", " ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold">${transaction.amount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      Fee: ${transaction.fee.toFixed(2)} • Net: ${transaction.netAmount.toFixed(2)}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}