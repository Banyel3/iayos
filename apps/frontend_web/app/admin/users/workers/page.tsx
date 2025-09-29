"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { UserCheck, Star, MapPin, Search, Download } from "lucide-react";

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  location: string;
  status: "active" | "inactive" | "suspended";
  verificationStatus: "verified" | "pending" | "rejected";
  joinDate: string;
  completedJobs: number;
}

const mockWorkers: Worker[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    skills: ["Plumbing", "Electrical", "Carpentry"],
    rating: 4.8,
    reviewCount: 127,
    location: "New York, NY",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-15",
    completedJobs: 89
  },
  {
    id: "2",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "+1234567891",
    skills: ["Painting", "Cleaning"],
    rating: 4.6,
    reviewCount: 73,
    location: "Los Angeles, CA",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-02-20",
    completedJobs: 56
  },
];

export default function WorkersPage() {
  const [workers] = useState<Worker[]>(mockWorkers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || worker.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workers Management</h1>
          <p className="text-muted-foreground">
            Manage all service providers in the platform
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Workers
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.length}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.filter(w => w.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to work</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(workers.reduce((acc, w) => acc + w.rating, 0) / workers.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Platform average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.reduce((acc, w) => acc + w.completedJobs, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Completed jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find workers by name, email, skills, or status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workers..."
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

      {/* Workers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkers.map((worker) => (
          <Card key={worker.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary text-lg">
                      {worker.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{worker.name}</CardTitle>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span>{worker.rating}</span>
                      <span>({worker.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  worker.status === "active" ? "bg-green-100 text-green-800" : 
                  worker.status === "inactive" ? "bg-gray-100 text-gray-800" : 
                  "bg-red-100 text-red-800"
                }`}>
                  {worker.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm">{worker.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm">{worker.phone}</p>
              </div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{worker.location}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {worker.skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">
                  {worker.completedJobs} jobs completed
                </span>
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