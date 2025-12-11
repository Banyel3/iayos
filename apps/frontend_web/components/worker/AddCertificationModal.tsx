"use client";

import { useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CertificationFormData) => void;
  isLoading?: boolean;
}

export interface CertificationFormData {
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  certificate_file: File;
}

export function AddCertificationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddCertificationModalProps) {
  const [formData, setFormData] = useState<Partial<CertificationFormData>>({
    name: "",
    issuing_organization: "",
    issue_date: "",
    expiry_date: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // For PDFs, we can't show a preview, but for images we can
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.issuing_organization ||
      !formData.issue_date ||
      !selectedFile
    ) {
      alert("Please fill in all required fields");
      return;
    }

    onSubmit({
      name: formData.name,
      issuing_organization: formData.issuing_organization,
      issue_date: formData.issue_date,
      expiry_date: formData.expiry_date || undefined,
      certificate_file: selectedFile,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      issuing_organization: "",
      issue_date: "",
      expiry_date: "",
    });
    setSelectedFile(null);
    setFilePreview("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add Certification</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Certification Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Certification Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Licensed Electrician"
              required
              disabled={isLoading}
            />
          </div>

          {/* Issuing Organization */}
          <div className="space-y-2">
            <Label htmlFor="organization">
              Issuing Organization <span className="text-red-500">*</span>
            </Label>
            <Input
              id="organization"
              value={formData.issuing_organization}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  issuing_organization: e.target.value,
                })
              }
              placeholder="e.g., Professional Regulation Commission"
              required
              disabled={isLoading}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">
                Issue Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issue_date}
                onChange={(e) =>
                  setFormData({ ...formData, issue_date: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">
                Expiry Date{" "}
                <span className="text-gray-500 text-sm">(Optional)</span>
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiry_date}
                onChange={(e) =>
                  setFormData({ ...formData, expiry_date: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">
              Certificate File <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {selectedFile
                    ? selectedFile.name
                    : "Click to upload PDF, JPG, or PNG (max 10MB)"}
                </span>
              </label>
              {filePreview && (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="mt-4 max-h-32 mx-auto rounded"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Add Certification"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
