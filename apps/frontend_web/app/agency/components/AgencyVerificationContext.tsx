"use client";

import React, { createContext, useContext } from "react";

interface AgencyVerificationContextType {
  kycVerified: boolean;
}

export const AgencyVerificationContext =
  createContext<AgencyVerificationContextType>({ kycVerified: false });

export function AgencyVerificationProvider({
  kycVerified,
  children,
}: {
  kycVerified: boolean;
  children: React.ReactNode;
}) {
  return (
    <AgencyVerificationContext.Provider value={{ kycVerified }}>
      {children}
    </AgencyVerificationContext.Provider>
  );
}

export function useAgencyVerification() {
  return useContext(AgencyVerificationContext);
}
