<script setup lang="ts">
import { computed } from 'vue'
import { BUDGET_THRESHOLD_WARNING, BUDGET_THRESHOLD_EXCEEDED } from '@/utils/constants'

/**
 * Reusable horizontal progress bar.
 * - percent: 0–∞ (values >100 cap the fill at 100% width but color stays red)
 * - Color thresholds aligned with backend: 0–50 → green, 51–85 → amber, 86+ → red
 */
const props = defineProps<{
  percent: number
}>()

/** Fill width capped at 100%, with minimum 4px when > 0 */
const fillWidth = computed(() => {
  if (props.percent <= 0) return '0%'
  const capped = Math.min(props.percent, 100)
  // Ensure a minimum visible width of 4px via inline style trick — use % for simplicity
  return `${Math.max(capped, 1)}%`
})

/** Color class based on threshold */
const fillColorClass = computed(() => {
  if (props.percent <= BUDGET_THRESHOLD_WARNING) return 'bg-primary'
  if (props.percent <= BUDGET_THRESHOLD_EXCEEDED) return 'bg-warning'
  return 'bg-danger'
})
</script>

<template>
  <!-- Track -->
  <div class="h-2.5 w-full rounded-full bg-surface-muted">
    <!-- Fill -->
    <div
      class="h-2.5 rounded-full transition-[width] duration-500 ease-out"
      :class="fillColorClass"
      :style="{ width: fillWidth }"
      data-testid="progress-fill"
    />
  </div>
</template>
