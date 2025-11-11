"use client";

import React, { useState, useEffect } from "react";
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
import { Star } from "lucide-react";
import { toast } from "sonner";
import { JOB_CATEGORIES } from "@/lib/job-categories";

interface Employee {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  avatar?: string | null;
  rating?: number | null;
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
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
    return () => controller.abort();
  }, []);

  const addEmployee = async () => {
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }

    if (!role) {
      toast.error("Role/specialization is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("role", role);

      const res = await fetch(`${API_BASE}/api/agency/employees`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        toast.success("Employee added successfully");
        setName("");
        setEmail("");
        setRole("");
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Employees</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-4">
            {/* Top performer card */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performer</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const rated = employees.filter(
                    (e) => typeof e.rating === "number"
                  );
                  if (rated.length === 0) {
                    return (
                      <div className="text-sm text-gray-500">
                        No ratings yet
                      </div>
                    );
                  }
                  const top = rated.reduce((a, b) =>
                    a.rating! >= b.rating! ? a : b
                  );
                  return (
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          top.avatar ||
                          `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                            top.name
                          )}`
                        }
                        alt={top.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium">{top.name}</div>
                        <div className="text-sm text-gray-500">{top.role}</div>
                        <div className="mt-2">
                          <Rating value={top.rating} />
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Button className="bg-blue-600 text-white">
                          View profile
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role/Specialization *" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="pt-2">
                    <Button onClick={addEmployee}>Add</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Active Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.length === 0 ? (
                  <div className="text-sm text-gray-500">No employees yet</div>
                ) : (
                  employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            emp.avatar ||
                            `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(
                              emp.name
                            )}`
                          }
                          alt={emp.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-sm text-gray-500">
                            {emp.role} • {emp.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Rating value={emp.rating} />
                        <Button
                          onClick={() => removeEmployee(emp.id)}
                          className="bg-red-600"
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
      </div>
    </div>
  );
}
