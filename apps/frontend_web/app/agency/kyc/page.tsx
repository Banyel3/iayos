"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/form_button";

interface KYCUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
  };
}

const AgencyKYCPage = () => {
  const { user: authUser, isAuthenticated, isLoading } = useAuth();
  const user = authUser as KYCUser;
  const router = useRouter();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  // Files
  const [businessPermit, setBusinessPermit] = useState<File | null>(null);
  const [repIDFront, setRepIDFront] = useState<File | null>(null);
  const [repIDBack, setRepIDBack] = useState<File | null>(null);
  const [addressProof, setAddressProof] = useState<File | null>(null);
  const [authLetterFile, setAuthLetterFile] = useState<File | null>(null);

  // Previews
  const [permitPreview, setPermitPreview] = useState("");
  const [repFrontPreview, setRepFrontPreview] = useState("");
  const [repBackPreview, setRepBackPreview] = useState("");
  const [addressPreview, setAddressPreview] = useState("");
  const [authLetterPreview, setAuthLetterPreview] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agencyKycStatus, setAgencyKycStatus] = useState<string | null>(null);
  const [agencyKycFiles, setAgencyKycFiles] = useState<any[]>([]);
  const [agencyKycNotes, setAgencyKycNotes] = useState<string | null>(null);

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // If authenticated, fetch agency KYC status to prevent duplicate submissions
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/agency/status`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const status = data?.status || data?.kycStatus || null;
        if (status) {
          setAgencyKycStatus(status);
          if (data?.files) setAgencyKycFiles(data.files || []);
          if (data?.notes) setAgencyKycNotes(data.notes || null);
          // If KYC already exists (pending/approved/rejected), show review wall
          if (status !== "NOT_STARTED") {
            setCurrentStep(4);
          }
        }
      } catch (err) {
        console.error("Failed to fetch agency kyc status", err);
      }
    };

    if (!isLoading && isAuthenticated) fetchStatus();
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const validateFile = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return "Please upload an image or PDF file";
    }
    if (file.size > 15 * 1024 * 1024) {
      return "File size must be less than 15MB";
    }
    return null;
  };

  const handleFilePreview = (
    file: File | null,
    setter: (s: string) => void
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePermitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });
    setBusinessPermit(f);
    handleFilePreview(f, setPermitPreview);
  };

  const handleRepFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });
    setRepIDFront(f);
    handleFilePreview(f, setRepFrontPreview);
  };

  const handleRepBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });
    setRepIDBack(f);
    handleFilePreview(f, setRepBackPreview);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });
    setAddressProof(f);
    handleFilePreview(f, setAddressPreview);
  };

  const handleAuthLetterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });
    setAuthLetterFile(f);
    handleFilePreview(f, setAuthLetterPreview);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back" | "permit" | "address" | "authLetter"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });

    if (type === "permit") {
      setBusinessPermit(file);
      handleFilePreview(file, setPermitPreview);
    } else if (type === "front") {
      setRepIDFront(file);
      handleFilePreview(file, setRepFrontPreview);
    } else if (type === "back") {
      setRepIDBack(file);
      handleFilePreview(file, setRepBackPreview);
    } else if (type === "address") {
      setAddressProof(file);
      handleFilePreview(file, setAddressPreview);
    } else if (type === "authLetter") {
      setAuthLetterFile(file);
      handleFilePreview(file, setAuthLetterPreview);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) setCurrentStep(2);
    else if (currentStep === 2) {
      if (!repIDFront || !repIDBack)
        return showToast({
          type: "warning",
          title: "Missing ID",
          message: "Please upload both front and back of authorized rep ID",
        });
      if (!businessPermit)
        return showToast({
          type: "warning",
          title: "Missing Document",
          message: "Please upload business permit",
        });
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!authLetterFile)
        return showToast({
          type: "warning",
          title: "Missing Authorization Letter",
          message:
            "Please upload an authorization letter on company letterhead",
        });
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.push("/agency/dashboard");
  };

  const handleSubmit = async () => {
    if (
      !businessName ||
      !registrationNumber ||
      !businessPermit ||
      !repIDFront ||
      !repIDBack ||
      !addressProof ||
      !authLetterFile
    ) {
      showToast({
        type: "warning",
        title: "Incomplete",
        message: "Please complete all required fields and uploads",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      // align field names with backend agency KYC endpoint
      formData.append("businessName", businessName);
      formData.append("businessDesc", businessDesc);
      formData.append("registrationNumber", registrationNumber);
      formData.append("rep_front", repIDFront as Blob);
      formData.append("rep_back", repIDBack as Blob);
      formData.append("business_permit", businessPermit as Blob);
      formData.append("address_proof", addressProof as Blob);
      formData.append("auth_letter", authLetterFile as Blob);

      const API_BASE =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const upload = await fetch(`${API_BASE}/api/agency/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!upload.ok) {
        const data = await upload.json().catch(() => ({}));
        let msg = data?.message || "Upload failed";
        if (upload.status === 413) msg = "One or more files are too large";
        showToast({ type: "error", title: "Upload failed", message: msg });
        setIsSubmitting(false);
        return;
      }

      showToast({
        type: "success",
        title: "Submitted",
        message: "KYC submitted",
      });
      // Refresh status after upload to trigger verification wall
      try {
        const res = await fetch(`${API_BASE}/api/agency/status`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const status = data?.status || data?.kycStatus || null;
          setAgencyKycStatus(status);
          if (data?.files) setAgencyKycFiles(data.files || []);
          if (status && status !== "NOT_STARTED") {
            setCurrentStep(4);
          }
        } else {
          setCurrentStep(4); // fallback
        }
      } catch {
        setCurrentStep(4); // fallback
      }
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to submit KYC",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => {
    const steps = 4;
    return (
      <div className="flex items-center justify-center space-x-2 mb-8">
        {Array.from({ length: steps }).map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${index + 1 <= currentStep ? "bg-blue-500 w-12" : "bg-gray-300 w-8"}`}
          />
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="text-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-12 h-12 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Verify Your Agency
      </h1>
      <p className="text-gray-600 mb-6">
        Provide your business documents to verify your agency account.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          What to prepare:
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Business registration (SEC / DTI / Mayor's permit)
          </li>
          <li className="flex items-start text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Authorized representative ID (front & back)
          </li>
          <li className="flex items-start text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Proof of business address
          </li>
        </ul>
      </div>

      <button
        onClick={handleNextStep}
        className="w-full max-w-md bg-blue-500 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-blue-600 transition-colors"
      >
        Get Started
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="text-center max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Upload Business Documents & Rep ID
      </h1>
      <p className="text-gray-600 mb-8">
        Take clear photos or upload PDFs. Ensure all corners are visible.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Business Details
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business name <span className="text-red-500">*</span>
            </label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration number <span className="text-red-500">*</span>
            </label>
            <Input
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business permit / SEC / DTI (PDF or image)
            </label>
            <label
              htmlFor="permitUpload"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center"
            >
              {permitPreview ? (
                <div>
                  <Image
                    src={permitPreview}
                    alt="Permit"
                    width={300}
                    height={180}
                    className="mx-auto rounded-lg object-cover"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Permit uploaded ✓
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload business permit (PDF or image){" "}
                    <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, PDF (Max 15MB)
                  </p>
                </div>
              )}
            </label>
            <input
              id="permitUpload"
              type="file"
              accept="image/*,.pdf"
              onChange={handlePermitChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Authorized Representative ID
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Front side
            </label>
            <label
              htmlFor="repFront"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center"
            >
              {repFrontPreview ? (
                <Image
                  src={repFrontPreview}
                  alt="Rep front"
                  width={250}
                  height={150}
                  className="mx-auto rounded-lg object-cover"
                />
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload front side <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG (Max 15MB)</p>
                </div>
              )}
            </label>
            <input
              id="repFront"
              type="file"
              accept="image/*"
              onChange={handleRepFrontChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Back side
            </label>
            <label
              htmlFor="repBack"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center"
            >
              {repBackPreview ? (
                <Image
                  src={repBackPreview}
                  alt="Rep back"
                  width={250}
                  height={150}
                  className="mx-auto rounded-lg object-cover"
                />
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload back side <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG (Max 15MB)</p>
                </div>
              )}
            </label>
            <input
              id="repBack"
              type="file"
              accept="image/*"
              onChange={handleRepBackChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-8">
        <Button onClick={handleNextStep}>Continue</Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Proof of Address & Authorization Letter
      </h1>
      <p className="text-gray-600 mb-6">
        Upload proof of business address and a signed authorization letter on
        company letterhead.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Proof of business address (image or PDF)
        </label>
        <label
          htmlFor="addressUpload"
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center"
        >
          {addressPreview ? (
            <Image
              src={addressPreview}
              alt="Address"
              width={300}
              height={160}
              className="mx-auto rounded-lg object-cover"
            />
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700">
                Upload proof of address
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, PDF (Max 15MB)
              </p>
            </div>
          )}
        </label>
        <input
          id="addressUpload"
          type="file"
          accept="image/*,.pdf"
          onChange={handleAddressChange}
          className="hidden"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Authorization letter (signed on company letterhead)
        </label>
        <label
          htmlFor="authLetterUpload"
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center"
        >
          {authLetterPreview ? (
            <Image
              src={authLetterPreview}
              alt="Authorization letter"
              width={300}
              height={200}
              className="mx-auto rounded-lg object-cover"
            />
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700">
                Upload signed authorization letter (PDF or image){" "}
                <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, PNG, JPG (Max 15MB)
              </p>
            </div>
          )}
        </label>
        <input
          id="authLetterUpload"
          type="file"
          accept="image/*,.pdf"
          onChange={handleAuthLetterChange}
          className="hidden"
        />
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button onClick={handleSubmit} className="bg-blue-500 text-white">
          Submit
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">KYC Submission</h1>

      {agencyKycStatus ? (
        <div className="mb-4">
          <p className="text-sm text-gray-700">
            Current status:{" "}
            <strong className="capitalize">{agencyKycStatus}</strong>
          </p>
          {agencyKycStatus &&
            agencyKycStatus.toUpperCase() === "REJECTED" &&
            agencyKycNotes && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-800">
                <strong className="block mb-1">Reviewer notes:</strong>
                <div>{agencyKycNotes}</div>
              </div>
            )}
          <p className="text-xs text-muted-foreground mt-2">
            You cannot submit another KYC while a submission is active. Contact
            support if you need to update your documents.
          </p>
        </div>
      ) : (
        <p className="text-gray-600 mb-6">
          Our team will review your documents and notify you once verified.
        </p>
      )}

      {agencyKycFiles && agencyKycFiles.length > 0 && (
        <div className="mb-6 text-left">
          <h3 className="text-sm font-semibold mb-2">Submitted files</h3>
          <ul className="space-y-2 text-sm">
            {agencyKycFiles.map((f, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="truncate">
                  {f.file_name || f.fileName || f.fileName}
                </span>
                {f.file_url || f.fileURL ? (
                  <a
                    href={f.file_url || f.fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-xs"
                  >
                    View
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => router.push("/agency/dashboard")}
        className="w-full bg-blue-500 text-white px-8 py-3 rounded-full"
      >
        Go to dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl space-y-6">
          <div className="w-full max-w-2xl mx-auto">
            {renderProgressBar()}

            <div className="relative bg-white rounded-2xl shadow-lg p-8 lg:p-12">
              {isSubmitting && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 rounded-2xl">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <div className="text-blue-700 font-medium text-base">
                    Uploading your documents...
                  </div>
                </div>
              )}
              <div
                className={
                  isSubmitting
                    ? "opacity-50 pointer-events-none select-none"
                    : ""
                }
              >
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyKYCPage;
