<script setup lang="ts">
import { computed } from 'vue'
import type { TransactionType } from '@/types'
import { getCurrencySymbol } from '@/utils/currency'

const props = defineProps<{
  amount: string
  currency: string
  transactionType: TransactionType
}>()

const symbol = computed(() => getCurrencySymbol(props.currency))

const numericAmount = computed(() => parseFloat(props.amount) || 0)

const formattedAmount = computed(() => {
  const num = numericAmount.value
  // Format with thousand separators and 2 decimal places
  const parts = num.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${symbol.value}${parts.join('.')}`
})

const amountColorClass = computed(() => {
  if (numericAmount.value === 0) return 'text-text-muted'
  switch (props.transactionType) {
    case 'EXPENSE':
      return 'text-danger'
    case 'INCOME':
      return 'text-primary'
    case 'TRANSFER':
      return 'text-info'
    default:
      return 'text-text-muted'
  }
})
</script>

<template>
  <div class="flex items-center justify-center py-4">
    <span
      class="text-hero-amount font-bold transition-colors duration-150"
      :class="amountColorClass"
      aria-live="polite"
      aria-label="Amount"
    >
      {{ formattedAmount }}
    </span>
  </div>
</template>
