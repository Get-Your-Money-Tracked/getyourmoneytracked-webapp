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
        amount
        currency
        categoryId
        accountId
        frequency
        nextDueDate
        isActive
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

export async function fetchDashboard(month?: string): Promise<Dashboard> {
  const result = await urqlClient
    .query(DASHBOARD_QUERY, { month: month ?? null })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch dashboard.')
  }
  if (!result.data?.dashboard) {
    throw new Error('No data returned from dashboard query.')
  }
  return parseDashboardMoney(result.data.dashboard as Record<string, unknown>)
}
