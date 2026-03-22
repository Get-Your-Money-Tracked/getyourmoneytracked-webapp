<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import type { MonthlySummary } from '@/types'
import PercentBadge from '@/components/common/PercentBadge.vue'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  summary: MonthlySummary
  currency: string
}>()

const router = useRouter()

/** Format "2026-03" → "March 2026" */
const monthLabel = computed(() => {
  const [year, month] = props.summary.month.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})

/** Format "2026-03" → "2026-03" (already ISO YYYY-MM) */
const routeMonth = computed(() => props.summary.month.slice(0, 7))

const formattedIncome = computed(() => formatCurrency(props.summary.totalIncome, props.currency))
const formattedExpenses = computed(() => formatCurrency(props.summary.totalExpenses, props.currency))

function navigate() {
  router.push(`/history/${routeMonth.value}`)
}
</script>

<template>
  <button
    type="button"
    class="relative flex w-full cursor-pointer items-start px-4 py-4 text-left transition-colors duration-150 hover:bg-surface-elevated"
    data-testid="month-summary-row"
    @click="navigate"
  >
    <!-- Main content -->
    <div class="min-w-0 flex-1">
      <!-- Top row: month name + percent badge -->
      <div class="flex items-center justify-between gap-2">
        <span
          class="text-card-title font-semibold text-text-primary"
          data-testid="month-name"
        >
          {{ monthLabel }}
        </span>
        <div class="flex items-center gap-2">
          <PercentBadge :percent="summary.percentSpent" />
          <ChevronRight :size="16" class="shrink-0 text-text-muted" />
        </div>
      </div>

      <!-- Bottom row: income + expenses -->
      <div class="mt-2 flex gap-8">
        <!-- Income -->
        <div>
          <p class="text-badge uppercase tracking-wider text-text-muted">Income</p>
          <p class="mt-0.5 text-body font-medium tabular-nums text-primary" data-testid="income-amount">
            {{ formattedIncome }}
          </p>
        </div>
        <!-- Expenses -->
        <div>
          <p class="text-badge uppercase tracking-wider text-text-muted">Expenses</p>
          <p class="mt-0.5 text-body font-medium tabular-nums text-danger" data-testid="expenses-amount">
            {{ formattedExpenses }}
          </p>
        </div>
      </div>
    </div>
  </button>
</template>
