<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Target } from 'lucide-vue-next'
import type { Budget } from '@/types'
import { useBudgetsStore } from '@/stores/budgets'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import BudgetCard from '@/components/budgets/BudgetCard.vue'
import BudgetSummaryCard from '@/components/budgets/BudgetSummaryCard.vue'
import CreateBudgetSheet from '@/components/budgets/CreateBudgetSheet.vue'
import EditBudgetSheet from '@/components/budgets/EditBudgetSheet.vue'

const budgetsStore = useBudgetsStore()
const categoriesStore = useCategoriesStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const showCreateSheet = ref(false)
const selectedBudget = ref<Budget | null>(null)
const showEditSheet = ref(false)

onMounted(async () => {
  await Promise.all([
    budgetsStore.loadBudgets(),
    categoriesStore.categories.length === 0 ? categoriesStore.loadCategories() : Promise.resolve(),
  ])
})

function openCreate() {
  showCreateSheet.value = true
}

function onCreated() {
  toastStore.show('Budget created', 'success')
}

function openEdit(budget: Budget) {
  selectedBudget.value = budget
  showEditSheet.value = true
}

function onSaved() {
  toastStore.show('Budget updated', 'success')
}

function onDeleted() {
  toastStore.show('Budget deleted', 'success')
  selectedBudget.value = null
}

function closeEdit() {
  showEditSheet.value = false
  selectedBudget.value = null
}
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pb-4 pt-6">
      <h1 class="text-page-title font-bold text-text-primary">Budgets</h1>
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-xl px-4 text-caption font-medium text-white transition-colors duration-150 hover:opacity-90"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        data-testid="create-budget-btn"
        @click="openCreate"
      >
        <Plus :size="16" aria-hidden="true" />
        Create
      </button>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="budgetsStore.isLoading"
      class="mx-4 overflow-hidden rounded-2xl bg-surface"
      :style="{ boxShadow: 'var(--shadow-card)' }"
      data-testid="loading-skeleton"
    >
      <div class="divide-y divide-border">
        <div v-for="n in 3" :key="n" class="animate-pulse px-4 py-4">
          <div class="flex items-center gap-2">
            <div class="h-5 w-5 rounded-full bg-surface-muted" />
            <div class="h-4 w-32 rounded bg-surface-muted" />
            <div class="ml-auto h-5 w-10 rounded-full bg-surface-muted" />
          </div>
          <div class="mt-2 h-2.5 w-full rounded-full bg-surface-muted" />
          <div class="mt-1.5 h-3 w-24 rounded bg-surface-muted" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="budgetsStore.error" class="px-4 py-3">
      <p class="text-body text-danger" data-testid="error-message">{{ budgetsStore.error }}</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="budgetsStore.budgets.length === 0"
      class="mx-4 rounded-2xl bg-surface-muted p-8 text-center"
      data-testid="empty-state"
    >
      <Target :size="32" class="mx-auto text-text-muted" aria-hidden="true" />
      <p class="mt-3 text-body font-semibold text-text-primary">No budgets set for this month.</p>
      <p class="mt-1 text-caption text-text-secondary">Create one to start tracking your spending.</p>
      <button
        type="button"
        class="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-medium text-white"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        data-testid="empty-create-btn"
        @click="openCreate"
      >
        <Plus :size="16" aria-hidden="true" />
        Create Budget
      </button>
    </div>

    <!-- Budget list -->
    <template v-else>
      <!-- Summary card -->
      <BudgetSummaryCard
        :total-budgeted="budgetsStore.totalBudgeted"
        :total-spent="budgetsStore.totalSpent"
        :currency="authStore.defaultCurrency"
      />

      <!-- Budget cards -->
      <div
        class="mx-4 overflow-hidden rounded-xl bg-surface"
        :style="{ boxShadow: 'var(--shadow-card)' }"
        data-testid="budget-list"
      >
        <div class="divide-y divide-border">
          <BudgetCard
            v-for="budget in budgetsStore.sortedBudgets"
            :key="budget.id"
            :budget="budget"
            :currency="authStore.defaultCurrency"
            @edit="openEdit"
          />
        </div>
      </div>
    </template>

    <!-- Create Budget Sheet -->
    <CreateBudgetSheet
      :open="showCreateSheet"
      :categories="categoriesStore.categories"
      :currency="authStore.defaultCurrency"
      @close="showCreateSheet = false"
      @created="onCreated"
    />

    <!-- Edit Budget Sheet -->
    <EditBudgetSheet
      :open="showEditSheet"
      :budget="selectedBudget"
      :currency="authStore.defaultCurrency"
      @close="closeEdit"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </div>
</template>
