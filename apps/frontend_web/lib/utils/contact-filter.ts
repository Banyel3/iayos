// Shared contact-info detection utility
// Used by all chat hooks to enforce the no-contact-info rule on the frontend.
// Keep aligned with backend: apps/backend/src/profiles/content_filter.py

export const CONTACT_INFO_BLOCKED_MESSAGE =
  "For safety, sharing phone numbers or email addresses in chat is not allowed.";

// Strict patterns for direct (non-obfuscated) matches
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PH_PHONE_REGEX = /\b(\+63|63|0)?9\d{9}\b/;

// Phone normalisation: strip whitespace, hyphens, parentheses, dots
const PHONE_SEP_REGEX = /[\s.\-_()/]+/g;

// Email normalisation: strip only whitespace so the structurally significant
// dot and @ characters are preserved while spaces added between letters are removed.
const EMAIL_SPACE_REGEX = /\s+/g;

// Patterns applied to normalised text
const PH_PHONE_NORM_REGEX = /(?:\+?63|0)?9\d{9}/;
const EMAIL_NORM_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

export function containsContactInfo(text: string): boolean {
  if (!text) return false;

  // Fast path: direct match
  if (EMAIL_REGEX.test(text) || PH_PHONE_REGEX.test(text)) return true;

  // Normalised path: catch obfuscated patterns such as
  // "j o h n @ g m a i l . c o m" or "0912 345 6789" or "0912-345-6789"
  if (PH_PHONE_NORM_REGEX.test(text.replace(PHONE_SEP_REGEX, ""))) return true;
  if (EMAIL_NORM_REGEX.test(text.replace(EMAIL_SPACE_REGEX, ""))) return true;

  return false;
}
