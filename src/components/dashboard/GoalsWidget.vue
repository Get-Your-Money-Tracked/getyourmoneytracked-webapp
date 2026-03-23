<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Goal } from '@/types'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  goals: Goal[]
  currency?: string
}>()

const router = useRouter()
const currency = computed(() => props.currency ?? 'USD')

/** Show up to 3 goals */
const displayGoals = computed(() => props.goals.slice(0, 3))

function progressPercent(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
}

function progressColor(goal: Goal): string {
  const pct = progressPercent(goal)
  if (pct >= 100) return 'bg-primary'
  if (pct >= 80) return 'bg-warning'
  if (pct >= 50) return 'bg-primary'
  return 'bg-info'
}

function navigateToGoals() {
  router.push('/goals')
}
</script>

<template>
  <section
    v-if="goals.length > 0"
    class="mt-4"
    data-testid="goals-widget"
  >
    <div class="mx-4 rounded-xl bg-surface p-4 shadow-card">
      <!-- Header -->
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-card-title font-semibold text-text-primary">Savings Goals</h2>
        <button
          type="button"
          class="text-caption font-medium text-primary"
          data-testid="see-all-goals-link"
          @click="navigateToGoals"
        >
          See all →
        </button>
      </div>

      <!-- Mini goal rows -->
      <div class="space-y-3">
        <div
          v-for="goal in displayGoals"
          :key="goal.id"
          class="cursor-pointer"
          :data-testid="`goals-widget-item-${goal.id}`"
          @click="navigateToGoals"
        >
          <div class="mb-1 flex items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-1.5">
              <span v-if="goal.icon" class="text-sm" aria-hidden="true">{{ goal.icon }}</span>
              <span class="truncate text-caption font-medium text-text-primary">{{ goal.name }}</span>
            </div>
            <span class="shrink-0 text-caption text-text-muted tabular-nums">
              {{ formatCurrency(goal.currentAmount, currency) }} / {{ formatCurrency(goal.targetAmount, currency) }}
            </span>
          </div>
          <!-- Mini progress bar h-1 -->
          <div class="h-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="progressColor(goal)"
              :style="{ width: `${progressPercent(goal)}%` }"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
