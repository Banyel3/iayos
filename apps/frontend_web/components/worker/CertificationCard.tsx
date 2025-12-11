"use client";

import {
  Calendar,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/generic_button";
import type { CertificationData } from "@/lib/api/worker-profile";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

interface CertificationCardProps {
  certification: CertificationData;
  onEdit: (cert: CertificationData) => void;
  onDelete: (certId: number) => void;
}

export function CertificationCard({
  certification,
  onEdit,
  onDelete,
}: CertificationCardProps) {
  const expiryDate = certification.expiry_date
    ? new Date(certification.expiry_date)
    : null;
  const today = new Date();
  const daysUntilExpiry = expiryDate
    ? Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isExpired = expiryDate && expiryDate < today;
  const isExpiringSoon =
    daysUntilExpiry !== null && daysUntilExpiry <= 30 && !isExpired;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {certification.name}
            </h3>
            {certification.is_verified && (
              <Badge className="bg-green-50 text-green-700 border border-green-200 gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Approved
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {certification.issuing_organization}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-1 mb-3">
        {certification.issue_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Issued: {formatDate(certification.issue_date)}</span>
          </div>
        )}
        {expiryDate && certification.expiry_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span
              className={
                isExpired
                  ? "text-red-600"
                  : isExpiringSoon
                    ? "text-amber-600"
                    : "text-gray-600"
              }
            >
              Expires: {formatDate(certification.expiry_date)}
              {isExpired && " (Expired)"}
              {isExpiringSoon && ` (${daysUntilExpiry} days left)`}
            </span>
          </div>
        )}
      </div>

      {/* Warning Messages */}
      {(isExpired || isExpiringSoon) && (
        <div
          className={`flex items-start gap-2 p-3 rounded-md mb-3 ${
            isExpired ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"
          }`}
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            {isExpired
              ? "This certification has expired. Consider renewing it."
              : "This certification is expiring soon. Please renew it."}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(certification.certificate_url, "_blank")}
          className="flex-1"
        >
          View Certificate
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(certification)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(certification.certificationID)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
