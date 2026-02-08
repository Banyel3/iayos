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
  MoreVertical,
} from "lucide-react";
import { Sidebar } from "../../../components";

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
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchClient() {
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
    }

    if (id) {
      fetchClient();
    }
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className="pl-72 flex items-center justify-center min-h-screen">
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
        <div className="pl-72 flex items-center justify-center min-h-screen">
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="pl-72 p-6 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/users/clients")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Client Profile
              </h1>
              <p className="text-gray-500 mt-1">ID: {client.id}</p>
            </div>
            <div className="flex flex-col gap-3">
              {/* Status Badges */}
              <div className="flex gap-2">
                {getStatusBadge(client.status)}
                {getKYCBadge(client.kyc_status)}
              </div>

              {/* Account Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Are you sure you want to suspend this client?')) return;
                    setActionLoading(true);
                    try {
                      const res = await fetch(`${API_BASE}/api/adminpanel/users/${id}/suspend`, {
                        method: 'POST',
                        credentials: 'include',
                      });
                      if (res.ok) {
                        alert('Client suspended successfully');
                        window.location.reload();
                      } else {
                        alert('Failed to suspend client');
                      }
                    } catch (e) {
                      alert('Error suspending client');
                    }
                    setActionLoading(false);
                  }}
                  disabled={actionLoading}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Suspend
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Are you sure you want to DELETE this client? This action cannot be undone.')) return;
                    setActionLoading(true);
                    try {
                      const res = await fetch(`${API_BASE}/api/adminpanel/users/${id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                      });
                      if (res.ok) {
                        alert('Client deleted successfully');
                        router.push('/admin/users/clients');
                      } else {
                        alert('Failed to delete client');
                      }
                    } catch (e) {
                      alert('Error deleting client');
                    }
                    setActionLoading(false);
                  }}
                  disabled={actionLoading}
                >
                  <XCircle className="h-3 w-3 mr-1" />
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
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {client.first_name?.charAt(0)}
                  {client.last_name?.charAt(0)}
                </div>
                {client.is_verified && (
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
                      {client.full_name ||
                        `${client.first_name} ${client.last_name}`.trim()}
                    </h2>
                    {client.is_agency && client.agency_info && (
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        🏢 {client.agency_info.business_name} •{" "}
                        {client.agency_info.employee_count} employees
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">
                        {client.client_data?.rating?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {client.review_count} reviews
                    </p>
                  </div>
                </div>

                {/* Additional Info Row */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Member Since</p>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(client.join_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {client.address?.city || "N/A"},{" "}
                      {client.address?.province || "N/A"}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <DollarSign className="h-4 w-4" />₱
                      {client.total_spent?.toLocaleString() || "0"}
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
                    {client.job_stats.total_jobs}
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
                    {client.job_stats.active_jobs}
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
                    {client.job_stats.completed_jobs}
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
                    <span className="font-medium">{client.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium">
                      {client.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Birth Date</span>
                    <span className="font-medium">
                      {client.birth_date
                        ? new Date(client.birth_date).toLocaleDateString()
                        : "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Email Verified</span>
                    <span
                      className={`font-medium ${client.is_verified ? "text-green-600" : "text-red-600"}`}
                    >
                      {client.is_verified ? "Yes" : "No"}
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
                      {client.address?.street || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">City</span>
                    <span className="font-medium">
                      {client.address?.city || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Province</span>
                    <span className="font-medium">
                      {client.address?.province || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Country</span>
                    <span className="font-medium">
                      {client.address?.country || "Philippines"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* KYC Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    KYC Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">KYC Status</span>
                    {getKYCBadge(client.kyc_status)}
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Account Status</span>
                    {getStatusBadge(client.status)}
                  </div>
                  {client.kyc_status !== "APPROVED" && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => router.push(`/admin/kyc/pending`)}
                    >
                      View KYC Documents
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Client Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    {client.client_data?.description ||
                      "No description provided."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Job History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Job history will be displayed here</p>
                  <p className="text-sm mt-2">
                    Integration with jobs module coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
