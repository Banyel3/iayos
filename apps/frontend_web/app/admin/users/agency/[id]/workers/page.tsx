"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, UserCheck, Plus, UserX, Download, Eye, Star } from "lucide-react";
import { useAgencyEmployees, exportEmployeesToCSV } from "@/lib/hooks/useAdminAgency";

interface AgencyEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  skills: string[];
  location: string;
  status: "active" | "inactive" | "on-leave";
  joinDate: string;
  completedJobs: number;
  agencyId: string;
}

// TODO: Replace mock data with useAgencyEmployees(agencyId) hook
// Hook is created at lib/hooks/useAdminAgency.ts
// This page needs full refactor to use real API data
//
// Mock agency employees data - internal staff, not platform freelancers
const mockEmployees: AgencyEmployee[] = [
  {
    id: "emp_001",
    name: "John Smith",
    email: "john.smith@proservices.com",
    phone: "+1-555-1001",
    position: "Senior Technician",
    department: "Plumbing & HVAC",
    skills: ["Plumbing", "HVAC", "Water Heaters"],
    location: "New York, NY",
    status: "active",
    joinDate: "2024-01-20",
    completedJobs: 52,
    agencyId: "agency_001",
  },
  {
    id: "emp_002",
    name: "Maria Garcia",
    email: "maria.garcia@proservices.com",
    phone: "+1-555-1002",
    position: "Lead Electrician",
    department: "Electrical & Carpentry",
    skills: ["Electrical Wiring", "Carpentry", "Home Automation"],
    location: "New York, NY",
    status: "active",
    joinDate: "2024-02-15",
    completedJobs: 43,
    agencyId: "agency_001",
  },
  {
    id: "emp_003",
    name: "David Lee",
    email: "david.lee@proservices.com",
    phone: "+1-555-1003",
    position: "Appliance Specialist",
    department: "Appliance Repair",
    skills: ["Refrigerators", "Washers", "Dryers", "Dishwashers"],
    location: "New York, NY",
    status: "active",
    joinDate: "2024-03-10",
    completedJobs: 31,
    agencyId: "agency_001",
  },
  {
    id: "emp_004",
    name: "Sarah Johnson",
    email: "sarah.j@homehelp.com",
    phone: "+1-555-2001",
    position: "Cleaning Supervisor",
    department: "Residential Services",
    skills: ["Deep Cleaning", "Painting", "Home Maintenance"],
    location: "Los Angeles, CA",
    status: "active",
    joinDate: "2024-02-25",
    completedJobs: 28,
    agencyId: "agency_002",
  },
  {
    id: "emp_005",
    name: "Mike Chen",
    email: "mike.chen@citywide.com",
    phone: "+1-555-3001",
    position: "Field Technician",
    department: "General Services",
    skills: ["Plumbing", "Electrical", "Minor Repairs"],
    location: "Chicago, IL",
    status: "on-leave",
    joinDate: "2024-03-15",
    completedJobs: 12,
    agencyId: "agency_003",
  },
];

const mockAgencies = [
  { id: "agency_001", name: "ProServices Agency" },
  { id: "agency_002", name: "HomeHelp Solutions" },
  { id: "agency_003", name: "CityWide Services" },
  { id: "agency_004", name: "Expert Fixers" },
  { id: "agency_005", name: "Premium Care Services" },
];

export default function AgencyWorkersPage() {
  const { id } = useParams();
  const router = useRouter();
  const [agency, setAgency] = useState<{ id: string; name: string } | null>(
    null
  );
  const [employees, setEmployees] = useState<AgencyEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "on-leave"
  >("all");

  useEffect(() => {
    // Mock fetch agency and employees
    const foundAgency = mockAgencies.find((a) => a.id === id);
    if (foundAgency) {
      setAgency(foundAgency);
      // Filter employees by agency ID
      const agencyEmployees = mockEmployees.filter((e) => e.agencyId === id);
      setEmployees(agencyEmployees);
    }
  }, [id]);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.skills.some((skill: string) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!agency) {
    return <div className="p-6">Loading agency workers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/users/agency/${id}`)}
            className="mb-3"
          >
            ← Back to Agency
          </Button>
          <h1 className="text-3xl font-bold">{agency.name} - Workers</h1>
          <p className="text-muted-foreground">
            Manage all workers under this agency
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">Internal staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Employees
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter((e) => e.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.reduce((acc, e) => acc + e.completedJobs, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workers by name, email, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "active" | "inactive" | "on-leave"
                )
              }
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      <div className="space-y-4">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <Card key={employee.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-white font-semibold text-xl">
                      {employee.name.charAt(0)}
                    </div>

                    {/* Employee Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {employee.name}
                          </h3>
                          <p className="text-sm text-blue-600 font-medium">
                            {employee.position}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee.email}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            employee.status === "active"
                              ? "bg-green-100 text-green-800"
                              : employee.status === "inactive"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {employee.status === "on-leave"
                            ? "On Leave"
                            : employee.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Department
                          </p>
                          <p className="font-semibold text-sm">
                            {employee.department}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Completed Jobs
                          </p>
                          <p className="font-semibold">
                            {employee.completedJobs}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Location
                          </p>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{employee.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Skills & Expertise
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {employee.skills.map((skill: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            /* Handle employee removal */
                          }}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Remove from Agency
                        </Button>
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
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "This agency doesn't have any employees yet"}
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add First Employee
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
