"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Wallet,
  Send,
  ArrowLeft,
  CreditCard,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Smartphone,
  Info,
  ChevronRight,
  ShieldCheck,
  Banknote,
} from "lucide-react";
import { API_BASE } from "@/lib/api/config";
import { useWalletBalance } from "@/lib/hooks/useHomeData";

interface PaymentMethod {
  id: number;
  type: "GCASH" | "BANK" | "PAYPAL" | "VISA" | "GRABPAY" | "MAYA";
  account_name: string;
  account_number: string;
  bank_name: string | null;
  is_primary: boolean;
  is_verified: boolean;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function AgencyWithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<{
    transaction_id: number;
    new_balance: number;
    amount: number;
    recipient: string;
    recipient_name: string;
  } | null>(null);

  const { data: walletBalance = 0, refetch: refetchWallet } = useWalletBalance(true);

  // Fetch payment methods on mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const res = await fetch(`${API_BASE}/api/agency/payment-methods`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const methods = data.payment_methods || [];
        setPaymentMethods(methods);
        // Auto-select primary method
        const primary = methods.find((m: PaymentMethod) => m.is_primary);
        if (primary) {
          setSelectedMethodId(primary.id);
        } else if (methods.length > 0) {
          setSelectedMethodId(methods[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePresetClick = (presetAmount: number) => {
    if (presetAmount <= walletBalance) {
      setAmount(presetAmount.toString());
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "GCASH":
        return <Smartphone className="h-5 w-5 text-[#00BAF1]" />;
      case "BANK":
        return <Building2 className="h-5 w-5 text-gray-600" />;
      case "PAYPAL":
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case "VISA":
        return <CreditCard className="h-5 w-5 text-indigo-600" />;
      case "GRABPAY":
        return <Smartphone className="h-5 w-5 text-green-600" />;
      case "MAYA":
        return <Smartphone className="h-5 w-5 text-green-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method.type) {
      case "GCASH":
        return "GCash";
      case "BANK":
        return method.bank_name || "Bank Transfer";
      case "PAYPAL":
        return "PayPal";
      case "VISA":
        return "Visa";
      case "GRABPAY":
        return "GrabPay";
      case "MAYA":
        return "Maya";
      default:
        return method.type;
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (isNaN(withdrawAmount) || withdrawAmount < 100) {
      toast.error("Minimum withdrawal is ₱100");
      return;
    }
    
    if (withdrawAmount > walletBalance) {
      toast.error(`Insufficient balance. You have ${formatCurrency(walletBalance)} available.`);
      return;
    }

    if (!selectedMethodId) {
      toast.error("Please select a payment method");
      return;
    }

    if (paymentMethods.length === 0) {
      toast.error("Please add a payment method first");
      router.push("/agency/profile?tab=payment-methods");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agency/wallet/withdraw`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawAmount,
          payment_method_id: selectedMethodId,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setWithdrawResult({
          transaction_id: data.transaction_id,
          new_balance: data.new_balance,
          amount: withdrawAmount,
          recipient: data.recipient || selectedMethod?.account_number || "",
          recipient_name: data.recipient_name || selectedMethod?.account_name || "",
        });
        setShowSuccess(true);
        refetchWallet();
      } else {
        toast.error(data.error || "Failed to process withdrawal");
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("Error processing withdrawal");
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen
  if (showSuccess && withdrawResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
          <div className="h-2 bg-[#00BAF1]" />
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted</h2>
            <p className="text-gray-500 mb-8 text-sm">
              Your withdrawal request is being processed.
            </p>

            {/* Receipt Details */}
            <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 mb-8 border border-gray-100">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</span>
                <span className="font-bold text-xl text-gray-900">{formatCurrency(withdrawResult.amount)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recipient</span>
                <span className="font-bold text-sm text-gray-900">{withdrawResult.recipient_name}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Account</span>
                <span className="font-bold text-sm text-gray-900">{withdrawResult.recipient}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</span>
                <div className="flex items-center gap-1.5 text-yellow-600">
                  <Clock className="h-3 w-3" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Pending Approval</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Reference</span>
                <span className="font-mono text-xs text-gray-900 font-bold">#{withdrawResult.transaction_id}</span>
              </div>
            </div>

            <div className="bg-sky-50 rounded-xl p-4 mb-8 flex items-start gap-3 text-left border border-sky-100">
              <Info className="h-5 w-5 text-[#00BAF1] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-sky-900 leading-relaxed font-medium">
                Requests are processed within 1-24 hours. You&apos;ll be notified once the funds are sent.
              </div>
            </div>

            <Button
              className="w-full h-12 bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white font-bold rounded-xl"
              onClick={() => router.push("/agency/wallet")}
            >
              Back to Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
       {/* Header */}
       <div className="pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-500 hover:text-[#00BAF1] hover:bg-[#00BAF1]/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Banknote className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Withdraw Funds</h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              Transfer your earnings to your connected account
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50">
              <CardTitle className="text-lg">Withdrawal Amount</CardTitle>
              <CardDescription>Enter the amount you wish to withdraw to your selected account</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Amount Input */}
              <div>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-300 group-focus-within:text-[#00BAF1] transition-colors">
                    ₱
                  </span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-14 text-4xl h-20 font-extrabold border-gray-100 focus:border-[#00BAF1] focus:ring-4 focus:ring-sky-100 rounded-2xl transition-all"
                    min="100"
                    max={walletBalance}
                  />
                </div>
                <div className="flex items-center justify-between mt-4 px-2">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                     Available: <span className="text-gray-900">{formatCurrency(walletBalance)}</span>
                   </p>
                   {amount && parseFloat(amount) > walletBalance && (
                     <p className="text-[10px] font-bold text-red-500 uppercase">Insufficient balance</p>
                   )}
                </div>
              </div>

              {/* Quick Select */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Quick Select</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {PRESET_AMOUNTS.map((presetAmount) => (
                    <Button
                      key={presetAmount}
                      variant="outline"
                      onClick={() => handlePresetClick(presetAmount)}
                      disabled={presetAmount > walletBalance}
                      className={`h-12 font-bold rounded-xl border-gray-100 transition-all ${
                        amount === presetAmount.toString()
                          ? "bg-[#00BAF1]/10 border-[#00BAF1] text-[#00BAF1] shadow-sm"
                          : "hover:border-[#00BAF1] hover:text-[#00BAF1] hover:bg-[#00BAF1]/5"
                      }`}
                    >
                      ₱{presetAmount.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                 <div className="flex items-center justify-between px-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Account</p>
                    <button 
                       onClick={() => router.push("/agency/profile?tab=payment-methods")}
                       className="text-[10px] font-bold text-[#00BAF1] uppercase hover:underline"
                    >
                       Manage Accounts
                    </button>
                 </div>

                 {isLoadingMethods ? (
                    <div className="h-40 bg-gray-50 rounded-2xl flex items-center justify-center">
                       <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
                    </div>
                 ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                       <AlertCircle className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                       <h3 className="text-sm font-bold text-gray-900">No payment accounts</h3>
                       <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto">Add a GCash or Bank account in your profile settings to enable withdrawals.</p>
                       <Button
                          variant="outline"
                          size="sm"
                          className="mt-6 rounded-xl font-bold text-[10px] uppercase border-[#00BAF1] text-[#00BAF1] hover:bg-[#00BAF1]/5"
                          onClick={() => router.push("/agency/profile?tab=payment-methods")}
                       >
                          Add Account Now
                       </Button>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {paymentMethods.map((method) => (
                          <div
                             key={method.id}
                             onClick={() => setSelectedMethodId(method.id)}
                             className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                                selectedMethodId === method.id
                                   ? "border-[#00BAF1] bg-[#00BAF1]/5 shadow-sm"
                                   : "border-gray-50 bg-white hover:border-[#00BAF1]/30"
                             }`}
                          >
                             <div className={`p-3 rounded-xl bg-white shadow-sm border border-gray-50 ${selectedMethodId === method.id ? "text-[#00BAF1]" : "text-gray-400"}`}>
                                {getMethodIcon(method.type)}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                   <p className="text-sm font-bold text-gray-900 truncate">{method.account_name}</p>
                                   {method.is_primary && (
                                      <div className="bg-[#00BAF1]/10 text-[#00BAF1] text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Primary</div>
                                   )}
                                </div>
                                <p className="text-[10px] font-medium text-gray-400">
                                   {getMethodLabel(method)} • {method.account_number}
                                </p>
                             </div>
                             {selectedMethodId === method.id && (
                                <div className="h-5 w-5 rounded-full bg-[#00BAF1] flex items-center justify-center">
                                   <CheckCircle className="h-3.5 w-3.5 text-white" />
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Notes */}
              <div className="space-y-3 pt-4 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Reference Note (Optional)</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Weekly agency payout..."
                  className="resize-none border-gray-100 rounded-xl focus:border-[#00BAF1] focus:ring-sky-100 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border-0 shadow-lg overflow-hidden">
             <div className="h-1 bg-[#00BAF1]" />
             <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="space-y-4 py-4 border-y border-gray-50">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Selected Amount</span>
                      <span className="font-bold text-gray-900">{amount ? formatCurrency(parseFloat(amount)) : "₱0.00"}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Processing Fee</span>
                      <span className="font-bold text-green-600">FREE</span>
                   </div>
                   <div className="flex justify-between items-center pt-2">
                       <span className="text-xs font-bold text-gray-400 uppercase">You will receive</span>
                       <span className="font-extrabold text-[#00BAF1] text-lg">{amount ? formatCurrency(parseFloat(amount)) : "₱0.00"}</span>
                   </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 rounded-xl border border-sky-100">
                    <ShieldCheck className="h-4 w-4 text-[#00BAF1]" />
                    <span className="text-[10px] font-bold text-sky-900 uppercase">Secure Transaction</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">ETA: 1-24 HOURS</span>
                  </div>
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={
                    isLoading ||
                    !amount ||
                    parseFloat(amount) < 100 ||
                    parseFloat(amount) > walletBalance ||
                    !selectedMethodId
                  }
                  className="w-full h-14 bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white font-bold rounded-2xl shadow-xl shadow-sky-100 group transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      <span>Confirm Withdrawal</span>
                    </div>
                  )}
                </Button>

                <p className="text-[10px] text-center text-gray-400 font-medium leading-relaxed">
                  By confirming, you agree to our financial policy. Your funds will be sent to the selected account after verification.
                </p>
             </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-0 bg-[#00BAF1]/5 border-2 border-[#00BAF1]/10">
             <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-[#00BAF1]" />
                  <span className="text-xs font-bold text-[#00BAF1] uppercase tracking-widest">Withdrawal Tip</span>
                </div>
                <p className="text-xs text-sky-900 leading-relaxed font-medium">
                  To ensure faster processing, please make sure your account details match your official registration on the selected platform.
                </p>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
