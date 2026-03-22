<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import type { Budget } from '@/types'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatCurrency } from '@/utils/currency'
import { BUDGET_THRESHOLD_WARNING, BUDGET_THRESHOLD_EXCEEDED } from '@/utils/constants'

const props = defineProps<{
  budget: Budget
  currency: string
}>()

const emit = defineEmits<{
  edit: [budget: Budget]
}>()

const percentUsed = computed(() => props.budget.percentUsed)

const isExceeded = computed(() => percentUsed.value > BUDGET_THRESHOLD_EXCEEDED)
const isWarning = computed(() => percentUsed.value > BUDGET_THRESHOLD_WARNING && percentUsed.value <= BUDGET_THRESHOLD_EXCEEDED)

const percentColorClass = computed(() => {
  if (isExceeded.value) return 'text-danger'
  if (isWarning.value) return 'text-warning'
  return 'text-primary'
})

const formattedSpent = computed(() => formatCurrency(props.budget.spent, props.currency))
const formattedAmount = computed(() => formatCurrency(props.budget.amount, props.currency))

function handleClick() {
  emit('edit', props.budget)
}
</script>

<template>
  <button
    type="button"
    class="block w-full px-4 py-4 text-left transition-colors duration-150 hover:bg-surface-elevated"
    :data-testid="`budget-card-${budget.id}`"
    @click="handleClick"
  >
    <!-- Top row: icon + name + over badge + chevron -->
    <div class="flex items-center gap-2">
      <span class="text-base" aria-hidden="true">{{ budget.category.icon ?? '💰' }}</span>
      <span class="text-card-title flex-1 font-semibold text-text-primary" data-testid="budget-category-name">
        {{ budget.category.name }}
      </span>
      <span
        v-if="isExceeded"
        class="text-badge rounded-full bg-danger px-1.5 py-0.5 font-bold uppercase text-white"
        data-testid="over-budget-badge"
      >Over!</span>
      <span
        class="text-caption font-medium tabular-nums"
        :class="percentColorClass"
        data-testid="budget-percent"
      >
        {{ Math.round(percentUsed) }}%
      </span>
      <ChevronRight :size="16" class="text-text-muted" aria-hidden="true" />
    </div>

    <!-- Progress bar -->
    <div class="mt-2">
      <ProgressBar :percent="percentUsed" data-testid="budget-progress-bar" />
    </div>

    <!-- Spent / limit -->
    <p class="mt-1.5 text-caption tabular-nums text-text-secondary" data-testid="budget-amounts">
      <span class="font-medium" :class="isExceeded ? 'text-danger' : ''">{{ formattedSpent }}</span>
      <span class="text-text-muted"> / {{ formattedAmount }}</span>
    </p>
  </button>
</template>
