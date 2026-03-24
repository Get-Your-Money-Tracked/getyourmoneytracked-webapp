import { ref, computed } from 'vue'
import type { Transaction } from '@/types'
import { fetchTransactions, type TransactionFilter } from '@/graphql/queries/transactions'

const DEFAULT_PAGE_SIZE = 12

export interface SearchFilters {
  startDate: string | null
  endDate: string | null
  categoryId: string | null
  accountId: string | null
  type: string | null
  minAmount: string | null
  maxAmount: string | null
  tags: string[]
}

export function createEmptyFilters(): SearchFilters {
  return {
    startDate: null,
    endDate: null,
    categoryId: null,
    accountId: null,
    type: null,
    minAmount: null,
    maxAmount: null,
    tags: [],
  }
}

export function useSearch() {
  const searchText = ref('')
  const filters = ref<SearchFilters>(createEmptyFilters())
  const results = ref<Transaction[]>([])
  const isLoading = ref(false)
  const hasMore = ref(false)
  const error = ref<string | null>(null)
  const offset = ref(0)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  /** How many non-default filters are active (for badge display). */
  const activeFilterCount = computed(() => {
    const f = filters.value
    let n = 0
    if (f.startDate) n++
    if (f.endDate) n++
    if (f.categoryId) n++
    if (f.accountId) n++
    if (f.type) n++
    if (f.minAmount) n++
    if (f.maxAmount) n++
    if (f.tags.length > 0) n++
    return n
  })

  function buildFilter(currentOffset: number): TransactionFilter {
    const f = filters.value
    return {
      search: searchText.value.trim() || null,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      categoryId: f.categoryId || null,
      accountId: f.accountId || null,
      type: f.type || null,
      minAmount: f.minAmount || null,
      maxAmount: f.maxAmount || null,
      tags: f.tags.length > 0 ? f.tags : null,
      limit: DEFAULT_PAGE_SIZE,
      offset: currentOffset,
    }
  }

  async function executeSearch(reset: boolean) {
    if (reset) {
      offset.value = 0
      results.value = []
      error.value = null
    }
    isLoading.value = true
    try {
      const newItems = await fetchTransactions(buildFilter(reset ? 0 : offset.value))
      if (reset) {
        results.value = newItems
      } else {
        results.value = [...results.value, ...newItems]
      }
      hasMore.value = newItems.length === DEFAULT_PAGE_SIZE
      offset.value = (reset ? 0 : offset.value) + newItems.length
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Search failed.'
    } finally {
      isLoading.value = false
    }
  }

  /** Call this when search text changes — debounces 300ms then fires. */
  function onSearchTextChange() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      executeSearch(true)
    }, 300)
  }

  /** Apply updated filters and immediately re-search. */
  function applyFilters(newFilters: SearchFilters) {
    filters.value = newFilters
    executeSearch(true)
  }

  /** Clear all filters and re-search. */
  function clearFilters() {
    filters.value = createEmptyFilters()
    executeSearch(true)
  }

  /** Remove a single filter key and re-search. */
  function removeFilter(key: keyof SearchFilters) {
    if (key === 'tags') {
      filters.value = { ...filters.value, tags: [] }
    } else {
      filters.value = { ...filters.value, [key]: null }
    }
    executeSearch(true)
  }

  /** Append next page of results. */
  async function loadMore() {
    if (isLoading.value || !hasMore.value) return
    await executeSearch(false)
  }

  /** Initial load / explicit refresh. */
  function search() {
    executeSearch(true)
  }

  return {
    searchText,
    filters,
    results,
    isLoading,
    hasMore,
    error,
    activeFilterCount,
    onSearchTextChange,
    applyFilters,
    clearFilters,
    removeFilter,
    loadMore,
    search,
  }
}
