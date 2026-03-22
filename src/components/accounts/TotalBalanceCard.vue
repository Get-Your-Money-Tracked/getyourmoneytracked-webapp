<script setup lang="ts">
import { formatCurrency, isNegativeBalance } from '@/utils/currency'
import { computed } from 'vue'

const props = defineProps<{
  totalBalance: number
  accountCount: number
  currency: string
  loading?: boolean
}>()

const formattedTotal = computed(() => formatCurrency(props.totalBalance, props.currency))
const isNegative = computed(() => isNegativeBalance(props.totalBalance))

const accountLabel = computed(() =>
  props.accountCount === 1 ? 'across 1 account' : `across ${props.accountCount} accounts`,
)
</script>

<template>
  <!-- Loading skeleton -->
  <div
    v-if="loading"
    class="rounded-2xl bg-surface p-5"
    :style="{ boxShadow: 'var(--shadow-card)' }"
    aria-busy="true"
    aria-label="Loading total balance"
  >
    <div class="mb-2 h-3.5 w-28 animate-pulse rounded bg-surface-muted" />
    <div class="mb-1.5 h-8 w-36 animate-pulse rounded bg-surface-muted" />
    <div class="h-3 w-24 animate-pulse rounded bg-surface-muted" />
  </div>

  <!-- Total balance card (negative: plain surface) -->
  <div
    v-else
    class="rounded-2xl p-5"
    :style="{
      boxShadow: 'var(--shadow-card)',
      background: isNegative
        ? 'var(--color-surface)'
        : 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, white) 0%, var(--color-surface) 100%)',
    }"
    :class="{ 'dark:!bg-none': !isNegative }"
  >
    <p class="text-caption mb-1 font-medium uppercase tracking-wide text-text-secondary">
      Total Balance
    </p>
    <p
      class="font-bold tabular-nums"
      :class="[isNegative ? 'text-danger' : 'text-text-primary']"
      style="font-size: 1.75rem; line-height: 1.2"
    >
      {{ formattedTotal }}
    </p>
    <p class="text-caption mt-1 text-text-secondary">{{ accountLabel }}</p>
  </div>
</template>
