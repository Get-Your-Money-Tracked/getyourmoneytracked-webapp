<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Plus, Bell, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import type { SubscriptionEntry } from '@/types'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useCategoriesStore } from '@/stores/categories'
import { useAccountsStore } from '@/stores/accounts'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { invalidateDashboard } from '@/composables/useDashboardRefresh'
import SubscriptionItem from '@/components/subscriptions/SubscriptionItem.vue'
import RecurringSummaryCard from '@/components/subscriptions/RecurringSummaryCard.vue'
import AddSubscriptionSheet from '@/components/subscriptions/AddSubscriptionSheet.vue'
import EditSubscriptionSheet from '@/components/subscriptions/EditSubscriptionSheet.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageTip from '@/components/common/PageTip.vue'

const router = useRouter()
const subscriptionsStore = useSubscriptionsStore()
const categoriesStore = useCategoriesStore()
const accountsStore = useAccountsStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const showAddSheet = ref(false)
const selectedSubscription = ref<SubscriptionEntry | null>(null)
const showEditSheet = ref(false)
const inactiveExpanded = ref(false)

// ── Tab switcher (Expenses / Income) ─────────────────────────
const activeTab = ref<'EXPENSE' | 'INCOME'>('EXPENSE')

const activeByTab = computed(() =>
  subscriptionsStore.activeSubscriptions.filter((s) => s.type === activeTab.value),
)

const inactiveByTab = computed(() =>
  subscriptionsStore.inactiveSubscriptions.filter((s) => s.type === activeTab.value),
)

onMounted(async () => {
  await Promise.all([
    subscriptionsStore.loadSubscriptions(),
    categoriesStore.categories.length === 0 ? categoriesStore.loadCategories() : Promise.resolve(),
    accountsStore.accounts.length === 0 ? accountsStore.loadAccounts() : Promise.resolve(),
  ])
})

function openAdd() {
  showAddSheet.value = true
}

function onCreated() {
  toastStore.show('Recurring item added', 'success')
  invalidateDashboard()
}

function openEdit(subscription: SubscriptionEntry) {
  selectedSubscription.value = subscription
  showEditSheet.value = true
}

function onSaved() {
  toastStore.show('Recurring item updated', 'success')
  invalidateDashboard()
}

function onDeleted() {
  selectedSubscription.value = null
  invalidateDashboard()
}

function closeEdit() {
  showEditSheet.value = false
  selectedSubscription.value = null
}
</script>

