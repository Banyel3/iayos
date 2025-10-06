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
  CheckCircle,
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
} from "lucide-react";
import { Sidebar } from "../../components";
import { useToast } from "@/components/ui/toast";

interface ApprovedKYC {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client";
  submissionDate: string;
  approvalDate: string;
  reviewedBy: string;
  documentsCount: number;
  processingDays: number;
}

const mockApprovedKYC: ApprovedKYC[] = [
  {
    id: "1",
    userId: "user_2",
    userName: "Jane Smith",
    userEmail: "jane.smith@example.com",
    userType: "client",
    submissionDate: "2024-03-15",
    approvalDate: "2024-03-18",
    reviewedBy: "Admin User",
    documentsCount: 2,
    processingDays: 3,
  },
  {
    id: "2",
    userId: "user_6",
    userName: "Robert Brown",
    userEmail: "robert.brown@example.com",
    userType: "worker",
    submissionDate: "2024-03-10",
    approvalDate: "2024-03-14",
    reviewedBy: "Sarah Admin",
    documentsCount: 4,
    processingDays: 4,
  },
  {
    id: "3",
    userId: "user_7",
    userName: "Lisa Chen",
    userEmail: "lisa.chen@example.com",
    userType: "client",
    submissionDate: "2024-03-05",
    approvalDate: "2024-03-08",
    reviewedBy: "Admin User",
    documentsCount: 3,
    processingDays: 3,
  },
];

export default function ApprovedKYCPage() {
  const [approvedKYC] = useState<ApprovedKYC[]>(mockApprovedKYC);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "client">(
    "all"
  );
  const [reviewerFilter, setReviewerFilter] = useState<string>("all");
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Example fetch function for future API integration
  const fetchApprovedKYC = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      // const response = await fetch('...');
      // Handle response
      showToast({
        type: "success",
        title: "Data Loaded",
        message: "Approved KYC records loaded successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error fetching approved KYC:", error);
      showToast({
        type: "error",
        title: "Failed to Load Data",
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch approved KYC records",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = approvedKYC.filter((record) => {
    const matchesSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || record.userType === typeFilter;
    const matchesReviewer =
      reviewerFilter === "all" || record.reviewedBy === reviewerFilter;

    return matchesSearch && matchesType && matchesReviewer;
  });

  const uniqueReviewers = Array.from(
    new Set(approvedKYC.map((r) => r.reviewedBy))
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Approved KYC Records
              </h1>
              <p className="text-muted-foreground">
                Successfully verified and approved KYC submissions
              </p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Approved Records
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Approved
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedKYC.length}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully verified
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  This Month
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    approvedKYC.filter(
                      (r) =>
                        new Date(r.approvalDate).getMonth() ===
                        new Date().getMonth()
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Approved this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Processing Time
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    approvedKYC.reduce((acc, r) => acc + r.processingDays, 0) /
                      approvedKYC.length
                  )}{" "}
                  days
                </div>
                <p className="text-xs text-muted-foreground">
                  Average approval time
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Workers Approved
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {approvedKYC.filter((r) => r.userType === "worker").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Service providers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find approved KYC records by user name, email, type, or reviewer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search approved records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as "all" | "worker" | "client")
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="worker">Workers</option>
                  <option value="client">Clients</option>
                </select>
                <select
                  value={reviewerFilter}
                  onChange={(e) => setReviewerFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Reviewers</option>
                  {uniqueReviewers.map((reviewer) => (
                    <option key={reviewer} value={reviewer}>
                      {reviewer}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Approved Records List */}
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {record.userName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {record.userEmail}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.userType === "worker"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {record.userType}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Approved
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Documents
                        </p>
                        <p className="text-lg font-semibold">
                          {record.documentsCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Processing Time
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {record.processingDays} days
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Approved Date
                        </p>
                        <p className="text-sm">
                          {new Date(record.approvalDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Reviewed By
                        </p>
                        <p className="text-sm font-medium">
                          {record.reviewedBy}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No approved records found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ||
                  typeFilter !== "all" ||
                  reviewerFilter !== "all"
                    ? "Try adjusting your search criteria"
                    : "No KYC submissions have been approved yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
