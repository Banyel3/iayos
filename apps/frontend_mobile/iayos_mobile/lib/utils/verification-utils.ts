/**
 * Returns a human-readable verification level label for profile screens.
 * Returns null for level 0 (Unverified) or when no verification info is available.
 */
export const getVerificationLevelTag = (
  verificationLevel?: number,
  verified?: boolean,
): string | null => {
  if (
    typeof verificationLevel === "number" &&
    !Number.isNaN(verificationLevel) &&
    verificationLevel >= 1
  ) {
    return `Verification Level ${verificationLevel}`;
  }
  if (verified) {
    return "Verification Level 1";
  }
  return null;
};
