"use client";

import { Briefcase, TrendingUp, Users, Clock, Star } from "lucide-react";

interface AgencyStatsGridProps {
  stats: {
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    cancelledJobs: number;
    averageRating: number;
    totalReviews: number;
    onTimeCompletionRate: number;
    responseTime: string;
  };
  employees: Array<{
    employeeId: number;
    name: string;
    role: string;
    rating: number | null;
  }>;
}

export default function AgencyStatsGrid({
  stats,
  employees,
}: AgencyStatsGridProps) {
  const completionRate =
    stats.totalJobs > 0
      ? ((stats.completedJobs / stats.totalJobs) * 100).toFixed(1)
      : "0";

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Agency Statistics
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {/* Total Jobs */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Briefcase className="h-8 w-8 text-gray-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
          <p className="text-sm text-gray-600">Total Jobs</p>
        </div>

        {/* Completed Jobs */}
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">
            {stats.completedJobs}
          </p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>

        {/* Active Jobs */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{stats.activeJobs}</p>
          <p className="text-sm text-gray-600">Active Jobs</p>
        </div>

        {/* Average Rating */}
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-600">
            {stats.averageRating.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600">Avg Rating</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Completion Rate */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Completion Rate
            </span>
            <span className="text-lg font-bold text-gray-900">
              {completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* On-Time Completion */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              On-Time Delivery
            </span>
            <span className="text-lg font-bold text-gray-900">
              {stats.onTimeCompletionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.onTimeCompletionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">Response Time</p>
            <p className="text-sm text-gray-600">{stats.responseTime}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">Team Members</p>
            <p className="text-sm text-gray-600">
              {employees.length} employees
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
