<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TrendingUp } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { fetchDashboard } from '@/graphql/queries/dashboard'
import { useCategoriesStore } from '@/stores/categories'
import { useAccountsStore } from '@/stores/accounts'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useGoalsStore } from '@/stores/goals'
import { useDashboardRefresh } from '@/composables/useDashboardRefresh'
import { useOverdueRecurring } from '@/composables/useOverdueRecurring'
import { formatCurrency } from '@/utils/currency'
import type { Dashboard, Transaction } from '@/types'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton.vue'
import DashboardError from '@/components/dashboard/DashboardError.vue'
import HeroSection from '@/components/dashboard/HeroSection.vue'
import RecentTransactions from '@/components/dashboard/RecentTransactions.vue'
import UpcomingBills from '@/components/dashboard/UpcomingBills.vue'
import BudgetProgressSection from '@/components/dashboard/BudgetProgressSection.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AddTransactionSheet from '@/components/transactions/AddTransactionSheet.vue'
import EditTransactionSheet from '@/components/transactions/EditTransactionSheet.vue'
import PageTip from '@/components/common/PageTip.vue'
import OverdueBanner from '@/components/dashboard/OverdueBanner.vue'
import GoalsWidget from '@/components/dashboard/GoalsWidget.vue'
import RecentRecurring from '@/components/dashboard/RecentRecurring.vue'
import LogRecurringSheet from '@/components/subscriptions/LogRecurringSheet.vue'

// ── Stores / routing ──────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const categoriesStore = useCategoriesStore()
const accountsStore = useAccountsStore()
const subscriptionsStore = useSubscriptionsStore()
const goalsStore = useGoalsStore()
const { dashboardVersion } = useDashboardRefresh()

// ── Overdue recurring ─────────────────────────────────────────────────────────
const { overdueItems, isVisible: overdueVisible, dismiss: dismissOverdue, logItems } =
  useOverdueRecurring(() => subscriptionsStore.subscriptions)

const showLogRecurringSheet = ref(false)

