import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Goal } from '@/types'
import {
  fetchGoals,
  callCreateGoal,
  callUpdateGoal,
  callDeleteGoal,
  type CreateGoalInput,
  type UpdateGoalInput,
} from '@/graphql/queries/goals'

export const useGoalsStore = defineStore('goals', () => {
  // ── State ────────────────────────────────────────────────────
  const goals = ref<Goal[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ─────────────────────────────────────────────────

  /** Goals that have not yet been reached */
  const activeGoals = computed(() =>
    goals.value.filter((g) => g.currentAmount < g.targetAmount),
  )

  /** Goals that have been reached (currentAmount >= targetAmount) */
  const reachedGoals = computed(() =>
    goals.value.filter((g) => g.currentAmount >= g.targetAmount),
  )

  // ── Actions ──────────────────────────────────────────────────

  async function loadGoals(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const data = await fetchGoals()
      goals.value = data
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to load goals.'
    } finally {
      isLoading.value = false
    }
  }

  async function createGoal(input: CreateGoalInput): Promise<Goal> {
    error.value = null
    try {
      const newGoal = await callCreateGoal(input)
      goals.value = [...goals.value, newGoal]
      return newGoal
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to create goal.'
      throw e
    }
  }

  async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
    error.value = null
    try {
      const updated = await callUpdateGoal(id, input)
      goals.value = goals.value.map((g) => (g.id === id ? { ...g, ...updated } : g))
      return updated
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to update goal.'
      throw e
    }
  }

  async function deleteGoal(id: string): Promise<void> {
    error.value = null
    try {
      await callDeleteGoal(id)
      goals.value = goals.value.filter((g) => g.id !== id)
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to delete goal.'
      throw e
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    goals,
    isLoading,
    error,
    activeGoals,
    reachedGoals,
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    clearError,
  }
})
