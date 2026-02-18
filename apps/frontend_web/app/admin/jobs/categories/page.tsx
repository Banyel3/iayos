"use client";

import { useState, useEffect } from "react";
import { Sidebar, useMainContentClass } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Award,
  Target,
  Edit,
  Trash2,
  ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";

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
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE}/api/adminpanel/jobs/categories`,
        {
          credentials: "include",
        },
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

  const getSkillLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "entry":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            🌱 Entry Level
          </Badge>
        );
      case "intermediate":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
            ⭐ Intermediate
          </Badge>
        );
      case "expert":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
            👑 Expert
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">
            {level}
          </Badge>
        );
    }
  };

  const totalCategories = categories.length;
  const avgMinRate =
    categories.length > 0
      ? Math.round(
        categories.reduce((sum, cat) => sum + cat.minimum_rate, 0) /
        totalCategories,
      )
      : 0;
  const expertCategories = categories.filter(
    (cat) => cat.skill_level === "expert",
  ).length;
  const totalJobs = categories.reduce((sum, cat) => sum + cat.jobs_count, 0);
  const totalWorkers = categories.reduce(
    (sum, cat) => sum + cat.workers_count,
    0,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <Briefcase className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading categories...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Please wait while we fetch the data
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-8 w-8" />
                <h1 className="text-4xl font-bold">Job Categories & Rates</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Minimum rates based on DOLE guidelines and industry standards
              </p>
            </div>
          </div>

          {/* Modern Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Categories
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalCategories}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Avg Min Rate
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  ₱{avgMinRate}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Expert Level
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {expertCategories}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Jobs
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {totalJobs}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Workers
                </p>
                <p className="text-3xl font-bold text-indigo-600">
                  {totalWorkers}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Modern Category Cards */}
          <div className="space-y-4">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {category.name}
                          </h3>
                          {getSkillLevelBadge(category.skill_level)}
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          {category.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Min Rate
                            </p>
                            <p className="font-bold text-gray-900">
                              ₱{category.minimum_rate}/{category.rate_type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Project Cost
                            </p>
                            <p className="font-semibold text-gray-900 truncate">
                              ₱
                              {(
                                category.average_project_cost_min ?? 0
                              ).toLocaleString()}
                              -
                              {(
                                category.average_project_cost_max ?? 0
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-orange-100 rounded-lg">
                            <FileText className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Jobs
                            </p>
                            <p className="font-bold text-gray-900">
                              {category.jobs_count}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Workers
                            </p>
                            <p className="font-bold text-gray-900">
                              {category.workers_count}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <Users className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Clients
                            </p>
                            <p className="font-bold text-gray-900">
                              {category.clients_count}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toast.info("Category editing coming soon")}
                        className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Edit Category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toast.info("Category status toggle coming soon")}
                        className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                        title="Toggle Status"
                      >
                        <ToggleLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toast.info("Category deletion coming soon")}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <Briefcase className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No categories found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  There are no job categories in the system yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
