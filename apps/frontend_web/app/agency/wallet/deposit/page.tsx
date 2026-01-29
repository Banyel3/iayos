"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Wallet,
  Plus,
  ArrowLeft,
  CreditCard,
  Loader2,
  CheckCircle,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { API_BASE } from "@/lib/api/config";
import { useWalletBalance } from "@/lib/hooks/useHomeData";

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function AgencyDepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: walletBalance = 0, refetch: refetchWallet } = useWalletBalance(true);

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 100) {
      toast.error("Minimum deposit is ₱100");
      return;
    }
    if (depositAmount > 100000) {
      toast.error("Maximum deposit is ₱100,000");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agency/wallet/deposit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount }),
      });

      const data = await res.json();

      if (res.ok && data.checkout_url) {
        toast.success("Redirecting to payment...");
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.error || "Failed to create deposit");
      }
    } catch (error) {
      console.error("Error creating deposit:", error);
      toast.error("Error processing deposit");
    } finally {
      setIsLoading(false);
    }
  };

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
              <Plus className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Add Funds</h1>
              <p className="text-green-100 mt-1">Deposit to your agency wallet via GCash</p>
            </div>
          </div>

          {/* Current Balance */}
          <Card className="mt-6 bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Current Balance</p>
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
              <CreditCard className="h-5 w-5 text-green-600" />
              Deposit Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Amount (₱100 - ₱100,000)
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
                  max="100000"
                />
              </div>
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
                    className={
                      amount === presetAmount.toString()
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }
                  >
                    ₱{presetAmount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {amount && parseFloat(amount) >= 100 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-2">After deposit:</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">New Balance</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(walletBalance + parseFloat(amount))}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">GCash Payment</p>
                  <p className="text-sm text-blue-700 mt-1">
                    You&apos;ll be redirected to GCash to complete the payment securely.
                    The funds will be credited to your wallet immediately after payment.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleDeposit}
              disabled={isLoading || !amount || parseFloat(amount) < 100}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Continue to GCash
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Powered by PayMongo • Secure payment processing
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
