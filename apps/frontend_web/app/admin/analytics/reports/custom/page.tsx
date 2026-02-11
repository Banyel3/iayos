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
  DollarSign,
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
      icon: DollarSign,
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
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">Custom Report Builder</h1>
                </div>
                <p className="text-indigo-100 text-lg">
                  Create custom analytics reports with your preferred metrics
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Progress Steps */}
          <Card className="border-0 shadow-xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {steps.map((step, i) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${currentStep >= step.number
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-gray-300 text-gray-400"
                          }`}
                      >
                        {currentStep > step.number ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <step.icon className="h-6 w-6" />
                        )}
                      </div>
                      <p
                        className={`mt-2 text-sm font-medium ${currentStep >= step.number
                            ? "text-gray-900"
                            : "text-gray-500"
                          }`}
                      >
                        {step.name}
                      </p>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-4 transition-all ${currentStep > step.number
                            ? "bg-indigo-600"
                            : "bg-gray-300"
                          }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Select Metrics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Select Metrics to Include</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose the data points you want to analyze. Selected:{" "}
                    {selectedMetrics.length} metrics
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {metricCategories.map((category, i) => (
                      <Card key={i} className="border-2">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-lg">
                            <div
                              className={`p-2 bg-${category.color}-100 rounded-lg`}
                            >
                              <category.icon
                                className={`h-5 w-5 text-${category.color}-600`}
                              />
                            </div>
                            <span>{category.name}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {category.metrics.map((metric, j) => (
                              <button
                                key={j}
                                onClick={() => toggleMetric(metric)}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${selectedMetrics.includes(metric)
                                    ? "border-indigo-600 bg-indigo-50"
                                    : "border-gray-200 hover:border-gray-300"
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">
                                    {metric}
                                  </span>
                                  {selectedMetrics.includes(metric) && (
                                    <Check className="h-5 w-5 text-indigo-600" />
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
                  className="bg-indigo-600 hover:bg-indigo-700"
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
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Configure Filters</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Define the time range and segments for your report
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Date Range */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          "Last 7 Days",
                          "Last 30 Days",
                          "This Month",
                          "Last Month",
                          "This Quarter",
                          "Last Quarter",
                          "This Year",
                          "Custom",
                        ].map((range) => (
                          <Button
                            key={range}
                            variant="outline"
                            className="justify-start"
                          >
                            {range}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* User Segment */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        User Segment
                      </label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          "All Users",
                          "Clients Only",
                          "Workers Only",
                          "Agencies Only",
                        ].map((segment) => (
                          <Button
                            key={segment}
                            variant="outline"
                            className="justify-start"
                          >
                            {segment}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Location
                      </label>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          "All Locations",
                          "Zamboanga Peninsula",
                          "NCR",
                          "Central Visayas",
                          "Davao Region",
                          "Northern Mindanao",
                        ].map((loc) => (
                          <Button
                            key={loc}
                            variant="outline"
                            className="justify-start text-xs"
                          >
                            {loc}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Job Category Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Job Categories
                      </label>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {[
                          "All Categories",
                          "Construction",
                          "Plumbing",
                          "Electrical",
                          "Carpentry",
                          "Painting",
                          "Cleaning",
                          "Landscaping",
                        ].map((cat) => (
                          <Button
                            key={cat}
                            variant="outline"
                            className="justify-start text-xs"
                          >
                            {cat}
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
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Choose Visualization Type</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Select how you want your data displayed
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {chartTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedChartType(type.value)}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${selectedChartType === type.value
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className={`p-3 rounded-lg ${selectedChartType === type.value
                                ? "bg-indigo-600"
                                : "bg-gray-100"
                              }`}
                          >
                            <type.icon
                              className={`h-6 w-6 ${selectedChartType === type.value
                                  ? "text-white"
                                  : "text-gray-600"
                                }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {type.name}
                              </h3>
                              {selectedChartType === type.value && (
                                <Check className="h-5 w-5 text-indigo-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
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
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Export Format</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose how you want to export your report
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        format: "PDF",
                        icon: FileText,
                        description: "Printable document",
                      },
                      {
                        format: "CSV",
                        icon: Download,
                        description: "Spreadsheet data",
                      },
                      {
                        format: "Excel",
                        icon: FileText,
                        description: "Excel workbook",
                      },
                      {
                        format: "JSON",
                        icon: FileText,
                        description: "Raw data",
                      },
                    ].map((exp) => (
                      <Button
                        key={exp.format}
                        variant="outline"
                        className="h-auto py-4 flex-col"
                      >
                        <exp.icon className="h-6 w-6 mb-2" />
                        <span className="font-semibold">{exp.format}</span>
                        <span className="text-xs text-gray-500 mt-1">
                          {exp.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Schedule Report</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Optionally schedule this report to run automatically
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {["One-time", "Daily", "Weekly", "Monthly"].map(
                        (freq) => (
                          <Button key={freq} variant="outline">
                            {freq}
                          </Button>
                        )
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Email Recipients
                      </label>
                      <input
                        type="text"
                        placeholder="admin@iayos.com, manager@iayos.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate multiple emails with commas
                      </p>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <p className="text-sm text-gray-700">
                        <strong>Note:</strong> Scheduled reports will be
                        generated and emailed at 8:00 AM PHT
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Report Summary
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• {selectedMetrics.length} metrics selected</p>
                        <p>• {selectedChartType} chart visualization</p>
                        <p>• Ready to generate or schedule</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Now
                      </Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Mail className="h-4 w-4 mr-2" />
                        Schedule Report
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
