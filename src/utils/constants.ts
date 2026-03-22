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
