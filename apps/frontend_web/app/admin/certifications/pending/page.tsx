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
import { useMainContentClass, AdminPagination } from "../../components";
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
  const mainClass = useMainContentClass("p-8 min-h-screen");
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
        page_size: "15",
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
        <main className={mainClass}>
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
    <div className="min-h-screen">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          {/* Header */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Certification Verification</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Review and verify worker certifications to maintain platform quality and trust
                </p>
              </div>
              <Button
                onClick={() => router.push("/admin/certifications/history")}
                className="bg-[#00BAF1] hover:bg-[#0098C7] text-white self-start sm:self-auto text-sm"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                View History
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <Clock className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                  <div className="h-1.5 w-1.5 bg-[#00BAF1] rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Pending Review</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending_count}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Approved Today</p>
                <p className="text-xl font-bold text-gray-900">{stats.approved_today}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-[#00BAF1]" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Expiring Soon</p>
                <p className="text-xl font-bold text-gray-900">{stats.expiring_soon_count}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#00BAF1] transition-colors" />
              <Input
                placeholder="Search by worker name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
              />
            </div>

            <Input
              placeholder="Filter by skill..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="md:w-64 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] focus:border-[#00BAF1] focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm outline-none"
            />

            <div className="flex items-center gap-2 px-4 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-[#00BAF1] transition-all shadow-sm">
              <input
                type="checkbox"
                id="expiringSoon"
                checked={expiringFilter}
                onChange={(e) => setExpiringFilter(e.target.checked)}
                className="w-4 h-4 text-[#00BAF1] border-gray-300 rounded focus:ring-[#00BAF1]"
              />
              <label htmlFor="expiringSoon" className="text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap">
                Expiring Soon
              </label>
            </div>

            {(searchTerm || skillFilter || expiringFilter) && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-12 px-4 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

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
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                              {cert.certification_name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {cert.issuing_organization}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            {getExpiryBadge(cert)}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-2 hover:bg-blue-50 h-8 sm:h-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/admin/certifications/${cert.cert_id}`,
                                );
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">Review</span>
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

              <AdminPagination
                currentPage={page}
                totalPages={totalPages}
                itemsPerPage={15}
                itemLabel="certifications"
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
