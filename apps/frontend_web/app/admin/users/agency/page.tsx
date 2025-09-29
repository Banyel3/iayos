"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Star, Search, Download, Eye, Users } from "lucide-react";

interface Agency {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website?: string;
  description: string;
  status: "active" | "inactive" | "suspended";
  verificationStatus: "verified" | "pending" | "rejected";
  joinDate: string;
  totalWorkers: number;
  totalJobs: number;
  avgRating: number;
  reviewCount: number;
}

const mockAgencies: Agency[] = [
  {
    id: "agency_001",
    name: "ProServices Agency",
    email: "info@proservices.com",
    phone: "+1-555-0123",
    address: "123 Business Ave",
    city: "New York",
    state: "NY",
    country: "USA",
    website: "www.proservices.com",
    description: "Full-service agency providing home maintenance and repair services",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-15",
    totalWorkers: 45,
    totalJobs: 342,
    avgRating: 4.7,
    reviewCount: 128
  },
  {
    id: "agency_002",
    name: "HomeHelp Solutions",
    email: "contact@homehelp.com",
    phone: "+1-555-0456",
    address: "456 Service St",
    city: "Los Angeles",
    state: "CA",
    country: "USA",
    description: "Specialized in residential cleaning and maintenance services",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-02-20",
    totalWorkers: 28,
    totalJobs: 189,
    avgRating: 4.5,
    reviewCount: 76
  },
  {
    id: "agency_003",
    name: "CityWide Services",
    email: "hello@citywide.com",
    phone: "+1-555-0789",
    address: "789 Urban Blvd",
    city: "Chicago",
    state: "IL",
    country: "USA",
    description: "Urban service provider for commercial and residential clients",
    status: "active",
    verificationStatus: "pending",
    joinDate: "2024-03-10",
    totalWorkers: 12,
    totalJobs: 45,
    avgRating: 4.2,
    reviewCount: 18
  }
];

export default function AgencyPage() {
  const [agencies] = useState<Agency[]>(mockAgencies);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "pending" | "rejected">("all");

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || agency.status === statusFilter;
    const matchesVerification = verificationFilter === "all" || agency.verificationStatus === verificationFilter;
    
    return matchesSearch && matchesStatus && matchesVerification;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency Management</h1>
          <p className="text-muted-foreground">
            Manage service agencies and their operations
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Agencies
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencies.length}</div>
            <p className="text-xs text-muted-foreground">Registered agencies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agencies</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agencies.filter(a => a.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently operating</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agencies.reduce((acc, a) => acc + a.totalWorkers, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all agencies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(agencies.reduce((acc, a) => acc + a.avgRating, 0) / agencies.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Agency average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find agencies by name, email, location, or status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agencies..."
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
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as "all" | "verified" | "pending" | "rejected")}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Agencies List */}
      <div className="space-y-4">
        {filteredAgencies.map((agency) => (
          <Card key={agency.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-xl font-semibold">{agency.name}</h3>
                      <p className="text-sm text-muted-foreground">{agency.email}</p>
                      <p className="text-sm text-muted-foreground">{agency.phone}</p>
                      {agency.website && (
                        <p className="text-sm text-blue-600">{agency.website}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{agency.address}, {agency.city}, {agency.state}, {agency.country}</span>
                    </div>

                    <p className="text-sm text-muted-foreground max-w-2xl">
                      {agency.description}
                    </p>

                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agency.status === "active" ? "bg-green-100 text-green-800" : 
                        agency.status === "inactive" ? "bg-gray-100 text-gray-800" : 
                        "bg-red-100 text-red-800"
                      }`}>
                        {agency.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agency.verificationStatus === "verified" ? "bg-green-100 text-green-800" :
                        agency.verificationStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {agency.verificationStatus}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-sm">{agency.avgRating} ({agency.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{agency.totalWorkers}</p>
                    <p className="text-sm text-muted-foreground">Workers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{agency.totalJobs}</p>
                    <p className="text-sm text-muted-foreground">Jobs</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Workers
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgencies.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agencies found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || verificationFilter !== "all" 
                ? "Try adjusting your search criteria"
                : "No agencies have registered yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}