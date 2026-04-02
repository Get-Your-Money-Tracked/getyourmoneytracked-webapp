import { urqlClient } from '@/lib/urql'
import type { MonthlySummary, MonthDetail } from '@/types'
import { parseMoney } from '@/utils/currency'
import { DEFAULT_HISTORY_LIMIT } from '@/utils/constants'

// ── Sort enum ─────────────────────────────────────────────────────────────────

export type MonthlySortOption =
  | 'CHRONOLOGICAL_DESC'
  | 'CHRONOLOGICAL_ASC'
  | 'HIGHEST_EXPENSES'
  | 'LOWEST_EXPENSES'
  | 'HIGHEST_PERCENT_SPENT'
  | 'LOWEST_PERCENT_SPENT'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse Money scalars in a MonthlySummary */
function parseSummaryMoney(raw: Record<string, unknown>): MonthlySummary {
  return {
    ...raw,
    totalIncome: parseMoney(raw.totalIncome),
    totalExpenses: parseMoney(raw.totalExpenses),
  } as MonthlySummary
}

/** Parse Money scalars in a MonthDetail */
function parseMonthDetailMoney(raw: Record<string, unknown>): MonthDetail {
  const categoryBreakdown = (raw.categoryBreakdown as Record<string, unknown>[]) ?? []
  const transactions = (raw.transactions as Record<string, unknown>[]) ?? []
  const budgets = (raw.budgets as Record<string, unknown>[]) ?? []
  const subscriptions = (raw.subscriptions as Record<string, unknown>[]) ?? []

  return {
    ...raw,
    totalIncome: parseMoney(raw.totalIncome),
    totalExpenses: parseMoney(raw.totalExpenses),
    categoryBreakdown: categoryBreakdown.map((cs) => ({
      ...cs,
      amount: parseMoney(cs.amount),
    })),
    transactions: transactions.map((t) => ({
      ...t,
      amount: parseMoney(t.amount),
    })),
    budgets: budgets.map((bp) => ({
      ...bp,
      limit: parseMoney(bp.limit),
      spent: parseMoney(bp.spent),
      remaining: parseMoney(bp.remaining),
    })),
    subscriptions: subscriptions.map((s) => ({
      ...s,
      amount: parseMoney(s.amount),
    })),
  } as MonthDetail
}

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
  query MonthDetail($month: Date!) {
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
      subscriptions {
        id
        name
        type
        amount
        frequency
        dayOfMonth
        nextDueDate
        isActive
        autoLog
        category {
          id
          name
          icon
          color
        }
        account {
          id
          name
          type
          currency
        }
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
  const raw = (result.data?.monthlySummaries as Record<string, unknown>[]) ?? []
  return raw.map(parseSummaryMoney)
}

/** Normalise "YYYY-MM" → "YYYY-MM-01" for the backend Date scalar. */
function normalizeMonth(month: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(month)) return month
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`
  return month
}

export async function fetchMonthDetail(month: string): Promise<MonthDetail> {
  const result = await urqlClient
    .query(MONTH_DETAIL_QUERY, { month: normalizeMonth(month) })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch month detail.')
  }
  if (!result.data?.monthDetail) {
    throw new Error('No data returned from monthDetail query.')
  }
  return parseMonthDetailMoney(result.data.monthDetail as Record<string, unknown>)
}
