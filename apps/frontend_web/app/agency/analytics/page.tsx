"use client";

import {
  useState } from "react";
import {
  useLeaderboard,
  useAgencyStats,
  useRevenueTrends,
  exportAnalyticsCSV,
} from "@/lib/hooks/useAnalytics";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Banknote,
  TrendingUp,
  Briefcase,
  Star,
  Award,
  Download,
  Calendar,
} from "lucide-react";
import { format, subMonths } from "date-fns";

export default function AnalyticsPage() {
  const [weeksRange, setWeeksRange] = useState(12); // Default 12 weeks (3 months)
  const [leaderboardSort, setLeaderboardSort] = useState<
    "rating" | "jobs" | "earnings"
  >("rating");

  const { data: stats, isLoading: statsLoading } = useAgencyStats();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(
    leaderboardSort,
    20
  );
  const { data: revenueTrends, isLoading: trendsLoading } = useRevenueTrends(
    weeksRange
  );

  if (statsLoading || leaderboardLoading || trendsLoading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-32 rounded-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-200 h-32 rounded-lg" />
            <div className="bg-gray-200 h-32 rounded-lg" />
            <div className="bg-gray-200 h-32 rounded-lg" />
            <div className="bg-gray-200 h-32 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-200 h-80 rounded-lg" />
            <div className="bg-gray-200 h-80 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const completionRate = stats
    ? stats.total_jobs > 0
      ? Math.round((stats.completed_jobs / stats.total_jobs) * 100)
      : 0
    : 0;

  const handleExportCSV = () => {
    if (!leaderboard || !stats) return;
    exportAnalyticsCSV(leaderboard, stats);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Track performance and insights</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Revenue</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <Banknote className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₱{(stats?.total_revenue ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">vs last month</p>
        </div>

        {/* Jobs Completed */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">
              Jobs Completed
            </h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.completed_jobs || 0}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium text-gray-900">{completionRate}%</span>{" "}
            completion rate
          </p>
        </div>

        {/* Active Jobs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Active Jobs</h3>
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.active_jobs || 0}
          </p>
          <p className="text-sm text-gray-600 mt-2">Currently in progress</p>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">
              Average Rating
            </h3>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="text-yellow-500" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(stats?.average_rating ?? 0).toFixed(1)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Star className="text-yellow-500 fill-yellow-500" size={14} />
            <Star className="text-yellow-500 fill-yellow-500" size={14} />
            <Star className="text-yellow-500 fill-yellow-500" size={14} />
            <Star className="text-yellow-500 fill-yellow-500" size={14} />
            <Star className="text-yellow-500" size={14} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue Trends
              </h3>
              <p className="text-sm text-gray-600">Weekly revenue over time</p>
            </div>
            <Calendar className="text-gray-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  try { return date ? format(new Date(date), "MMM dd") : ""; } catch { return ""; }
                }}
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                formatter={(value: number) => [
                  `₱${value.toLocaleString()}`,
                  "Revenue",
                ]}
                labelFormatter={(label) => {
                  try { return label ? format(new Date(label), "MMM dd, yyyy") : ""; } catch { return ""; }
                }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Revenue"
                dot={{ fill: "#3B82F6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Job Completion Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Jobs Completed
              </h3>
              <p className="text-sm text-gray-600">Weekly job completions</p>
            </div>
            <Briefcase className="text-gray-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  try { return date ? format(new Date(date), "MMM dd") : ""; } catch { return ""; }
                }}
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                labelFormatter={(label) => {
                  try { return label ? format(new Date(label), "MMM dd, yyyy") : ""; } catch { return ""; }
                }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="jobs"
                fill="#10B981"
                name="Jobs Completed"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Leaderboard */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Employee Leaderboard
            </h3>
            <p className="text-sm text-gray-600">Top performing employees</p>
          </div>
          <select
            value={leaderboardSort}
            onChange={(e) =>
              setLeaderboardSort(
                e.target.value as "rating" | "jobs" | "earnings"
              )
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="jobs">Sort by Jobs</option>
            <option value="earnings">Sort by Earnings</option>
          </select>
        </div>

        {/* Mobile leaderboard card view */}
        <div className="md:hidden space-y-3">
          {leaderboard && leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Award className="mx-auto text-gray-300" size={48} />
              <p className="text-gray-600 mt-2">No employee data yet</p>
            </div>
          ) : (
            leaderboard?.slice(0, 10).map((employee, index) => (
              <div
                key={employee.employeeId}
                className={`flex items-center gap-3 p-4 rounded-lg border ${
                  index < 3 ? "border-blue-200 bg-blue-50/50" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  {index === 0 && <Award className="text-yellow-500 fill-yellow-500" size={18} />}
                  {index === 1 && <Award className="text-gray-400 fill-gray-400" size={18} />}
                  {index === 2 && <Award className="text-orange-600 fill-orange-600" size={18} />}
                  <span className="font-bold text-gray-900 text-sm">#{employee.rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm truncate">{employee.name}</p>
                    {employee.isEmployeeOfTheMonth && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🏆 EOTM
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Star className="text-yellow-500 fill-yellow-500" size={12} />
                      {employee.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-600">{employee.totalJobsCompleted} jobs</span>
                    <span className="text-xs font-semibold text-green-600">₱{(employee.totalEarnings ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Jobs
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Earnings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard?.slice(0, 10).map((employee, index) => (
                <tr
                  key={employee.employeeId}
                  className={`${
                    index < 3 ? "bg-blue-50/50" : ""
                  } hover:bg-gray-50 transition`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Award
                          className="text-yellow-500 fill-yellow-500"
                          size={20}
                        />
                      )}
                      {index === 1 && (
                        <Award
                          className="text-gray-400 fill-gray-400"
                          size={20}
                        />
                      )}
                      {index === 2 && (
                        <Award
                          className="text-orange-600 fill-orange-600"
                          size={20}
                        />
                      )}
                      <span className="font-semibold text-gray-900">
                        #{employee.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {employee.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-500">
                          {employee.email}
                        </p>
                        {employee.isEmployeeOfTheMonth && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🏆 EOTM
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Star
                        className="text-yellow-500 fill-yellow-500"
                        size={16}
                      />
                      <span className="font-semibold text-gray-900">
                        {(employee.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-medium text-gray-900">
                      {employee.totalJobsCompleted}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-green-600">
                      ₱{(employee.totalEarnings ?? 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty state */}
          {leaderboard && leaderboard.length === 0 && (
            <div className="text-center py-12">
              <Award className="mx-auto text-gray-300" size={48} />
              <p className="text-gray-600 mt-2">No employee data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
