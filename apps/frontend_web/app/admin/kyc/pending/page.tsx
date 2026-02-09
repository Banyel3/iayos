"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
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
  Clock,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Brain,
  Loader2,
} from "lucide-react";
import { Sidebar } from "../../components";
import { useToast } from "@/components/ui/toast";
import UserSubmittedDataSection from "@/components/admin/UserSubmittedDataSection";

// Preset rejection reasons for quick selection
const REJECTION_PRESETS = [
  { id: "blurry", label: "📷 Blurry/Unreadable", reason: "The uploaded document is blurry or unreadable. Please upload a clearer image." },
  { id: "wrong_doc", label: "📄 Wrong Document", reason: "The uploaded document does not match the required document type. Please upload the correct document." },
  { id: "expired", label: "⏰ Expired Document", reason: "The uploaded document has expired. Please upload a valid, non-expired document." },
  { id: "name_mismatch", label: "👤 Name Mismatch", reason: "The name on the document does not match your registered name. Please verify and resubmit." },
  { id: "altered", label: "⚠️ Document Altered", reason: "The document appears to have been altered or tampered with. Please upload an original, unaltered document." },
  { id: "incomplete", label: "📋 Incomplete Info", reason: "Important information is missing or cut off in the document. Please upload a complete image showing all required details." },
  { id: "custom", label: "✏️ Custom Reason", reason: "" },
];

interface PendingKYC {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client" | "agency";
  submissionDate: string;
  priority: "high" | "medium" | "low";
  documentsCount: number;
  daysPending: number;
}

interface KYCFiles {
  frontIDLink: string;
  backIDLink: string;
  clearanceLink: string;
  selfieLink: string;
  addressProofLink?: string;
  idType?: string;
  clearanceType?: string;
}

