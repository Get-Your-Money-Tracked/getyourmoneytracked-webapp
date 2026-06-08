import { urqlClient } from '@/lib/urql'
import type { SubscriptionEntry } from '@/types'
import { parseMoney, toMoney } from '@/utils/currency'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse Money scalars (strings) to numbers on a SubscriptionEntry response */
function parseSubscriptionMoney(raw: Record<string, unknown>): SubscriptionEntry {
  const account = raw.account as Record<string, unknown> | null
  return {
    ...raw,
    amount: parseMoney(raw.amount),
    account: account
      ? { ...account, balance: parseMoney(account.balance) }
      : account,
  } as SubscriptionEntry
}

// ── Queries ───────────────────────────────────────────────────────────────────

const SUBSCRIPTIONS_QUERY = `
  query Subscriptions($activeOnly: Boolean) {
    subscriptions(activeOnly: $activeOnly) {
      id
      name
      type
      amount
      nextDueDate
      isActive
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
        includeInTotal
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
      nextDueDate
      isActive
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
        includeInTotal
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
      nextDueDate
      isActive
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
        includeInTotal
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
}

export interface UpdateSubscriptionInput {
  name?: string
  amount?: number
  categoryId?: string
  accountId?: string
  isActive?: boolean
}

// ── Call functions ────────────────────────────────────────────────────────────

export async function fetchSubscriptions(activeOnly?: boolean | null): Promise<SubscriptionEntry[]> {
  const result = await urqlClient
    .query(SUBSCRIPTIONS_QUERY, { activeOnly: activeOnly ?? null })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to fetch subscriptions.')
  const raw = (result.data?.subscriptions as Record<string, unknown>[]) ?? []
  return raw.map(parseSubscriptionMoney)
}

export async function callCreateSubscription(
  input: CreateSubscriptionInput,
): Promise<SubscriptionEntry> {
  const gqlInput = { ...input, amount: toMoney(input.amount) }
  const result = await urqlClient
    .mutation(CREATE_SUBSCRIPTION_MUTATION, { input: gqlInput })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to create subscription.')
  if (!result.data?.createSubscription) throw new Error('No data returned from createSubscription.')
  return parseSubscriptionMoney(result.data.createSubscription as Record<string, unknown>)
}

export async function callUpdateSubscription(
  id: string,
  input: UpdateSubscriptionInput,
): Promise<SubscriptionEntry> {
  const gqlInput = {
    ...input,
    amount: input.amount != null ? toMoney(input.amount) : undefined,
  }
  const result = await urqlClient
    .mutation(UPDATE_SUBSCRIPTION_MUTATION, { id, input: gqlInput })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to update subscription.')
  if (!result.data?.updateSubscription) throw new Error('No data returned from updateSubscription.')
  return parseSubscriptionMoney(result.data.updateSubscription as Record<string, unknown>)
}

export async function callDeleteSubscription(id: string): Promise<void> {
  const result = await urqlClient
    .mutation(DELETE_SUBSCRIPTION_MUTATION, { id })
    .toPromise()
  if (result.error) throw new Error(result.error.message ?? 'Failed to delete subscription.')
}
