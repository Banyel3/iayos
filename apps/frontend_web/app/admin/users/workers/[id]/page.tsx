"use client";

import React, { useEffect, useState } from "react";
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
  Award,
  Wrench,
  Trash2,
} from "lucide-react";
import { Sidebar } from "../../../components";
import Link from "next/link";

interface Skill {
  name: string;
  experience_years: number;
  certification: string;
}

interface Address {
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

interface Location {
  latitude: number | null;
  longitude: number | null;
  sharing_enabled: boolean;
  updated_at: string | null;
}

interface WorkerData {
  description: string;
  rating: number;
  availability_status: string;
  total_earnings: number;
}

interface JobStats {
  total_jobs: number;
  completed_jobs: number;
  active_jobs: number;
  completion_rate: number;
}

interface Worker {
  id: string;
  profile_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  birth_date: string | null;
  profile_image: string;
  address: Address;
  location: Location;
  status: string;
  kyc_status: string;
  join_date: string;
  is_verified: boolean;
  is_suspended: boolean;
  is_banned: boolean;
  worker_data: WorkerData;
  skills: Skill[];
  job_stats: JobStats;
  review_count: number;
}

export default function WorkerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [worker, setWorker] = useState<Worker | null>(null);
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

  const fetchWorker = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `http://localhost:8000/api/adminpanel/users/workers/${id}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch worker details");
      }

      const data = await res.json();

      if (data.success && data.worker) {
        setWorker(data.worker);
      } else {
        setError(data.error || "Worker not found");
      }
    } catch (err) {
      console.error("Failed to fetch worker:", err);
      setError("Failed to load worker details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchWorker();
  }, [id]);

  // Account action handlers
  const handleSuspend = async () => {
    if (!actionReason.trim()) {
      alert("Please provide a reason for suspension");
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/users/${id}/suspend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: actionReason }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Worker suspended successfully");
        setShowSuspendModal(false);
        setActionReason("");
        fetchWorker();
      } else {
        alert(data.error || "Failed to suspend worker");
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
        `http://localhost:8000/api/adminpanel/users/${id}/ban`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: actionReason }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Worker banned successfully");
        setShowBanModal(false);
        setActionReason("");
        fetchWorker();
      } else {
        alert(data.error || "Failed to ban worker");
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
        `http://localhost:8000/api/adminpanel/users/${id}/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Worker activated successfully");
        setShowActivateModal(false);
        fetchWorker();
      } else {
        alert(data.error || "Failed to activate worker");
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
        `http://localhost:8000/api/adminpanel/users/${id}/delete`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Worker deleted successfully");
        router.push("/admin/users/workers");
      } else {
        alert(data.error || "Failed to delete worker");
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
            <p className="text-gray-600">Loading worker details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || "Worker not found"}</p>
            <Button onClick={() => router.push("/admin/users/workers")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workers
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const completionRate = worker.job_stats.completion_rate || 0;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/users/workers")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workers
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Worker Profile
              </h1>
              <p className="text-gray-500 mt-1">ID: {worker.id}</p>
            </div>
            <div className="flex flex-col gap-3">
              {/* Status Badges */}
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    worker.status === "active" || worker.status === "verified"
                      ? "bg-green-100 text-green-800"
                      : worker.status === "banned"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {(worker.status || "inactive").toUpperCase()}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    worker.kyc_status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : worker.kyc_status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : worker.kyc_status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {worker.kyc_status === "APPROVED" && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {worker.kyc_status === "PENDING" && (
                    <Clock className="h-3 w-3" />
                  )}
                  {worker.kyc_status === "REJECTED" && (
                    <XCircle className="h-3 w-3" />
                  )}
                  {worker.kyc_status || "NOT_SUBMITTED"}
                </span>
              </div>
              
              {/* Account Action Buttons */}
              <div className="flex gap-2">
                {!worker.is_banned && (
                  <Button
                    variant={worker.is_suspended ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      worker.is_suspended
                        ? setShowActivateModal(true)
                        : setShowSuspendModal(true)
                    }
                  >
                    {worker.is_suspended ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Unsuspend
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Suspend
                      </>
                    )}
                  </Button>
                )}
                {!worker.is_suspended && !worker.is_banned && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBanModal(true)}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Ban
                  </Button>
                )}
                {worker.is_banned && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowActivateModal(true)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Unban
                  </Button>
                )}
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
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {worker.first_name?.charAt(0)}
                  {worker.last_name?.charAt(0)}
                </div>
                {worker.is_verified && (
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {worker.full_name ||
                        `${worker.first_name} ${worker.last_name}`.trim()}
                    </h2>
                    <p className="text-sm text-green-600 font-medium mt-1">
                      {worker.worker_data.availability_status || "Worker"}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {worker.email}
                      </div>
                      {worker.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {worker.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">
                        {worker.worker_data?.rating?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {worker.review_count} reviews
                    </p>
                  </div>
                </div>

                {/* Additional Info Row */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Member Since</p>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(worker.join_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {worker.address?.city || "N/A"},{" "}
                      {worker.address?.province || "N/A"}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <DollarSign className="h-4 w-4" />₱
                      {worker.worker_data.total_earnings?.toLocaleString() ||
                        "0"}
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
                    {worker.job_stats.total_jobs}
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
                    {worker.job_stats.active_jobs}
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
                    {worker.job_stats.completed_jobs}
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
            <TabsTrigger value="jobs">Job History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{worker.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium">
                      {worker.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Birth Date</span>
                    <span className="font-medium">
                      {worker.birth_date
                        ? new Date(worker.birth_date).toLocaleDateString()
                        : "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Email Verified</span>
                    <span
                      className={`font-medium ${worker.is_verified ? "text-green-600" : "text-red-600"}`}
                    >
                      {worker.is_verified ? "Yes" : "No"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Street</span>
                    <span className="font-medium">
                      {worker.address?.street || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">City</span>
                    <span className="font-medium">
                      {worker.address?.city || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Province</span>
                    <span className="font-medium">
                      {worker.address?.province || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Country</span>
                    <span className="font-medium">
                      {worker.address?.country || "Philippines"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Skills & Specializations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Skills & Specializations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills && worker.skills.length > 0 ? (
                      worker.skills.map((skill, i) => (
                        <div
                          key={i}
                          className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg"
                        >
                          <p className="font-semibold text-sm">{skill.name}</p>
                          {skill.experience_years > 0 && (
                            <p className="text-xs text-blue-600">
                              {skill.experience_years} years exp
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No skills listed</p>
                    )}
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
                        worker.kyc_status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : worker.kyc_status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : worker.kyc_status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {worker.kyc_status || "NOT_SUBMITTED"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Account Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        worker.status === "active" ||
                        worker.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : worker.status === "banned"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {(worker.status || "inactive").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Location Sharing</span>
                    <span className="font-medium">
                      {worker.location.sharing_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  {worker.kyc_status !== "APPROVED" && (
                    <Button variant="outline" className="w-full mt-2">
                      View KYC Documents
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Worker Description */}
              {worker.worker_data.description && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      {worker.worker_data.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Job History & Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Example Job Item */}
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">
                            Ceiling Fan Repair
                          </p>
                          <Link
                            href="/admin/jobs/completed/COMP-001"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                        <p className="text-xs text-gray-500">
                          Completed · ₱300
                        </p>
                        <p className="text-xs mt-2 italic text-gray-600">
                          "my fan is ok na hehe"
                        </p>
                        <div className="flex items-center mt-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-yellow-500" />
                          <span className="ml-1 text-sm font-medium">5.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* More job items would go here */}
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">
                      Full job history integration coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals - Outside main to overlay entire page */}
      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Suspend Worker Account
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will temporarily suspend the worker&apos;s account. They
                  won&apos;t be able to accept new jobs or access services.
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
        <div className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-red-600">
                  Ban Worker Account
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  ⚠️ <strong>PERMANENT ACTION:</strong> This will permanently
                  ban the worker&apos;s account. They will lose all access to
                  the platform.
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
        <div className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {worker?.is_banned ? "Unban" : "Unsuspend"} Worker Account
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will reactivate the worker&apos;s account and restore
                  full access to the platform.
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
                    {worker?.is_banned ? "Unbanning..." : "Unsuspending..."}
                  </>
                ) : worker?.is_banned ? (
                  "Confirm Unban"
                ) : (
                  "Confirm Unsuspend"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-red-600">
                  Delete Worker Account
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  🚨 <strong>IRREVERSIBLE ACTION:</strong> This will permanently
                  delete all worker data including:
                </p>
                <ul className="text-sm text-gray-600 mb-4 ml-6 list-disc">
                  <li>Profile information & skills</li>
                  <li>Job history & earnings</li>
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
    </div>
  );
}
