import { urqlClient } from '@/lib/urql'
import type { Budget } from '@/types'

// ── Queries ───────────────────────────────────────────────────────────────────

const BUDGETS_QUERY = `
  query Budgets($month: String) {
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
  return (result.data?.budgets as Budget[]) ?? []
}

export async function callCreateBudget(input: CreateBudgetInput): Promise<Budget> {
  const result = await urqlClient.mutation(CREATE_BUDGET_MUTATION, { input }).toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to create budget.')
  if (!result.data?.createBudget) throw new Error('No data returned from createBudget.')
  return result.data.createBudget as Budget
}

export async function callUpdateBudget(id: string, input: UpdateBudgetInput): Promise<Budget> {
  const result = await urqlClient.mutation(UPDATE_BUDGET_MUTATION, { id, input }).toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to update budget.')
  if (!result.data?.updateBudget) throw new Error('No data returned from updateBudget.')
  return result.data.updateBudget as Budget
}

export async function callDeleteBudget(id: string): Promise<void> {
  const result = await urqlClient.mutation(DELETE_BUDGET_MUTATION, { id }).toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to delete budget.')
}
