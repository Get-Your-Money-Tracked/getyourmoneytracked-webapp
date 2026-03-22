import { urqlClient } from '@/lib/urql'
import type { Transaction } from '@/types'

// ── Queries ───────────────────────────────────────────────────────────────────

const TRANSACTIONS_QUERY = `
  query Transactions($filter: TransactionFilter) {
    transactions(filter: $filter) {
      id
      type
      amount
      date
      accountId
      toAccountId
      categoryId
      description
      notes
      tags
      receiptUrl
      createdAt
      updatedAt
    }
  }
`

// ── Mutations ─────────────────────────────────────────────────────────────────

const CREATE_TRANSACTION_MUTATION = `
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      id
      type
      amount
      date
      accountId
      toAccountId
      categoryId
      description
      notes
      tags
      receiptUrl
      createdAt
      updatedAt
    }
  }
`

const UPDATE_TRANSACTION_MUTATION = `
  mutation UpdateTransaction($id: ID!, $input: UpdateTransactionInput!) {
    updateTransaction(id: $id, input: $input) {
      id
      type
      amount
      date
      accountId
      toAccountId
      categoryId
      description
      notes
      tags
      receiptUrl
      createdAt
      updatedAt
    }
  }
`

const DELETE_TRANSACTION_MUTATION = `
  mutation DeleteTransaction($id: ID!) {
    deleteTransaction(id: $id)
  }
`

// ── Typed interfaces ──────────────────────────────────────────────────────────

export interface TransactionFilter {
  month?: string | null
  categoryId?: string | null
  accountId?: string | null
  type?: string | null
  search?: string | null
  tags?: string[] | null
  limit?: number
  offset?: number
}

export interface CreateTransactionInput {
  type: string
  amount: number
  date: string
  accountId: string
  toAccountId?: string | null
  categoryId?: string | null
  description?: string | null
  notes?: string | null
  tags?: string[]
  receiptUrl?: string | null
}

export interface UpdateTransactionInput {
  type?: string
  amount?: number
  date?: string
  accountId?: string
  toAccountId?: string | null
  categoryId?: string | null
  description?: string | null
  notes?: string | null
  tags?: string[]
  receiptUrl?: string | null
}

// ── Typed call functions ──────────────────────────────────────────────────────

export async function fetchTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
  const result = await urqlClient.query(TRANSACTIONS_QUERY, { filter: filter ?? {} }).toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch transactions.')
  }
  return (result.data?.transactions as Transaction[]) ?? []
}

export async function callCreateTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const result = await urqlClient
    .mutation(CREATE_TRANSACTION_MUTATION, { input })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to create transaction.')
  }
  if (!result.data?.createTransaction) {
    throw new Error('No data returned from createTransaction.')
  }
  return result.data.createTransaction as Transaction
}

export async function callUpdateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const result = await urqlClient
    .mutation(UPDATE_TRANSACTION_MUTATION, { id, input })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to update transaction.')
  }
  if (!result.data?.updateTransaction) {
    throw new Error('No data returned from updateTransaction.')
  }
  return result.data.updateTransaction as Transaction
}

export async function callDeleteTransaction(id: string): Promise<void> {
  const result = await urqlClient
    .mutation(DELETE_TRANSACTION_MUTATION, { id })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to delete transaction.')
  }
}
