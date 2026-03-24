<script setup lang="ts">
import { computed } from 'vue'
import type { MonthlyTrend } from '@/graphql/queries/reports'
import { formatCurrency } from '@/utils/currency'

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  months: MonthlyTrend[]
}>()

// ── Computed ──────────────────────────────────────────────────────────────────

const totalIncome = computed(() =>
  props.months.reduce((sum, m) => sum + m.totalIncome, 0),
)

const totalExpenses = computed(() =>
  props.months.reduce((sum, m) => sum + m.totalExpenses, 0),
)

const net = computed(() => totalIncome.value - totalExpenses.value)

const avgMonthlySpend = computed(() => {
  if (props.months.length === 0) return 0
  return totalExpenses.value / props.months.length
})
</script>

<template>
  <div
    class="mx-4 rounded-xl bg-surface p-4"
    :style="{ boxShadow: 'var(--shadow-card)' }"
    data-testid="trends-summary-cards"
  >
    <!-- Top row: Income / Expenses / Net -->
    <div class="grid grid-cols-3 gap-3 text-center">
      <!-- Income -->
      <div data-testid="summary-income">
        <p class="text-caption text-muted">Income</p>
        <p class="text-card-title tabular-nums font-semibold text-primary">
          +{{ formatCurrency(totalIncome) }}
        </p>
      </div>

      <!-- Expenses -->
      <div data-testid="summary-expenses">
        <p class="text-caption text-muted">Expenses</p>
        <p class="text-card-title tabular-nums font-semibold text-danger">
          -{{ formatCurrency(totalExpenses) }}
        </p>
      </div>

      <!-- Net -->
      <div data-testid="summary-net">
        <p class="text-caption text-muted">Net</p>
        <p
          class="text-card-title tabular-nums font-semibold"
          :class="net >= 0 ? 'text-primary' : 'text-danger'"
        >
          {{ net >= 0 ? '+' : '' }}{{ formatCurrency(net) }}
        </p>
      </div>
    </div>

    <!-- Bottom row: avg monthly spend -->
    <p class="mt-3 text-caption text-secondary text-center" data-testid="summary-avg-spend">
      Avg Monthly Spend: {{ formatCurrency(avgMonthlySpend) }}
    </p>
  </div>
</template>
