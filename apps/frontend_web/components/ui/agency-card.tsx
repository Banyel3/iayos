"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, MapPin, Briefcase, CheckCircle } from "lucide-react";
import type { AgencyListing } from "@/lib/api/jobs";

interface AgencyCardProps {
  agency: AgencyListing;
}

export default function AgencyCard({ agency }: AgencyCardProps) {
  const router = useRouter();

  const handleViewProfile = () => {
    router.push(`/dashboard/agencies/${agency.agencyId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-4">
        {/* Agency Header */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {agency.businessName.charAt(0).toUpperCase()}
            </div>
            {agency.kycStatus === "APPROVED" && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {agency.businessName}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {agency.averageRating !== null && agency.averageRating > 0 ? (
                <>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-900">
                      {agency.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({agency.totalReviews} reviews)
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">No reviews yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {agency.businessDesc && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {agency.businessDesc}
          </p>
        )}

        {/* Location */}
        {(agency.city || agency.province) && (
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="truncate">
              {[agency.city, agency.province].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Briefcase className="w-4 h-4 mr-1" />
              <span className="font-medium text-gray-900">
                {agency.completedJobs}
              </span>
              <span className="ml-1">completed</span>
            </div>
            {agency.activeJobs > 0 && (
              <div className="text-green-600">
                <span className="font-medium">{agency.activeJobs}</span>
                <span className="ml-1">active</span>
              </div>
            )}
          </div>
        </div>

        {/* Specializations */}
        {agency.specializations && agency.specializations.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {agency.specializations.slice(0, 3).map((spec, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {spec}
                </span>
              ))}
              {agency.specializations.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{agency.specializations.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleViewProfile}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Agency Profile
        </button>
      </div>
    </div>
  );
}
