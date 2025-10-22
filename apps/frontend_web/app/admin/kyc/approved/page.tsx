"use client";

import { useState, useEffect } from "react";
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
  userType: "worker" | "client" | "agency";
  submissionDate: string;
  approvalDate: string;
  reviewedBy: string;
  documentsCount: number;
  processingDays: number;
}

export default function ApprovedKYCPage() {
  const [approvedKYC, setApprovedKYC] = useState<ApprovedKYC[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "client">(
    "all"
  );
  const [reviewerFilter, setReviewerFilter] = useState<string>("all");
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch approved KYC logs on component mount
  useEffect(() => {
    fetchApprovedKYC();
  }, []);

  const fetchApprovedKYC = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/adminpanel/kyc/logs?action=APPROVED&limit=500",
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch approved KYC records");
      }

      const data = await response.json();
      console.log("✅ Fetched approved KYC response:", data);

      // Handle different response formats
      let logs = data;

      // If response has an error property
      if (data.error) {
        throw new Error(data.error);
      }

      // If response is not an array, it might be wrapped
      if (!Array.isArray(logs)) {
        // Try to extract array from common wrapper properties
        if (data.data && Array.isArray(data.data)) {
          logs = data.data;
        } else if (data.logs && Array.isArray(data.logs)) {
          logs = data.logs;
        } else if (data.results && Array.isArray(data.results)) {
          logs = data.results;
        } else {
          console.warn("⚠️ Response is not an array:", data);
          logs = [];
        }
      }

      console.log("✅ Extracted logs array:", logs);

      // Transform backend data to match frontend interface
      const transformedData: ApprovedKYC[] = logs.map((log: any) => {
        const submissionDate = new Date(log.createdAt);
        const approvalDate = new Date(log.reviewedAt);
        const processingDays = Math.floor(
          (approvalDate.getTime() - submissionDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        // Map backend kycType to frontend userType
        let userType: "worker" | "client" | "agency" = "worker";
        if (log.kycType === "AGENCY") userType = "agency";
        // If backend provides profileType we can map client/worker accordingly
        else if (log.profileType && log.profileType.toLowerCase() === "client")
          userType = "client";

        return {
          id: log.kycLogID?.toString() || "0",
          userId: log.userAccountID?.toString() || "0",
          userName: log.userEmail?.split("@")[0] || "Unknown", // Extract name from email
          userEmail: log.userEmail || "unknown@email.com",
          userType: userType,
          submissionDate: log.createdAt || new Date().toISOString(),
          approvalDate: log.reviewedAt || new Date().toISOString(),
          reviewedBy: log.reviewedBy || "System",
          documentsCount: 0, // Not available in logs, could be enhanced
          processingDays: isNaN(processingDays) ? 0 : processingDays,
        };
      });

      setApprovedKYC(transformedData);
      console.log("✅ Transformed approved KYC data:", transformedData);
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
                  {approvedKYC.length > 0
                    ? Math.round(
                        approvedKYC.reduce(
                          (acc, r) => acc + r.processingDays,
                          0
                        ) / approvedKYC.length
                      )
                    : 0}{" "}
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
                          {record.documentsCount || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Processing Time
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {record.processingDays || 0} days
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
