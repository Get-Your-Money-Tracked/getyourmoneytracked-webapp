<script setup lang="ts">
import { computed } from 'vue'
import { Banknote, Plus } from 'lucide-vue-next'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()
const authStore = useAuthStore()
const router = useRouter()

const cashAccount = computed(() =>
  accountsStore.accounts.find((a) => a.type === 'CASH') ?? accountsStore.accounts[0] ?? null,
)

const topCategories = computed(() => categoriesStore.categories.slice(0, 10))

function formatBalance(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: authStore.defaultCurrency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function goToAccounts() {
  router.push('/accounts')
}
</script>

<template>
  <div class="flex flex-col px-6 py-8" data-testid="onboarding-step-2">
    <h1 class="text-center text-xl font-semibold text-text-primary">Your Accounts &amp; Categories</h1>
    <p class="mt-2 text-center text-body text-text-secondary">
      Here's what we set up for you. You can customize these later.
    </p>

    <!-- Accounts section -->
    <p class="mt-6 text-caption font-medium uppercase tracking-wider text-text-muted">Accounts</p>

    <!-- Cash account card -->
    <div
      v-if="cashAccount"
      class="mt-2 flex items-center gap-3 rounded-xl bg-surface p-4"
      :style="{ boxShadow: 'var(--shadow-card)' }"
      data-testid="cash-account-card"
    >
      <Banknote :size="20" class="flex-shrink-0 text-primary" aria-hidden="true" />
      <span class="text-card-title font-medium text-text-primary">{{ cashAccount.name }}</span>
      <span class="ml-auto text-caption text-text-muted">{{ formatBalance(cashAccount.balance) }}</span>
    </div>

    <!-- Add account button -->
    <button
      type="button"
      class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 py-3 text-body font-medium text-primary transition-colors hover:border-primary/60"
      data-testid="add-account-btn"
      @click="goToAccounts"
    >
      <Plus :size="16" aria-hidden="true" />
      Add Bank or Credit Card
    </button>

    <!-- Categories section -->
    <p class="mt-6 text-caption font-medium uppercase tracking-wider text-text-muted">Categories</p>

    <div
      class="mt-2 rounded-xl bg-surface p-4"
      :style="{ boxShadow: 'var(--shadow-card)' }"
      data-testid="category-grid"
    >
      <div class="grid grid-cols-5 gap-3">
        <div
          v-for="cat in topCategories"
          :key="cat.id"
          class="flex flex-col items-center gap-1"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full text-base"
            :style="{
              backgroundColor: cat.color ? `${cat.color}26` : 'var(--color-surface-muted)',
            }"
            :aria-label="cat.name"
          >
            {{ cat.icon ?? '📂' }}
          </div>
        </div>
      </div>
    </div>

    <p class="mt-3 text-center text-caption text-text-muted">
      You can add, rename, or reorder categories in Settings.
    </p>
  </div>
</template>
