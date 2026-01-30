"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Shield,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  FileCheck,
  TrendingUp,
  Filter,
  X,
} from "lucide-react";
import Sidebar from "../../components/sidebar";
import { toast } from "sonner";

interface PendingCertification {
  cert_id: number;
  worker_id: number;
  worker_name: string;
  worker_email: string;
  certification_name: string;
  issuing_organization: string;
  skill_name: string | null;
  certificate_url: string;
  issue_date: string | null;
  expiry_date: string | null;
  is_expired: boolean;
  days_until_expiry: number | null;
  submitted_at: string;
  days_pending: number;
}

interface VerificationStats {
  pending_count: number;
  approved_today: number;
  expiring_soon_count: number;
}

export default function PendingCertificationsPage() {
  const router = useRouter();
  const [certifications, setCertifications] = useState<PendingCertification[]>(
    [],
  );
  const [stats, setStats] = useState<VerificationStats>({
    pending_count: 0,
    approved_today: 0,
    expiring_soon_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [expiringFilter, setExpiringFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const normalizePendingCertification = (item: any): PendingCertification => {
    const submittedAt =
      item?.uploaded_at ?? item?.submitted_at ?? item?.submittedAt ?? null;
    const daysPending =
      item?.days_pending ??
      (submittedAt
        ? Math.max(
          0,
          Math.round(
            (Date.now() - new Date(submittedAt).getTime()) /
            (1000 * 60 * 60 * 24),
          ),
        )
        : 0);

    const computedName = [item?.worker_first_name, item?.worker_last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    const workerName =
      item?.worker_name ??
      (computedName || undefined) ??
      item?.worker_email ??
      "Unknown Worker";

    return {
      cert_id: item?.cert_id ?? item?.certificationID ?? item?.id ?? 0,
      worker_id: item?.worker_id ?? item?.workerID ?? 0,
      worker_name: workerName,
      worker_email: item?.worker_email ?? "",
      certification_name:
        item?.certification_name ?? item?.name ?? "Certification",
      issuing_organization: item?.issuing_organization ?? "",
      skill_name: item?.skill_name ?? item?.skill?.name ?? null,
      certificate_url: item?.certificate_url ?? "",
      issue_date: item?.issue_date ?? null,
      expiry_date: item?.expiry_date ?? null,
      is_expired: Boolean(item?.is_expired),
      days_until_expiry: item?.days_until_expiry ?? null,
      submitted_at: submittedAt ?? "",
      days_pending: daysPending,
    };
  };

  useEffect(() => {
    fetchStats();
    fetchCertifications();
  }, [page, skillFilter, searchTerm, expiringFilter]);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/certifications/stats`,
        { credentials: "include" },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      toast.error("Failed to load statistics");
    }
  };

  const fetchCertifications = async () => {
    try {
      setIsLoading(true);

      const currentPage = Number(page) || 1;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "20",
      });

      if (skillFilter) params.append("skill", skillFilter);
      if (searchTerm) params.append("worker", searchTerm);
      if (expiringFilter) params.append("expiring_soon", "true");

      const response = await fetch(
        `${API_BASE}/api/adminpanel/certifications/pending?${params}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch certifications");
      }

      const payload = await response.json();
      const result = payload.data ?? payload;
      const rawCerts = Array.isArray(result?.certifications)
        ? result.certifications
        : [];

      const normalizedCerts = rawCerts.map((item: any) =>
        normalizePendingCertification(item),
      );

      setCertifications(normalizedCerts);
      setPage(result?.page ?? currentPage);
      setTotalPages(result?.total_pages ?? 1);
    } catch (err) {
      console.error("Error fetching certifications:", err);
      toast.error("Failed to load certifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSkillFilter("");
    setExpiringFilter(false);
    setPage(1);
  };

  const getExpiryBadge = (cert: PendingCertification) => {
    if (cert.is_expired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (cert.days_until_expiry !== null && cert.days_until_expiry <= 30) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-yellow-500 text-yellow-700"
        >
          <Clock className="h-3 w-3" />
          Expires in {cert.days_until_expiry}d
        </Badge>
      );
    }
    return null;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading && (!certifications || certifications.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Sidebar />
        <main className="pl-72 p-8 min-h-screen">
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <Shield className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading certifications...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Please wait while we fetch pending verifications
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Sidebar />
      <main className="pl-72 p-8 min-h-screen">
        {/* Header with Gradient */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 pointer-events-none"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8" />
                <h1 className="text-3xl font-bold">
                  Certification Verification
                </h1>
              </div>
              <p className="text-blue-100 max-w-2xl">
                Review and verify worker certifications to maintain platform
                quality and trust
              </p>
            </div>
            <Button
              onClick={() => router.push("/admin/certifications/history")}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              View History
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Pending Review
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pending_count}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting verification
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Approved Today
              </p>
              <p className="text-3xl font-bold text-green-600">
                {stats.approved_today}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Verified certifications
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-red-50 to-red-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Expiring Soon
              </p>
              <p className="text-3xl font-bold text-red-600">
                {stats.expiring_soon_count}
              </p>
              <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Search & Filters
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder="Search by worker name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Clear Filters */}
              {(searchTerm || skillFilter || expiringFilter) && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Skill/Specialization
                  </label>
                  <Input
                    placeholder="Filter by skill name..."
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expiringFilter}
                      onChange={(e) => setExpiringFilter(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Show only expiring soon (≤30 days)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certifications List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Pending Certifications ({certifications?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!certifications || certifications.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                  No pending certifications
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  All certifications have been reviewed
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {certifications.map((cert) => (
                  <Card
                    key={cert.cert_id}
                    className="border border-gray-200 cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/certifications/${cert.cert_id}`)
                    }
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {cert.certification_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {cert.issuing_organization}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getExpiryBadge(cert)}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-2 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/admin/certifications/${cert.cert_id}`,
                              );
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Review
                          </Button>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Shield className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Worker</p>
                            <p className="font-medium text-gray-900">
                              {cert.worker_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Skill</p>
                            <p className="font-medium text-gray-900">
                              {cert.skill_name || "General"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Clock className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Issue Date</p>
                            <p className="font-medium text-gray-900">
                              {formatDate(cert.issue_date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Pending</p>
                            <p className="font-medium text-gray-900">
                              {cert.days_pending} days
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
