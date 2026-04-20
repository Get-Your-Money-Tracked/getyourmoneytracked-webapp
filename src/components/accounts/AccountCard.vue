<script setup lang="ts">
import type { Account } from '@/types'
import { formatCurrency, isNegativeBalance } from '@/utils/currency'
import { computed } from 'vue'

const props = defineProps<{
  account: Account
  loading?: boolean
}>()

const emit = defineEmits<{
  click: [account: Account]
}>()

const typeLabel = computed(() => {
  switch (props.account.type) {
    case 'CASH':
      return 'Cash'
    case 'BANK':
      return 'Bank Account'
    case 'CREDIT_CARD':
      return 'Credit Card'
    default:
      return props.account.type
  }
})

const formattedBalance = computed(() =>
  formatCurrency(props.account.balance, props.account.currency),
)

const isNegative = computed(() => isNegativeBalance(props.account.balance))

const displayIcon = computed(() => {
  if (props.account.icon) return props.account.icon
  switch (props.account.type) {
    case 'CASH':
      return '💵'
    case 'BANK':
      return '🏦'
    case 'CREDIT_CARD':
      return '💳'
    default:
      return '💰'
  }
})

function handleClick() {
  emit('click', props.account)
}
</script>

<template>
  <!-- Loading skeleton -->
  <div
    v-if="loading"
    class="flex items-center gap-3 rounded-xl bg-surface p-4"
    :style="{ boxShadow: 'var(--shadow-card)' }"
    aria-busy="true"
    aria-label="Loading account"
  >
    <!-- Icon skeleton -->
    <div class="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-surface-muted" />
    <!-- Text skeletons -->
    <div class="flex flex-1 flex-col gap-1.5">
      <div class="h-3.5 w-28 animate-pulse rounded bg-surface-muted" />
      <div class="h-3 w-20 animate-pulse rounded bg-surface-muted" />
    </div>
    <!-- Balance skeleton -->
    <div class="h-4 w-20 animate-pulse rounded bg-surface-muted" />
  </div>

  <!-- Account card -->
  <button
    v-else
    type="button"
    class="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all duration-150 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-surface-muted active:scale-[0.98]"
    :style="{ boxShadow: 'var(--shadow-card)' }"
    :aria-label="`${account.name} - ${typeLabel} - ${formattedBalance}`"
    @click="handleClick"
  >
    <!-- Icon -->
    <div
      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-muted text-xl"
      aria-hidden="true"
    >
      {{ displayIcon }}
    </div>

    <!-- Name + type -->
    <div class="flex flex-1 flex-col gap-0.5 overflow-hidden">
      <div class="flex items-center gap-1.5">
        <span class="text-card-title truncate font-medium text-text-primary">
          {{ account.name }}
        </span>
        <!-- Default badge -->
        <span
          v-if="account.isDefault"
          class="text-badge flex-shrink-0 rounded-full px-1.5 py-0.5 font-medium"
          :style="{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
            color: 'var(--color-primary)',
          }"
        >
          Default
        </span>
      </div>
      <span class="text-caption text-text-secondary">{{ typeLabel }}</span>
    </div>

    <!-- Balance -->
    <span
      class="text-card-title flex-shrink-0 font-semibold tabular-nums"
      :class="isNegative ? 'text-danger' : 'text-primary'"
    >
      {{ formattedBalance }}
    </span>
  </button>
</template>
