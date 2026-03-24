<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  monthlyExpenses: number
  monthlyIncome: number
  currency: string
}>()

const formattedExpenses = computed(() => formatCurrency(props.monthlyExpenses, props.currency))
const formattedIncome = computed(() => formatCurrency(props.monthlyIncome, props.currency))

const netAmount = computed(() => props.monthlyIncome - props.monthlyExpenses)
const formattedNet = computed(() => formatCurrency(Math.abs(netAmount.value), props.currency))
const netColorClass = computed(() => {
  if (netAmount.value > 0) return 'text-primary'
  if (netAmount.value < 0) return 'text-danger'
  return 'text-text-muted'
})
const netPrefix = computed(() => (netAmount.value > 0 ? '+' : netAmount.value < 0 ? '-' : ''))
</script>

<template>
  <div
    class="mb-4 rounded-2xl bg-surface p-5"
    :style="{ boxShadow: 'var(--shadow-card)' }"
    data-testid="recurring-summary-card"
  >
    <!-- Title -->
    <p class="text-caption font-medium uppercase tracking-wider text-text-muted">
      Monthly Recurring
    </p>

    <!-- Three-column metrics -->
    <div class="mt-3 grid grid-cols-3 gap-3 text-center">
      <!-- Expenses -->
      <div>
        <p class="text-badge font-medium uppercase text-text-muted">Expenses</p>
        <p
          class="text-section-title font-bold tabular-nums text-danger"
          data-testid="monthly-expenses"
        >
          {{ formattedExpenses }}
        </p>
        <p class="text-badge text-text-muted">/mo</p>
      </div>

      <!-- Income -->
      <div>
        <p class="text-badge font-medium uppercase text-text-muted">Income</p>
        <p
          class="text-section-title font-bold tabular-nums text-primary"
          data-testid="monthly-income"
        >
          {{ formattedIncome }}
        </p>
        <p class="text-badge text-text-muted">/mo</p>
      </div>

      <!-- Net -->
      <div>
        <p class="text-badge font-medium uppercase text-text-muted">Net</p>
        <p
          class="text-section-title font-bold tabular-nums"
          :class="netColorClass"
          data-testid="monthly-net"
        >
          {{ netPrefix }}{{ formattedNet }}
        </p>
        <p class="text-badge text-text-muted">/mo</p>
      </div>
    </div>
  </div>
</template>
