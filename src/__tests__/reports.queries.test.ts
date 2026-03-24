import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Firebase ─────────────────────────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

// ── Mock urql client ──────────────────────────────────────────────────────────
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

import { callSpendingTrends } from '@/graphql/queries/reports'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RAW_RESULT = {
  months: [
    { month: '2026-01-01', totalIncome: '5000.00', totalExpenses: '3200.50' },
    { month: '2026-02-01', totalIncome: '4500.00', totalExpenses: '2800.00' },
  ],
  categoryBreakdown: [
    {
      categoryId: 'cat-1',
      categoryName: 'Food',
      categoryColor: '#10b981',
      categoryIcon: '🍽️',
      amount: '1200.00',
      percentage: 37.5,
    },
    {
      categoryId: null,
      categoryName: 'Uncategorised',
      categoryColor: null,
      categoryIcon: null,
      amount: '500.50',
      percentage: 15.64,
    },
  ],
}

// ── callSpendingTrends ────────────────────────────────────────────────────────

describe('callSpendingTrends', () => {
  it('parses Money fields (totalIncome, totalExpenses) in months from string to number', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { spendingTrends: RAW_RESULT },
      error: undefined,
    })

    const result = await callSpendingTrends('2026-01', '2026-02')

    expect(result.months).toHaveLength(2)
    expect(result.months[0].totalIncome).toBe(5000)
    expect(result.months[0].totalExpenses).toBe(3200.5)
    expect(typeof result.months[0].totalIncome).toBe('number')
    expect(typeof result.months[0].totalExpenses).toBe('number')
  })

  it('preserves month string in months', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { spendingTrends: RAW_RESULT },
      error: undefined,
    })

    const result = await callSpendingTrends('2026-01', '2026-02')
    expect(result.months[0].month).toBe('2026-01-01')
  })

  it('parses Money amount in categoryBreakdown from string to number', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { spendingTrends: RAW_RESULT },
      error: undefined,
    })

    const result = await callSpendingTrends('2026-01', '2026-02')

    expect(result.categoryBreakdown).toHaveLength(2)
    expect(result.categoryBreakdown[0].amount).toBe(1200)
    expect(result.categoryBreakdown[1].amount).toBe(500.5)
    expect(typeof result.categoryBreakdown[0].amount).toBe('number')
  })

  it('preserves non-Money fields in categoryBreakdown', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { spendingTrends: RAW_RESULT },
      error: undefined,
    })

    const result = await callSpendingTrends('2026-01', '2026-02')

    expect(result.categoryBreakdown[0].categoryId).toBe('cat-1')
    expect(result.categoryBreakdown[0].categoryName).toBe('Food')
    expect(result.categoryBreakdown[0].percentage).toBe(37.5)
    expect(result.categoryBreakdown[1].categoryId).toBeNull()
  })

  it('normalizes YYYY-MM startMonth to YYYY-MM-01 in query variables', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { spendingTrends: RAW_RESULT },
      error: undefined,
    })

    await callSpendingTrends('2026-01', '2026-03')

    const variables = (mockQuery.mock.calls[0] as unknown[])[1] as Record<string, string>
    expect(variables.startMonth).toBe('2026-01-01')
    expect(variables.endMonth).toBe('2026-03-01')
  })

  it('leaves YYYY-MM-DD startMonth as-is', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { spendingTrends: RAW_RESULT },
      error: undefined,
    })

    await callSpendingTrends('2026-01-01', '2026-03-01')

    const variables = (mockQuery.mock.calls[0] as unknown[])[1] as Record<string, string>
    expect(variables.startMonth).toBe('2026-01-01')
    expect(variables.endMonth).toBe('2026-03-01')
  })

  it('throws on GraphQL error', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: null,
      error: { message: 'Unauthorized' },
    })

    await expect(callSpendingTrends('2026-01', '2026-03')).rejects.toThrow('Unauthorized')
  })

  it('throws when no data returned', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { spendingTrends: null },
      error: undefined,
    })

    await expect(callSpendingTrends('2026-01', '2026-03')).rejects.toThrow(
      'No data returned from spendingTrends query.',
    )
  })

  it('returns empty months and categoryBreakdown arrays gracefully', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { spendingTrends: { months: [], categoryBreakdown: [] } },
      error: undefined,
    })

    const result = await callSpendingTrends('2026-01', '2026-03')
    expect(result.months).toEqual([])
    expect(result.categoryBreakdown).toEqual([])
  })
})
