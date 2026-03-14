"use client";

import React, { useEffect, useState } from "react";
import {
  API_BASE
} from "@/lib/api/config";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Banknote,
  Building2,
  Calendar,
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
import { Sidebar, useMainContentClass } from "../../../components";
import { toast } from "sonner";
import Link from "next/link";
import { getErrorMessage } from "@/lib/utils/parse-api-error";

interface Skill {
  name: string;
  experience_years: number;
  certification: string;
  skill_type?: "PRIMARY" | "SECONDARY";
  is_primary?: boolean;
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

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const fetchWorker = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_BASE}/api/adminpanel/users/workers/${id}`,
        {
          credentials: "include",
        },
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

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await fetch(
        `${API_BASE}/api/adminpanel/reviews/all?reviewee_id=${id}`,
        {
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err: any) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchWorker();
  }, [id]);

  useEffect(() => {
    setReviews([]);
  }, [id]);

  useEffect(() => {
    if (id && activeTab === "reviews") {
      fetchReviews();
    }
  }, [id, activeTab]);

  // Account action handlers
  const handleSuspend = async () => {
    if (!actionReason.trim()) {
      toast.error("Please provide a reason for suspension");
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
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Worker suspended successfully");
        setShowSuspendModal(false);
        setActionReason("");
        fetchWorker();
      } else {
        toast.error(data.error || "Failed to suspend worker");
      }
    } catch (error) {
      console.error("Suspend error:", error);
      toast.error(getErrorMessage(error, "Failed to suspend worker"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!actionReason.trim()) {
      toast.error("Please provide a reason for banning");
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
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Worker banned successfully");
        setShowBanModal(false);
        setActionReason("");
        fetchWorker();
      } else {
        toast.error(data.error || "Failed to ban worker");
      }
    } catch (error) {
      console.error("Ban error:", error);
      toast.error(getErrorMessage(error, "Failed to ban worker"));
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
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Worker activated successfully");
        setShowActivateModal(false);
        fetchWorker();
      } else {
        toast.error(data.error || "Failed to activate worker");
      }
    } catch (error) {
      console.error("Activate error:", error);
      toast.error(getErrorMessage(error, "Failed to activate worker"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/users/${id}/delete`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Worker deleted successfully");
        router.push("/admin/users/workers");
      } else {
        toast.error(data.error || "Failed to delete worker");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(getErrorMessage(error, "Failed to delete worker"));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      active: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
      verified: { bg: "bg-green-100", text: "text-green-800", label: "Verified" },
      inactive: { bg: "bg-gray-100", text: "text-gray-800", label: "Inactive" },
      suspended: { bg: "bg-red-100", text: "text-red-800", label: "Suspended" },
      banned: { bg: "bg-red-100", text: "text-red-800", label: "Banned" },
    };
    const config = variants[status.toLowerCase()] || variants.inactive;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getKYCBadge = (status: string) => {
    const variants: Record<
      string,
      { bg: string; text: string; icon: React.ReactNode }
    > = {
      APPROVED: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: <Clock className="h-3 w-3" />,
      },
      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: <XCircle className="h-3 w-3" />,
      },
      NOT_SUBMITTED: {
        bg: "bg-gray-100",
        text: "text-gray-600",
        icon: <AlertCircle className="h-3 w-3" />,
      },
    };
    const config = variants[status] || variants.NOT_SUBMITTED;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        {config.icon}
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const mainClass = useMainContentClass("p-6 min-h-screen");
  const loadingClass = useMainContentClass("flex items-center justify-center min-h-screen");

  if (loading) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className={loadingClass}>
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
      <div className="min-h-screen">
        <Sidebar />
        <div className={loadingClass}>
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
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className={mainClass}>
        {/* Header with Back Button */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/users/workers")}
            className="text-gray-600 hover:text-[#00BAF1] -ml-2 w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workers
          </Button>
          <div className="flex gap-2">
            {getStatusBadge(worker.status)}
            {getKYCBadge(worker.kyc_status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-9 space-y-6">
            {/* Main Header Container */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                  <div className="relative">
                    <div className="h-28 w-28 rounded-full bg-blue-50 flex items-center justify-center text-[#00BAF1] text-4xl font-bold border-2 border-[#00BAF1]/20">
                      {worker.first_name?.charAt(0)}
                      {worker.last_name?.charAt(0)}
                    </div>
                    {worker.is_verified && (
                      <div className="absolute bottom-1 right-1 h-8 w-8 bg-[#00BAF1] rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 pt-2">
                    <div>
                      <h2 className="text-sm font-medium text-[#00BAF1] mb-1">Worker Profile</h2>
                      <h1 className="text-3xl font-bold text-gray-900 tracking-tight capitalize">
                        {worker.full_name || `${worker.first_name} ${worker.last_name}`}
                      </h1>
                      <p className="text-gray-400 text-sm mt-1">Worker ID: {worker.id}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#00BAF1]" />
                        Joined {new Date(worker.join_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">{worker.worker_data?.rating?.toFixed(1) || "0.0"}</span>
                        <span className="text-gray-400">({worker.review_count} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#00BAF1]" />
                        <span className="text-gray-600">{worker.address?.city || "N/A"}, {worker.address?.province || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined Stats Container at the bottom */}
                <div className="mt-8 pt-6 border-t border-gray-100/50 flex flex-wrap items-center gap-x-8 gap-y-4">
                  {[
                    { label: "Total Jobs", value: worker.job_stats.total_jobs },
                    { label: "Active", value: worker.job_stats.active_jobs },
                    { label: "Completed", value: worker.job_stats.completed_jobs },
                    { label: "Total Earnings", value: `₱${worker.worker_data.total_earnings?.toLocaleString() || "0"}` },
                  ].map((stat, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col">
                        <p className="text-[10px] text-gray-400 font-bold tracking-wider mb-0.5">{stat.label}</p>
                        <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      </div>
                      {i < 3 && <div className="hidden md:block h-8 w-[1px] bg-gray-200" />}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-white p-1 rounded-xl shadow-sm inline-flex mb-6 border-none">
                <TabsTrigger 
                  value="details" 
                  className="rounded-lg px-6 py-2.5 data-[state=active]:bg-[#00BAF1] data-[state=active]:text-white transition-all"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger 
                  value="jobs" 
                  className="rounded-lg px-6 py-2.5 data-[state=active]:bg-[#00BAF1] data-[state=active]:text-white transition-all"
                >
                  Job History
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-lg px-6 py-2.5 data-[state=active]:bg-[#00BAF1] data-[state=active]:text-white transition-all"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-8 space-y-10">
                    {/* About Section */}
                    <section>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-[#00BAF1]" />
                        About
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {worker.worker_data?.description || "No description provided."}
                      </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {/* Contact Info Section */}
                      <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#00BAF1]" />
                          Contact Information
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Email Address</span>
                            <span className="font-medium text-gray-900">{worker.email}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Phone Number</span>
                            <span className="font-medium text-gray-900">{worker.phone || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Birth Date</span>
                            <span className="font-medium text-gray-900">
                              {worker.birth_date ? new Date(worker.birth_date).toLocaleDateString() : "Not provided"}
                            </span>
                          </div>
                        </div>
                      </section>

                      {/* Address Section */}
                      <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#00BAF1]" />
                          Address
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Street</span>
                            <span className="font-medium text-gray-900">{worker.address?.street || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">City</span>
                            <span className="font-medium text-gray-900">{worker.address?.city || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Province</span>
                            <span className="font-medium text-gray-900">{worker.address?.province || "N/A"}</span>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Skills & Specializations */}
                    <section>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-[#00BAF1]" />
                        Skills & Specializations
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {worker.skills && worker.skills.length > 0 ? (
                          worker.skills.map((skill, i) => (
                            <div
                              key={i}
                              className="px-3 py-2 bg-blue-50/50 border border-blue-100/50 text-[#00BAF1] rounded-xl"
                            >
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs">{skill.name}</p>
                                {(skill.is_primary || skill.skill_type === "PRIMARY") && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">
                                    Primary
                                  </span>
                                )}
                              </div>
                              {skill.experience_years > 0 && (
                                <p className="text-[10px] opacity-70 mt-0.5">
                                  {skill.experience_years} years exp
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No skills listed</p>
                        )}
                      </div>
                    </section>

                    {/* KYC Info Section */}
                    <section className="pt-2">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#00BAF1]" />
                        KYC Information
                      </h3>
                      <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Current KYC Status</p>
                            <div className="flex items-center gap-3">
                              {getKYCBadge(worker.kyc_status)}
                            </div>
                          </div>
                          {worker.kyc_status !== "APPROVED" && (
                            <Button variant="outline" size="sm" className="w-full md:w-auto bg-white hover:bg-gray-50">
                              <ExternalLink className="h-3.5 w-3.5 mr-2" />
                              Review Documents
                            </Button>
                          )}
                        </div>
                      </div>
                    </section>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jobs">
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="py-20 text-center">
                    <Briefcase className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Job History</h3>
                    <p className="text-gray-500">integration with jobs module coming soon.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-gray-50 bg-white py-6 px-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">Worker Reviews</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Feedback from clients who have hired this worker</p>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-lg font-bold text-[#00BAF1]">{worker.worker_data?.rating?.toFixed(1) || "0.0"}</span>
                        <span className="text-xs text-[#00BAF1]/70 font-medium">/ 5.0</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {reviewsLoading ? (
                      <div className="py-20 text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-[#00BAF1] mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Fetching reviews...</p>
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {reviews.map((review) => (
                          <div key={review.id} className="p-8 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-[#00BAF1] font-bold border border-blue-100">
                                  {review.reviewer_name?.charAt(0)}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-900">{review.reviewer_name}</h4>
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 px-2 bg-white">
                                      {review.reviewer_type || "Client"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`h-3.5 w-3.5 ${i < Math.floor(review.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} 
                                      />
                                    ))}
                                    <span className="text-xs text-gray-400 ml-1 font-medium">
                                      {new Date(review.created_at).toLocaleDateString(undefined, { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">Related Job</p>
                                <p className="text-xs font-semibold text-[#00BAF1] hover:underline cursor-pointer flex items-center justify-end gap-1">
                                  {review.job_title}
                                  <ExternalLink className="h-3 w-3" />
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 ml-16">
                              <p className="text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 italic">
                                &ldquo;{review.comment || "No comment provided."}&rdquo;
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center">
                        <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Star className="h-10 w-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h3>
                        <p className="text-gray-500 max-w-xs mx-auto leading-relaxed">
                          This worker hasn&apos;t received any feedback from clients yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Column: Action Buttons */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-50 pb-4">
                <CardTitle className="text-sm font-bold text-gray-900 tracking-widest uppercase">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col gap-3">
                {!worker.is_banned && (
                  <Button
                    variant={worker.is_suspended ? "default" : "outline"}
                    className={worker.is_suspended ? "w-full shadow-sm" : "w-full border-orange-100 text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all font-medium"}
                    onClick={() =>
                      worker.is_suspended
                        ? setShowActivateModal(true)
                        : setShowSuspendModal(true)
                    }
                  >
                    {worker.is_suspended ? (
                      <><CheckCircle className="h-4 w-4 mr-2" /> Unsuspend Account</>
                    ) : (
                      <><Clock className="h-4 w-4 mr-2" /> Suspend Account</>
                    )}
                  </Button>
                )}
                
                {!worker.is_suspended && !worker.is_banned && (
                  <Button
                    variant="outline"
                    className="w-full border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all font-medium"
                    onClick={() => setShowBanModal(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    ban account
                  </Button>
                )}

                {worker.is_banned && (
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700 shadow-sm font-medium"
                    onClick={() => setShowActivateModal(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    unban account
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all mt-2 text-sm font-medium"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  delete profile
                </Button>
              </CardContent>
            </Card>

            {/* Performance Card */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
               <CardContent className="p-6">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-xs text-gray-400 font-bold tracking-wider mb-1 uppercase">Success Rate</p>
                      <p className="text-3xl font-black text-gray-900">{completionRate.toFixed(0)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-[#00BAF1] opacity-20" />
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                     <div 
                        className="bg-[#00BAF1] h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${completionRate}%` }}
                      ></div>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
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
