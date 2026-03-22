<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft, Plus, Bell, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import type { SubscriptionEntry } from '@/types'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useCategoriesStore } from '@/stores/categories'
import { useAccountsStore } from '@/stores/accounts'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import SubscriptionItem from '@/components/subscriptions/SubscriptionItem.vue'
import RecurringSummaryCard from '@/components/subscriptions/RecurringSummaryCard.vue'
import AddSubscriptionSheet from '@/components/subscriptions/AddSubscriptionSheet.vue'
import EditSubscriptionSheet from '@/components/subscriptions/EditSubscriptionSheet.vue'

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
  toastStore.show('Subscription added', 'success')
}

function openEdit(subscription: SubscriptionEntry) {
  selectedSubscription.value = subscription
  showEditSheet.value = true
}

function onSaved() {
  toastStore.show('Subscription updated', 'success')
}

function onDeleted() {
  toastStore.show('Subscription deleted', 'success')
  selectedSubscription.value = null
}

function closeEdit() {
  showEditSheet.value = false
  selectedSubscription.value = null
}
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Back to Settings -->
    <div class="flex items-center gap-1 px-4 pb-1 pt-4">
      <button
        type="button"
        class="flex items-center gap-1 text-caption font-medium text-text-primary"
        data-testid="back-to-settings-btn"
        @click="router.push('/settings')"
      >
        <ArrowLeft :size="20" aria-hidden="true" />
        Settings
      </button>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between px-4 pb-4 pt-2">
      <h1 class="text-page-title font-bold text-text-primary">Subscriptions</h1>
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

    <!-- Loading skeleton -->
    <div
      v-if="subscriptionsStore.isLoading"
      class="mx-4 overflow-hidden rounded-2xl bg-surface"
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
    <div v-else-if="subscriptionsStore.error" class="px-4 py-3">
      <p class="text-body text-danger" data-testid="error-message">{{ subscriptionsStore.error }}</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="subscriptionsStore.subscriptions.length === 0"
      class="mx-4 rounded-2xl bg-surface-muted p-8 text-center"
      data-testid="empty-state"
    >
      <Bell :size="32" class="mx-auto text-text-muted" aria-hidden="true" />
      <p class="mt-3 text-body font-semibold text-text-primary">No subscriptions yet.</p>
      <p class="mt-1 text-caption text-text-secondary">
        Add your recurring bills and income to see upcoming payments on your Dashboard.
      </p>
      <button
        type="button"
        class="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-medium text-white"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        data-testid="empty-add-btn"
        @click="openAdd"
      >
        <Plus :size="16" aria-hidden="true" />
        Add Subscription
      </button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Recurring summary -->
      <RecurringSummaryCard
        :monthly-expenses="subscriptionsStore.monthlyExpenses"
        :monthly-income="subscriptionsStore.monthlyIncome"
        :currency="authStore.defaultCurrency"
      />

      <!-- Active section -->
      <div v-if="subscriptionsStore.activeSubscriptions.length > 0">
        <div class="mt-2 flex items-center gap-2 px-4 pb-2">
          <h2 class="text-card-title font-semibold text-text-primary" data-testid="active-section-header">
            Active
          </h2>
          <span class="text-caption text-text-muted">({{ subscriptionsStore.activeSubscriptions.length }})</span>
        </div>
        <div
          class="mx-4 overflow-hidden rounded-xl bg-surface"
          :style="{ boxShadow: 'var(--shadow-card)' }"
          data-testid="active-list"
        >
          <div class="divide-y divide-border">
            <SubscriptionItem
              v-for="sub in subscriptionsStore.activeSubscriptions"
              :key="sub.id"
              :subscription="sub"
              :currency="authStore.defaultCurrency"
              @edit="openEdit"
            />
          </div>
        </div>
      </div>

      <!-- Inactive section (collapsible) -->
      <div v-if="subscriptionsStore.inactiveSubscriptions.length > 0" class="mt-4">
        <!-- Inactive section header (tappable) -->
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 pb-2"
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
          <span class="text-caption text-text-muted">({{ subscriptionsStore.inactiveSubscriptions.length }})</span>
        </button>

        <!-- Inactive list (collapsed by default) -->
        <div
          v-if="inactiveExpanded"
          class="mx-4 overflow-hidden rounded-xl bg-surface"
          :style="{ boxShadow: 'var(--shadow-card)' }"
          data-testid="inactive-list"
        >
          <div class="divide-y divide-border">
            <SubscriptionItem
              v-for="sub in subscriptionsStore.inactiveSubscriptions"
              :key="sub.id"
              :subscription="sub"
              :currency="authStore.defaultCurrency"
              @edit="openEdit"
            />
          </div>
        </div>
      </div>
    </template>

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
