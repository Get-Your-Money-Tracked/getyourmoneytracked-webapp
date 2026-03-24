<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { Search } from 'lucide-vue-next'
import { useSearch, type SearchFilters } from '@/composables/useSearch'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { callUsedTags } from '@/graphql/queries/tags'
import SearchBar from '@/components/search/SearchBar.vue'
import SearchFilterSheet from '@/components/search/SearchFilterSheet.vue'
import SearchFilterChips from '@/components/search/SearchFilterChips.vue'
import TransactionListItem from '@/components/transactions/TransactionListItem.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Transaction } from '@/types'

const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()

const {
  searchText,
  filters,
  results,
  isLoading,
  hasMore,
  error,
  activeFilterCount,
  onSearchTextChange,
  applyFilters,
  removeFilter,
  loadMore,
  search,
} = useSearch()

const showFilterSheet = ref(false)
const availableTags = ref<string[]>([])

// Transaction edit sheet (reuses AddTransactionSheet via emit up to parent)
// For now: store selected transaction
const selectedTransaction = ref<Transaction | null>(null)

// Infinite scroll sentinel
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(async () => {
  if (accountsStore.accounts.length === 0) accountsStore.loadAccounts()
  if (categoriesStore.categories.length === 0) categoriesStore.loadCategories()

  // Load available tags for filter UI
  try {
    availableTags.value = await callUsedTags()
  } catch {
    // non-fatal — filter tags just won't show
  }

  // Don't auto-search on mount — wait for user input

  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 },
    )
    if (sentinel.value) observer.observe(sentinel.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

function onSearchInput(value: string) {
  searchText.value = value
  onSearchTextChange()
}

function handleApplyFilters(newFilters: SearchFilters) {
  applyFilters(newFilters)
}

function handleRemoveFilter(key: keyof SearchFilters) {
  removeFilter(key)
}

const resultCount = computed(() => results.value.length)
const hasQuery = computed(
  () => searchText.value.trim().length > 0 || activeFilterCount.value > 0,
)
</script>

<template>
  <div class="min-h-screen pb-24 md:pb-0">
    <div class="mx-auto max-w-md md:max-w-4xl">
      <!-- Header -->
      <div class="px-4 pt-6 pb-2">
        <h1 class="text-page-title font-bold text-text-primary" data-testid="search-heading">
          Search
        </h1>
      </div>

      <!-- Search Bar -->
      <SearchBar
        :model-value="searchText"
        :active-filter-count="activeFilterCount"
        @update:model-value="onSearchInput"
        @open-filters="showFilterSheet = true"
      />

      <!-- Active filter chips -->
      <SearchFilterChips
        :filters="filters"
        :categories="categoriesStore.categories"
        :accounts="accountsStore.accounts"
        @remove="handleRemoveFilter"
      />

      <!-- Result count -->
      <div
        v-if="hasQuery && !isLoading"
        class="px-4 mt-3 text-caption text-text-secondary"
        data-testid="result-count"
      >
        {{ resultCount }} result{{ resultCount !== 1 ? 's' : '' }}
      </div>

      <!-- Loading skeleton (initial) -->
      <div
        v-if="isLoading && results.length === 0"
        class="mx-4 mt-4 overflow-hidden rounded-2xl bg-surface shadow-card"
        data-testid="loading-skeleton"
      >
        <div class="divide-y divide-border">
          <div v-for="n in 6" :key="n" class="flex items-center gap-3 px-4 py-3">
            <div class="flex flex-col items-center gap-1">
              <div class="h-2 w-2 rounded-full bg-surface-muted" />
              <div class="h-8 w-8 rounded-full bg-surface-muted" />
            </div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-3/4 rounded bg-surface-muted" />
              <div class="h-3 w-1/2 rounded bg-surface-muted" />
            </div>
            <div class="h-4 w-16 rounded bg-surface-muted" />
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="px-4 mt-4">
        <p class="text-body text-danger" data-testid="search-error">{{ error }}</p>
      </div>

      <!-- Results list -->
      <div
        v-else-if="results.length > 0"
        class="mx-4 mt-4 overflow-hidden rounded-2xl bg-surface shadow-card"
        data-testid="search-results"
      >
        <div class="divide-y divide-border">
          <TransactionListItem
            v-for="txn in results"
            :key="txn.id"
            :transaction="txn"
            :accounts="accountsStore.accounts"
            :categories="categoriesStore.categories"
            @select="selectedTransaction = $event"
          />
        </div>
      </div>

      <!-- Empty state — shown only when a query was made but no results -->
      <EmptyState
        v-else-if="hasQuery && !isLoading"
        :icon="Search"
        title="No transactions found"
        description="Try adjusting your search term or filters."
        data-testid="empty-state"
      />

      <!-- Loading more -->
      <div
        v-if="isLoading && results.length > 0"
        class="py-4 text-center"
        data-testid="loading-more"
      >
        <p class="text-caption text-text-muted">Loading more...</p>
      </div>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="h-1" aria-hidden="true" data-testid="scroll-sentinel" />
    </div>

    <!-- Filter Sheet -->
    <SearchFilterSheet
      :open="showFilterSheet"
      :model-value="filters"
      :categories="categoriesStore.categories"
      :accounts="accountsStore.accounts"
      :available-tags="availableTags"
      @close="showFilterSheet = false"
      @apply="handleApplyFilters"
    />
  </div>
</template>
