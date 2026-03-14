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
  Phone,
  MapPin,
  Mail,
  Star,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  User,
  Shield,
  ArrowLeft,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { Sidebar, useMainContentClass } from "../../../components";
import { toast } from "sonner";

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

interface ClientData {
  description: string;
  rating: number;
}

interface JobStats {
  total_jobs: number;
  completed_jobs: number;
  active_jobs: number;
  cancelled_jobs: number;
}

interface Client {
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
  client_data: ClientData;
  job_stats: JobStats;
  review_count: number;
  total_spent?: number;
  is_agency?: boolean;
  agency_info?: {
    business_name: string;
    employee_count: number;
  };
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
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

  const fetchClient = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_BASE}/api/adminpanel/users/clients/${id}`,
        {
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch client details");
      }

      const data = await res.json();

      if (data.success && data.client) {
        setClient(data.client);
      } else {
        throw new Error("Client not found");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id]);

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
        toast.success("Client suspended successfully");
        setShowSuspendModal(false);
        setActionReason("");
        fetchClient();
      } else {
        toast.error(data.error || "Failed to suspend client");
      }
    } catch (error) {
      console.error("Suspend error:", error);
        toast.error(getErrorMessage(error, "Failed to suspend client"));
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
        toast.success("Client banned successfully");
        setShowBanModal(false);
        setActionReason("");
        fetchClient();
      } else {
        toast.error(data.error || "Failed to ban client");
      }
    } catch (error) {
      console.error("Ban error:", error);
        toast.error(getErrorMessage(error, "Failed to ban client"));
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
        toast.success("Client activated successfully");
        setShowActivateModal(false);
        fetchClient();
      } else {
        toast.error(data.error || "Failed to activate client");
      }
    } catch (error) {
      console.error("Activate error:", error);
        toast.error(getErrorMessage(error, "Failed to activate client"));
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
        toast.success("Client deleted successfully");
        router.push("/admin/users/clients");
      } else {
        toast.error(data.error || "Failed to delete client");
      }
    } catch (error) {
      console.error("Delete error:", error);
        toast.error(getErrorMessage(error, "Failed to delete client"));
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
      inactive: { bg: "bg-gray-100", text: "text-gray-800", label: "Inactive" },
      suspended: { bg: "bg-red-100", text: "text-red-800", label: "Suspended" },
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
            <p className="text-gray-600">Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className={loadingClass}>
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || "Client not found"}</p>
            <Button onClick={() => router.push("/admin/users/clients")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const completionRate =
    client.job_stats.total_jobs > 0
      ? (client.job_stats.completed_jobs / client.job_stats.total_jobs) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className={mainClass}>
        {/* Header with Back Button */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/users/clients")}
            className="text-gray-600 hover:text-[#00BAF1] -ml-2 w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
          <div className="flex gap-2">
            {getStatusBadge(client.status)}
            {getKYCBadge(client.kyc_status)}
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
                      {client.first_name?.charAt(0)}
                      {client.last_name?.charAt(0)}
                    </div>
                    {client.is_verified && (
                      <div className="absolute bottom-1 right-1 h-8 w-8 bg-[#00BAF1] rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 pt-2">
                    <div>
                      <h2 className="text-sm font-medium text-[#00BAF1] mb-1">Client Profile</h2>
                      <h1 className="text-3xl font-bold text-gray-900 tracking-tight capitalize">
                        {client.full_name || `${client.first_name} ${client.last_name}`}
                      </h1>
                      {client.is_agency && client.agency_info && (
                        <p className="text-sm text-[#00BAF1] font-semibold mt-1">
                          🏢 {client.agency_info.business_name} • {client.agency_info.employee_count} employees
                        </p>
                      )}
                      <p className="text-gray-400 text-sm mt-1">Client ID: {client.id}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#00BAF1]" />
                        Joined {new Date(client.join_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">{client.client_data?.rating?.toFixed(1) || "0.0"}</span>
                        <span className="text-gray-400">({client.review_count} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined Stats Container at the bottom */}
                <div className="mt-8 pt-6 border-t border-gray-100/50 flex flex-wrap items-center gap-x-8 gap-y-4">
                  {[
                    { label: "Total Jobs", value: client.job_stats.total_jobs },
                    { label: "Active Jobs", value: client.job_stats.active_jobs },
                    { label: "Completed", value: client.job_stats.completed_jobs },
                    { label: "Total Spent", value: `₱${client.total_spent?.toLocaleString() || "0"}` },
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
            <Tabs defaultValue="details" className="w-full">
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
                {/* Client Details Container (Merged) */}
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-8 space-y-10">
                    {/* About Section */}
                    <section>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-[#00BAF1]" />
                        About
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {client.client_data?.description || "No description provided."}
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
                            <span className="font-medium text-gray-900">{client.email}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Phone Number</span>
                            <span className="font-medium text-gray-900">{client.phone || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Birth Date</span>
                            <span className="font-medium text-gray-900">
                              {client.birth_date ? new Date(client.birth_date).toLocaleDateString() : "Not provided"}
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
                            <span className="font-medium text-gray-900">{client.address?.street || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">City</span>
                            <span className="font-medium text-gray-900">{client.address?.city || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Province</span>
                            <span className="font-medium text-gray-900">{client.address?.province || "N/A"}</span>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* KYC Info Section */}
                    <section className="pt-2">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#00BAF1]" />
                        KYC Information
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Current KYC Status</p>
                          <div className="flex items-center gap-3">
                            {getKYCBadge(client.kyc_status)}
                          </div>
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
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="py-20 text-center">
                    <Star className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Reviews</h3>
                    <p className="text-gray-500">client reviews and feedback will appear here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Column: Action Buttons */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-50 pb-4">
                <CardTitle className="text-sm font-bold text-gray-900 tracking-widest">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col gap-3">
                {!client.is_banned && (
                  <Button
                    variant={client.is_suspended ? "default" : "outline"}
                    className={client.is_suspended ? "w-full shadow-sm" : "w-full border-orange-100 text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all font-medium"}
                    onClick={() =>
                      client.is_suspended
                        ? setShowActivateModal(true)
                        : setShowSuspendModal(true)
                    }
                  >
                    {client.is_suspended ? (
                      <><CheckCircle className="h-4 w-4 mr-2" /> Unsuspend Account</>
                    ) : (
                      <><Clock className="h-4 w-4 mr-2" /> Suspend Account</>
                    )}
                  </Button>
                )}
                
                {!client.is_suspended && !client.is_banned && (
                  <Button
                    variant="outline"
                    className="w-full border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all font-medium"
                    onClick={() => setShowBanModal(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    ban account
                  </Button>
                )}

                {client.is_banned && (
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
                      <p className="text-xs text-gray-400 font-bold tracking-wider mb-1">Success Rate</p>
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
                  Suspend Client Account
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will temporarily suspend the client&apos;s account. They
                  won&apos;t be able to post jobs or access services.
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
                  Ban Client Account
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  ⚠️ <strong>PERMANENT ACTION:</strong> This will permanently
                  ban the client&apos;s account. They will lose all access to
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
                  {client?.is_banned ? "Unban" : "Unsuspend"} Client Account
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will reactivate the client&apos;s account and restore
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
                    {client?.is_banned ? "Unbanning..." : "Unsuspending..."}
                  </>
                ) : client?.is_banned ? (
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
                  Delete Client Account
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  🚨 <strong>IRREVERSIBLE ACTION:</strong> This will permanently
                  delete all client data including:
                </p>
                <ul className="text-sm text-gray-600 mb-4 ml-6 list-disc">
                  <li>Profile information</li>
                  <li>Job history & postings</li>
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
