"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

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
}
export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClient() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `http://localhost:8000/api/adminpanel/users/clients/${id}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch client details");
        }

        const data = await res.json();

        if (data.success && data.client) {
          setClient(data.client);
        } else {
          setError(data.error || "Client not found");
        }
      } catch (err) {
        console.error("Failed to fetch client:", err);
        setError("Failed to load client details");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchClient();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Client not found"}</p>
          <Button onClick={() => router.push("/admin/users/clients")}>
            ← Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push("/admin/users/clients")}
      >
        ← Back to Clients
      </Button>

      {/* Client Header */}
      <h1 className="text-2xl font-semibold">Client Profile #{client.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Client Info */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            {/* Placeholder Circle Avatar */}
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {client.full_name ||
                    `${client.first_name} ${client.last_name}`.trim()}
                </h2>
                <p className="text-sm text-gray-500">{client.email}</p>
                <p className="text-sm text-gray-500">
                  {client.location?.sharing_enabled
                    ? "Location Sharing: Enabled"
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">
                  Rating: {client.client_data?.rating?.toFixed(1) || "N/A"}
                </p>
                <p className="text-xs text-gray-500">Client Rating</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-y-3 text-sm border-t pt-4">
              <div>
                <p className="text-gray-500">Jobs Posted</p>
                <p className="font-semibold">
                  {client.job_stats?.total_jobs || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Active Jobs</p>
                <p className="font-semibold text-blue-600">
                  {client.job_stats?.active_jobs || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold">{client.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500">KYC Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.kyc_status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : client.kyc_status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {client.kyc_status}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Join Date</p>
                <p className="font-semibold">
                  {new Date(client.join_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.status?.toLowerCase() === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {client.status || "Inactive"}
                </span>
              </div>
            </div>

            {/* Address Information */}
            {(client.address?.street ||
              client.address?.city ||
              client.address?.province ||
              client.address?.country) && (
              <div className="border-t pt-4">
                <p className="font-medium mb-2">Address</p>
                <p className="text-sm text-gray-600">
                  {client.address.street && (
                    <>
                      {client.address.street}
                      <br />
                    </>
                  )}
                  {client.address.city && `${client.address.city}, `}
                  {client.address.province} {client.address.postal_code}
                  {(client.address.city ||
                    client.address.province ||
                    client.address.postal_code) && <br />}
                  {client.address.country}
                </p>
              </div>
            )}

            {/* Client Description */}
            {client.client_data?.description && (
              <div className="border-t pt-4">
                <p className="font-medium mb-2">About Client</p>
                <p className="text-sm text-gray-600">
                  {client.client_data.description}
                </p>
              </div>
            )}

            {/* Tabs (Jobs, Transactions, Activity) */}
            <Tabs defaultValue="jobs" className="mt-6">
              <TabsList>
                <TabsTrigger value="jobs">Posted Jobs</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
              </TabsList>
              <TabsContent value="jobs" className="mt-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          Plumbing Repair Needed
                        </p>
                        <Link
                          href="/admin/jobs/listings/JOB-001"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-gray-500">Posted 2 days ago</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Need experienced plumber for kitchen sink repair...
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <DollarSign className="inline h-3 w-3" /> $150 - $200
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="transactions" className="mt-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          Payment to Worker
                        </p>
                        <Link
                          href="/admin/jobs/completed/COMP-001"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-gray-500">
                        TXN-2024-001234 • Jan 15, 2024
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">$180.00</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Payment for Appliance Repair job
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="activity" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Posted a new job</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Completed payment</p>
                      <p className="text-xs text-gray-500">5 days ago</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side: Status and User Details Panel */}
        <div className="space-y-4">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                {/* Full width bordered status bar */}
                <div className="w-full border rounded-md bg-white">
                  <div
                    className={`text-center text-xs font-semibold py-2 rounded-md ${
                      client.status === "active"
                        ? "bg-green-50 text-green-600"
                        : client.status === "inactive"
                          ? "bg-gray-50 text-gray-600"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    {client.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  placeholder="Add a note about this client..."
                  className="w-full rounded border border-gray-200 p-2 text-sm resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="destructive" className="w-full justify-center">
                  <span className="mr-2">⦸</span>Ban
                </Button>
                <Button variant="outline" className="w-full justify-center">
                  <span className="mr-2">⏸</span>Suspend
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center col-span-2"
                >
                  Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User details card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Use a description list to align labels and values */}
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gray-500">User Type</dt>
                <dd className="font-medium">Client</dd>

                <dt className="text-gray-500">Client ID</dt>
                <dd className="font-medium">#{client.id}</dd>

                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-xs break-all">
                  {client.email}
                </dd>

                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium">{client.phone}</dd>

                <dt className="text-gray-500">Profile ID</dt>
                <dd className="font-medium">{client.profile_id}</dd>

                <dt className="text-gray-500">Date Joined</dt>
                <dd className="font-medium">
                  {new Date(client.join_date).toLocaleDateString()}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
