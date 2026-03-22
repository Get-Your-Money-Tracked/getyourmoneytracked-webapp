import { urqlClient } from '@/lib/urql'
import type { Transaction } from '@/types'
import { parseMoney, toMoney } from '@/utils/currency'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse Money scalars (strings) to numbers on a Transaction response object */
function parseTransactionMoney(raw: Record<string, unknown>): Transaction {
  return {
    ...raw,
    amount: parseMoney(raw.amount),
  } as Transaction
}

// ── Queries ───────────────────────────────────────────────────────────────────

const TRANSACTIONS_QUERY = `
  query Transactions($filter: TransactionFilterInput) {
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
  mutation UpdateTransaction($input: UpdateTransactionInput!) {
    updateTransaction(input: $input) {
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
    deleteTransaction(id: $id) {
      id
    }
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

// ── Typed call functions ──────────────────────────────────────────────────────

export async function fetchTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
  const result = await urqlClient.query(TRANSACTIONS_QUERY, { filter: filter ?? {} }).toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch transactions.')
  }
  const raw = (result.data?.transactions as Record<string, unknown>[]) ?? []
  return raw.map(parseTransactionMoney)
}

export async function callCreateTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const gqlInput = {
    ...input,
    amount: toMoney(input.amount),
    description: input.description ?? '',
    notes: input.notes ?? '',
  }
  const result = await urqlClient
    .mutation(CREATE_TRANSACTION_MUTATION, { input: gqlInput })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to create transaction.')
  }
  if (!result.data?.createTransaction) {
    throw new Error('No data returned from createTransaction.')
  }
  return parseTransactionMoney(result.data.createTransaction as Record<string, unknown>)
}

export async function callUpdateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const gqlInput = {
    id,
    ...input,
    amount: toMoney(input.amount),
    description: input.description ?? '',
    notes: input.notes ?? '',
  }
  const result = await urqlClient
    .mutation(UPDATE_TRANSACTION_MUTATION, { input: gqlInput })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to update transaction.')
  }
  if (!result.data?.updateTransaction) {
    throw new Error('No data returned from updateTransaction.')
  }
  return parseTransactionMoney(result.data.updateTransaction as Record<string, unknown>)
}

export async function callDeleteTransaction(id: string): Promise<void> {
  const result = await urqlClient
    .mutation(DELETE_TRANSACTION_MUTATION, { id })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to delete transaction.')
  }
}
