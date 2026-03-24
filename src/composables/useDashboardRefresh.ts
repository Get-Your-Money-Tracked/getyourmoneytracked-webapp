import { ref } from 'vue'

/**
 * Lightweight cross-page signal to invalidate the dashboard cache.
 *
 * Other pages call `invalidateDashboard()` after CRUD mutations that affect
 * dashboard data (budgets, subscriptions, accounts, categories, transactions).
 * DashboardPage watches `dashboardVersion` and refetches when it changes.
 *
 * Uses a module-level ref so the same reactive state is shared across all
 * consumers without needing a Pinia store.
 */
const dashboardVersion = ref(0)

export function invalidateDashboard(): void {
  dashboardVersion.value++
}

export function useDashboardRefresh() {
  return {
    /** Reactive counter — watch this to trigger a refetch. */
    dashboardVersion,
    /** Call after any mutation that affects dashboard data. */
    invalidateDashboard,
  }
}
