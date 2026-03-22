import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Budget, BudgetStatus } from '@/types'
import {
  fetchBudgets,
  callCreateBudget,
  callUpdateBudget,
  callDeleteBudget,
  type CreateBudgetInput,
  type UpdateBudgetInput,
} from '@/graphql/queries/budgets'
import { BUDGET_THRESHOLD_WARNING, BUDGET_THRESHOLD_EXCEEDED } from '@/utils/constants'

function getBudgetStatus(percentUsed: number): BudgetStatus {
  if (percentUsed > BUDGET_THRESHOLD_EXCEEDED) return 'EXCEEDED'
  if (percentUsed > BUDGET_THRESHOLD_WARNING) return 'WARNING'
  return 'ON_TRACK'
}

function statusRank(b: Budget): number {
  const status = getBudgetStatus(b.percentUsed)
  if (status === 'EXCEEDED') return 0
  if (status === 'WARNING') return 1
  return 2
}

export const useBudgetsStore = defineStore('budgets', () => {
  // ── State ────────────────────────────────────────────────────
  const budgets = ref<Budget[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentMonth = ref<string | null>(null)

  // ── Computed ─────────────────────────────────────────────────

  /** Budgets sorted worst-first: EXCEEDED → WARNING → ON_TRACK, then by percentUsed DESC */
  const sortedBudgets = computed<Budget[]>(() =>
    [...budgets.value].sort((a, b) => {
      const rankDiff = statusRank(a) - statusRank(b)
      if (rankDiff !== 0) return rankDiff
      return b.percentUsed - a.percentUsed
    }),
  )

  const totalBudgeted = computed(() => budgets.value.reduce((sum, b) => sum + b.amount, 0))
  const totalSpent = computed(() => budgets.value.reduce((sum, b) => sum + b.spent, 0))
  const totalPercentUsed = computed(() =>
    totalBudgeted.value > 0 ? (totalSpent.value / totalBudgeted.value) * 100 : 0,
  )

  /** Category IDs that already have a budget for the current month */
  const budgetedCategoryIds = computed<Set<string>>(() =>
    new Set(budgets.value.map((b) => b.category.id)),
  )

  // ── Actions ──────────────────────────────────────────────────

  async function loadBudgets(month?: string | null): Promise<void> {
    isLoading.value = true
    error.value = null
    currentMonth.value = month ?? null
    try {
      const data = await fetchBudgets(month)
      budgets.value = data
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to load budgets.'
    } finally {
      isLoading.value = false
    }
  }

  async function createBudget(input: CreateBudgetInput): Promise<Budget> {
    error.value = null
    try {
      const newBudget = await callCreateBudget(input)
      budgets.value = [...budgets.value, newBudget]
      return newBudget
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to create budget.'
      throw e
    }
  }

  async function updateBudget(id: string, input: UpdateBudgetInput): Promise<Budget> {
    error.value = null
    try {
      const updated = await callUpdateBudget(id, input)
      budgets.value = budgets.value.map((b) => (b.id === id ? { ...b, ...updated } : b))
      return updated
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to update budget.'
      throw e
    }
  }

  async function deleteBudget(id: string): Promise<void> {
    error.value = null
    try {
      await callDeleteBudget(id)
      budgets.value = budgets.value.filter((b) => b.id !== id)
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to delete budget.'
      throw e
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    budgets,
    isLoading,
    error,
    currentMonth,
    sortedBudgets,
    totalBudgeted,
    totalSpent,
    totalPercentUsed,
    budgetedCategoryIds,
    loadBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    clearError,
  }
})
