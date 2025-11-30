"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Search,
  Unlock,
  RefreshCcw,
  Eye,
  MoreVertical,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface EscrowPayment {
  id: number;
  job_id: number;
  job_title: string;
  worker_id: number;
  worker_name: string;
  client_id: number;
  client_name: string;
  downpayment_amount: number;
  status: string;
  created_at: string;
  days_held: number;
}

interface Statistics {
  total_escrow_held: number;
  pending_release_count: number;
  released_today: number;
  refunded_this_month: number;
}

type StatusFilter = "all" | "pending" | "held" | "released" | "refunded";

export default function EscrowMonitorPage() {
  const router = useRouter();
  const [escrows, setEscrows] = useState<EscrowPayment[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkNote, setBulkNote] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const fetchEscrows = async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `http://localhost:8000/api/adminpanel/transactions/escrow?${params}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        console.warn("Escrow API not available, using mock data");
        setEscrows([]);
        return;
      }

      const data = await response.json();
      setEscrows(data.escrows || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/adminpanel/transactions/escrow/statistics",
        { credentials: "include" }
      );

      if (!response.ok) {
        console.warn("Escrow statistics API not available");
        setStatistics({
          total_escrow_held: 0,
          pending_release_count: 0,
          released_today: 0,
          refunded_this_month: 0,
        });
        return;
      }

      const data = await response.json();
      setStatistics(
        data || {
          total_escrow_held: 0,
          pending_release_count: 0,
          released_today: 0,
          refunded_this_month: 0,
        }
      );
    } catch (error) {
      console.error("Error:", error);
      setStatistics({
        total_escrow_held: 0,
        pending_release_count: 0,
        released_today: 0,
        refunded_this_month: 0,
      });
    }
  };

  useEffect(() => {
    fetchEscrows();
    fetchStatistics();
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchEscrows();
        fetchStatistics();
      }, 60000); // Refresh every 60 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, page, statusFilter, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEscrows();
  };

  const handleSelectAll = () => {
    if (selectedIds.length === escrows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(escrows.map((e) => e.id));
    }
  };

  const handleBulkRelease = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one escrow payment");
      return;
    }

    if (!confirm(`Release ${selectedIds.length} escrow payments?`)) return;

    try {
      const response = await fetch(
        "http://localhost:8000/api/adminpanel/transactions/escrow/bulk-release",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            escrow_ids: selectedIds,
            reason: bulkNote,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to bulk release");

      alert(`Successfully released ${selectedIds.length} payments`);
      setShowBulkModal(false);
      setSelectedIds([]);
      setBulkNote("");
      fetchEscrows();
      fetchStatistics();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to bulk release escrows");
    }
  };

  const releaseEscrow = async (id: number) => {
    if (!confirm("Release this escrow payment?")) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/transactions/${id}/release-escrow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: "Released from escrow monitor" }),
        }
      );

      if (!response.ok) throw new Error("Failed to release");

      alert("Escrow released successfully");
      fetchEscrows();
      fetchStatistics();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to release escrow");
    }
  };

  const getDaysColor = (days: number) => {
    if (days < 7) return "text-green-700 bg-green-100";
    if (days <= 14) return "text-yellow-700 bg-yellow-100";
    return "text-red-700 bg-red-100";
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: "⏳ Pending", color: "bg-yellow-100 text-yellow-700" },
      held: { label: "🔒 Held", color: "bg-blue-100 text-blue-700" },
      released: { label: "✓ Released", color: "bg-green-100 text-green-700" },
      refunded: {
        label: "↩ Refunded",
        color: "bg-orange-100 text-orange-700",
      },
    };
    const badge = badges[status] || { label: status, color: "bg-gray-100" };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <Clock className="h-16 w-16 text-blue-600 animate-pulse mx-auto" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading escrow payments...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-8 w-8" />
                    <h1 className="text-4xl font-bold">Escrow Monitor</h1>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Track and manage escrow payments
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    id="autoRefresh"
                    className="h-4 w-4 rounded"
                  />
                  <label htmlFor="autoRefresh" className="text-sm">
                    Auto-refresh (60s)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Total Escrow Held
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₱{statistics?.total_escrow_held?.toLocaleString() ?? "0"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Pending Release</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics?.pending_release_count ?? 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Released Today</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₱{statistics?.released_today?.toLocaleString() ?? "0"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <RefreshCcw className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Refunded This Month
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₱{statistics?.refunded_this_month?.toLocaleString() ?? "0"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Status Tabs */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "pending", label: "⏳ Pending" },
                    { key: "held", label: "🔒 Held" },
                    { key: "released", label: "✓ Released" },
                    { key: "refunded", label: "↩ Refunded" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setPage(1);
                    }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      statusFilter === tab.key
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search and Bulk Actions */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by job or user name..."
                    className="flex-1 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                {selectedIds.length > 0 && (
                  <Button
                    onClick={() => setShowBulkModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Bulk Release ({selectedIds.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Escrow Table */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === escrows.length}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded"
                        />
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Job Title
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Worker
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Client
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Days Held
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12">
                          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">
                            No escrow payments found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      escrows.map((escrow) => (
                        <tr
                          key={escrow.id}
                          className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(escrow.id)}
                              onChange={() => {
                                if (selectedIds.includes(escrow.id)) {
                                  setSelectedIds(
                                    selectedIds.filter((id) => id !== escrow.id)
                                  );
                                } else {
                                  setSelectedIds([...selectedIds, escrow.id]);
                                }
                              }}
                              className="h-4 w-4 rounded"
                            />
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-gray-900">
                              {escrow.job_title}
                            </p>
                            <p className="text-sm text-gray-600">
                              ID: {escrow.job_id}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-gray-900">
                              {escrow.worker_name}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-gray-900">
                              {escrow.client_name}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-gray-900">
                              ₱{(escrow.downpayment_amount ?? 0).toLocaleString()}
                            </p>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(escrow.status)}
                          </td>
                          <td className="p-4">
                            <Badge className={getDaysColor(escrow.days_held)}>
                              {escrow.days_held} days
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => releaseEscrow(escrow.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Unlock className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/admin/payments/transactions/${escrow.id}`
                                  )
                                }
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-600"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
                >
                  Previous
                </Button>
                <span className="text-gray-700 font-medium">
                  Page{" "}
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg">
                    {page}
                  </span>
                </span>
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={escrows.length < pageSize}
                  variant="outline"
                  className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Release Modal */}
          {showBulkModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Bulk Release Escrow
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Release {selectedIds.length} escrow payments?
                  </p>
                  <textarea
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                    placeholder="Optional note..."
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkRelease}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Confirm Release
                    </Button>
                    <Button
                      onClick={() => setShowBulkModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
