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
  XCircle,
  FileText,
  Search,
  Download,
  Eye,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Sidebar } from "../../components";

interface RejectedKYC {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client";
  submissionDate: string;
  rejectionDate: string;
  reviewedBy: string;
  documentsCount: number;
  rejectionReason: string;
  resubmissionAllowed: boolean;
  hasResubmitted: boolean;
}

const mockRejectedKYC: RejectedKYC[] = [
  {
    id: "1",
    userId: "user_3",
    userName: "Mike Johnson",
    userEmail: "mike.johnson@example.com",
    userType: "worker",
    submissionDate: "2024-03-10",
    rejectionDate: "2024-03-12",
    reviewedBy: "Admin User",
    documentsCount: 2,
    rejectionReason:
      "ID document is not clear, please resubmit with higher quality image",
    resubmissionAllowed: true,
    hasResubmitted: false,
  },
  {
    id: "2",
    userId: "user_8",
    userName: "David Wilson",
    userEmail: "david.wilson@example.com",
    userType: "client",
    submissionDate: "2024-03-08",
    rejectionDate: "2024-03-11",
    reviewedBy: "Sarah Admin",
    documentsCount: 3,
    rejectionReason:
      "Proof of address document is expired. Please provide recent utility bill or bank statement",
    resubmissionAllowed: true,
    hasResubmitted: true,
  },
  {
    id: "3",
    userId: "user_9",
    userName: "Jennifer Davis",
    userEmail: "jennifer.davis@example.com",
    userType: "worker",
    submissionDate: "2024-03-05",
    rejectionDate: "2024-03-07",
    reviewedBy: "Admin User",
    documentsCount: 4,
    rejectionReason:
      "Professional license verification failed. Invalid license number",
    resubmissionAllowed: false,
    hasResubmitted: false,
  },
];

export default function RejectedKYCPage() {
  const [rejectedKYC] = useState<RejectedKYC[]>(mockRejectedKYC);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "client">(
    "all"
  );
  const [resubmissionFilter, setResubmissionFilter] = useState<
    "all" | "allowed" | "not_allowed" | "resubmitted"
  >("all");

  const filteredRecords = rejectedKYC.filter((record) => {
    const matchesSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || record.userType === typeFilter;
    const matchesResubmission =
      resubmissionFilter === "all" ||
      (resubmissionFilter === "allowed" &&
        record.resubmissionAllowed &&
        !record.hasResubmitted) ||
      (resubmissionFilter === "not_allowed" && !record.resubmissionAllowed) ||
      (resubmissionFilter === "resubmitted" && record.hasResubmitted);

    return matchesSearch && matchesType && matchesResubmission;
  });

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Rejected KYC Records
              </h1>
              <p className="text-muted-foreground">
                KYC submissions that were rejected and require resubmission
              </p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Rejected Records
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Rejected
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rejectedKYC.length}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Can Resubmit
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    rejectedKYC.filter(
                      (r) => r.resubmissionAllowed && !r.hasResubmitted
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting resubmission
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Resubmitted
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rejectedKYC.filter((r) => r.hasResubmitted).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Under new review
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Permanently Rejected
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rejectedKYC.filter((r) => !r.resubmissionAllowed).length}
                </div>
                <p className="text-xs text-muted-foreground">Cannot resubmit</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find rejected KYC records by user name, email, type, or
                resubmission status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rejected records..."
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
                  value={resubmissionFilter}
                  onChange={(e) =>
                    setResubmissionFilter(
                      e.target.value as
                        | "all"
                        | "allowed"
                        | "not_allowed"
                        | "resubmitted"
                    )
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="allowed">Can Resubmit</option>
                  <option value="not_allowed">Cannot Resubmit</option>
                  <option value="resubmitted">Already Resubmitted</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Rejected Records List */}
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className="hover:shadow-md transition-shadow border-red-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {record.userName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {record.userEmail}
                        </p>
                        <div className="flex items-center space-x-2 mt-1 mb-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.userType === "worker"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {record.userType}
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Rejected
                          </span>
                          {record.hasResubmitted && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              Resubmitted
                            </span>
                          )}
                          {!record.resubmissionAllowed && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              Final Rejection
                            </span>
                          )}
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <h4 className="text-sm font-medium text-red-800 mb-1">
                            Rejection Reason:
                          </h4>
                          <p className="text-sm text-red-700">
                            {record.rejectionReason}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Documents</p>
                            <p className="font-medium">
                              {record.documentsCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Submitted</p>
                            <p className="font-medium">
                              {new Date(
                                record.submissionDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rejected</p>
                            <p className="font-medium">
                              {new Date(
                                record.rejectionDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Reviewed By</p>
                            <p className="font-medium">{record.reviewedBy}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {record.resubmissionAllowed && !record.hasResubmitted && (
                        <Button
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Allow Resubmit
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No rejected records found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ||
                  typeFilter !== "all" ||
                  resubmissionFilter !== "all"
                    ? "Try adjusting your search criteria"
                    : "No KYC submissions have been rejected"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
