import { urqlClient } from '@/lib/urql'
import type { Budget } from '@/types'
import { parseMoney, toMoney } from '@/utils/currency'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse Money scalars (strings) to numbers on a Budget response object */
function parseBudgetMoney(raw: Record<string, unknown>): Budget {
  return {
    ...raw,
    amount: parseMoney(raw.amount),
    spent: parseMoney(raw.spent),
    remaining: parseMoney(raw.remaining),
  } as Budget
}

// ── Queries ───────────────────────────────────────────────────────────────────

const BUDGETS_QUERY = `
  query Budgets($month: Date) {
    budgets(month: $month) {
      id
      month
      amount
      spent
      remaining
      percentUsed
      category {
        id
        name
        icon
        color
        parentId
        isDefault
        sortOrder
      }
    }
  }
`

// ── Mutations ─────────────────────────────────────────────────────────────────

const CREATE_BUDGET_MUTATION = `
  mutation CreateBudget($input: CreateBudgetInput!) {
    createBudget(input: $input) {
      id
      month
      amount
      spent
      remaining
      percentUsed
      category {
        id
        name
        icon
        color
        parentId
        isDefault
        sortOrder
      }
    }
  }
`

const UPDATE_BUDGET_MUTATION = `
  mutation UpdateBudget($id: ID!, $input: UpdateBudgetInput!) {
    updateBudget(id: $id, input: $input) {
      id
      month
      amount
      spent
      remaining
      percentUsed
      category {
        id
        name
        icon
        color
        parentId
        isDefault
        sortOrder
      }
    }
  }
`

const DELETE_BUDGET_MUTATION = `
  mutation DeleteBudget($id: ID!) {
    deleteBudget(id: $id)
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateBudgetInput {
  categoryId: string
  amount: number
  month?: string | null
}

export interface UpdateBudgetInput {
  amount: number
}

// ── Call functions ────────────────────────────────────────────────────────────

export async function fetchBudgets(month?: string | null): Promise<Budget[]> {
  const result = await urqlClient.query(BUDGETS_QUERY, { month: month ?? null }).toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to fetch budgets.')
  const raw = (result.data?.budgets as Record<string, unknown>[]) ?? []
  return raw.map(parseBudgetMoney)
}

export async function callCreateBudget(input: CreateBudgetInput): Promise<Budget> {
  const gqlInput = { ...input, amount: toMoney(input.amount) }
  const result = await urqlClient.mutation(CREATE_BUDGET_MUTATION, { input: gqlInput }).toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to create budget.')
  if (!result.data?.createBudget) throw new Error('No data returned from createBudget.')
  return parseBudgetMoney(result.data.createBudget as Record<string, unknown>)
}

export async function callUpdateBudget(id: string, input: UpdateBudgetInput): Promise<Budget> {
  const gqlInput = { amount: toMoney(input.amount) }
  const result = await urqlClient.mutation(UPDATE_BUDGET_MUTATION, { id, input: gqlInput }).toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to update budget.')
  if (!result.data?.updateBudget) throw new Error('No data returned from updateBudget.')
  return parseBudgetMoney(result.data.updateBudget as Record<string, unknown>)
}

export async function callDeleteBudget(id: string): Promise<void> {
  const result = await urqlClient.mutation(DELETE_BUDGET_MUTATION, { id }).toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to delete budget.')
}
