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
</script>

<template>
  <div
    class="mx-4 mb-4 rounded-2xl bg-surface p-5"
    :style="{ boxShadow: 'var(--shadow-card)' }"
    data-testid="recurring-summary-card"
  >
    <!-- Title -->
    <p class="text-caption font-medium uppercase tracking-wider text-text-muted">
      Monthly Recurring
    </p>

    <!-- Metrics row -->
    <div class="mt-3 flex gap-8">
      <!-- Expenses -->
      <div>
        <p class="text-badge font-medium uppercase text-text-muted">Expenses</p>
        <p
          class="text-section-title font-bold tabular-nums text-danger"
          data-testid="monthly-expenses"
        >
          {{ formattedExpenses }}<span class="text-caption font-normal text-text-muted">/mo</span>
        </p>
      </div>

      <!-- Income -->
      <div>
        <p class="text-badge font-medium uppercase text-text-muted">Income</p>
        <p
          class="text-section-title font-bold tabular-nums text-primary"
          data-testid="monthly-income"
        >
          {{ formattedIncome }}<span class="text-caption font-normal text-text-muted">/mo</span>
        </p>
      </div>
    </div>
  </div>
</template>
