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

import { fetchDashboard } from '@/graphql/queries/dashboard'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_DASHBOARD = {
  month: '2026-03-01',
  totalIncome: '5000.00',       // Money string
  totalExpenses: '3200.50',     // Money string
  remainingBudget: '1799.50',   // Money string
  percentSpent: 64.01,
  recentTransactions: [
    {
      id: 'txn-1',
      type: 'EXPENSE',
      amount: '42.50', // Money string
      date: '2026-03-15',
      accountId: 'acc-1',
      toAccountId: null,
      categoryId: 'cat-1',
      description: 'Lunch',
      tags: [],
    },
    {
      id: 'txn-2',
      type: 'INCOME',
      amount: '5000.00', // Money string
      date: '2026-03-01',
      accountId: 'acc-1',
      toAccountId: null,
      categoryId: null,
      description: 'Salary',
      tags: [],
    },
  ],
  upcomingBills: [
    {
      id: 'sub-1',
      name: 'Netflix',
      amount: '15.99',  // Money string
      currency: 'USD',
      categoryId: 'cat-2',
      accountId: 'acc-1',
      frequency: 'MONTHLY',
      nextDueDate: '2026-03-20',
      isActive: true,
    },
  ],
  budgetProgress: [
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

// ── fetchDashboard ───────────────────────────────────────────────────────────

describe('fetchDashboard', () => {
  it('parses top-level Money fields (totalIncome, totalExpenses, remainingBudget)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { dashboard: RAW_DASHBOARD },
      error: undefined,
    })

    const dashboard = await fetchDashboard('2026-03-01')

    expect(dashboard.totalIncome).toBe(5000)
    expect(dashboard.totalExpenses).toBe(3200.5)
    expect(dashboard.remainingBudget).toBe(1799.5)
    expect(typeof dashboard.totalIncome).toBe('number')
    expect(typeof dashboard.totalExpenses).toBe('number')
    expect(typeof dashboard.remainingBudget).toBe('number')
  })

  it('preserves non-Money fields like percentSpent', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { dashboard: RAW_DASHBOARD },
      error: undefined,
    })

    const dashboard = await fetchDashboard()
    expect(dashboard.percentSpent).toBe(64.01)
  })

  it('parses Money in recentTransactions[].amount', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { dashboard: RAW_DASHBOARD },
      error: undefined,
    })

    const dashboard = await fetchDashboard()

    expect(dashboard.recentTransactions).toHaveLength(2)
    expect(dashboard.recentTransactions[0].amount).toBe(42.5)
    expect(dashboard.recentTransactions[1].amount).toBe(5000)
    expect(typeof dashboard.recentTransactions[0].amount).toBe('number')
  })

  it('parses Money in upcomingBills[].amount', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { dashboard: RAW_DASHBOARD },
      error: undefined,
    })

    const dashboard = await fetchDashboard()

    expect(dashboard.upcomingBills).toHaveLength(1)
    expect(dashboard.upcomingBills[0].amount).toBe(15.99)
    expect(typeof dashboard.upcomingBills[0].amount).toBe('number')
  })

  it('parses Money in budgetProgress[] (limit, spent, remaining)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { dashboard: RAW_DASHBOARD },
      error: undefined,
    })

    const dashboard = await fetchDashboard()

    expect(dashboard.budgetProgress).toHaveLength(1)
    const bp = dashboard.budgetProgress[0]
    expect(bp.limit).toBe(500)
    expect(bp.spent).toBe(123.45)
    expect(bp.remaining).toBe(376.55)
    expect(typeof bp.limit).toBe('number')
    expect(typeof bp.spent).toBe('number')
    expect(typeof bp.remaining).toBe('number')
  })

  it('preserves percentUsed in budgetProgress (not Money)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { dashboard: RAW_DASHBOARD },
      error: undefined,
    })

    const dashboard = await fetchDashboard()
    expect(dashboard.budgetProgress[0].percentUsed).toBe(24.69)
  })

  it('uses Date type for month variable (not String)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { dashboard: RAW_DASHBOARD },
      error: undefined,
    })

    await fetchDashboard('2026-03-01')

    const queryString = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryString).toContain('$month: Date')
    expect(queryString).not.toContain('$month: String')
  })

  it('throws on error', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: null,
      error: { message: 'Server error' },
    })

    await expect(fetchDashboard()).rejects.toThrow('Server error')
  })

  it('throws when no dashboard data returned', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { dashboard: null },
      error: undefined,
    })

    await expect(fetchDashboard()).rejects.toThrow(
      'No data returned from dashboard query.',
    )
  })
})
