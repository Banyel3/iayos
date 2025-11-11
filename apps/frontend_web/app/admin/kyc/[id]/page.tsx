"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
} from "lucide-react";

interface KYCRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client";
  submissionDate: string;
  status: "pending" | "approved" | "rejected" | "under_review";
  documents: {
    idType: string;
    idNumber: string;
    frontImage: string;
    backImage: string;
    selfieImage: string;
  };
  verificationNotes?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
  comments?: string;
}

const mockKYCRecords: KYCRecord[] = [
  {
    id: "kyc_001",
    userId: "user_001",
    userName: "Juan Dela Cruz",
    userEmail: "juan@example.com",
    userType: "worker",
    submissionDate: "2024-01-15T10:30:00Z",
    status: "pending",
    documents: {
      idType: "National ID",
      idNumber: "1234-5678-9012",
      frontImage: "/uploads/id_front_001.jpg",
      backImage: "/uploads/id_back_001.jpg",
      selfieImage: "/uploads/selfie_001.jpg",
    },
  },
  {
    id: "kyc_002",
    userId: "user_002",
    userName: "Maria Santos",
    userEmail: "maria@example.com",
    userType: "worker",
    submissionDate: "2024-01-14T14:20:00Z",
    status: "approved",
    documents: {
      idType: "Driver's License",
      idNumber: "D12-34-567890",
      frontImage: "/uploads/id_front_002.jpg",
      backImage: "/uploads/id_back_002.jpg",
      selfieImage: "/uploads/selfie_002.jpg",
    },
    verificationNotes: "All documents verified successfully",
    reviewedBy: "Admin",
    reviewedDate: "2024-01-14T16:45:00Z",
  },
  {
    id: "kyc_003",
    userId: "user_003",
    userName: "Pedro Reyes",
    userEmail: "pedro@example.com",
    userType: "client",
    submissionDate: "2024-01-13T09:15:00Z",
    status: "rejected",
    documents: {
      idType: "Passport",
      idNumber: "P1234567",
      frontImage: "/uploads/id_front_003.jpg",
      backImage: "/uploads/id_back_003.jpg",
      selfieImage: "/uploads/selfie_003.jpg",
    },
    rejectionReason: "Blurry images - unable to verify identity",
    comments: "Please resubmit with clearer photos",
    reviewedBy: "Admin",
    reviewedDate: "2024-01-13T14:30:00Z",
  },
];

export default function KYCDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<KYCRecord | null>(null);

  useEffect(() => {
    const foundRecord = mockKYCRecords.find((r) => r.id === id);
    if (foundRecord) {
      setRecord(foundRecord);
    }
  }, [id]);

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading KYC details...</p>
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
                    `/admin/users/${record.userType === "worker" ? "workers" : "clients"}/${record.userId}`
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
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">ID Front</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {record.documents.frontImage}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">ID Back</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {record.documents.backImage}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Selfie</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {record.documents.selfieImage}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
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
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve KYC
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject KYC
                </Button>
                <div className="border-t pt-2 mt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Request More Info
                  </Button>
                </div>
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
        </div>
      </div>
    </div>
  );
}
