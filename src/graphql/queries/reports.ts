import { urqlClient } from '@/lib/urql'
import { parseMoney } from '@/utils/currency'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MonthlyTrend {
  month: string
  totalIncome: number
  totalExpenses: number
}

export interface TrendCategorySpending {
  categoryId: string | null
  categoryName: string
  categoryColor: string | null
  categoryIcon: string | null
  amount: number
  percentage: number
}

export interface SpendingTrendsResult {
  months: MonthlyTrend[]
  categoryBreakdown: TrendCategorySpending[]
}

// ── Query ─────────────────────────────────────────────────────────────────────

const SPENDING_TRENDS_QUERY = `
  query SpendingTrends($startMonth: Date!, $endMonth: Date!) {
    spendingTrends(startMonth: $startMonth, endMonth: $endMonth) {
      months {
        month
        totalIncome
        totalExpenses
      }
      categoryBreakdown {
        categoryId
        categoryName
        categoryColor
        categoryIcon
        amount
        percentage
      }
    }
  }
`

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise "YYYY-MM" → "YYYY-MM-01" for the backend Date scalar. */
function normalizeMonth(month: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(month)) return month
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`
  return month
}

// ── Typed call function ───────────────────────────────────────────────────────

/**
 * Fetches spending trends (monthly totals + category breakdown) for the given
 * date range. Money scalars are parsed from strings to numbers.
 */
export async function callSpendingTrends(
  startMonth: string,
  endMonth: string,
): Promise<SpendingTrendsResult> {
  const result = await urqlClient
    .query(SPENDING_TRENDS_QUERY, {
      startMonth: normalizeMonth(startMonth),
      endMonth: normalizeMonth(endMonth),
    })
    .toPromise()

  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch spending trends.')
  }
  if (!result.data?.spendingTrends) {
    throw new Error('No data returned from spendingTrends query.')
  }

  const raw = result.data.spendingTrends as {
    months: Record<string, unknown>[]
    categoryBreakdown: Record<string, unknown>[]
  }

  return {
    months: raw.months.map((m) => ({
      ...m,
      totalIncome: parseMoney(m.totalIncome),
      totalExpenses: parseMoney(m.totalExpenses),
    })) as MonthlyTrend[],
    categoryBreakdown: raw.categoryBreakdown.map((cs) => ({
      ...cs,
      amount: parseMoney(cs.amount),
    })) as TrendCategorySpending[],
  }
}
