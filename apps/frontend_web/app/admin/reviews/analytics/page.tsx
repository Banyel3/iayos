"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Flag,
  EyeOff,
  User,
  Award,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface Statistics {
  total_reviews: number;
  average_rating: number;
  rating_distribution: { [key: string]: number };
  flagged_count: number;
  hidden_count: number;
}

interface TrendData {
  timeline: Array<{
    date: string;
    count: number;
    average_rating: number;
  }>;
  comparison: {
    current_period: number;
    previous_period: number;
    change_percent: number;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/app-reviews/statistics`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/app-reviews/trends?period=${period}`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch trends");

      const data = await response.json();
      setTrends(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchTrends();
  }, [period]);

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-5 w-5 text-emerald-600" />;
    } else if (change < 0) {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-emerald-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                  <BarChart3 className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading analytics...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Back Button */}
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Button>

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-8 w-8" />
                <h1 className="text-4xl font-bold">Rating Analytics</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Platform-wide review statistics and trends
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Reviews
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(statistics.total_reviews ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-yellow-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Average Rating
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    ⭐ {statistics.average_rating.toFixed(1)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <Flag className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Flagged Reviews
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {statistics.flagged_count}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <EyeOff className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Hidden Reviews
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    {statistics.hidden_count}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rating Distribution */}
          {statistics && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Rating Distribution
                </h3>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = statistics.rating_distribution[rating] || 0;
                    const percentage =
                      statistics.total_reviews > 0
                        ? (count / statistics.total_reviews) * 100
                        : 0;
                    return (
                      <div key={rating} className="flex items-center gap-4">
                        <div className="flex items-center gap-1 w-24">
                          {Array.from({ length: rating }, (_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                        <div className="flex-1">
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-32 text-right">
                          <span className="font-semibold text-gray-900">
                            {count.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trends */}
          {trends && (
            <div className="space-y-6">
              {/* Period Selector */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Review Trends
                    </h3>
                    <div className="flex gap-2">
                      {["7d", "30d", "90d", "1y"].map((p) => (
                        <Button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-4 h-10 rounded-xl font-medium ${
                            period === p
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {p === "7d" && "7 Days"}
                          {p === "30d" && "30 Days"}
                          {p === "90d" && "90 Days"}
                          {p === "1y" && "1 Year"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comparison Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Current Period
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {trends.comparison.current_period} reviews
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getTrendIcon(trends.comparison.change_percent)}
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${getTrendColor(trends.comparison.change_percent)}`}
                        >
                          {Math.abs(trends.comparison.change_percent).toFixed(
                            1,
                          )}
                          %
                        </p>
                        <p className="text-sm text-gray-600">
                          vs previous period
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">
                    Daily Breakdown
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {trends.timeline.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.count} reviews • ⭐{" "}
                            {item.average_rating.toFixed(1)} avg
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              {item.count} reviews
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
