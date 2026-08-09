/**
 * Consent Policy Version — SINGLE SOURCE OF TRUTH
 *
 * Update this constant when legal documents are revised and formally approved.
 * Bump the version here so all new consent records carry the correct version.
 * Do NOT silently generate versions from the current date at runtime.
 *
 * Current version: 2026-08-09-v1
 * Documents covered: Terms & Conditions (/terms), Privacy Policy (/privacy),
 *                    Seller Agreement (/seller-agreement — placeholder, pending legal text)
 *
 * When to update:
 *   - When /terms, /privacy, or /seller-agreement content is materially revised.
 *   - Bump the version string and redeploy. Existing consent records keep their
 *     old version; new submissions will carry the new version.
 */
export const CONSENT_VERSION = "2026-08-09-v1" as const;

export type ConsentPayload = {
  version: typeof CONSENT_VERSION;
  /** ISO 8601 timestamp — set server-side, not trusted from client */
  timestamp: string;
  /** Must be true. Server validates this before writing to Firestore. */
  mandatoryAccepted: true;
  /** Optional marketing consent — submission succeeds regardless of value */
  marketingAccepted: boolean;
};
