import { urqlClient } from '@/lib/urql'
import type { Dashboard } from '@/types'

// ── Query ─────────────────────────────────────────────────────────────────────

const DASHBOARD_QUERY = `
  query Dashboard($month: String) {
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
  return result.data.dashboard as Dashboard
}
