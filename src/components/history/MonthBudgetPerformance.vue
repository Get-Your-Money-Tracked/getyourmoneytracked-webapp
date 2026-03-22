<script setup lang="ts">
import type { BudgetProgress } from '@/types'
import BudgetProgressCard from '@/components/dashboard/BudgetProgressCard.vue'

const props = defineProps<{
  budgets: BudgetProgress[]
  currency: string
  monthLabel: string
}>()
</script>

<template>
  <div data-testid="month-budget-performance">
    <!-- Budgets list — shows ALL budgets (not just top 3) -->
    <div
      v-if="budgets.length > 0"
      class="divide-y divide-border"
      data-testid="budget-list"
    >
      <BudgetProgressCard
        v-for="budget in budgets"
        :key="budget.budgetId"
        :budget="budget"
        :currency="currency"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="py-6 text-center"
      data-testid="budget-empty-state"
    >
      <p class="text-body text-text-muted">
        No budgets were set for {{ monthLabel }}.
      </p>
    </div>
  </div>
</template>
