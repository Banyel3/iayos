"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  FileText,
  User,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface KYCDocument {
  id: number;
  url: string;
  type: string;
  uploadedAt: string | null;
}

interface KYCHistory {
  action: string;
  reason: string | null;
  reviewedBy: string;
  reviewedAt: string;
}

interface KYCDetailData {
  kycType: "USER" | "AGENCY";
  kyc: {
    id: number;
    status: string;
    submittedAt: string | null;
    reviewedAt: string | null;
    businessName?: string;
    businessDescription?: string;
  };
  user: {
    id: number;
    email: string;
    name: string;
    type: string;
  };
  files: KYCDocument[];
  history: KYCHistory[];
}

interface KYCDetailModalProps {
  kycId: number;
  kycType: "USER" | "AGENCY";
  isOpen: boolean;
  onClose: () => void;
}

export default function KYCDetailModal({
  kycId,
  kycType,
  isOpen,
  onClose,
}: KYCDetailModalProps) {
  const [kycData, setKycData] = useState<KYCDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && kycId) {
      fetchKYCDetail();
    }
  }, [isOpen, kycId, kycType]);

  const fetchKYCDetail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/kyc/${kycId}?kyc_type=${kycType}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch KYC details");
      }

      const data = await response.json();
      if (data.success) {
        setKycData(data);
      } else {
        throw new Error(data.error || "Failed to load KYC details");
      }
    } catch (error) {
      console.error("Error fetching KYC detail:", error);
      showToast({
        type: "error",
        title: "Failed to Load",
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch KYC details",
        duration: 5000,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "Approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
      case "Rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FRONTID: "Front ID",
      BACKID: "Back ID",
      SELFIE: "Selfie Photo",
      CLEARANCE: "NBI Clearance",
      BUSINESS_PERMIT: "Business Permit",
      REP_ID_FRONT: "Representative ID (Front)",
      REP_ID_BACK: "Representative ID (Back)",
      ADDRESS_PROOF: "Address Proof",
      AUTH_LETTER: "Authorization Letter",
    };
    return labels[type] || type;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              KYC Submission Details
            </DialogTitle>
            <DialogDescription>
              View submitted documents and verification history
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading KYC details...</p>
              </div>
            </div>
          ) : kycData ? (
            <div className="space-y-6">
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  {kycData.kycType === "AGENCY" ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  {kycData.kycType === "AGENCY"
                    ? "Agency Information"
                    : "User Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{kycData.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {kycData.user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline">{kycData.user.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(kycData.kyc.status)}
                  </div>
                  {kycData.kycType === "AGENCY" && kycData.kyc.businessName && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Business Name
                        </p>
                        <p className="font-medium">{kycData.kyc.businessName}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">
                          Business Description
                        </p>
                        <p className="font-medium">
                          {kycData.kyc.businessDescription || "N/A"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Submission Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Submission Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Submitted At
                    </p>
                    <p className="font-medium">
                      {formatDate(kycData.kyc.submittedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed At</p>
                    <p className="font-medium">
                      {formatDate(kycData.kyc.reviewedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Submitted Documents ({kycData.files.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kycData.files.map((file) => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-3 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedImage(file.url)}
                    >
                      <div className="relative aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                        <img
                          src={file.url}
                          alt={getDocumentTypeLabel(file.type)}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="font-medium text-sm">
                        {getDocumentTypeLabel(file.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                  ))}
                </div>
                {kycData.files.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No documents found
                  </p>
                )}
              </div>

              {/* Verification History */}
              {kycData.history.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Verification History
                  </h3>
                  <div className="space-y-3">
                    {kycData.history.map((log, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-gray-300 pl-4 py-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {log.action === "APPROVED" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-semibold">{log.action}</span>
                          <span className="text-sm text-muted-foreground">
                            by {log.reviewedBy}
                          </span>
                        </div>
                        {log.reason && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Reason: {log.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.reviewedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load KYC details</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Full size document"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
