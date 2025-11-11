"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Users, Award } from "lucide-react";
import AgencyProfileHeader from "@/components/client/agencies/AgencyProfileHeader";
import AgencyStatsGrid from "@/components/client/agencies/AgencyStatsGrid";
import AgencyReviewsList from "@/components/client/agencies/AgencyReviewsList";
import InviteJobCreationModal from "@/components/client/jobs/InviteJobCreationModal";

interface Employee {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  rating: number | null;
}

interface AgencyProfile {
  agencyId: number;
  businessName: string;
  businessDesc: string | null;
  street_address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  contactNumber: string | null;
  kycStatus: string;
  stats: {
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    cancelledJobs: number;
    averageRating: number;
    totalReviews: number;
    onTimeCompletionRate: number;
    responseTime: string;
  };
  employees: Employee[];
  specializations: string[];
  createdAt: string;
}

export default function AgencyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const agencyId = params?.id as string;

  const [agency, setAgency] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHireModal, setShowHireModal] = useState(false);

  useEffect(() => {
    if (agencyId) {
      fetchAgencyProfile();
    }
  }, [agencyId]);

  const handleHireClick = () => {
    setShowHireModal(true);
  };

  const handleHireSuccess = (jobId: number) => {
    // Success handled in modal (shows alert and redirects)
    setShowHireModal(false);
  };

  const fetchAgencyProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/client/agencies/${agencyId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Agency not found");
        }
        throw new Error("Failed to fetch agency profile");
      }

      const data = await response.json();
      setAgency(data);
    } catch (err: any) {
      console.error("Error fetching agency profile:", err);
      setError(err.message || "Failed to load agency profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading agency profile...</p>
        </div>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error || "Agency not found"}</p>
          <button
            onClick={() => router.push("/client/agencies")}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Agencies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/client/agencies")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Agencies</span>
        </button>

        {/* Profile Header */}
        <div className="mb-6">
          <AgencyProfileHeader agency={agency} onHireClick={handleHireClick} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats and Employees */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <AgencyStatsGrid
              stats={agency.stats}
              employees={agency.employees}
            />

            {/* Specializations */}
            {agency.specializations.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Award className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Specializations
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {agency.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members */}
            {agency.employees.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Team Members
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agency.employees.map((employee) => (
                    <div
                      key={employee.employeeId}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-200 rounded-full h-12 w-12 flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {employee.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {employee.role}
                          </p>
                          {employee.rating && (
                            <p className="text-sm text-yellow-600">
                              ⭐ {employee.rating.toFixed(1)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Reviews */}
          <div className="lg:col-span-1">
            <AgencyReviewsList agencyId={agency.agencyId} />
          </div>
        </div>
      </div>

      {/* INVITE Job Creation Modal */}
      <InviteJobCreationModal
        agency={{
          agencyId: agency.agencyId,
          businessName: agency.businessName,
        }}
        isOpen={showHireModal}
        onClose={() => setShowHireModal(false)}
        onSuccess={handleHireSuccess}
      />
    </div>
  );
}
