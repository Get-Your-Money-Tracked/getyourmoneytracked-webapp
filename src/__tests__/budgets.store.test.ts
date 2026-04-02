import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBudgetsStore } from '@/stores/budgets'
import type { Budget } from '@/types'

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn() })),
    mutation: vi.fn(() => ({ toPromise: vi.fn() })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

const mockFetchBudgets = vi.fn()
const mockCallCreateBudget = vi.fn()
const mockCallUpdateBudget = vi.fn()
const mockCallDeleteBudget = vi.fn()

vi.mock('@/graphql/queries/budgets', () => ({
  fetchBudgets: (...args: unknown[]) => mockFetchBudgets(...args),
  callCreateBudget: (...args: unknown[]) => mockCallCreateBudget(...args),
  callUpdateBudget: (...args: unknown[]) => mockCallUpdateBudget(...args),
  callDeleteBudget: (...args: unknown[]) => mockCallDeleteBudget(...args),
}))

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    name: '',
    month: '2026-03-01',
    amount: 200,
    spent: 80,
    remaining: 120,
    percentUsed: 40,
    category: {
      id: 'cat-1',
      name: 'Food',
      icon: '🍽️',
      color: '#FF9800',
      parentId: null,
      isDefault: false,
      sortOrder: 0,
    },
    ...overrides,
  }
}

