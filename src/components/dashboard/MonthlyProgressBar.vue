<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

const props = defineProps<{
  /** Percentage of income spent (0–∞) */
  percentSpent: number
  /** True when income is zero */
  noIncome: boolean
}>()

const labelText = computed(() => {
  if (props.noIncome) return null
  if (props.percentSpent > 100) return `${Math.round(props.percentSpent)}% — Over budget!`
  return `${Math.round(props.percentSpent)}% of income spent`
})

const isOverBudget = computed(() => !props.noIncome && props.percentSpent > 100)
</script>

<template>
  <div class="mt-4" data-testid="monthly-progress-bar">
    <ProgressBar :percent="noIncome ? 0 : percentSpent" />
    <p
      class="mt-1.5 text-center text-caption"
      :class="{
        'font-medium text-danger': isOverBudget,
        'italic text-text-muted': noIncome,
        'text-text-secondary': !isOverBudget && !noIncome,
      }"
      data-testid="progress-label"
    >
      <template v-if="noIncome">No income logged yet</template>
      <template v-else>{{ labelText }}</template>
    </p>
  </div>
</template>
