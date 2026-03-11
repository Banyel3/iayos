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
  AlertTriangle,
  Banknote,
  Star,
  Trophy,
  TrendingUp,
  Award,
  CheckCircle,
  X,
  Briefcase,
  Edit2,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Trash2,
  Mail,
  Phone,
  Clock,
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
  mobile?: string;
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
  employeeId: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  totalJobsCompleted: number;
  totalEarnings: number;
  employeeOfTheMonth: boolean;
  employeeOfTheMonthDate?: string;
  employeeOfTheMonthReason?: string;
}

interface LeaderboardEntry {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  totalJobsCompleted: number;
  totalEarnings: number;
  rank: number;
  isEmployeeOfTheMonth?: boolean;
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
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Employee form state - name breakdown
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<
    string[]
  >([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);

  // Edit Employee modal state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editSpecializations, setEditSpecializations] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editMobileError, setEditMobileError] = useState<string | null>(null);

  // EOTM modal state
  const [settingEOTM, setSettingEOTM] = useState(false);
  const [eotmReason, setEotmReason] = useState("");

  // Remove employee modal state
  const [removeTarget, setRemoveTarget] = useState<{
    id: string | number;
    name: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeResult, setRemoveResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [eotmTarget, setEotmTarget] = useState<Employee | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<
    "employees" | "leaderboard"
  >("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "jobs" | "earnings">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

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
    fetchEmployees();
    fetchLeaderboard();
    fetchSpecializations();
  }, []);

  // Sync leaderboard from employees
  const leaderboard = [...employees]
    .map((emp) => ({
      employeeId: Number(emp.employeeId || emp.id),
      name: emp.fullName || emp.name,
      email: emp.email,
      role: emp.specializations && emp.specializations.length > 0
        ? emp.specializations[0]
        : emp.role || "Professional",
      rating: Number(emp.totalJobsCompleted || 0) > 0 ? Number(emp.rating || 0) : 0,
      totalJobsCompleted: Number(emp.totalJobsCompleted || 0),
      totalEarnings: Number(emp.totalEarnings || 0),
      rank: 0,
      isEmployeeOfTheMonth: emp.employeeOfTheMonth || false
    }))
    .sort((a, b) => (b.rating - a.rating) || (b.totalJobsCompleted - a.totalJobsCompleted))
    .slice(0, 10)
    .map((emp, idx) => ({ ...emp, rank: idx + 1 }));

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
    // API results are now handled via the derived leaderboard constant
  };



  const setEmployeeOfMonth = async () => {
    if (!eotmTarget) return;

    if (!eotmReason.trim()) {
      toast.error("Please provide a reason for Employee of the Month");
      return;
    }

    try {
      const employeeId = eotmTarget.employeeId || eotmTarget.id;
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
        setEotmTarget(null);
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



  const handleSetEOTM = (emp: Employee) => {
    setEotmTarget(emp);
    setSettingEOTM(true);
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditFirstName(emp.firstName || "");
    setEditMiddleName(emp.middleName || "");
    setEditLastName(emp.lastName || "");
    setEditMobile(emp.mobile || "");
    setEditSpecializations(emp.specializations || (emp.role ? [emp.role] : []));
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec],
    );
  };

