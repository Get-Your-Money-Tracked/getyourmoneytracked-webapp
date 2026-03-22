<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Search } from 'lucide-vue-next'
import type { MonthDetail, Transaction } from '@/types'
import type { TransactionFilter } from '@/graphql/queries/transactions'
import { fetchMonthDetail } from '@/graphql/queries/history'
import { useAuthStore } from '@/stores/auth'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { formatCurrency } from '@/utils/currency'
import PercentBadge from '@/components/common/PercentBadge.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import CategoryPieChart from '@/components/charts/CategoryPieChart.vue'
import MonthBudgetPerformance from '@/components/history/MonthBudgetPerformance.vue'
import TransactionList from '@/components/transactions/TransactionList.vue'
import TransactionFilters from '@/components/transactions/TransactionFilters.vue'

// ── Route & stores ────────────────────────────────────────────────────────────

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()

// ── Month param ───────────────────────────────────────────────────────────────

const rawMonth = (route.params.month as string) ?? ''

/** Validate YYYY-MM format */
function isValidMonth(m: string): boolean {
  return /^\d{4}-\d{2}$/.test(m)
}

if (!isValidMonth(rawMonth)) {
  router.replace('/history')
}

/** "2025-12" → "December 2025" */
function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

const monthLabel = computed(() => formatMonthLabel(rawMonth))

// ── Data fetching ─────────────────────────────────────────────────────────────

const detail = ref<MonthDetail | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// ── Category filter (from pie chart) ─────────────────────────────────────────

const selectedCategoryId = ref<string | null>(null)

function onPieFilter(categoryId: string | null) {
  selectedCategoryId.value = categoryId
  // Sync to transaction filter
  txFilter.value = { ...txFilter.value, categoryId }
}

// ── Transaction filter ────────────────────────────────────────────────────────

const showSearch = ref(false)

const txFilter = ref<TransactionFilter>({
  type: null,
  categoryId: null,
  accountId: null,
  search: null,
  month: rawMonth,
})

function onFilterChange(newFilter: TransactionFilter) {
  txFilter.value = { ...newFilter, month: rawMonth }
  // Sync pie selection if category was cleared externally
  if (!newFilter.categoryId) {
    selectedCategoryId.value = null
  }
}

// ── Filtered transactions ─────────────────────────────────────────────────────

