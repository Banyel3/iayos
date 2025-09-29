"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, Building2, Search, Download } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  type: "worker" | "client";
  status: "active" | "inactive" | "pending";
  joinDate: string;
  verificationStatus: "verified" | "pending" | "rejected";
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    type: "worker",
    status: "active",
    joinDate: "2024-01-15",
    verificationStatus: "verified"
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    type: "client",
    status: "active",
    joinDate: "2024-02-20",
    verificationStatus: "verified"
  },
  // Add more mock data as needed
];

export default function UsersPage() {
  const [users] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "worker" | "client">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "pending">("all");

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || user.type === filterType;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">
            Manage all users, workers, and clients in the system
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Users
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              +10% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.type === "worker").length}
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.type === "client").length}
            </div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find and filter users by name, email, type, or status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "all" | "worker" | "client")}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="worker">Workers</option>
              <option value="client">Clients</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive" | "pending")}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.type === "worker" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                  }`}>
                    {user.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === "active" ? "bg-green-100 text-green-800" : 
                    user.status === "inactive" ? "bg-gray-100 text-gray-800" : 
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {user.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.verificationStatus === "verified" ? "bg-green-100 text-green-800" :
                    user.verificationStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {user.verificationStatus}
                  </span>
                  <div className="text-sm text-muted-foreground">
                    {new Date(user.joinDate).toLocaleDateString()}
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}