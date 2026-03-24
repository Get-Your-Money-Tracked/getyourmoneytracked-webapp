import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import SearchPage from '@/pages/SearchPage.vue'
import type { Transaction } from '@/types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

const _mockTransactions = ref<Transaction[]>([])
const _mockFetchError = ref<string | null>(null)

vi.mock('@/graphql/queries/transactions', () => ({
  fetchTransactions: vi.fn(async () => {
    if (_mockFetchError.value) throw new Error(_mockFetchError.value)
    return _mockTransactions.value
  }),
}))

vi.mock('@/graphql/queries/tags', () => ({
  callUsedTags: vi.fn(async () => ['food', 'travel']),
}))

vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      accounts: [{ id: 'acc-1', name: 'Main Account', type: 'BANK', currency: 'USD', balance: 0, icon: null, isDefault: true, includeInTotal: true }],
      loadAccounts: vi.fn(),
    }),
}))

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      categories: [{ id: 'cat-1', name: 'Food', icon: '🍕', color: '#10b981', parentId: null, isDefault: false, sortOrder: 0 }],
      loadCategories: vi.fn(),
    }),
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/search', component: SearchPage },
    { path: '/dashboard', component: { template: '<div/>' } },
  ],
})

function makeTransaction(id = 'txn-1'): Transaction {
  return {
    id,
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
}

async function mountPage() {
  await router.push('/search')
  await router.isReady()
  return mount(SearchPage, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
}

describe('SearchPage', () => {
  beforeEach(() => {
    _mockTransactions.value = []
    _mockFetchError.value = null
    document.body.innerHTML = ''
  })

  it('renders the Search heading', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="search-heading"]').text()).toBe('Search')
  })

  it('renders the search bar', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="search-bar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(true)
  })

  it('renders the filter button', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="filter-btn"]').exists()).toBe(true)
  })

  it('shows no results by default (no query)', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
  })

  it('shows results after a search', async () => {
    _mockTransactions.value = [makeTransaction()]
    const wrapper = await mountPage()
    await flushPromises()

    // Simulate typing into search
    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('Lunch')
    await input.trigger('input')

    // Run debounce timer
    await new Promise((r) => setTimeout(r, 350))
    await flushPromises()

    expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(true)
  })

  it('shows empty state when query has no results', async () => {
    _mockTransactions.value = []
    const wrapper = await mountPage()
    await flushPromises()

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('xyz not found')
    await input.trigger('input')

    await new Promise((r) => setTimeout(r, 350))
    await flushPromises()

    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  })

  it('shows result count when there are results', async () => {
    _mockTransactions.value = [makeTransaction('t1'), makeTransaction('t2')]
    const wrapper = await mountPage()
    await flushPromises()

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('something')
    await input.trigger('input')
    await new Promise((r) => setTimeout(r, 350))
    await flushPromises()

    expect(wrapper.find('[data-testid="result-count"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="result-count"]').text()).toContain('2 results')
  })

  it('shows error message when fetch fails', async () => {
    _mockFetchError.value = 'GraphQL error'
    const wrapper = await mountPage()
    await flushPromises()

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('test')
    await input.trigger('input')
    await new Promise((r) => setTimeout(r, 350))
    await flushPromises()

    expect(wrapper.find('[data-testid="search-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="search-error"]').text()).toContain('GraphQL error')
  })

  it('opens filter sheet when filter button is clicked', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="filter-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="search-filter-sheet"]').exists()).toBe(true)
  })

  it('clear button only shown when search text exists', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="search-clear-btn"]').exists()).toBe(false)

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('test')
    await input.trigger('input')
    await flushPromises()

    expect(wrapper.find('[data-testid="search-clear-btn"]').exists()).toBe(true)
  })

  it('scroll sentinel exists for infinite scroll', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="scroll-sentinel"]').exists()).toBe(true)
  })
})
