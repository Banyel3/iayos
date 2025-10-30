"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Info,
  CheckCircle,
  Users,
  FileText,
} from "lucide-react";

interface JobCategory {
  id: number;
  name: string;
  description: string;
  minimum_rate: number;
  rate_type: string;
  skill_level: string;
  average_project_cost_min: number;
  average_project_cost_max: number;
  jobs_count: number;
  workers_count: number;
  clients_count: number;
}

export default function JobCategoriesPage() {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "http://localhost:8000/api/adminpanel/jobs/categories",
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "entry":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-blue-100 text-blue-800";
      case "expert":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalCategories = categories.length;
  const avgMinRate =
    categories.length > 0
      ? categories.reduce((sum, cat) => sum + cat.minimum_rate, 0) /
        totalCategories
      : 0;
  const expertCategories = categories.filter(
    (cat) => cat.skill_level === "expert"
  ).length;
  const totalJobs = categories.reduce((sum, cat) => sum + cat.jobs_count, 0);
  const totalWorkers = categories.reduce(
    (sum, cat) => sum + cat.workers_count,
    0
  );

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading categories...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Job Categories</h1>
            <p className="text-gray-600 mt-1">
              Minimum rates based on DOLE guidelines and industry standards
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Categories
                </CardTitle>
                <Briefcase className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {totalCategories}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Active job categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg. Minimum Rate
                </CardTitle>
                <DollarSign className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  ₱{avgMinRate.toFixed(0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">Per hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Expert Level
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {expertCategories}
                </div>
                <p className="text-xs text-gray-600 mt-1">Expertise required</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Jobs
                </CardTitle>
                <FileText className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {totalJobs}
                </div>
                <p className="text-xs text-gray-600 mt-1">Across categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Workers
                </CardTitle>
                <Users className="h-5 w-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {totalWorkers}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Specialized workers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Categories List */}
          <div className="space-y-3">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {category.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSkillLevelColor(
                              category.skill_level
                            )}`}
                          >
                            {category.skill_level.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {category.description}
                        </p>
                        <div className="flex gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {category.jobs_count} jobs
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {category.workers_count} workers
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {category.clients_count} interested clients
                          </span>
                        </div>
                      </div>

                      {/* Rates - Inline */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Min Rate</p>
                          <p className="text-xl font-bold text-green-600">
                            ₱{category.minimum_rate}
                            <span className="text-xs text-gray-500">/hr</span>
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Range</p>
                          <p className="text-sm font-semibold text-blue-600">
                            ₱{category.minimum_rate} - ₱
                            {Math.round(category.minimum_rate * 2.5)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">
                            Project Cost
                          </p>
                          <p className="text-sm font-semibold text-purple-600">
                            ₱
                            {(category.average_project_cost_min / 1000).toFixed(
                              1
                            )}
                            k - ₱
                            {(category.average_project_cost_max / 1000).toFixed(
                              1
                            )}
                            k
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer Info */}
          <Card className="mt-4 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Rate Calculation Guidelines (DOLE Standards)
                  </h3>
                  <div className="text-xs text-gray-700 flex gap-4">
                    <span>
                      <strong>Entry:</strong> 1.1-1.3x min wage
                    </span>
                    <span>
                      <strong>Intermediate:</strong> 1.5-2x min wage
                    </span>
                    <span>
                      <strong>Expert:</strong> 2-3x min wage
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
