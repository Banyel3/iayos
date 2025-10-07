"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { Camera } from "react-camera-pro";
import { useToast } from "@/components/ui/toast";
import KYCHistory from "./history";
import NotificationBell from "@/components/notifications/NotificationBell";

interface KYCUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
  };
}

type IDType =
  | ""
  | "drivers_license"
  | "passport"
  | "national_id"
  | "umid"
  | "philhealth";

type ClearanceType = "" | "police" | "nbi";

const KYCPage = () => {
  const { user: authUser, isAuthenticated, isLoading } = useAuth();
  const user = authUser as KYCUser;
  const router = useRouter();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIDType, setSelectedIDType] = useState<IDType>("");
  const [selectedClearanceType, setSelectedClearanceType] =
    useState<ClearanceType>("");
  const [frontIDFile, setFrontIDFile] = useState<File | null>(null);
  const [backIDFile, setBackIDFile] = useState<File | null>(null);
  const [clearanceFile, setClearanceFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontIDPreview, setFrontIDPreview] = useState<string>("");
  const [backIDPreview, setBackIDPreview] = useState<string>("");
  const [clearancePreview, setClearancePreview] = useState<string>("");
  const [selfiePreview, setSelfiePreview] = useState<string>("");
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cameraRef = useRef<any>(null);

  // Helper function to normalize ID type for backend
  const normalizeIDType = (idType: IDType): string => {
    const mapping: Record<string, string> = {
      drivers_license: "DRIVERSLICENSE",
      passport: "PASSPORT",
      national_id: "NATIONALID",
      umid: "UMID",
      philhealth: "PHILHEALTH",
    };
    return mapping[idType] || idType.toUpperCase();
  };

  // Helper function to normalize clearance type for backend
  const normalizeClearanceType = (clearanceType: ClearanceType): string => {
    return clearanceType.toUpperCase();
  };

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
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

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Please upload an image file";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "File size must be less than 10MB";
    }

    return null;
  };

  const handleSubmit = async () => {
    // Validate required files
    if (
      !selectedIDType ||
      !selectedClearanceType ||
      !frontIDFile ||
      !backIDFile ||
      !clearanceFile ||
      !selfieFile
    ) {
      showToast({
        type: "warning",
        title: "Incomplete Submission",
        message: "Please complete all required fields and upload all documents",
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 🔥 Create FormData for file uploads (not JSON!)
      const formData = new FormData();

      // Add metadata with normalized values
      formData.append("accountID", user.accountID?.toString() || "");
      formData.append("IDType", normalizeIDType(selectedIDType));
      formData.append(
        "clearanceType",
        normalizeClearanceType(selectedClearanceType)
      );

      // 🔥 Append files with proper field names
      formData.append("frontID", frontIDFile);
      formData.append("backID", backIDFile);
      formData.append("clearance", clearanceFile);
      formData.append("selfie", selfieFile);

      console.log("📤 Uploading KYC documents...");

      const upload = await fetch(
        "http://localhost:8000/api/accounts/upload/kyc",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      ).catch((err) => {
        // Network error - backend not reachable
        console.error("❌ Network error:", err);
        throw new Error(
          "Cannot connect to server. Please check your internet connection."
        );
      });

      if (!upload) {
        throw new Error("No response from server");
      }

      if (!upload.ok) {
        const errorData = await upload.json().catch(() => ({}));
        console.error("❌ Upload failed:", errorData);

        // Extract error message from response
        let errorMsg = "Upload failed";

        if (upload.status === 401) {
          showToast({
            type: "error",
            title: "Authentication Required",
            message: "Your session has expired. Please log in again.",
            duration: 5000,
          });
          setTimeout(() => router.push("/auth/login"), 2000);
          return;
        } else if (upload.status === 413) {
          errorMsg =
            "One or more files are too large. Please reduce file size and try again.";
        } else if (upload.status === 400) {
          if (
            errorData.error &&
            Array.isArray(errorData.error) &&
            errorData.error[0]?.message
          ) {
            errorMsg = errorData.error[0].message;
          } else if (errorData.message) {
            errorMsg = errorData.message;
          } else {
            errorMsg = "Invalid file format or missing required data";
          }
        } else if (upload.status >= 500) {
          errorMsg = "Server error. Please try again later.";
        }

        throw new Error(errorMsg);
      }

      const result = await upload.json();
      console.log("✅ KYC upload successful:", result);

      showToast({
        type: "success",
        title: "Documents Uploaded",
        message: "Your KYC documents have been submitted successfully!",
        duration: 5000,
      });

      // 🔥 ONLY move to next step after successful upload
      handleNextStep();
    } catch (error) {
      console.error("❌ Error uploading KYC data:", error);

      // ✅ Safe error message extraction
      let errorMessage = "Failed to upload KYC data";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // Only show toast if we haven't already shown an auth error
      if (!errorMessage.includes("session has expired")) {
        showToast({
          type: "error",
          title: "Upload Failed",
          message: errorMessage,
          duration: 6000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back" | "clearance" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Use the validation function
    const validationError = validateFile(file);
    if (validationError) {
      showToast({
        type: "error",
        title: "Invalid File",
        message: validationError,
        duration: 4000,
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === "front") {
        setFrontIDFile(file);
        setFrontIDPreview(preview);
      } else if (type === "back") {
        setBackIDFile(file);
        setBackIDPreview(preview);
      } else if (type === "clearance") {
        setClearanceFile(file);
        setClearancePreview(preview);
      } else if (type === "selfie") {
        setSelfieFile(file);
        setSelfiePreview(preview);
      }
      // Preview appearing is enough feedback for successful upload
    };

    reader.onerror = () => {
      showToast({
        type: "error",
        title: "Upload Failed",
        message: "Failed to read file. Please try again.",
        duration: 4000,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleTakePhoto = () => {
    if (cameraRef.current) {
      const photo = cameraRef.current.takePhoto();
      setCapturedImage(photo);
    }
  };

  const handleAcceptPhoto = () => {
    // Convert base64 to file
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        setSelfieFile(file);
        setSelfiePreview(capturedImage);
        setShowCamera(false);
        setCapturedImage("");
        // Preview appearing is enough feedback for successful capture
      })
      .catch((error) => {
        console.error("Error converting photo:", error);
        showToast({
          type: "error",
          title: "Photo Error",
          message: "Failed to save photo. Please try again.",
          duration: 4000,
        });
      });
  };

  const handleRetakePhoto = () => {
    setCapturedImage("");
  };

  const handleOpenCamera = () => {
    setShowCamera(true);
    setCapturedImage("");
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setCapturedImage("");
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedIDType) {
        alert("Please select an ID type");
        return;
      }
      if (!frontIDFile || !backIDFile) {
        alert("Please upload both front and back of your ID");
        return;
      }
      if (!selectedClearanceType) {
        alert("Please select a clearance type");
        return;
      }
      if (!clearanceFile) {
        alert("Please upload your clearance document");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selfieFile) {
        alert("Please upload your selfie with ID");
        return;
      }
      // TODO: Submit to backend
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push("/dashboard/myRequests");
    }
  };

  const renderProgressBar = () => {
    const steps = 4;
    return (
      <div className="flex items-center justify-center space-x-2 mb-8">
        {Array.from({ length: steps }).map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index + 1 <= currentStep ? "bg-blue-500 w-12" : "bg-gray-300 w-8"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="text-center">
      {/* Icon */}
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
        Verify Your Account
      </h1>
      <p className="text-gray-600 mb-6">Help keep iAyos safe and trusted</p>

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
            Valid government ID (Driver&apos;s License, Passport, National ID,
            etc.)
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
            Valid clearance (Police Clearance or NBI Clearance)
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
        Upload Your Valid ID & Clearance
      </h1>
      <p className="text-gray-600 mb-8">
        Take clear photos in good light, with all corners visible.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - ID Upload */}
        <div className="text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Valid ID</h2>

          {/* ID Type Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose type of ID*
            </label>
            <select
              value={selectedIDType}
              onChange={(e) => setSelectedIDType(e.target.value as IDType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select ID type</option>
              <option value="drivers_license">Driver&apos;s License</option>
              <option value="passport">Passport</option>
              <option value="national_id">National ID (PhilSys)</option>
              <option value="umid">UMID</option>
              <option value="philhealth">PhilHealth ID</option>
            </select>
          </div>

          {/* Upload ID Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload ID*
            </label>

            {/* Front Side */}
            <div className="mb-4">
              <label
                htmlFor="frontID"
                className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
              >
                {frontIDPreview ? (
                  <div className="relative">
                    <Image
                      src={frontIDPreview}
                      alt="Front ID"
                      width={250}
                      height={150}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Front side uploaded ✓
                    </p>
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6 text-blue-500 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">
                      Upload Front Side
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG (Max 10MB)
                    </p>
                  </>
                )}
              </label>
              <input
                id="frontID"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "front")}
                className="hidden"
              />
            </div>

            {/* Back Side */}
            <div>
              <label
                htmlFor="backID"
                className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
              >
                {backIDPreview ? (
                  <div className="relative">
                    <Image
                      src={backIDPreview}
                      alt="Back ID"
                      width={250}
                      height={150}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Back side uploaded ✓
                    </p>
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6 text-blue-500 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">
                      Upload Back Side
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG (Max 10MB)
                    </p>
                  </>
                )}
              </label>
              <input
                id="backID"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "back")}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Clearance Upload */}
        <div className="text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Clearance Document
          </h2>

          {/* Clearance Type Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose type of Clearance*
            </label>
            <select
              value={selectedClearanceType}
              onChange={(e) =>
                setSelectedClearanceType(e.target.value as ClearanceType)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select clearance type</option>
              <option value="police">Police Clearance</option>
              <option value="nbi">NBI Clearance</option>
            </select>
          </div>

          {/* Upload Clearance */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Clearance*
            </label>
            <label
              htmlFor="clearanceDoc"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[200px] flex flex-col items-center justify-center"
            >
              {clearancePreview ? (
                <div className="relative">
                  <Image
                    src={clearancePreview}
                    alt="Clearance"
                    width={250}
                    height={200}
                    className="mx-auto rounded-lg object-cover"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Clearance uploaded ✓
                  </p>
                </div>
              ) : (
                <>
                  <svg
                    className="w-8 h-8 text-blue-500 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">
                    Upload Clearance Document
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG (Max 10MB)
                  </p>
                </>
              )}
            </label>
            <input
              id="clearanceDoc"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "clearance")}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleNextStep}
        className="w-full max-w-md mx-auto block mt-8 bg-blue-500 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        disabled={
          !selectedIDType ||
          !frontIDFile ||
          !backIDFile ||
          !selectedClearanceType ||
          !clearanceFile
        }
      >
        Continue
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Selfie with Your ID
      </h1>
      <p className="text-gray-600 mb-8">
        Take a clear photo of yourself holding your valid ID to confirm
        it&apos;s really you.
      </p>

      {/* Upload or Camera Options */}
      <div className="mb-8">
        {selfiePreview ? (
          <div className="mb-6">
            <div className="relative border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <Image
                src={selfiePreview}
                alt="Selfie with ID"
                width={300}
                height={300}
                className="mx-auto rounded-lg object-cover"
              />
              <p className="text-sm text-gray-600 mt-3">Photo captured ✓</p>
            </div>

            {/* Retake and Submit Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setSelfieFile(null);
                  setSelfiePreview("");
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-full text-base font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Retake
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Camera Button */}
            <button
              onClick={handleOpenCamera}
              className="w-full bg-blue-500 text-white px-8 py-4 rounded-lg text-base font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Take Photo with Camera</span>
            </button>

            {/* Or Divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Upload from File */}
            <label
              htmlFor="selfiePhoto"
              className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
            >
              <svg
                className="w-10 h-10 text-blue-500 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-base font-medium text-gray-700 mb-1">
                Upload from Device
              </p>
              <p className="text-sm text-gray-500">PNG, JPG (Max 10MB)</p>
            </label>
            <input
              id="selfiePhoto"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "selfie")}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            {/* Close Button */}
            <button
              onClick={handleCloseCamera}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
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
            </button>

            {/* Camera View or Captured Image */}
            <div className="bg-white rounded-2xl overflow-hidden">
              {capturedImage ? (
                <div className="relative">
                  <Image
                    src={capturedImage}
                    alt="Captured"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />

                  {/* Accept/Retake Buttons */}
                  <div className="p-6 flex gap-4">
                    <button
                      onClick={handleRetakePhoto}
                      className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-full text-base font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleAcceptPhoto}
                      className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Accept Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Camera
                    ref={cameraRef}
                    aspectRatio={4 / 3}
                    facingMode="user"
                    errorMessages={{
                      noCameraAccessible:
                        "No camera device accessible. Please connect your camera or try a different browser.",
                      permissionDenied:
                        "Permission denied. Please refresh and give camera permissions.",
                      switchCamera:
                        "It is not possible to switch camera to different one because there is only one video device accessible.",
                      canvas: "Canvas is not supported.",
                    }}
                  />

                  {/* Capture Button */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                    <button
                      onClick={handleTakePhoto}
                      className="mx-auto block w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-blue-500 transition-colors"
                    >
                      <div className="w-full h-full rounded-full bg-white"></div>
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="absolute top-4 left-0 right-0 text-center">
                    <div className="inline-block bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                      Hold your ID next to your face
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        We&apos;ll review your info within 24 hours.
      </h1>
      <p className="text-gray-600 mb-8">
        We&apos;ll notify you once your account is verified.
      </p>

      <button
        onClick={() => router.push("/dashboard/profile")}
        className="w-full bg-blue-500 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-blue-600 transition-colors"
      >
        Back to Profile
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Header with Logo */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Logo */}
          <h1 className="text-2xl font-bold text-gray-900">iAyos</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl space-y-6">
          {/* KYC History Section */}
          <KYCHistory />

          {/* KYC Submission Form */}
          <div className="w-full max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Progress Bar */}
            {renderProgressBar()}

            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCPage;
