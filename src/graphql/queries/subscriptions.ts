import { urqlClient } from '@/lib/urql'
import type { SubscriptionEntry } from '@/types'

// ── Queries ───────────────────────────────────────────────────────────────────

const SUBSCRIPTIONS_QUERY = `
  query Subscriptions($activeOnly: Boolean) {
    subscriptions(activeOnly: $activeOnly) {
      id
      name
      type
      amount
      frequency
      dayOfMonth
      nextDueDate
      isActive
      autoLog
      category {
        id
        name
        icon
        color
        parentId
        isDefault
        sortOrder
      }
      account {
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
  }
`

// ── Mutations ─────────────────────────────────────────────────────────────────

const CREATE_SUBSCRIPTION_MUTATION = `
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      id
      name
      type
      amount
      frequency
      dayOfMonth
      nextDueDate
      isActive
      autoLog
      category {
        id
        name
        icon
        color
        parentId
        isDefault
        sortOrder
      }
      account {
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
  }
`

const UPDATE_SUBSCRIPTION_MUTATION = `
  mutation UpdateSubscription($id: ID!, $input: UpdateSubscriptionInput!) {
    updateSubscription(id: $id, input: $input) {
      id
      name
      type
      amount
      frequency
      dayOfMonth
      nextDueDate
      isActive
      autoLog
      category {
        id
        name
        icon
        color
        parentId
        isDefault
        sortOrder
      }
      account {
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
  }
`

const DELETE_SUBSCRIPTION_MUTATION = `
  mutation DeleteSubscription($id: ID!) {
    deleteSubscription(id: $id)
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateSubscriptionInput {
  name: string
  type: 'EXPENSE' | 'INCOME'
  amount: number
  categoryId: string
  accountId: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  dayOfMonth?: number | null
  startDate?: string | null
}

export interface UpdateSubscriptionInput {
  name?: string
  amount?: number
  categoryId?: string
  accountId?: string
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  dayOfMonth?: number | null
  isActive?: boolean
}

// ── Call functions ────────────────────────────────────────────────────────────

export async function fetchSubscriptions(activeOnly?: boolean | null): Promise<SubscriptionEntry[]> {
  const result = await urqlClient
    .query(SUBSCRIPTIONS_QUERY, { activeOnly: activeOnly ?? null })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to fetch subscriptions.')
  return (result.data?.subscriptions as SubscriptionEntry[]) ?? []
}

export async function callCreateSubscription(
  input: CreateSubscriptionInput,
): Promise<SubscriptionEntry> {
  const result = await urqlClient
    .mutation(CREATE_SUBSCRIPTION_MUTATION, { input })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to create subscription.')
  if (!result.data?.createSubscription) throw new Error('No data returned from createSubscription.')
  return result.data.createSubscription as SubscriptionEntry
}

export async function callUpdateSubscription(
  id: string,
  input: UpdateSubscriptionInput,
): Promise<SubscriptionEntry> {
  const result = await urqlClient
    .mutation(UPDATE_SUBSCRIPTION_MUTATION, { id, input })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to update subscription.')
  if (!result.data?.updateSubscription) throw new Error('No data returned from updateSubscription.')
  return result.data.updateSubscription as SubscriptionEntry
}

export async function callDeleteSubscription(id: string): Promise<void> {
  const result = await urqlClient
    .mutation(DELETE_SUBSCRIPTION_MUTATION, { id })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to delete subscription.')
}
