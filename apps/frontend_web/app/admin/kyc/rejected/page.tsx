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
import { Sidebar, useMainContentClass } from "../../components";
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
  const mainClass = useMainContentClass("p-6 min-h-screen");
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
        `${API_BASE}/api/adminpanel/kyc/audit-logs?action=Rejected&limit=500`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch rejected KYC records");
      }

      const data = await response.json();

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
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          {/* Header */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Rejected KYC Records</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  KYC submissions that were rejected and require resubmission
                </p>
              </div>
              <Button className="bg-[#00BAF1] hover:bg-[#0098C7] text-white self-start sm:self-auto text-sm">
                <FileText className="mr-2 h-4 w-4" />
                Export Records
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <XCircle className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                  <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Rejected</p>
                <p className="text-xl font-bold text-gray-900">{rejectedKYC.length}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Can Resubmit</p>
                <p className="text-xl font-bold text-gray-900">
                  {
                    rejectedKYC.filter(
                      (r) => r.resubmissionAllowed && !r.hasResubmitted,
                    ).length
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <FileText className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Resubmitted</p>
                <p className="text-xl font-bold text-gray-900">
                  {rejectedKYC.filter((r) => r.hasResubmitted).length}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Final Rejection</p>
                <p className="text-xl font-bold text-gray-900">
                  {rejectedKYC.filter((r) => !r.resubmissionAllowed).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#00BAF1] transition-colors" />
              <Input
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | "worker" | "client")
              }
              className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
            >
              <option value="all">All Types</option>
              <option value="worker">Workers</option>
              <option value="client">Clients</option>
            </select>
            <select
              value={resubmissionFilter}
              onChange={(e) =>
                setResubmissionFilter(
                  e.target.value as "all" | "allowed" | "not_allowed" | "resubmitted"
                )
              }
              className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="allowed">Can Resubmit</option>
              <option value="not_allowed">Cannot Resubmit</option>
              <option value="resubmitted">Already Resubmitted</option>
            </select>
          </div>

          {/* Rejected Records List */}
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className="hover:shadow-md transition-shadow border-red-200"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4">
                    {/* Top Row: User Info + Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold truncate">
                            {record.userName}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {record.userEmail}
                          </p>
                          <div className="flex items-center flex-wrap gap-1.5 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${record.userType === "worker"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                                }`}
                            >
                              {record.userType}
                            </span>
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              Rejected
                            </span>
                            {record.hasResubmitted && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                Resubmitted
                              </span>
                            )}
                            {!record.resubmissionAllowed && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                                Final Rejection
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons - visible on md+ inline, on mobile below */}
                      <div className="hidden md:flex flex-col space-y-2 flex-shrink-0">
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

                    {/* Rejection Reason */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-red-800 mb-1">
                        Rejection Reason:
                      </h4>
                      <p className="text-xs sm:text-sm text-red-700">
                        {record.rejectionReason}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Documents</p>
                        <p className="font-medium">
                          {record.documentsCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Submitted</p>
                        <p className="font-medium text-xs sm:text-sm">
                          {new Date(
                            record.submissionDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Rejected</p>
                        <p className="font-medium text-xs sm:text-sm">
                          {new Date(
                            record.rejectionDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Reviewed By</p>
                        <p className="font-medium text-xs sm:text-sm">{record.reviewedBy}</p>
                      </div>
                    </div>

                    {/* Mobile-only action buttons */}
                    <div className="flex md:hidden gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewDetails(record)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
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
