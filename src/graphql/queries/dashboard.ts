import { urqlClient } from '@/lib/urql'
import type { Dashboard } from '@/types'
import { parseMoney } from '@/utils/currency'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse all Money scalars in a Dashboard response */
function parseDashboardMoney(raw: Record<string, unknown>): Dashboard {
  const recentTransactions = (raw.recentTransactions as Record<string, unknown>[]) ?? []
  const upcomingBills = (raw.upcomingBills as Record<string, unknown>[]) ?? []
  const budgetProgress = (raw.budgetProgress as Record<string, unknown>[]) ?? []

  return {
    ...raw,
    totalIncome: parseMoney(raw.totalIncome),
    totalExpenses: parseMoney(raw.totalExpenses),
    recurringIncome: parseMoney(raw.recurringIncome),
    recurringExpenses: parseMoney(raw.recurringExpenses),
    remainingBudget: parseMoney(raw.remainingBudget),
    recentTransactions: recentTransactions.map((t) => ({
      ...t,
      amount: parseMoney(t.amount),
    })),
    upcomingBills: upcomingBills.map((b) => ({
      ...b,
      amount: parseMoney(b.amount),
    })),
    budgetProgress: budgetProgress.map((bp) => ({
      ...bp,
      limit: parseMoney(bp.limit),
      spent: parseMoney(bp.spent),
      remaining: parseMoney(bp.remaining),
    })),
  } as Dashboard
}

// ── Query ─────────────────────────────────────────────────────────────────────

const DASHBOARD_QUERY = `
  query Dashboard($month: Date) {
    dashboard(month: $month) {
      month
      totalIncome
      totalExpenses
      recurringIncome
      recurringExpenses
      remainingBudget
      percentSpent
      recentTransactions {
        id
        type
        amount
        date
        accountId
        toAccountId
        categoryId
        description
        tags
      }
      upcomingBills {
        id
        name
        type
        amount
        currency
        categoryId
        accountId
        frequency
        nextDueDate
        isActive
        autoLog
      }
      budgetProgress {
        budgetId
        categoryId
        categoryName
        categoryIcon
        limit
        spent
        remaining
        percentUsed
        status
      }
    }
  }
`

// ── Typed call function ───────────────────────────────────────────────────────

/** Normalise "YYYY-MM" → "YYYY-MM-01" for the backend Date scalar. */
function normalizeMonth(month: string | undefined | null): string | null {
  if (!month) return null
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(month)) return month
  // YYYY-MM → append -01
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`
  return month
}

export async function fetchDashboard(month?: string, bypassCache = false): Promise<Dashboard> {
  const result = await urqlClient
    .query(DASHBOARD_QUERY, { month: normalizeMonth(month) }, {
      requestPolicy: bypassCache ? 'network-only' : 'cache-first',
    })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch dashboard.')
  }
  if (!result.data?.dashboard) {
    throw new Error('No data returned from dashboard query.')
  }
  return parseDashboardMoney(result.data.dashboard as Record<string, unknown>)
}
