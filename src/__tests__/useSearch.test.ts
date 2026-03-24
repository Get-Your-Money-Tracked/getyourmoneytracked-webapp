import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn() })),
    mutation: vi.fn(() => ({ toPromise: vi.fn() })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

// Mock fetchTransactions directly so useSearch tests don't depend on urql internals
const mockFetchTransactions = vi.fn()

vi.mock('@/graphql/queries/transactions', () => ({
  fetchTransactions: (...args: unknown[]) => mockFetchTransactions(...args),
}))

import { useSearch, createEmptyFilters } from '@/composables/useSearch'
import type { Transaction } from '@/types'

const RAW_TXN: Transaction = {
  id: 'txn-1',
  type: 'EXPENSE',
  amount: 42.5,
  date: '2026-03-15',
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: 'cat-1',
  description: 'Lunch',
  notes: null,
  tags: [],
  receiptUrl: null,
  createdAt: '2026-03-15T12:00:00Z',
  updatedAt: '2026-03-15T12:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSearch', () => {
  it('initializes with empty results and no loading', () => {
    const { results, isLoading, searchText, activeFilterCount } = useSearch()
    expect(results.value).toEqual([])
    expect(isLoading.value).toBe(false)
    expect(searchText.value).toBe('')
    expect(activeFilterCount.value).toBe(0)
  })

  it('search() fetches transactions and populates results', async () => {
    mockFetchTransactions.mockResolvedValueOnce([RAW_TXN])

    const { results, isLoading, search } = useSearch()
    const promise = search()
    expect(isLoading.value).toBe(true)
    await promise
    expect(results.value).toHaveLength(1)
    expect(results.value[0].id).toBe('txn-1')
    expect(isLoading.value).toBe(false)
  })

  it('search() preserves amount as number (fetchTransactions already parses)', async () => {
    mockFetchTransactions.mockResolvedValueOnce([RAW_TXN])

    const { results, search } = useSearch()
    await search()
    expect(results.value[0].amount).toBe(42.5)
    expect(typeof results.value[0].amount).toBe('number')
  })

  it('sets error on fetch failure', async () => {
    mockFetchTransactions.mockRejectedValueOnce(new Error('Network error'))

    const { error, search } = useSearch()
    await search()
    expect(error.value).toBe('Network error')
  })

  it('activeFilterCount reflects applied filters', () => {
    const { filters, activeFilterCount } = useSearch()
    expect(activeFilterCount.value).toBe(0)

    filters.value = {
      ...createEmptyFilters(),
      categoryId: 'cat-1',
      type: 'EXPENSE',
    }
    expect(activeFilterCount.value).toBe(2)
  })

  it('applyFilters resets results and re-fetches', async () => {
    mockFetchTransactions.mockResolvedValueOnce([RAW_TXN])

    const { results, applyFilters, search } = useSearch()
    await search()
    expect(results.value).toHaveLength(1)

    mockFetchTransactions.mockResolvedValueOnce([])
    await applyFilters({ ...createEmptyFilters(), categoryId: 'cat-xyz' })
    expect(results.value).toHaveLength(0)
  })

  it('clearFilters resets filter state', async () => {
    mockFetchTransactions.mockResolvedValueOnce([])

    const { filters, clearFilters, activeFilterCount } = useSearch()
    filters.value = { ...createEmptyFilters(), categoryId: 'cat-1', type: 'EXPENSE' }
    expect(activeFilterCount.value).toBe(2)

    await clearFilters()
    expect(activeFilterCount.value).toBe(0)
    expect(filters.value.categoryId).toBeNull()
  })

  it('removeFilter removes single filter key', async () => {
    mockFetchTransactions.mockResolvedValueOnce([])

    const { filters, removeFilter, activeFilterCount } = useSearch()
    filters.value = { ...createEmptyFilters(), categoryId: 'cat-1', type: 'EXPENSE' }
    expect(activeFilterCount.value).toBe(2)

    await removeFilter('categoryId')
    expect(filters.value.categoryId).toBeNull()
    expect(filters.value.type).toBe('EXPENSE') // other filter preserved
    expect(activeFilterCount.value).toBe(1)
  })

  it('onSearchTextChange debounces 300ms before searching', async () => {
    vi.useFakeTimers()
    mockFetchTransactions.mockResolvedValue([])

    const { onSearchTextChange, isLoading } = useSearch()
    onSearchTextChange()
    onSearchTextChange()
    onSearchTextChange()

    expect(isLoading.value).toBe(false) // not yet fired

    await vi.advanceTimersByTimeAsync(300)
    await vi.runAllTimersAsync()
    // After 300ms the debounce fires — a single search is triggered
    expect(mockFetchTransactions).toHaveBeenCalledTimes(1)
  })

  it('hasMore is true when a full page is returned', async () => {
    const page: Transaction[] = Array.from({ length: 12 }, (_, i) => ({ ...RAW_TXN, id: `txn-${i}` }))
    mockFetchTransactions.mockResolvedValueOnce(page)

    const { hasMore, search } = useSearch()
    await search()
    expect(hasMore.value).toBe(true)
  })

  it('hasMore is false when partial page returned', async () => {
    mockFetchTransactions.mockResolvedValueOnce([RAW_TXN])

    const { hasMore, search } = useSearch()
    await search()
    expect(hasMore.value).toBe(false)
  })
})
