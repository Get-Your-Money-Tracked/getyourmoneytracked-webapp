import { urqlClient } from '@/lib/urql'
import type { MonthlySummary, MonthDetail } from '@/types'
import { DEFAULT_HISTORY_LIMIT } from '@/utils/constants'

// ── Sort enum ─────────────────────────────────────────────────────────────────

export type MonthlySortOption =
  | 'CHRONOLOGICAL_DESC'
  | 'CHRONOLOGICAL_ASC'
  | 'HIGHEST_EXPENSES'
  | 'LOWEST_EXPENSES'
  | 'HIGHEST_PERCENT_SPENT'
  | 'LOWEST_PERCENT_SPENT'

// ── Queries ───────────────────────────────────────────────────────────────────

const MONTHLY_SUMMARIES_QUERY = `
  query MonthlySummaries($sort: MonthSort, $limit: Int, $offset: Int) {
    monthlySummaries(sort: $sort, limit: $limit, offset: $offset) {
      month
      totalIncome
      totalExpenses
      percentSpent
    }
  }
`

const MONTH_DETAIL_QUERY = `
  query MonthDetail($month: String!) {
    monthDetail(month: $month) {
      month
      totalIncome
      totalExpenses
      percentSpent
      categoryBreakdown {
        categoryId
        categoryName
        categoryColor
        categoryIcon
        amount
        percentage
      }
      transactions {
        id
        type
        amount
        date
        accountId
        toAccountId
        categoryId
        description
        notes
        tags
        receiptUrl
        createdAt
        updatedAt
      }
      budgets {
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

// ── Typed call functions ───────────────────────────────────────────────────────

export async function fetchMonthlySummaries(
  sort: MonthlySortOption = 'CHRONOLOGICAL_DESC',
  limit = DEFAULT_HISTORY_LIMIT,
  offset = 0,
): Promise<MonthlySummary[]> {
  const result = await urqlClient
    .query(MONTHLY_SUMMARIES_QUERY, { sort, limit, offset })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch monthly summaries.')
  }
  return (result.data?.monthlySummaries as MonthlySummary[]) ?? []
}

export async function fetchMonthDetail(month: string): Promise<MonthDetail> {
  const result = await urqlClient
    .query(MONTH_DETAIL_QUERY, { month })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch month detail.')
  }
  if (!result.data?.monthDetail) {
    throw new Error('No data returned from monthDetail query.')
  }
  return result.data.monthDetail as MonthDetail
}
