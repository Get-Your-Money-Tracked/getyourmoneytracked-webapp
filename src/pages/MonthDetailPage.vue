<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Download, Loader2, Search } from 'lucide-vue-next'
import type { MonthDetail, Transaction, SubscriptionEntry } from '@/types'
import type { TransactionFilter } from '@/graphql/queries/transactions'
import { fetchMonthDetail } from '@/graphql/queries/history'
import { useAuthStore } from '@/stores/auth'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { useToastStore } from '@/stores/toast'
import { formatCurrency } from '@/utils/currency'
import { exportTransactionsCSV } from '@/lib/export'
import PercentBadge from '@/components/common/PercentBadge.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import CategoryPieChart from '@/components/charts/CategoryPieChart.vue'
import MonthBudgetPerformance from '@/components/history/MonthBudgetPerformance.vue'
import TransactionListItem from '@/components/transactions/TransactionListItem.vue'
import TransactionFilters from '@/components/transactions/TransactionFilters.vue'
import EditTransactionSheet from '@/components/transactions/EditTransactionSheet.vue'
import { groupTransactionsByDate } from '@/utils/dateGrouping'

// Extended transaction type with recurring metadata
interface DisplayTransaction extends Transaction {
  _isRecurring: boolean
  _subscription?: SubscriptionEntry
}

// ── Route & stores ────────────────────────────────────────────────────────────

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()
const toastStore = useToastStore()

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

async function loadMonthDetail() {
  isLoading.value = true
  error.value = null
  try {
    detail.value = await fetchMonthDetail(rawMonth)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load month detail.'
  } finally {
    isLoading.value = false
  }
}

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

// ── Merge transactions + subscriptions ─────────────────────────────────────────

/** Map a subscription to a pseudo-transaction for unified display */
function subscriptionToTransaction(sub: SubscriptionEntry, fallbackMonth: string): DisplayTransaction {
  return {
    id: `sub-${sub.id}`,
    type: sub.type,
    amount: sub.amount,
    date: sub.nextDueDate || `${fallbackMonth}-01`,
    accountId: sub.account?.id ?? '',
    toAccountId: null,
    categoryId: sub.category?.id ?? null,
    description: sub.name,
    notes: null,
    tags: [],
    receiptUrl: null,
    createdAt: '',
    updatedAt: '',
    _isRecurring: true,
    _subscription: sub,
  }
}

const filteredTransactions = computed<DisplayTransaction[]>(() => {
  if (!detail.value) return []

  // Regular transactions as DisplayTransaction
  const regularTxs: DisplayTransaction[] = detail.value.transactions.map((t) => ({
    ...t,
    _isRecurring: false,
  }))

  // Subscriptions mapped to pseudo-transactions
  const subTxs: DisplayTransaction[] = (detail.value.subscriptions ?? [])
    .filter((s) => s.isActive)
    .map((s) => subscriptionToTransaction(s, detail.value!.month))

  let combined = [...regularTxs, ...subTxs]

  // type filter
  if (txFilter.value.type) {
    combined = combined.filter((t) => t.type === txFilter.value.type)
  }
  // category filter
  if (txFilter.value.categoryId) {
    combined = combined.filter((t) => t.categoryId === txFilter.value.categoryId)
  }
  // account filter
  if (txFilter.value.accountId) {
    combined = combined.filter((t) => t.accountId === txFilter.value.accountId)
  }
  // search filter
  if (txFilter.value.search) {
    const q = txFilter.value.search.toLowerCase()
    combined = combined.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q),
    )
  }

  // Sort by date DESC
  combined.sort((a, b) => b.date.localeCompare(a.date))
  return combined
})

const groupedTransactions = computed(() => groupTransactionsByDate(filteredTransactions.value))

// ── Edit Transaction Sheet ────────────────────────────────────────────────────

const showEditTransaction = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const isExporting = ref(false)

function monthDateRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()
  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

async function exportMonthExpenses() {
  isExporting.value = true
  try {
    await exportTransactionsCSV({
      ...monthDateRange(rawMonth),
      type: 'EXPENSE',
    })
    toastStore.show('Expenses CSV downloaded', 'success')
  } catch {
    toastStore.show('Expenses export failed', 'error')
  } finally {
    isExporting.value = false
  }
}

function openEditTransaction(tx: Transaction) {
  if ((tx as DisplayTransaction)._isRecurring) return
  editingTransaction.value = tx
  showEditTransaction.value = true
}

function onTransactionSaved() {
  showEditTransaction.value = false
  loadMonthDetail()
}

function onTransactionDeleted() {
  showEditTransaction.value = false
  loadMonthDetail()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!isValidMonth(rawMonth)) return

  isLoading.value = true
  try {
    if (accountsStore.accounts.length === 0) await accountsStore.loadAccounts()
    if (categoriesStore.categories.length === 0) await categoriesStore.loadCategories()
    await loadMonthDetail()
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
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Download expenses CSV"
            data-testid="export-expenses-csv"
            :disabled="isExporting"
            @click="exportMonthExpenses"
          >
            <Loader2 v-if="isExporting" :size="20" class="animate-spin" />
            <Download v-else :size="20" />
          </button>
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
      </div>

      <div class="mx-4 mt-2 overflow-hidden rounded-xl bg-surface shadow-card" data-testid="transactions-section">
        <TransactionFilters
          :model-value="txFilter"
          :accounts="accountsStore.accounts"
          :categories="categoriesStore.categories"
          @update:model-value="onFilterChange"
        />

        <!-- Empty state -->
        <div
          v-if="filteredTransactions.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <p class="text-body text-text-muted">No transactions found.</p>
          <p class="text-caption mt-1 text-text-muted">Try adjusting your filters.</p>
        </div>

        <!-- Grouped list -->
        <template v-else>
          <div v-for="group in groupedTransactions" :key="group.date">
            <div class="px-4 py-2">
              <p class="text-caption font-semibold uppercase text-text-muted">
                {{ group.label }}
              </p>
            </div>

            <div
              class="divide-y divide-border/30 rounded-xl bg-surface-elevated mx-4 mb-3"
              :style="{ boxShadow: 'var(--shadow-card)' }"
            >
              <div v-for="tx in group.transactions" :key="tx.id" class="relative">
                <TransactionListItem
                  :transaction="tx"
                  :accounts="accountsStore.accounts"
                  :categories="categoriesStore.categories"
                  @select="openEditTransaction"
                  @delete="openEditTransaction"
                />
                <!-- Recurring badge -->
                <span
                  v-if="(tx as DisplayTransaction)._isRecurring"
                  class="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-info/10 px-2 py-0.5 text-badge font-medium text-info"
                >
                  🔄 Recurring
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <EditTransactionSheet
      :open="showEditTransaction"
      :transaction="editingTransaction"
      @close="showEditTransaction = false"
      @saved="onTransactionSaved"
      @deleted="onTransactionDeleted"
    />
  </div>
</template>
