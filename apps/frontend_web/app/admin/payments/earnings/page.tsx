"use client";

import { useState, useEffect } from "react";
import { Sidebar, useMainContentClass } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Banknote,
  TrendingUp,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Send,
  CreditCard,
  Building2,
} from "lucide-react";

interface WorkerEarning {
  id: number;
  worker_id: number;
  worker_name: string;
  worker_email: string;
  total_earnings: number;
  pending_payout: number;
  paid_out: number;
  jobs_completed: number;
  average_rating: number;
  payout_method: string | null;
}

interface Statistics {
  total_workers: number;
  pending_payouts: number;
  total_payouts: number;
  this_month_payouts?: { count: number; amount: number };
}

export default function WorkerEarningsPage() {
  const [workers, setWorkers] = useState<WorkerEarning[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerEarning | null>(
    null,
  );
  const [payoutMethod, setPayoutMethod] = useState("gcash");
  const [gcashNumber, setGcashNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const mainClass = useMainContentClass("p-8 min-h-screen");

  const fetchWorkers = async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/worker-earnings?${params}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        console.warn("Worker earnings API not available");
        setWorkers([]);
        return;
      }

      const data = await response.json();
      setWorkers(data.workers || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/worker-earnings/statistics`,
        { credentials: "include" },
      );

      if (!response.ok) {
        console.warn("Earnings statistics API not available");
        setStatistics({
          total_workers: 0,
          pending_payouts: 0,
          total_payouts: 0,
          this_month_payouts: { count: 0, amount: 0 },
        });
        return;
      }

      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchStatistics();
  }, [page, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWorkers();
  };

  const openPayoutModal = (worker: WorkerEarning) => {
    setSelectedWorker(worker);
    setShowPayoutModal(true);
    setPayoutMethod(worker.payout_method || "gcash");
  };

  const processPayout = async () => {
    if (!selectedWorker) return;

    if (payoutMethod === "gcash" && !gcashNumber) {
      alert("Please enter GCash number");
      return;
    }

    if (
      payoutMethod === "bank_transfer" &&
      (!bankName || !bankAccount || !bankAccountName)
    ) {
      alert("Please fill in all bank details");
      return;
    }

    if (
      !confirm(
        `Process payout of ₱${(selectedWorker?.pending_payout ?? 0).toLocaleString()} to ${selectedWorker?.worker_name ?? "worker"
        }?`,
      )
    )
      return;

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/transactions/payout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            worker_id: selectedWorker.worker_id,
            amount: selectedWorker.pending_payout,
            payout_method: payoutMethod,
            gcash_number: payoutMethod === "gcash" ? gcashNumber : null,
            bank_name: payoutMethod === "bank_transfer" ? bankName : null,
            bank_account: payoutMethod === "bank_transfer" ? bankAccount : null,
            bank_account_name:
              payoutMethod === "bank_transfer" ? bankAccountName : null,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to process payout");

      alert("Payout processed successfully");
      setShowPayoutModal(false);
      setSelectedWorker(null);
      setGcashNumber("");
      setBankName("");
      setBankAccount("");
      setBankAccountName("");
      fetchWorkers();
      fetchStatistics();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process payout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative">
                  <TrendingUp className="h-16 w-16 text-blue-600 animate-pulse mx-auto" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Loading worker earnings...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-4 sm:p-8 text-white shadow-xl text-center sm:text-left">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />
                <h1 className="text-2xl sm:text-4xl font-bold">Worker Earnings</h1>
              </div>
              <p className="text-blue-100 text-sm sm:text-lg">
                Manage payouts and worker earnings
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1 uppercase font-semibold">Workers</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {statistics.total_workers}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-yellow-100 rounded-xl">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1 uppercase font-semibold">Pending Payout</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900 truncate">
                    ₱{(statistics.pending_payouts ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-green-100 rounded-xl">
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1 uppercase font-semibold">Total Paid Out</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900 truncate">
                    ₱{(statistics.total_payouts ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                      <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1 uppercase font-semibold">Processed Today</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {statistics.this_month_payouts?.count ?? 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by worker..."
                    className="w-full pl-9 h-11 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                >
                  <span className="hidden sm:inline mr-2">Search</span>
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {/* Desktop Table */}
            <Card className="border-0 shadow-lg hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        <th className="text-left p-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">
                          Worker
                        </th>
                        <th className="text-left p-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">
                          Earnings
                        </th>
                        <th className="text-left p-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">
                          Stats
                        </th>
                        <th className="text-right p-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12">
                            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No workers found</p>
                          </td>
                        </tr>
                      ) : (
                        workers.map((worker) => (
                          <tr
                            key={worker.id}
                            className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
                          >
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                  {worker.worker_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {worker.worker_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {worker.worker_email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="space-y-1">
                                <p className="text-sm text-gray-600">
                                  Total: <span className="font-bold">₱{worker.total_earnings.toLocaleString()}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                    ₱{worker.pending_payout.toLocaleString()} Pending
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex gap-4">
                                <div>
                                  <p className="text-[10px] text-gray-500 uppercase">Jobs</p>
                                  <p className="font-semibold text-gray-900">{worker.jobs_completed}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-500 uppercase">Rating</p>
                                  <p className="font-semibold text-green-600 text-sm">⭐ {worker.average_rating.toFixed(1)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-right">
                              <Button
                                onClick={() => openPayoutModal(worker)}
                                disabled={worker.pending_payout === 0}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                              >
                                <Send className="h-3.5 w-3.5 mr-2" />
                                Payout
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {workers.length === 0 ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No workers found</p>
                  </CardContent>
                </Card>
              ) : (
                workers.map((worker) => (
                  <Card key={worker.id} className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {worker.worker_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 truncate max-w-[150px]">{worker.worker_name}</h3>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{worker.worker_email}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 text-[10px]">
                          ⭐ {worker.average_rating.toFixed(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pending</p>
                          <p className="font-bold text-amber-600">₱{worker.pending_payout.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Paid</p>
                          <p className="font-bold text-gray-900">₱{worker.paid_out.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Total</p>
                          <p className="font-bold text-gray-900 text-xs">₱{worker.total_earnings.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Jobs</p>
                          <p className="font-bold text-gray-900 text-xs">{worker.jobs_completed}</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => openPayoutModal(worker)}
                        disabled={worker.pending_payout === 0}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Process Payout
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-4">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  className="h-10 px-3 sm:px-6 border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-gray-500 text-sm">Page</span>
                  <span className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg font-bold text-sm">
                    {page}
                  </span>
                </div>
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={workers.length < pageSize}
                  variant="outline"
                  className="h-10 px-3 sm:px-6 border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payout Modal */}
          {showPayoutModal && selectedWorker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Process Payout
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <p className="text-sm text-blue-700 mb-1">Worker</p>
                      <p className="font-semibold text-blue-900">
                        {selectedWorker.worker_name}
                      </p>
                      <p className="text-sm text-blue-700 mt-2">Amount</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ₱
                        {(selectedWorker?.pending_payout ?? 0).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payout Method
                      </label>
                      <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      >
                        <option value="gcash">💳 GCash</option>
                        <option value="bank_transfer">🏦 Bank Transfer</option>
                      </select>
                    </div>

                    {payoutMethod === "gcash" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GCash Number
                        </label>
                        <Input
                          value={gcashNumber}
                          onChange={(e) => setGcashNumber(e.target.value)}
                          placeholder="09XXXXXXXXX"
                          className="border-2 border-gray-200 rounded-lg"
                        />
                      </div>
                    )}

                    {payoutMethod === "bank_transfer" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bank Name
                          </label>
                          <Input
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. BDO, BPI, Metrobank"
                            className="border-2 border-gray-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Number
                          </label>
                          <Input
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            placeholder="XXXX-XXXX-XXXX"
                            className="border-2 border-gray-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Name
                          </label>
                          <Input
                            value={bankAccountName}
                            onChange={(e) => setBankAccountName(e.target.value)}
                            placeholder="As it appears in bank"
                            className="border-2 border-gray-200 rounded-lg"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={processPayout}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Process Payout
                      </Button>
                      <Button
                        onClick={() => {
                          setShowPayoutModal(false);
                          setSelectedWorker(null);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
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
