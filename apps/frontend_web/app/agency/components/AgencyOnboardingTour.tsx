"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/form_button";

const TOUR_KEY = (id: number | string) => `iayos_agency_tour_v1_${id}`;

interface TourStep {
  icon: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

const STEPS: TourStep[] = [
  {
    icon: "🎉",
    title: "Welcome to the iAyos Agency Portal!",
    description:
      "This quick guide will walk you through everything you need to get your agency up and running. You'll learn how to verify your agency, manage employees, accept job invites, and much more.",
  },
  {
    icon: "🪪",
    title: "Step 1 — Complete Your KYC Verification",
    description:
      "Before your agency can operate on the platform, you need to complete KYC (Know Your Customer) verification. Upload your business permit, representative ID, address proof, and authorization letter. An admin will review and approve your documents.",
    cta: { label: "Go to KYC", href: "/agency/kyc" },
  },
  {
    icon: "🏢",
    title: "Step 2 — Set Up Your Agency Profile",
    description:
      "Fill in your agency's name, description, contact information, and logo. A complete profile helps clients find and trust your agency. Navigate to your Profile to get started.",
    cta: { label: "Go to Profile", href: "/agency/profile" },
  },
  {
    icon: "👥",
    title: "Step 3 — Add Your Employees",
    description:
      "Register the workers who belong to your agency. Go to the Employees section to add employee details including their name, skills, daily rate, and contact information. These employees will be assigned to jobs on your behalf.",
    cta: { label: "Go to Employees", href: "/agency/employees" },
  },
  {
    icon: "💼",
    title: "Step 4 — Accept Client Job Invites",
    description:
      "Clients will send job invitations directly to your agency. Visit the Jobs section to review incoming invitations. You can view the job details, budget, and client information before deciding to accept or decline.",
    cta: { label: "Go to Jobs", href: "/agency/jobs" },
  },
  {
    icon: "🔧",
    title: "Step 5 — Assign Employees to Jobs",
    description:
      "Once you accept a job invite, assign a suitable employee to carry out the work. From the Jobs page, open the accepted job and choose which employee to dispatch. The client will be notified of the assignment.",
    cta: { label: "Go to Jobs", href: "/agency/jobs" },
  },
  {
    icon: "💳",
    title: "Step 6 — Track Earnings & Withdraw",
    description:
      "Monitor your agency's earnings from completed jobs in the Wallet section. When your balance meets the minimum withdrawal threshold (₱100), you can submit a withdrawal request to receive funds via GCash. Admin will process it within 1–3 business days.",
    cta: { label: "Go to Wallet", href: "/agency/wallet" },
  },
  {
    icon: "⭐",
    title: "Step 7 — Reviews & Ratings",
    description:
      "After each job is completed, both you and your client will be asked to leave a review. Maintaining high ratings builds trust and increases the chances of receiving more job invitations. Check your Reviews page to see your agency's reputation.",
    cta: { label: "Go to Reviews", href: "/agency/reviews" },
  },
  {
    icon: "✅",
    title: "You're All Set!",
    description:
      "That's everything you need to know to get started with iAyos! You can revisit any section from the sidebar at any time. If you need help, visit the Support page. Good luck — we're excited to have your agency on board!",
  },
];

export default function AgencyOnboardingTour() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user?.accountID) return;
    const seen = localStorage.getItem(TOUR_KEY(user.accountID));
    if (!seen) {
      setOpen(true);
    }
  }, [user?.accountID]);

  const dismiss = () => {
    if (user?.accountID) {
      localStorage.setItem(TOUR_KEY(user.accountID), "1");
    }
    setOpen(false);
  };

  const currentStep = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const handleCta = (href: string) => {
    router.push(href);
    handleNext();
  };

  const handleNext = () => {
    if (isLast) {
      dismiss();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) dismiss();
      }}
    >
      <DialogContent className="max-w-md w-full p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-4">
          {/* Step counter */}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {step + 1} / {STEPS.length}
          </p>

          {/* Icon */}
          <div className="text-5xl leading-none">{currentStep.icon}</div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 leading-snug">
            {currentStep.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {currentStep.description}
          </p>

          {/* CTA button (navigate + advance) */}
          {currentStep.cta && (
            <Button
              variant="outline"
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => handleCta(currentStep.cta!.href)}
            >
              {currentStep.cta.label} →
            </Button>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <button
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            onClick={dismiss}
          >
            Skip tour
          </button>

          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="outline" className="h-9 px-4" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button
              className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleNext}
            >
              {isLast ? "Done 🎉" : "Next →"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
