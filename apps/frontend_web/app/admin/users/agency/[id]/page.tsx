"use client";

import React, { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api/config";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  ExternalLink,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Star,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  User,
  Shield,
  ArrowLeft,
  Users,
  Award,
  Trash2,
} from "lucide-react";
import { Sidebar } from "../../../components";
import Link from "next/link";

interface Address {
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  full_address: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  rating: number;
  avatar: string;
}

interface EmployeeStats {
  total_employees: number;
  employees: Employee[];
}

interface JobStats {
  total_jobs: number;
  completed_jobs: number;
  active_jobs: number;
  completion_rate: number;
}

interface Agency {
  id: string;
  agency_id: string;
  email: string;
  business_name: string;
  phone: string;
  address: Address;
  business_description: string;
  status: string;
  kyc_status: string;
  join_date: string;
  is_verified: boolean;
  employee_stats: EmployeeStats;
  job_stats: JobStats;
  rating: number;
  review_count: number;
}

export default function AgencyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Account action modals
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    async function fetchAgency() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API_BASE}/api/adminpanel/users/agencies/${id}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch agency details");
        }

        const data = await res.json();

        if (data.success && data.agency) {
          setAgency(data.agency);
        } else {
          setError(data.error || "Agency not found");
        }
      } catch (err) {
        console.error("Failed to fetch agency:", err);
        setError("Failed to load agency details");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchAgency();
  }, [id]);

  const refetchAgency = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/adminpanel/users/agencies/${id}`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.agency) {
          setAgency(data.agency);
        }
      }
    } catch (err) {
      console.error("Failed to refetch agency:", err);
    }
  };

  // Account action handlers
  const handleSuspend = async () => {
    if (!actionReason.trim()) {
      alert("Please provide a reason for suspension");
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/users/${id}/suspend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: actionReason }),
        }
      );
      if (response.ok) {
        alert("Agency suspended successfully");
        setShowSuspendModal(false);
        setActionReason("");
        refetchAgency();
      } else {
        alert("Failed to suspend agency");
      }
    } catch (error) {
      console.error("Suspend error:", error);
      alert("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!actionReason.trim()) {
      alert("Please provide a reason for banning");
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/users/${id}/ban`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: actionReason }),
        }
      );
      if (response.ok) {
        alert("Agency banned successfully");
        setShowBanModal(false);
        setActionReason("");
        refetchAgency();
      } else {
        alert("Failed to ban agency");
      }
    } catch (error) {
      console.error("Ban error:", error);
      alert("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/users/${id}/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (response.ok) {
        alert("Agency activated successfully");
        setShowActivateModal(false);
        refetchAgency();
      } else {
        alert("Failed to activate agency");
      }
    } catch (error) {
      console.error("Activate error:", error);
      alert("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm');
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/users/${id}/delete`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.ok) {
        alert("Agency deleted successfully");
        router.push("/admin/users/agency");
      } else {
        alert("Failed to delete agency");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading agency details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || "Agency not found"}</p>
            <Button onClick={() => router.push("/admin/users/agency")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agencies
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const completionRate =
    agency.job_stats?.total_jobs > 0
      ? (agency.job_stats.completed_jobs / agency.job_stats.total_jobs) * 100
      : 0;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/users/agency")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agencies
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Agency Profile
              </h1>
              <p className="text-gray-500 mt-1">ID: {agency.id}</p>
            </div>
            <div className="flex flex-col gap-3">
              {/* Status Badges */}
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    agency.status === "active"
                      ? "bg-green-100 text-green-800"
                      : agency.status === "inactive"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {(agency.status || "inactive").toUpperCase()}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    agency.kyc_status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : agency.kyc_status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : agency.kyc_status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {agency.kyc_status === "APPROVED" && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {agency.kyc_status === "PENDING" && (
                    <Clock className="h-3 w-3" />
                  )}
                  {agency.kyc_status === "REJECTED" && (
                    <XCircle className="h-3 w-3" />
                  )}
                  {agency.kyc_status}
                </span>
              </div>

              {/* Account Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuspendModal(true)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Suspend
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBanModal(true)}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Ban
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                  <Building2 className="h-12 w-12" />
                </div>
                {agency.is_verified && (
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {agency.business_name}
                    </h2>
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      🏢 Business Agency •{" "}
                      {agency.employee_stats?.total_employees || 0} employees
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {agency.email}
                      </div>
                      {agency.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {agency.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">
                        {agency.rating?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {agency.review_count} reviews
                    </p>
                  </div>
                </div>

                {/* Additional Info Row */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Joined</p>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(agency.join_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {agency.address.city && agency.address.province
                        ? `${agency.address.city}, ${agency.address.province}`
                        : agency.address.city ||
                          agency.address.province ||
                          "Not provided"}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Employees</p>
                    <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                      <Users className="h-4 w-4" />
                      {agency.employee_stats?.total_employees || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {agency.job_stats?.total_jobs || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {agency.job_stats?.active_jobs || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-600">
                    {agency.job_stats?.completed_jobs || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {completionRate.toFixed(0)}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{agency.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium">
                      {agency.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Business Verified</span>
                    <span
                      className={`font-medium ${agency.is_verified ? "text-green-600" : "text-red-600"}`}
                    >
                      {agency.is_verified ? "Yes" : "No"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Business Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Street</span>
                    <span className="font-medium">
                      {agency.address?.street || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">City</span>
                    <span className="font-medium">
                      {agency.address?.city || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Province</span>
                    <span className="font-medium">
                      {agency.address?.province || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Country</span>
                    <span className="font-medium">
                      {agency.address?.country || "Philippines"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* KYC Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    KYC & Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">KYC Status</span>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        agency.kyc_status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : agency.kyc_status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : agency.kyc_status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {agency.kyc_status}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Account Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        agency.status === "active"
                          ? "bg-green-100 text-green-800"
                          : agency.status === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {(agency.status || "inactive").toUpperCase()}
                    </span>
                  </div>
                  {agency.kyc_status !== "APPROVED" && (
                    <Button variant="outline" className="w-full mt-2">
                      View KYC Documents
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Business Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    {agency.business_description || "No description provided."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Agency Employees</span>
                  <Badge variant="secondary">
                    {agency.employee_stats?.employees?.length || 0} Total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agency.employee_stats?.employees &&
                  agency.employee_stats.employees.length > 0 ? (
                    agency.employee_stats.employees.map(
                      (employee: Employee) => (
                        <div
                          key={employee.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                              {employee.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-xs text-gray-500">
                                {employee.email} • {employee.role}
                              </p>
                            </div>
                          </div>
                          {employee.rating > 0 && (
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="h-4 w-4 fill-yellow-500" />
                              <span className="text-sm font-medium">
                                {employee.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No employees registered</p>
                      <p className="text-sm mt-2">
                        Employees will appear here once they register
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Suspend Modal */}
        {showSuspendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-4 mb-4">
                <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Suspend Agency Account
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This will temporarily suspend the agency&apos;s account. All
                    employees under this agency will be affected.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Suspension *
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                      placeholder="Enter reason for suspension..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setActionReason("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSuspend}
                  disabled={actionLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Suspending...
                    </>
                  ) : (
                    "Confirm Suspension"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Ban Modal */}
        {showBanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-4 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">
                    Ban Agency Account
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    ⚠️ <strong>PERMANENT ACTION:</strong> This will permanently
                    ban the agency and all associated employees.
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    This action cannot be easily reversed.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Ban *
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                      placeholder="Enter reason for permanent ban..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBanModal(false);
                    setActionReason("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBan}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Banning...
                    </>
                  ) : (
                    "Confirm Ban"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Activate Modal */}
        {showActivateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-4 mb-4">
                <AlertCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Activate Agency Account
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This will reactivate the agency&apos;s account and restore
                    access for all employees.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowActivateModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleActivate}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    "Confirm Activation"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-4 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">
                    Delete Agency Account
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    🚨 <strong>IRREVERSIBLE ACTION:</strong> This will
                    permanently delete:
                  </p>
                  <ul className="text-sm text-gray-600 mb-4 ml-6 list-disc">
                    <li>Agency profile and business information</li>
                    <li>All employee accounts</li>
                    <li>Job history and earnings</li>
                    <li>Transaction records</li>
                    <li>Reviews and ratings</li>
                  </ul>
                  <p className="text-sm font-semibold text-red-600 mb-4">
                    This action CANNOT be undone.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type <strong>DELETE</strong> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Type DELETE"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={actionLoading || deleteConfirmText !== "DELETE"}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Permanently"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
