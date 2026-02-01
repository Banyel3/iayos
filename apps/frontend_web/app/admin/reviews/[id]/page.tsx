"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "../../components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Star,
  Flag,
  EyeOff,
  Eye,
  Trash2,
  User,
  Briefcase,
  ChevronRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface ReviewDetail {
  review: {
    id: number;
    rating: number;
    comment: string;
    created_at: string;
    is_flagged: boolean;
    is_hidden: boolean;
    status: string;
  };
  app: {
    version: string;
    platform: string;
    device_model: string;
    os_version: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    profile_type: string;
  };
  history: Array<{
    action: string;
    admin_id: number;
    admin_name: string;
    reason: string;
    timestamp: string;
  }>;
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;

  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchDetail = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/app-reviews/${reviewId}/detail`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Failed to fetch review");

      const data = await response.json();
      setDetail(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [reviewId]);

  const handleFlag = async (reason: string, severity: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/app-reviews/${reviewId}/flag`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason, severity }),
        },
      );

      if (!response.ok) throw new Error("Failed to flag review");

      alert("Review flagged successfully");
      fetchDetail();
      setShowFlagModal(false);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to flag review");
    }
  };

  const handleHide = async (reason: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/app-reviews/${reviewId}/hide`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason }),
        },
      );

      if (!response.ok) throw new Error("Failed to hide review");

      alert("Review hidden successfully");
      fetchDetail();
      setShowHideModal(false);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to hide review");
    }
  };

  const handleDelete = async (reason: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/app-reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason }),
        },
      );

      if (!response.ok) throw new Error("Failed to delete review");

      alert("Review deleted successfully");
      router.push("/admin/reviews");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete review");
    }
  };

  const handleRestore = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/app-reviews/${reviewId}/restore`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Failed to restore review");

      alert("Review restored successfully");
      fetchDetail();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to restore review");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading review details...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Review Not Found
                </h3>
                <Button
                  onClick={() => router.push("/admin/reviews")}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Back to Reviews
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="pl-72 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back Button */}
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Review Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Review Details
                    </h2>
                    <div className="flex gap-2">
                      {detail.review.is_flagged && (
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          🚩 Flagged
                        </Badge>
                      )}
                      {detail.review.is_hidden && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                          👁️ Hidden
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-8 w-8 ${i < detail.review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                            }`}
                        />
                      ))}
                      <span className="text-3xl font-bold text-gray-900">
                        {detail.review.rating}.0
                      </span>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {detail.review.comment}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    Posted on{" "}
                    {new Date(detail.review.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              {/* App Info */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      App Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Version</p>
                        <p className="font-medium text-gray-900">
                          v{detail.app.version}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Platform</p>
                        <p className="font-medium text-gray-900">
                          {detail.app.platform === "ios"
                            ? "🍎 iOS"
                            : "🤖 Android"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Device</p>
                        <p className="font-medium text-gray-900">
                          {detail.app.device_model}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">OS Version</p>
                        <p className="font-medium text-gray-900">
                          {detail.app.os_version}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action History */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Action History
                  </h3>
                  {(detail.history ?? []).length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      No actions taken yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {(detail.history ?? []).map((item, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-lg"
                        >
                          <p className="font-semibold text-gray-900">
                            {item.action}
                          </p>
                          <p className="text-sm text-gray-600">
                            By: {item.admin_name}
                          </p>
                          {item.reason && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Reason:</span>{" "}
                              {item.reason}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* User Info */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      User
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {detail.user.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {detail.user.email}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {detail.user.profile_type}
                    </Badge>
                    <Link
                      href={`/admin/users/${detail.user.profile_type.toLowerCase()}s/${detail.user.id}`}
                    >
                      <Button
                        variant="outline"
                        className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        View Profile
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Moderation Actions */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Moderation Actions
                  </h3>
                  <div className="space-y-3">
                    {!detail.review.is_flagged && (
                      <Button
                        onClick={() => setShowFlagModal(true)}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Flag Review
                      </Button>
                    )}

                    {!detail.review.is_hidden ? (
                      <Button
                        onClick={() => setShowHideModal(true)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Review
                      </Button>
                    ) : (
                      <Button
                        onClick={handleRestore}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Restore Review
                      </Button>
                    )}

                    <Button
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showFlagModal && (
          <FlagModal
            onConfirm={handleFlag}
            onCancel={() => setShowFlagModal(false)}
          />
        )}

        {showHideModal && (
          <HideModal
            onConfirm={handleHide}
            onCancel={() => setShowHideModal(false)}
          />
        )}

        {showDeleteModal && (
          <DeleteModal
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </main>
    </div>
  );
}

// Modal Components
function FlagModal({ onConfirm, onCancel }: any) {
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState("medium");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-gray-900">Flag Review</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for flagging..."
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          rows={4}
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
        >
          <option value="low">🟢 Low Severity</option>
          <option value="medium">🟡 Medium Severity</option>
          <option value="high">🔴 High Severity</option>
        </select>
        <div className="flex gap-3">
          <Button
            onClick={() => onConfirm(reason, severity)}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white h-12 rounded-xl"
          >
            Flag Review
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-2 border-gray-300 hover:bg-gray-50 h-12 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function HideModal({ onConfirm, onCancel }: any) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-gray-900">Hide Review</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for hiding..."
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          rows={4}
        />
        <div className="flex gap-3">
          <Button
            onClick={() => onConfirm(reason)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-12 rounded-xl"
          >
            Hide Review
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-2 border-gray-300 hover:bg-gray-50 h-12 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel }: any) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <h3 className="text-2xl font-bold text-red-600">
            Delete Review Permanently
          </h3>
        </div>
        <p className="text-gray-600 mb-6">
          This action cannot be undone. The review will be permanently deleted
          from the system.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for deletion..."
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 focus:border-red-500 focus:ring-2 focus:ring-red-200"
          rows={4}
        />
        <div className="flex gap-3">
          <Button
            onClick={() => onConfirm(reason)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl"
          >
            Delete Permanently
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-2 border-gray-300 hover:bg-gray-50 h-12 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
