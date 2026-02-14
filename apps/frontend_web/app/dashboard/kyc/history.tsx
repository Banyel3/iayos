"use client";

import React, { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api/config";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface KYCApplication {
  applicationId: number;
  status: "APPROVED" | "Rejected";
  submittedDate: string;
  reviewedDate: string;
  reason?: string;
}

interface KYCHistoryData {
  hasActiveKYC: boolean;
  activeKYCId: number | null;
  kycHistory: KYCApplication[];
  canResubmit: boolean;
  totalApplications: number;
}

export default function KYCHistory() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [historyData, setHistoryData] = useState<KYCHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);

  useEffect(() => {
    fetchKYCHistory();
  }, []);

  const fetchKYCHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/accounts/kyc/history`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch KYC history");
      }

      const data = await response.json();
      if (data.success) {
        setHistoryData(data);
      }
    } catch (error) {
      console.error("Error fetching KYC history:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load KYC history",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: "APPROVED" | "Rejected") => {
    if (status === "APPROVED") {
      return (
        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">Approved</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
          <XCircle className="w-4 h-4" />
          <span className="font-medium">Rejected</span>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading KYC history...</p>
        </div>
      </div>
    );
  }

  if (!historyData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          KYC Verification Status
        </h2>

        {historyData.hasActiveKYC && (
          <div className="flex items-center space-x-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <Clock className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">
                Application Pending Review
              </p>
              <p className="text-sm text-yellow-700">
                Your KYC application is currently being reviewed by our team.
              </p>
            </div>
          </div>
        )}

        {!historyData.hasActiveKYC && historyData.kycHistory.length === 0 && (
          <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-800">No KYC Application</p>
              <p className="text-sm text-blue-700">
                You haven't submitted a KYC application yet. Please submit your
                documents to get verified.
              </p>
            </div>
          </div>
        )}

        {!historyData.hasActiveKYC &&
          historyData.kycHistory.length > 0 &&
          historyData.kycHistory[0].status === "APPROVED" && (
            <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">KYC Verified</p>
                <p className="text-sm text-green-700">
                  Your identity has been successfully verified!
                </p>
              </div>
            </div>
          )}

        {!historyData.hasActiveKYC &&
          historyData.canResubmit &&
          historyData.kycHistory.length > 0 &&
          historyData.kycHistory[0].status === "Rejected" && (
            <div className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  Application Rejected
                </p>
                <p className="text-sm text-red-700">
                  Your last KYC application was rejected. You can resubmit with
                  updated documents.
                </p>
              </div>
            </div>
          )}
      </div>

      {/* Application History */}
      {historyData.kycHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Application History ({historyData.totalApplications})
          </h3>

          <div className="space-y-4">
            {historyData.kycHistory.map((app) => (
              <div
                key={app.applicationId}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {getStatusBadge(app.status)}

                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        Application #{app.applicationId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted: {formatDate(app.submittedDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Reviewed: {formatDate(app.reviewedDate)}
                      </p>
                    </div>
                  </div>

                  {app.reason && (
                    <button
                      onClick={() =>
                        setExpandedApp(
                          expandedApp === app.applicationId
                            ? null
                            : app.applicationId,
                        )
                      }
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {expandedApp === app.applicationId ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Reason */}
                {expandedApp === app.applicationId && app.reason && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Reason:
                    </p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {app.reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
