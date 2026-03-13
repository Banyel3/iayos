"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api/config";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/generic_button";
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
  CreditCard,
  Plus,
  Trash2,
  Star,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  User,
  Settings,
  ArrowLeft,
  Briefcase,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [activeTab, setActiveTab] = useState<"overview" | "payment-methods">("overview");

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [pendingDeleteMethodId, setPendingDeleteMethodId] = useState<number | null>(null);

  // Edit form states
  const [editBusinessDesc, setEditBusinessDesc] = useState("");
  const [editContactNumber, setEditContactNumber] = useState("");

  const fetchProfile = async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/profile`, {
        credentials: "include",
        signal,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditBusinessDesc(data.business_description || "");
        setEditContactNumber(data.contact_number || "");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Error fetching profile:", error);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab === "overview" || requestedTab === "payment-methods") {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

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
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    const cleanNumber = newAccountNumber.replace(/\s/g, "").replace(/-/g, "");
    if (!cleanNumber.startsWith("09") || cleanNumber.length !== 11) {
      toast.error("Invalid GCash number (11 digits starting with 09)");
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
        if (data.verification_required && data.checkout_url) {
          toast.info("Redirecting for verification...");
          window.location.href = data.checkout_url;
        } else {
          toast.success("Account added successfully");
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
      toast.error("Failed to add payment method");
    } finally {
      setIsAddingPaymentMethod(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/payment-methods/${methodId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Payment method removed");
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to remove payment method");
    }
  };

  const handleSetPrimaryPaymentMethod = async (methodId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/payment-methods/${methodId}/set-primary`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Primary method updated");
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error("Error setting primary method:", error);
      toast.error("Failed to update primary method");
    }
  };

  const formatGcashNumber = (number: string) => {
    if (!number) return "";
    return `${number.slice(0, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      if (editBusinessDesc.trim()) formData.append("business_description", editBusinessDesc.trim());
      if (editContactNumber.trim()) formData.append("contact_number", editContactNumber.trim());

      const res = await fetch(`${API_BASE}/api/agency/profile/update`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        toast.success("Profile updated");
        setIsEditing(false);
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
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3 mr-1.5" />
            Verified
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            <Clock className="h-3 w-3 mr-1.5" />
            Pending Review
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            <XCircle className="h-3 w-3 mr-1.5" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            <Clock className="h-3 w-3 mr-1.5" />
            Not Started
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
        <div className="animate-pulse flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-100 rounded-lg" />
            <div className="h-4 w-32 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-50 rounded-2xl" />
          <div className="h-64 bg-gray-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto pt-40 px-4 text-center">
        <XCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
        <p className="text-sm font-bold text-gray-700 mb-2">Profile not found</p>
        <p className="text-xs font-medium text-gray-400 mb-6">Unable to load your agency profile. Please try again.</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white rounded-xl px-6 h-11 font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-sky-100"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
             <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
             <div>
               <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.business_name || "Agency Profile"}</h1>
               <div className="flex items-center gap-3 mt-1">
                 <p className="text-gray-500 text-sm">{profile.email}</p>
                 <div className="w-1 h-1 bg-gray-300 rounded-full" />
                 <p className="text-gray-500 text-sm">Joined {new Date(profile.created_at).getFullYear()}</p>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-100 rounded-xl px-4 font-bold text-[10px] uppercase tracking-wider h-11 transition-all"
              >
                <Edit2 className="h-3 w-3 mr-2 text-[#00BAF1]" />
                Edit Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-8 mt-6">
         <div className="flex items-center gap-1 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
            <button
               onClick={() => setActiveTab("overview")}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === "overview" 
                  ? "bg-white text-[#00BAF1] shadow-sm ring-1 ring-gray-100" 
                  : "text-gray-400 hover:text-gray-600"
               }`}
            >
               <User className="h-3.5 w-3.5" />
               Business Profile
            </button>
            <button
               onClick={() => setActiveTab("payment-methods")}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === "payment-methods" 
                  ? "bg-white text-[#00BAF1] shadow-sm ring-1 ring-gray-100" 
                  : "text-gray-400 hover:text-gray-600"
               }`}
            >
               <CreditCard className="h-3.5 w-3.5" />
               Payout Methods
            </button>
         </div>

         {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Left Side: General Info */}
               <div className="lg:col-span-2 space-y-8">
                  <Card className="border-0 shadow-xl overflow-hidden group">
                     <CardHeader className="bg-white border-b border-gray-50 pb-4">
                        <div className="flex items-center justify-between">
                           <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                 <Building2 className="h-5 w-5 text-[#00BAF1]" />
                                 Organization Details
                              </CardTitle>
                              <CardDescription>Manage your public agency identity</CardDescription>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business Name</label>
                              <p className="text-gray-900 font-bold">{profile.business_name || "---"}</p>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                              <p className="text-gray-900 font-bold">{profile.email}</p>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Number</label>
                              {isEditing ? (
                                 <Input 
                                    className="bg-gray-50 border-gray-100 rounded-xl"
                                    value={editContactNumber} 
                                    onChange={(e) => setEditContactNumber(e.target.value)} 
                                 />
                              ) : (
                                 <p className="text-gray-900 font-bold">{profile.contact_number || "Not provided"}</p>
                              )}
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verification Status</label>
                              <div className="pt-1">{getKycStatusBadge(profile.kyc_status)}</div>
                           </div>
                        </div>

                        <div className="space-y-2.5 pt-4 border-t border-gray-50">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">About the Agency</label>
                           {isEditing ? (
                              <textarea
                                 className="w-full min-h-[120px] bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BAF1]/20 transition-all font-medium"
                                 value={editBusinessDesc}
                                 onChange={(e) => setEditBusinessDesc(e.target.value)}
                                 placeholder="Tell us about your agency's expertise..."
                              />
                           ) : (
                              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                 {profile.business_description || "No description provided yet."}
                              </p>
                           )}
                        </div>

                        {isEditing && (
                           <div className="flex items-center gap-3 pt-6">
                              <Button 
                                 onClick={handleSaveProfile} 
                                 disabled={isSaving}
                                 className="bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white px-8 rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-sky-100"
                              >
                                 {isSaving ? "Saving..." : "Save Profile"}
                              </Button>
                              <Button 
                                 variant="outline" 
                                 onClick={() => setIsEditing(false)}
                                 className="border-gray-100 hover:bg-gray-50 rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest"
                              >
                                 Cancel
                              </Button>
                           </div>
                        )}
                     </CardContent>
                  </Card>

                  {/* Address Section */}
                  <Card className="border-0 shadow-xl overflow-hidden">
                     <CardHeader className="bg-white border-b border-gray-50 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                           <MapPin className="h-5 w-5 text-[#00BAF1]" />
                           HQ Location
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-8">
                        {profile.address ? (
                           <div className="flex items-start gap-4">
                              <div className="p-3 bg-gray-50 rounded-xl">
                                 <MapPin className="h-6 w-6 text-gray-300" />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-gray-900 font-bold">
                                    {profile.address.street}, {profile.address.city}
                                 </p>
                                 <p className="text-gray-500 text-sm">
                                    {profile.address.province}, {profile.address.country} {profile.address.postal_code}
                                 </p>
                              </div>
                           </div>
                        ) : (
                           <div className="text-center py-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                             <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Address not verified yet</p>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </div>

               {/* Right Side: Stats & KYC */}
               <div className="space-y-8">

                  {/* KYC Upsell */}
                  {profile.kyc_status !== "APPROVED" && (
                    <Card className="border-0 shadow-2xl bg-gradient-to-br from-[#00BAF1] to-[#0092c1] text-white">
                      <CardContent className="p-8 space-y-4">
                        <ShieldCheck className="h-10 w-10 text-white/50" />
                        <div>
                          <h3 className="text-lg font-bold">Complete KYC</h3>
                          <p className="text-white/80 text-sm mt-1 leading-relaxed">
                            Verify your agency to unlock higher withdrawal limits and premium trust badges.
                          </p>
                        </div>
                        <Button 
                          onClick={() => router.push("/agency/kyc")}
                          className="w-full bg-white text-[#00BAF1] hover:bg-white/90 font-bold text-[10px] uppercase tracking-widest rounded-xl h-11 border-0 shadow-lg"
                        >
                          Verify Now
                        </Button>
                      </CardContent>
                    </Card>
                  )}
               </div>
            </div>
         )}

         {activeTab === "payment-methods" && (
            <div className="max-w-4xl space-y-8">
               <div className="flex items-start justify-between">
                  <div>
                     <h2 className="text-2xl font-bold text-gray-900">Payout Settings</h2>
                     <p className="text-gray-500 text-sm mt-1">Manage where your earnings are sent</p>
                  </div>
                  <Button 
                     onClick={() => setShowAddPaymentModal(true)}
                     className="bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white rounded-xl h-12 px-6 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-sky-100"
                  >
                     <Plus className="h-4 w-4 mr-2" />
                     Add GCash
                  </Button>
               </div>

               {isLoadingPaymentMethods ? (
                  <div className="space-y-4">
                     {[1, 2].map(id => <div key={id} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />)}
                  </div>
               ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                     <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-sm mb-4">
                        <Smartphone className="h-8 w-8 text-[#00BAF1]" />
                     </div>
                     <h3 className="text-lg font-bold text-gray-900">No payment methods found</h3>
                     <p className="text-gray-400 text-sm mt-1">Connect your GCash account to start receiving earnings.</p>
                     <Button 
                        variant="outline" 
                        onClick={() => setShowAddPaymentModal(true)}
                        className="mt-6 border-[#00BAF1] text-[#00BAF1] hover:bg-[#00BAF1]/5 rounded-xl px-8 h-12 font-bold text-[10px] uppercase tracking-widest"
                     >
                        Link GCash Now
                     </Button>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 gap-4">
                     {paymentMethods.map((method) => (
                        <Card 
                           key={method.id} 
                           className={`border-0 shadow-lg group hover:shadow-xl transition-all overflow-hidden ${method.is_primary ? "bg-white ring-2 ring-[#00BAF1]" : "bg-white"}`}
                        >
                           <CardContent className="p-6">
                              <div className="flex items-center justify-between gap-6">
                                 <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-[#00BAF1] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-sky-100">
                                       G
                                    </div>
                                    <div className="space-y-1">
                                       <div className="flex items-center gap-3">
                                          <p className="text-lg font-bold text-gray-900">{method.account_name}</p>
                                          {method.is_primary && (
                                             <Badge className="bg-sky-50 text-[#00BAF1] border-sky-100 text-[8px] font-black tracking-tighter uppercase px-2 py-0.5">Primary</Badge>
                                          )}
                                       </div>
                                       <p className="text-gray-500 font-bold tracking-widest text-[13px]">{formatGcashNumber(method.account_number)}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    {!method.is_primary && (
                                       <Button 
                                          variant="ghost"
                                          onClick={() => handleSetPrimaryPaymentMethod(method.id)}
                                          className="text-[#00BAF1] hover:bg-[#00BAF1]/5 font-bold text-[10px] uppercase tracking-widest px-4 h-10 rounded-xl"
                                       >
                                          Make Primary
                                       </Button>
                                    )}
                                    <Button 
                                       variant="ghost" 
                                       onClick={() => setPendingDeleteMethodId(method.id)}
                                       className="w-10 h-10 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                       <Trash2 className="h-4 w-4" />
                                    </Button>
                                 </div>
                              </div>
                           </CardContent>
                        </Card>
                     ))}
                  </div>
               )}
            </div>
         )}
      </div>

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden rounded-3xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="bg-[#00BAF1] text-white p-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-white/20 rounded-xl">
                        <Smartphone className="h-5 w-5" />
                     </div>
                     <CardTitle className="text-xl">Add GCash</CardTitle>
                  </div>
                  <button onClick={() => setShowAddPaymentModal(false)} className="text-white/60 hover:text-white transition-colors">
                     <X className="h-5 w-5" />
                  </button>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Holder Name</label>
                  <Input
                    className="h-12 border-gray-100 bg-gray-50 focus:bg-white rounded-xl font-bold"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Full name on GCash"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GCash Mobile Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input
                      className="h-12 pl-11 border-gray-100 bg-gray-50 focus:bg-white rounded-xl font-bold tracking-widest"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="09XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                 <p className="text-[11px] text-[#00BAF1] leading-relaxed font-bold">
                    Ownership verification: You will be redirected to confirm a small ₱1 transaction which will be credited back to your balance.
                 </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleAddPaymentMethod}
                  disabled={isAddingPaymentMethod || !newAccountName.trim() || newAccountNumber.length !== 11}
                  className="w-full bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-sky-100"
                >
                  {isAddingPaymentMethod ? "Processing..." : "Verify & Add Account"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="text-gray-400 font-bold text-[10px] uppercase"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={pendingDeleteMethodId !== null}
        onOpenChange={(open) => !open && setPendingDeleteMethodId(null)}
      >
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Remove Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 font-medium">
              Are you sure you want to remove this GCash account? You will need to re-verify it to use it again for payouts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl border-gray-100 font-bold text-[10px] uppercase">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-[10px] uppercase px-8 h-10 border-0"
              onClick={() => {
                if (pendingDeleteMethodId !== null) {
                  handleDeletePaymentMethod(pendingDeleteMethodId);
                  setPendingDeleteMethodId(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
