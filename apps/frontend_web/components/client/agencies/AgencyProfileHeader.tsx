'use client';

import { Building2, MapPin, Phone, Mail, Star, CheckCircle } from 'lucide-react';

interface AgencyProfileHeaderProps {
  agency: {
    businessName: string;
    businessDesc: string | null;
    street_address: string | null;
    city: string | null;
    province: string | null;
    contactNumber: string | null;
    kycStatus: string;
    stats: {
      averageRating: number;
      totalReviews: number;
      completedJobs: number;
    };
  };
  onHireClick: () => void;
}

export default function AgencyProfileHeader({ agency, onHireClick }: AgencyProfileHeaderProps) {
  const fullAddress = [
    agency.street_address,
    agency.city,
    agency.province
  ].filter(Boolean).join(', ') || 'Address not provided';

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
        {/* Left Section */}
        <div className="flex-1">
          <div className="flex items-start space-x-4">
            {/* Agency Icon */}
            <div className="bg-blue-100 p-4 rounded-full">
              <Building2 className="h-10 w-10 text-blue-600" />
            </div>

            <div className="flex-1">
              {/* Agency Name and Status */}
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {agency.businessName}
                </h1>
                {agency.kycStatus === 'APPROVED' && (
                  <span className="flex items-center space-x-1 bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xl font-semibold text-gray-900">
                    {agency.stats.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-600">
                  ({agency.stats.totalReviews} {agency.stats.totalReviews === 1 ? 'review' : 'reviews'})
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {agency.stats.completedJobs} jobs completed
                </span>
              </div>

              {/* Description */}
              {agency.businessDesc && (
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {agency.businessDesc}
                </p>
              )}

              {/* Contact Information */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{fullAddress}</span>
                </div>
                {agency.contactNumber && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{agency.contactNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Hire Button */}
        <div className="mt-6 md:mt-0 md:ml-8">
          <button
            onClick={onHireClick}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Hire This Agency
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center md:text-left">
            Send a direct job invitation
          </p>
        </div>
      </div>
    </div>
  );
}
