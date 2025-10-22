"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/form_button";
import { Star } from "lucide-react";

interface Employee {
  id: string;
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
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "e1",
      name: "Maria Garcia",
      email: "maria@agency.com",
      role: "Technician",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=60&auto=format&fit=crop&crop=faces",
      rating: 4.6,
    },
    {
      id: "e2",
      name: "Daniel Foster",
      email: "daniel@agency.com",
      role: "Electrician",
      avatar:
        "https://images.unsplash.com/photo-1545996124-6d3b4d0b4b60?w=400&q=60&auto=format&fit=crop&crop=faces",
      rating: 4.2,
    },
  ]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const addEmployee = () => {
    if (!name || !email) return;
    const id = `e${Date.now()}`;
    setEmployees((prev) => [
      ...prev,
      { id, name, email, avatar: null, rating: null },
    ]);
    setName("");
    setEmail("");
  };

  const removeEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

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
                {employees.map((emp) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
