import { urqlClient } from '@/lib/urql'
import type { Account } from '@/types'
import { parseMoney } from '@/utils/currency'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse Money scalars (strings) to numbers on an Account response object */
function parseAccountMoney(raw: Record<string, unknown>): Account {
  return {
    ...raw,
    balance: parseMoney(raw.balance),
  } as Account
}

// ── Queries ───────────────────────────────────────────────────────────────────

const ACCOUNTS_QUERY = `
  query Accounts {
    accounts {
      id
      name
      type
      currency
      balance
      icon
      isDefault
      includeInTotal
    }
  }
`

// ── Mutations ─────────────────────────────────────────────────────────────────

const CREATE_ACCOUNT_MUTATION = `
  mutation CreateAccount($input: CreateAccountInput!) {
    createAccount(input: $input) {
      id
      name
      type
      currency
      balance
      icon
      isDefault
      includeInTotal
    }
  }
`

const UPDATE_ACCOUNT_MUTATION = `
  mutation UpdateAccount($input: UpdateAccountInput!) {
    updateAccount(input: $input) {
      id
      name
      type
      currency
      balance
      icon
      isDefault
      includeInTotal
    }
  }
`

const ARCHIVE_ACCOUNT_MUTATION = `
  mutation ArchiveAccount($id: ID!) {
    archiveAccount(id: $id) {
      id
    }
  }
`

// ── Typed call functions ──────────────────────────────────────────────────────

export async function fetchAccounts(): Promise<Account[]> {
  const result = await urqlClient.query(ACCOUNTS_QUERY, {}).toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch accounts.')
  }
  const raw = (result.data?.accounts as Record<string, unknown>[]) ?? []
  return raw.map(parseAccountMoney)
}

export interface CreateAccountInput {
  name: string
  type: 'CASH' | 'BANK' | 'CREDIT_CARD'
  currency?: string
  startingBalance?: string
  icon?: string | null
}

export async function callCreateAccount(input: CreateAccountInput): Promise<Account> {
  const result = await urqlClient
    .mutation(CREATE_ACCOUNT_MUTATION, { input })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to create account.')
  }
  if (!result.data?.createAccount) {
    throw new Error('No data returned from createAccount.')
  }
  return parseAccountMoney(result.data.createAccount as Record<string, unknown>)
}

export interface UpdateAccountInput {
  name?: string
  icon?: string | null
  isDefault?: boolean
}

export async function callUpdateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
  const result = await urqlClient
    .mutation(UPDATE_ACCOUNT_MUTATION, { input: { id, ...input } })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to update account.')
  }
  if (!result.data?.updateAccount) {
    throw new Error('No data returned from updateAccount.')
  }
  return parseAccountMoney(result.data.updateAccount as Record<string, unknown>)
}

export async function callArchiveAccount(id: string): Promise<void> {
  const result = await urqlClient
    .mutation(ARCHIVE_ACCOUNT_MUTATION, { id })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to archive account.')
  }
}
