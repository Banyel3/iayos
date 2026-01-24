"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api/config";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  AlertCircle,
  Download,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
  X,
} from "lucide-react";
import KYCExtractedDataComparison from "@/components/admin/KYCExtractedDataComparison";

interface KYCRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client" | "agency";
  submissionDate: string;
  status: "pending" | "approved" | "rejected" | "under_review";
  documents: {
    idType: string;
    idNumber: string;
    frontImage: string;
    backImage: string;
    selfieImage: string;
    businessPermit?: string;
    birCertificate?: string;
  };
  verificationNotes?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
  comments?: string;
}

interface SignedDocument {
  type: string;
  label: string;
  url: string;
  originalPath: string;
}

// Helper function to combine individual and agency KYC data
function combineKYCData(data: any): KYCRecord[] {
  const records: KYCRecord[] = [];

  // Process individual KYC records
  if (data.kyc && Array.isArray(data.kyc)) {
    data.kyc.forEach((kyc: any) => {
      const user = data.users?.find((u: any) => u.accountID === kyc.accountFK);
      const files = data.files?.filter((f: any) => f.kycID === kyc.kycID) || [];

      console.log(`Processing KYC ${kyc.kycID}:`, { kyc, user, files });

      if (user) {
        records.push({
          id: `kyc_${kyc.kycID}`,
          userId: user.accountID.toString(),
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          userType: user.profileType?.toLowerCase() || "client",
          submissionDate: kyc.createdAt || new Date().toISOString(),
          status: kyc.status?.toLowerCase() || "pending",
          documents: {
            idType: kyc.documentType || "National ID",
            idNumber: kyc.documentNumber || "N/A",
            frontImage:
              files.find((f: any) => f.fileType === "front")?.filePath || "",
            backImage:
              files.find((f: any) => f.fileType === "back")?.filePath || "",
            selfieImage:
              files.find((f: any) => f.fileType === "selfie")?.filePath || "",
          },
          verificationNotes: kyc.notes,
          reviewedBy: kyc.reviewedBy,
          reviewedDate: kyc.reviewedAt,
          rejectionReason: kyc.rejectionReason,
          comments: kyc.comments,
        });
      }
    });
  }

  // Process agency KYC records
  if (data.agency_kyc && Array.isArray(data.agency_kyc)) {
    data.agency_kyc.forEach((agencyKyc: any) => {
      const agency = data.agencies?.find(
        (a: any) => a.agencyID === agencyKyc.agencyID,
      );
      const files =
        data.files?.filter(
          (f: any) => f.agencyKycID === agencyKyc.agencyKycID,
        ) || [];

      if (agency) {
        records.push({
          id: `agency_${agencyKyc.agencyKycID}`,
          userId: agency.agencyID.toString(),
          userName: agency.agencyName,
          userEmail: agency.email,
          userType: "agency",
          submissionDate: agencyKyc.createdAt || new Date().toISOString(),
          status: agencyKyc.status?.toLowerCase() || "pending",
          documents: {
            idType: agencyKyc.documentType || "Business Permit",
            idNumber: agencyKyc.documentNumber || "N/A",
            frontImage:
              files.find((f: any) => f.fileType === "front")?.filePath || "",
            backImage:
              files.find((f: any) => f.fileType === "back")?.filePath || "",
            selfieImage:
              files.find((f: any) => f.fileType === "selfie")?.filePath || "",
            businessPermit:
              files.find((f: any) => f.fileType === "business_permit")
                ?.filePath || "",
            birCertificate:
              files.find((f: any) => f.fileType === "bir_certificate")
                ?.filePath || "",
          },
          verificationNotes: agencyKyc.notes,
          reviewedBy: agencyKyc.reviewedBy,
          reviewedDate: agencyKyc.reviewedAt,
          rejectionReason: agencyKyc.rejectionReason,
          comments: agencyKyc.comments,
        });
      }
    });
  }

  return records;
}