async function handleLoggedRecurring(count: number, total: number) {
  try {
    // Perform the actual logging via the composable
    await logItems(overdueItems.value)
    // Reload subscriptions so the store reflects updated nextDueDates
    await subscriptionsStore.loadSubscriptions()
    const msg = `Logged ${count} recurring ${count === 1 ? 'transaction' : 'transactions'} (${formatCurrency(total, authStore.defaultCurrency)})`
    toastStore.show(msg, 'success')
    loadDashboard()
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? 'Failed to log recurring transactions.'
    toastStore.show(msg, 'error')
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return today as "YYYY-MM" */
function todayMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Validate that a string is a proper "YYYY-MM" month */
function isValidMonth(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}$/.test(s)
}

// ── Month state ───────────────────────────────────────────────────────────────
const currentRealMonth = ref(todayMonth())

const selectedMonth = ref<string>(
  isValidMonth(route.query.month) ? route.query.month : todayMonth(),
)

const canGoForward = computed(() => selectedMonth.value < currentRealMonth.value)

function prevMonth() {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const d = new Date(y, m - 2, 1) // go back one month
  const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  selectedMonth.value = newMonth
}

function nextMonth() {
  if (!canGoForward.value) return
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const d = new Date(y, m, 1) // go forward one month
  const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  selectedMonth.value = newMonth
}

function resetMonth() {
  selectedMonth.value = currentRealMonth.value
}

// ── Dashboard data state ───────────────────────────────────────────────────────
const dashboard = ref<Dashboard | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Minimum skeleton display duration (ms)
const MIN_SKELETON_MS = 300
let skeletonTimer: ReturnType<typeof setTimeout> | null = null
let loadingStartTime = 0

function startLoading() {
  isLoading.value = true
  error.value = null
  loadingStartTime = Date.now()
}

function finishLoading() {
  const elapsed = Date.now() - loadingStartTime
  const remaining = MIN_SKELETON_MS - elapsed
  if (remaining > 0) {
    if (skeletonTimer) clearTimeout(skeletonTimer)
    skeletonTimer = setTimeout(() => {
      isLoading.value = false
    }, remaining)
  } else {
    isLoading.value = false
  }
}

async function loadDashboard(bypassCache = false) {
  startLoading()
  try {
    // Run all fetches concurrently; partial failures don't block render
    const [dashResult, catResult, accResult, subResult, goalResult] = await Promise.allSettled([
      fetchDashboard(selectedMonth.value, bypassCache),
      categoriesStore.categories.length === 0 ? categoriesStore.loadCategories() : Promise.resolve(),
      accountsStore.accounts.length === 0 ? accountsStore.loadAccounts() : Promise.resolve(),
      subscriptionsStore.subscriptions.length === 0 ? subscriptionsStore.loadSubscriptions() : Promise.resolve(),
      goalsStore.goals.length === 0 ? goalsStore.loadGoals() : Promise.resolve(),
    ])

    if (dashResult.status === 'rejected') {
      const msg = (dashResult.reason as Error)?.message ?? 'Failed to load dashboard.'
      error.value = msg
    } else {
      dashboard.value = dashResult.value
    }

    // Warn if any supporting store failed but dashboard succeeded
    const storesFailed =
      catResult.status === 'rejected' ||
      accResult.status === 'rejected' ||
      subResult.status === 'rejected' ||
      goalResult.status === 'rejected'
    if (storesFailed && dashResult.status === 'fulfilled') {
      toastStore.show("Some data couldn't be loaded.", 'error')
    }
  } finally {
    finishLoading()
  }
}

// ── isEmpty ───────────────────────────────────────────────────────────────────
const isEmpty = computed(
  () =>
    !isLoading.value &&
    !error.value &&
    dashboard.value !== null &&
    dashboard.value.totalIncome === 0 &&
    dashboard.value.totalExpenses === 0 &&
    dashboard.value.recentTransactions.length === 0,
)

// ── Month change → re-fetch + URL update ──────────────────────────────────────
watch(selectedMonth, (month) => {
  router.replace({ query: { ...route.query, month } })
  loadDashboard()
})

// ── Cross-page invalidation — refetch when other pages mutate data ────────────
watch(dashboardVersion, () => {
  loadDashboard(true) // bypass cache to get fresh data from server
})

// ── Pull-to-refresh (touch gesture) ──────────────────────────────────────────
const PULL_THRESHOLD = 80
let touchStartY = 0
let pulling = false
const isPulling = ref(false)
const pullProgress = ref(0)

function onTouchStart(e: TouchEvent) {
  // Only trigger if scrolled to top
  if (window.scrollY > 0) return
  touchStartY = e.touches[0].clientY
  pulling = true
}

function onTouchMove(e: TouchEvent) {
  if (!pulling) return
  const delta = e.touches[0].clientY - touchStartY
  if (delta > 0) {
    pullProgress.value = Math.min(delta / PULL_THRESHOLD, 1)
    isPulling.value = true
  }
}

function onTouchEnd() {
  if (isPulling.value && pullProgress.value >= 1) {
    loadDashboard(true)
  }
  pulling = false
  isPulling.value = false
  pullProgress.value = 0
}

// ── Month change detection (app left open overnight) ─────────────────────────
function checkMonthChange() {
  const newRealMonth = todayMonth()
  if (newRealMonth !== currentRealMonth.value) {
    currentRealMonth.value = newRealMonth
    // If currently viewing the old "current" month, auto-advance
    if (selectedMonth.value < newRealMonth) {
      selectedMonth.value = newRealMonth
    }
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') checkMonthChange()
}

function onWindowFocus() {
  checkMonthChange()
}

// ── Quick Actions / Add Transaction Sheet ─────────────────────────────────────
const showAddTransaction = ref(false)
const prefillTransaction = ref<Transaction | null>(null)

function openAddTransaction() {
  prefillTransaction.value = null
  showAddTransaction.value = true
}

function repeatTransaction(tx: Transaction) {
  prefillTransaction.value = tx
  showAddTransaction.value = true
}

function onTransactionCreated() {
  showAddTransaction.value = false
  loadDashboard()
}

// ── Edit Transaction Sheet ────────────────────────────────────────────────────
const showEditTransaction = ref(false)
const editingTransaction = ref<Transaction | null>(null)

function openEditTransaction(tx: Transaction) {
  editingTransaction.value = tx
  showEditTransaction.value = true
}

function onTransactionSaved() {
  showEditTransaction.value = false
  loadDashboard()
}

function onTransactionDeleted() {
  showEditTransaction.value = false
  loadDashboard()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  loadDashboard()
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', onWindowFocus)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('focus', onWindowFocus)
  if (skeletonTimer) clearTimeout(skeletonTimer)
})
</script>

<template>
  <div
    class="pb-24 md:pb-0"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
  >
    <!-- Pull-to-refresh indicator -->
    <div
      v-if="isPulling"
      class="flex justify-center py-2 transition-all duration-150"
      :style="{ opacity: pullProgress }"
      data-testid="pull-to-refresh-indicator"
    >
      <div
        class="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
        style="border-color: var(--color-primary); border-top-color: transparent"
      />
    </div>

    <!-- Header (always shown) -->
    <DashboardHeader
      :month="selectedMonth"
      :display-name="authStore.displayName"
      :can-go-forward="canGoForward"
      @prev-month="prevMonth"
      @next-month="nextMonth"
      @reset-month="resetMonth"
    />

    <!-- Loading skeleton (replaces entire content) -->
    <DashboardSkeleton v-if="isLoading" />

    <!-- Error state -->
    <template v-else-if="error">
      <DashboardError :message="error" @retry="loadDashboard()" />
    </template>

    <!-- Data sections -->
    <template v-else-if="dashboard">
      <div class="grid grid-cols-1 md:grid-cols-5 md:gap-6">
        <!-- Left column: Hero + Tip + Empty/content -->
        <div class="md:col-span-3">
          <!-- Hero section -->
          <HeroSection
            :total-income="dashboard.totalIncome"
            :total-expenses="dashboard.totalExpenses"
            :recurring-income="dashboard.recurringIncome"
            :recurring-expenses="dashboard.recurringExpenses"
            :remaining-budget="dashboard.remainingBudget"
            :percent-spent="dashboard.percentSpent"
            :currency="authStore.defaultCurrency"
            :is-loading="false"
          />

          <!-- Page tip (new users only, dismissible) -->
          <PageTip page-key="dashboard" />

          <!-- Empty state: no data this month -->
          <EmptyState
            v-if="isEmpty"
            :icon="TrendingUp"
            title="Start tracking"
            description="Log your first transaction to see your spending summary here."
            action-label="Log a transaction"
            data-testid="dashboard-empty-state"
            @action="openAddTransaction()"
          />
        </div>

        <!-- Right column: Recent Transactions + Upcoming Bills + Budget Progress -->
        <div v-if="!isEmpty" class="md:col-span-2">
          <!-- Overdue recurring banner -->
          <OverdueBanner
            v-if="overdueVisible"
            :items="overdueItems"
            :currency="authStore.defaultCurrency"
            data-testid="overdue-banner-wrapper"
            @dismiss="dismissOverdue"
            @review="showLogRecurringSheet = true"
          />

          <!-- Recent Transactions -->
          <RecentTransactions
            :transactions="dashboard.recentTransactions"
            :accounts="accountsStore.accounts"
            :categories="categoriesStore.categories"
            @edit="openEditTransaction"
            @repeat="repeatTransaction"
          />

          <!-- Upcoming Bills -->
          <UpcomingBills :bills="dashboard.upcomingBills" />

          <!-- Recent Recurring -->
          <RecentRecurring
            :subscriptions="dashboard.recentSubscriptions"
            :currency="authStore.defaultCurrency"
          />

          <!-- Budget Progress -->
          <BudgetProgressSection
            :budgets="dashboard.budgetProgress"
            :currency="authStore.defaultCurrency"
          />

          <!-- Goals Widget -->
          <GoalsWidget
            :goals="goalsStore.goals"
            :currency="authStore.defaultCurrency"
          />
        </div>
      </div>
    </template>

    <!-- Add Transaction Sheet -->
    <AddTransactionSheet
      :open="showAddTransaction"
      :prefill="prefillTransaction"
      @close="showAddTransaction = false"
      @created="onTransactionCreated"
    />

    <!-- Edit Transaction Sheet -->
    <EditTransactionSheet
      :open="showEditTransaction"
      :transaction="editingTransaction"
      @close="showEditTransaction = false"
      @saved="onTransactionSaved"
      @deleted="onTransactionDeleted"
    />

    <!-- Log Recurring Sheet -->
    <LogRecurringSheet
      :open="showLogRecurringSheet"
      :items="overdueItems"
      :currency="authStore.defaultCurrency"
      @close="showLogRecurringSheet = false"
      @logged="handleLoggedRecurring"
    />
  </div>
</template>
