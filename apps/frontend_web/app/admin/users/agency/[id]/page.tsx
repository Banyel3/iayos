"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2,
  MapPin,
  Star,
  Users,
  Calendar,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
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
          `http://localhost:8000/api/adminpanel/users/agencies/${id}`,
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
      if (response.ok) {
        alert("Agency suspended successfully");
        setShowSuspendModal(false);
        setActionReason("");
        fetchAgency();
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
        `http://localhost:8000/api/adminpanel/users/${id}/ban`,
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
        fetchAgency();
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
        `http://localhost:8000/api/adminpanel/users/${id}/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (response.ok) {
        alert("Agency activated successfully");
        setShowActivateModal(false);
        fetchAgency();
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
        `http://localhost:8000/api/adminpanel/users/${id}/delete`,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agency details...</p>
        </div>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Agency not found"}</p>
          <Button onClick={() => router.push("/admin/users/agency")}>
            ← Back to Agencies
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
        onClick={() => router.push("/admin/users/agency")}
      >
        ← Back to Agencies
      </Button>

      {/* Agency Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{agency.business_name}</h1>
          <p className="text-muted-foreground mt-1">
            {agency.business_description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Agency Info */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            {/* Agency Logo Placeholder */}
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 border-y py-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {agency.employee_stats?.total_employees || 0}
                </p>
                <p className="text-xs text-muted-foreground">Employees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {agency.job_stats?.total_jobs || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {agency.job_stats?.completed_jobs || 0}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{agency.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {agency.phone || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {agency.address.street && (
                        <>
                          {agency.address.street}
                          <br />
                        </>
                      )}
                      {agency.address.city && `${agency.address.city}, `}
                      {agency.address.province} {agency.address.postal_code}
                      {(agency.address.city ||
                        agency.address.province ||
                        agency.address.postal_code) && <br />}
                      {agency.address.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">
                    {agency.business_description}
                  </p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Business Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Completion Rate
                        </p>
                        <p className="font-semibold">94%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Avg Response Time
                        </p>
                        <p className="font-semibold">2.4 hours</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="employees" className="mt-4">
                <Card className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Agency Employees</h4>
                    <span className="text-sm text-muted-foreground">
                      {agency.employee_stats?.employees?.length || 0} Total
                    </span>
                  </div>
                  <div className="space-y-3">
                    {agency.employee_stats?.employees &&
                    agency.employee_stats.employees.length > 0 ? (
                      agency.employee_stats.employees.map(
                        (employee: Employee) => (
                          <div
                            key={employee.id}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {employee.email} • {employee.role}
                                </p>
                              </div>
                            </div>
                            {employee.rating > 0 && (
                              <span className="text-xs">
                                ⭐ {employee.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No employees registered
                      </p>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="jobs" className="mt-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Recent Job Completions</h4>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-3 border rounded hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                Plumbing Repair #{i}
                              </p>
                              <Link
                                href={`/admin/jobs/completed/COMP-00${i}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Completed 2 days ago
                            </p>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Completed
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Fixed kitchen sink leak and replaced old pipes...
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Client Reviews</h4>
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 border rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, j) => (
                              <Star
                                key={j}
                                className="h-4 w-4 text-yellow-500 fill-yellow-500"
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            Client #{i}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Excellent service! The workers were professional and
                          completed the job perfectly.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          3 days ago
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side: Status and Actions */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Account Status
                </p>
                <div
                  className={`text-center text-xs font-semibold py-2 rounded-md ${
                    agency.status === "active"
                      ? "bg-green-50 text-green-600"
                      : agency.status === "inactive"
                        ? "bg-gray-50 text-gray-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {agency.status?.toUpperCase() || "INACTIVE"}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">KYC Status</p>
                <div
                  className={`text-center text-xs font-semibold py-2 rounded-md ${
                    agency.kyc_status === "APPROVED"
                      ? "bg-blue-50 text-blue-600"
                      : agency.kyc_status === "PENDING"
                        ? "bg-yellow-50 text-yellow-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {agency.kyc_status}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  placeholder="Add notes about this agency..."
                  className="w-full rounded border border-gray-200 p-2 text-sm resize-none h-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              {agency.status?.toLowerCase() === "active" ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowSuspendModal(true)}
                  >
                    Suspend Agency
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => setShowBanModal(true)}
                  >
                    Ban Agency
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowActivateModal(true)}
                >
                  Activate Agency
                </Button>
              )}
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Agency
              </Button>
            </CardContent>
          </Card>

          {/* Agency Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Agency Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gray-500">Agency ID</dt>
                <dd className="font-medium text-xs">#{agency.id}</dd>

                <dt className="text-gray-500">Joined</dt>
                <dd className="font-medium text-xs">
                  {new Date(agency.join_date).toLocaleDateString()}
                </dd>

                <dt className="text-gray-500">Location</dt>
                <dd className="font-medium text-xs">
                  {agency.address.city && agency.address.province
                    ? `${agency.address.city}, ${agency.address.province}`
                    : agency.address.city ||
                      agency.address.province ||
                      "Not provided"}
                </dd>

                <dt className="text-gray-500">Country</dt>
                <dd className="font-medium text-xs">
                  {agency.address.country}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

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
                  🚨 <strong>IRREVERSIBLE ACTION:</strong> This will permanently
                  delete:
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
    </div>
  );
}
