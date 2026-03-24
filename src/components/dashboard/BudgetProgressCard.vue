<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { BudgetProgress } from '@/types'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  budget: BudgetProgress
  currency: string
}>()

const router = useRouter()

const percentageColorClass = computed(() => {
  if (props.budget.status === 'EXCEEDED') return 'text-danger'
  if (props.budget.status === 'WARNING') return 'text-warning'
  return 'text-primary'
})

const formattedSpent = computed(() => formatCurrency(props.budget.spent, props.currency))
const formattedLimit = computed(() => formatCurrency(props.budget.limit, props.currency))

function navigate() {
  router.push('/budgets')
}
</script>

<template>
  <button
    type="button"
    class="block w-full px-4 py-3 text-left transition-all duration-150 hover:bg-surface-muted active:scale-[0.98]"
    :data-testid="`budget-card-${budget.categoryId}`"
    @click="navigate"
  >
    <!-- Top row: icon + name + percentage + "Over!" badge -->
    <div class="flex items-center gap-2">
      <span class="text-base" aria-hidden="true">{{ budget.categoryIcon ?? '💰' }}</span>
      <span class="text-card-title flex-1 font-medium text-text-primary">
        {{ budget.categoryName }}
      </span>
      <span
        class="text-caption font-medium tabular-nums"
        :class="percentageColorClass"
        data-testid="budget-percentage"
      >
        {{ Math.round(budget.percentUsed) }}%
      </span>
      <span
        v-if="budget.status === 'EXCEEDED'"
        class="text-badge rounded-full bg-danger px-1.5 py-0.5 font-bold uppercase text-white"
        data-testid="over-badge"
      >
        Over!
      </span>
    </div>

    <!-- Progress bar -->
    <div class="mt-1.5">
      <ProgressBar :percent="budget.percentUsed" />
    </div>

    <!-- Bottom row: spent / limit -->
    <p class="mt-1 text-caption tabular-nums text-text-secondary" data-testid="budget-amounts">
      <span class="font-medium">{{ formattedSpent }}</span>
      <span class="text-text-muted"> / {{ formattedLimit }}</span>
    </p>
  </button>
</template>
