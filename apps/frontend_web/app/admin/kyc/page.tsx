"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Shield, FileText, Clock, CheckCircle, XCircle, Search, Download } from "lucide-react";

interface KYCRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client";
  submissionDate: string;
  status: "pending" | "approved" | "rejected" | "under_review";
  documentsSubmitted: {
    name: string;
    type: string;
    status: "pending" | "approved" | "rejected";
  }[];
  reviewedBy?: string;
  reviewDate?: string;
  comments?: string;
}

const mockKYCRecords: KYCRecord[] = [
  {
    id: "1",
    userId: "user_1",
    userName: "John Doe",
    userEmail: "john.doe@example.com",
    userType: "worker",
    submissionDate: "2024-03-20",
    status: "pending",
    documentsSubmitted: [
      { name: "ID_Card.pdf", type: "identity", status: "pending" },
      { name: "Professional_License.pdf", type: "license", status: "pending" },
      { name: "Bank_Statement.pdf", type: "financial", status: "pending" }
    ]
  },
  {
    id: "2",
    userId: "user_2",
    userName: "Jane Smith",
    userEmail: "jane.smith@example.com",
    userType: "client",
    submissionDate: "2024-03-15",
    status: "approved",
    documentsSubmitted: [
      { name: "Passport.pdf", type: "identity", status: "approved" },
      { name: "Utility_Bill.pdf", type: "address", status: "approved" }
    ],
    reviewedBy: "Admin User",
    reviewDate: "2024-03-18",
    comments: "All documents verified successfully"
  },
  {
    id: "3",
    userId: "user_3",
    userName: "Mike Johnson",
    userEmail: "mike.johnson@example.com",
    userType: "worker",
    submissionDate: "2024-03-10",
    status: "rejected",
    documentsSubmitted: [
      { name: "ID_Card.pdf", type: "identity", status: "rejected" },
      { name: "License.pdf", type: "license", status: "approved" }
    ],
    reviewedBy: "Admin User",
    reviewDate: "2024-03-12",
    comments: "ID document is not clear, please resubmit"
  }
];

export default function KYCManagementPage() {
  const [kycRecords] = useState<KYCRecord[]>(mockKYCRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "under_review">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "client">("all");

  const filteredRecords = kycRecords.filter(record => {
    const matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesType = typeFilter === "all" || record.userType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "under_review": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KYC Management</h1>
          <p className="text-muted-foreground">
            Manage Know Your Customer verification processes
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export KYC Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kycRecords.length}</div>
            <p className="text-xs text-muted-foreground">All time submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kycRecords.filter(r => r.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kycRecords.filter(r => r.status === "approved").length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kycRecords.filter(r => r.status === "rejected").length}
            </div>
            <p className="text-xs text-muted-foreground">Need resubmission</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find KYC records by user name, email, status, or type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search KYC records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "approved" | "rejected" | "under_review")}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="under_review">Under Review</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "worker" | "client")}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="worker">Workers</option>
              <option value="client">Clients</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* KYC Records List */}
      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary text-lg">
                      {record.userName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{record.userName}</h3>
                    <p className="text-sm text-muted-foreground">{record.userEmail}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.userType === "worker" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}>
                        {record.userType}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Submitted: {new Date(record.submissionDate).toLocaleDateString()}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Documents Submitted:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {record.documentsSubmitted.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {record.reviewedBy && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm"><strong>Reviewed by:</strong> {record.reviewedBy}</p>
                      <p className="text-sm"><strong>Review date:</strong> {new Date(record.reviewDate!).toLocaleDateString()}</p>
                      {record.comments && (
                        <p className="text-sm mt-1"><strong>Comments:</strong> {record.comments}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                {record.status === "pending" && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}