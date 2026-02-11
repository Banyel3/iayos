"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import {
  User,
  Building2,
  FileText,
  Calendar,
  MapPin,
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/generic_button";

interface IndividualConfirmedData {
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  birth_date?: string;
  address?: string;
  id_number?: string;
  nationality?: string;
  sex?: string;
  place_of_birth?: string;
  clearance_number?: string;
  clearance_type?: string;
  clearance_issue_date?: string;
  clearance_validity_date?: string;
}

interface AgencyConfirmedData {
  business_name?: string;
  business_type?: string;
  business_address?: string;
  permit_number?: string;
  permit_issue_date?: string;
  permit_expiry_date?: string;
  dti_number?: string;
  sec_number?: string;
  tin?: string;
  rep_full_name?: string;
  rep_id_number?: string;
  rep_birth_date?: string;
  rep_address?: string;
}

interface UserSubmittedDataSectionProps {
  kycId: number;
  isAgency: boolean;
}

// Field labels for individual KYC
const INDIVIDUAL_FIELD_LABELS: Record<string, { label: string; icon: typeof User }> = {
  full_name: { label: "Full Name", icon: User },
  first_name: { label: "First Name", icon: User },
  middle_name: { label: "Middle Name", icon: User },
  last_name: { label: "Last Name", icon: User },
  birth_date: { label: "Date of Birth", icon: Calendar },
  address: { label: "Address", icon: MapPin },
  id_number: { label: "ID Number", icon: CreditCard },
  nationality: { label: "Nationality", icon: User },
  sex: { label: "Sex", icon: User },
  place_of_birth: { label: "Place of Birth", icon: MapPin },
  clearance_number: { label: "Clearance Number", icon: FileText },
  clearance_type: { label: "Clearance Type", icon: FileText },
  clearance_issue_date: { label: "Clearance Issue Date", icon: Calendar },
  clearance_validity_date: { label: "Clearance Validity Date", icon: Calendar },
};

// Field labels for agency KYC
const AGENCY_FIELD_LABELS: Record<string, { label: string; icon: typeof Building2 }> = {
  business_name: { label: "Business Name", icon: Building2 },
  business_type: { label: "Business Type", icon: Building2 },
  business_address: { label: "Business Address", icon: MapPin },
  permit_number: { label: "Permit Number", icon: FileText },
  permit_issue_date: { label: "Permit Issue Date", icon: Calendar },
  permit_expiry_date: { label: "Permit Expiry Date", icon: Calendar },
  dti_number: { label: "DTI Number", icon: FileText },
  sec_number: { label: "SEC Number", icon: FileText },
  tin: { label: "TIN", icon: CreditCard },
  rep_full_name: { label: "Representative Name", icon: User },
  rep_id_number: { label: "Representative ID Number", icon: CreditCard },
  rep_birth_date: { label: "Representative Birth Date", icon: Calendar },
  rep_address: { label: "Representative Address", icon: MapPin },
};

// Format field value for display
const formatValue = (key: string, value: string | undefined): string => {
  if (!value || value === "") return "—";
  
  // Format dates
  if (key.includes("date") || key.includes("birth")) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch {
      return value;
    }
  }
  
  // Format clearance type
  if (key === "clearance_type") {
    const types: Record<string, string> = {
      NBI: "NBI Clearance",
      POLICE: "Police Clearance",
      BARANGAY: "Barangay Clearance",
      NONE: "None",
    };
    return types[value] || value;
  }
  
  // Format business type
  if (key === "business_type") {
    const types: Record<string, string> = {
      SOLE_PROPRIETORSHIP: "Sole Proprietorship",
      PARTNERSHIP: "Partnership",
      CORPORATION: "Corporation",
      COOPERATIVE: "Cooperative",
    };
    return types[value] || value;
  }
  
  return value;
};

