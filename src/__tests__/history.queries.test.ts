import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Firebase ────────────────────────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

// ── Mock urql client ─────────────────────────────────────────────────────────
const mockToPromise = vi.fn()
const mockQuery = vi.fn((..._args: unknown[]) => ({ toPromise: mockToPromise }))

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: (...args: unknown[]) => mockQuery(...args),
    mutation: vi.fn(() => ({ toPromise: vi.fn() })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

import {
  fetchMonthlySummaries,
  fetchMonthDetail,
} from '@/graphql/queries/history'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_SUMMARY = {
  month: '2026-03-01',
  totalIncome: '5000.00',    // Money string
  totalExpenses: '3200.50',  // Money string
  percentSpent: 64.01,
}

const RAW_MONTH_DETAIL = {
  month: '2026-03-01',
  totalIncome: '5000.00',
  totalExpenses: '3200.50',
  percentSpent: 64.01,
  categoryBreakdown: [
    {
      categoryId: 'cat-1',
      categoryName: 'Food',
      categoryColor: '#FF5733',
      categoryIcon: 'utensils',
      amount: '1200.00', // Money string
      percentage: 37.5,
    },
    {
      categoryId: null,
      categoryName: 'Uncategorised',
      categoryColor: null,
      categoryIcon: null,
      amount: '500.50', // Money string
      percentage: 15.64,
    },
  ],
  transactions: [
    {
      id: 'txn-1',
      type: 'EXPENSE',
      amount: '42.50', // Money string
      date: '2026-03-15',
      accountId: 'acc-1',
      toAccountId: null,
      categoryId: 'cat-1',
      description: 'Lunch',
      notes: null,
      tags: [],
      receiptUrl: null,
      createdAt: '2026-03-15T12:00:00Z',
      updatedAt: '2026-03-15T12:00:00Z',
    },
  ],
  budgets: [
    {
      budgetId: 'bud-1',
      categoryId: 'cat-1',
      categoryName: 'Food',
      categoryIcon: 'utensils',
      limit: '500.00',      // Money string
      spent: '123.45',      // Money string
      remaining: '376.55',  // Money string
      percentUsed: 24.69,
      status: 'ON_TRACK',
    },
  ],
}

// ── fetchMonthlySummaries ────────────────────────────────────────────────────

describe('fetchMonthlySummaries', () => {
  it('parses Money fields (totalIncome, totalExpenses) from string to number', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthlySummaries: [RAW_SUMMARY] },
      error: undefined,
    })

    const summaries = await fetchMonthlySummaries()

    expect(summaries).toHaveLength(1)
    expect(summaries[0].totalIncome).toBe(5000)
    expect(summaries[0].totalExpenses).toBe(3200.5)
    expect(typeof summaries[0].totalIncome).toBe('number')
    expect(typeof summaries[0].totalExpenses).toBe('number')
  })

  it('preserves non-Money fields like percentSpent', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthlySummaries: [RAW_SUMMARY] },
      error: undefined,
    })

    const summaries = await fetchMonthlySummaries()
    expect(summaries[0].percentSpent).toBe(64.01)
  })

  it('uses MonthSort enum type (not MonthlySortInput)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthlySummaries: [] },
      error: undefined,
    })

    await fetchMonthlySummaries('CHRONOLOGICAL_DESC')

    const queryString = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryString).toContain('$sort: MonthSort')
    expect(queryString).not.toContain('MonthlySortInput')
  })

  it('returns empty array when no summaries', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthlySummaries: [] },
      error: undefined,
    })

    const summaries = await fetchMonthlySummaries()
    expect(summaries).toEqual([])
  })
})

// ── fetchMonthDetail ─────────────────────────────────────────────────────────

describe('fetchMonthDetail', () => {
  it('uses Date type for month variable (not String)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthDetail: RAW_MONTH_DETAIL },
      error: undefined,
    })

    await fetchMonthDetail('2026-03-01')

    const queryString = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryString).toContain('$month: Date!')
    expect(queryString).not.toContain('$month: String!')
  })

  it('parses top-level Money fields (totalIncome, totalExpenses)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthDetail: RAW_MONTH_DETAIL },
      error: undefined,
    })

    const detail = await fetchMonthDetail('2026-03-01')

    expect(detail.totalIncome).toBe(5000)
    expect(detail.totalExpenses).toBe(3200.5)
    expect(typeof detail.totalIncome).toBe('number')
  })

  it('parses Money in categoryBreakdown[].amount', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthDetail: RAW_MONTH_DETAIL },
      error: undefined,
    })

    const detail = await fetchMonthDetail('2026-03-01')

    expect(detail.categoryBreakdown).toHaveLength(2)
    expect(detail.categoryBreakdown[0].amount).toBe(1200)
    expect(detail.categoryBreakdown[1].amount).toBe(500.5)
    expect(typeof detail.categoryBreakdown[0].amount).toBe('number')
  })

  it('parses Money in transactions[].amount', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthDetail: RAW_MONTH_DETAIL },
      error: undefined,
    })

    const detail = await fetchMonthDetail('2026-03-01')

    expect(detail.transactions).toHaveLength(1)
    expect(detail.transactions[0].amount).toBe(42.5)
    expect(typeof detail.transactions[0].amount).toBe('number')
  })

  it('parses Money in budgets[] (limit, spent, remaining)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthDetail: RAW_MONTH_DETAIL },
      error: undefined,
    })

    const detail = await fetchMonthDetail('2026-03-01')

    expect(detail.budgets).toHaveLength(1)
    const bp = detail.budgets[0]
    expect(bp.limit).toBe(500)
    expect(bp.spent).toBe(123.45)
    expect(bp.remaining).toBe(376.55)
    expect(typeof bp.limit).toBe('number')
  })

  it('preserves non-Money fields in nested objects', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthDetail: RAW_MONTH_DETAIL },
      error: undefined,
    })

    const detail = await fetchMonthDetail('2026-03-01')

    expect(detail.categoryBreakdown[0].percentage).toBe(37.5)
    expect(detail.budgets[0].percentUsed).toBe(24.69)
    expect(detail.budgets[0].status).toBe('ON_TRACK')
  })

  it('throws on error', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    await expect(fetchMonthDetail('2026-03-01')).rejects.toThrow('Not found')
  })

  it('throws when no data returned', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { monthDetail: null },
      error: undefined,
    })

    await expect(fetchMonthDetail('2026-03-01')).rejects.toThrow(
      'No data returned from monthDetail query.',
    )
  })
})
