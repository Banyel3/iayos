"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useWorkerAvailability } from "@/lib/hooks/useWorkerAvailability";

interface ProfileData {
  firstName: string;
  lastName: string;
  profileImg: string;
  profileType: "WORKER" | "CLIENT" | null;
  contactNum: string | null;
  birthDate: string | null;
}

interface UserData {
  accountID: number;
  email: string;
  role: string | null;
  profile_data: ProfileData | null;
}

const EditProfilePage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Use the worker availability hook
  const isWorker = authUser?.profile_data?.profileType === "WORKER";
  const {
    isAvailable,
    isLoading: isLoadingAvailability,
    handleAvailabilityToggle,
  } = useWorkerAvailability(isWorker, isAuthenticated);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNum: "",
    birthDate: "",
    profileImg: "",
  });

  const [profilePreview, setProfilePreview] = useState<string>("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch user data from /me API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsFetching(true);
        const response = await fetch("http://localhost:8000/api/accounts/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data: UserData = await response.json();

        // Populate form with fetched data
        setFormData({
          firstName: data.profile_data?.firstName || "",
          lastName: data.profile_data?.lastName || "",
          email: data.email || "",
          contactNum: data.profile_data?.contactNum || "",
          birthDate: data.profile_data?.birthDate || "", // Not in current API response
          profileImg: data.profile_data?.profileImg || "",
        });

        if (data.profile_data?.profileImg) {
          setProfilePreview(data.profile_data.profileImg);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Failed to load profile data");
      } finally {
        setIsFetching(false);
      }
    };

    if (isAuthenticated && !isLoading) {
      fetchUserData();
    }
  }, [isAuthenticated, isLoading]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Store the file for upload
    setSelectedImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload profile image to backend
  const uploadProfileImage = async (): Promise<string | null> => {
    if (!selectedImageFile) return null;

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("profile_image", selectedImageFile);

      const response = await fetch(
        "http://localhost:8000/api/accounts/upload/profile-image",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const result = await response.json();
      console.log("✅ Profile image uploaded:", result);

      return result.image_url;
    } catch (error) {
      console.error("❌ Error uploading profile image:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload profile image"
      );
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle save (placeholder - backend not implemented yet)
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Upload profile image if a new one was selected
      if (selectedImageFile) {
        console.log("📤 Uploading profile image...");
        const imageUrl = await uploadProfileImage();

        if (imageUrl) {
          // Update form data with new image URL
          setFormData((prev) => ({
            ...prev,
            profileImg: imageUrl,
          }));
          console.log("✅ Profile image uploaded successfully:", imageUrl);
          alert("Profile image updated successfully!");
        } else {
          alert("Failed to upload profile image");
          setIsSaving(false);
          return;
        }
      }

      // TODO: Implement other profile field updates when backend is ready
      console.log("Form data to save:", formData);

      // Redirect to profile page after successful save
      router.push("/dashboard/profile");
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/dashboard/profile");
  };

  // Loading state
  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Desktop Navbar */}
      <DesktopNavbar
        isWorker={isWorker}
        userName={formData.firstName || "User"}
        userAvatar={authUser?.profile_data?.profileImg || "/worker1.jpg"}
        onLogout={logout}
        isAvailable={isAvailable}
        isLoadingAvailability={isLoadingAvailability}
        onAvailabilityToggle={handleAvailabilityToggle}
      />

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Edit Profile
              </h1>
              <p className="text-gray-600 text-sm">
                Update your personal information
              </p>
            </div>

            {/* Profile Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile Preview"
                      crossOrigin="anonymous"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="profile-image"
                    className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    Choose Image
                  </label>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max size: 5MB. Formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter your last name"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="your.email@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* Contact Number */}
              <div>
                <label
                  htmlFor="contactNum"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Number
                </label>
                <input
                  id="contactNum"
                  name="contactNum"
                  type="tel"
                  value={formData.contactNum}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="09123456789"
                  maxLength={11}
                />
              </div>

              {/* Birth Date */}
              <div>
                <label
                  htmlFor="birthDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Birth Date
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isUploadingImage}
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isUploadingImage
                  ? "Uploading Image..."
                  : isSaving
                    ? "Saving..."
                    : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden pb-20">
        <div className="px-4 py-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={handleCancel}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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

              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Edit Profile
              </h1>
              <p className="text-gray-600 text-sm">
                Update your personal information
              </p>
            </div>

            {/* Profile Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile Preview"
                      crossOrigin="anonymous"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <label
                  htmlFor="profile-image-mobile"
                  className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Choose Image
                </label>
                <input
                  id="profile-image-mobile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 text-center">
                  Max size: 5MB. Formats: JPG, PNG, GIF
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName-mobile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName-mobile"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName-mobile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName-mobile"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter your last name"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label
                  htmlFor="email-mobile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email-mobile"
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  placeholder="your.email@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* Contact Number */}
              <div>
                <label
                  htmlFor="contactNum-mobile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Number
                </label>
                <input
                  id="contactNum-mobile"
                  name="contactNum"
                  type="tel"
                  value={formData.contactNum}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="09123456789"
                  maxLength={11}
                />
              </div>

              {/* Birth Date */}
              <div>
                <label
                  htmlFor="birthDate-mobile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Birth Date
                </label>
                <input
                  id="birthDate-mobile"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={isSaving || isUploadingImage}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isUploadingImage
                  ? "Uploading Image..."
                  : isSaving
                    ? "Saving..."
                    : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <MobileNav />
      </div>
    </div>
  );
};

export default EditProfilePage;
