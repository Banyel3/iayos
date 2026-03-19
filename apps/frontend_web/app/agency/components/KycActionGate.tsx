"use client";

import React from "react";
import { useAgencyVerification } from "./AgencyVerificationContext";

interface Props {
  children: React.ReactNode;
  message?: string;
}

export function KycActionGate({
  children,
  message = "Complete KYC verification to use this feature",
}: Props) {
  const { kycVerified } = useAgencyVerification();

  if (kycVerified) {
    return <>{children}</>;
  }

  return (
    <div
      className="pointer-events-none opacity-50 select-none"
      title={message}
    >
      {children}
    </div>
  );
}
