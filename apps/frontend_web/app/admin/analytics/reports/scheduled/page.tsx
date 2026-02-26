"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sidebar, useMainContentClass } from "../../../components";
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
  const mainClass = useMainContentClass("min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50");
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={mainClass}>
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl mx-4 sm:mx-8 mt-4 sm:mt-8">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-4 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2 text-center sm:text-left">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Scheduled Reports</h1>
                </div>
                <p className="text-blue-100 text-sm sm:text-lg max-w-2xl">
                  Manage automated report generation and delivery
                </p>
              </div>
              <Button
                className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 shadow-lg font-bold uppercase text-xs sm:text-sm tracking-tight h-12 px-6 rounded-xl"
                onClick={() => toast.info("Coming soon", { description: "Report scheduling will be available in a future update." })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Report
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-6 space-y-6">
          {/* Tabs */}
          <div className="flex items-center justify-center sm:justify-start gap-2 bg-gray-100/50 p-1.5 rounded-2xl w-fit border border-gray-100">
            <Button
              variant={activeTab === "scheduled" ? "default" : "ghost"}
              onClick={() => setActiveTab("scheduled")}
              className={`h-10 px-4 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === "scheduled" ? "bg-blue-600 !text-white shadow-lg" : "text-gray-500"}`}
            >
              <Clock className="h-3.5 w-3.5 mr-2" />
              Scheduled
            </Button>
            <Button
              variant={activeTab === "history" ? "default" : "ghost"}
              onClick={() => setActiveTab("history")}
              className={`h-10 px-4 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === "history" ? "bg-blue-600 !text-white shadow-lg" : "text-gray-500"}`}
            >
              <FileText className="h-3.5 w-3.5 mr-2" />
              History
            </Button>
          </div>

          {/* Scheduled Reports Tab */}
          {activeTab === "scheduled" && (
            <>
              <Card className="border-0 shadow-xl overflow-hidden bg-white">
                <CardHeader className="p-4 sm:p-6 bg-slate-50/50 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight">Active Scheduled Protocols</CardTitle>
                      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Active Node Count:{" "}
                        <span className="text-blue-600">{scheduledReports.filter((r) => r.status === "active").length}</span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="block lg:hidden divide-y divide-gray-100">
                    {scheduledReports.map((report) => (
                      <div key={report.id} className="p-4 bg-white hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight">{report.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Badge className={
                                report.type === "Operations"
                                  ? "bg-blue-100 text-blue-700 pointer-events-none text-[9px] font-black uppercase px-2 py-0"
                                  : report.type === "Financial"
                                    ? "bg-purple-100 text-purple-700 pointer-events-none text-[9px] font-black uppercase px-2 py-0"
                                    : "bg-green-100 text-green-700 pointer-events-none text-[9px] font-black uppercase px-2 py-0"
                              }>
                                {report.type}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none">
                                {report.frequency}
                              </Badge>
                            </div>
                          </div>
                          <Badge className={
                            report.status === "active"
                              ? "bg-green-500/10 text-green-600 border-green-500/20 pointer-events-none text-[9px] font-black uppercase px-2"
                              : "bg-gray-500/10 text-gray-600 border-gray-500/20 pointer-events-none text-[9px] font-black uppercase px-2"
                          }>
                            {report.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Next Run</span>
                              <span className="text-[10px] font-bold text-gray-700">{report.nextRun}</span>
                            </div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                            <Users className="h-3 w-3 text-gray-400" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Recipients</span>
                              <span className="text-[10px] font-bold text-gray-700">{report.recipients.length} Accounts</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-9 px-3 text-[10px] font-black uppercase tracking-tight border-gray-200" onClick={() => toast.info("Coming soon")}>
                            {report.status === "active" ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                            {report.status === "active" ? "Pause" : "Resume"}
                          </Button>
                          <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-gray-400 border-gray-200" onClick={() => toast.info("Coming soon")}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-red-500 border-red-100 hover:bg-red-50" onClick={() => toast.info("Coming soon")}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/30">
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                            Protocol Identifier
                          </th>
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                            Cluster Class
                          </th>
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                            Temporal Flux
                          </th>
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                            Target Run
                          </th>
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                            Dispatch Group
                          </th>
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                            State
                          </th>
                          <th className="text-right p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                            Operations
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledReports.map((report) => (
                          <tr
                            key={report.id}
                            className="border-b hover:bg-blue-50/30 transition-colors"
                          >
                            <td className="p-4">
                              <div>
                                <p className="font-black text-xs sm:text-sm text-gray-900 uppercase tracking-tight">
                                  {report.name}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {report.metrics
                                    .slice(0, 3)
                                    .map((metric, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-gray-100 bg-white"
                                      >
                                        {metric}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge
                                className={
                                  report.type === "Operations"
                                    ? "bg-blue-100 text-blue-700 font-black text-[9px] uppercase"
                                    : report.type === "Financial"
                                      ? "bg-purple-100 text-purple-700 font-black text-[9px] uppercase"
                                      : "bg-green-100 text-green-700 font-black text-[9px] uppercase"
                                }
                              >
                                {report.type}
                              </Badge>
                            </td>
                            <td className="p-4 font-bold text-xs text-gray-500 uppercase tracking-tighter">
                              {report.frequency}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-tighter">
                                  {report.nextRun}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                                <span className="text-xs font-bold text-gray-700">
                                  {report.recipients.length} Cluster Nodes
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge
                                className={
                                  report.status === "active"
                                    ? "bg-green-500 text-white font-black text-[9px] uppercase px-3"
                                    : "bg-gray-100 text-gray-500 font-black text-[9px] uppercase px-3"
                                }
                              >
                                {report.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end space-x-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 text-blue-600" onClick={() => toast.info("Coming soon")}>
                                  {report.status === "active" ? (
                                    <Pause className="h-3.5 w-3.5" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-100 text-indigo-600" onClick={() => toast.info("Coming soon")}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg text-red-600 hover:bg-red-100"
                                  onClick={() => toast.info("Coming soon")}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
              <Card className="border-0 shadow-xl overflow-hidden bg-white">
                <CardHeader className="p-4 sm:p-6 bg-slate-50/50 border-b">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight">Rapid Configuration Engines</CardTitle>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Pre-orchestrated reporting modules
                  </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map((template, i) => (
                      <Card
                        key={i}
                        className="border-2 border-gray-50 hover:border-blue-500/30 transition-all cursor-pointer shadow-sm group bg-gray-50/30 hover:bg-white"
                        onClick={() => toast.info("Coming soon")}
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start space-x-4">
                            <div
                              className={`p-3 bg-white rounded-xl shadow-lg group-hover:scale-110 transition-transform`}
                            >
                              <template.icon
                                className={`h-5 w-5 sm:h-6 sm:w-6 text-blue-600`}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-black text-xs sm:text-sm text-gray-900 uppercase tracking-tight mb-1">
                                {template.name}
                              </h3>
                              <p className="text-[10px] sm:text-xs font-bold text-gray-400 leading-tight mb-3">
                                {template.description}
                              </p>
                              <Button size="sm" variant="outline" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest border-blue-100 text-blue-600 bg-blue-50/50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Plus className="h-3 w-3 mr-1.5" />
                                Inject Engine
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
            <Card className="border-0 shadow-xl overflow-hidden bg-white">
              <CardHeader className="p-4 sm:p-6 bg-slate-50/50 border-b">
                <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight">Dispatch Log Archive</CardTitle>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Historical generation records
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="block sm:hidden divide-y divide-gray-100">
                  {reportHistory.map((report) => (
                    <div key={report.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight leading-snug max-w-[70%]">{report.name}</h3>
                        <Badge className={
                          report.status === "success"
                            ? "bg-green-500/10 text-green-600 border-green-500/20 font-black text-[9px] uppercase px-1.5"
                            : "bg-red-500/10 text-red-600 border-red-500/20 font-black text-[9px] uppercase px-1.5"
                        }>
                          {report.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Time Dimension</span>
                          <span className="text-[10px] font-bold text-gray-700">{report.date}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Payload Size</span>
                          <span className="text-[10px] font-bold text-gray-700">{report.size}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        {report.status === "success" ? (
                          <>
                            <Button variant="outline" className="flex-1 h-9 bg-blue-50/50 border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest" onClick={() => toast.info("Coming soon")}>
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Fetch
                            </Button>
                            <Button variant="outline" className="h-9 w-9 p-0 border-gray-100 text-gray-400" onClick={() => toast.info("Coming soon")}>
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" className="w-full h-9 border-red-100 text-red-400 text-[10px] font-black uppercase tracking-widest opacity-50 pointer-events-none">
                            Payload Corrupted
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/30">
                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                          Payload Name
                        </th>
                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                          Generation Stamp
                        </th>
                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                          Dispatch Status
                        </th>
                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                          Data Volumetric
                        </th>
                        <th className="text-right p-4 font-black text-[10px] uppercase tracking-widest text-gray-400">
                          Operational Tasks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportHistory.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="p-4 font-black text-xs text-gray-900 uppercase tracking-tight">
                            {report.name}
                          </td>
                          <td className="p-4 text-xs font-bold text-gray-500 uppercase tracking-tighter">{report.date}</td>
                          <td className="p-4">
                            <Badge
                              className={
                                report.status === "success"
                                  ? "bg-green-100 text-green-700 font-black text-[9px] uppercase px-3"
                                  : "bg-red-100 text-red-700 font-black text-[9px] uppercase px-3"
                              }
                            >
                              {report.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-xs font-bold text-gray-500 tracking-tight">{report.size}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-end space-x-2">
                              {report.status === "success" && (
                                <>
                                  <Button variant="outline" size="sm" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm" onClick={() => toast.info("Coming soon")}>
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Fetch Payload
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-100 text-indigo-600" onClick={() => toast.info("Coming soon")}>
                                    <Mail className="h-3.5 w-3.5" />
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
