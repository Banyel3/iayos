"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
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
  Eye,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Sidebar } from "../../components";
import { useToast } from "@/components/ui/toast";
import KYCDetailModal from "@/components/admin/KYCDetailModal";

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
  kycType: "USER" | "AGENCY";
}

export default function RejectedKYCPage() {
  const [rejectedKYC, setRejectedKYC] = useState<RejectedKYC[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "client">(
    "all",
  );
  const [resubmissionFilter, setResubmissionFilter] = useState<
    "all" | "allowed" | "not_allowed" | "resubmitted"
  >("all");
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState<{ id: number; type: "USER" | "AGENCY" } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch rejected KYC logs on component mount
  useEffect(() => {
    fetchRejectedKYC();
  }, []);

  const fetchRejectedKYC = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/kyc/logs?action=Rejected&limit=500`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch rejected KYC records");
      }

      const data = await response.json();
      console.log("✅ Fetched rejected KYC response:", data);

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
      const transformedData: RejectedKYC[] = logs.map((log: any) => {
        // Extract kycType from log data (check if it's agency or user KYC)
        const kycType = log.agencyKycID ? "AGENCY" : "USER";
        const kycId = log.agencyKycID || log.kycID || log.kycLogID;
        
        return {
          id: kycId?.toString() || "0",
          userId: log.userAccountID?.toString() || "0",
          userName: log.userEmail?.split("@")[0] || "Unknown", // Extract name from email
          userEmail: log.userEmail || "unknown@email.com",
          userType: "worker" as "worker" | "client", // Default to worker, can be enhanced
          submissionDate: log.createdAt || new Date().toISOString(),
          rejectionDate: log.reviewedAt || new Date().toISOString(),
          reviewedBy: log.reviewedBy || "System",
          documentsCount: 0, // Not available in logs
          rejectionReason: log.reason || "No reason provided",
          resubmissionAllowed: true, // Default to true
          hasResubmitted: false, // Would need additional logic to determine
          kycType: kycType,
        };
      });

      setRejectedKYC(transformedData);
      console.log("✅ Transformed rejected KYC data:", transformedData);
    } catch (error) {
      console.error("Error fetching rejected KYC:", error);
      showToast({
        type: "error",
        title: "Failed to Load Data",
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch rejected KYC records",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (record: RejectedKYC) => {
    const kycId = parseInt(record.id);
    if (isNaN(kycId)) {
      showToast({
        type: "error",
        title: "Invalid KYC ID",
        message: "Unable to view details for this record",
        duration: 3000,
      });
      return;
    }
    setSelectedKYC({ id: kycId, type: record.kycType });
    setIsModalOpen(true);
  };

  const handleDelete = async (record: RejectedKYC) => {
    if (!confirm(`Are you sure you want to permanently delete this KYC submission?\n\nUser: ${record.userEmail}\nRejected: ${new Date(record.rejectionDate).toLocaleDateString()}\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const kycId = parseInt(record.id);
      if (isNaN(kycId)) {
        throw new Error("Invalid KYC ID");
      }

      const response = await fetch(
        `${API_BASE}/api/adminpanel/kyc/${kycId}?kyc_type=${record.kycType}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete KYC record");
      }

      const data = await response.json();
      
      showToast({
        type: "success",
        title: "KYC Deleted",
        message: `Successfully deleted KYC submission (${data.filesDeleted} files removed)`,
        duration: 5000,
      });

      // Refresh the list
      fetchRejectedKYC();
    } catch (error) {
      console.error("Error deleting KYC:", error);
      showToast({
        type: "error",
        title: "Delete Failed",
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete KYC record",
        duration: 5000,
      });
    }
  };

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
    <div className="min-h-screen">
      <Sidebar />
      <main className="pl-72 p-6 min-h-screen">
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
              <FileText className="mr-2 h-4 w-4" />
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
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    rejectedKYC.filter(
                      (r) => r.resubmissionAllowed && !r.hasResubmitted,
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
                      | "resubmitted",
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
                            className={`px-2 py-1 rounded-full text-xs font-medium ${record.userType === "worker"
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
                              {record.documentsCount || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Submitted</p>
                            <p className="font-medium">
                              {new Date(
                                record.submissionDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rejected</p>
                            <p className="font-medium">
                              {new Date(
                                record.rejectionDate,
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(record)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(record)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
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

      {/* KYC Detail Modal */}
      {selectedKYC && (
        <KYCDetailModal
          kycId={selectedKYC.id}
          kycType={selectedKYC.type}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedKYC(null);
          }}
        />
      )}
    </div>
  );
}
