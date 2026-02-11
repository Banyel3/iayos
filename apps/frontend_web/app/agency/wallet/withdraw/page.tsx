"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
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
        // Show all payment methods (no verification check - admins process manually)
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
        return <Smartphone className="h-5 w-5 text-blue-600" />;
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Withdrawal Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your withdrawal request has been submitted for admin approval.
            </p>

            {/* Receipt Card */}
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-lg">{formatCurrency(withdrawResult.amount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">To</span>
                <span className="font-medium">{withdrawResult.recipient_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Account</span>
                <span className="font-medium">{withdrawResult.recipient}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Status</span>
                <div className="flex items-center gap-1.5 text-yellow-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Pending Approval</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-sm">#{withdrawResult.transaction_id}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">New Balance</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(withdrawResult.new_balance)}
                </span>
              </div>
            </div>

            {/* Processing Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-start gap-3 text-left">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Processing Time</p>
                <p className="mt-1">
                  Your withdrawal will be processed within 24 hours after admin approval.
                  You&apos;ll receive a notification once the payment is sent.
                </p>
              </div>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-green-700 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-8 py-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <Send className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Withdraw Funds</h1>
              <p className="text-green-100 mt-1">Request a payout to your payment account</p>
            </div>
          </div>

          {/* Current Balance */}
          <Card className="mt-6 bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Available Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(walletBalance)}</p>
                </div>
                <Wallet className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Withdrawal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (min ₱100)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500">
                  ₱
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 text-2xl h-14 font-bold"
                  min="100"
                  max={walletBalance}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {formatCurrency(walletBalance)}
              </p>
            </div>

            {/* Preset Amounts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((presetAmount) => (
                  <Button
                    key={presetAmount}
                    variant={amount === presetAmount.toString() ? "default" : "outline"}
                    onClick={() => handlePresetClick(presetAmount)}
                    disabled={presetAmount > walletBalance}
                    className={
                      amount === presetAmount.toString()
                        ? "bg-green-600 hover:bg-green-700"
                        : presetAmount > walletBalance
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                    }
                  >
                    ₱{presetAmount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdraw To
              </label>
              {isLoadingMethods ? (
                <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No payment methods</p>
                  <p className="text-sm text-gray-500 mt-1">
                    You need to add a payment account to withdraw funds
                  </p>
                  <Button
                    variant="link"
                    className="mt-2 text-green-600"
                    onClick={() => router.push("/agency/profile?tab=payment-methods")}
                  >
                    Add Payment Method →
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethodId(method.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMethodId === method.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getMethodIcon(method.type)}
                          <div>
                            <p className="font-medium text-gray-900">{method.account_name}</p>
                            <p className="text-sm text-gray-500">
                              {getMethodLabel(method)} • {method.account_number}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.is_primary && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                          {selectedMethodId === method.id && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for admin reference..."
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Preview */}
            {amount && parseFloat(amount) >= 100 && parseFloat(amount) <= walletBalance && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-2">After withdrawal:</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">New Balance</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(walletBalance - parseFloat(amount))}
                  </span>
                </div>
              </div>
            )}

            {/* Processing Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Processing Time</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Withdrawal requests are reviewed and processed within 24 hours.
                    You&apos;ll receive a notification once the payment is sent to your selected account.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleWithdraw}
              disabled={
                isLoading ||
                !amount ||
                parseFloat(amount) < 100 ||
                parseFloat(amount) > walletBalance ||
                !selectedMethodId ||
                paymentMethods.length === 0
              }
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Request Withdrawal
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              By requesting a withdrawal, you agree to our payment terms and conditions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
