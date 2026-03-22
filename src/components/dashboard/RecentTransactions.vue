<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import type { Transaction, Account, Category } from '@/types'
import { getCurrencySymbol } from '@/utils/currency'

const props = defineProps<{
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
}>()

const router = useRouter()

function navigateToAll() {
  router.push('/transactions')
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return 'Today'
  }
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday'
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getAccount(tx: Transaction) {
  return props.accounts.find((a) => a.id === tx.accountId) ?? null
}

function getCategory(tx: Transaction) {
  return tx.categoryId ? (props.categories.find((c) => c.id === tx.categoryId) ?? null) : null
}

function formatAmount(tx: Transaction): string {
  const account = getAccount(tx)
  const sym = getCurrencySymbol(account?.currency ?? 'USD')
  const parts = tx.amount.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formatted = parts.join('.')
  if (tx.type === 'EXPENSE') return `-${sym}${formatted}`
  if (tx.type === 'INCOME') return `+${sym}${formatted}`
  return `${sym}${formatted}`
}

function amountClass(tx: Transaction): string {
  if (tx.type === 'EXPENSE') return 'text-danger'
  if (tx.type === 'INCOME') return 'text-primary'
  return 'text-info'
}

function displayTitle(tx: Transaction): string {
  if (tx.type === 'TRANSFER') return 'Transfer'
  const cat = getCategory(tx)
  return tx.description || cat?.name || '—'
}

function dotColor(tx: Transaction): string {
  const cat = getCategory(tx)
  return cat?.color ?? '#6b7280'
}

function iconBg(tx: Transaction): string {
  const cat = getCategory(tx)
  const color = cat?.color ?? '#6b7280'
  return `${color}1a`
}

function categoryIcon(tx: Transaction): string {
  if (tx.type === 'TRANSFER') return '↔'
  const cat = getCategory(tx)
  return cat?.icon ?? '💰'
}

const hasTransactions = computed(() => props.transactions.length > 0)
</script>

<template>
  <section class="mt-6" data-testid="recent-transactions">
    <!-- Section header -->
    <div class="mb-2 flex items-center justify-between px-4">
      <h2 class="text-card-title font-semibold text-text-primary">Recent Transactions</h2>
      <button
        type="button"
        class="text-caption flex items-center gap-0.5 font-medium text-primary"
        data-testid="see-all-link"
        @click="navigateToAll"
      >
        See all
        <ArrowRight :size="14" />
      </button>
    </div>

    <!-- Card -->
    <div class="mx-4 divide-y divide-border rounded-xl bg-surface shadow-card">
      <!-- Transaction rows -->
      <template v-if="hasTransactions">
        <button
          v-for="tx in transactions"
          :key="tx.id"
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
          :data-testid="`transaction-item-${tx.id}`"
        >
          <!-- Color dot + icon -->
          <div class="flex flex-col items-center gap-1">
            <div
              class="h-1.5 w-1.5 rounded-full"
              :style="{ backgroundColor: dotColor(tx) }"
            />
            <div
              class="flex h-7 w-7 items-center justify-center rounded-full text-sm"
              :style="{ backgroundColor: iconBg(tx) }"
            >
              <span v-if="tx.type === 'TRANSFER'" class="text-xs text-info">↔</span>
              <span v-else>{{ categoryIcon(tx) }}</span>
            </div>
          </div>
          <!-- Text -->
          <div class="min-w-0 flex-1">
            <p class="text-card-title truncate font-medium text-text-primary">
              {{ displayTitle(tx) }}
            </p>
            <p class="text-caption text-text-secondary">{{ formatDate(tx.date) }}</p>
          </div>
          <!-- Amount -->
          <span class="text-body shrink-0 font-medium tabular-nums" :class="amountClass(tx)">
            {{ formatAmount(tx) }}
          </span>
        </button>
      </template>

      <!-- Empty state -->
      <div
        v-else
        class="px-4 py-8 text-center"
        data-testid="empty-state"
      >
        <p class="text-body text-text-muted">No transactions yet this month.</p>
      </div>
    </div>
  </section>
</template>
