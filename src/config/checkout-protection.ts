/**
 * Emergency Checkout Protection Circuit Breaker
 *
 * Used to protect against live financial loss during pricing incidents.
 * When enabled, disables new order creation globally while preserving
 * catalog browsing, search, and admin operations.
 */

// Controls global checkout pause.
// Initial state during P0 incident investigation: true (protected).
// Restored to false after central pricing architecture fix and full test/build verification.
// Can be activated on demand via CHECKOUT_PAUSED=true environment variable.
export const IS_CHECKOUT_PAUSED = process.env.CHECKOUT_PAUSED === 'true';

export const CHECKOUT_PAUSED_MESSAGE = 
  "Checkout is temporarily paused for emergency pricing pipeline verification. Please check back shortly.";
