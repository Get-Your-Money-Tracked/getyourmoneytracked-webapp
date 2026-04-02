<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction, Account, Category } from '@/types'
import { groupTransactionsByDate } from '@/utils/dateGrouping'
import TransactionListItem from '@/components/transactions/TransactionListItem.vue'

const props = defineProps<{
  transactions: Transaction[]
  isLoading: boolean
  hasMore: boolean
  accounts: Account[]
  categories: Category[]
}>()

const emit = defineEmits<{
  loadMore: []
  select: [transaction: Transaction]
}>()

const groups = computed(() => groupTransactionsByDate(props.transactions))
</script>

<template>
  <div>
    <!-- Loading skeletons -->
    <template v-if="isLoading && transactions.length === 0">
      <div
        v-for="i in 8"
        :key="i"
        class="flex items-center gap-3 px-4 py-3"
      >
        <div class="flex flex-col items-center gap-1">
          <div class="h-2 w-2 animate-pulse rounded-full bg-surface-muted" />
          <div class="h-8 w-8 animate-pulse rounded-full bg-surface-muted" />
        </div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
          <div class="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
        </div>
        <div class="h-4 w-14 animate-pulse rounded bg-surface-muted" />
      </div>
    </template>

    <!-- Empty state -->
    <div
      v-else-if="!isLoading && transactions.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <p class="text-body text-text-muted">No transactions found.</p>
      <p class="text-caption mt-1 text-text-muted">Try adjusting your filters.</p>
    </div>

    <!-- Grouped list -->
    <template v-else>
      <div v-for="group in groups" :key="group.date">
        <!-- Date header -->
        <div class="px-4 py-2">
          <p class="text-caption font-semibold uppercase text-text-muted">
            {{ group.label }}
          </p>
        </div>

        <!-- Transactions in group -->
        <div
class="divide-y divide-border/30 rounded-xl bg-surface-elevated mx-4 mb-3"
          :style="{ boxShadow: 'var(--shadow-card)' }"
        >
          <TransactionListItem
            v-for="tx in group.transactions"
            :key="tx.id"
            :transaction="tx"
            :accounts="accounts"
            :categories="categories"
            @select="emit('select', $event)"
          />
        </div>
      </div>

      <!-- Load more -->
      <div v-if="hasMore" class="flex justify-center py-4">
        <button
          type="button"
          class="text-body rounded-xl px-6 py-2.5 text-text-secondary transition-colors hover:bg-surface-muted"
          @click="emit('loadMore')"
        >
          Load more
        </button>
      </div>

      <!-- Loading more indicator -->
      <div v-if="isLoading && transactions.length > 0" class="flex justify-center py-4">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    </template>
  </div>
</template>
