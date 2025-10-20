"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/form_button";

interface Props {
  kycVerified: boolean;
  hasSubmission?: boolean;
  submissionStatus?: string | null;
  children: React.ReactNode;
}

export default function KycGateClient({
  kycVerified,
  hasSubmission = false,
  submissionStatus = null,
  children,
}: Props) {
  const pathname = usePathname();
  const isKycRoute =
    pathname === "/agency/kyc" || pathname?.startsWith("/agency/kyc");

  if (kycVerified || isKycRoute) {
    return <>{children}</>;
  }

  // If there's an existing submission and the user isn't verified show a wait message
  if (hasSubmission) {
    return (
      <section className="max-w-4xl mx-auto mt-12 p-8 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-2xl shadow-lg">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-blue-600/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4"
              />
              <path
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-slate-900">
              Verification in progress
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              Thanks — we received your documents and our compliance team is
              reviewing them.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                {submissionStatus ? submissionStatus.toLowerCase() : "pending"}
              </span>
              <span className="text-sm text-slate-500">
                Typical review time:{" "}
                <strong className="text-slate-700">24–72 hours</strong>
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              While you wait you can continue to use non-restricted parts of the
              dashboard. We'll notify you via email when verification completes.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link href="/support">
                <Button
                  variant="ghost"
                  className="text-blue-600 border border-blue-100"
                >
                  Contact support
                </Button>
              </Link>
              <Link href="/agency/kyc">
                <Button className="bg-blue-600 text-white">
                  View submission
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto mt-12 p-8 bg-white border border-blue-100 rounded-2xl shadow-lg">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-blue-50 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2v4"
            />
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 12h10"
            />
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 16h6"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-slate-900">
            Verify your agency to unlock features
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Complete a quick verification so you can post jobs, manage workers
            and receive payments.
          </p>

          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                1
              </div>
              <div className="text-sm text-slate-700">
                Business registration
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                2
              </div>
              <div className="text-sm text-slate-700">
                Representative ID (front & back)
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                3
              </div>
              <div className="text-sm text-slate-700">Proof of address</div>
            </li>
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <Link href="/agency/kyc">
              <Button className="bg-blue-600 text-white">
                Start verification
              </Button>
            </Link>
            <Link href="/support" className="text-sm text-slate-600">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
