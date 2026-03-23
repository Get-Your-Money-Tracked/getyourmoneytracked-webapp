import { urqlClient } from '@/lib/urql'
import type { Goal } from '@/types'
import { parseMoney, toMoney } from '@/utils/currency'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse Money scalars (strings) to numbers on a Goal response */
function parseGoalMoney(raw: Record<string, unknown>): Goal {
  return {
    ...raw,
    targetAmount: parseMoney(raw.targetAmount),
    currentAmount: parseMoney(raw.currentAmount),
  } as Goal
}

// ── Fragment ──────────────────────────────────────────────────────────────────

const GOAL_FIELDS = `
  id
  name
  targetAmount
  currentAmount
  targetDate
  icon
  createdAt
`

// ── Queries ───────────────────────────────────────────────────────────────────

const GOALS_QUERY = `
  query Goals {
    goals {
      ${GOAL_FIELDS}
    }
  }
`

// ── Mutations ─────────────────────────────────────────────────────────────────

const CREATE_GOAL_MUTATION = `
  mutation CreateGoal($input: CreateGoalInput!) {
    createGoal(input: $input) {
      ${GOAL_FIELDS}
    }
  }
`

const UPDATE_GOAL_MUTATION = `
  mutation UpdateGoal($id: ID!, $input: UpdateGoalInput!) {
    updateGoal(id: $id, input: $input) {
      ${GOAL_FIELDS}
    }
  }
`

const DELETE_GOAL_MUTATION = `
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id)
  }
`

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateGoalInput {
  name: string
  targetAmount: number
  currentAmount?: number
  targetDate?: string | null
  icon?: string | null
}

export interface UpdateGoalInput {
  name?: string
  targetAmount?: number
  currentAmount?: number
  targetDate?: string | null
  clearTargetDate?: boolean
  icon?: string | null
  clearIcon?: boolean
}

// ── Call functions ────────────────────────────────────────────────────────────

export async function fetchGoals(): Promise<Goal[]> {
  const result = await urqlClient.query(GOALS_QUERY, {}).toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to fetch goals.')
  const raw = (result.data?.goals as Record<string, unknown>[]) ?? []
  return raw.map(parseGoalMoney)
}

export async function callCreateGoal(input: CreateGoalInput): Promise<Goal> {
  const gqlInput = {
    ...input,
    targetAmount: toMoney(input.targetAmount),
    currentAmount: input.currentAmount != null ? toMoney(input.currentAmount) : undefined,
  }
  const result = await urqlClient
    .mutation(CREATE_GOAL_MUTATION, { input: gqlInput })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to create goal.')
  if (!result.data?.createGoal) throw new Error('No data returned from createGoal.')
  return parseGoalMoney(result.data.createGoal as Record<string, unknown>)
}

export async function callUpdateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  const gqlInput = {
    ...input,
    targetAmount: input.targetAmount != null ? toMoney(input.targetAmount) : undefined,
    currentAmount: input.currentAmount != null ? toMoney(input.currentAmount) : undefined,
  }
  const result = await urqlClient
    .mutation(UPDATE_GOAL_MUTATION, { id, input: gqlInput })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to update goal.')
  if (!result.data?.updateGoal) throw new Error('No data returned from updateGoal.')
  return parseGoalMoney(result.data.updateGoal as Record<string, unknown>)
}

export async function callDeleteGoal(id: string): Promise<void> {
  const result = await urqlClient.mutation(DELETE_GOAL_MUTATION, { id }).toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to delete goal.')
}
