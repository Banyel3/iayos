"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { API_BASE } from "@/lib/api/config";
import {
  Brain,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Edit3,
  Eye,
} from "lucide-react";

interface ExtractedField {
  value: string | null;
  confidence: number;
  source: string;
}

interface ComparisonField {
  extracted: string | null;
  confirmed: string | null;
  confidence: number;
  was_edited: boolean;
}

interface ExtractedDataResponse {
  success: boolean;
  kyc_id: number;
  has_extracted_data: boolean;
  extraction_status?: "PENDING" | "EXTRACTED" | "CONFIRMED" | "FAILED";
  extraction_source?: string;
  overall_confidence?: number;
  comparison?: Record<string, ComparisonField>;
  autofill_fields?: Record<string, ExtractedField>;
  user_edited_fields?: string[];
  extracted_at?: string;
  confirmed_at?: string;
  message?: string;
  error?: string;
}

interface KYCExtractedDataComparisonProps {
  kycId: number;
  isAgency?: boolean;
}

// Field display configuration
const FIELD_LABELS: Record<string, string> = {
  full_name: "Full Name",
  first_name: "First Name",
  middle_name: "Middle Name",
  last_name: "Last Name",
  birth_date: "Date of Birth",
  address: "Address",
  id_number: "ID Number",
  nationality: "Nationality",
  sex: "Sex",
  document_type: "Document Type",
  place_of_birth: "Place of Birth",
  expiry_date: "Expiry Date",
  issue_date: "Issue Date",
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return "text-green-600";
  if (confidence >= 0.7) return "text-yellow-600";
  return "text-red-600";
};

const getConfidenceBg = (confidence: number): string => {
  if (confidence >= 0.9) return "bg-green-50";
  if (confidence >= 0.7) return "bg-yellow-50";
  return "bg-red-50";
};

const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 0.9) {
    return {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "High",
    };
  }
  if (confidence >= 0.7) {
    return {
      icon: AlertCircle,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      label: "Medium",
    };
  }
  return {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Low",
  };
};

export default function KYCExtractedDataComparison({
  kycId,
  isAgency = false,
}: KYCExtractedDataComparisonProps) {
  const [data, setData] = useState<ExtractedDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchExtractedData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/kyc/${kycId}/extracted-data`,
        { credentials: "include" },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err) {
      console.error("Error fetching extracted data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kycId) {
      fetchExtractedData();
    }
  }, [kycId]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Extracted Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading extracted data...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Extracted Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchExtractedData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data?.has_extracted_data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Extracted Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Brain className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-muted-foreground">
              {data?.message ||
                "No AI-extracted data available for this KYC record."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This may happen if documents haven't been processed yet or OCR
              failed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> User Confirmed
          </span>
        );
      case "EXTRACTED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
            <Eye className="h-3 w-3" /> Pending Review
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Extraction Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || "Unknown"}
          </span>
        );
    }
  };

  const overallConfidence = data.overall_confidence || 0;
  const confidenceBadge = getConfidenceBadge(overallConfidence);
  const ConfidenceIcon = confidenceBadge.icon;

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" />
            AI Extracted Data
          </CardTitle>
          {getStatusBadge(data.extraction_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Confidence */}
        <div className={`p-3 rounded-lg ${confidenceBadge.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ConfidenceIcon className={`h-5 w-5 ${confidenceBadge.color}`} />
              <span className="text-sm font-medium">Overall Confidence</span>
            </div>
            <span className={`text-lg font-bold ${confidenceBadge.color}`}>
              {Math.round(overallConfidence * 100)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {overallConfidence >= 0.9
              ? "High confidence - AI extraction is reliable"
              : overallConfidence >= 0.7
                ? "Medium confidence - Some fields may need manual review"
                : "Low confidence - Manual verification recommended"}
          </p>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          {data.extracted_at && (
            <div>
              <span className="font-medium">Extracted:</span>{" "}
              {new Date(data.extracted_at).toLocaleString()}
            </div>
          )}
          {data.confirmed_at && (
            <div>
              <span className="font-medium">Confirmed:</span>{" "}
              {new Date(data.confirmed_at).toLocaleString()}
            </div>
          )}
        </div>

        {/* User Edited Fields Notice */}
        {data.user_edited_fields && data.user_edited_fields.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Edit3 className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  User Modified {data.user_edited_fields.length} Field(s)
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {data.user_edited_fields
                    .map((f) => FIELD_LABELS[f] || f)
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Details Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide" : "Show"} Field Details
        </Button>

        {/* Comparison Table */}
        {showDetails && data.comparison && (
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-100 text-xs font-medium p-2 gap-2">
              <div className="col-span-3">Field</div>
              <div className="col-span-4">AI Extracted</div>
              <div className="col-span-4">User Confirmed</div>
              <div className="col-span-1">Score</div>
            </div>
            <div className="divide-y">
              {Object.entries(data.comparison).map(([fieldKey, field]) => {
                const label = FIELD_LABELS[fieldKey] || fieldKey;
                const wasEdited = field.was_edited;
                const confidence = field.confidence || 0;
                const badge = getConfidenceBadge(confidence);

                return (
                  <div
                    key={fieldKey}
                    className={`grid grid-cols-12 text-sm p-2 gap-2 ${
                      wasEdited ? "bg-yellow-50" : ""
                    }`}
                  >
                    <div className="col-span-3 font-medium text-gray-700 flex items-center gap-1">
                      {label}
                      {wasEdited && (
                        <Edit3 className="h-3 w-3 text-yellow-600" />
                      )}
                    </div>
                    <div className="col-span-4 text-gray-600">
                      {field.extracted || (
                        <span className="text-gray-400 italic">
                          Not detected
                        </span>
                      )}
                    </div>
                    <div
                      className={`col-span-4 ${
                        wasEdited
                          ? "text-blue-600 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {field.confirmed || (
                        <span className="text-gray-400 italic">
                          Not confirmed
                        </span>
                      )}
                    </div>
                    <div className="col-span-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.color}`}
                      >
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <Button variant="ghost" size="sm" onClick={fetchExtractedData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  );
}
