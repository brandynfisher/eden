/**
 * Constants for realtime session billing
 *
 * These values control how realtime voice sessions are billed:
 * - Users need MINIMUM_BALANCE to start a session
 * - They are charged COST_PER_MINUTE when the session starts
 * - They are charged COST_PER_MINUTE every BILLING_INTERVAL_SECONDS while active
 * - Sessions auto-close after INACTIVITY_TIMEOUT_SECONDS of no activity
 */
export const REALTIME_BILLING = {
  /** Manna cost per minute of realtime session */
  COST_PER_MINUTE: 17.5,

  /** Minimum manna balance required to start a realtime session */
  MINIMUM_BALANCE: 175,

  /** Seconds between billing ticks (charges) */
  BILLING_INTERVAL_SECONDS: 60,

  /** Seconds of inactivity before auto-closing the session */
  INACTIVITY_TIMEOUT_SECONDS: 120,
} as const

export type RealtimeBillingConfig = typeof REALTIME_BILLING
