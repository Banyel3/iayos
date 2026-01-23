"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Escrow Monitor is deprecated - redirecting to Transactions
 * Escrow functionality has been replaced by direct payment processing.
 * This redirect is kept for users who may have bookmarked the old URL.
 */
export default function EscrowMonitorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/payments/transactions");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Transactions...</p>
      </div>
    </div>
  );
}
