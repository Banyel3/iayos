"use client";

import { Sidebar } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Info,
  CheckCircle,
} from "lucide-react";
import { JOB_CATEGORIES, type JobCategory } from "@/lib/job-categories";

export default function JobCategoriesPage() {
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

  const totalCategories = JOB_CATEGORIES.length;
  const avgMinRate =
    JOB_CATEGORIES.reduce((sum, cat) => sum + cat.minimumRate, 0) /
    totalCategories;
  const expertCategories = JOB_CATEGORIES.filter(
    (cat) => cat.skillLevel === "expert"
  ).length;

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                <p className="text-xs text-gray-600 mt-1">
                  Categories requiring expertise
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Categories List */}
          <div className="space-y-3">
            {JOB_CATEGORIES.map((category: JobCategory) => (
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
                              category.skillLevel
                            )}`}
                          >
                            {category.skillLevel.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {category.description}
                        </p>
                      </div>

                      {/* Rates - Inline */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Min Rate</p>
                          <p className="text-xl font-bold text-green-600">
                            ₱{category.minimumRate}
                            <span className="text-xs text-gray-500">/hr</span>
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Range</p>
                          <p className="text-sm font-semibold text-blue-600">
                            ₱{category.minimumRate} - ₱
                            {Math.round(category.minimumRate * 2.5)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">
                            Project Cost
                          </p>
                          <p className="text-sm font-semibold text-purple-600">
                            ₱
                            {(category.averageProjectCost.min / 1000).toFixed(
                              0
                            )}
                            k - ₱
                            {(category.averageProjectCost.max / 1000).toFixed(
                              0
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
                    Rate Calculation Guidelines
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
