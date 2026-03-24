<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction, Account, Category } from '@/types'
import { getCurrencySymbol } from '@/utils/currency'

const props = defineProps<{
  transaction: Transaction
  accounts: Account[]
  categories: Category[]
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
}>()

const account = computed(() =>
  props.accounts.find((a) => a.id === props.transaction.accountId) ?? null,
)

const toAccount = computed(() =>
  props.transaction.toAccountId
    ? (props.accounts.find((a) => a.id === props.transaction.toAccountId) ?? null)
    : null,
)

const category = computed(() =>
  props.transaction.categoryId
    ? (props.categories.find((c) => c.id === props.transaction.categoryId) ?? null)
    : null,
)

const isTransfer = computed(() => props.transaction.type === 'TRANSFER')
const isIncome = computed(() => props.transaction.type === 'INCOME')
const isExpense = computed(() => props.transaction.type === 'EXPENSE')

const displayTitle = computed(() => {
  if (isTransfer.value) return 'Transfer'
  return props.transaction.description || category.value?.name || '—'
})

const subLine = computed(() => {
  if (isTransfer.value) {
    const from = account.value?.name ?? '?'
    const to = toAccount.value?.name ?? '?'
    return `${from} → ${to}`
  }
  const parts: string[] = []
  if (category.value) parts.push(category.value.name)
  if (account.value) parts.push(account.value.name)
  return parts.join(' · ')
})

const formattedAmount = computed(() => {
  const amount = props.transaction.amount
  const parts = amount.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formatted = parts.join('.')
  const sym = getCurrencySymbol(account.value?.currency ?? 'USD')
  if (isExpense.value) return `-${sym}${formatted}`
  if (isIncome.value) return `+${sym}${formatted}`
  return `${sym}${formatted}`
})

const amountColorClass = computed(() => {
  if (isExpense.value) return 'text-danger'
  if (isIncome.value) return 'text-primary'
  return 'text-info'
})

const dotColor = computed(() => category.value?.color ?? '#6b7280')

const iconBgColor = computed(() => {
  const color = category.value?.color ?? '#6b7280'
  return `${color}1a` // 10% opacity
})

const categoryIcon = computed(() => category.value?.icon ?? '💰')

const visibleTags = computed(() => props.transaction.tags.slice(0, 3))
const extraTagCount = computed(() =>
  Math.max(0, props.transaction.tags.length - 3),
)
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-surface-muted active:bg-surface-muted active:scale-[0.98]"
    @click="emit('select', transaction)"
  >
    <!-- Left: color dot + icon -->
    <div class="flex flex-col items-center gap-1">
      <div
        class="h-2 w-2 rounded-full"
        :style="{ backgroundColor: dotColor }"
      />
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full text-base"
        :style="{ backgroundColor: iconBgColor }"
      >
        <template v-if="isTransfer">
          <span class="text-xs text-info">↔</span>
        </template>
        <template v-else>
          {{ categoryIcon }}
        </template>
      </div>
    </div>

    <!-- Middle: title + sub-line + tags -->
    <div class="min-w-0 flex-1">
      <p class="text-card-title truncate font-medium text-text-primary">
        {{ displayTitle }}
      </p>
      <p class="text-caption truncate text-text-secondary">{{ subLine }}</p>
      <!-- Tag chips -->
      <div v-if="transaction.tags.length > 0" class="mt-1 flex flex-wrap gap-1">
        <span
          v-for="tag in visibleTags"
          :key="tag"
          class="text-badge rounded-full bg-surface-muted px-2 py-0.5 text-text-muted"
        >
          {{ tag }}
        </span>
        <span
          v-if="extraTagCount > 0"
          class="text-badge rounded-full bg-surface-muted px-2 py-0.5 text-text-muted"
        >
          +{{ extraTagCount }} more
        </span>
      </div>
    </div>

    <!-- Right: amount -->
    <div class="shrink-0 text-right">
      <span class="text-body font-medium" :class="amountColorClass">
        {{ formattedAmount }}
      </span>
    </div>
  </button>
</template>
