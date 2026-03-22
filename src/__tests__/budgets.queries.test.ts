import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Firebase ────────────────────────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

// ── Mock urql client ─────────────────────────────────────────────────────────
const mockToPromise = vi.fn()
const mockQuery = vi.fn((..._args: unknown[]) => ({ toPromise: mockToPromise }))
const mockMutation = vi.fn((..._args: unknown[]) => ({ toPromise: mockToPromise }))

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: (...args: unknown[]) => mockQuery(...args),
    mutation: (...args: unknown[]) => mockMutation(...args),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

import {
  fetchBudgets,
  callCreateBudget,
  callUpdateBudget,
  callDeleteBudget,
} from '@/graphql/queries/budgets'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_BUDGET = {
  id: 'bud-1',
  month: '2026-03-01',
  amount: '500.00',     // Money string
  spent: '123.45',      // Money string
  remaining: '376.55',  // Money string
  percentUsed: 24.69,
  category: {
    id: 'cat-1',
    name: 'Food',
    icon: 'utensils',
    color: '#FF5733',
    parentId: null,
    isDefault: false,
    sortOrder: 1,
  },
}

// ── fetchBudgets ─────────────────────────────────────────────────────────────

describe('fetchBudgets', () => {
  it('parses Money fields (amount, spent, remaining) from string to number', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { budgets: [RAW_BUDGET] },
      error: undefined,
    })

    const budgets = await fetchBudgets('2026-03-01')

    expect(budgets).toHaveLength(1)
    expect(budgets[0].amount).toBe(500)
    expect(budgets[0].spent).toBe(123.45)
    expect(budgets[0].remaining).toBe(376.55)
    expect(typeof budgets[0].amount).toBe('number')
    expect(typeof budgets[0].spent).toBe('number')
    expect(typeof budgets[0].remaining).toBe('number')
  })

  it('uses Date type for month variable (not String)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { budgets: [] },
      error: undefined,
    })

    await fetchBudgets('2026-03-01')

    const queryString = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryString).toContain('$month: Date')
    expect(queryString).not.toContain('$month: String')
  })

  it('preserves non-Money fields like percentUsed', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { budgets: [RAW_BUDGET] },
      error: undefined,
    })

    const budgets = await fetchBudgets()
    expect(budgets[0].percentUsed).toBe(24.69)
  })
})

// ── callCreateBudget ─────────────────────────────────────────────────────────

describe('callCreateBudget', () => {
  it('converts numeric amount to Money string in input', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { createBudget: RAW_BUDGET },
      error: undefined,
    })

    await callCreateBudget({
      categoryId: 'cat-1',
      amount: 500,
      month: '2026-03-01',
    })

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    const input = variables.input as Record<string, unknown>
    expect(input.amount).toBe('500')
    expect(typeof input.amount).toBe('string')
  })

  it('parses Money fields in response', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { createBudget: RAW_BUDGET },
      error: undefined,
    })

    const budget = await callCreateBudget({
      categoryId: 'cat-1',
      amount: 500,
    })

    expect(budget.amount).toBe(500)
    expect(budget.spent).toBe(123.45)
    expect(budget.remaining).toBe(376.55)
  })
})

// ── callUpdateBudget ─────────────────────────────────────────────────────────

describe('callUpdateBudget', () => {
  it('converts numeric amount to Money string in input', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateBudget: RAW_BUDGET },
      error: undefined,
    })

    await callUpdateBudget('bud-1', { amount: 750 })

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    const input = variables.input as Record<string, unknown>
    expect(input.amount).toBe('750')
    expect(typeof input.amount).toBe('string')
  })

  it('uses separate id and input args (budget schema pattern)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateBudget: RAW_BUDGET },
      error: undefined,
    })

    await callUpdateBudget('bud-1', { amount: 750 })

    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    expect(mutationString).toContain('$id: ID!')
    expect(mutationString).toContain('$input: UpdateBudgetInput!')

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    expect(variables.id).toBe('bud-1')
  })
})

// ── callDeleteBudget ─────────────────────────────────────────────────────────

describe('callDeleteBudget', () => {
  it('returns void on success (deleteBudget returns Boolean!)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { deleteBudget: true },
      error: undefined,
    })

    await expect(callDeleteBudget('bud-1')).resolves.toBeUndefined()
  })
})
