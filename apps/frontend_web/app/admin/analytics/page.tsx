"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  UserCheck,
  Building2
} from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  totalWorkers: number;
  totalClients: number;
  totalRevenue: number;
  totalJobs: number;
  completedJobs: number;
  avgRating: number;
  monthlyGrowth: {
    users: number;
    revenue: number;
    jobs: number;
  };
}

const mockAnalyticsData: AnalyticsData = {
  totalUsers: 15234,
  totalWorkers: 8456,
  totalClients: 6778,
  totalRevenue: 245680.50,
  totalJobs: 3421,
  completedJobs: 3102,
  avgRating: 4.6,
  monthlyGrowth: {
    users: 12.5,
    revenue: 18.2,
    jobs: 15.7
  }
};

const monthlyStats = [
  { month: "Jan", users: 1200, revenue: 18500, jobs: 245 },
  { month: "Feb", users: 1350, revenue: 22100, jobs: 289 },
  { month: "Mar", users: 1450, revenue: 24800, jobs: 312 },
  { month: "Apr", users: 1580, revenue: 28200, jobs: 356 },
  { month: "May", users: 1720, revenue: 31500, jobs: 398 },
  { month: "Jun", users: 1850, revenue: 34200, jobs: 421 }
];

const topPerformingServices = [
  { service: "Plumbing Services", jobs: 456, revenue: 34520, avgRating: 4.8 },
  { service: "House Cleaning", jobs: 398, revenue: 28650, avgRating: 4.7 },
  { service: "Electrical Work", jobs: 342, revenue: 45200, avgRating: 4.9 },
  { service: "Gardening", jobs: 298, revenue: 18750, avgRating: 4.5 },
  { service: "Painting", jobs: 267, revenue: 22100, avgRating: 4.6 }
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("last_30_days");
  const [data] = useState<AnalyticsData>(mockAnalyticsData);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor platform performance and key metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="last_90_days">Last 90 days</option>
            <option value="last_year">Last year</option>
          </select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{data.monthlyGrowth.users}% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{data.monthlyGrowth.revenue}% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalJobs.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{data.monthlyGrowth.jobs}% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((data.completedJobs / data.totalJobs) * 100)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +2.1% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown of platform users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Workers</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{data.totalWorkers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((data.totalWorkers / data.totalUsers) * 100)}%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(data.totalWorkers / data.totalUsers) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Clients</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{data.totalClients.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((data.totalClients / data.totalUsers) * 100)}%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(data.totalClients / data.totalUsers) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Rating</CardTitle>
            <CardDescription>Overall service quality metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{data.avgRating}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
                <div className="flex justify-center mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.floor(data.avgRating) ? "text-yellow-400" : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>5 stars</span>
                  <span>68%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "68%" }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>4 stars</span>
                  <span>22%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: "22%" }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>3 stars</span>
                  <span>7%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: "7%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Platform growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-4">
              {monthlyStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-2">{stat.month}</div>
                  <div className="space-y-1">
                    <div className="h-20 bg-blue-100 rounded flex items-end justify-center">
                      <div 
                        className="w-8 bg-blue-600 rounded-t"
                        style={{ height: `${(stat.users / 2000) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-medium">{stat.users}</div>
                    <div className="text-xs text-muted-foreground">Users</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Services */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Services</CardTitle>
          <CardDescription>Most popular services on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformingServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{service.service}</div>
                    <div className="text-sm text-muted-foreground">
                      {service.jobs} jobs • {service.avgRating}★ rating
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${service.revenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}