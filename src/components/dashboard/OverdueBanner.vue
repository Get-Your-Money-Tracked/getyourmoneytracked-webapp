<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, ChevronRight } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'
import type { OverdueItem } from '@/composables/useOverdueRecurring'

const props = defineProps<{
  items: OverdueItem[]
  currency: string
}>()

const emit = defineEmits<{
  dismiss: []
  review: []
}>()

const count = computed(() => props.items.length)

const total = computed(() => {
  let expenses = 0
  let income = 0
  for (const { subscription: s } of props.items) {
    if (s.type === 'INCOME') income += s.amount
    else expenses += s.amount
  }
  return { expenses, income }
})

const totalLabel = computed(() => {
  const { expenses, income } = total.value
  if (income > 0 && expenses > 0) {
    return `${formatCurrency(expenses, props.currency)} expenses · ${formatCurrency(income, props.currency)} income`
  }
  if (income > 0) return formatCurrency(income, props.currency)
  return formatCurrency(expenses, props.currency)
})
</script>

<template>
  <div
    class="mx-4 mt-4 rounded-xl border-l-4 p-4"
    style="border-color: var(--color-warning); background-color: color-mix(in srgb, var(--color-warning) 10%, transparent)"
    data-testid="overdue-banner"
  >
    <div class="flex items-start gap-3">
      <!-- Icon -->
      <AlertTriangle
        :size="20"
        class="mt-0.5 shrink-0"
        style="color: var(--color-warning)"
        aria-hidden="true"
      />

      <!-- Text -->
      <div class="flex-1 min-w-0">
        <p class="text-body font-semibold text-text-primary" data-testid="overdue-title">
          {{ count }} overdue recurring {{ count === 1 ? 'item' : 'items' }}
        </p>
        <p class="text-caption text-text-secondary mt-0.5" data-testid="overdue-total">
          {{ totalLabel }} total
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-3 flex items-center justify-between">
      <button
        type="button"
        class="text-caption font-medium text-text-secondary cursor-pointer"
        data-testid="overdue-dismiss-btn"
        @click="$emit('dismiss')"
      >
        Dismiss
      </button>

      <button
        type="button"
        class="text-caption font-medium cursor-pointer flex items-center gap-1"
        style="color: var(--color-primary)"
        data-testid="overdue-review-btn"
        @click="$emit('review')"
      >
        Review
        <ChevronRight :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
