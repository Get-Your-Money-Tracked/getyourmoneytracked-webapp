<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  totalBudgeted: number
  totalSpent: number
  currency: string
}>()

const percentUsed = computed(() =>
  props.totalBudgeted > 0 ? (props.totalSpent / props.totalBudgeted) * 100 : 0,
)

const isOverBudget = computed(() => props.totalSpent > props.totalBudgeted)

const formattedBudgeted = computed(() => formatCurrency(props.totalBudgeted, props.currency))
const formattedSpent = computed(() => formatCurrency(props.totalSpent, props.currency))
const percentLabel = computed(() => `${Math.round(percentUsed.value)}% of budget used`)
</script>

<template>
  <div
    class="mx-4 mb-4 rounded-2xl bg-surface p-5"
    :style="{ boxShadow: 'var(--shadow-card)' }"
    data-testid="budget-summary-card"
  >
    <!-- Title -->
    <p class="text-caption font-medium uppercase tracking-wider text-text-muted">
      Total Budget Summary
    </p>

    <!-- Metrics row -->
    <div class="mt-3 flex gap-8" data-testid="budget-summary-metrics">
      <div>
        <p class="text-badge uppercase text-text-muted">Budgeted</p>
        <p class="mt-1 text-section-title font-bold tabular-nums text-text-primary" data-testid="total-budgeted">
          {{ formattedBudgeted }}
        </p>
      </div>
      <div>
        <p class="text-badge uppercase text-text-muted">Spent</p>
        <p
          class="mt-1 text-section-title font-bold tabular-nums"
          :class="isOverBudget ? 'text-danger' : 'text-text-primary'"
          data-testid="total-spent"
        >
          {{ formattedSpent }}
        </p>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="mt-3">
      <ProgressBar :percent="percentUsed" />
      <p class="mt-1.5 text-caption text-text-secondary" data-testid="summary-percent-label">
        {{ percentLabel }}
      </p>
    </div>
  </div>
</template>