export default function UserSubmittedDataSection({
  kycId,
  isAgency,
}: UserSubmittedDataSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmedData, setConfirmedData] = useState<IndividualConfirmedData | AgencyConfirmedData | null>(null);
  const [hasData, setHasData] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string>("");
  const [userEditedFields, setUserEditedFields] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = isAgency
        ? `${API_BASE}/api/adminpanel/kyc/agency/${kycId}/extracted-data`
        : `${API_BASE}/api/adminpanel/kyc/${kycId}/extracted-data`;

      const response = await fetch(endpoint, { credentials: "include" });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      setHasData(result.has_extracted_data);
      setExtractionStatus(result.extraction_status || "");
      setUserEditedFields(result.user_edited_fields || []);

      if (result.has_extracted_data) {
        if (isAgency) {
          // Agency: use confirmed object directly
          setConfirmedData(result.confirmed || {});
        } else {
          // Individual: extract values from comparison structure
          // API returns { comparison: { extracted: {...}, confirmed: {...} } }
          const comparison = result.comparison || {};
          const extractedValues = comparison.extracted || {};
          const confirmedValues = comparison.confirmed || {};
          const confirmed: IndividualConfirmedData = {};
          
          // For each field, prefer confirmed value, fall back to extracted
          const fieldKeys = [
            "full_name", "first_name", "middle_name", "last_name",
            "birth_date", "address", "id_number", "nationality", "sex",
            "place_of_birth", "clearance_number", "clearance_type",
            "clearance_issue_date", "clearance_validity_date"
          ];
          
          fieldKeys.forEach((key) => {
            const confirmedVal = confirmedValues[key];
            const extractedVal = extractedValues[key];
            // Use confirmed if it has a value, otherwise use extracted
            confirmed[key as keyof IndividualConfirmedData] = 
              (confirmedVal && confirmedVal !== "" && confirmedVal !== "NONE") 
                ? confirmedVal 
                : (extractedVal || "");
          });
          
          setConfirmedData(confirmed);
        }
      }
    } catch (err) {
      console.error("Error fetching user submitted data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kycId) {
      fetchData();
    }
  }, [kycId, isAgency]);

  // Loading state
  if (loading) {
    return (
      <div className="border-t pt-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          User Submitted Data
        </h3>
        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-muted-foreground">Loading submitted data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border-t pt-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          User Submitted Data
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!hasData || !confirmedData) {
    return (
      <div className="border-t pt-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          User Submitted Data
        </h3>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-muted-foreground">No submitted form data available</p>
          <p className="text-sm text-muted-foreground mt-1">
            The user may not have completed the data confirmation step.
          </p>
        </div>
      </div>
    );
  }

  // Determine which fields to display
  const fieldLabels = isAgency ? AGENCY_FIELD_LABELS : INDIVIDUAL_FIELD_LABELS;
  const fieldsToShow = Object.entries(fieldLabels).filter(([key]) => {
    const value = (confirmedData as Record<string, string>)[key];
    return value && value !== "" && value !== "NONE";
  });

  // Status badge
  const getStatusBadge = () => {
    if (extractionStatus === "CONFIRMED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3" />
          User Confirmed
        </span>
      );
    }
    if (extractionStatus === "EXTRACTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <AlertCircle className="h-3 w-3" />
          Pending Confirmation
        </span>
      );
    }
    return null;
  };

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          User Submitted Data
        </h3>
        {getStatusBadge()}
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Compare this data with the uploaded documents above to verify accuracy.
        {userEditedFields.length > 0 && (
          <span className="ml-1 text-blue-600">
            User edited {userEditedFields.length} field(s).
          </span>
        )}
      </p>

      {fieldsToShow.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No form data was submitted</p>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldsToShow.map(([key, config]) => {
              const value = (confirmedData as Record<string, string>)[key];
              const isEdited = userEditedFields.includes(key);
              const IconComponent = config.icon;
              
              return (
                <div
                  key={key}
                  className={`bg-white rounded-lg p-3 border ${
                    isEdited ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <IconComponent className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {config.label}
                        {isEdited && (
                          <span className="text-blue-600 text-[10px]">(edited)</span>
                        )}
                      </p>
                      <p className="font-medium text-sm break-words">
                        {formatValue(key, value)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
