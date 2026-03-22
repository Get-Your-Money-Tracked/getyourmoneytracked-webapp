<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { useAuthStore } from '@/stores/auth'
import AccountCard from '@/components/accounts/AccountCard.vue'
import TotalBalanceCard from '@/components/accounts/TotalBalanceCard.vue'
import AddAccountSheet from '@/components/accounts/AddAccountSheet.vue'
import EditAccountSheet from '@/components/accounts/EditAccountSheet.vue'
import type { Account } from '@/types'

const accountsStore = useAccountsStore()
const authStore = useAuthStore()

// ── Sheet state ───────────────────────────────────────────────
const showAddSheet = ref(false)
const showEditSheet = ref(false)
const selectedAccount = ref<Account | null>(null)

// ── Archived section ──────────────────────────────────────────
const showArchived = ref(false)

// ── Computed ──────────────────────────────────────────────────
const isLoading = computed(() => accountsStore.isLoading)
const activeAccounts = computed(() => accountsStore.activeAccounts)
const archivedAccounts = computed(() => accountsStore.archivedAccounts)
const totalBalance = computed(() => accountsStore.totalBalance)
const hasAccounts = computed(() => activeAccounts.value.length > 0)

// ── Handlers ──────────────────────────────────────────────────
function openAddSheet() {
  showAddSheet.value = true
}

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
}

function onAccountSaved() {
  // Sheet closes itself
}

function onAccountArchived() {
  showArchived.value = false
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
    <div class="mx-auto max-w-md px-4 pb-28 pt-6">
      <!-- Page title -->
      <h1 class="text-page-title mb-5 font-bold text-text-primary">Accounts</h1>

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
            :account="{ id: '', name: '', type: 'BANK', currency: 'USD', balance: 0, icon: null, isDefault: false, isArchived: false }"
            :loading="true"
          />
        </div>
      </template>

      <!-- Empty state -->
      <template v-else-if="!hasAccounts">
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <!-- Wallet icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mb-4 h-12 w-12 opacity-50 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 12V7H5a2 2 0 010-4h14v4M21 12a2 2 0 010 4H5a2 2 0 01-2-2V5"
            />
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12h-3a2 2 0 000 4h3" />
          </svg>
          <h2 class="text-section-title mb-2 font-semibold text-text-secondary">
            No accounts yet
          </h2>
          <p class="text-body mb-6 max-w-[250px] text-text-muted">
            Add your first account to start tracking your finances
          </p>
          <button
            type="button"
            class="flex h-12 items-center gap-2 rounded-xl px-6 font-semibold text-white transition-opacity"
            :style="{ backgroundColor: 'var(--color-primary)' }"
            @click="openAddSheet"
          >
            <span aria-hidden="true">+</span>
            Add Account
          </button>
        </div>
      </template>

      <!-- Account list -->
      <template v-else>
        <!-- Total balance card -->
        <div class="mb-4">
          <TotalBalanceCard
            :total-balance="totalBalance"
            :account-count="activeAccounts.length"
            :currency="authStore.defaultCurrency"
          />
        </div>

        <!-- Active accounts -->
        <div class="mb-4 flex flex-col gap-3">
          <AccountCard
            v-for="account in activeAccounts"
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

        <!-- Archived accounts collapsible -->
        <div v-if="archivedAccounts.length > 0">
          <button
            type="button"
            class="text-body flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-medium text-text-muted transition-colors hover:bg-surface-muted"
            :aria-expanded="showArchived"
            @click="showArchived = !showArchived"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 transition-transform duration-200"
              :class="{ 'rotate-90': showArchived }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Archived ({{ archivedAccounts.length }})
          </button>

          <Transition name="expand">
            <div v-if="showArchived" class="mt-2 flex flex-col gap-3">
              <AccountCard
                v-for="account in archivedAccounts"
                :key="account.id"
                :account="account"
                @click="openEditSheet"
              />
            </div>
          </Transition>
        </div>
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

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  transform-origin: top;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}
</style>
