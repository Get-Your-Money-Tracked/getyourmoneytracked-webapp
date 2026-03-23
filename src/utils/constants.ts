/**
 * Shared application constants.
 * Centralizes magic numbers and thresholds used across multiple files.
 */

// ── Budget thresholds ─────────────────────────────────────────────────────────
// Aligned with backend: dashboard.ComputeBudgetStatus (0–50% ON_TRACK, 51–85% WARNING, 86%+ EXCEEDED)

/** Budget percent at or below this is ON_TRACK (green) */
export const BUDGET_THRESHOLD_WARNING = 50

/** Budget percent above WARNING and at or below this is WARNING (amber) */
export const BUDGET_THRESHOLD_EXCEEDED = 85

// ── Pagination ────────────────────────────────────────────────────────────────

/** Default page size for transaction lists */
export const DEFAULT_PAGE_SIZE = 12

/** Default page size for monthly history summaries */
export const DEFAULT_HISTORY_LIMIT = 12

// ── Toast ─────────────────────────────────────────────────────────────────────

/** Default auto-dismiss duration for toast notifications (ms) */
export const TOAST_DURATION_MS = 3000

// ── Display ───────────────────────────────────────────────────────────────────

/** Max characters before truncating category name in chips */
export const CATEGORY_CHIP_MAX_LENGTH = 8

// ── Onboarding / Tips ─────────────────────────────────────────────────────────

/** localStorage key set to "true" once the user completes or skips onboarding */
export const ONBOARDING_COMPLETED_KEY = 'onboarding_completed'

/** localStorage key storing ISO date string of signup time (for 7-day tip cutoff) */
export const SIGNUP_TIMESTAMP_KEY = 'signup_timestamp'

/** Number of days after signup during which page tips are shown */
export const TIP_VISIBLE_DAYS = 7

/** Page-specific tip messages shown to new users (< 7 days since signup) */
export const PAGE_TIPS: Record<string, string> = {
  dashboard:
    "This is your financial overview for the current month. The 'Safe to Spend' shows income minus expenses.",
  budgets:
    "Budgets let you set monthly spending limits per category. We'll track how close you are to each limit.",
  accounts:
    'Accounts represent where your money lives — cash, bank accounts, or credit cards. Balances update as you log transactions.',
  subscriptions:
    "Track recurring payments here. We'll show upcoming bills on your dashboard.",
  history: 'View your spending month by month. Tap a month to see the breakdown.',
}
