// Utility functions for agency-related logic

import { User } from "@/types";

/**
 * Check if user is an agency account
 */
export function isAgencyAccount(user: User | null): boolean {
  if (!user) return false;

  const accountType = (user.accountType || "").toString().toLowerCase();
  const role = (user.role || "").toString().toUpperCase();

  return accountType === "agency" || role === "AGENCY";
}

/**
 * Check if user is an individual worker
 */
export function isIndividualWorker(user: User | null): boolean {
  if (!user) return false;

  const profileType = user.profile_data?.profileType;
  return profileType === "WORKER" && !isAgencyAccount(user);
}

/**
 * Get user display role for UI
 */
export function getUserDisplayRole(user: User | null): string {
  if (!user) return "Unknown";

  if (isAgencyAccount(user)) return "Agency";

  const profileType = user.profile_data?.profileType;
  if (profileType === "WORKER") return "Worker";
  if (profileType === "CLIENT") return "Client";

  return "User";
}

/**
 * Check if user can apply to jobs (individual workers only, not agencies)
 */
export function canApplyToJobs(user: User | null): boolean {
  return isIndividualWorker(user);
}

/**
 * Check if user can accept jobs directly (agencies only)
 */
export function canAcceptJobsDirectly(user: User | null): boolean {
  return isAgencyAccount(user);
}
