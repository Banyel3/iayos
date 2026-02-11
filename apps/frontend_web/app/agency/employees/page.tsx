"use client";

import React, { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/form_button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  Trophy,
  TrendingUp,
  Award,
  CheckCircle,
  X,
  Briefcase,
  DollarSign,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";

interface Specialization {
  specializationID: number;
  categoryName: string;
}

interface Employee {
  id: string | number;
  employeeId?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  name: string;
  email: string;
  specializations?: string[];
  role?: string;
  avatar?: string | null;
  rating?: number | null;
  totalJobsCompleted?: number;
  totalEarnings?: string | number;
  employeeOfTheMonth?: boolean;
  employeeOfTheMonthDate?: string;
  employeeOfTheMonthReason?: string;
  isActive?: boolean;
}

interface PerformanceStats {
  employee_id: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  total_jobs_completed: number;
  total_earnings: string;
  average_rating: number;
  job_completion_rate: number;
  is_employee_of_month: boolean;
  employee_of_month_date?: string;
  employee_of_month_reason?: string;
}

interface LeaderboardEntry {
  employee_id: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  total_jobs_completed: number;
  total_earnings: string;
  rank: number;
}

function Rating({ value }: { value?: number | null }) {
  const v = Math.max(0, Math.min(5, Math.round((value || 0) * 2) / 2));
  return (
    <div className="flex items-center text-sm text-slate-600">
      <Star className="h-4 w-4 text-yellow-400 mr-1" />
      <span className="font-medium">{v.toFixed(1)}</span>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [performanceStats, setPerformanceStats] =
    useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add Employee form state - name breakdown
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  // Edit Employee modal state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editSpecializations, setEditSpecializations] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // EOTM modal state
  const [settingEOTM, setSettingEOTM] = useState(false);
  const [eotmReason, setEotmReason] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState<
    "employees" | "leaderboard" | "performance"
  >("employees");

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/employees`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      } else {
        toast.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Error loading employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEmployees();
    fetchLeaderboard();
    fetchSpecializations();
    return () => controller.abort();
  }, []);

  const fetchSpecializations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/accounts/specializations`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSpecializations(data || []);
      }
    } catch (error) {
      console.error("Error fetching specializations:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/employees/leaderboard`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const fetchPerformance = async (employeeId: number) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/agency/employees/${employeeId}/performance`,
        {
          credentials: "include",
        },
      );
      if (res.ok) {
        const data = await res.json();
        setPerformanceStats(data.performance);
      } else {
        toast.error("Failed to fetch performance stats");
      }
    } catch (error) {
      console.error("Error fetching performance:", error);
      toast.error("Error loading performance stats");
    }
  };

  const setEmployeeOfMonth = async () => {
    if (!selectedEmployee) return;

    if (!eotmReason.trim()) {
      toast.error("Please provide a reason for Employee of the Month");
      return;
    }

    try {
      const employeeId = selectedEmployee.employeeId || selectedEmployee.id;
      const res = await fetch(
        `${API_BASE}/api/agency/employees/${employeeId}/set-eotm`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: eotmReason }),
        },
      );

      if (res.ok) {
        toast.success("Employee of the Month set successfully!");
        setSettingEOTM(false);
        setSelectedEmployee(null);
        setEotmReason("");
        fetchEmployees();
        fetchLeaderboard();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to set Employee of the Month");
      }
    } catch (error) {
      console.error("Error setting EOTM:", error);
      toast.error("Error setting Employee of the Month");
    }
  };

  const handleViewPerformance = (emp: Employee) => {
    setSelectedEmployee(emp);
    setActiveTab("performance");
    const employeeId = emp.employeeId || emp.id;
    fetchPerformance(Number(employeeId));
  };

  const handleSetEOTM = (emp: Employee) => {
    setSelectedEmployee(emp);
    setSettingEOTM(true);
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditFirstName(emp.firstName || "");
    setEditMiddleName(emp.middleName || "");
    setEditLastName(emp.lastName || "");
    setEditEmail(emp.email);
    setEditMobile((emp as any).mobile || "");
    setEditSpecializations(emp.specializations || (emp.role ? [emp.role] : []));
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations(prev => 
      prev.includes(spec) 
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  const toggleEditSpecialization = (spec: string) => {
    setEditSpecializations(prev => 
      prev.includes(spec) 
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  const saveEditEmployee = async () => {
    if (!editingEmployee) return;
    
    if (!editFirstName.trim() || !editLastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    
    if (editSpecializations.length === 0) {
      toast.error("At least one specialization is required");
      return;
    }

    setIsSavingEdit(true);
    try {
      const employeeId = editingEmployee.employeeId || editingEmployee.id;
      const res = await fetch(`${API_BASE}/api/agency/employees/${employeeId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          middleName: editMiddleName.trim(),
          lastName: editLastName.trim(),
          mobile: editMobile,
          specializations: editSpecializations,
        }),
      });

      if (res.ok) {
        toast.success("Employee updated successfully");
        setEditingEmployee(null);
        fetchEmployees();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update employee");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Error updating employee");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const addEmployee = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (!mobile) {
      toast.error("Mobile number is required");
      return;
    }

    if (selectedSpecializations.length === 0) {
      toast.error("At least one specialization is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("middleName", middleName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("mobile", mobile);
      formData.append("specializations", JSON.stringify(selectedSpecializations));

      const res = await fetch(`${API_BASE}/api/agency/employees`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        toast.success("Employee added successfully");
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setMobile("");
        setSelectedSpecializations([]);
        fetchEmployees();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add employee");
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Error adding employee");
    }
  };

  const removeEmployee = async (id: string | number) => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/employees/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Employee removed successfully");
        fetchEmployees();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to remove employee");
      }
    } catch (error) {
      console.error("Error removing employee:", error);
      toast.error("Error removing employee");
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Employees</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Loading skeleton for add employee form */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Employee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Loading skeleton for employee list */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>All Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 border rounded"
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Employee Management
          </h1>
          <p className="text-gray-600">
            Manage your team, track performance, and recognize top performers
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("employees")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "employees"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>All Employees</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === "employees"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {employees.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "leaderboard"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Leaderboard</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("performance")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "performance"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                disabled={!selectedEmployee}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance</span>
                  {selectedEmployee && (
                    <span className="text-xs text-gray-500">
                      ({selectedEmployee.name})
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "employees" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Add Employee & Stats */}
            <div className="space-y-6">
              {/* Employee of the Month */}
              {(() => {
                const eotm = employees.find((e) => e.employeeOfTheMonth);
                if (eotm) {
                  return (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800">
                          <Award className="h-5 w-5" />
                          Employee of the Month
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-4">
                          <img
                            src={
                              eotm.avatar ||
                              `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                                eotm.name,
                              )}`
                            }
                            alt={eotm.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {eotm.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {eotm.role}
                            </div>
                            {eotm.employeeOfTheMonthReason && (
                              <div className="mt-2 text-sm text-gray-700 italic">
                                "{eotm.employeeOfTheMonthReason}"
                              </div>
                            )}
                            <div className="mt-2">
                              <Rating value={eotm.rating} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}

              {/* Top Performer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Top Performer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const rated = employees.filter(
                      (e) => typeof e.rating === "number" && e.rating > 0,
                    );
                    if (rated.length === 0) {
                      return (
                        <div className="text-sm text-gray-500">
                          No ratings yet
                        </div>
                      );
                    }
                    const top = rated.reduce((a, b) =>
                      a.rating! >= b.rating! ? a : b,
                    );
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              top.avatar ||
                              `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                                top.name,
                              )}`
                            }
                            alt={top.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{top.name}</div>
                            <div className="text-sm text-gray-500">
                              {top.role}
                            </div>
                            <div className="mt-2">
                              <Rating value={top.rating} />
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleViewPerformance(top)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Performance
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Add Employee Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Employee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="First name *"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                      <Input
                        placeholder="Last name *"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Middle name (optional)"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                    />
                    <Input
                      placeholder="Mobile number (e.g. 09171234567) *"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specializations * (select one or more)
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                        {specializations.map((spec) => (
                          <button
                            key={spec.specializationID}
                            type="button"
                            onClick={() => toggleSpecialization(spec.categoryName)}
                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                              selectedSpecializations.includes(spec.categoryName)
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                            }`}
                          >
                            {spec.categoryName}
                            {selectedSpecializations.includes(spec.categoryName) && (
                              <CheckCircle className="inline-block ml-1 h-3 w-3" />
                            )}
                          </button>
                        ))}
                      </div>
                      {selectedSpecializations.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Selected: {selectedSpecializations.join(", ")}
                        </p>
                      )}
                    </div>
                    <Button onClick={addEmployee} className="w-full">
                      Add Employee
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Employee List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Active Employees ({employees.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employees.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No employees yet</p>
                      <p className="text-sm mt-1">
                        Add your first employee to get started
                      </p>
                    </div>
                  ) : (
                    employees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="relative">
                            <img
                              src={
                                emp.avatar ||
                                `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                                  emp.name,
                                )}`
                              }
                              alt={emp.name}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                            {emp.employeeOfTheMonth && (
                              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                                <Trophy className="h-4 w-4 text-yellow-900" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-gray-900">
                                {emp.name}
                              </div>
                              {!emp.isActive && (
                                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {(emp.specializations && emp.specializations.length > 0) 
                                ? emp.specializations.join(", ") 
                                : emp.role} • {emp.email}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <Rating value={emp.rating} />
                              {emp.totalJobsCompleted !== undefined && (
                                <span className="text-xs text-gray-500">
                                  {emp.totalJobsCompleted} jobs completed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEditEmployee(emp)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleSetEOTM(emp)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            size="sm"
                          >
                            <Award className="h-4 w-4 mr-1" />
                            EOTM
                          </Button>
                          <Button
                            onClick={() => handleViewPerformance(emp)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Stats
                          </Button>
                          <Button
                            onClick={() => removeEmployee(emp.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                Employee Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No leaderboard data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.employee_id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        index === 0
                          ? "border-yellow-400 bg-yellow-50"
                          : index === 1
                            ? "border-gray-400 bg-gray-50"
                            : index === 2
                              ? "border-orange-400 bg-orange-50"
                              : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <div
                            className={`text-2xl font-bold ${
                              index === 0
                                ? "text-yellow-600"
                                : index === 1
                                  ? "text-gray-600"
                                  : index === 2
                                    ? "text-orange-600"
                                    : "text-gray-400"
                            }`}
                          >
                            #{entry.rank}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-2 -right-2">
                              {index === 0 && (
                                <Trophy className="h-6 w-6 text-yellow-500" />
                              )}
                              {index === 1 && (
                                <Trophy className="h-6 w-6 text-gray-500" />
                              )}
                              {index === 2 && (
                                <Trophy className="h-6 w-6 text-orange-500" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {entry.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {entry.role} • {entry.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span className="font-semibold">
                                {entry.rating.toFixed(1)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">Rating</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4 text-blue-400" />
                              <span className="font-semibold">
                                {entry.total_jobs_completed}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">Jobs</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-400" />
                              <span className="font-semibold">
                                ₱{parseFloat(entry.total_earnings).toFixed(0)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Earnings
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && selectedEmployee && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Overall Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Star className="h-8 w-8 text-yellow-400" />
                  <span className="text-3xl font-bold">
                    {performanceStats?.rating.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-gray-500">/ 5.0</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Jobs Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <span className="text-3xl font-bold">
                    {performanceStats?.total_jobs_completed || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-8 w-8 text-green-400" />
                  <span className="text-3xl font-bold">
                    ₱
                    {performanceStats
                      ? parseFloat(performanceStats.total_earnings).toFixed(0)
                      : "0"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                  <span className="text-3xl font-bold">
                    {performanceStats?.job_completion_rate.toFixed(0) || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Employee Details */}
            <Card className="md:col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle>Employee Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <img
                    src={
                      selectedEmployee.avatar ||
                      `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                        selectedEmployee.name,
                      )}`
                    }
                    alt={selectedEmployee.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">
                        {selectedEmployee.name}
                      </h3>
                      {performanceStats?.is_employee_of_month && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          <Award className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Employee of the Month
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mb-1">
                      <strong>Role:</strong> {performanceStats?.role}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Email:</strong> {performanceStats?.email}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Average Rating:</strong>{" "}
                      {performanceStats?.average_rating.toFixed(2)} / 5.0
                    </p>
                    {performanceStats?.employee_of_month_reason && (
                      <p className="text-gray-700 mt-3 italic">
                        <strong>EOTM Reason:</strong> "
                        {performanceStats.employee_of_month_reason}"
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* EOTM Modal */}
        {settingEOTM && selectedEmployee && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Set Employee of the Month
                  </CardTitle>
                  <button
                    onClick={() => {
                      setSettingEOTM(false);
                      setSelectedEmployee(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selectedEmployee.avatar ||
                        `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                          selectedEmployee.name,
                        )}`
                      }
                      alt={selectedEmployee.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedEmployee.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedEmployee.role}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Recognition *
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    rows={4}
                    value={eotmReason}
                    onChange={(e) => setEotmReason(e.target.value)}
                    placeholder="Why is this employee deserving of Employee of the Month?"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={setEmployeeOfMonth}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Set as EOTM
                  </Button>
                  <Button
                    onClick={() => {
                      setSettingEOTM(false);
                      setSelectedEmployee(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Employee Modal */}
        {editingEmployee && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Edit2 className="h-5 w-5 text-blue-500" />
                    Edit Employee
                  </CardTitle>
                  <button
                    onClick={() => setEditingEmployee(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <Input
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <Input
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name (optional)
                  </label>
                  <Input
                    value={editMiddleName}
                    onChange={(e) => setEditMiddleName(e.target.value)}
                    placeholder="Middle name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specializations * (select one or more)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {specializations.map((spec) => (
                      <button
                        key={spec.specializationID}
                        type="button"
                        onClick={() => toggleEditSpecialization(spec.categoryName)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          editSpecializations.includes(spec.categoryName)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {spec.categoryName}
                        {editSpecializations.includes(spec.categoryName) && (
                          <CheckCircle className="inline-block ml-1 h-3 w-3" />
                        )}
                      </button>
                    ))}
                  </div>
                  {editSpecializations.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {editSpecializations.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={saveEditEmployee}
                    disabled={isSavingEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={() => setEditingEmployee(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
