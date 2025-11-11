'use client';

import Link from 'next/link';
import { Building2, MapPin, Star, Briefcase, Users } from 'lucide-react';

interface AgencyCardProps {
  agency: {
    agencyId: number;
    businessName: string;
    businessDesc: string | null;
    city: string | null;
    province: string | null;
    averageRating: number | null;
    totalReviews: number;
    completedJobs: number;
    activeJobs: number;
    kycStatus: string;
    specializations: string[];
  };
}

export default function AgencyCard({ agency }: AgencyCardProps) {
  const locationText = [agency.city, agency.province]
    .filter(Boolean)
    .join(', ') || 'Location not specified';

  return (
    <Link href={`/client/agencies/${agency.agencyId}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 cursor-pointer border border-gray-200 hover:border-blue-500">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {agency.businessName}
              </h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {locationText}
              </div>
            </div>
          </div>

          {/* KYC Badge */}
          {agency.kycStatus === 'APPROVED' && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
              Verified
            </span>
          )}
        </div>

        {/* Description */}
        {agency.businessDesc && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {agency.businessDesc}
          </p>
        )}

        {/* Specializations */}
        {agency.specializations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {agency.specializations.slice(0, 3).map((spec, idx) => (
              <span
                key={idx}
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {spec}
              </span>
            ))}
            {agency.specializations.length > 3 && (
              <span className="text-xs text-gray-500">
                +{agency.specializations.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Rating */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-gray-900">
                {agency.averageRating?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {agency.totalReviews} {agency.totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Completed Jobs */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Briefcase className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-900">
                {agency.completedJobs}
              </span>
            </div>
            <p className="text-xs text-gray-500">Completed</p>
          </div>

          {/* Active Jobs */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">
                {agency.activeJobs}
              </span>
            </div>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
