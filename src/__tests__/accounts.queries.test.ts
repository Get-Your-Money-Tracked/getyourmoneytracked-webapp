import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Firebase (blocks side effects) ──────────────────────────────────────
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
  fetchAccounts,
  callCreateAccount,
  callUpdateAccount,
  callArchiveAccount,
} from '@/graphql/queries/accounts'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Backend returns balance as a Money string */
const RAW_ACCOUNT = {
  id: 'acc-1',
  name: 'Checking',
  type: 'BANK',
  currency: 'USD',
  balance: '1234.56', // Money scalar = string
  icon: null,
  isDefault: true,
  includeInTotal: true,
}

// ── fetchAccounts ────────────────────────────────────────────────────────────

describe('fetchAccounts', () => {
  it('parses Money balance from string to number', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { accounts: [RAW_ACCOUNT] },
      error: undefined,
    })

    const accounts = await fetchAccounts()

    expect(accounts).toHaveLength(1)
    expect(accounts[0].balance).toBe(1234.56)
    expect(typeof accounts[0].balance).toBe('number')
  })

  it('handles zero balance string', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { accounts: [{ ...RAW_ACCOUNT, balance: '0' }] },
      error: undefined,
    })

    const accounts = await fetchAccounts()
    expect(accounts[0].balance).toBe(0)
  })

  it('handles negative balance string (credit card debt)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { accounts: [{ ...RAW_ACCOUNT, balance: '-500.00' }] },
      error: undefined,
    })

    const accounts = await fetchAccounts()
    expect(accounts[0].balance).toBe(-500)
  })

  it('returns empty array when no accounts', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { accounts: [] },
      error: undefined,
    })

    const accounts = await fetchAccounts()
    expect(accounts).toEqual([])
  })

  it('throws on GraphQL error', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: null,
      error: { message: 'Unauthorized' },
    })

    await expect(fetchAccounts()).rejects.toThrow('Unauthorized')
  })

  it('does not request isArchived field', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { accounts: [] },
      error: undefined,
    })

    await fetchAccounts()

    const queryString = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryString).not.toContain('isArchived')
  })

  it('requests includeInTotal field', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { accounts: [] },
      error: undefined,
    })

    await fetchAccounts()

    const queryString = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryString).toContain('includeInTotal')
  })
})

// ── callCreateAccount ────────────────────────────────────────────────────────

describe('callCreateAccount', () => {
  it('parses Money balance in response', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { createAccount: { ...RAW_ACCOUNT, balance: '100.00' } },
      error: undefined,
    })

    const account = await callCreateAccount({
      name: 'New Account',
      type: 'CASH',
    })

    expect(account.balance).toBe(100)
    expect(typeof account.balance).toBe('number')
  })

  it('throws when no data returned', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { createAccount: null },
      error: undefined,
    })

    await expect(
      callCreateAccount({ name: 'Test', type: 'CASH' }),
    ).rejects.toThrow('No data returned from createAccount.')
  })
})

// ── callUpdateAccount ────────────────────────────────────────────────────────

describe('callUpdateAccount', () => {
  it('sends id inside the input object (not as separate variable)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateAccount: RAW_ACCOUNT },
      error: undefined,
    })

    await callUpdateAccount('acc-1', { name: 'Updated Name' })

    // Check the variables sent to the mutation
    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>

    // id should be INSIDE input, not at the top level
    expect(variables).not.toHaveProperty('id')
    expect(variables.input).toEqual({
      id: 'acc-1',
      name: 'Updated Name',
    })
  })

  it('uses UpdateAccountInput! type (not separate id and input args)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateAccount: RAW_ACCOUNT },
      error: undefined,
    })

    await callUpdateAccount('acc-1', { name: 'Test' })

    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    // Should have single $input variable, not $id and $input
    expect(mutationString).toContain('$input: UpdateAccountInput!')
    expect(mutationString).not.toContain('$id: ID!')
  })

  it('parses Money balance in response', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateAccount: { ...RAW_ACCOUNT, balance: '999.99' } },
      error: undefined,
    })

    const account = await callUpdateAccount('acc-1', { name: 'Test' })
    expect(account.balance).toBe(999.99)
  })
})

// ── callArchiveAccount ───────────────────────────────────────────────────────

describe('callArchiveAccount', () => {
  it('sends id as variable and has selection set on returned Account', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { archiveAccount: { id: 'acc-1' } },
      error: undefined,
    })

    await callArchiveAccount('acc-1')

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    expect(variables).toEqual({ id: 'acc-1' })

    // Verify the mutation has a selection set (not just `archiveAccount(id: $id)`)
    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    expect(mutationString).toContain('archiveAccount(id: $id)')
    expect(mutationString).toMatch(/archiveAccount\(id: \$id\)\s*\{/)
  })

  it('throws on error', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: null,
      error: { message: 'Cannot archive only account' },
    })

    await expect(callArchiveAccount('acc-1')).rejects.toThrow(
      'Cannot archive only account',
    )
  })
})
