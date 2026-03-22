<script setup lang="ts">
import { computed } from 'vue'
import { getGreeting } from '@/utils/greeting'

const props = defineProps<{
  /** ISO month string e.g. "2026-03" */
  month: string
  /** User's display name */
  displayName: string
}>()

const greeting = computed(() => `${getGreeting()}, ${props.displayName}`)

/** Format "2026-03" → "Mar 2026" */
const formattedMonth = computed(() => {
  const [year, month] = props.month.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
})
</script>

<template>
  <div class="flex items-center justify-between px-4 pb-2 pt-6">
    <p class="text-body font-normal text-text-secondary" data-testid="greeting">
      {{ greeting }}
    </p>
    <span class="text-caption font-medium text-text-muted" data-testid="month-label">
      {{ formattedMonth }}
    </span>
  </div>
</template>
