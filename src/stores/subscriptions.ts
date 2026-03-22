import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SubscriptionEntry } from '@/types'
import {
  fetchSubscriptions,
  callCreateSubscription,
  callUpdateSubscription,
  callDeleteSubscription,
  type CreateSubscriptionInput,
  type UpdateSubscriptionInput,
} from '@/graphql/queries/subscriptions'

/** Normalize any frequency amount to a monthly equivalent */
export function toMonthlyAmount(amount: number, frequency: SubscriptionEntry['frequency']): number {
  switch (frequency) {
    case 'DAILY':
      return amount * 30.44
    case 'WEEKLY':
      return amount * 4.33
    case 'MONTHLY':
      return amount
    case 'YEARLY':
      return amount / 12
    default:
      return amount
  }
}

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  // ── State ────────────────────────────────────────────────────
  const subscriptions = ref<SubscriptionEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ─────────────────────────────────────────────────

  /** Active subscriptions only */
  const activeSubscriptions = computed(() =>
    subscriptions.value.filter((s) => s.isActive),
  )

  /** Inactive subscriptions only */
  const inactiveSubscriptions = computed(() =>
    subscriptions.value.filter((s) => !s.isActive),
  )

  /** Total monthly expenses (active, normalized to monthly) */
  const monthlyExpenses = computed(() =>
    activeSubscriptions.value
      .filter((s) => s.type === 'EXPENSE')
      .reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.frequency), 0),
  )

  /** Total monthly income (active, normalized to monthly) */
  const monthlyIncome = computed(() =>
    activeSubscriptions.value
      .filter((s) => s.type === 'INCOME')
      .reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.frequency), 0),
  )

  // ── Actions ──────────────────────────────────────────────────

  async function loadSubscriptions(activeOnly?: boolean | null): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const data = await fetchSubscriptions(activeOnly)
      subscriptions.value = data
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to load subscriptions.'
    } finally {
      isLoading.value = false
    }
  }

  async function createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionEntry> {
    error.value = null
    try {
      const newSub = await callCreateSubscription(input)
      subscriptions.value = [...subscriptions.value, newSub]
      return newSub
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to create subscription.'
      throw e
    }
  }

  async function updateSubscription(
    id: string,
    input: UpdateSubscriptionInput,
  ): Promise<SubscriptionEntry> {
    error.value = null
    try {
      const updated = await callUpdateSubscription(id, input)
      subscriptions.value = subscriptions.value.map((s) => (s.id === id ? { ...s, ...updated } : s))
      return updated
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to update subscription.'
      throw e
    }
  }

  async function deleteSubscription(id: string): Promise<void> {
    error.value = null
    try {
      await callDeleteSubscription(id)
      subscriptions.value = subscriptions.value.filter((s) => s.id !== id)
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to delete subscription.'
      throw e
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    subscriptions,
    isLoading,
    error,
    activeSubscriptions,
    inactiveSubscriptions,
    monthlyExpenses,
    monthlyIncome,
    loadSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    clearError,
  }
})
