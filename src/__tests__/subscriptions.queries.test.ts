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
  fetchSubscriptions,
  callCreateSubscription,
  callUpdateSubscription,
  callDeleteSubscription,
} from '@/graphql/queries/subscriptions'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_SUBSCRIPTION = {
  id: 'sub-1',
  name: 'Netflix',
  type: 'EXPENSE',
  amount: '15.99', // Money string
  frequency: 'MONTHLY',
  dayOfMonth: 15,
  nextDueDate: '2026-04-15',
  isActive: true,
  autoLog: false,
  pendingAmount: null,
  pendingEffectiveDate: null,
  category: {
    id: 'cat-1',
    name: 'Entertainment',
    icon: 'tv',
    color: '#E50914',
    parentId: null,
    isDefault: false,
    sortOrder: 3,
  },
  account: {
    id: 'acc-1',
    name: 'Checking',
    type: 'BANK',
    currency: 'USD',
    balance: '5000.00', // Money string on nested Account
    icon: null,
    isDefault: true,
    includeInTotal: true,
  },
}

// ── fetchSubscriptions ───────────────────────────────────────────────────────

describe('fetchSubscriptions', () => {
  it('parses Money amount from string to number', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { subscriptions: [RAW_SUBSCRIPTION] },
      error: undefined,
    })

    const subs = await fetchSubscriptions()

    expect(subs).toHaveLength(1)
    expect(subs[0].amount).toBe(15.99)
    expect(typeof subs[0].amount).toBe('number')
  })

  it('parses nested account balance from Money string to number', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { subscriptions: [RAW_SUBSCRIPTION] },
      error: undefined,
    })

    const subs = await fetchSubscriptions()

    expect(subs[0].account.balance).toBe(5000)
    expect(typeof subs[0].account.balance).toBe('number')
  })

  it('does not request isArchived on nested account', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { subscriptions: [] },
      error: undefined,
    })

    await fetchSubscriptions()

    const queryString = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryString).not.toContain('isArchived')
  })

  it('requests includeInTotal on nested account', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { subscriptions: [] },
      error: undefined,
    })

    await fetchSubscriptions()

    const queryString = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryString).toContain('includeInTotal')
  })
})

// ── callCreateSubscription ───────────────────────────────────────────────────

describe('callCreateSubscription', () => {
  it('converts numeric amount to Money string in input', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { createSubscription: RAW_SUBSCRIPTION },
      error: undefined,
    })

    await callCreateSubscription({
      name: 'Netflix',
      type: 'EXPENSE',
      amount: 15.99,
      categoryId: 'cat-1',
      accountId: 'acc-1',
    })

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    const input = variables.input as Record<string, unknown>
    expect(input.amount).toBe('15.99')
    expect(typeof input.amount).toBe('string')
  })

  it('parses Money fields in response', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { createSubscription: RAW_SUBSCRIPTION },
      error: undefined,
    })

    const sub = await callCreateSubscription({
      name: 'Netflix',
      type: 'EXPENSE',
      amount: 15.99,
      categoryId: 'cat-1',
      accountId: 'acc-1',
    })

    expect(sub.amount).toBe(15.99)
    expect(sub.account.balance).toBe(5000)
  })
})

// ── callUpdateSubscription ───────────────────────────────────────────────────

describe('callUpdateSubscription', () => {
  it('converts optional numeric amount to Money string when provided', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateSubscription: RAW_SUBSCRIPTION },
      error: undefined,
    })

    await callUpdateSubscription('sub-1', { amount: 19.99 })

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    const input = variables.input as Record<string, unknown>
    expect(input.amount).toBe('19.99')
  })

  it('does not convert amount when not provided', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateSubscription: RAW_SUBSCRIPTION },
      error: undefined,
    })

    await callUpdateSubscription('sub-1', { name: 'Disney+' })

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    const input = variables.input as Record<string, unknown>
    expect(input.amount).toBeUndefined()
    expect(input.name).toBe('Disney+')
  })

  it('uses separate id and input args (subscription schema pattern)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateSubscription: RAW_SUBSCRIPTION },
      error: undefined,
    })

    await callUpdateSubscription('sub-1', { name: 'Test' })

    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    expect(mutationString).toContain('$id: ID!')
    expect(mutationString).toContain('$input: UpdateSubscriptionInput!')

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    expect(variables.id).toBe('sub-1')
  })
})

// ── callDeleteSubscription ───────────────────────────────────────────────────

describe('callDeleteSubscription', () => {
  it('returns void on success (deleteSubscription returns Boolean!)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { deleteSubscription: true },
      error: undefined,
    })

    await expect(callDeleteSubscription('sub-1')).resolves.toBeUndefined()
  })
})
