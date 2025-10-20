"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/form_button";

interface Employee {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "e1",
      name: "Maria Garcia",
      email: "maria@agency.com",
      role: "Technician",
    },
    {
      id: "e2",
      name: "Daniel Foster",
      email: "daniel@agency.com",
      role: "Electrician",
    },
  ]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const addEmployee = () => {
    if (!name || !email) return;
    const id = `e${Date.now()}`;
    setEmployees((prev) => [...prev, { id, name, email }]);
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
                    <div>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-sm text-gray-500">{emp.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
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
