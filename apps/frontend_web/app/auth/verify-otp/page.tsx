"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { API_BASE } from "@/lib/api/config";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/form_button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every((digit) => digit) && value) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join("");

    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/accounts/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/auth/login?verified=true");
        }, 2000);
      } else {
        setError(data.error || "Verification failed");
        if (data.remaining_attempts !== undefined) {
          setError(`${data.error}`);
        }
        if (data.expired || data.max_attempts_reached) {
          setTimeLeft(0);
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError("");

    try {
      // First, call resend-otp to generate new OTP
      const resendRes = await fetch(`${API_BASE}/api/accounts/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        if (resendData.wait_seconds) {
          setResendCooldown(resendData.wait_seconds);
        }
        setError(resendData.error || "Failed to resend OTP");
        return;
      }

      // Then send the OTP email
      const emailRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp_code: resendData.otp_code,
          expires_in_minutes: resendData.expires_in_minutes,
        }),
      });

      if (emailRes.ok) {
        setTimeLeft(300); // Reset timer to 5 minutes
        setResendCooldown(60); // 60 second cooldown between resends
        setOtp(["", "", "", "", "", ""]); // Clear inputs
        inputRefs.current[0]?.focus();
      } else {
        setError("Failed to send email. Please try again.");
      }
    } catch (err) {
      console.error("Resend error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verified!
          </h1>
          <p className="text-gray-600 mb-6">
            Your email has been verified successfully. Redirecting to login...
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="iAyos"
              width={120}
              height={40}
              className="h-10 w-auto mx-auto mb-6"
            />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          {timeLeft > 0 ? (
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                Code expires in{" "}
                <span className="font-semibold">{formatTime(timeLeft)}</span>
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center px-4 py-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700 font-medium">
                Code expired
              </span>
            </div>
          )}
        </div>

        {/* OTP Input */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading || timeLeft <= 0}
              className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl 
                ${error ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}
                ${digit ? "bg-blue-50" : "bg-white"}
                disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Verify Button */}
        <Button
          onClick={() => handleVerify()}
          disabled={isLoading || otp.some((d) => !d) || timeLeft <= 0}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl mb-4"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Verify Email"
          )}
        </Button>

        {/* Resend */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn&apos;t receive the code?
          </p>
          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            {isResending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend Code"}
          </Button>
        </div>

        {/* Back to login */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