<template>
  <div class="min-h-screen pb-24 md:pb-0">
    <div class="mx-auto max-w-md md:max-w-4xl px-4">
    <!-- Back navigation -->
    <div class="flex items-center gap-1 pb-1 pt-4">
      <button
        type="button"
        class="flex items-center gap-1 text-caption font-medium text-text-primary"
        data-testid="back-btn"
        @click="router.back()"
      >
        <ArrowLeft :size="20" aria-hidden="true" />
        Back
      </button>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between pb-4 pt-2">
      <h1 class="text-page-title font-bold text-text-primary" data-testid="page-title">Recurring</h1>
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-xl px-4 text-caption font-medium text-white transition-colors duration-150 hover:opacity-90"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        data-testid="add-subscription-btn"
        @click="openAdd"
      >
        <Plus :size="16" aria-hidden="true" />
        Add
      </button>
    </div>

    <!-- Page tip (new users only, dismissible) -->
    <PageTip page-key="subscriptions" />

    <!-- Loading skeleton -->
    <div
      v-if="subscriptionsStore.isLoading"
      class="overflow-hidden rounded-2xl bg-surface"
      :style="{ boxShadow: 'var(--shadow-card)' }"
      data-testid="loading-skeleton"
    >
      <div class="divide-y divide-border">
        <div v-for="n in 3" :key="n" class="animate-pulse px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-full bg-surface-muted" />
            <div class="flex-1">
              <div class="h-4 w-32 rounded bg-surface-muted" />
              <div class="mt-1.5 h-3 w-24 rounded bg-surface-muted" />
            </div>
            <div class="h-4 w-16 rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="subscriptionsStore.error" class="py-3">
      <p class="text-body text-danger" data-testid="error-message">{{ subscriptionsStore.error }}</p>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="subscriptionsStore.subscriptions.length === 0"
      :icon="Bell"
      title="No subscriptions yet."
      description="Track recurring payments like Netflix, Spotify, or your gym. We'll show you upcoming bills."
      action-label="Add Recurring"
      action-test-id="empty-add-btn"
      @action="openAdd"
    />

    <!-- Content -->
    <template v-else>
      <!-- Recurring summary -->
      <RecurringSummaryCard
        :monthly-expenses="subscriptionsStore.monthlyExpenses"
        :monthly-income="subscriptionsStore.monthlyIncome"
        :currency="authStore.defaultCurrency"
      />

      <!-- Expense / Income tab switcher -->
      <div class="mb-4 flex rounded-lg bg-surface-muted p-1" data-testid="tab-switcher">
        <button
          type="button"
          class="flex-1 rounded-md py-2 text-center text-caption font-medium transition-all duration-150"
          :class="activeTab === 'EXPENSE'
            ? 'bg-surface text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'"
          data-testid="tab-expense"
          @click="activeTab = 'EXPENSE'; inactiveExpanded = false"
        >
          Expenses
        </button>
        <button
          type="button"
          class="flex-1 rounded-md py-2 text-center text-caption font-medium transition-all duration-150"
          :class="activeTab === 'INCOME'
            ? 'bg-surface text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'"
          data-testid="tab-income"
          @click="activeTab = 'INCOME'; inactiveExpanded = false"
        >
          Income
        </button>
      </div>

      <!-- Active section -->
      <div v-if="activeByTab.length > 0">
        <div class="mt-2 flex items-center gap-2 pb-2">
          <h2 class="text-card-title font-semibold text-text-primary" data-testid="active-section-header">
            Active
          </h2>
          <span class="text-caption text-text-muted">({{ activeByTab.length }})</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="active-list">
          <div
            v-for="sub in activeByTab"
            :key="sub.id"
            class="overflow-hidden rounded-xl bg-surface"
            :style="{ boxShadow: 'var(--shadow-card)' }"
          >
            <SubscriptionItem
              :subscription="sub"
              :currency="authStore.defaultCurrency"
              @edit="openEdit"
            />
          </div>
        </div>
      </div>

      <!-- No items for this tab -->
      <div
        v-else-if="activeByTab.length === 0 && inactiveByTab.length === 0"
        class="py-8 text-center text-body text-text-muted"
        data-testid="tab-empty-state"
      >
        No {{ activeTab === 'EXPENSE' ? 'expense' : 'income' }} items yet.
      </div>

      <!-- Inactive section (collapsible) -->
      <div v-if="inactiveByTab.length > 0" class="mt-4">
        <!-- Inactive section header (tappable) -->
        <button
          type="button"
          class="flex w-full items-center gap-2 pb-2"
          data-testid="inactive-section-header"
          @click="inactiveExpanded = !inactiveExpanded"
        >
          <component
            :is="inactiveExpanded ? ChevronDown : ChevronRight"
            :size="14"
            class="text-text-muted transition-transform duration-200"
            aria-hidden="true"
          />
          <h2 class="text-card-title font-semibold text-text-primary">Inactive</h2>
          <span class="text-caption text-text-muted">({{ inactiveByTab.length }})</span>
        </button>

        <!-- Inactive list (collapsed by default) -->
        <div
          v-if="inactiveExpanded"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
          data-testid="inactive-list"
        >
          <div
            v-for="sub in inactiveByTab"
            :key="sub.id"
            class="overflow-hidden rounded-xl bg-surface"
            :style="{ boxShadow: 'var(--shadow-card)' }"
          >
            <SubscriptionItem
              :subscription="sub"
              :currency="authStore.defaultCurrency"
              @edit="openEdit"
            />
          </div>
        </div>
      </div>
    </template>

    </div>

    <!-- Add Subscription Sheet -->
    <AddSubscriptionSheet
      :open="showAddSheet"
      :categories="categoriesStore.categories"
      :accounts="accountsStore.accounts"
      :currency="authStore.defaultCurrency"
      @close="showAddSheet = false"
      @created="onCreated"
    />

    <!-- Edit Subscription Sheet -->
    <EditSubscriptionSheet
      :open="showEditSheet"
      :subscription="selectedSubscription"
      :categories="categoriesStore.categories"
      :accounts="accountsStore.accounts"
      :currency="authStore.defaultCurrency"
      @close="closeEdit"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </div>
</template>
