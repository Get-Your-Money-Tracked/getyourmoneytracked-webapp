<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchDashboard } from '@/graphql/queries/dashboard'
import { useCategoriesStore } from '@/stores/categories'
import { useAccountsStore } from '@/stores/accounts'
import type { Dashboard } from '@/types'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import HeroSection from '@/components/dashboard/HeroSection.vue'
import RecentTransactions from '@/components/dashboard/RecentTransactions.vue'
import UpcomingBills from '@/components/dashboard/UpcomingBills.vue'
import BudgetProgressSection from '@/components/dashboard/BudgetProgressSection.vue'

const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const accountsStore = useAccountsStore()

const dashboard = ref<Dashboard | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

/** Current month as "YYYY-MM" */
const currentMonth = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})

async function loadDashboard() {
  isLoading.value = true
  error.value = null
  try {
    dashboard.value = await fetchDashboard(currentMonth.value)
  } catch (e: unknown) {
    error.value = (e as Error).message ?? 'Failed to load dashboard.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  // Ensure categories/accounts are loaded (needed for transaction display)
  if (categoriesStore.categories.length === 0) {
    categoriesStore.loadCategories().catch((e: unknown) => {
      console.error('Failed to load categories for dashboard:', e)
    })
  }
  if (accountsStore.accounts.length === 0) {
    accountsStore.loadAccounts().catch((e: unknown) => {
      console.error('Failed to load accounts for dashboard:', e)
    })
  }
  await loadDashboard()
})
</script>

<template>
  <div class="pb-24">
    <!-- Header -->
    <DashboardHeader
      :month="currentMonth"
      :display-name="authStore.displayName"
    />

    <!-- Hero section (always rendered; shows skeleton while loading) -->
    <HeroSection
      :total-income="dashboard?.totalIncome ?? 0"
      :total-expenses="dashboard?.totalExpenses ?? 0"
      :remaining-budget="dashboard?.remainingBudget ?? 0"
      :percent-spent="dashboard?.percentSpent ?? 0"
      :currency="authStore.defaultCurrency"
      :is-loading="isLoading"
    />

    <!-- Error state -->
    <div v-if="error" class="mx-4 mt-4 rounded-xl bg-danger/10 p-4 text-center">
      <p class="text-body text-danger">{{ error }}</p>
    </div>

    <!-- Data sections (only after load) -->
    <template v-if="!isLoading && dashboard">
      <RecentTransactions
        :transactions="dashboard.recentTransactions"
        :accounts="accountsStore.accounts"
        :categories="categoriesStore.categories"
      />

      <UpcomingBills :bills="dashboard.upcomingBills" />

      <BudgetProgressSection
        :budgets="dashboard.budgetProgress"
        :currency="authStore.defaultCurrency"
      />
    </template>
  </div>
</template>