export default function PendingKYCPage() {
  const [pendingKYC, setPendingKYC] = useState<PendingKYC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "client">(
    "all",
  );
  const [kycFilesMap, setKycFilesMap] = useState<Record<string, KYCFiles>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const [backendData, setBackendData] = useState<any>(null); // Store original backend data for file access
  const [expandedRecords, setExpandedRecords] = useState<
    Record<string, boolean>
  >({}); // Track which records are expanded
  
  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<{ id: string; userType: string; userName: string } | null>(null);
  const [selectedRejectionPreset, setSelectedRejectionPreset] = useState<string>("blurry");
  const [customRejectionReason, setCustomRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

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
    const imageKey = `${recordId}-${label}`;
    const [imgLoading, setImgLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    // If URL is relative (starts with /), prepend backend URL
    const fullUrl = url.startsWith("/") ? `${API_BASE}${url}` : url;

    console.log(`KYCDocumentImage ${label} for record ${recordId}:`, fullUrl);

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
  const fetchPendingKYC = async (retryAttempt = 0) => {
    const MAX_RETRIES = 2;
    setIsLoading(true);
    setFetchError(null);
    try {
      // Add timeout to prevent hanging on slow responses
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      if (retryAttempt > 0) {
        showToast({
          type: "info",
          title: "Retrying...",
          message: `Attempt ${retryAttempt + 1} of ${MAX_RETRIES + 1}`,
          duration: 2000,
        });
      }

      const response = await fetch(`${API_BASE}/api/adminpanel/kyc/all`, {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 401) {
          showToast({
            type: "error",
            title: "Authentication Required",
            message: "Your session has expired. Please log in again.",
            duration: 5000,
          });
          throw new Error("Unauthorized - Please log in again");
        } else if (response.status === 403) {
          showToast({
            type: "error",
            title: "Access Denied",
            message: "You don't have permission to view KYC requests.",
            duration: 5000,
          });
          throw new Error("Forbidden - Access denied");
        } else if (response.status === 404) {
          showToast({
            type: "warning",
            title: "Not Found",
            message: "KYC endpoint not found. Please contact support.",
            duration: 5000,
          });
          throw new Error("KYC endpoint not found");
        } else if (response.status >= 500) {
          showToast({
            type: "error",
            title: "Server Error",
            message: "Server is experiencing issues. Please try again later.",
            duration: 5000,
          });
          throw new Error(`Server error: ${response.status}`);
        } else {
          throw new Error(
            `HTTP ${response.status}: Failed to fetch pending KYC requests`,
          );
        }
      }

      const backendData = await response.json();

      console.log("📦 Backend data received:", backendData);

      // Store backend data for file access
      setBackendData(backendData);

      // Only include user kyc records that are still pending. Approved/Rejected
      // records are retained in the DB for history and should not appear in
      // the pending review queue.
      const transformedData: PendingKYC[] = (backendData.kyc || [])
        .filter(
          (kycRecord: any) =>
            (kycRecord.kycStatus || "").toUpperCase() === "PENDING",
        )
        .map((kycRecord: any) => {
          // ...existing code for user KYC...
          const user = (backendData.users || []).find(
            (u: any) => u.accountID === kycRecord.accountFK_id,
          );
          const filesCount = (backendData.kyc_files || []).filter(
            (f: any) => f.kycID_id === kycRecord.kycID,
          ).length;
          const submissionDate = new Date(kycRecord.createdAt);
          const today = new Date();
          const daysPending = isNaN(submissionDate.getTime())
            ? 0
            : Math.floor(
              (today.getTime() - submissionDate.getTime()) /
              (1000 * 60 * 60 * 24),
            );
          let priority: "high" | "medium" | "low" = "low";
          if (daysPending > 14) priority = "high";
          else if (daysPending > 7) priority = "medium";
          const fullName =
            user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.email?.split("@")[0] || "Unknown User";
          const userType =
            user?.profileType?.toLowerCase() === "client" ? "client" : "worker";
          return {
            id: kycRecord.kycID?.toString() || "0",
            userId: kycRecord.accountFK_id?.toString() || "0",
            userName: fullName,
            userEmail: user?.email || "unknown@email.com",
            userType: userType as "worker" | "client",
            submissionDate: kycRecord.createdAt || new Date().toISOString(),
            priority: priority,
            documentsCount: filesCount,
            daysPending: daysPending,
          };
        });

      // Add agency KYC records
      const agencyTransformed: PendingKYC[] = (backendData.agency_kyc || [])
        .filter((rec: any) => rec.status === "PENDING")
        .map((rec: any) => {
          const agency = (backendData.agencies || []).find(
            (a: any) => a.accountID === rec.accountFK_id,
          );
          const filesCount = (backendData.agency_kyc_files || []).filter(
            (f: any) => f.agencyKyc_id === rec.agencyKycID,
          ).length;
          const submissionDate = new Date(rec.createdAt);
          const today = new Date();
          const daysPending = isNaN(submissionDate.getTime())
            ? 0
            : Math.floor(
              (today.getTime() - submissionDate.getTime()) /
              (1000 * 60 * 60 * 24),
            );
          let priority: "high" | "medium" | "low" = "low";
          if (daysPending > 14) priority = "high";
          else if (daysPending > 7) priority = "medium";
          return {
            id: rec.agencyKycID?.toString() || "0",
            userId: rec.accountFK_id?.toString() || "0",
            userName:
              agency?.businessName ||
              agency?.email?.split("@")?.[0] ||
              "Unknown Agency",
            userEmail: agency?.email || "unknown@email.com",
            userType: "agency",
            submissionDate: rec.createdAt || new Date().toISOString(),
            priority: priority,
            documentsCount: filesCount,
            daysPending: daysPending,
          };
        });

      setPendingKYC([...transformedData, ...agencyTransformed]);
      console.log("✅ Fetched and transformed KYC requests:", transformedData);
    } catch (error) {
      console.error("❌ Error fetching pending KYC:", error);

      // Auto-retry on timeout or network errors
      const isAbortError = error instanceof DOMException && error.name === "AbortError";
      const isNetworkError = error instanceof TypeError && error.message.includes("fetch");

      if ((isAbortError || isNetworkError) && retryAttempt < MAX_RETRIES) {
        // Wait 2 seconds then retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return fetchPendingKYC(retryAttempt + 1);
      }

      // Set error state for retry button
      const errorMsg = isAbortError
        ? "Request timed out. The server may be slow or unavailable."
        : isNetworkError
          ? "Unable to connect to the server. Please check your internet connection."
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred.";
      setFetchError(errorMsg);

      // Handle specific errors with toasts
      if (isAbortError) {
        showToast({
          type: "error",
          title: "Request Timed Out",
          message: "The server took too long to respond. Click Retry to try again.",
          duration: 6000,
        });
      } else if (isNetworkError) {
        showToast({
          type: "error",
          title: "Network Error",
          message:
            "Unable to connect to the server. Please check your internet connection.",
          duration: 6000,
        });
      } else if (
        error instanceof Error &&
        !error.message.includes("Unauthorized") &&
        !error.message.includes("Forbidden") &&
        !error.message.includes("not found") &&
        !error.message.includes("Server error")
      ) {
        showToast({
          type: "error",
          title: "Failed to Load KYC Requests",
          message: error.message,
          duration: 5000,
        });
      } else if (!(error instanceof Error)) {
        showToast({
          type: "error",
          title: "Failed to Load KYC Requests",
          message: "An unexpected error occurred. Please try again.",
          duration: 5000,
        });
      }

      // Keep empty array on error - don't fall back to mock data
      setPendingKYC([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch KYC files for a specific record
  const fetchKYCFiles = async (kycId: string) => {
    if (!backendData) {
      console.error("❌ Backend data not loaded yet");
      showToast({
        type: "error",
        title: "Data Not Ready",
        message: "Backend data is still loading. Please try again in a moment.",
        duration: 3000,
      });
      return;
    }

    setLoadingFiles((prev) => ({ ...prev, [kycId]: true }));
    try {
      // Find the record in pendingKYC to determine type
      const record = pendingKYC.find((r) => r.id === kycId);
      let kycFiles: any[] = [];
      let isAgency = false;
      if (record?.userType === "agency") {
        isAgency = true;
        kycFiles = (backendData.agency_kyc_files || []).filter(
          (f: any) => f.agencyKyc_id === parseInt(kycId),
        );
      } else {
        kycFiles = (backendData.kyc_files || []).filter(
          (f: any) => f.kycID_id === parseInt(kycId),
        );
      }

      console.log(
        `📂 Found ${kycFiles.length} files for KYC ${kycId}:`,
        kycFiles,
      );

      // For agency, map fileType to keys; for user, use fileName patterns
      let frontID, backID, clearance, selfie;
      let addressProof;
      if (isAgency) {
        frontID = kycFiles.find((f: any) => f.fileType === "REP_ID_FRONT");
        backID = kycFiles.find((f: any) => f.fileType === "REP_ID_BACK");
        clearance = kycFiles.find((f: any) => f.fileType === "BUSINESS_PERMIT");
        selfie = kycFiles.find((f: any) => f.fileType === "AUTH_LETTER");
        addressProof = kycFiles.find(
          (f: any) => f.fileType === "ADDRESS_PROOF",
        );
      } else {
        frontID = kycFiles.find((f: any) =>
          f.fileName?.toLowerCase().includes("frontid"),
        );
        backID = kycFiles.find((f: any) =>
          f.fileName?.toLowerCase().includes("backid"),
        );
        clearance = kycFiles.find((f: any) =>
          f.fileName?.toLowerCase().includes("clearance"),
        );
        selfie = kycFiles.find((f: any) =>
          f.fileName?.toLowerCase().includes("selfie"),
        );
      }

      // Prepare the request body with file URLs from Supabase storage
      const requestBody = {
        // Map agency file types to backend keys
        frontIDLink: frontID?.fileURL || "",
        backIDLink: backID?.fileURL || "",
        clearanceLink: clearance?.fileURL || "",
        selfieLink: selfie?.fileURL || "",
        // addressProofLink is sent for completeness, but backend currently ignores it
        addressProofLink: addressProof?.fileURL || "",
      };

      console.log("📤 Sending file URLs to backend:", requestBody);

      // Call backend API to get signed URLs
      const response = await fetch(`${API_BASE}/api/adminpanel/kyc/review`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        `📡 Response status: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("❌ Backend error:", errorData);
        throw new Error(
          `Failed to fetch signed URLs: ${getErrorMessage(errorData, response.statusText)}`,
        );
      }

      const signedUrls = await response.json();

      // Check if response contains an error
      if (signedUrls.error) {
        console.error("❌ Backend returned error:", signedUrls.error);
        throw new Error(`Backend error: ${signedUrls.error}`);
      }

      // Extract ID type and clearance type from the files
      const idType = frontID?.idType || backID?.idType || "Unknown";
      const clearanceType = clearance?.idType || "Unknown";

      const filesWithMetadata = {
        ...signedUrls,
        addressProofLink:
          signedUrls.addressProofLink || requestBody.addressProofLink,
        idType: idType,
        clearanceType: clearanceType,
      };

      setKycFilesMap((prev) => ({ ...prev, [kycId]: filesWithMetadata }));
      console.log(
        `✅ Received signed URLs for KYC ${kycId}:`,
        filesWithMetadata,
      );
    } catch (error) {
      console.error(`❌ Error fetching KYC files for ${kycId}:`, error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      showToast({
        type: "error",
        title: "Failed to Load Documents",
        message: `Unable to load KYC documents: ${errorMessage}`,
        duration: 5000,
      });
    } finally {
      setLoadingFiles((prev) => ({ ...prev, [kycId]: false }));
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPendingKYC();
  }, []);

  // Handle KYC Approval
  const handleApproveKYC = async (kycId: string, userType?: string) => {
    try {
      console.log(`🔍 Approving KYC ID: ${kycId}`);

      const isAgency = userType === "agency";
      const endpoint = isAgency
        ? `${API_BASE}/api/adminpanel/kyc/approve-agency`
        : `${API_BASE}/api/adminpanel/kyc/approve`;

      const payload = isAgency
        ? { agencyKycID: parseInt(kycId) }
        : { kycID: parseInt(kycId) };

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to approve KYC");
      }

      console.log("✅ KYC approved successfully:", result);

      showToast({
        type: "success",
        title: isAgency ? "Agency KYC Approved" : "KYC Approved",
        message:
          `Successfully approved ${isAgency ? "agency" : "user"} KYC for ${result.userEmail}` +
          (result.kycVerified !== undefined
            ? ` — account verified: ${result.kycVerified}`
            : ""),
        duration: 5000,
      });

      // If backend returned the updated verification status, reflect it locally
      if (isAgency && result.kycVerified !== undefined) {
        // Update backendData.agency_kyc item status locally for immediate UI feedback
        setBackendData((prev: any) => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (Array.isArray(updated.agency_kyc)) {
            updated.agency_kyc = updated.agency_kyc.map((rec: any) => {
              if (rec.agencyKycID === parseInt(kycId)) {
                return { ...rec, status: result.status || "APPROVED" };
              }
              return rec;
            });
          }
          return updated;
        });
      }

      // Refresh the list to remove approved item (server source of truth)
      fetchPendingKYC();
    } catch (error) {
      console.error("❌ Error approving KYC:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      showToast({
        type: "error",
        title: "Approval Failed",
        message: `Unable to approve KYC: ${errorMessage}`,
        duration: 5000,
      });
    }
  };

  // Handle KYC Rejection
  const handleRejectKYC = async (
    kycId: string,
    userType?: string,
    reason?: string,
  ) => {
    try {
      console.log(`🔍 Rejecting KYC ID: ${kycId}`);

      const isAgency = userType === "agency";
      const endpoint = isAgency
        ? `${API_BASE}/api/adminpanel/kyc/reject-agency`
        : `${API_BASE}/api/adminpanel/kyc/reject`;

      const payload = isAgency
        ? {
          agencyKycID: parseInt(kycId),
          reason:
            reason || "Documents did not meet verification requirements",
        }
        : {
          kycID: parseInt(kycId),
          reason:
            reason || "Documents did not meet verification requirements",
        };

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to reject KYC");
      }

      console.log("✅ KYC rejected successfully:", result);

      showToast({
        type: "warning",
        title: isAgency ? "Agency KYC Rejected" : "KYC Rejected",
        message:
          `${isAgency ? "Agency" : "User"} KYC rejected for ${result.userEmail}` +
          (result.kycStatus ? ` — status: ${result.kycStatus}` : "") +
          (result.reason ? ` — reason: ${result.reason}` : ""),
        duration: 5000,
      });

      // Update local copy so the pending list reflects the rejection immediately
      if (isAgency && result.status) {
        setBackendData((prev: any) => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (Array.isArray(updated.agency_kyc)) {
            updated.agency_kyc = updated.agency_kyc.map((rec: any) => {
              if (rec.agencyKycID === parseInt(kycId)) {
                return {
                  ...rec,
                  status: result.status,
                  notes: result.reason || rec.notes,
                };
              }
              return rec;
            });
          }
          return updated;
        });
      }

      // Refresh the list (server source of truth)
      fetchPendingKYC();
    } catch (error) {
      console.error("❌ Error rejecting KYC:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      showToast({
        type: "error",
        title: "Rejection Failed",
        message: `Unable to reject KYC: ${errorMessage}`,
        duration: 5000,
      });
    }
  };

  // Open rejection modal with preset options
  const openRejectModal = (record: PendingKYC) => {
    setRejectingRecord({ id: record.id, userType: record.userType, userName: record.userName });
    setSelectedRejectionPreset("blurry");
    setCustomRejectionReason("");
    setShowRejectModal(true);
  };

  // Submit rejection with selected reason
  const submitRejection = async () => {
    if (!rejectingRecord) return;
    
    setIsRejecting(true);
    
    const preset = REJECTION_PRESETS.find(p => p.id === selectedRejectionPreset);
    const reason = selectedRejectionPreset === "custom" 
      ? customRejectionReason.trim()
      : preset?.reason || "Documents did not meet verification requirements";
    
    if (selectedRejectionPreset === "custom" && !customRejectionReason.trim()) {
      showToast({
        type: "error",
        title: "Reason Required",
        message: "Please enter a custom rejection reason.",
        duration: 3000,
      });
      setIsRejecting(false);
      return;
    }
    
    await handleRejectKYC(rejectingRecord.id, rejectingRecord.userType, reason);
    
    setIsRejecting(false);
    setShowRejectModal(false);
    setRejectingRecord(null);
  };

  const filteredRecords = pendingKYC.filter((record) => {
    const matchesSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      priorityFilter === "all" || record.priority === priorityFilter;
    const matchesType = typeFilter === "all" || record.userType === typeFilter;

    return matchesSearch && matchesPriority && matchesType;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysPendingColor = (days: number) => {
    if (days > 14) return "text-red-600";
    if (days > 7) return "text-yellow-600";
    return "text-green-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <Clock className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading pending KYC reviews...
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
      <main className="pl-72 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Pending KYC Reviews
                  </h1>
                  <p className="text-blue-100 text-lg">
                    KYC submissions awaiting review and approval
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Pending
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {pendingKYC.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Clock className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  High Priority
                </p>
                <p className="text-3xl font-bold text-indigo-600">
                  {pendingKYC.filter((r) => r.priority === "high").length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Urgent reviews</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Clock className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Overdue
                </p>
                <p className="text-3xl font-bold text-gray-600">
                  {pendingKYC.filter((r) => r.daysPending > 14).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  &gt; 14 days pending
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Avg. Days Pending
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {pendingKYC.length > 0
                    ? Math.round(
                      pendingKYC.reduce((acc, r) => acc + r.daysPending, 0) /
                      pendingKYC.length,
                    )
                    : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Average wait time</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
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
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(
                      e.target.value as "all" | "high" | "medium" | "low",
                    )
                  }
                  className="px-4 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm text-sm font-medium"
                >
                  <option value="all">📋 All Priorities</option>
                  <option value="high">🔴 High Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="low">🟢 Low Priority</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as "all" | "worker" | "client")
                  }
                  className="px-4 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm text-sm font-medium"
                >
                  <option value="all">👥 All Types</option>
                  <option value="worker">👷 Workers</option>
                  <option value="client">💼 Clients</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Pending Reviews List */}
          <div className="space-y-4">
            {isLoading ? (
              // Skeleton Loading State
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Avatar Skeleton */}
                          <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                          <div className="space-y-2">
                            {/* Name Skeleton */}
                            <div className="h-5 w-32 bg-gray-200 rounded"></div>
                            {/* Email Skeleton */}
                            <div className="h-4 w-48 bg-gray-200 rounded"></div>
                            {/* Badges Skeleton */}
                            <div className="flex items-center space-x-2">
                              <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                              <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          {/* Documents Count Skeleton */}
                          <div className="text-center space-y-2">
                            <div className="h-4 w-20 bg-gray-200 rounded mx-auto"></div>
                            <div className="h-6 w-8 bg-gray-200 rounded mx-auto"></div>
                          </div>

                          {/* Submitted Date Skeleton */}
                          <div className="text-center space-y-2">
                            <div className="h-4 w-20 bg-gray-200 rounded mx-auto"></div>
                            <div className="h-5 w-24 bg-gray-200 rounded mx-auto"></div>
                          </div>

                          {/* Review Button Skeleton */}
                          <div className="h-10 w-32 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : filteredRecords.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <FileText className="w-16 h-16 text-gray-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {fetchError ? "Failed to Load KYC Data" : "No Pending Reviews"}
                      </h3>
                      <p className="text-muted-foreground">
                        {fetchError
                          ? fetchError
                          : searchTerm ||
                              priorityFilter !== "all" ||
                              typeFilter !== "all"
                            ? "No KYC submissions match your filters"
                            : "All KYC submissions have been reviewed"}
                      </p>
                      {fetchError && (
                        <Button
                          className="mt-4"
                          onClick={() => fetchPendingKYC()}
                        >
                          <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredRecords.map((record) => (
                <Card
                  key={record.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary text-lg">
                            {record.userName.charAt(0)}
                          </span>
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
                              className={`px-2 py-1 rounded-full text-xs font-medium ${record.userType === "worker"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                                }`}
                            >
                              {record.userType}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(record.priority)}`}
                            >
                              {record.priority} priority
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
                            Days Pending
                          </p>
                          <p
                            className={`text-lg font-semibold ${getDaysPendingColor(record.daysPending)}`}
                          >
                            {record.daysPending || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Submitted
                          </p>
                          <p className="text-sm">
                            {new Date(
                              record.submissionDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              fetchKYCFiles(record.id);
                              setExpandedRecords((prev) => ({
                                ...prev,
                                [record.id]: !prev[record.id],
                              }));
                            }}
                            disabled={loadingFiles[record.id]}
                          >
                            {expandedRecords[record.id] ? (
                              <ChevronUp className="w-4 h-4 mr-2" />
                            ) : (
                              <Eye className="w-4 h-4 mr-2" />
                            )}
                            {loadingFiles[record.id]
                              ? "Loading..."
                              : expandedRecords[record.id]
                                ? "Hide Files"
                                : "Review"}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                              handleApproveKYC(record.id, record.userType)
                            }
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => openRejectModal(record)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable KYC Files Section */}
                    {expandedRecords[record.id] && kycFilesMap[record.id] && (
                      <div className="mt-6 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column: Document Images */}
                          <div>
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                <ImageIcon className="w-6 h-6 mr-2 text-blue-600" />
                                Submitted Documents
                              </h4>
                            </div>
                            {record.userType === "agency" ? (
                              // Agency KYC: show all relevant agency-specific documents in a grid
                              <div className="grid grid-cols-2 gap-4">
                                {/* Business Permit */}
                                {kycFilesMap[record.id].clearanceLink && (
                                  <KYCDocumentImage
                                    url={kycFilesMap[record.id].clearanceLink}
                                    label="Business Permit"
                                    recordId={record.id}
                                    additionalInfo={
                                      kycFilesMap[record.id].clearanceType
                                    }
                                  />
                                )}
                                {/* Rep ID Front */}
                                {kycFilesMap[record.id].frontIDLink && (
                                  <KYCDocumentImage
                                    url={kycFilesMap[record.id].frontIDLink}
                                    label="Representative ID (Front)"
                                    recordId={record.id}
                                    additionalInfo={kycFilesMap[record.id].idType}
                                  />
                                )}
                                {/* Rep ID Back */}
                                {kycFilesMap[record.id].backIDLink && (
                                  <KYCDocumentImage
                                    url={kycFilesMap[record.id].backIDLink}
                                    label="Representative ID (Back)"
                                    recordId={record.id}
                                    additionalInfo={kycFilesMap[record.id].idType}
                                  />
                                )}
                                {/* Address Proof */}
                                {kycFilesMap[record.id].addressProofLink && (
                                  <KYCDocumentImage
                                    url={
                                      kycFilesMap[record.id].addressProofLink || ""
                                    }
                                    label="Address Proof"
                                    recordId={record.id}
                                  />
                                )}
                                {/* Authorization Letter */}
                                {kycFilesMap[record.id].selfieLink && (
                                  <KYCDocumentImage
                                    url={kycFilesMap[record.id].selfieLink}
                                    label="Authorization Letter"
                                    recordId={record.id}
                                  />
                                )}
                                {/* If no docs, show empty state */}
                                {!kycFilesMap[record.id].clearanceLink &&
                                  !kycFilesMap[record.id].frontIDLink &&
                                  !kycFilesMap[record.id].backIDLink &&
                                  !kycFilesMap[record.id].addressProofLink &&
                                  !kycFilesMap[record.id].selfieLink && (
                                    <div className="col-span-2 text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                      <FileText className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                      <p className="text-gray-600 font-medium">
                                        No documents found for this KYC submission
                                      </p>
                                    </div>
                                  )}
                              </div>
                            ) : !kycFilesMap[record.id].frontIDLink &&
                              !kycFilesMap[record.id].backIDLink &&
                              !kycFilesMap[record.id].clearanceLink &&
                              !kycFilesMap[record.id].selfieLink ? (
                              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                <FileText className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-600 font-medium">
                                  No documents found for this KYC submission
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-4">
                                {/* Front ID */}
                                {kycFilesMap[record.id].frontIDLink && (
                                  <KYCDocumentImage
                                    url={kycFilesMap[record.id].frontIDLink}
                                    label="Front ID"
                                    recordId={record.id}
                                    additionalInfo={kycFilesMap[record.id].idType}
                                  />
                                )}
                                {/* Back ID */}
                                {kycFilesMap[record.id].backIDLink && (
                                  <KYCDocumentImage
                                    url={kycFilesMap[record.id].backIDLink}
                                    label="Back ID"
                                    recordId={record.id}
                                    additionalInfo={kycFilesMap[record.id].idType}
                                  />
                                )}
                                {/* Clearance */}
                                {kycFilesMap[record.id].clearanceLink && (
                                  <KYCDocumentImage
                                    url={kycFilesMap[record.id].clearanceLink}
                                    label="Clearance Document"
                                    recordId={record.id}
                                    additionalInfo={
                                      kycFilesMap[record.id].clearanceType
                                    }
                                  />
                                )}
                                {/* Selfie */}
                                {kycFilesMap[record.id].selfieLink && (
                                  <KYCDocumentImage
                                    url={kycFilesMap[record.id].selfieLink}
                                    label="Selfie with ID"
                                    recordId={record.id}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Right Column: User Submitted Data */}
                          <div>
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                                User Submitted Data
                              </h4>
                            </div>
                            <UserSubmittedDataSection kycId={parseInt(record.id)} isAgency={record.userType === "agency"} />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Rejection Modal with Quick-Select Options */}
      {showRejectModal && rejectingRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Reject KYC Verification
              </CardTitle>
              <CardDescription>
                Rejecting KYC for <span className="font-semibold">{rejectingRecord.userName}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a reason for rejection. The user will receive a notification with this message.
              </p>
              
              {/* Quick-Select Preset Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason</label>
                <div className="grid gap-2">
                  {REJECTION_PRESETS.map((preset) => (
                    <label
                      key={preset.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedRejectionPreset === preset.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300 hover:bg-red-50/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionPreset"
                        value={preset.id}
                        checked={selectedRejectionPreset === preset.id}
                        onChange={() => setSelectedRejectionPreset(preset.id)}
                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{preset.label}</span>
                        {preset.reason && preset.id !== "custom" && (
                          <p className="text-xs text-muted-foreground mt-1">{preset.reason}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Custom Reason Text Area - Only shown when "Custom" is selected */}
              {selectedRejectionPreset === "custom" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-600">
                    Custom Rejection Reason *
                  </label>
                  <textarea
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    placeholder="Enter a custom rejection reason..."
                    className="w-full rounded-lg border-2 border-red-200 p-3 text-sm resize-none h-24 focus:border-red-400 focus:ring-red-400"
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be sent to the user as their rejection notification.
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingRecord(null);
                  }}
                  disabled={isRejecting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={submitRejection}
                  disabled={isRejecting || (selectedRejectionPreset === "custom" && !customRejectionReason.trim())}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject KYC
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
