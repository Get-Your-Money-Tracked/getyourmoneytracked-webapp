import { urqlClient } from '@/lib/urql'
import type { Account } from '@/types'

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
      isArchived
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
      isArchived
    }
  }
`

const UPDATE_ACCOUNT_MUTATION = `
  mutation UpdateAccount($id: ID!, $input: UpdateAccountInput!) {
    updateAccount(id: $id, input: $input) {
      id
      name
      type
      currency
      balance
      icon
      isDefault
      isArchived
    }
  }
`

const ARCHIVE_ACCOUNT_MUTATION = `
  mutation ArchiveAccount($id: ID!) {
    archiveAccount(id: $id) {
      id
      isArchived
    }
  }
`

// ── Typed call functions ──────────────────────────────────────────────────────

export async function fetchAccounts(): Promise<Account[]> {
  const result = await urqlClient.query(ACCOUNTS_QUERY, {}).toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch accounts.')
  }
  return (result.data?.accounts as Account[]) ?? []
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
  return result.data.createAccount as Account
}

export interface UpdateAccountInput {
  name?: string
  icon?: string | null
  isDefault?: boolean
}

export async function callUpdateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
  const result = await urqlClient
    .mutation(UPDATE_ACCOUNT_MUTATION, { id, input })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to update account.')
  }
  if (!result.data?.updateAccount) {
    throw new Error('No data returned from updateAccount.')
  }
  return result.data.updateAccount as Account
}

export async function callArchiveAccount(id: string): Promise<void> {
  const result = await urqlClient
    .mutation(ARCHIVE_ACCOUNT_MUTATION, { id })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to archive account.')
  }
}