const filteredTransactions = computed<Transaction[]>(() => {
  if (!detail.value) return []
  let txs = detail.value.transactions

  // type filter
  if (txFilter.value.type) {
    txs = txs.filter((t) => t.type === txFilter.value.type)
  }
  // category filter
  if (txFilter.value.categoryId) {
    txs = txs.filter((t) => t.categoryId === txFilter.value.categoryId)
  }
  // account filter
  if (txFilter.value.accountId) {
    txs = txs.filter((t) => t.accountId === txFilter.value.accountId)
  }
  // search filter
  if (txFilter.value.search) {
    const q = txFilter.value.search.toLowerCase()
    txs = txs.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q),
    )
  }
  return txs
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!isValidMonth(rawMonth)) return

  isLoading.value = true
  try {
    if (accountsStore.accounts.length === 0) await accountsStore.loadAccounts()
    if (categoriesStore.categories.length === 0) await categoriesStore.loadCategories()
    detail.value = await fetchMonthDetail(rawMonth)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load month detail.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Back button -->
    <div class="px-2 pt-4">
      <button
        type="button"
        class="-ml-2 flex items-center gap-1 rounded-lg p-2 text-primary transition-colors hover:bg-surface-muted"
        data-testid="back-button"
        @click="router.push('/history')"
      >
        <ArrowLeft :size="24" />
        <span class="text-body font-medium">Back</span>
      </button>
    </div>

    <!-- Page title -->
    <div class="px-4 pb-2">
      <h1 class="text-page-title font-bold text-text-primary" data-testid="page-title">
        {{ monthLabel }} Summary
      </h1>
    </div>

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <div class="animate-pulse mx-4 rounded-2xl bg-surface shadow-card p-5" data-testid="loading-skeleton">
        <div class="flex justify-around gap-6">
          <div v-for="n in 3" :key="n" class="flex flex-col items-center gap-2">
            <div class="h-2.5 w-16 rounded bg-surface-muted" />
            <div class="h-6 w-24 rounded bg-surface-muted" />
          </div>
        </div>
        <div class="mt-4 h-2.5 w-full rounded-full bg-surface-muted" />
      </div>

      <div class="animate-pulse mx-4 mt-6 rounded-xl bg-surface shadow-card p-4" data-testid="chart-skeleton">
        <div class="mx-auto h-48 w-48 rounded-full bg-surface-muted" />
        <div class="mt-4 space-y-3">
          <div v-for="n in 4" :key="n" class="h-8 w-full rounded bg-surface-muted" />
        </div>
      </div>

      <div class="animate-pulse mx-4 mt-6 rounded-xl bg-surface shadow-card p-4">
        <div class="space-y-3">
          <div v-for="n in 5" :key="n" class="h-14 w-full rounded bg-surface-muted" />
        </div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="px-4 py-6 text-center">
      <p class="text-body text-danger" data-testid="error-message">{{ error }}</p>
    </div>

    <!-- Content -->
    <template v-else-if="detail">
      <!-- Summary card -->
      <div
        class="mx-4 rounded-2xl bg-surface p-5 shadow-card"
        data-testid="summary-card"
      >
        <div class="flex justify-around gap-6 text-center">
          <!-- Income -->
          <div>
            <p class="text-badge uppercase tracking-wider text-text-muted">Income</p>
            <p
              class="mt-1 text-section-title font-bold tabular-nums text-primary"
              data-testid="summary-income"
            >
              {{ formatCurrency(detail.totalIncome, authStore.defaultCurrency) }}
            </p>
          </div>
          <!-- Expenses -->
          <div>
            <p class="text-badge uppercase tracking-wider text-text-muted">Expenses</p>
            <p
              class="mt-1 text-section-title font-bold tabular-nums text-danger"
              data-testid="summary-expenses"
            >
              {{ formatCurrency(detail.totalExpenses, authStore.defaultCurrency) }}
            </p>
          </div>
          <!-- % Spent -->
          <div>
            <p class="text-badge uppercase tracking-wider text-text-muted">% Spent</p>
            <div class="mt-1">
              <PercentBadge :percent="detail.percentSpent" />
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mt-4" data-testid="summary-progress-bar">
          <ProgressBar :percent="detail.percentSpent" />
        </div>
      </div>

      <!-- Spending by Category section -->
      <template v-if="detail.categoryBreakdown.length > 0">
        <h2 class="mt-6 px-4 text-card-title font-semibold text-text-primary" data-testid="chart-section-title">
          Spending by Category
        </h2>
        <div class="mx-4 mt-2 rounded-xl bg-surface p-4 shadow-card" data-testid="chart-section">
          <CategoryPieChart
            :categories="detail.categoryBreakdown"
            :currency="authStore.defaultCurrency"
            @filter="onPieFilter"
          />
        </div>
      </template>

      <!-- Budget Performance section -->
      <h2 class="mt-6 px-4 text-card-title font-semibold text-text-primary" data-testid="budget-section-title">
        Budget Performance
      </h2>
      <div
        class="mx-4 mt-2 overflow-hidden rounded-xl bg-surface shadow-card"
        data-testid="budget-section"
      >
        <MonthBudgetPerformance
          :budgets="detail.budgets"
          :currency="authStore.defaultCurrency"
          :month-label="monthLabel"
        />
      </div>

      <!-- Transactions section -->
      <div class="mt-6 flex items-center justify-between px-4" data-testid="transactions-section-header">
        <h2 class="text-card-title font-semibold text-text-primary">Transactions</h2>
        <button
          type="button"
          class="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-muted"
          aria-label="Toggle search"
          data-testid="search-toggle"
          @click="showSearch = !showSearch"
        >
          <Search :size="20" />
        </button>
      </div>

      <div class="mx-4 mt-2 overflow-hidden rounded-xl bg-surface shadow-card" data-testid="transactions-section">
        <TransactionFilters
          :model-value="txFilter"
          :accounts="accountsStore.accounts"
          :categories="categoriesStore.categories"
          @update:model-value="onFilterChange"
        />
        <TransactionList
          :transactions="filteredTransactions"
          :is-loading="false"
          :has-more="false"
          :accounts="accountsStore.accounts"
          :categories="categoriesStore.categories"
        />
      </div>
    </template>
  </div>
</template>
