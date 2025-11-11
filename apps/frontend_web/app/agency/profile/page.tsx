"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/form_button";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Edit2,
  Save,
  X,
} from "lucide-react";

interface AgencyProfile {
  account_id: number;
  email: string;
  contact_number: string | null;
  business_name: string | null;
  business_description: string | null;
  address: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  } | null;
  kyc_status: string;
  kyc_submitted_at: string | null;
  statistics: {
    total_employees: number;
    avg_employee_rating: number | null;
    total_jobs: number;
    active_jobs: number;
    completed_jobs: number;
  };
  created_at: string;
}

export default function AgencyProfilePage() {
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form states
  const [editBusinessDesc, setEditBusinessDesc] = useState("");
  const [editContactNumber, setEditContactNumber] = useState("");

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/profile`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        // Initialize edit form values
        setEditBusinessDesc(data.business_description || "");
        setEditContactNumber(data.contact_number || "");
      } else {
        toast.error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile();
    return () => controller.abort();
  }, []);

  const handleEditClick = () => {
    if (profile) {
      setEditBusinessDesc(profile.business_description || "");
      setEditContactNumber(profile.contact_number || "");
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setEditBusinessDesc(profile.business_description || "");
      setEditContactNumber(profile.contact_number || "");
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const formData = new FormData();

      // Only append non-empty values
      if (editBusinessDesc && editBusinessDesc.trim()) {
        formData.append("business_description", editBusinessDesc.trim());
      }
      if (editContactNumber && editContactNumber.trim()) {
        formData.append("contact_number", editContactNumber.trim());
      }

      console.log("Sending update:", {
        business_description: editBusinessDesc,
        contact_number: editContactNumber,
      });

      const res = await fetch(`${API_BASE}/api/agency/profile/update`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Update response:", data);
        toast.success("Profile updated successfully");
        setIsEditing(false);
        // Refresh profile data
        await fetchProfile();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Verified
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            Not Started
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Agency Profile</h1>
          </div>

          <div className="space-y-4">
            {/* Loading skeleton for profile cards */}
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Agency Profile</h1>
          <div className="text-sm text-red-500">Failed to load profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Agency Profile</h1>
          {!isEditing && (
            <Button
              onClick={handleEditClick}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Business Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Business Name
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {profile.business_name || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Description
              </label>
              {isEditing ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  value={editBusinessDesc}
                  onChange={(e) => setEditBusinessDesc(e.target.value)}
                  placeholder="Enter business description"
                />
              ) : (
                <p className="text-gray-700">
                  {profile.business_description || "No description provided"}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="w-full">
                  <label className="text-sm font-medium text-gray-500">
                    Contact Number
                  </label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editContactNumber}
                      onChange={(e) => setEditContactNumber(e.target.value)}
                      placeholder="Enter contact number"
                      maxLength={11}
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profile.contact_number || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Card */}
        {profile.address && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Business Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900">
                {profile.address.street && `${profile.address.street}, `}
                {profile.address.city && `${profile.address.city}, `}
                {profile.address.province && `${profile.address.province} `}
                {profile.address.postal_code}
              </p>
              <p className="text-gray-600 mt-1">{profile.address.country}</p>
            </CardContent>
          </Card>
        )}

        {/* KYC Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                KYC Status
              </span>
              {getKycStatusBadge(profile.kyc_status)}
            </div>
            {profile.kyc_submitted_at && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Submitted on {formatDate(profile.kyc_submitted_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Member since {formatDate(profile.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