export default function KYCDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<KYCRecord | null>(null);
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchKYCDetail();
  }, [id]);

  const fetchKYCDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all KYC data
      const response = await fetch(`${API_BASE}/api/adminpanel/kyc/all`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch KYC data: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch KYC data");
      }

      // Combine and find specific record
      const allRecords = combineKYCData(data);
      const foundRecord = allRecords.find((r) => r.id === id);

      if (!foundRecord) {
        setError("KYC record not found");
        setLoading(false);
        return;
      }

      setRecord(foundRecord);

      // Fetch signed URLs for documents
      await fetchSignedURLs(foundRecord);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching KYC detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load KYC data");
      setLoading(false);
    }
  };

  const fetchSignedURLs = async (record: KYCRecord) => {
    try {
      // Build request body with field names matching backend expectations
      const requestBody: Record<string, string> = {};

      if (record.documents.frontImage)
        requestBody.frontIDLink = record.documents.frontImage;
      if (record.documents.backImage)
        requestBody.backIDLink = record.documents.backImage;
      if (record.documents.selfieImage)
        requestBody.selfieLink = record.documents.selfieImage;
      if (record.documents.businessPermit)
        requestBody.clearanceLink = record.documents.businessPermit;
      if (record.documents.birCertificate)
        requestBody.addressProofLink = record.documents.birCertificate;

      console.log("Fetching signed URLs for documents:", requestBody);

      if (Object.keys(requestBody).length === 0) {
        console.warn("No document paths found for KYC record");
        return;
      }

      const response = await fetch(`${API_BASE}/api/adminpanel/kyc/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        credentials: "include",
      });

      console.log("Signed URLs response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch signed URLs:", errorText);
        throw new Error("Failed to fetch signed URLs");
      }

      const signedData = await response.json();
      console.log("Signed URLs received:", signedData);

      // Backend returns { frontIDLink: "url", backIDLink: "url", ... }
      const docs: SignedDocument[] = [];

      if (record.documents.frontImage && signedData.frontIDLink) {
        docs.push({
          type: "front",
          label: "ID Front",
          url: signedData.frontIDLink,
          originalPath: record.documents.frontImage,
        });
      }

      if (record.documents.backImage && signedData.backIDLink) {
        docs.push({
          type: "back",
          label: "ID Back",
          url: signedData.backIDLink,
          originalPath: record.documents.backImage,
        });
      }

      if (record.documents.selfieImage && signedData.selfieLink) {
        docs.push({
          type: "selfie",
          label: "Selfie",
          url: signedData.selfieLink,
          originalPath: record.documents.selfieImage,
        });
      }

      if (record.documents.businessPermit && signedData.clearanceLink) {
        docs.push({
          type: "business_permit",
          label: "Business Permit",
          url: signedData.clearanceLink,
          originalPath: record.documents.businessPermit,
        });
      }

      if (record.documents.birCertificate && signedData.addressProofLink) {
        docs.push({
          type: "bir_certificate",
          label: "BIR Certificate",
          url: signedData.addressProofLink,
          originalPath: record.documents.birCertificate,
        });
      }

      console.log("Signed documents ready:", docs);
      setSignedDocuments(docs);

      if (docs.length === 0) {
        console.warn("No signed URLs returned from backend");
      }
    } catch (err) {
      console.error("Error fetching signed URLs:", err);
      toast.error("Failed to load document images. Check console for details.");
    }
  };

  const handleApprove = async () => {
    if (!record) return;

    try {
      setActionLoading(true);

      const isAgency = record.userType === "agency";
      const endpoint = isAgency
        ? "/api/adminpanel/kyc/approve-agency"
        : "/api/adminpanel/kyc/approve";

      const kycId = parseInt(
        record.id.replace("kyc_", "").replace("agency_", ""),
      );
      const body = isAgency
        ? { agencyKycID: kycId, notes }
        : { kycID: kycId, notes };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve KYC");
      }

      toast.success("KYC approved successfully");
      router.push("/admin/kyc");
    } catch (err) {
      console.error("Error approving KYC:", err);
      toast.error(err instanceof Error ? err.message : "Failed to approve KYC");
    } finally {
      setActionLoading(false);
      setShowApproveModal(false);
    }
  };

  const handleReject = async () => {
    if (!record) return;

    if (!notes.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setActionLoading(true);

      const isAgency = record.userType === "agency";
      const endpoint = isAgency
        ? "/api/adminpanel/kyc/reject-agency"
        : "/api/adminpanel/kyc/reject";

      const kycId = parseInt(
        record.id.replace("kyc_", "").replace("agency_", ""),
      );
      const body = isAgency
        ? { agencyKycID: kycId, notes }
        : { kycID: kycId, notes };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject KYC");
      }

      toast.success("KYC rejected");
      router.push("/admin/kyc");
    } catch (err) {
      console.error("Error rejecting KYC:", err);
      toast.error(err instanceof Error ? err.message : "Failed to reject KYC");
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading KYC details...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">
                Error Loading KYC Details
              </h3>
              <p className="text-red-700 text-sm mt-1">
                {error || "KYC record not found"}
              </p>
              <Button
                onClick={() => router.push("/admin/kyc")}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Back to KYC List
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending Review",
          color: "bg-yellow-100 text-yellow-800",
          icon: AlertCircle,
        };
      case "approved":
        return {
          label: "Approved",
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
        };
      case "rejected":
        return {
          label: "Rejected",
          color: "bg-red-100 text-red-800",
          icon: XCircle,
        };
      case "under_review":
        return {
          label: "Under Review",
          color: "bg-blue-100 text-blue-800",
          icon: AlertCircle,
        };
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-800",
          icon: Shield,
        };
    }
  };

  const statusInfo = getStatusInfo(record.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" onClick={() => router.push("/admin/kyc")}>
        ← Back to KYC Verification
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">KYC Verification Details</h1>
          <p className="text-muted-foreground mt-1">Record #{record.id}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusInfo.color}`}
        >
          <StatusIcon className="h-4 w-4" />
          {statusInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            {/* User Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </h3>
              <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Full Name
                  </p>
                  <p className="font-semibold">{record.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-semibold text-sm">{record.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    User Type
                  </p>
                  <p className="font-semibold capitalize">{record.userType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">User ID</p>
                  <p className="font-semibold text-sm">{record.userId}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() =>
                  router.push(
                    `/admin/users/${record.userType === "worker" ? "workers" : "clients"}/${record.userId}`,
                  )
                }
              >
                View User Profile
              </Button>
            </div>

            {/* Document Information */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submitted Documents
              </h3>
              <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-lg p-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID Type</p>
                  <p className="font-semibold">{record.documents.idType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    ID Number
                  </p>
                  <p className="font-semibold">{record.documents.idNumber}</p>
                </div>
              </div>

              {/* Document Images */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {signedDocuments.map((doc) => (
                  <div
                    key={doc.type}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square bg-gray-100">
                      <img
                        src={doc.url}
                        alt={doc.label}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedImage(doc.url)}
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-sm font-medium">{doc.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              {signedDocuments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No documents available</p>
                </div>
              )}
            </div>

            {/* Review Information */}
            {(record.reviewedBy || record.rejectionReason) && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4">
                  Review Information
                </h3>
                {record.reviewedBy && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Reviewed By
                        </p>
                        <p className="font-semibold">{record.reviewedBy}</p>
                      </div>
                      {record.reviewedDate && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Review Date
                          </p>
                          <p className="font-semibold text-sm">
                            {new Date(record.reviewedDate).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    {record.verificationNotes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Notes
                        </p>
                        <p className="text-sm">{record.verificationNotes}</p>
                      </div>
                    )}
                    {record.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-red-700">
                          {record.rejectionReason}
                        </p>
                      </div>
                    )}
                    {record.comments && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Comments
                        </p>
                        <p className="text-sm">{record.comments}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Tabs defaultValue="timeline" className="border-t pt-6">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="notes">Admin Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="timeline" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm border-l-2 border-blue-500 pl-4 py-2">
                    <div>
                      <p className="font-medium">Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.submissionDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {record.reviewedDate && (
                    <div
                      className={`flex items-start gap-3 text-sm border-l-2 pl-4 py-2 ${
                        record.status === "approved"
                          ? "border-green-500"
                          : "border-red-500"
                      }`}
                    >
                      <div>
                        <p className="font-medium">
                          {record.status === "approved"
                            ? "Approved"
                            : "Rejected"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.reviewedDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <textarea
                  placeholder="Add admin notes about this verification..."
                  className="w-full rounded border border-gray-200 p-3 text-sm resize-none h-32"
                  defaultValue={record.verificationNotes || ""}
                />
                <Button size="sm" className="mt-2">
                  Save Notes
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {record.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Verification Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="default"
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                  size="sm"
                  onClick={() => setShowApproveModal(true)}
                  disabled={actionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve KYC
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject KYC
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Submission Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Record ID</dt>
                <dd className="font-medium text-xs">#{record.id}</dd>

                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium text-xs">
                  {new Date(record.submissionDate).toLocaleDateString()}
                </dd>

                <dt className="text-muted-foreground">Status</dt>
                <dd
                  className={`font-medium text-xs ${
                    record.status === "approved"
                      ? "text-green-600"
                      : record.status === "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }`}
                >
                  {record.status.toUpperCase()}
                </dd>

                <dt className="text-muted-foreground">User Type</dt>
                <dd className="font-medium capitalize">{record.userType}</dd>
              </dl>
            </CardContent>
          </Card>

          {/* AI Extracted Data Comparison */}
          {record.userType !== "agency" && (
            <KYCExtractedDataComparison
              kycId={parseInt(record.id.replace("kyc_", ""))}
              isAgency={false}
            />
          )}
        </div>
      </div>

      {/* Full-screen Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={selectedImage}
            alt="Document"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Approve KYC Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to approve this KYC verification for{" "}
                {record.userName}?
              </p>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  className="w-full rounded border border-gray-200 p-3 text-sm resize-none h-24"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApproveModal(false);
                    setNotes("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject KYC Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please provide a reason for rejecting this KYC verification.
              </p>
              <div>
                <label className="text-sm font-medium mb-2 block text-red-600">
                  Rejection Reason (required) *
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain why this KYC is being rejected..."
                  className="w-full rounded border border-red-200 p-3 text-sm resize-none h-24 focus:border-red-400 focus:ring-red-400"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setNotes("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={actionLoading || !notes.trim()}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
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