  const toggleEditSpecialization = (spec: string) => {
    setEditSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec],
    );
  };

  const normalizeMobile = (value: string) => value.replace(/[\s-]/g, "");

  const isValidMobile = (value: string) => {
    const normalized = normalizeMobile(value);
    return /^09\d{9}$/.test(normalized) || /^\+639\d{9}$/.test(normalized);
  };

  const saveEditEmployee = async () => {
    if (!editingEmployee) return;

    // Clear previous errors
    setEditMobileError(null);

    if (!editFirstName.trim() || !editLastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (!editMobile.trim()) {
      setEditMobileError("Mobile number is required");
      toast.error("Mobile number is required");
      return;
    }

    if (!isValidMobile(editMobile)) {
      const msg = "Enter a valid mobile number (09XXXXXXXXX or +639XXXXXXXXX)";
      setEditMobileError(msg);
      toast.error(msg);
      return;
    }

    if (editSpecializations.length === 0) {
      toast.error("At least one specialization is required");
      return;
    }

    setIsSavingEdit(true);
    try {
      const employeeId = editingEmployee.employeeId || editingEmployee.id;
      const res = await fetch(
        `${API_BASE}/api/agency/employees/${employeeId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: editFirstName.trim(),
            middleName: editMiddleName.trim(),
            lastName: editLastName.trim(),
            mobile: normalizeMobile(editMobile),
            specializations: editSpecializations,
          }),
        },
      );

      if (res.ok) {
        toast.success("Employee updated successfully");
        setEditingEmployee(null);
        setEditMobileError(null);
        fetchEmployees();
      } else {
        const err = await res.json();
        const errorMessage = err.error || "Failed to update employee";

        // Check if it's a mobile number duplicate error
        if (
          errorMessage.toLowerCase().includes("mobile number already in use")
        ) {
          setEditMobileError(errorMessage);
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Error updating employee");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const addEmployee = async () => {
    // Clear previous errors
    setMobileError(null);

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (!mobile) {
      toast.error("Mobile number is required");
      return;
    }

    if (!isValidMobile(mobile)) {
      const msg = "Enter a valid mobile number (09XXXXXXXXX or +639XXXXXXXXX)";
      setMobileError(msg);
      toast.error(msg);
      return;
    }

    if (selectedSpecializations.length === 0) {
      toast.error("At least one specialization is required");
      return;
    }

    setIsAddingEmployee(true);
    try {
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("middleName", middleName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("mobile", normalizeMobile(mobile));
      formData.append(
        "specializations",
        JSON.stringify(selectedSpecializations),
      );

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
        setMobileError(null);
        fetchEmployees();
      } else {
        const err = await res.json();
        const errorMessage = err.error || "Failed to add employee";

        // Check if it's a mobile number duplicate error
        if (
          errorMessage.toLowerCase().includes("mobile number already in use")
        ) {
          setMobileError(errorMessage);
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Error adding employee");
    } finally {
      setIsAddingEmployee(false);
    }
  };

  const removeEmployee = (id: string | number, name: string) => {
    setRemoveTarget({ id, name });
  };

  const confirmRemoveEmployee = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/agency/employees/${removeTarget.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (res.ok) {
        setRemoveTarget(null);
        setRemoveResult({
          type: "success",
          message: `${removeTarget.name} has been removed from your team.`,
        });
        fetchEmployees();
      } else {
        const err = await res.json();
        setRemoveTarget(null);
        setRemoveResult({
          type: "error",
          message: err.error || "Failed to remove employee",
        });
      }
    } catch (error) {
      console.error("Error removing employee:", error);
      setRemoveTarget(null);
      setRemoveResult({
        type: "error",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return (
      <div>
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Employee Management
        </h1>
        <p className="text-gray-600">
          Manage your team, track performance, and recognize top performers
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("employees")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "employees"
                ? "border-[#00BAF1] text-[#00BAF1]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>All Employees</span>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "employees"
                    ? "bg-[#00BAF1]/10 text-[#00BAF1]"
                    : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {employees.length}
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "leaderboard"
                ? "border-[#00BAF1] text-[#00BAF1]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Leaderboard</span>
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
                    <CardHeader className="p-4 md:p-6">
                      <CardTitle className="flex items-center gap-2 text-yellow-800 text-lg">
                        <Award className="h-5 w-5" />
                        Employee of the Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            eotm.avatar ||
                            `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                              eotm.name,
                            )}&backgroundColor=00BAF1`
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


            {/* Add Employee Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <div>
                    <Input
                      placeholder="Mobile Number *"
                      type="tel"
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 11) {
                          setMobile(val);
                        }
                        if (mobileError) setMobileError(null);
                      }}
                      className={
                        mobileError
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : ""
                      }
                    />
                    {mobileError && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <X className="h-4 w-4" />
                        {mobileError}
                      </p>
                    )}
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
                          onClick={() =>
                            toggleSpecialization(spec.categoryName)
                          }
                          className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedSpecializations.includes(spec.categoryName)
                            ? "bg-[#00BAF1] text-white border-[#00BAF1]"
                            : "bg-white text-gray-700 border-gray-300 hover:border-[#00BAF1]/40"
                            }`}
                        >
                          {spec.categoryName}
                          {selectedSpecializations.includes(
                            spec.categoryName,
                          ) && (
                              <CheckCircle className="inline-block ml-1 h-3 w-3" />
                            )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={addEmployee}
                    disabled={isAddingEmployee}
                    className="w-full bg-[#00BAF1] hover:bg-[#00A7D9] text-white"
                  >
                    {isAddingEmployee ? "Adding..." : "Add Employee"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Employee List */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
              <CardTitle>Active Employees ({employees.length})</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-9 h-9 border-gray-200 focus:border-[#00BAF1] focus:ring-[#00BAF1]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-gray-200 text-gray-600"
                  onClick={() => {
                    if (sortBy === "name") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy("name");
                      setSortOrder("asc");
                    }
                  }}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[520px] overflow-y-auto px-6 pb-6 space-y-3 scrollbar-hide">
                {employees.filter(emp =>
                  emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (emp.role && emp.role.toLowerCase().includes(searchQuery.toLowerCase()))
                ).sort((a, b) => {
                  const modifier = sortOrder === "asc" ? 1 : -1;
                  if (sortBy === "name") return a.name.localeCompare(b.name) * modifier;
                  if (sortBy === "rating") return ((a.rating || 0) - (b.rating || 0)) * modifier;
                  if (sortBy === "jobs") return ((a.totalJobsCompleted || 0) - (b.totalJobsCompleted || 0)) * modifier;
                  return 0;
                }).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No employees found</p>
                  </div>
                ) : (
                  employees
                    .filter(emp =>
                      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (emp.role && emp.role.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .sort((a, b) => {
                      const modifier = sortOrder === "asc" ? 1 : -1;
                      if (sortBy === "name") return a.name.localeCompare(b.name) * modifier;
                      return 0;
                    })
                    .map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => setViewingEmployee(emp)}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-100 rounded-xl hover:border-[#00BAF1]/30 hover:bg-gray-50/50 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="relative">
                            <img
                              src={
                                emp.avatar ||
                                `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                                  emp.name,
                                )}&backgroundColor=00BAF1`
                              }
                              alt={emp.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            {emp.employeeOfTheMonth && (
                              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-sm">
                                <Trophy className="h-3 w-3 text-yellow-900" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-gray-900 group-hover:text-[#00BAF1] transition-colors">
                                {emp.name}
                              </div>
                              {!emp.isActive && (
                                <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-gray-100 text-gray-500 rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                              {emp.specializations && emp.specializations.length > 0
                                ? emp.specializations.slice(0, 2).join(", ") + (emp.specializations.length > 2 ? "..." : "")
                                : emp.role || "Cleaner"}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
                              <div className="flex items-center gap-1">
                                <Star className={`h-3 w-3 ${Number(emp.totalJobsCompleted || 0) > 0 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                                <span className="font-medium text-gray-600">{Number(emp.totalJobsCompleted || 0) > 0 ? (emp.rating || 0).toFixed(1) : "0.0"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                <span>{emp.totalJobsCompleted || 0} jobs</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Banknote className="h-3 w-3 text-green-500" />
                                <span className="text-green-600 font-medium">₱{Number(emp.totalEarnings || 0).toLocaleString()}</span>
                              </div>
                              {Number(emp.totalJobsCompleted || 0) > 0 && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-[#00BAF1]" />
                                  <span className="text-[#00BAF1] font-medium">100% Completion Rate</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEmployee(emp);
                            }}
                            className="h-8 w-8 text-gray-400 hover:text-[#00BAF1] hover:bg-[#00BAF1]/10"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEmployee(emp.id, emp.name);
                            }}
                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
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
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-0 pt-8 px-8">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl font-bold bg-white">
                <Trophy className="h-6 w-6 text-[#00BAF1]" />
                Employee Leaderboard
              </CardTitle>
              <div className="flex items-center gap-10 md:gap-16 pr-4">
                <span className="text-sm font-bold text-gray-900 w-[60px] text-center">Earnings</span>
                <span className="text-sm font-bold text-gray-900 w-[60px] text-center">Ratings</span>
                <span className="text-sm font-bold text-gray-900 w-[60px] text-center">Jobs</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pt-6 pb-12">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No leaderboard data available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.employeeId}
                    className="flex items-center justify-between py-5 group transition-all"
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-8 flex justify-center">
                        {index === 0 ? (
                          <Award className="h-6 w-6 text-[#00BAF1]" />
                        ) : (
                          <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {index === 0 && (
                          <div className="text-[10px] uppercase font-extrabold text-[#00BAF1] tracking-widest mb-1">
                            Employee of the Month
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors truncate">
                            {entry.name}
                          </span>
                          <span className="text-xs text-gray-500 font-medium mt-0.5">
                            {entry.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 md:gap-16 pr-4">
                      <div className="w-[60px] text-center">
                        <span className="text-sm font-bold text-green-600">₱{Number(entry.totalEarnings || 0).toLocaleString()}</span>
                      </div>
                      <div className="w-[60px] text-center">
                        <span className="text-lg font-bold text-gray-600">{(entry.rating ?? 0).toFixed(1)}</span>
                      </div>
                      <div className="w-[60px] text-center">
                        <span className="text-lg font-bold text-gray-600">{entry.totalJobsCompleted}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* EOTM Modal */}
      {settingEOTM && eotmTarget && (
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
                    setEotmTarget(null);
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
                      eotmTarget.avatar ||
                      `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                        eotmTarget.name,
                      )}&backgroundColor=00BAF1`
                    }
                    alt={eotmTarget.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {eotmTarget.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {eotmTarget.role}
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
                    setEotmTarget(null);
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

      {/* Remove Employee Confirmation Modal */}
      {removeTarget && !removeResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Remove Employee
                </CardTitle>
                <button
                  onClick={() => setRemoveTarget(null)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isRemoving}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to remove{" "}
                <strong>{removeTarget.name}</strong> from your team? This action
                cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={confirmRemoveEmployee}
                  disabled={isRemoving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isRemoving ? "Removing..." : "Yes, Remove"}
                </Button>
                <Button
                  onClick={() => setRemoveTarget(null)}
                  disabled={isRemoving}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Remove Result Modal (Success / Error) */}
      {removeResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle
                  className={`flex items-center gap-2 ${removeResult.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                    }`}
                >
                  {removeResult.type === "success" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  {removeResult.type === "success"
                    ? "Employee Removed"
                    : "Cannot Remove Employee"}
                </CardTitle>
                <button
                  onClick={() => setRemoveResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{removeResult.message}</p>
              <Button
                onClick={() => setRemoveResult(null)}
                className={`w-full ${removeResult.type === "success"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
              >
                Close
              </Button>
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
                  <Edit2 className="h-5 w-5 text-[#00BAF1]" />
                  Edit Employee
                </CardTitle>
                <button
                  onClick={() => {
                    setEditingEmployee(null);
                    setEditMobileError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  Mobile Number *
                </label>
                <Input
                  type="tel"
                  value={editMobile}
                  onChange={(e) => {
                    setEditMobile(e.target.value);
                    if (editMobileError) setEditMobileError(null);
                  }}
                  placeholder="Mobile number (e.g. 09171234567)"
                  className={
                    editMobileError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                />
                {editMobileError && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-4 w-4" />
                    {editMobileError}
                  </p>
                )}
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
                      onClick={() =>
                        toggleEditSpecialization(spec.categoryName)
                      }
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${editSpecializations.includes(spec.categoryName)
                        ? "bg-[#00BAF1] text-white border-[#00BAF1]"
                        : "bg-white text-gray-700 border-gray-300 hover:border-[#00BAF1]/40"
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
                  className="flex-1 bg-[#00BAF1] hover:bg-[#00A7D9] text-white"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => {
                    setEditingEmployee(null);
                    setEditMobileError(null);
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
      {/* Employee Details Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4 transition-all animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl border-none overflow-hidden scale-in-center">
            <CardContent className="relative px-8 pt-10 pb-8">
              <button
                onClick={() => setViewingEmployee(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <img
                    src={
                      viewingEmployee.avatar ||
                      `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                        viewingEmployee.name,
                      )}&backgroundColor=00BAF1`
                    }
                    alt={viewingEmployee.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{viewingEmployee.name}</h2>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-700">{(viewingEmployee.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email Address</p>
                      <p className="text-sm font-medium truncate">{viewingEmployee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mobile Number</p>
                      <p className="text-sm font-medium">{viewingEmployee.mobile || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Jobs Completed</p>
                      <p className="text-sm font-medium">{viewingEmployee.totalJobsCompleted || 0} Successful Jobs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Banknote className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Earnings</p>
                      <p className="text-sm font-medium">₱{Number(viewingEmployee.totalEarnings || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {viewingEmployee.specializations && viewingEmployee.specializations.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingEmployee.specializations.map((spec, i) => (
                      <span key={i} className="px-3 py-1 bg-[#00BAF1]/10 text-[#00BAF1] text-xs font-semibold rounded-full border border-[#00BAF1]/20">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-10">
                <Button
                  onClick={() => {
                    handleEditEmployee(viewingEmployee);
                    setViewingEmployee(null);
                  }}
                  className="bg-[#00BAF1] hover:bg-[#00A7D9] text-white h-11 rounded-xl shadow-lg shadow-[#00BAF1]/20"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    removeEmployee(viewingEmployee.id, viewingEmployee.name);
                    setViewingEmployee(null);
                  }}
                  className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 h-11 rounded-xl"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Employee
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
