import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getNextDueDate, useOverdueRecurring } from '@/composables/useOverdueRecurring'
import type { SubscriptionEntry, Account, Category } from '@/types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn() })),
    mutation: vi.fn(() => ({ toPromise: vi.fn() })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

const _mockCreateTransaction = vi.fn()
vi.mock('@/graphql/queries/transactions', () => ({
  callCreateTransaction: (...args: any[]) => _mockCreateTransaction(...args),
}))

const _mockUpdateSubscription = vi.fn()
vi.mock('@/graphql/queries/subscriptions', () => ({
  callUpdateSubscription: (...args: any[]) => _mockUpdateSubscription(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeAccount(): Account {
  return {
    id: 'acc-1',
    name: 'Main Account',
    type: 'BANK',
    currency: 'USD',
    balance: 1000,
    icon: null,
    isDefault: true,
    includeInTotal: true,
  }
}

function makeCategory(): Category {
  return {
    id: 'cat-1',
    name: 'Housing',
    icon: '🏠',
    color: null,
    parentId: null,
    isDefault: false,
    sortOrder: 0,
  }
}

function makeSub(overrides: Partial<SubscriptionEntry> = {}): SubscriptionEntry {
  return {
    id: 'sub-1',
    name: 'Netflix',
    type: 'EXPENSE',
    amount: 15.99,
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    nextDueDate: '2026-01-01', // safely in the past (tests run in 2026-03)
    isActive: true,
    autoLog: true,
    pendingAmount: null,
    pendingEffectiveDate: null,
    category: makeCategory(),
    account: makeAccount(),
    ...overrides,
  }
}

// ── getNextDueDate ─────────────────────────────────────────────────────────────

describe('getNextDueDate', () => {
  beforeEach(() => {
    // Fix "today" as 2026-03-23
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('DAILY: returns tomorrow', () => {
    expect(getNextDueDate('2026-03-01', 'DAILY', null)).toBe('2026-03-24')
  })

  it('WEEKLY: returns today + 7 days', () => {
    expect(getNextDueDate('2026-03-01', 'WEEKLY', null)).toBe('2026-03-30')
  })

  it('MONTHLY: returns the next occurrence of dayOfMonth >= today', () => {
    // dayOfMonth=25, today=23 → 2026-03-25 (still in March)
    expect(getNextDueDate('2026-03-01', 'MONTHLY', 25)).toBe('2026-03-25')
  })

  it('MONTHLY: advances to next month when dayOfMonth has passed', () => {
    // dayOfMonth=10, today=23 → 2026-04-10
    expect(getNextDueDate('2026-03-10', 'MONTHLY', 10)).toBe('2026-04-10')
  })

  it('MONTHLY: clamps to last day of month for day=31 in short month', () => {
    // dayOfMonth=31, today=23 → March 31 is in the future → 2026-03-31
    expect(getNextDueDate('2026-02-28', 'MONTHLY', 31)).toBe('2026-03-31')
  })

  it('YEARLY: returns next yearly occurrence on or after today', () => {
    // anchor = 2026-01-01 (month=Jan, day=1) → candidate Jan 1 2026 < today → 2027-01-01
    expect(getNextDueDate('2026-01-01', 'YEARLY', null)).toBe('2027-01-01')
  })

  it('YEARLY: uses current year when occurrence is in the future', () => {
    // anchor = 2026-12-25 → candidate Dec 25 2026 > today → 2026-12-25
    expect(getNextDueDate('2026-12-25', 'YEARLY', null)).toBe('2026-12-25')
  })
})

// ── useOverdueRecurring ────────────────────────────────────────────────────────

describe('useOverdueRecurring', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T12:00:00Z'))
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('detects overdue items: active, autoLog=true, nextDueDate < today', () => {
    const sub = makeSub({ nextDueDate: '2026-03-01' }) // past
    const { overdueItems } = useOverdueRecurring(() => [sub])
    expect(overdueItems.value).toHaveLength(1)
    expect(overdueItems.value[0].subscription.id).toBe('sub-1')
    expect(overdueItems.value[0].daysOverdue).toBe(22)
  })

  it('ignores items where autoLog=false', () => {
    const sub = makeSub({ nextDueDate: '2026-03-01', autoLog: false })
    const { overdueItems } = useOverdueRecurring(() => [sub])
    expect(overdueItems.value).toHaveLength(0)
  })

  it('ignores inactive items', () => {
    const sub = makeSub({ nextDueDate: '2026-03-01', isActive: false })
    const { overdueItems } = useOverdueRecurring(() => [sub])
    expect(overdueItems.value).toHaveLength(0)
  })

  it('ignores items with null nextDueDate', () => {
    const sub = makeSub({ nextDueDate: null })
    const { overdueItems } = useOverdueRecurring(() => [sub])
    expect(overdueItems.value).toHaveLength(0)
  })

  it('ignores items due today (not yet overdue)', () => {
    const sub = makeSub({ nextDueDate: '2026-03-23' }) // today
    const { overdueItems } = useOverdueRecurring(() => [sub])
    expect(overdueItems.value).toHaveLength(0)
  })

  it('ignores items due in the future', () => {
    const sub = makeSub({ nextDueDate: '2026-04-01' })
    const { overdueItems } = useOverdueRecurring(() => [sub])
    expect(overdueItems.value).toHaveLength(0)
  })

  it('isVisible is true when there are overdue items and not dismissed', () => {
    const sub = makeSub({ nextDueDate: '2026-03-01' })
    const { isVisible } = useOverdueRecurring(() => [sub])
    expect(isVisible.value).toBe(true)
  })

  it('isVisible is false when no overdue items', () => {
    const { isVisible } = useOverdueRecurring(() => [])
    expect(isVisible.value).toBe(false)
  })

  it('dismiss hides the banner and sets sessionStorage', () => {
    const sub = makeSub({ nextDueDate: '2026-03-01' })
    const { isVisible, dismiss } = useOverdueRecurring(() => [sub])
    expect(isVisible.value).toBe(true)
    dismiss()
    expect(isVisible.value).toBe(false)
    expect(sessionStorage.getItem('overdue_recurring_dismissed')).toBe('true')
  })

  it('isVisible is false when session is already dismissed', () => {
    sessionStorage.setItem('overdue_recurring_dismissed', 'true')
    const sub = makeSub({ nextDueDate: '2026-03-01' })
    const { isVisible } = useOverdueRecurring(() => [sub])
    expect(isVisible.value).toBe(false)
  })

  it('logItems calls createTransaction and updateSubscription for each item', async () => {
    _mockCreateTransaction.mockResolvedValue({ id: 'tx-1' })
    _mockUpdateSubscription.mockResolvedValue({})

    const sub = makeSub({ nextDueDate: '2026-03-01', frequency: 'MONTHLY', dayOfMonth: 1 })
    const { overdueItems, logItems } = useOverdueRecurring(() => [sub])

    await logItems(overdueItems.value)

    expect(_mockCreateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'EXPENSE',
        amount: 15.99,
        date: '2026-03-01',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        description: 'Netflix',
      }),
    )
    expect(_mockUpdateSubscription).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ nextDueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
    )
  })

  it('logItems is a no-op when passed an empty array', async () => {
    const { logItems } = useOverdueRecurring(() => [])
    await logItems([])
    expect(_mockCreateTransaction).not.toHaveBeenCalled()
    expect(_mockUpdateSubscription).not.toHaveBeenCalled()
  })
})
