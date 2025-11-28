"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface KYCRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client" | "agency";
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

import { Sidebar } from "../components";

// Data transformation helper
function combineKYCData(data: any): KYCRecord[] {
  // Combine individual KYC records
  const individualKYC = (data.kyc || []).map((kyc: any) => {
    const user = (data.users || []).find(
      (u: any) => u.accountID === kyc.accountFK_id
    );
    const files = (data.kyc_files || []).filter(
      (f: any) => f.kycID_id === kyc.kycID
    );

    return {
      id: kyc.kycID.toString(),
      userId: user?.accountID?.toString() || "",
      userName:
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        "Unknown User",
      userEmail: user?.email || "",
      userType: user?.profileType === "WORKER" ? "worker" : "client",
      submissionDate: kyc.createdAt,
      status: kyc.kycStatus.toLowerCase().replace("_", "_") as any,
      documentsSubmitted: files.map((f: any) => ({
        name: f.fileName,
        type: f.idType,
        status: kyc.kycStatus.toLowerCase() as any,
      })),
      reviewedBy: kyc.reviewedBy_id ? "Admin" : undefined,
      reviewDate: kyc.reviewedAt || undefined,
      comments: kyc.notes || undefined,
    };
  });

  // Combine agency KYC records
  const agencyKYC = (data.agency_kyc || []).map((kyc: any) => {
    const agency = (data.agencies || []).find(
      (a: any) => a.accountID === kyc.accountFK_id
    );
    const files = (data.agency_kyc_files || []).filter(
      (f: any) => f.agencyKyc_id === kyc.agencyKycID
    );

    return {
      id: `agency_${kyc.agencyKycID}`,
      userId: agency?.accountID?.toString() || "",
      userName: agency?.businessName || "Unknown Agency",
      userEmail: agency?.email || "",
      userType: "agency" as const,
      submissionDate: kyc.createdAt,
      status: kyc.status.toLowerCase() as any,
      documentsSubmitted: files.map((f: any) => ({
        name: f.fileName,
        type: f.fileType,
        status: kyc.status.toLowerCase() as any,
      })),
      reviewedBy: kyc.reviewedBy_id ? "Admin" : undefined,
      reviewDate: kyc.reviewedAt || undefined,
      comments: kyc.notes || undefined,
    };
  });

  return [...individualKYC, ...agencyKYC];
}

export default function KYCManagementPage() {
  const router = useRouter();
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "under_review"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "worker" | "client" | "agency"
  >("all");

  // Fetch KYC data from backend
  const fetchKYCData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8000/api/adminpanel/kyc/all",
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch KYC data: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch KYC data");
      }

      // Transform backend data to match KYCRecord interface
      const transformedRecords = combineKYCData(data);
      setKycRecords(transformedRecords);
    } catch (err: any) {
      console.error("Error fetching KYC data:", err);
      setError(err.message || "An error occurred while fetching KYC data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchKYCData();
  }, []);

  const filteredRecords = kycRecords.filter((record) => {
    const matchesSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;
    const matchesType = typeFilter === "all" || record.userType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <Shield className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading KYC data...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Please wait while we fetch the data
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-screen">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    Error Loading KYC Data
                  </h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <Button
                    onClick={fetchKYCData}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-8 w-8" />
                    <h1 className="text-4xl font-bold">KYC Management</h1>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Manage Know Your Customer verification processes
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/admin/kyc/audit")}
                    className="bg-white/20 hover:bg-white/30 border-0 backdrop-blur-sm"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Audit Log
                  </Button>
                  <Button className="bg-white/20 hover:bg-white/30 border-0 backdrop-blur-sm">
                    <Download className="mr-2 h-5 w-5" />
                    Export Report
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Summary Cards with gradients */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Submissions
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {kycRecords.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All time submissions
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-yellow-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {kycRecords.filter((r) => r.status === "pending").length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Approved
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {kycRecords.filter((r) => r.status === "approved").length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Successfully verified
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Rejected
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {kycRecords.filter((r) => r.status === "rejected").length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Need resubmission</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search by name, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 shadow-sm"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "all"
                        | "pending"
                        | "approved"
                        | "rejected"
                        | "under_review"
                    )
                  }
                  className="px-4 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm text-sm font-medium"
                >
                  <option value="all">📋 All Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="under_review">🔍 Under Review</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(
                      e.target.value as "all" | "worker" | "client" | "agency"
                    )
                  }
                  className="px-4 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm text-sm font-medium"
                >
                  <option value="all">👥 All Types</option>
                  <option value="worker">👷 Workers</option>
                  <option value="client">💼 Clients</option>
                  <option value="agency">🏢 Agencies</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* KYC Records List */}
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className="group relative overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-gray-200"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="font-bold text-white text-xl">
                          {record.userName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {record.userName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {record.userEmail}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${
                              record.userType === "worker"
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                : record.userType === "agency"
                                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                            }`}
                          >
                            {record.userType}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${
                              record.status === "approved"
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                : record.status === "rejected"
                                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                  : record.status === "under_review"
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                    : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
                            }`}
                          >
                            {record.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                      📅 {new Date(record.submissionDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-3 text-gray-700">
                      📄 Documents Submitted:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {record.documentsSubmitted.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all bg-white"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {doc.name}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              doc.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : doc.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {record.reviewedBy && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700">
                            <strong className="font-semibold">
                              Reviewed by:
                            </strong>{" "}
                            {record.reviewedBy}
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong className="font-semibold">
                              Review date:
                            </strong>{" "}
                            {new Date(record.reviewDate!).toLocaleDateString()}
                          </p>
                          {record.comments && (
                            <p className="text-sm text-gray-700 mt-2">
                              <strong className="font-semibold">
                                Comments:
                              </strong>{" "}
                              {record.comments}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/kyc/${record.id}`)}
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors font-medium"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {record.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all font-medium"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all font-medium"
                        >
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
      </main>
    </div>
  );
}
