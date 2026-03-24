<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { UpcomingBill } from '@/types'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  bill: UpcomingBill
}>()

const router = useRouter()

const isIncome = computed(() => props.bill.type === 'INCOME')

/** Check if the bill is due today */
const isDueToday = computed(() => {
  if (!props.bill.nextDueDate) return false
  const today = new Date()
  const due = new Date(props.bill.nextDueDate + 'T00:00:00')
  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  )
})

const dueDateLabel = computed(() => {
  if (isDueToday.value) return 'Due today!'
  if (!props.bill.nextDueDate) return ''
  const due = new Date(props.bill.nextDueDate + 'T00:00:00')
  return `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
})

const formattedAmount = computed(() =>
  formatCurrency(props.bill.amount, props.bill.currency),
)

function navigate() {
  router.push('/subscriptions')
}
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-surface-muted active:scale-[0.98]"
    :data-testid="`bill-item-${bill.id}`"
    @click="navigate"
  >
    <!-- Left: icon placeholder -->
    <div
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm"
    >
      {{ isIncome ? '💰' : '💳' }}
    </div>

    <!-- Middle: name -->
    <div class="min-w-0 flex-1">
      <p class="text-card-title truncate font-medium text-text-primary">{{ bill.name }}</p>
    </div>

    <!-- Right: amount + due date -->
    <div class="shrink-0 text-right">
      <p
        class="text-body font-medium tabular-nums"
        :class="isIncome ? 'text-primary' : 'text-text-primary'"
        data-testid="bill-amount"
      >
        {{ isIncome ? '+' : '' }}{{ formattedAmount }}
      </p>
      <p
        class="text-caption font-medium"
        :class="isDueToday ? 'text-warning' : 'text-text-muted'"
        data-testid="due-date-label"
      >
        <!-- Pulsing amber dot for "due today" -->
        <span
          v-if="isDueToday"
          class="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-warning align-middle"
          data-testid="due-today-dot"
        />
        {{ dueDateLabel }}
      </p>
    </div>
  </button>
</template>
