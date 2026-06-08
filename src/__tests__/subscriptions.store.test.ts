import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import type { SubscriptionEntry } from '@/types'

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

const mockFetchSubscriptions = vi.fn()
const mockCallCreateSubscription = vi.fn()
const mockCallUpdateSubscription = vi.fn()
const mockCallDeleteSubscription = vi.fn()

vi.mock('@/graphql/queries/subscriptions', () => ({
  fetchSubscriptions: (...args: unknown[]) => mockFetchSubscriptions(...args),
  callCreateSubscription: (...args: unknown[]) => mockCallCreateSubscription(...args),
  callUpdateSubscription: (...args: unknown[]) => mockCallUpdateSubscription(...args),
  callDeleteSubscription: (...args: unknown[]) => mockCallDeleteSubscription(...args),
}))

function makeSub(overrides: Partial<SubscriptionEntry> = {}): SubscriptionEntry {
  return {
    id: 'sub-1',
    name: 'Netflix',
    type: 'EXPENSE',
    amount: 15.99,
    nextDueDate: '2026-07-01',
    isActive: true,
    category: {
      id: 'cat-1',
      name: 'Entertainment',
      icon: '📺',
      color: '#FF5722',
      parentId: null,
      isDefault: false,
      sortOrder: 0,
    },
    account: {
      id: 'acc-1',
      name: 'Cash Wallet',
      type: 'CASH',
      currency: 'USD',
      balance: 500,
      icon: null,
      isDefault: true,
      includeInTotal: true,
    },
    ...overrides,
  }
}

describe('useSubscriptionsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Initial state ───────────────────────────────────────────
  it('starts with empty subscriptions and isLoading = false', () => {
    const store = useSubscriptionsStore()
    expect(store.subscriptions).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  // ── loadSubscriptions ────────────────────────────────────────
  it('loadSubscriptions populates subscriptions from API', async () => {
    const data = [makeSub({ id: 's1' }), makeSub({ id: 's2' })]
    mockFetchSubscriptions.mockResolvedValueOnce(data)
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    expect(store.subscriptions).toEqual(data)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('loadSubscriptions sets error on failure', async () => {
    mockFetchSubscriptions.mockRejectedValueOnce(new Error('Network error'))
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    expect(store.error).toBe('Network error')
    expect(store.isLoading).toBe(false)
  })

  it('loadSubscriptions sets isLoading during fetch', async () => {
    let resolve!: (v: SubscriptionEntry[]) => void
    mockFetchSubscriptions.mockReturnValueOnce(new Promise<SubscriptionEntry[]>((r) => { resolve = r }))
    const store = useSubscriptionsStore()
    const p = store.loadSubscriptions()
    expect(store.isLoading).toBe(true)
    resolve([])
    await p
    expect(store.isLoading).toBe(false)
  })

  // ── activeSubscriptions / inactiveSubscriptions ──────────────
  it('activeSubscriptions returns only active subscriptions', async () => {
    mockFetchSubscriptions.mockResolvedValueOnce([
      makeSub({ id: 's1', isActive: true }),
      makeSub({ id: 's2', isActive: false }),
      makeSub({ id: 's3', isActive: true }),
    ])
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    expect(store.activeSubscriptions).toHaveLength(2)
    expect(store.activeSubscriptions.every((s) => s.isActive)).toBe(true)
  })

  it('inactiveSubscriptions returns only inactive subscriptions', async () => {
    mockFetchSubscriptions.mockResolvedValueOnce([
      makeSub({ id: 's1', isActive: true }),
      makeSub({ id: 's2', isActive: false }),
    ])
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    expect(store.inactiveSubscriptions).toHaveLength(1)
    expect(store.inactiveSubscriptions[0].isActive).toBe(false)
  })

  // ── monthlyExpenses / monthlyIncome ──────────────────────────
  it('monthlyExpenses sums only active EXPENSE subscriptions', async () => {
    mockFetchSubscriptions.mockResolvedValueOnce([
      makeSub({ id: 's1', type: 'EXPENSE', amount: 15.99, isActive: true }),
      makeSub({ id: 's2', type: 'EXPENSE', amount: 50, isActive: false }), // inactive — excluded
      makeSub({ id: 's3', type: 'INCOME', amount: 1000, isActive: true }), // income — excluded
    ])
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    expect(store.monthlyExpenses).toBeCloseTo(15.99)
  })

  it('monthlyIncome sums only active INCOME subscriptions', async () => {
    mockFetchSubscriptions.mockResolvedValueOnce([
      makeSub({ id: 's1', type: 'INCOME', amount: 1000, isActive: true }),
      makeSub({ id: 's2', type: 'INCOME', amount: 500, isActive: false }), // inactive
    ])
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    expect(store.monthlyIncome).toBeCloseTo(1000)
  })

  it('monthlyExpenses adds multiple active expenses as plain monthly sums', async () => {
    mockFetchSubscriptions.mockResolvedValueOnce([
      makeSub({ id: 's1', type: 'EXPENSE', amount: 10, isActive: true }),
      makeSub({ id: 's2', type: 'EXPENSE', amount: 25.50, isActive: true }),
    ])
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    expect(store.monthlyExpenses).toBeCloseTo(35.50)
  })

  // ── createSubscription ───────────────────────────────────────
  it('createSubscription appends new subscription to list', async () => {
    const newSub = makeSub({ id: 'new-1' })
    mockCallCreateSubscription.mockResolvedValueOnce(newSub)
    const store = useSubscriptionsStore()
    await store.createSubscription({
      name: 'Netflix',
      type: 'EXPENSE',
      amount: 15.99,
      categoryId: 'cat-1',
      accountId: 'acc-1',
    })
    expect(store.subscriptions).toContainEqual(newSub)
  })

  it('createSubscription throws on API error', async () => {
    mockCallCreateSubscription.mockRejectedValueOnce(new Error('Server error'))
    const store = useSubscriptionsStore()
    await expect(
      store.createSubscription({
        name: 'Netflix',
        type: 'EXPENSE',
        amount: 15.99,
        categoryId: 'cat-1',
        accountId: 'acc-1',
      }),
    ).rejects.toThrow('Server error')
  })

  // ── updateSubscription ───────────────────────────────────────
  it('updateSubscription patches the subscription in the list', async () => {
    mockFetchSubscriptions.mockResolvedValueOnce([makeSub({ id: 's1', amount: 15.99 })])
    const updated = makeSub({ id: 's1', amount: 19.99 })
    mockCallUpdateSubscription.mockResolvedValueOnce(updated)
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    await store.updateSubscription('s1', { amount: 19.99 })
    expect(store.subscriptions.find((s) => s.id === 's1')?.amount).toBe(19.99)
  })

  // ── deleteSubscription ───────────────────────────────────────
  it('deleteSubscription removes the subscription from the list', async () => {
    mockFetchSubscriptions.mockResolvedValueOnce([makeSub({ id: 's1' })])
    mockCallDeleteSubscription.mockResolvedValueOnce(undefined)
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    await store.deleteSubscription('s1')
    expect(store.subscriptions.find((s) => s.id === 's1')).toBeUndefined()
  })

  // ── clearError ────────────────────────────────────────────────
  it('clearError resets the error field', async () => {
    mockFetchSubscriptions.mockRejectedValueOnce(new Error('Fail'))
    const store = useSubscriptionsStore()
    await store.loadSubscriptions()
    expect(store.error).toBe('Fail')
    store.clearError()
    expect(store.error).toBeNull()
  })
})
