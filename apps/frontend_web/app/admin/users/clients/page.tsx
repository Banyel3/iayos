"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Search, Download, Calendar, DollarSign } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  location: string;
  status: "active" | "inactive" | "suspended";
  verificationStatus: "verified" | "pending" | "rejected";
  joinDate: string;
  totalJobsPosted: number;
  totalSpent: number;
  averageRating: number;
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+1234567890",
    company: "Wilson Enterprises",
    location: "New York, NY",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-15",
    totalJobsPosted: 15,
    totalSpent: 2450.00,
    averageRating: 4.7
  },
  {
    id: "2",
    name: "David Chen",
    email: "david.chen@example.com",
    phone: "+1234567891",
    location: "San Francisco, CA",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-02-20",
    totalJobsPosted: 8,
    totalSpent: 1200.00,
    averageRating: 4.5
  },
];

export default function ClientsPage() {
  const [clients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients Management</h1>
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
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${clients.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Platform revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
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
            Find clients by name, email, company, or status
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
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive" | "suspended")}
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

      {/* Clients Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary text-lg">
                      {client.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {client.company && (
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  client.status === "active" ? "bg-green-100 text-green-800" : 
                  client.status === "inactive" ? "bg-gray-100 text-gray-800" : 
                  "bg-red-100 text-red-800"
                }`}>
                  {client.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm">{client.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm">{client.phone}</p>
              </div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{client.location}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Jobs Posted</p>
                  <p className="text-lg font-semibold">{client.totalJobsPosted}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-semibold">${client.totalSpent.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-sm font-medium">{client.averageRating}/5.0</p>
                </div>
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}