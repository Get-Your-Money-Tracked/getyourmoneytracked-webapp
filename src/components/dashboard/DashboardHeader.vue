<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { getGreeting } from '@/utils/greeting'

const props = defineProps<{
  /** ISO month string e.g. "2026-03" */
  month: string
  /** User's display name */
  displayName: string
  /** Whether the user can advance to the next month (false when viewing current month) */
  canGoForward: boolean
}>()

const emit = defineEmits<{
  'prev-month': []
  'next-month': []
  'reset-month': []
}>()

const greeting = computed(() => `${getGreeting()}, ${props.displayName}`)

/** Format "2026-03" → "March 2026" (full month name) */
const formattedMonth = computed(() => {
  const [year, month] = props.month.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})
</script>

<template>
  <div class="px-4 pb-2 pt-6">
    <!-- Greeting row -->
    <p class="text-body font-normal text-text-secondary" data-testid="greeting">
      {{ greeting }}
    </p>

    <!-- Month navigation row -->
    <div class="mt-1 flex items-center justify-center gap-4">
      <!-- Left chevron (always enabled) -->
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-100 active:scale-90"
        style="color: var(--color-text-secondary)"
        aria-label="Previous month"
        data-testid="prev-month-btn"
        @click="emit('prev-month')"
      >
        <ChevronLeft :size="20" aria-hidden="true" />
      </button>

      <!-- Month label (tappable to reset to current month) -->
      <button
        type="button"
        class="min-w-[140px] cursor-pointer text-center text-lg font-semibold transition-colors duration-150 hover:underline"
        style="color: var(--color-text-primary)"
        aria-label="Reset to current month"
        data-testid="month-label"
        @click="emit('reset-month')"
      >
        <Transition name="month-fade" mode="out-in">
          <span :key="month">{{ formattedMonth }}</span>
        </Transition>
      </button>

      <!-- Right chevron (disabled when at current month) -->
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-100"
        :class="canGoForward ? 'active:scale-90' : 'cursor-not-allowed opacity-40'"
        :style="{ color: canGoForward ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }"
        :disabled="!canGoForward"
        aria-label="Next month"
        data-testid="next-month-btn"
        @click="canGoForward && emit('next-month')"
      >
        <ChevronRight :size="20" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.month-fade-enter-active,
.month-fade-leave-active {
  transition: opacity 150ms ease;
}
.month-fade-enter-from,
.month-fade-leave-to {
  opacity: 0;
}
</style>
