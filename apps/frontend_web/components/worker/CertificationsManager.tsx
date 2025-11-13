"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/generic_button";
import {
  useCertifications,
  useAddCertification,
  useDeleteCertification,
} from "@/lib/hooks/useWorkerProfile";
import type { CertificationData } from "@/lib/api/worker-profile";
import { CertificationCard } from "./CertificationCard";
import {
  AddCertificationModal,
  type CertificationFormData,
} from "./AddCertificationModal";

export function CertificationsManager() {
  const { data: certifications, isLoading, error } = useCertifications();
  const addCertification = useAddCertification();
  const deleteCertification = useDeleteCertification();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleAddCertification = (formData: CertificationFormData) => {
    addCertification.mutate(formData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
      },
    });
  };

  const handleDeleteClick = (certId: number) => {
    setDeleteConfirmId(certId);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId !== null) {
      deleteCertification.mutate(deleteConfirmId, {
        onSuccess: () => {
          setDeleteConfirmId(null);
        },
      });
    }
  };

  const handleEdit = (cert: CertificationData) => {
    // TODO: Implement edit functionality with EditCertificationModal
    console.log("Edit certification:", cert);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">Failed to load certifications</p>
        <p className="text-sm text-red-600 mt-2">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Your Certifications
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {certifications?.length || 0} certification
            {certifications?.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Certification
        </Button>
      </div>

      {/* Certifications Grid */}
      {certifications && certifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <CertificationCard
              key={cert.certificationID}
              certification={cert}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-4">No certifications uploaded yet</p>
          <p className="text-sm text-gray-500 mb-6">
            Boost your profile by adding professional certifications
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Certification
          </Button>
        </div>
      )}

      {/* Add Certification Modal */}
      <AddCertificationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCertification}
        isLoading={addCertification.isPending}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold mb-2">
              Delete Certification?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this certification? This action
              cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteCertification.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteCertification.isPending}
                className="flex-1"
              >
                {deleteCertification.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
