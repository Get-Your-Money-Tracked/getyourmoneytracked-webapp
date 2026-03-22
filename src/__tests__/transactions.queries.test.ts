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
  fetchTransactions,
  callCreateTransaction,
  callUpdateTransaction,
  callDeleteTransaction,
} from '@/graphql/queries/transactions'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Backend returns amount as a Money string */
const RAW_TRANSACTION = {
  id: 'txn-1',
  type: 'EXPENSE',
  amount: '42.50', // Money scalar = string
  date: '2026-03-15',
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: 'cat-1',
  description: 'Lunch',
  notes: null,
  tags: ['food'],
  receiptUrl: null,
  createdAt: '2026-03-15T12:00:00Z',
  updatedAt: '2026-03-15T12:00:00Z',
}

// ── fetchTransactions ────────────────────────────────────────────────────────

describe('fetchTransactions', () => {
  it('parses Money amount from string to number', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { transactions: [RAW_TRANSACTION] },
      error: undefined,
    })

    const transactions = await fetchTransactions()

    expect(transactions).toHaveLength(1)
    expect(transactions[0].amount).toBe(42.5)
    expect(typeof transactions[0].amount).toBe('number')
  })

  it('uses TransactionFilterInput type (not TransactionFilter)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { transactions: [] },
      error: undefined,
    })

    await fetchTransactions({ month: '2026-03-01' })

    const queryString = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryString).toContain('$filter: TransactionFilterInput')
    expect(queryString).not.toMatch(/\$filter:\s*TransactionFilter[^I]/)
  })

  it('throws on error', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed' },
    })

    await expect(fetchTransactions()).rejects.toThrow('Failed')
  })
})

// ── callCreateTransaction ────────────────────────────────────────────────────

describe('callCreateTransaction', () => {
  it('converts numeric amount to Money string in input', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { createTransaction: RAW_TRANSACTION },
      error: undefined,
    })

    await callCreateTransaction({
      type: 'EXPENSE',
      amount: 42.5,
      date: '2026-03-15',
      accountId: 'acc-1',
    })

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    const input = variables.input as Record<string, unknown>
    expect(input.amount).toBe('42.5')
    expect(typeof input.amount).toBe('string')
  })

  it('parses Money amount in response', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { createTransaction: RAW_TRANSACTION },
      error: undefined,
    })

    const txn = await callCreateTransaction({
      type: 'EXPENSE',
      amount: 42.5,
      date: '2026-03-15',
      accountId: 'acc-1',
    })

    expect(txn.amount).toBe(42.5)
    expect(typeof txn.amount).toBe('number')
  })
})

// ── callUpdateTransaction ────────────────────────────────────────────────────

describe('callUpdateTransaction', () => {
  it('sends id inside the input object (not as separate variable)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateTransaction: RAW_TRANSACTION },
      error: undefined,
    })

    await callUpdateTransaction('txn-1', {
      type: 'EXPENSE',
      amount: 50,
      date: '2026-03-15',
      accountId: 'acc-1',
    })

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    expect(variables).not.toHaveProperty('id')
    expect(variables.input).toBeDefined()
    const input = variables.input as Record<string, unknown>
    expect(input.id).toBe('txn-1')
  })

  it('uses UpdateTransactionInput! type (single input arg)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateTransaction: RAW_TRANSACTION },
      error: undefined,
    })

    await callUpdateTransaction('txn-1', {
      type: 'EXPENSE',
      amount: 50,
      date: '2026-03-15',
      accountId: 'acc-1',
    })

    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    expect(mutationString).toContain('$input: UpdateTransactionInput!')
    expect(mutationString).not.toContain('$id: ID!')
  })

  it('converts numeric amount to Money string in input', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateTransaction: RAW_TRANSACTION },
      error: undefined,
    })

    await callUpdateTransaction('txn-1', {
      type: 'EXPENSE',
      amount: 99.99,
      date: '2026-03-15',
      accountId: 'acc-1',
    })

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    const input = variables.input as Record<string, unknown>
    expect(input.amount).toBe('99.99')
    expect(typeof input.amount).toBe('string')
  })
})

// ── callDeleteTransaction ────────────────────────────────────────────────────

describe('callDeleteTransaction', () => {
  it('has a selection set on returned Transaction (not scalar)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { deleteTransaction: { id: 'txn-1' } },
      error: undefined,
    })

    await callDeleteTransaction('txn-1')

    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    expect(mutationString).toMatch(/deleteTransaction\(id: \$id\)\s*\{/)
  })
})
