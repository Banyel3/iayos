"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AgencySidebar from "./sidebar";
import { cn } from "@/lib/utils";
import { useAgencyPendingReviews } from "@/lib/hooks/useAgencyConversations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Star } from "lucide-react";

interface AgencyShellProps {
  children: React.ReactNode;
  kycVerified?: boolean;
}

export default function AgencyShell({ children, kycVerified }: AgencyShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const {
    data: pendingReviews,
    refetch: refetchPendingReviews,
  } = useAgencyPendingReviews(Boolean(kycVerified));

  const showPendingReviewGate =
    Boolean(kycVerified) && (pendingReviews?.count ?? 0) > 0;

  // Auto-close drawer when the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (!kycVerified) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchPendingReviews();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [kycVerified, refetchPendingReviews]);

  const getReviewInstruction = (review: {
    review_type: string;
    reviewee_name: string;
  }) => {
    switch (review.review_type) {
      case "WORKER_TO_CLIENT":
      case "AGENCY_TO_CLIENT":
        return `Rate your client: ${review.reviewee_name}`;
      case "CLIENT_TO_AGENCY":
        return `Rate agency: ${review.reviewee_name}`;
      case "CLIENT_TO_AGENCY_EMPLOYEE":
        return `Rate employee: ${review.reviewee_name}`;
      default:
        return `Rate your worker: ${review.reviewee_name}`;
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50 agency-theme",
        kycVerified ? "agency-verified" : ""
      )}
    >
      {/* Sidebar - Desktop and Mobile Drawer */}
      <AgencySidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={sidebarOpen}
        setMobileOpen={setSidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6 pt-20 lg:pt-6">
          {children}
        </main>
      </div>

      {showPendingReviewGate && (
        <div className="fixed inset-0 z-90 bg-black/70 backdrop-blur-[1px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-gray-900">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">
                  Pending Reviews ({pendingReviews?.count ?? 0})
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                Reviews are required before continuing. Please complete all pending job reviews.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto max-h-[68vh]">
              {(pendingReviews?.pending_reviews ?? []).map((review) => {
                const key = `${review.job_id}-${review.review_type}-${review.reviewee_id ?? "x"}-${review.employee_id ?? "x"}-${review.worker_assignment_id ?? "x"}`;
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2"
                  >
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {review.job_title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getReviewInstruction(review)}
                    </p>
                    {review.conversation_id ? (
                      <Button
                        className="h-9"
                        onClick={() =>
                          router.push(`/agency/messages/${review.conversation_id}`)
                        }
                      >
                        Review Now
                      </Button>
                    ) : (
                      <p className="text-xs text-red-600">
                        Conversation unavailable for this job. Please refresh and retry.
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
