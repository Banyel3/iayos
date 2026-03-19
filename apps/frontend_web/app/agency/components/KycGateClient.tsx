"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/form_button";
import { AgencyVerificationProvider } from "./AgencyVerificationContext";

interface Props {
  kycVerified: boolean;
  hasSubmission?: boolean;
  submissionStatus?: string | null;
  submissionNotes?: string | null;
  submissionFiles?: any[] | null;
  children: React.ReactNode;
}

export default function KycGateClient({
  kycVerified,
  hasSubmission = false,
  submissionStatus = null,
  submissionNotes = null,
  submissionFiles = null,
  children,
}: Props) {
  const pathname = usePathname();
  const isKycRoute =
    pathname === "/agency/kyc" || pathname?.startsWith("/agency/kyc");
  const isExemptRoute =
    isKycRoute ||
    pathname === "/agency/profile" ||
    pathname?.startsWith("/agency/profile") ||
    pathname === "/agency/settings" ||
    pathname?.startsWith("/agency/settings");

  if (kycVerified || isExemptRoute) {
    return (
      <AgencyVerificationProvider kycVerified={kycVerified}>
        {children}
      </AgencyVerificationProvider>
    );
  }

  // Compact top banner — page content always renders below
  let banner: React.ReactNode;

  if (hasSubmission && submissionStatus?.toUpperCase() === "REJECTED") {
    banner = (
      <div className="w-full bg-red-50 border-b border-red-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-red-600 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-800 font-medium">
            KYC verification was rejected.{" "}
            {submissionNotes && (
              <span className="font-normal">Reason: {submissionNotes}.</span>
            )}{" "}
            Some features are disabled until you resubmit.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/agency/support">
            <Button
              variant="ghost"
              className="h-8 text-xs text-red-700 border border-red-200 hover:bg-red-100"
            >
              Contact support
            </Button>
          </Link>
          <Link href="/agency/kyc">
            <Button className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">
              Resubmit KYC
            </Button>
          </Link>
        </div>
      </div>
    );
  } else if (hasSubmission) {
    banner = (
      <div className="w-full bg-blue-50 border-b border-blue-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-blue-800 font-medium">
            Verification in progress — review takes 24–72 hours. Some actions
            are disabled until approved.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/agency/kyc">
            <Button className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
              View submission
            </Button>
          </Link>
        </div>
      </div>
    );
  } else {
    banner = (
      <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-amber-600 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <span className="text-sm text-amber-800 font-medium">
            Complete KYC verification to unlock all features. Some actions are
            disabled.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/agency/support">
            <Button
              variant="ghost"
              className="h-8 text-xs text-amber-700 border border-amber-300 hover:bg-amber-100"
            >
              Contact support
            </Button>
          </Link>
          <Link href="/agency/kyc">
            <Button className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white">
              Start verification
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AgencyVerificationProvider kycVerified={false}>
      {banner}
      {children}
    </AgencyVerificationProvider>
  );
}
