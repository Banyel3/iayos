"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Users, Award } from "lucide-react";
import AgencyProfileHeader from "@/components/client/agencies/AgencyProfileHeader";
import AgencyStatsGrid from "@/components/client/agencies/AgencyStatsGrid";
import AgencyReviewsList from "@/components/client/agencies/AgencyReviewsList";
import InviteJobCreationModal from "@/components/client/jobs/InviteJobCreationModal";
import { fetchAgencyProfile, type AgencyProfile } from "@/lib/api/jobs";

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
      fetchAgencyProfileData();
    }
  }, [agencyId]);

  const handleHireClick = () => {
    setShowHireModal(true);
  };

  const handleHireSuccess = (jobId: number) => {
    // Success handled in modal (shows alert and redirects)
    setShowHireModal(false);
  };

  const fetchAgencyProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAgencyProfile(agencyId);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Agency Not Found
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/dashboard/home")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!agency) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Agency Profile Header */}
        <AgencyProfileHeader agency={agency} onHireClick={handleHireClick} />

        {/* Stats Grid - includes employees display */}
        <AgencyStatsGrid stats={agency.stats} employees={agency.employees} />

        {/* Reviews Section */}
        <AgencyReviewsList agencyId={agency.agencyId} />
      </div>

      {/* Hire Modal */}
      {showHireModal && agency && (
        <InviteJobCreationModal
          agency={{
            agencyId: agency.agencyId,
            businessName: agency.businessName,
          }}
          isOpen={showHireModal}
          onClose={() => setShowHireModal(false)}
          onSuccess={handleHireSuccess}
        />
      )}
    </div>
  );
}
