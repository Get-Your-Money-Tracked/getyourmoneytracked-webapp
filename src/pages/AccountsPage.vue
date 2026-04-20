<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Wallet } from 'lucide-vue-next'
import { useAccountsStore } from '@/stores/accounts'
import { useAuthStore } from '@/stores/auth'
import { invalidateDashboard } from '@/composables/useDashboardRefresh'
import AccountCard from '@/components/accounts/AccountCard.vue'
import TotalBalanceCard from '@/components/accounts/TotalBalanceCard.vue'
import AddAccountSheet from '@/components/accounts/AddAccountSheet.vue'
import EditAccountSheet from '@/components/accounts/EditAccountSheet.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Account } from '@/types'
import PageTip from '@/components/common/PageTip.vue'
import { useFabAction } from '@/composables/useFabAction'

const accountsStore = useAccountsStore()
const authStore = useAuthStore()

// ── Sheet state ───────────────────────────────────────────────
const showAddSheet = ref(false)
const showEditSheet = ref(false)
const selectedAccount = ref<Account | null>(null)

// ── Computed ──────────────────────────────────────────────────
const isLoading = computed(() => accountsStore.isLoading)
const totalBalance = computed(() => accountsStore.totalBalance)
const hasAccounts = computed(() => accountsStore.accounts.length > 0)

// ── Handlers ──────────────────────────────────────────────────
function openAddSheet() {
  showAddSheet.value = true
}

useFabAction({ label: 'Add account', handler: openAddSheet })

function closeAddSheet() {
  showAddSheet.value = false
}

function openEditSheet(account: Account) {
  selectedAccount.value = account
  showEditSheet.value = true
}

function closeEditSheet() {
  showEditSheet.value = false
  // Keep selectedAccount a bit longer for transition
  setTimeout(() => {
    selectedAccount.value = null
  }, 300)
}

function onAccountCreated() {
  // Sheet closes itself via emit('close') — accounts already updated in store
  invalidateDashboard()
}

function onAccountSaved() {
  // Sheet closes itself
  invalidateDashboard()
}

function onAccountArchived() {
  // Account removed from list by store
  invalidateDashboard()
}

// ── Load on mount ─────────────────────────────────────────────
onMounted(() => {
  accountsStore.loadAccounts()
})

// ── Skeleton count ────────────────────────────────────────────
const SKELETON_COUNT = 3
</script>

<template>
  <div class="min-h-screen bg-surface-elevated">
    <!-- Page content -->
    <div class="mx-auto max-w-md md:max-w-4xl px-4 pb-28 pt-6">
      <!-- Page title -->
      <h1 class="text-page-title mb-5 font-bold text-text-primary">Accounts</h1>

      <!-- Page tip (new users only, dismissible) -->
      <PageTip page-key="accounts" />

      <!-- Loading state -->
      <template v-if="isLoading">
        <!-- Total balance skeleton -->
        <div class="mb-4">
          <TotalBalanceCard
            :total-balance="0"
            :account-count="0"
            :currency="authStore.defaultCurrency"
            :loading="true"
          />
        </div>

        <!-- Account card skeletons -->
        <div class="flex flex-col gap-3">
          <AccountCard
            v-for="i in SKELETON_COUNT"
            :key="i"
            :account="{ id: '', name: '', type: 'BANK', currency: 'USD', balance: 0, icon: null, isDefault: false, includeInTotal: true }"
            :loading="true"
          />
        </div>
      </template>

      <!-- Error state -->
      <template v-else-if="accountsStore.error">
        <div
          class="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-body text-danger"
          role="alert"
        >
          {{ accountsStore.error }}
        </div>
      </template>

      <!-- Empty state -->
      <template v-else-if="!hasAccounts">
        <EmptyState
          :icon="Wallet"
          title="No accounts yet"
          description="Add your bank accounts, credit cards, or wallets to track your balances."
          action-label="Add your first account"
          @action="openAddSheet"
        />
      </template>

      <!-- Account list -->
      <template v-else>
        <!-- Total balance card -->
        <div class="mb-4">
          <TotalBalanceCard
            :total-balance="totalBalance"
            :account-count="accountsStore.accounts.length"
            :currency="authStore.defaultCurrency"
          />
        </div>

        <!-- Accounts -->
        <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <AccountCard
            v-for="account in accountsStore.accounts"
            :key="account.id"
            :account="account"
            @click="openEditSheet"
          />
        </div>

        <!-- Add Account button -->
        <button
          type="button"
          class="text-body mb-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border font-medium text-text-secondary transition-colors duration-150 hover:border-primary hover:text-primary"
          @click="openAddSheet"
        >
          <span aria-hidden="true" class="text-lg leading-none">+</span>
          Add Account
        </button>
      </template>
    </div>

    <!-- Add Account Sheet -->
    <AddAccountSheet
      :open="showAddSheet"
      @close="closeAddSheet"
      @created="onAccountCreated"
    />

    <!-- Edit Account Sheet -->
    <EditAccountSheet
      :open="showEditSheet"
      :account="selectedAccount"
      @close="closeEditSheet"
      @saved="onAccountSaved"
      @archived="onAccountArchived"
    />
  </div>
</template>