describe('useBudgetsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Initial state ───────────────────────────────────────────
  it('starts with empty budgets and isLoading = false', () => {
    const store = useBudgetsStore()
    expect(store.budgets).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  // ── loadBudgets ─────────────────────────────────────────────
  it('loadBudgets populates budgets from API', async () => {
    const data = [makeBudget({ id: 'b1' }), makeBudget({ id: 'b2' })]
    mockFetchBudgets.mockResolvedValueOnce(data)
    const store = useBudgetsStore()
    await store.loadBudgets()
    expect(store.budgets).toEqual(data)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('loadBudgets sets error on failure', async () => {
    mockFetchBudgets.mockRejectedValueOnce(new Error('Network error'))
    const store = useBudgetsStore()
    await store.loadBudgets()
    expect(store.error).toBe('Network error')
    expect(store.isLoading).toBe(false)
  })

  it('loadBudgets sets isLoading during fetch', async () => {
    let resolve!: (v: Budget[]) => void
    mockFetchBudgets.mockReturnValueOnce(new Promise<Budget[]>((r) => { resolve = r }))
    const store = useBudgetsStore()
    const p = store.loadBudgets()
    expect(store.isLoading).toBe(true)
    resolve([])
    await p
    expect(store.isLoading).toBe(false)
  })

  // ── sortedBudgets ───────────────────────────────────────────
  it('sortedBudgets puts EXCEEDED first, then WARNING, then ON_TRACK', async () => {
    mockFetchBudgets.mockResolvedValueOnce([
      makeBudget({ id: 'on-track', percentUsed: 30 }),
      makeBudget({ id: 'exceeded', percentUsed: 110 }),
      makeBudget({ id: 'warning', percentUsed: 70 }),
    ])
    const store = useBudgetsStore()
    await store.loadBudgets()
    const ids = store.sortedBudgets.map((b) => b.id)
    expect(ids[0]).toBe('exceeded')
    expect(ids[1]).toBe('warning')
    expect(ids[2]).toBe('on-track')
  })

  it('sortedBudgets sorts by percentUsed DESC within same status group', async () => {
    mockFetchBudgets.mockResolvedValueOnce([
      makeBudget({ id: 'warn-60', percentUsed: 60 }),
      makeBudget({ id: 'warn-80', percentUsed: 80 }),
    ])
    const store = useBudgetsStore()
    await store.loadBudgets()
    const ids = store.sortedBudgets.map((b) => b.id)
    expect(ids[0]).toBe('warn-80')
    expect(ids[1]).toBe('warn-60')
  })

  // ── totals ──────────────────────────────────────────────────
  it('totalBudgeted sums all budget amounts', async () => {
    mockFetchBudgets.mockResolvedValueOnce([
      makeBudget({ amount: 200, spent: 80 }),
      makeBudget({ id: 'b2', amount: 300, spent: 100 }),
    ])
    const store = useBudgetsStore()
    await store.loadBudgets()
    expect(store.totalBudgeted).toBe(500)
  })

  it('totalSpent sums all spent values', async () => {
    mockFetchBudgets.mockResolvedValueOnce([
      makeBudget({ amount: 200, spent: 80 }),
      makeBudget({ id: 'b2', amount: 300, spent: 100 }),
    ])
    const store = useBudgetsStore()
    await store.loadBudgets()
    expect(store.totalSpent).toBe(180)
  })

  it('totalPercentUsed is 0 when no budgets', () => {
    const store = useBudgetsStore()
    expect(store.totalPercentUsed).toBe(0)
  })

  // ── budgetedCategoryIds ─────────────────────────────────────
  it('budgetedCategoryIds contains category IDs of existing budgets', async () => {
    mockFetchBudgets.mockResolvedValueOnce([
      makeBudget({ category: { id: 'cat-1', name: 'Food', icon: null, color: null, parentId: null, isDefault: false, sortOrder: 0 } }),
      makeBudget({ id: 'b2', category: { id: 'cat-2', name: 'Transport', icon: null, color: null, parentId: null, isDefault: false, sortOrder: 1 } }),
    ])
    const store = useBudgetsStore()
    await store.loadBudgets()
    expect(store.budgetedCategoryIds.has('cat-1')).toBe(true)
    expect(store.budgetedCategoryIds.has('cat-2')).toBe(true)
    expect(store.budgetedCategoryIds.has('cat-99')).toBe(false)
  })

  // ── createBudget ─────────────────────────────────────────────
  it('createBudget appends new budget to list', async () => {
    const newBudget = makeBudget({ id: 'new-1' })
    mockCallCreateBudget.mockResolvedValueOnce(newBudget)
    const store = useBudgetsStore()
    await store.createBudget({ categoryId: 'cat-1', amount: 200 })
    expect(store.budgets).toContainEqual(newBudget)
  })

  it('createBudget throws on API error', async () => {
    mockCallCreateBudget.mockRejectedValueOnce(new Error('Duplicate budget'))
    const store = useBudgetsStore()
    await expect(store.createBudget({ categoryId: 'cat-1', amount: 200 })).rejects.toThrow('Duplicate budget')
  })

  // ── updateBudget ─────────────────────────────────────────────
  it('updateBudget patches the budget in the list', async () => {
    mockFetchBudgets.mockResolvedValueOnce([makeBudget({ id: 'b1', amount: 200 })])
    const updated = makeBudget({ id: 'b1', amount: 300 })
    mockCallUpdateBudget.mockResolvedValueOnce(updated)
    const store = useBudgetsStore()
    await store.loadBudgets()
    await store.updateBudget('b1', { amount: 300 })
    expect(store.budgets.find((b) => b.id === 'b1')?.amount).toBe(300)
  })

  // ── deleteBudget ─────────────────────────────────────────────
  it('deleteBudget removes the budget from the list', async () => {
    mockFetchBudgets.mockResolvedValueOnce([makeBudget({ id: 'b1' })])
    mockCallDeleteBudget.mockResolvedValueOnce(undefined)
    const store = useBudgetsStore()
    await store.loadBudgets()
    await store.deleteBudget('b1')
    expect(store.budgets.find((b) => b.id === 'b1')).toBeUndefined()
  })

  // ── clearError ────────────────────────────────────────────────
  it('clearError resets the error field', async () => {
    mockFetchBudgets.mockRejectedValueOnce(new Error('Fail'))
    const store = useBudgetsStore()
    await store.loadBudgets()
    expect(store.error).toBe('Fail')
    store.clearError()
    expect(store.error).toBeNull()
  })
})
