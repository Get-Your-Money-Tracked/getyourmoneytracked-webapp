<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Target } from 'lucide-vue-next'
import type { BudgetProgress } from '@/types'
import BudgetProgressCard from '@/components/dashboard/BudgetProgressCard.vue'

const props = defineProps<{
  budgets: BudgetProgress[]
  currency: string
}>()

const router = useRouter()

/** Top 3 budgets sorted by percentUsed DESC */
const topBudgets = computed(() =>
  [...props.budgets].sort((a, b) => b.percentUsed - a.percentUsed).slice(0, 3),
)

const hasBudgets = computed(() => props.budgets.length > 0)

function navigateToAll() {
  router.push('/budgets')
}
</script>

<template>
  <section class="mt-6" data-testid="budget-progress-section">
    <!-- Section header -->
    <div class="mb-2 flex items-center justify-between px-4">
      <h2 class="text-card-title font-semibold text-text-primary">Budget Tracking</h2>
      <button
        v-if="hasBudgets"
        type="button"
        class="text-caption flex items-center gap-0.5 font-medium text-primary"
        data-testid="view-all-link"
        @click="navigateToAll"
      >
        View all
        <ArrowRight :size="14" />
      </button>
    </div>

    <!-- Budget cards -->
    <div
      v-if="hasBudgets"
      class="mx-4 divide-y divide-border rounded-xl bg-surface shadow-card"
    >
      <BudgetProgressCard
        v-for="budget in topBudgets"
        :key="budget.budgetId"
        :budget="budget"
        :currency="currency"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="mx-4 rounded-xl bg-surface-muted p-4 text-center"
      data-testid="budget-empty-state"
    >
      <Target class="mx-auto text-text-muted" :size="24" />
      <p class="mt-2 text-body text-text-secondary">No budgets set.</p>
      <p class="text-caption text-text-muted">Create one to track your spending.</p>
      <button
        type="button"
        class="mt-2 text-caption font-medium text-primary"
        data-testid="create-budget-link"
        @click="navigateToAll"
      >
        Create budget →
      </button>
    </div>
  </section>
</template>
