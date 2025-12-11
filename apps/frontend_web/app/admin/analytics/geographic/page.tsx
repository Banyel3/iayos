"use client";

import { useState } from "react";
import { Sidebar } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  TrendingUp,
  Download,
  RefreshCw,
  Users,
  Briefcase,
  DollarSign,
  Activity,
} from "lucide-react";

export default function GeographicAnalytics() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <MapPin className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">Geographic Analytics</h1>
                </div>
                <p className="text-teal-100 text-lg">
                  Location-based insights and regional performance
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button className="bg-white text-teal-600 hover:bg-gray-100">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Philippines Map Placeholder */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-teal-600" />
                  <span>Philippines Heat Map</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Users
                  </Button>
                  <Button variant="outline" size="sm">
                    Jobs
                  </Button>
                  <Button variant="outline" size="sm">
                    Revenue
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border-2 border-dashed border-teal-300">
                <div className="text-center">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-teal-400" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Interactive Philippines Map
                  </p>
                  <p className="text-sm text-gray-500 max-w-md">
                    Markers sized by user count, color-coded by revenue. Click
                    markers for city details.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Integration: Leaflet or Google Maps API
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Breakdown Table */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Regional Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">
                        Region
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Cities
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Users
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Jobs Posted
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Jobs Completed
                      </th>
                      <th className="text-right p-3 font-medium text-gray-700">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        region: "Zamboanga Peninsula (Region IX)",
                        cities: 12,
                        users: 3456,
                        posted: 1234,
                        completed: 1089,
                        revenue: 925000,
                      },
                      {
                        region: "National Capital Region (NCR)",
                        cities: 8,
                        users: 2890,
                        posted: 987,
                        completed: 856,
                        revenue: 845000,
                      },
                      {
                        region: "Central Visayas (Region VII)",
                        cities: 15,
                        users: 2134,
                        posted: 876,
                        completed: 745,
                        revenue: 678000,
                      },
                      {
                        region: "Davao Region (Region XI)",
                        cities: 10,
                        users: 1567,
                        posted: 654,
                        completed: 578,
                        revenue: 534000,
                      },
                      {
                        region: "Northern Mindanao (Region X)",
                        cities: 14,
                        users: 1234,
                        posted: 543,
                        completed: 456,
                        revenue: 423000,
                      },
                    ].map((region, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">
                          {region.region}
                        </td>
                        <td className="text-right p-3">{region.cities}</td>
                        <td className="text-right p-3">
                          {region.users.toLocaleString()}
                        </td>
                        <td className="text-right p-3">
                          {region.posted.toLocaleString()}
                        </td>
                        <td className="text-right p-3">
                          {region.completed.toLocaleString()}
                        </td>
                        <td className="text-right p-3 font-medium">
                          ₱{region.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Cities Chart */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Top 10 Cities by Users</span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Users
                  </Button>
                  <Button variant="outline" size="sm">
                    Jobs
                  </Button>
                  <Button variant="outline" size="sm">
                    Revenue
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    city: "Zamboanga City",
                    value: 3456,
                    metric: "users",
                    percentage: 100,
                  },
                  {
                    city: "Manila",
                    value: 2890,
                    metric: "users",
                    percentage: 84,
                  },
                  {
                    city: "Cebu City",
                    value: 2134,
                    metric: "users",
                    percentage: 62,
                  },
                  {
                    city: "Davao City",
                    value: 1567,
                    metric: "users",
                    percentage: 45,
                  },
                  {
                    city: "Cagayan de Oro",
                    value: 1234,
                    metric: "users",
                    percentage: 36,
                  },
                  {
                    city: "Quezon City",
                    value: 987,
                    metric: "users",
                    percentage: 29,
                  },
                  {
                    city: "Iloilo City",
                    value: 876,
                    metric: "users",
                    percentage: 25,
                  },
                  {
                    city: "Bacolod",
                    value: 765,
                    metric: "users",
                    percentage: 22,
                  },
                  {
                    city: "General Santos",
                    value: 654,
                    metric: "users",
                    percentage: 19,
                  },
                  {
                    city: "Pagadian City",
                    value: 543,
                    metric: "users",
                    percentage: 16,
                  },
                ].map((city, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-400 w-6">
                          #{i + 1}
                        </span>
                        <span className="text-gray-900 font-medium">
                          {city.city}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {city.value.toLocaleString()} {city.metric}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden ml-8">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${city.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* City Deep Dive & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>City Deep Dive: Zamboanga City</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-gray-900">3,456</p>
                      <p className="text-xs text-gray-500 mt-1">Total Users</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <Briefcase className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-gray-900">1,234</p>
                      <p className="text-xs text-gray-500 mt-1">Jobs Posted</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-gray-900">₱925K</p>
                      <p className="text-xs text-gray-500 mt-1">Revenue</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      User Growth (Last 6 Months)
                    </p>
                    <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
                      <Activity className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Top Job Categories
                    </p>
                    <div className="space-y-2">
                      {[
                        { category: "Construction", percentage: 35 },
                        { category: "Plumbing", percentage: 28 },
                        { category: "Electrical", percentage: 22 },
                      ].map((cat, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-gray-600">{cat.category}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full"
                                style={{ width: `${cat.percentage * 3}%` }}
                              ></div>
                            </div>
                            <span className="font-medium">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Location-based Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          Highest Growth
                        </p>
                        <p className="text-sm text-gray-600">
                          Cagayan de Oro: +45% user growth in Q4
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          Underserved Markets
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          High job demand, low worker supply:
                        </p>
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            Dipolog City
                          </Badge>
                          <Badge variant="outline" className="text-xs ml-2">
                            Dapitan City
                          </Badge>
                          <Badge variant="outline" className="text-xs ml-2">
                            Ipil
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          Expansion Opportunities
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          Cities with high potential:
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">Iligan City</span>
                            <Badge className="bg-blue-600 text-white">
                              High Potential
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">Cotabato City</span>
                            <Badge className="bg-blue-600 text-white">
                              High Potential
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-start space-x-3">
                      <DollarSign className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          Highest Revenue per User
                        </p>
                        <p className="text-sm text-gray-600">
                          Manila: ₱292 avg per user (highest)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
