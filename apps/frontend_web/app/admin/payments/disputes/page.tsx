"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { AlertTriangle, Eye, MessageSquare } from "lucide-react";

export default function DisputesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Disputes</h1>
          <p className="text-muted-foreground">
            Manage payment disputes and chargebacks
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Need resolution</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,345</div>
            <p className="text-xs text-muted-foreground">In dispute</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2</div>
            <p className="text-xs text-muted-foreground">Days average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Disputes</CardTitle>
          <CardDescription>Payment disputes requiring attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "DSP001", customer: "John Doe", amount: 125.50, reason: "Service not provided", status: "open" },
            { id: "DSP002", customer: "Jane Smith", amount: 89.00, reason: "Quality issues", status: "investigating" },
            { id: "DSP003", customer: "Mike Wilson", amount: 200.00, reason: "Unauthorized charge", status: "escalated" }
          ].map((dispute, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium">{dispute.id} - {dispute.customer}</div>
                  <div className="text-sm text-muted-foreground">{dispute.reason}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold">${dispute.amount}</div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    dispute.status === "open" ? "bg-red-100 text-red-800" :
                    dispute.status === "investigating" ? "bg-yellow-100 text-yellow-800" :
                    "bg-orange-100 text-orange-800"
                  }`}>
                    {dispute.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Respond
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}