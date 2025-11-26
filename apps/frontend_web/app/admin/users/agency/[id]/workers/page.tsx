"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  UserCheck, 
  Download, 
  Eye, 
  Star,
  TrendingUp,
  Briefcase,
  Award,
  DollarSign,
} from "lucide-react";
import { 
  useAgencyEmployees, 
  useEmployeePerformance,
  exportEmployeesToCSV 
} from "@/lib/hooks/useAdminAgency";

export default function AgencyWorkersPage() {
  const params = useParams();
  const router = useRouter();
  const agencyId = parseInt(params.id as string);
  
  const { data: employees, isLoading, error } = useAgencyEmployees(agencyId);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    if (!employees) return { total: 0, active: 0, avgRating: 0, totalJobs: 0, totalEarnings: 0 };
    
    const active = employees.filter(e => e.is_active).length;
    const totalRating = employees.reduce((sum, e) => sum + e.rating, 0);
    const avgRating = employees.length > 0 ? totalRating / employees.length : 0;
    const totalJobs = employees.reduce((sum, e) => sum + e.total_jobs_completed, 0);
    const totalEarnings = employees.reduce((sum, e) => sum + e.total_earnings, 0);
    
    return {
      total: employees.length,
      active,
      avgRating: avgRating.toFixed(1),
      totalJobs,
      totalEarnings,
    };
  }, [employees]);

  // Filter employees based on search and status
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    return employees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && employee.is_active) ||
        (statusFilter === "inactive" && !employee.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  const handleExportCSV = () => {
    if (employees) {
      exportEmployeesToCSV(employees, `Agency ${agencyId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-600 font-medium">Failed to load employees</p>
            <p className="text-gray-600 text-sm mt-2">{(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/users/agency")}
            className="mb-3"
          >
            ← Back to Agencies
          </Button>
          <h1 className="text-3xl font-bold">Agency #{agencyId} - Employees</h1>
          <p className="text-gray-600">
            Manage and monitor agency employee performance
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={!employees || employees.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600">Agency workers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-gray-600">Currently working</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating}</div>
            <p className="text-xs text-gray-600">★ Overall performance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-gray-600">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search employees by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition"
            >
              <option value="all">All Status</option>
              <option value="active">✓ Active</option>
              <option value="inactive">✗ Inactive</option>
            </select>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span>Showing {filteredEmployees.length} of {stats.total} employees</span>
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      <div className="space-y-4">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <Card key={employee.employee_id} className="hover:shadow-lg transition">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-semibold text-xl shadow-md">
                      {employee.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Employee Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-gray-900">
                              {employee.name}
                            </h3>
                            {employee.employee_of_the_month && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                <Award className="w-3 h-3" />
                                EOTM
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-600 font-medium mb-1">
                            {employee.role}
                          </p>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                          {employee.phone && (
                            <p className="text-sm text-gray-600">{employee.phone}</p>
                          )}
                        </div>
                        
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            employee.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.is_active ? "✓ Active" : "✗ Inactive"}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-yellow-600" />
                            <p className="text-xs text-gray-600 font-medium">Rating</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {employee.rating.toFixed(1)} ★
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-gray-600 font-medium">Jobs Done</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {employee.total_jobs_completed}
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <p className="text-xs text-gray-600 font-medium">Earnings</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            ₱{employee.total_earnings.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Joined: {new Date(employee.joined_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "This agency doesn't have any employees yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {filteredEmployees.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">Agency Performance Summary</h3>
                <p className="text-sm text-gray-600">Cumulative statistics across all employees</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₱{stats.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Avg. Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.avgRating} ★
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
