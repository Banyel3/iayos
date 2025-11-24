"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Loader2, ExternalLink, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    async function fetchWorker() {
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
    }
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
      if (response.ok) {
        alert("Worker suspended successfully");
        setShowSuspendModal(false);
        setActionReason("");
        fetchWorker();
      } else {
        alert("Failed to suspend worker");
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
        alert("Worker banned successfully");
        setShowBanModal(false);
        setActionReason("");
        fetchWorker();
      } else {
        alert("Failed to ban worker");
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
        alert("Worker activated successfully");
        setShowActivateModal(false);
        fetchWorker();
      } else {
        alert("Failed to activate worker");
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
        alert("Worker deleted successfully");
        router.push("/admin/users/workers");
      } else {
        alert("Failed to delete worker");
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
          <p className="text-muted-foreground">Loading worker details...</p>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Worker not found"}</p>
          <Button onClick={() => router.push("/admin/users/workers")}>
            ← Back to Workers
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
        onClick={() => router.push("/admin/users/workers")}
      >
        ← Back to Workers
      </Button>

      {/* Worker Header */}
      <h1 className="text-2xl font-semibold">Worker Profile #{worker.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Worker Info */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            {/* Placeholder Circle Avatar */}
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gray-200"></div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {worker.full_name ||
                    `${worker.first_name} ${worker.last_name}`.trim()}
                </h2>
                <p className="text-sm text-gray-500">
                  {worker.worker_data.availability_status || "Worker"}
                </p>
              </div>
              <p className="text-lg font-semibold">
                ₱{worker.worker_data.total_earnings.toFixed(2)}
              </p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-y-3 text-sm border-t pt-4">
              <div>
                <p className="text-gray-500">Rating</p>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">
                    {worker.worker_data.rating}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({worker.review_count})
                  </span>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Total Jobs</p>
                <p className="font-semibold">{worker.job_stats.total_jobs}</p>
              </div>
              <div>
                <p className="text-gray-500">Jobs Completed</p>
                <p className="font-semibold">
                  {worker.job_stats.completed_jobs}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Completion Rate</p>
                <p className="font-semibold">
                  {worker.job_stats.completion_rate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    worker.status === "active" || worker.status === "verified"
                      ? "bg-green-100 text-green-800"
                      : worker.status === "banned"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {worker.status || "inactive"}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-semibold">
                  {worker.join_date
                    ? new Date(worker.join_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Address Information */}
            {(worker.address?.street ||
              worker.address?.city ||
              worker.address?.province ||
              worker.address?.country) && (
              <div className="border-t pt-4">
                <p className="font-medium mb-2">Address</p>
                <p className="text-sm text-gray-600">
                  {worker.address.street && (
                    <>
                      {worker.address.street}
                      <br />
                    </>
                  )}
                  {worker.address.city && `${worker.address.city}, `}
                  {worker.address.province} {worker.address.postal_code}
                  {(worker.address.city ||
                    worker.address.province ||
                    worker.address.postal_code) && <br />}
                  {worker.address.country}
                </p>
              </div>
            )}

            {/* Skills */}
            <div>
              <p className="font-medium">Skills & Specializations</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {worker.skills && worker.skills.length > 0 ? (
                  worker.skills.map((skill, i) => (
                    <div
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded flex flex-col"
                    >
                      <span className="font-medium">{skill.name}</span>
                      {skill.experience_years > 0 && (
                        <span className="text-xs text-blue-600">
                          {skill.experience_years} years exp
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">
                    No skills listed
                  </span>
                )}
              </div>
            </div>

            {/* Worker Description */}
            {worker.worker_data.description && (
              <div>
                <p className="font-medium">About</p>
                <p className="text-sm text-gray-600 mt-1">
                  {worker.worker_data.description}
                </p>
              </div>
            )}

            {/* Tabs (Jobs, Transactions, Disputes) */}
            <Tabs defaultValue="jobs" className="mt-6">
              <TabsList>
                <TabsTrigger value="jobs">Jobs & Reviews</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="disputes">Disputes</TabsTrigger>
              </TabsList>
              <TabsContent value="jobs" className="mt-4">
                {/* Example Job Item */}
                <Card className="p-4 hover:shadow-md transition-shadow">
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
                      <p className="text-xs text-gray-500">Completed · ₱300</p>
                      <p className="text-xs mt-2 italic">
                        "my fan is ok na hehe"
                      </p>
                      <div className="flex items-center mt-1 text-yellow-500">
                        <Star className="h-4 w-4" /> 5.0
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="transactions" className="mt-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          Payment Received
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
                    <p className="font-semibold text-green-600">₱300.00</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Payment for Ceiling Fan Repair job
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="disputes" className="mt-4">
                <p>Disputes data here...</p>
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
                  <div className="bg-blue-50 text-center text-xs text-blue-600 font-semibold py-2 rounded-md">
                    {worker.status ? worker.status.toUpperCase() : "INACTIVE"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Add a note"
                  className="w-full rounded border border-gray-200 p-2 text-sm resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {worker.status?.toLowerCase() === "active" ? (
                  <>
                    <Button
                      variant="destructive"
                      className="w-full justify-center"
                      onClick={() => setShowBanModal(true)}
                    >
                      <span className="mr-2">⦸</span>Ban
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      onClick={() => setShowSuspendModal(true)}
                    >
                      <span className="mr-2">⏸</span>Suspend
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-center col-span-2"
                    onClick={() => setShowActivateModal(true)}
                  >
                    <span className="mr-2">✓</span>Activate
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full justify-center col-span-2"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User details card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">User Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Use a description list to align labels and values */}
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gray-500">User Type</dt>
                <dd className="font-medium">Worker</dd>

                <dt className="text-gray-500">User ID</dt>
                <dd className="font-medium">#{worker.id}</dd>

                <dt className="text-gray-500">Profile ID</dt>
                <dd className="font-medium">#{worker.profile_id}</dd>

                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium col-span-2">{worker.email}</dd>

                <dt className="text-gray-500">Phone Number</dt>
                <dd className="font-medium col-span-2">
                  {worker.phone || "—"}
                </dd>

                <dt className="text-gray-500">Date of Birth</dt>
                <dd className="font-medium col-span-2">
                  {worker.birth_date
                    ? new Date(worker.birth_date).toLocaleDateString()
                    : "—"}
                </dd>

                <dt className="text-gray-500">Date Joined</dt>
                <dd className="font-medium col-span-2">
                  {worker.join_date
                    ? new Date(worker.join_date).toLocaleDateString()
                    : "N/A"}
                </dd>

                <dt className="text-gray-500">KYC Status</dt>
                <dd className="font-medium col-span-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                </dd>

                <dt className="text-gray-500">Verified</dt>
                <dd className="font-medium col-span-2">
                  {worker.is_verified ? "✓ Yes" : "✗ No"}
                </dd>

                <dt className="text-gray-500">Location Sharing</dt>
                <dd className="font-medium col-span-2">
                  {worker.location.sharing_enabled ? "Enabled" : "Disabled"}
                </dd>

                {worker.location.sharing_enabled &&
                  worker.location.latitude && (
                    <>
                      <dt className="text-gray-500">Coordinates</dt>
                      <dd className="font-medium col-span-2 text-xs">
                        {worker.location.latitude.toFixed(6)},{" "}
                        {worker.location.longitude?.toFixed(6)}
                      </dd>
                    </>
                  )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Activate Worker Account
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
