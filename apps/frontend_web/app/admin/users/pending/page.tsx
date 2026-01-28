"use client";

import { API_BASE } from "@/lib/api/config";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  FileText,
  Building2,
  User,
  AlertCircle,
} from "lucide-react";
import { Sidebar } from "../../components";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "worker" | "client" | "agency";
  submissionDate: string;
  documentsSubmitted: string[];
  priority: "high" | "medium" | "low";
  status: "pending_review" | "under_review" | "requires_action";
  kycType: "individual" | "agency";
  accountId: string;
}

export default function PendingVerificationPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "worker" | "client" | "agency"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");

  // Fetch real KYC data from backend
  useEffect(() => {
    const fetchPendingKYC = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/adminpanel/kyc/all`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch KYC data: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch KYC data");
        }

        // Transform individual KYC records
        const individualKYCs = (data.kyc || [])
          .filter((kyc: any) => kyc.kycStatus === "PENDING")
          .map((kyc: any) => {
            const user = (data.users || []).find(
              (u: any) => u.accountID === kyc.accountFK_id,
            );
            const files = (data.kyc_files || []).filter(
              (f: any) => f.kycID_id === kyc.kycID,
            );

            return {
              id: kyc.kycID.toString(),
              accountId: kyc.accountFK_id.toString(),
              name: user
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : "Unknown",
              email: user?.email || "N/A",
              phone: user?.contactNum || "N/A",
              type: (user?.profileType?.toLowerCase() || "worker") as
                | "worker"
                | "client"
                | "agency",
              submissionDate: kyc.createdAt?.split("T")[0] || "N/A",
              documentsSubmitted: files.map((f: any) => f.idType || "Document"),
              priority:
                files.length >= 4
                  ? "high"
                  : files.length >= 2
                    ? "medium"
                    : "low",
              status: "pending_review" as const,
              kycType: "individual" as const,
            };
          });

        // Transform agency KYC records
        const agencyKYCs = (data.agency_kyc || [])
          .filter((kyc: any) => kyc.status === "PENDING")
          .map((kyc: any) => {
            const agency = (data.agencies || []).find(
              (a: any) => a.accountID === kyc.accountFK_id,
            );
            const files = (data.agency_kyc_files || []).filter(
              (f: any) => f.agencyKyc_id === kyc.agencyKycID,
            );

            return {
              id: `agency_${kyc.agencyKycID}`,
              accountId: kyc.accountFK_id.toString(),
              name: agency?.businessName || "Unknown Agency",
              email: agency?.email || "N/A",
              phone: "N/A",
              type: "agency" as const,
              submissionDate: kyc.createdAt?.split("T")[0] || "N/A",
              documentsSubmitted: files.map((f: any) => {
                const typeMap: Record<string, string> = {
                  BUSINESS_PERMIT: "Business Permit",
                  REPRESENTATIVE_ID_FRONT: "Rep ID (Front)",
                  REPRESENTATIVE_ID_BACK: "Rep ID (Back)",
                  ADDRESS_PROOF: "Address Proof",
                  AUTHORIZATION_LETTER: "Authorization Letter",
                };
                return typeMap[f.fileType] || f.fileType;
              }),
              priority:
                files.length >= 4
                  ? "high"
                  : files.length >= 2
                    ? "medium"
                    : "low",
              status: "pending_review" as const,
              kycType: "agency" as const,
            };
          });

        // Combine and sort by submission date (newest first)
        const allPending = [...individualKYCs, ...agencyKYCs].sort((a, b) => {
          return (
            new Date(b.submissionDate).getTime() -
            new Date(a.submissionDate).getTime()
          );
        });

        setPendingUsers(allPending);
      } catch (err) {
        console.error("Error fetching pending KYC:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load pending verifications",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPendingKYC();
  }, []);

  const filteredUsers = pendingUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || user.type === typeFilter;
    const matchesPriority =
      priorityFilter === "all" || user.priority === priorityFilter;

    return matchesSearch && matchesType && matchesPriority;
  });

  const handleApprove = (userId: string) => {
    console.log("Approving user:", userId);
    // Add approval logic here
  };

  const handleReject = (userId: string) => {
    console.log("Rejecting user:", userId);
    // Add rejection logic here
  };

  const handleRequestMoreInfo = (userId: string) => {
    console.log("Requesting more info for user:", userId);
    // Add request more info logic here
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Pending Verification
              </h1>
              <p className="text-muted-foreground">
                Review and approve user verification requests (Individual &
                Agency KYC)
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Reviews
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingUsers.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  High Priority
                </CardTitle>
                <Shield className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingUsers.filter((u) => u.priority === "high").length}
                </div>
                <p className="text-xs text-muted-foreground">Urgent reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workers</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingUsers.filter((u) => u.type === "worker").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Worker applications
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingUsers.filter((u) => u.type === "client").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Client applications
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agencies</CardTitle>
                <Building2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingUsers.filter((u) => u.type === "agency").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Agency applications
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find pending verifications by name, email, type, or priority
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pending users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(
                      e.target.value as "all" | "worker" | "client" | "agency",
                    )
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="worker">Workers</option>
                  <option value="client">Clients</option>
                  <option value="agency">Agencies</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(
                      e.target.value as "all" | "high" | "medium" | "low",
                    )
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Empty State */}
          {!loading && !error && filteredUsers.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Pending Verifications
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ||
                  typeFilter !== "all" ||
                  priorityFilter !== "all"
                    ? "No verifications match your filters. Try adjusting your search criteria."
                    : "All KYC submissions have been reviewed. Great job!"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pending Users List */}
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          user.type === "agency"
                            ? "bg-purple-100"
                            : "bg-primary/10"
                        }`}
                      >
                        {user.type === "agency" ? (
                          <Building2 className="w-6 h-6 text-purple-600" />
                        ) : (
                          <span className="font-semibold text-primary text-lg">
                            {user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-lg font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          {user.phone !== "N/A" && (
                            <p className="text-sm text-muted-foreground">
                              {user.phone}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.type === "worker"
                                ? "bg-blue-100 text-blue-800"
                                : user.type === "client"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {user.type === "agency" && "🏢 "}
                            {user.type.toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : user.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.priority} priority
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === "pending_review"
                                ? "bg-yellow-100 text-yellow-800"
                                : user.status === "under_review"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {user.status.replace("_", " ")}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Submitted Documents:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {user.documentsSubmitted.map((doc, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded flex items-center"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Submitted:{" "}
                          {new Date(user.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Review Documents
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(user.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(user.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestMoreInfo(user.id)}
                      >
                        Request More Info
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
