"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Shield, Clock, CheckCircle, XCircle, Search, Eye, FileText } from "lucide-react";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "worker" | "client";
  submissionDate: string;
  documentsSubmitted: string[];
  priority: "high" | "medium" | "low";
  status: "pending_review" | "under_review" | "requires_action";
}

const mockPendingUsers: PendingUser[] = [
  {
    id: "1",
    name: "Alex Rodriguez",
    email: "alex.rodriguez@example.com",
    phone: "+1234567890",
    type: "worker",
    submissionDate: "2024-03-20",
    documentsSubmitted: ["ID Card", "Professional License", "Bank Statement"],
    priority: "high",
    status: "pending_review"
  },
  {
    id: "2",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "+1234567891",
    type: "client",
    submissionDate: "2024-03-19",
    documentsSubmitted: ["ID Card", "Proof of Address"],
    priority: "medium",
    status: "under_review"
  },
  {
    id: "3",
    name: "Marcus Johnson",
    email: "marcus.johnson@example.com",
    phone: "+1234567892",
    type: "worker",
    submissionDate: "2024-03-18",
    documentsSubmitted: ["ID Card"],
    priority: "low",
    status: "requires_action"
  }
];

export default function PendingVerificationPage() {
  const [pendingUsers] = useState<PendingUser[]>(mockPendingUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "client">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const filteredUsers = pendingUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || user.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || user.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const handleApprove = (userId: string) => {
    console.log("Approving user:", userId);
    // Add approval logic here
  };

  const handleReject = (userId: string) => {
    console.log("Rejecting user:", userId);
    // Add rejection logic here
  };

  const handleRequestMoreInfo = (userId: string) => {
    console.log("Requesting more info for user:", userId);
    // Add request more info logic here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Verification</h1>
          <p className="text-muted-foreground">
            Review and approve user verification requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingUsers.filter(u => u.priority === "high").length}
            </div>
            <p className="text-xs text-muted-foreground">Urgent reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workers</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingUsers.filter(u => u.type === "worker").length}
            </div>
            <p className="text-xs text-muted-foreground">Worker applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingUsers.filter(u => u.type === "client").length}
            </div>
            <p className="text-xs text-muted-foreground">Client applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find pending verifications by name, email, type, or priority
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pending users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "worker" | "client")}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="worker">Workers</option>
              <option value="client">Clients</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as "all" | "high" | "medium" | "low")}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary text-lg">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.type === "worker" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}>
                        {user.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.priority === "high" ? "bg-red-100 text-red-800" :
                        user.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {user.priority} priority
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === "pending_review" ? "bg-yellow-100 text-yellow-800" :
                        user.status === "under_review" ? "bg-blue-100 text-blue-800" :
                        "bg-orange-100 text-orange-800"
                      }`}>
                        {user.status.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Submitted Documents:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.documentsSubmitted.map((doc, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Submitted: {new Date(user.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Review Documents
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(user.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleReject(user.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRequestMoreInfo(user.id)}
                  >
                    Request More Info
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}