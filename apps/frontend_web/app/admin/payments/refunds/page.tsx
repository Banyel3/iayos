"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { RefreshCw, CheckCircle, Eye } from "lucide-react";

export default function RefundsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refund Management</h1>
          <p className="text-muted-foreground">
            Process and track refund requests
          </p>
        </div>
        <Button>
          Process Pending Refunds
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1</div>
            <p className="text-xs text-muted-foreground">Days average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Refund Requests</CardTitle>
          <CardDescription>Latest refund requests and their status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "REF001", customer: "Sarah Wilson", amount: 75.00, reason: "Service cancelled", status: "pending", date: "2024-03-20" },
            { id: "REF002", customer: "David Chen", amount: 150.00, reason: "Duplicate charge", status: "processed", date: "2024-03-19" },
            { id: "REF003", customer: "Lisa Brown", amount: 95.50, reason: "Service not satisfactory", status: "approved", date: "2024-03-18" }
          ].map((refund, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">{refund.id} - {refund.customer}</div>
                  <div className="text-sm text-muted-foreground">{refund.reason}</div>
                  <div className="text-sm text-muted-foreground">{refund.date}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold">${refund.amount}</div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    refund.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    refund.status === "processed" ? "bg-green-100 text-green-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {refund.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {refund.status === "pending" && (
                    <Button size="sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}