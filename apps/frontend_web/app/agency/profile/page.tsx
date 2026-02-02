"use client";

import React, { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/form_button";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Edit2,
  Save,
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  TrendingUp,
  Banknote,
  CreditCard,
  Plus,
  Trash2,
  Star,
  Smartphone,
} from "lucide-react";
import {
  useWalletBalance,
  useWalletTransactions,
} from "@/lib/hooks/useHomeData";
import { Transaction } from "@/lib/api/wallet";

interface AgencyProfile {
  account_id: number;
  email: string;
  contact_number: string | null;
  business_name: string | null;
  business_description: string | null;
  address: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  } | null;
  kyc_status: string;
  kyc_submitted_at: string | null;
  statistics: {
    total_employees: number;
    avg_employee_rating: number | null;
    total_jobs: number;
    active_jobs: number;
    completed_jobs: number;
  };
  created_at: string;
}

interface PaymentMethod {
  id: number;
  type: "GCASH";
  account_name: string;
  account_number: string;
  bank_name?: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

export default function AgencyProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "payment-methods"
  >("overview");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    number | null
  >(null);

  // Edit form states
  const [editBusinessDesc, setEditBusinessDesc] = useState("");
  const [editContactNumber, setEditContactNumber] = useState("");

  // Wallet hooks
  const {
    data: walletBalance = 0,
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
  } = useWalletBalance(true);
  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useWalletTransactions(activeTab === "transactions");

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/profile`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        // Initialize edit form values
        setEditBusinessDesc(data.business_description || "");
        setEditContactNumber(data.contact_number || "");
      } else {
        toast.error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile();
    return () => controller.abort();
  }, []);

  // Handle GCash verification callback from PayMongo
  useEffect(() => {
    const verifyStatus = searchParams.get("verify");
    const methodId = searchParams.get("method_id");

    if (verifyStatus === "success") {
      toast.success(
        "GCash account verified successfully! ₱1 has been credited to your wallet.",
      );
      // Switch to payment methods tab to show the verified method
      setActiveTab("payment-methods");
      // Clean up URL params
      router.replace("/agency/profile");
      // Refresh payment methods and wallet
      fetchPaymentMethods();
      refetchWallet();
    } else if (verifyStatus === "failed") {
      toast.error(
        "GCash verification failed. Please try adding your payment method again.",
      );
      setActiveTab("payment-methods");
      router.replace("/agency/profile");
      fetchPaymentMethods();
    }
  }, [searchParams]);

  // Fetch payment methods when tab changes
  useEffect(() => {
    if (activeTab === "payment-methods") {
      fetchPaymentMethods();
    }
  }, [activeTab]);

  const fetchPaymentMethods = async () => {
    setIsLoadingPaymentMethods(true);
    try {
      const res = await fetch(`${API_BASE}/api/agency/payment-methods`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.payment_methods || []);
      } else {
        toast.error("Failed to fetch payment methods");
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    // Validate GCash number format
    const cleanNumber = newAccountNumber.replace(/\s/g, "").replace(/-/g, "");
    if (!cleanNumber.startsWith("09") || cleanNumber.length !== 11) {
      toast.error("Invalid GCash number (must be 11 digits starting with 09)");
      return;
    }
    if (!newAccountName.trim()) {
      toast.error("Account name is required");
      return;
    }

    setIsAddingPaymentMethod(true);
    try {
      const res = await fetch(`${API_BASE}/api/agency/payment-methods`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GCASH",
          account_name: newAccountName.trim(),
          account_number: cleanNumber,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Check if verification is required (new production-ready flow)
        if (data.verification_required && data.checkout_url) {
          toast.info("Redirecting to PayMongo for GCash verification...");
          setShowAddPaymentModal(false);
          setNewAccountName("");
          setNewAccountNumber("");

          // Redirect to PayMongo checkout for verification
          // The ₱1 payment will verify ownership of the GCash account
          window.location.href = data.checkout_url;
        } else {
          // Legacy flow (if any)
          toast.success("GCash account added successfully!");
          setShowAddPaymentModal(false);
          setNewAccountName("");
          setNewAccountNumber("");
          fetchPaymentMethods();
        }
      } else {
        toast.error(data.error || "Failed to add payment method");
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      toast.error(getErrorMessage(error, "Failed to add payment method"));
    } finally {
      setIsAddingPaymentMethod(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: number) => {
    if (!confirm("Are you sure you want to remove this payment method?"))
      return;

    try {
      const res = await fetch(
        `${API_BASE}/api/agency/payment-methods/${methodId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (res.ok) {
        toast.success("Payment method removed");
        fetchPaymentMethods();
        // Clear selection if deleted method was selected
        if (selectedPaymentMethodId === methodId) {
          setSelectedPaymentMethodId(null);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove payment method");
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error(getErrorMessage(error, "Failed to remove payment method"));
    }
  };

  const handleSetPrimaryPaymentMethod = async (methodId: number) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/agency/payment-methods/${methodId}/set-primary`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (res.ok) {
        toast.success("Primary payment method updated");
        fetchPaymentMethods();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update primary method");
      }
    } catch (error) {
      console.error("Error setting primary payment method:", error);
      toast.error(getErrorMessage(error, "Failed to set primary payment method"));
    }
  };

  // Format GCash number for display
  const formatGcashNumber = (number: string) => {
    if (!number) return "";
    // Format as 0912 345 6789
    return `${number.slice(0, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;
  };

  const handleEditClick = () => {
    if (profile) {
      setEditBusinessDesc(profile.business_description || "");
      setEditContactNumber(profile.contact_number || "");
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setEditBusinessDesc(profile.business_description || "");
      setEditContactNumber(profile.contact_number || "");
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const formData = new FormData();

      // Only append non-empty values
      if (editBusinessDesc && editBusinessDesc.trim()) {
        formData.append("business_description", editBusinessDesc.trim());
      }
      if (editContactNumber && editContactNumber.trim()) {
        formData.append("contact_number", editContactNumber.trim());
      }

      console.log("Sending update:", {
        business_description: editBusinessDesc,
        contact_number: editContactNumber,
      });

      const res = await fetch(`${API_BASE}/api/agency/profile/update`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Update response:", data);
        toast.success("Profile updated successfully");
        setIsEditing(false);
        // Refresh profile data
        await fetchProfile();
      } else {
        const error = await res.json();
        toast.error(getErrorMessage(error, "Failed to update profile"));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Verified
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            Not Started
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Agency Profile</h1>
          </div>

          <div className="space-y-4">
            {/* Loading skeleton for profile cards */}
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Agency Profile</h1>
          <div className="text-sm text-red-500">Failed to load profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Agency Profile</h1>
          {!isEditing && (
            <Button
              onClick={handleEditClick}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Wallet Balance Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm font-medium">
                    Platform Wallet
                  </p>
                  <h2 className="text-3xl font-bold">
                    {isLoadingWallet ? (
                      <span className="text-emerald-200">Loading...</span>
                    ) : (
                      `₱${walletBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                    )}
                  </h2>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => refetchWallet()}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 h-10 w-10 p-0"
                  disabled={isLoadingWallet}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoadingWallet ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  onClick={() => {
                    fetchPaymentMethods();
                    setShowWithdrawModal(true);
                  }}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold"
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-200" />
                <div>
                  <p className="text-emerald-200 text-xs">Total Earnings</p>
                  <p className="font-semibold">
                    ₱
                    {transactions
                      .filter(
                        (t: Transaction) =>
                          ["DEPOSIT", "EARNING", "PENDING_EARNING", "REFUND"].includes(t.type),
                      )
                      .reduce(
                        (sum: number, t: Transaction) => sum + t.amount,
                        0,
                      )
                      .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-200" />
                <div>
                  <p className="text-emerald-200 text-xs">Total Withdrawn</p>
                  <p className="font-semibold">
                    ₱
                    {transactions
                      .filter((t: Transaction) => t.type === "WITHDRAWAL")
                      .reduce(
                        (sum: number, t: Transaction) =>
                          sum + Math.abs(t.amount),
                        0,
                      )
                      .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Overview / Transactions / Payment Methods */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "transactions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("payment-methods")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "payment-methods"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Payment Methods
          </button>
        </div>

        {activeTab === "transactions" ? (
          /* Transaction History */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No transactions yet</p>
                  <p className="text-sm">
                    Transactions will appear here when you complete jobs
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {transactions.map((tx: Transaction) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            tx.type === "WITHDRAWAL"
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {tx.type === "WITHDRAWAL" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {tx.description || tx.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            tx.type === "WITHDRAWAL"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {tx.type === "WITHDRAWAL" ? "-" : "+"}₱
                          {Math.abs(tx.amount).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : tx.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : activeTab === "payment-methods" ? (
          /* Payment Methods Management */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <Button
                  onClick={() => setShowAddPaymentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add GCash
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPaymentMethods ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="font-medium text-gray-900">
                    No payment methods yet
                  </p>
                  <p className="text-sm mb-4">
                    Add a GCash account to receive withdrawals
                  </p>
                  <Button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add GCash Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        method.is_primary
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* GCash Icon */}
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          G
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              {method.account_name}
                            </p>
                            {method.is_primary && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                <Star className="h-3 w-3" />
                                Primary
                              </span>
                            )}
                            {method.is_verified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 font-mono">
                            {formatGcashNumber(method.account_number)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.is_primary && (
                          <Button
                            onClick={() =>
                              handleSetPrimaryPaymentMethod(method.id)
                            }
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs"
                          >
                            Set Primary
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Business Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Business Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile.business_name || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      value={editBusinessDesc}
                      onChange={(e) => setEditBusinessDesc(e.target.value)}
                      placeholder="Enter business description"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {profile.business_description ||
                        "No description provided"}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p className="text-gray-900">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="w-full">
                      <label className="text-sm font-medium text-gray-500">
                        Contact Number
                      </label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={editContactNumber}
                          onChange={(e) => setEditContactNumber(e.target.value)}
                          placeholder="Enter contact number"
                          maxLength={11}
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profile.contact_number || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Card */}
            {profile.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Business Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900">
                    {profile.address.street && `${profile.address.street}, `}
                    {profile.address.city && `${profile.address.city}, `}
                    {profile.address.province && `${profile.address.province} `}
                    {profile.address.postal_code}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {profile.address.country}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* KYC Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    KYC Status
                  </span>
                  {getKycStatusBadge(profile.kyc_status)}
                </div>
                {profile.kyc_submitted_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Submitted on {formatDate(profile.kyc_submitted_at)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {formatDate(profile.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Withdraw Funds
              </h3>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                  setSelectedPaymentMethodId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Available Balance</p>
              <p className="text-2xl font-bold text-emerald-600">
                ₱
                {walletBalance.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdraw to
              </label>
              {paymentMethods.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 mb-2">
                    No GCash account found
                  </p>
                  <Button
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setActiveTab("payment-methods");
                      setTimeout(() => setShowAddPaymentModal(true), 300);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add GCash Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethodId(method.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        selectedPaymentMethodId === method.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        G
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {method.account_name}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {formatGcashNumber(method.account_number)}
                        </p>
                      </div>
                      {selectedPaymentMethodId === method.id && (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Withdraw
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₱
                </span>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                  min={100}
                  max={walletBalance}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum withdrawal: ₱100.00
              </p>
            </div>

            {/* Quick amount buttons */}
            <div className="flex gap-2 mb-6">
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setWithdrawAmount(amt.toString())}
                  disabled={walletBalance < amt}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    walletBalance >= amt
                      ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  ₱{amt.toLocaleString()}
                </button>
              ))}
              <button
                onClick={() => setWithdrawAmount(walletBalance.toString())}
                disabled={walletBalance < 100}
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                  walletBalance >= 100
                    ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                All
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                }}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedPaymentMethodId && paymentMethods.length > 0) {
                    toast.error("Please select a payment method");
                    return;
                  }
                  if (paymentMethods.length === 0) {
                    toast.error("Please add a GCash account first");
                    return;
                  }
                  const amount = parseFloat(withdrawAmount);
                  if (!amount || amount < 100) {
                    toast.error("Minimum withdrawal is ₱100.00");
                    return;
                  }
                  if (amount > walletBalance) {
                    toast.error("Insufficient balance");
                    return;
                  }

                  // Must select a payment method
                  const methodId =
                    selectedPaymentMethodId || paymentMethods[0]?.id;
                  if (!methodId) {
                    toast.error("Please select a GCash account");
                    return;
                  }

                  setIsWithdrawing(true);
                  try {
                    // Use agency-specific withdrawal endpoint (with Xendit)
                    const res = await fetch(
                      `${API_BASE}/api/agency/wallet/withdraw`,
                      {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          amount,
                          payment_method_id: methodId,
                        }),
                      },
                    );

                    const data = await res.json();

                    if (res.ok && data.success) {
                      // Handle test mode with invoice URL
                      if (data.invoice_url && data.test_mode) {
                        toast.success(
                          `TEST MODE: Withdrawal invoice created for ₱${amount.toLocaleString()}`,
                          {
                            description: "Opening invoice in new tab...",
                            duration: 5000,
                          },
                        );
                        // Open invoice URL in new tab
                        window.open(data.invoice_url, "_blank");
                      } else {
                        toast.success(
                          `Withdrawal of ₱${amount.toLocaleString()} submitted! ${data.message || "Funds will arrive in 1-3 business days."}`,
                        );
                      }
                      setShowWithdrawModal(false);
                      setWithdrawAmount("");
                      setSelectedPaymentMethodId(null);
                      refetchWallet();
                    } else {
                      toast.error(data.error || "Failed to request withdrawal");
                    }
                  } catch (error) {
                    console.error("Withdrawal error:", error);
                    toast.error(getErrorMessage(error, "Failed to request withdrawal"));
                  } finally {
                    setIsWithdrawing(false);
                  }
                }}
                disabled={
                  isWithdrawing ||
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) < 100 ||
                  paymentMethods.length === 0 ||
                  (!selectedPaymentMethodId && paymentMethods.length > 0)
                }
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300"
              >
                {isWithdrawing ? "Processing..." : "Withdraw via GCash"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                  G
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Add GCash Account
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setNewAccountName("");
                  setNewAccountNumber("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <Input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Name registered on your GCash account
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GCash Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="tel"
                    value={newAccountNumber}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 11) {
                        setNewAccountNumber(value);
                      }
                    }}
                    placeholder="09123456789"
                    className="pl-10"
                    maxLength={11}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  11-digit number starting with 09
                </p>
              </div>

              {/* Validation feedback */}
              {newAccountNumber && (
                <div
                  className={`flex items-center gap-2 text-sm ${
                    newAccountNumber.startsWith("09") &&
                    newAccountNumber.length === 11
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                >
                  {newAccountNumber.startsWith("09") &&
                  newAccountNumber.length === 11 ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Valid GCash number format</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>
                        {!newAccountNumber.startsWith("09")
                          ? "Must start with 09"
                          : `${11 - newAccountNumber.length} more digit${11 - newAccountNumber.length !== 1 ? "s" : ""} needed`}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Verification Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Secure Verification
                    </h4>
                    <p className="text-xs text-blue-700 mt-1">
                      After clicking "Verify Account", you'll be redirected to
                      PayMongo to pay ₱1 via GCash. This confirms you own the
                      account. The ₱1 will be credited to your wallet!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setNewAccountName("");
                  setNewAccountNumber("");
                }}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                disabled={
                  isAddingPaymentMethod ||
                  !newAccountName.trim() ||
                  !newAccountNumber.startsWith("09") ||
                  newAccountNumber.length !== 11
                }
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isAddingPaymentMethod ? "Verifying..." : "Verify Account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
