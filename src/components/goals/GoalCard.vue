<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2 } from 'lucide-vue-next'
import type { Goal } from '@/types'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  goal: Goal
  currency?: string
}>()

const emit = defineEmits<{
  click: [goal: Goal]
}>()

const currency = computed(() => props.currency ?? 'USD')

const progressPercent = computed(() => {
  if (props.goal.targetAmount <= 0) return 0
  const pct = (props.goal.currentAmount / props.goal.targetAmount) * 100
  return Math.min(100, Math.max(0, pct))
})

const isReached = computed(() => props.goal.currentAmount >= props.goal.targetAmount)

/** Progress bar color based on spec tiers */
const progressColor = computed(() => {
  if (isReached.value) return 'bg-primary'
  if (progressPercent.value >= 80) return 'bg-warning'
  if (progressPercent.value >= 50) return 'bg-primary'
  return 'bg-info'
})

const formattedTargetDate = computed(() => {
  if (!props.goal.targetDate) return null
  // targetDate is YYYY-MM-DD; display as "Month YYYY"
  const [year, month] = props.goal.targetDate.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})
</script>

<template>
  <div
    class="mx-4 mt-3 cursor-pointer rounded-xl p-4 shadow-card transition-transform duration-100 active:scale-[0.98]"
    :class="isReached ? 'border border-primary/20 bg-primary/5' : 'border border-border bg-surface'"
    data-testid="goal-card"
    @click="emit('click', goal)"
  >
    <div class="flex items-start justify-between gap-3">
      <!-- Icon + name -->
      <div class="flex min-w-0 items-center gap-3">
        <span v-if="goal.icon" class="text-2xl" aria-hidden="true">{{ goal.icon }}</span>
        <span v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xl">
          🐷
        </span>
        <div class="min-w-0">
          <p class="truncate text-body font-semibold text-text-primary" data-testid="goal-name">
            {{ goal.name }}
          </p>
          <p v-if="formattedTargetDate" class="text-caption text-text-muted" data-testid="goal-target-date">
            Target: {{ formattedTargetDate }}
          </p>
        </div>
      </div>
      <!-- Reached badge -->
      <CheckCircle2
        v-if="isReached"
        :size="20"
        class="shrink-0 text-primary"
        data-testid="goal-reached-badge"
      />
    </div>

    <!-- Progress bar -->
    <div class="mt-3">
      <div class="mb-1 flex items-center justify-between">
        <span class="text-caption text-text-muted" data-testid="goal-progress-label">
          <template v-if="isReached">Goal reached!</template>
          <template v-else>{{ Math.round(progressPercent) }}%</template>
        </span>
        <span class="text-caption font-medium text-text-primary" data-testid="goal-amounts">
          {{ formatCurrency(goal.currentAmount, currency) }} / {{ formatCurrency(goal.targetAmount, currency) }}
        </span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-surface-muted" data-testid="goal-progress-bar">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="progressColor"
          :style="{ width: `${progressPercent}%` }"
          data-testid="goal-progress-fill"
        />
      </div>
    </div>
  </div>
</template>
