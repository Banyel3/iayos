"use client";

import { useState } from "react";
import { Sidebar } from "../../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Plus,
  Download,
  Edit,
  Trash2,
  Play,
  Pause,
  Mail,
  FileText,
  Calendar,
  Users,
  TrendingUp,
} from "lucide-react";

export default function ScheduledReports() {
  const [activeTab, setActiveTab] = useState<"scheduled" | "history">(
    "scheduled"
  );

  const scheduledReports = [
    {
      id: 1,
      name: "Daily Operations Report",
      type: "Operations",
      frequency: "Daily",
      nextRun: "Today, 8:00 AM",
      recipients: ["admin@iayos.com", "ops@iayos.com"],
      status: "active",
      lastRun: "Yesterday, 8:00 AM",
      metrics: ["Active Jobs", "New Users", "Revenue"],
    },
    {
      id: 2,
      name: "Weekly Revenue Summary",
      type: "Financial",
      frequency: "Weekly",
      nextRun: "Monday, 8:00 AM",
      recipients: ["admin@iayos.com", "finance@iayos.com"],
      status: "active",
      lastRun: "Last Monday, 8:00 AM",
      metrics: ["Total Revenue", "Platform Fees", "Payment Methods"],
    },
    {
      id: 3,
      name: "Monthly Growth Report",
      type: "Analytics",
      frequency: "Monthly",
      nextRun: "Jan 1, 2025, 8:00 AM",
      recipients: ["admin@iayos.com", "management@iayos.com"],
      status: "active",
      lastRun: "Dec 1, 2024, 8:00 AM",
      metrics: ["User Growth", "Job Completion Rate", "Revenue Growth"],
    },
    {
      id: 4,
      name: "Quarterly Financial Report",
      type: "Financial",
      frequency: "Quarterly",
      nextRun: "Apr 1, 2025, 8:00 AM",
      recipients: ["admin@iayos.com", "cfo@iayos.com"],
      status: "paused",
      lastRun: "Oct 1, 2024, 8:00 AM",
      metrics: ["Revenue", "Expenses", "Profit Margin", "Forecasts"],
    },
  ];

  const reportHistory = [
    {
      id: 1,
      name: "Daily Operations Report",
      date: "Yesterday, 8:00 AM",
      status: "success",
      size: "2.4 MB",
    },
    {
      id: 2,
      name: "Daily Operations Report",
      date: "Dec 14, 8:00 AM",
      status: "success",
      size: "2.3 MB",
    },
    {
      id: 3,
      name: "Weekly Revenue Summary",
      date: "Dec 9, 8:00 AM",
      status: "success",
      size: "1.8 MB",
    },
    {
      id: 4,
      name: "Monthly Growth Report",
      date: "Dec 1, 8:00 AM",
      status: "success",
      size: "4.5 MB",
    },
    {
      id: 5,
      name: "Daily Operations Report",
      date: "Dec 13, 8:00 AM",
      status: "failed",
      size: "-",
    },
    {
      id: 6,
      name: "Weekly Revenue Summary",
      date: "Dec 2, 8:00 AM",
      status: "success",
      size: "1.7 MB",
    },
  ];

  const templates = [
    {
      name: "Daily Operations Report",
      description:
        "Key metrics for daily operations: active jobs, new users, revenue",
      icon: TrendingUp,
      color: "blue",
    },
    {
      name: "Weekly Revenue Summary",
      description:
        "Financial overview: revenue, platform fees, payment methods",
      icon: FileText,
      color: "purple",
    },
    {
      name: "Monthly Growth Report",
      description:
        "Growth metrics: user acquisition, retention, job completion",
      icon: Users,
      color: "green",
    },
    {
      name: "Quarterly Financial Report",
      description: "Comprehensive financial analysis with forecasts",
      icon: Calendar,
      color: "orange",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Clock className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">Scheduled Reports</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Manage automated report generation and delivery
                </p>
              </div>
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Report
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Tabs */}
          <div className="flex space-x-2">
            <Button
              variant={activeTab === "scheduled" ? "default" : "outline"}
              onClick={() => setActiveTab("scheduled")}
              className={activeTab === "scheduled" ? "bg-blue-600" : ""}
            >
              <Clock className="h-4 w-4 mr-2" />
              Scheduled Reports
            </Button>
            <Button
              variant={activeTab === "history" ? "default" : "outline"}
              onClick={() => setActiveTab("history")}
              className={activeTab === "history" ? "bg-blue-600" : ""}
            >
              <FileText className="h-4 w-4 mr-2" />
              Report History
            </Button>
          </div>

          {/* Scheduled Reports Tab */}
          {activeTab === "scheduled" && (
            <>
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Active Scheduled Reports</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {
                      scheduledReports.filter((r) => r.status === "active")
                        .length
                    }{" "}
                    active reports
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-gray-700">
                            Report Name
                          </th>
                          <th className="text-left p-3 font-medium text-gray-700">
                            Type
                          </th>
                          <th className="text-left p-3 font-medium text-gray-700">
                            Frequency
                          </th>
                          <th className="text-left p-3 font-medium text-gray-700">
                            Next Run
                          </th>
                          <th className="text-left p-3 font-medium text-gray-700">
                            Recipients
                          </th>
                          <th className="text-left p-3 font-medium text-gray-700">
                            Status
                          </th>
                          <th className="text-right p-3 font-medium text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledReports.map((report) => (
                          <tr
                            key={report.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {report.name}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {report.metrics
                                    .slice(0, 2)
                                    .map((metric, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {metric}
                                      </Badge>
                                    ))}
                                  {report.metrics.length > 2 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{report.metrics.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge
                                className={
                                  report.type === "Operations"
                                    ? "bg-blue-100 text-blue-700"
                                    : report.type === "Financial"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-green-100 text-green-700"
                                }
                              >
                                {report.type}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-600">
                              {report.frequency}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-900">
                                  {report.nextRun}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-900">
                                  {report.recipients.length}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge
                                className={
                                  report.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }
                              >
                                {report.status === "active"
                                  ? "Active"
                                  : "Paused"}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end space-x-1">
                                <Button variant="ghost" size="sm">
                                  {report.status === "active" ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Report Templates */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Report Templates</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Quick-start templates for common reports
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template, i) => (
                      <Card
                        key={i}
                        className="border-2 hover:border-blue-300 transition-all cursor-pointer"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start space-x-4">
                            <div
                              className={`p-3 bg-${template.color}-100 rounded-xl`}
                            >
                              <template.icon
                                className={`h-6 w-6 text-${template.color}-600`}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {template.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                {template.description}
                              </p>
                              <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Use Template
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Report History Tab */}
          {activeTab === "history" && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Report Generation History</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Past reports generated and emailed
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-gray-700">
                          Report Name
                        </th>
                        <th className="text-left p-3 font-medium text-gray-700">
                          Generated At
                        </th>
                        <th className="text-left p-3 font-medium text-gray-700">
                          Status
                        </th>
                        <th className="text-left p-3 font-medium text-gray-700">
                          File Size
                        </th>
                        <th className="text-right p-3 font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportHistory.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium text-gray-900">
                            {report.name}
                          </td>
                          <td className="p-3 text-gray-600">{report.date}</td>
                          <td className="p-3">
                            <Badge
                              className={
                                report.status === "success"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }
                            >
                              {report.status === "success"
                                ? "✓ Success"
                                : "✗ Failed"}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-600">{report.size}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-end space-x-2">
                              {report.status === "success" && (
                                <>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
