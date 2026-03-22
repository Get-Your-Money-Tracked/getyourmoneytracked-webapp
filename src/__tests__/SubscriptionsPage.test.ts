import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import SubscriptionsPage from '@/pages/SubscriptionsPage.vue'
import type { SubscriptionEntry, Category, Account } from '@/types'

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

// ── Subscriptions store mock ──────────────────────────────────
const _mockSubs = ref<SubscriptionEntry[]>([])
const _mockIsLoading = ref(true)
const _mockError = ref<string | null>(null)
const _mockLoadSubs = vi.fn(async () => { _mockIsLoading.value = false })

vi.mock('@/stores/subscriptions', () => ({
  useSubscriptionsStore: () =>
    reactive({
      get subscriptions() { return _mockSubs.value },
      get isLoading() { return _mockIsLoading.value },
      get error() { return _mockError.value },
      get activeSubscriptions() { return _mockSubs.value.filter((s) => s.isActive) },
      get inactiveSubscriptions() { return _mockSubs.value.filter((s) => !s.isActive) },
      get monthlyExpenses() { return _mockSubs.value.filter((s) => s.isActive && s.type === 'EXPENSE').reduce((sum, s) => sum + s.amount, 0) },
      get monthlyIncome() { return _mockSubs.value.filter((s) => s.isActive && s.type === 'INCOME').reduce((sum, s) => sum + s.amount, 0) },
      loadSubscriptions: _mockLoadSubs,
      createSubscription: vi.fn(),
      updateSubscription: vi.fn(),
      deleteSubscription: vi.fn(),
    }),
}))

// ── Categories store mock ─────────────────────────────────────
const _mockCategories = ref<Category[]>([])

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      get categories() { return _mockCategories.value },
      loadCategories: vi.fn(async () => {}),
    }),
}))

// ── Accounts store mock ───────────────────────────────────────
const _mockAccounts = ref<Account[]>([])

vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      get accounts() { return _mockAccounts.value },
      get activeAccounts() { return _mockAccounts.value.filter((a) => !a.isArchived) },
      loadAccounts: vi.fn(async () => {}),
    }),
}))

// ── Auth store mock ───────────────────────────────────────────
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => reactive({ defaultCurrency: 'USD' }),
}))

// ── Toast store mock ──────────────────────────────────────────
vi.mock('@/stores/toast', () => ({
  useToastStore: () => reactive({ show: vi.fn() }),
}))

// ── Router ────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/subscriptions', component: SubscriptionsPage },
    { path: '/settings', component: { template: '<div>Settings</div>' } },
  ],
})

function makeSub(overrides: Partial<SubscriptionEntry> = {}): SubscriptionEntry {
  return {
    id: 'sub-1',
    name: 'Netflix',
    type: 'EXPENSE',
    amount: 15.99,
    frequency: 'MONTHLY',
    dayOfMonth: 25,
    nextDueDate: '2026-03-25',
    isActive: true,
    autoLog: false,
    category: {
      id: 'cat-1',
      name: 'Entertainment',
      icon: '📺',
      color: '#FF5722',
      parentId: null,
      isDefault: false,
      sortOrder: 0,
    },
    account: {
      id: 'acc-1',
      name: 'Cash Wallet',
      type: 'CASH',
      currency: 'USD',
      balance: 500,
      icon: null,
      isDefault: true,
      isArchived: false,
    },
    ...overrides,
  }
}

function mountPage() {
  return mount(SubscriptionsPage, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
}

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    _mockSubs.value = []
    _mockIsLoading.value = true
    _mockError.value = null
    vi.clearAllMocks()
    _mockLoadSubs.mockImplementation(async () => { _mockIsLoading.value = false })
    document.body.innerHTML = ''
  })

  it('mounts without errors', () => {
    _mockIsLoading.value = false
    const wrapper = mountPage()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders page title "Subscriptions"', async () => {
    _mockIsLoading.value = false
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Subscriptions')
  })

  it('shows loading skeleton while loading', () => {
    _mockIsLoading.value = true
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true)
  })

  it('hides loading skeleton after data loads', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(false)
  })

  it('shows empty state when no subscriptions', async () => {
    _mockSubs.value = []
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  })

  it('empty state contains "No subscriptions yet."', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('No subscriptions yet.')
  })

  it('empty state has an Add Subscription button', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-add-btn"]').exists()).toBe(true)
  })

  it('shows error message when loading fails', async () => {
    _mockError.value = 'Failed to load subscriptions.'
    _mockLoadSubs.mockImplementation(async () => { _mockIsLoading.value = false })
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to load subscriptions.')
  })

  it('renders Add button in header', () => {
    _mockIsLoading.value = false
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="add-subscription-btn"]').exists()).toBe(true)
  })

  it('renders back to Settings link', () => {
    _mockIsLoading.value = false
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="back-to-settings-btn"]').exists()).toBe(true)
  })

  it('calls loadSubscriptions on mount', async () => {
    mountPage()
    await flushPromises()
    expect(_mockLoadSubs).toHaveBeenCalled()
  })

  it('renders active section when active subscriptions exist', async () => {
    _mockSubs.value = [makeSub({ id: 's1', isActive: true })]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="active-list"]').exists()).toBe(true)
  })

  it('renders active section header with correct count', async () => {
    _mockSubs.value = [
      makeSub({ id: 's1', isActive: true }),
      makeSub({ id: 's2', isActive: true, name: 'Spotify' }),
    ]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="active-section-header"]').text()).toContain('Active')
    expect(wrapper.text()).toContain('(2)')
  })

  it('renders inactive section header when inactive subscriptions exist', async () => {
    _mockSubs.value = [
      makeSub({ id: 's1', isActive: true }),
      makeSub({ id: 's2', isActive: false, name: 'Old Plan' }),
    ]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="inactive-section-header"]').exists()).toBe(true)
  })

  it('inactive list is collapsed by default', async () => {
    _mockSubs.value = [makeSub({ id: 's2', isActive: false })]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="inactive-list"]').exists()).toBe(false)
  })

  it('inactive list expands when header is clicked', async () => {
    _mockSubs.value = [makeSub({ id: 's2', isActive: false })]
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="inactive-section-header"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="inactive-list"]').exists()).toBe(true)
  })

  it('renders recurring summary card when subscriptions exist', async () => {
    _mockSubs.value = [makeSub()]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="recurring-summary-card"]').exists()).toBe(true)
  })

  it('renders a SubscriptionItem for each active subscription', async () => {
    _mockSubs.value = [
      makeSub({ id: 's1', isActive: true }),
      makeSub({ id: 's2', isActive: true, name: 'Spotify' }),
    ]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="subscription-item-s1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="subscription-item-s2"]').exists()).toBe(true)
  })
})
