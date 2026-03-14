"use client";

import { useState, useEffect, useRef } from "react";
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
  CheckCircle,
  FileText,
  Search,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
  Brain,
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../../components";
import { useToast } from "@/components/ui/toast";
import UserSubmittedDataSection from "@/components/admin/UserSubmittedDataSection";

interface ApprovedKYC {
  id: string;
  kycId: string; // Original KYC ID for file lookup
  userId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client" | "agency";
  submissionDate: string;
  approvalDate: string;
  reviewedBy: string;
  documentsCount: number;
  processingDays: number;
  verificationLevel: number;
}

interface KYCFiles {
  frontId: string | null;
  backId: string | null;
  clearance: string | null;
  selfie: string | null;
  businessPermit: string | null;
  repFront: string | null;
  repBack: string | null;
  addressProof: string | null;
  authLetter: string | null;
}

// Helper component to render KYC document images
const KYCDocumentImage = ({
  url,
  label,
  recordId,
  additionalInfo,
}: {
  url: string;
  label: string;
  recordId: string;
  additionalInfo?: string;
}) => {
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  // If URL is relative (starts with /), prepend backend URL
  const fullUrl = url.startsWith("/") ? `${API_BASE}${url}` : url;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-semibold text-gray-700">{label}</h5>
        {additionalInfo && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {additionalInfo}
          </span>
        )}
      </div>
      <div className="relative group h-64 bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
        {imgLoading && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {imgError ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                Failed to load image
              </p>
              <p className="text-xs text-gray-400 mt-1">
                The file may not exist or be corrupted
              </p>
            </div>
          </div>
        ) : (
          <>
            <img
              src={fullUrl}
              alt={label}
              crossOrigin="anonymous"
              className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => window.open(fullUrl, "_blank")}
              onLoad={() => setImgLoading(false)}
              onError={() => {
                setImgLoading(false);
                setImgError(true);
              }}
            />
            {!imgLoading && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view full size
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function ApprovedKYCPage() {
  const [approvedKYC, setApprovedKYC] = useState<ApprovedKYC[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "client" | "agency">(
    "all",
  );
  const [reviewerFilter, setReviewerFilter] = useState<string>("all");
  const { showToast } = useToast();
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const [isLoading, setIsLoading] = useState(false);
  const [backendData, setBackendData] = useState<any>(null);
  const [expandedRecords, setExpandedRecords] = useState<Record<string, boolean>>({});
  const [kycFilesMap, setKycFilesMap] = useState<Record<string, KYCFiles>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch approved KYC using /kyc/all endpoint
  useEffect(() => {
    fetchApprovedKYC();
  }, []);

  const fetchApprovedKYC = async () => {
    if (!isMounted.current) return;
    setIsLoading(true);
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch(
        `${API_BASE}/api/adminpanel/kyc/all`,
        {
          credentials: "include",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch KYC records");
      }
      
      if (!isMounted.current) return;

      const data = await response.json();

      // Store backend data for file access
      setBackendData(data);

      // Transform user KYC records that are APPROVED
      const userKYC: ApprovedKYC[] = (data.kyc || [])
        .filter((kycRecord: any) =>
          (kycRecord.kycStatus || "").toUpperCase() === "APPROVED"
        )
        .map((kycRecord: any) => {
          const user = (data.users || []).find(
            (u: any) => u.accountID === kycRecord.accountFK_id
          );
          const filesCount = (data.kyc_files || []).filter(
            (f: any) => f.kycID_id === kycRecord.kycID
          ).length;

          const submissionDate = new Date(kycRecord.createdAt);
          const approvalDate = new Date(kycRecord.updatedAt);
          const processingDays = Math.max(0, Math.floor(
            (approvalDate.getTime() - submissionDate.getTime()) /
            (1000 * 60 * 60 * 24)
          ));

          const fullName = user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.email?.split("@")[0] || "Unknown User";

          const userType = user?.profileType?.toLowerCase() === "client"
            ? "client"
            : "worker";

          return {
            id: kycRecord.kycID?.toString() || "0",
            kycId: kycRecord.kycID?.toString() || "0",
            userId: kycRecord.accountFK_id?.toString() || "0",
            userName: fullName,
            userEmail: user?.email || "unknown@email.com",
            userType: userType as "worker" | "client",
            submissionDate: kycRecord.createdAt || new Date().toISOString(),
            approvalDate: kycRecord.updatedAt || new Date().toISOString(),
            reviewedBy: "Admin", // The /kyc/all endpoint doesn't include reviewer info
            documentsCount: filesCount,
            processingDays: isNaN(processingDays) ? 0 : processingDays,
            verificationLevel: user?.verificationLevel ?? 1,
          };
        });

      // Transform agency KYC records that are APPROVED
      const agencyKYC: ApprovedKYC[] = (data.agency_kyc || [])
        .filter((rec: any) => rec.status === "APPROVED")
        .map((rec: any) => {
          const agency = (data.agencies || []).find(
            (a: any) => a.accountID === rec.accountFK_id
          );
          const filesCount = (data.agency_kyc_files || []).filter(
            (f: any) => f.agencyKyc_id === rec.agencyKycID
          ).length;

          const submissionDate = new Date(rec.createdAt);
          const approvalDate = new Date(rec.updatedAt);
          const processingDays = Math.max(0, Math.floor(
            (approvalDate.getTime() - submissionDate.getTime()) /
            (1000 * 60 * 60 * 24)
          ));

          return {
            id: `agency-${rec.agencyKycID?.toString() || "0"}`,
            kycId: rec.agencyKycID?.toString() || "0",
            userId: rec.accountFK_id?.toString() || "0",
            userName: agency?.businessName || agency?.email?.split("@")?.[0] || "Unknown Agency",
            userEmail: agency?.email || "unknown@email.com",
            userType: "agency" as const,
            submissionDate: rec.createdAt || new Date().toISOString(),
            approvalDate: rec.updatedAt || new Date().toISOString(),
            reviewedBy: "Admin",
            documentsCount: filesCount,
            processingDays: isNaN(processingDays) ? 0 : processingDays,
            verificationLevel: 2, // Agencies are fully verified on approval (no clearance step)
          };
        });

      setApprovedKYC([...userKYC, ...agencyKYC]);
    } catch (error: any) {
      if (!isMounted.current || error.name === "AbortError") return;
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
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Fetch KYC files for a specific record
  const fetchKYCFiles = async (record: ApprovedKYC) => {
    if (!backendData) {
      console.error("❌ Backend data not loaded yet");
      return;
    }

    setLoadingFiles((prev) => ({ ...prev, [record.id]: true }));

    try {
      let kycFiles: any[] = [];
      const isAgency = record.userType === "agency";

      if (isAgency) {
        kycFiles = (backendData.agency_kyc_files || []).filter(
          (f: any) => f.agencyKyc_id?.toString() === record.kycId
        );
      } else {
        kycFiles = (backendData.kyc_files || []).filter(
          (f: any) => f.kycID_id?.toString() === record.kycId
        );
      }

      // For agency, map fileType to keys; for user, use fileName patterns
      let frontID, backID, clearance, selfie, addressProof;

      if (isAgency) {
        frontID = kycFiles.find((f: any) => f.fileType === "REP_ID_FRONT");
        backID = kycFiles.find((f: any) => f.fileType === "REP_ID_BACK");
        clearance = kycFiles.find((f: any) => f.fileType === "BUSINESS_PERMIT");
        selfie = kycFiles.find((f: any) => f.fileType === "AUTH_LETTER");
        addressProof = kycFiles.find((f: any) => f.fileType === "ADDRESS_PROOF");
      } else {
        // Use fileName.includes() pattern like pending page
        frontID = kycFiles.find((f: any) =>
          f.fileName?.toLowerCase().includes("frontid")
        );
        backID = kycFiles.find((f: any) =>
          f.fileName?.toLowerCase().includes("backid")
        );
        clearance = kycFiles.find((f: any) =>
          f.fileName?.toLowerCase().includes("clearance")
        );
        selfie = kycFiles.find((f: any) =>
          f.fileName?.toLowerCase().includes("selfie")
        );
      }

      // Prepare the request body with file URLs from Supabase storage
      const requestBody = {
        frontIDLink: frontID?.fileURL || "",
        backIDLink: backID?.fileURL || "",
        clearanceLink: clearance?.fileURL || "",
        selfieLink: selfie?.fileURL || "",
        addressProofLink: addressProof?.fileURL || "",
      };

      // Call backend API to get signed URLs
      const response = await fetch(`${API_BASE}/api/adminpanel/kyc/review`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ Backend error getting signed URLs:", errorData);
        throw new Error(`Failed to fetch signed URLs: ${response.statusText}`);
      }

      const signedUrls = await response.json();

      if (!isMounted.current) return;
      
      const files: KYCFiles = {
        frontId: signedUrls.frontIDLink || null,
        backId: signedUrls.backIDLink || null,
        clearance: signedUrls.clearanceLink || null,
        selfie: signedUrls.selfieLink || null,
        businessPermit: isAgency ? signedUrls.clearanceLink : null,
        repFront: isAgency ? signedUrls.frontIDLink : null,
        repBack: isAgency ? signedUrls.backIDLink : null,
        addressProof: signedUrls.addressProofLink || null,
        authLetter: isAgency ? signedUrls.selfieLink : null,
      };

      setKycFilesMap((prev) => ({ ...prev, [record.id]: files }));
    } catch (error) {
      console.error("❌ Error processing KYC files:", error);
      showToast({
        type: "error",
        title: "Failed to Load Documents",
        message: error instanceof Error ? error.message : "Unable to load KYC documents",
        duration: 5000,
      });
    } finally {
      setLoadingFiles((prev) => ({ ...prev, [record.id]: false }));
    }
  };

  const toggleExpanded = (record: ApprovedKYC) => {
    const isExpanded = expandedRecords[record.id];
    setExpandedRecords((prev) => ({ ...prev, [record.id]: !isExpanded }));

    // Fetch files when expanding
    if (!isExpanded && !kycFilesMap[record.id]) {
      fetchKYCFiles(record);
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
    new Set(approvedKYC.map((record) => record.reviewedBy)),
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <CheckCircle className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading approved KYC records...
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          {/* Header */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Approved KYC Records</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Successfully verified and approved KYC submissions
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                  <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Approved</p>
                <p className="text-xl font-bold text-gray-900">{approvedKYC.length}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">This Month</p>
                <p className="text-xl font-bold text-gray-900">
                  {
                    approvedKYC.filter(
                      (r) =>
                        new Date(r.approvalDate).getMonth() ===
                        new Date().getMonth(),
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
                <p className="text-xs font-medium text-gray-500 mb-0.5">Avg. Processing</p>
                <p className="text-xl font-bold text-gray-900">
                  {approvedKYC.length > 0
                    ? Math.round(
                      approvedKYC.reduce(
                        (acc, r) => acc + r.processingDays,
                        0,
                      ) / approvedKYC.length,
                    )
                    : 0}{" "}
                  days
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Level 2 Verified</p>
                <p className="text-xl font-bold text-gray-900">
                  {approvedKYC.filter((r) => r.verificationLevel >= 2).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
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
                setTypeFilter(e.target.value as "all" | "worker" | "client" | "agency")
              }
              className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
            >
              <option value="all">All Types</option>
              <option value="worker">Workers</option>
              <option value="client">Clients</option>
              <option value="agency">Agencies</option>
            </select>
            <select
              value={reviewerFilter}
              onChange={(e) => setReviewerFilter(e.target.value)}
              className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
            >
              <option value="all">All Reviewers</option>
              {uniqueReviewers.map((reviewer) => (
                <option key={reviewer} value={reviewer}>
                  {reviewer}
                </option>
              ))}
            </select>
          </div>

          {/* Approved Records List */}
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className="hover:shadow-md transition-shadow overflow-hidden"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                      <div className="min-w-0">
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
                              : record.userType === "agency"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                              }`}
                          >
                            {record.userType}
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Approved
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${record.verificationLevel >= 2
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                              }`}
                          >
                            {record.verificationLevel >= 2 ? "⭐ Level 2 — Fully Verified" : "✅ Level 1 — ID Verified"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats + Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      {/* Stats Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                        <div className="text-left sm:text-center">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Documents
                          </p>
                          <p className="text-base sm:text-lg font-semibold">
                            {record.documentsCount}
                          </p>
                        </div>
                        <div className="text-left sm:text-center">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Processing Time
                          </p>
                          <p className="text-base sm:text-lg font-semibold text-green-600">
                            {record.processingDays} days
                          </p>
                        </div>
                        <div className="text-left sm:text-center">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Approved Date
                          </p>
                          <p className="text-xs sm:text-sm">
                            {new Date(record.approvalDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-left sm:text-center">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Reviewed By
                          </p>
                          <p className="text-xs sm:text-sm font-medium">
                            {record.reviewedBy}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        size="sm"
                        onClick={() => toggleExpanded(record)}
                        className="self-start sm:self-auto bg-[#00BAF1] hover:bg-sky-500 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        {expandedRecords[record.id] ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Documents
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            View Documents
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Document Section */}
                  {expandedRecords[record.id] && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      {loadingFiles[record.id] ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-3 text-gray-600">Loading documents...</span>
                        </div>
                      ) : kycFilesMap[record.id] ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column: Document Images */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              Submitted Documents
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              {record.userType === "agency" ? (
                                // Agency documents
                                <>
                                  {kycFilesMap[record.id].businessPermit && (
                                    <KYCDocumentImage
                                      url={kycFilesMap[record.id].businessPermit!}
                                      label="Business Permit"
                                      recordId={record.id}
                                    />
                                  )}
                                  {kycFilesMap[record.id].repFront && (
                                    <KYCDocumentImage
                                      url={kycFilesMap[record.id].repFront!}
                                      label="Representative ID (Front)"
                                      recordId={record.id}
                                    />
                                  )}
                                  {kycFilesMap[record.id].repBack && (
                                    <KYCDocumentImage
                                      url={kycFilesMap[record.id].repBack!}
                                      label="Representative ID (Back)"
                                      recordId={record.id}
                                    />
                                  )}
                                  {kycFilesMap[record.id].addressProof && (
                                    <KYCDocumentImage
                                      url={kycFilesMap[record.id].addressProof!}
                                      label="Address Proof"
                                      recordId={record.id}
                                    />
                                  )}
                                  {kycFilesMap[record.id].authLetter && (
                                    <KYCDocumentImage
                                      url={kycFilesMap[record.id].authLetter!}
                                      label="Authorization Letter"
                                      recordId={record.id}
                                    />
                                  )}
                                </>
                              ) : (
                                // User documents
                                <>
                                  {kycFilesMap[record.id].frontId && (
                                    <KYCDocumentImage
                                      url={kycFilesMap[record.id].frontId!}
                                      label="ID Front"
                                      recordId={record.id}
                                    />
                                  )}
                                  {kycFilesMap[record.id].backId && (
                                    <KYCDocumentImage
                                      url={kycFilesMap[record.id].backId!}
                                      label="ID Back"
                                      recordId={record.id}
                                    />
                                  )}
                                  {kycFilesMap[record.id].clearance && (
                                    <KYCDocumentImage
                                      url={kycFilesMap[record.id].clearance!}
                                      label="NBI/Police Clearance"
                                      recordId={record.id}
                                    />
                                  )}
                                  {kycFilesMap[record.id].selfie && (
                                    <KYCDocumentImage
                                      url={kycFilesMap[record.id].selfie!}
                                      label="Selfie"
                                      recordId={record.id}
                                    />
                                  )}
                                </>
                              )}
                              {/* Show message if no documents found */}
                              {Object.values(kycFilesMap[record.id]).every(v => v === null) && (
                                <div className="col-span-full text-center py-8 text-gray-500">
                                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                  <p>No documents available for this record</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Column: User Submitted Data */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              User Submitted Data
                            </h4>
                            <UserSubmittedDataSection kycId={parseInt(record.kycId)} isAgency={record.userType === "agency"} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>Unable to load documents</p>
                        </div>
                      )}
                    </div>
                  )}
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
