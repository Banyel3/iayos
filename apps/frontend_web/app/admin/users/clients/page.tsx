"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Search,
  Download,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Sidebar } from "../../components";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: "personal" | "business";
  location: string;
  status: "active" | "inactive" | "suspended";
  verificationStatus: "verified" | "pending" | "rejected";
  joinDate: string;
  totalJobsPosted: number;
  totalSpent: number;
  activeJobs: number;
  preferredCategories: string[];
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+1234567890",
    accountType: "personal",
    location: "New York, NY",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-15",
    totalJobsPosted: 15,
    totalSpent: 2450.0,
    activeJobs: 3,
    preferredCategories: ["Home Cleaning", "Plumbing", "Electrical"],
  },
  {
    id: "2",
    name: "David Chen",
    email: "david.chen@example.com",
    phone: "+1234567891",
    accountType: "business",
    location: "San Francisco, CA",
    status: "inactive",
    verificationStatus: "verified",
    joinDate: "2024-02-20",
    totalJobsPosted: 8,
    totalSpent: 1200.0,
    activeJobs: 0,
    preferredCategories: ["IT Support", "Electrical"],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@techstartup.com",
    phone: "+1234567892",
    accountType: "business",
    location: "Austin, TX",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-03-10",
    totalJobsPosted: 23,
    totalSpent: 4890.0,
    activeJobs: 5,
    preferredCategories: ["Painting", "Carpentry", "Home Cleaning"],
  },
  {
    id: "4",
    name: "Michael Thompson",
    email: "m.thompson@gmail.com",
    phone: "+1234567893",
    accountType: "personal",
    location: "Seattle, WA",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-04-05",
    totalJobsPosted: 12,
    totalSpent: 1850.0,
    activeJobs: 2,
    preferredCategories: ["Plumbing", "HVAC"],
  },
  {
    id: "5",
    name: "Jennifer Lee",
    email: "jennifer.lee@realestate.com",
    phone: "+1234567894",
    accountType: "business",
    location: "Miami, FL",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-28",
    totalJobsPosted: 42,
    totalSpent: 8720.0,
    activeJobs: 8,
    preferredCategories: [
      "Home Cleaning",
      "Landscaping",
      "Painting",
      "Plumbing",
    ],
  },
  {
    id: "6",
    name: "Robert Martinez",
    email: "robert.m@yahoo.com",
    phone: "+1234567895",
    accountType: "personal",
    location: "Boston, MA",
    status: "suspended",
    verificationStatus: "rejected",
    joinDate: "2024-05-12",
    totalJobsPosted: 3,
    totalSpent: 180.0,
    activeJobs: 0,
    preferredCategories: ["Electrical"],
  },
  {
    id: "7",
    name: "Amanda Foster",
    email: "amanda@designstudio.com",
    phone: "+1234567896",
    accountType: "business",
    location: "Portland, OR",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-02-14",
    totalJobsPosted: 18,
    totalSpent: 3240.0,
    activeJobs: 4,
    preferredCategories: ["Painting", "Carpentry", "Interior Design"],
  },
  {
    id: "8",
    name: "James Anderson",
    email: "j.anderson@construction.com",
    phone: "+1234567897",
    accountType: "business",
    location: "Denver, CO",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-05",
    totalJobsPosted: 56,
    totalSpent: 15670.0,
    activeJobs: 11,
    preferredCategories: [
      "Carpentry",
      "Plumbing",
      "Electrical",
      "HVAC",
      "Roofing",
    ],
  },
];

export default function ClientsPage() {
  const [clients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "suspended"
  >("all");

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Clients Management
              </h1>
              <p className="text-muted-foreground">
                Manage all service requesters in the platform
              </p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Clients
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clients
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.length}</div>
                <p className="text-xs text-muted-foreground">
                  +15% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Clients
                </CardTitle>
                <Building2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.filter((c) => c.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {clients
                    .reduce((acc, c) => acc + c.totalSpent, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform revenue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Jobs
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.reduce((acc, c) => acc + c.totalJobsPosted, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Jobs posted</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find clients by name, email, location, or status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
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
                      e.target.value as
                        | "all"
                        | "active"
                        | "inactive"
                        | "suspended"
                    )
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Clients List</CardTitle>
              <CardDescription>Overview of all clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-md">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Email
                      </th>

                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Location
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Jobs Posted
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Active Jobs
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Total Spent
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, index) => (
                      <tr key={client.id} className="border-t">
                        <td className="px-4 py-2 text-sm">{index + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium">
                          {client.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {client.email}
                        </td>

                        <td className="px-4 py-2 text-sm text-gray-600">
                          {client.location}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {client.totalJobsPosted}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {client.activeJobs > 0 ? (
                            <span className="text-blue-600 font-medium">
                              {client.activeJobs}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-green-600">
                          ${client.totalSpent.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              client.status === "active"
                                ? "bg-green-100 text-green-800"
                                : client.status === "inactive"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {client.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log("View", client.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log("Edit", client.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => console.log("Delete", client.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
