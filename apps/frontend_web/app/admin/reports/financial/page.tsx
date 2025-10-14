"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import {
  DollarSign,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  PieChart,
} from "lucide-react";
import { Sidebar } from "../../components";

export default function FinancialReportsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <p className="text-muted-foreground">Financial summaries and audit reports</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱1,245,680</div>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +23.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱124,568</div>
                <p className="text-xs text-muted-foreground">10% commission</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱45,230</div>
                <p className="text-xs text-muted-foreground">Operational costs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₱79,338</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generate Financial Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Monthly Summary
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Quarterly Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <PieChart className="w-4 h-4 mr-2" />
                  Revenue Breakdown
                </Button>
                <Button variant="outline" className="justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Growth Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { month: "January 2024", revenue: "₱198,540", fees: "₱19,854", profit: "₱12,345" },
                  { month: "February 2024", revenue: "₱215,320", fees: "₱21,532", profit: "₱15,678" },
                  { month: "March 2024", revenue: "₱234,650", fees: "₱23,465", profit: "₱18,234" },
                  { month: "April 2024", revenue: "₱256,780", fees: "₱25,678", profit: "₱21,456" },
                  { month: "May 2024", revenue: "₱298,450", fees: "₱29,845", profit: "₱24,567" },
                  { month: "June 2024", revenue: "₱341,940", fees: "₱34,194", profit: "₱28,123" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.month}</p>
                      <p className="text-sm text-muted-foreground">
                        Revenue: {item.revenue} • Fees: {item.fees}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{item.profit}</p>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { category: "Server & Hosting", amount: "₱18,500", percent: 41 },
                  { category: "Marketing", amount: "₱12,300", percent: 27 },
                  { category: "Support Staff", amount: "₱9,800", percent: 22 },
                  { category: "Development", amount: "₱4,630", percent: 10 },
                ].map((expense, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{expense.category}</span>
                      <span className="font-medium">{expense.amount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${expense.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
