<script setup lang="ts">
import { computed } from 'vue'
import { BUDGET_THRESHOLD_WARNING, BUDGET_THRESHOLD_EXCEEDED } from '@/utils/constants'

/**
 * PercentBadge — displays a percentage value with color-coded background.
 *
 * Thresholds aligned with backend (0–50% ON_TRACK, 51–85% WARNING, 86%+ EXCEEDED):
 *   0–50%:   bg-primary/10, text-primary     (green tint)
 *   51–85%:  bg-warning/10, text-warning      (amber tint)
 *   86–100%: bg-danger/10, text-danger        (red tint)
 *   >100%:   bg-danger, text-white, animate-pulse (solid red, pulsing)
 */
const props = defineProps<{
  percent: number
}>()

const colorClasses = computed(() => {
  if (props.percent > 100) {
    return 'bg-danger text-white animate-pulse'
  }
  if (props.percent > BUDGET_THRESHOLD_EXCEEDED) {
    return 'bg-danger/10 text-danger'
  }
  if (props.percent > BUDGET_THRESHOLD_WARNING) {
    return 'bg-warning/10 text-warning'
  }
  return 'bg-primary/10 text-primary'
})
</script>

<template>
  <span
    class="inline-block rounded-full px-2.5 py-0.5 text-caption font-medium tabular-nums"
    :class="colorClasses"
    data-testid="percent-badge"
  >
    {{ Math.round(percent) }}%
  </span>
</template>
