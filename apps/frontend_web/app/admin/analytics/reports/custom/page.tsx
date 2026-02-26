"use client";

import { useState } from "react";
import { Sidebar, useMainContentClass } from "../../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Check,
  ChevronRight,
  Download,
  Calendar,
  Mail,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Briefcase,
  Activity,
} from "lucide-react";

export default function CustomReportBuilder() {
  const mainClass = useMainContentClass("min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50");
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<string>("line");

  const steps = [
    { number: 1, name: "Select Metrics", icon: BarChart3 },
    { number: 2, name: "Configure Filters", icon: Calendar },
    { number: 3, name: "Choose Visualization", icon: PieChart },
    { number: 4, name: "Export & Schedule", icon: Mail },
  ];

  const metricCategories = [
    {
      name: "User Metrics",
      icon: Users,
      color: "blue",
      metrics: [
        "Total Users",
        "Active Users (DAU/WAU/MAU)",
        "New Registrations",
        "User Churn Rate",
        "User Retention",
      ],
    },
    {
      name: "Job Metrics",
      icon: Briefcase,
      color: "green",
      metrics: [
        "Jobs Posted",
        "Jobs Completed",
        "Completion Rate",
        "Avg Time to Complete",
        "Jobs by Category",
      ],
    },
    {
      name: "Revenue Metrics",
      icon: TrendingUp,
      color: "purple",
      metrics: [
        "Total Revenue",
        "Revenue by Category",
        "Payment Methods",
        "Platform Fees",
        "Refund Rate",
      ],
    },
  ];

  const chartTypes = [
    {
      value: "line",
      name: "Line Chart",
      icon: TrendingUp,
      description: "Show trends over time",
    },
    {
      value: "bar",
      name: "Bar Chart",
      icon: BarChart3,
      description: "Compare categories",
    },
    {
      value: "pie",
      name: "Pie Chart",
      icon: PieChart,
      description: "Show proportions",
    },
    {
      value: "table",
      name: "Data Table",
      icon: FileText,
      description: "Raw data view",
    },
  ];

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={mainClass}>
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl mx-4 sm:mx-8 mt-4 sm:mt-8">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-4 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Report Builder</h1>
              </div>
              <p className="text-indigo-100 text-sm sm:text-lg max-w-2xl leading-relaxed">
                Configure your custom analytics reports with precise metrics
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-6">
          {/* Progress Steps */}
          <Card className="border-0 shadow-xl mb-6 overflow-hidden bg-white">
            <CardContent className="p-4 sm:p-6 pb-0">
              <div className="flex items-center justify-between relative">
                {steps.map((step, i) => (
                  <div key={step.number} className="flex flex-col items-center z-10">
                    <div
                      className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${currentStep >= step.number
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                        : "bg-white border-gray-200 text-gray-300"
                        }`}
                    >
                      {currentStep > step.number ? (
                        <Check className="h-4 w-4 sm:h-6 sm:w-6" />
                      ) : (
                        <step.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                      )}
                    </div>
                  </div>
                ))}
                {/* Connector line */}
                <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-gray-100 -z-10">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="mt-4 pb-4">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 leading-none">Step {currentStep} of {steps.length}</p>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-tight">{steps[currentStep - 1].name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Select Metrics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="border-0 shadow-xl overflow-hidden bg-white">
                <CardHeader className="p-4 sm:p-6 bg-slate-50/50 border-b">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight">Select Metrics Catalog</CardTitle>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Selected:{" "}
                    <span className="text-indigo-600">{selectedMetrics.length}</span> metrics
                  </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {metricCategories.map((category, i) => (
                      <Card key={i} className="border-2 border-gray-100 shadow-sm overflow-hidden group hover:border-indigo-100 transition-colors">
                        <CardHeader className="p-4 sm:p-6 bg-gray-50/50 border-b">
                          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base font-black uppercase tracking-tight">
                            <div
                              className={`p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform`}
                            >
                              <category.icon
                                className={`h-4 w-4 sm:h-5 sm:w-5 text-indigo-600`}
                              />
                            </div>
                            <span>{category.name}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                            {category.metrics.map((metric, j) => (
                              <button
                                key={j}
                                onClick={() => toggleMetric(metric)}
                                className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all group/btn ${selectedMetrics.includes(metric)
                                  ? "border-indigo-600 bg-indigo-50 shadow-inner"
                                  : "border-gray-50 hover:border-indigo-100 bg-gray-50/50"
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm font-black text-gray-600 uppercase tracking-tight leading-none">
                                    {metric}
                                  </span>
                                  {selectedMetrics.includes(metric) && (
                                    <div className="bg-indigo-600 rounded-full p-1 group-hover/btn:scale-110 transition-transform">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={selectedMetrics.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-black"
                >
                  Next: Configure Filters{" "}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Configure Filters */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card className="border-0 shadow-xl overflow-hidden bg-white">
                <CardHeader className="p-4 sm:p-6 bg-slate-50/50 border-b">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight border-b-2 border-indigo-500 inline-block">Filter Configuration</CardTitle>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Temporal and segment granularity
                  </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-8">
                    {/* Date Range */}
                    <div>
                      <label className="text-[10px] sm:text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 block">
                        Analytical Horizon
                      </label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {[
                          "Last 7 Days",
                          "Last 30 Days",
                          "This Month",
                          "Last Month",
                          "This Quarter",
                          "Last Quarter",
                          "This Year",
                          "Custom Range",
                        ].map((range) => (
                          <Button
                            key={range}
                            variant="outline"
                            className="justify-start h-12 text-[10px] sm:text-xs font-black uppercase tracking-tight rounded-xl border-gray-100 hover:border-indigo-600 transition-all hover:bg-indigo-50 flex items-center gap-2 group"
                          >
                            <Calendar className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                            {range}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* User Segment */}
                    <div>
                      <label className="text-[10px] sm:text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 block">
                        Segment Drill-Down
                      </label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {[
                          "All Segments",
                          "Clients",
                          "Workers",
                          "Agencies",
                        ].map((segment) => (
                          <Button
                            key={segment}
                            variant="outline"
                            className="justify-start h-12 text-[10px] sm:text-xs font-black uppercase tracking-tight rounded-xl border-gray-100 hover:border-indigo-600 transition-all hover:bg-indigo-50 flex items-center gap-2 group"
                          >
                            <Users className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                            {segment}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="text-[10px] sm:text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 block">
                        Geographic Analysis
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {[
                          "Global View (All)",
                          "Zamboanga Peninsula",
                          "National Capital Region",
                          "Central Visayas Hubs",
                          "Davao Economic Region",
                          "Northern Mindanao",
                        ].map((loc) => (
                          <Button
                            key={loc}
                            variant="outline"
                            className="justify-start h-12 text-[10px] sm:text-xs font-black uppercase tracking-tight rounded-xl border-gray-100 hover:border-indigo-600 transition-all hover:bg-indigo-50"
                          >
                            {loc}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Next: Choose Visualization{" "}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Choose Visualization */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="border-0 shadow-xl overflow-hidden bg-white">
                <CardHeader className="p-4 sm:p-6 bg-slate-50/50 border-b">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight">Visualization Architect</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {chartTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedChartType(type.value)}
                        className={`p-4 sm:p-6 rounded-2xl border-2 text-left transition-all ${selectedChartType === type.value
                          ? "border-indigo-600 bg-indigo-50 shadow-inner"
                          : "border-gray-50 hover:border-gray-200 bg-gray-50/50"
                          }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className={`p-3 rounded-xl shadow-lg ${selectedChartType === type.value
                              ? "bg-indigo-600"
                              : "bg-white"
                              }`}
                          >
                            <type.icon
                              className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedChartType === type.value
                                ? "text-white font-black"
                                : "text-gray-400"
                                }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-black text-xs sm:text-sm text-gray-900 uppercase tracking-tight">
                                {type.name}
                              </h3>
                              {selectedChartType === type.value && (
                                <div className="bg-indigo-600 rounded-full p-1">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 leading-none">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-dashed border-indigo-300">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 text-indigo-400" />
                      <p className="text-lg font-medium text-gray-700">
                        {selectedMetrics.length} metrics · {selectedChartType}{" "}
                        chart
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Report preview will appear here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Next: Export & Schedule{" "}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Export & Schedule */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card className="border-0 shadow-xl overflow-hidden bg-white">
                <CardHeader className="p-4 sm:p-6 bg-slate-50/50 border-b">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight">Delivery Protocol</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <label className="text-[10px] sm:text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 block">
                    Export Resolution
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        format: "Secure PDF",
                        icon: FileText,
                        description: "Standard Document",
                      },
                      {
                        format: "Raw CSV",
                        icon: Download,
                        description: "Tabular Data",
                      },
                      {
                        format: "Excel Hub",
                        icon: FileText,
                        description: "Complex Sheets",
                      },
                      {
                        format: "JSON Schema",
                        icon: FileText,
                        description: "API Grade Data",
                      },
                    ].map((exp) => (
                      <Button
                        key={exp.format}
                        variant="outline"
                        className="h-auto py-4 sm:py-6 flex-col group border-2 border-gray-50 hover:border-indigo-600 transition-all rounded-2xl"
                      >
                        <exp.icon className="h-5 w-5 sm:h-6 sm:w-6 mb-2 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight">{exp.format}</span>
                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase mt-1 leading-none shadow-sm px-1.5 py-0.5 rounded bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                          {exp.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden bg-white">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight">Intelligence Dispatch</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] sm:text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 block">
                        Generation Cadence
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {["Static", "Daily Pulse", "Weekly Recap", "Monthly Audit"].map(
                          (freq) => (
                            <Button key={freq} variant="outline" className="h-10 text-[10px] font-black uppercase tracking-tight border-b-2 border-gray-100 data-[active=true]:border-indigo-600">
                              {freq}
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="group">
                      <label className="text-[10px] sm:text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-indigo-600 transition-colors">
                        Dispatch Endpoints (Recipients)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                          type="text"
                          placeholder="admin@iayos.com, data-hub@iayos.com"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-sm text-gray-700 placeholder:text-gray-300 uppercase tracking-tight"
                        />
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest pl-1 leading-none">
                        Separate cluster endpoints with commas
                      </p>
                    </div>

                    <div className="p-4 bg-indigo-50/50 border-l-4 border-indigo-600 rounded-lg">
                      <p className="text-[11px] font-bold text-indigo-900 leading-relaxed uppercase tracking-tight">
                        <span className="opacity-50">Operational Note:</span> Automated telemetry dispatch is synchronized at 08:00 PHT daily.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white overflow-hidden group">
                <CardContent className="p-6 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform"></div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-2">
                        Report Finalization
                      </h3>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <div className="px-2 py-1 bg-white/10 rounded-lg backdrop-blur-md border border-white/20">
                          <span className="text-[10px] font-black uppercase tracking-widest">{selectedMetrics.length} METRICS</span>
                        </div>
                        <div className="px-2 py-1 bg-white/10 rounded-lg backdrop-blur-md border border-white/20">
                          <span className="text-[10px] font-black uppercase tracking-widest">{selectedChartType} FORMAT</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md font-black uppercase text-xs h-12 shadow-lg rounded-xl">
                        <Download className="h-4 w-4 mr-2" />
                        BUILD ENGINE
                      </Button>
                      <Button className="bg-white text-indigo-600 hover:bg-gray-100 font-black uppercase text-xs h-12 shadow-2xl rounded-xl">
                        <Mail className="h-4 w-4 mr-2" />
                        INITIATE DISPATCH
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Start New Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
