import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, reactive } from 'vue'
import AccountsPage from '@/pages/AccountsPage.vue'
import type { Account } from '@/types'

// ── Mock Firebase / urql ──────────────────────────────────────────────────────
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

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    defaultCurrency: 'USD',
  }),
}))

// ── Mutable state for accounts store mock ─────────────────────────────────────
// Define at module level so vi.mock() factory can close over them
const _mockIsLoading = ref(false)
const _mockAccounts = ref<Account[]>([])
const _mockLoadAccounts = vi.fn()

vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      get isLoading() {
        return _mockIsLoading.value
      },
      get accounts() {
        return _mockAccounts.value
      },
      get totalBalance() {
        return _mockAccounts.value
          .reduce((sum: number, a: Account) => sum + a.balance, 0)
      },
      loadAccounts: _mockLoadAccounts,
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      archiveAccount: vi.fn(),
      clearError: vi.fn(),
      error: null,
    }),
}))

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    name: 'Main Bank',
    type: 'BANK',
    currency: 'USD',
    balance: 5000,
    icon: null,
    isDefault: true,
    includeInTotal: true,
    ...overrides,
  }
}

function mountPage() {
  return mount(AccountsPage, {
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('AccountsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _mockIsLoading.value = false
    _mockAccounts.value = []
  })

  it('calls loadAccounts on mount', () => {
    mountPage()
    expect(_mockLoadAccounts).toHaveBeenCalledOnce()
  })

  it('renders loading skeleton while isLoading is true', async () => {
    _mockIsLoading.value = true
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
  })

  it('renders empty state when no accounts exist', async () => {
    _mockIsLoading.value = false
    _mockAccounts.value = []
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('No accounts yet')
    expect(wrapper.text()).toContain('Add your first account')
  })

  it('renders account cards when accounts are loaded', async () => {
    _mockIsLoading.value = false
    _mockAccounts.value = [
      makeAccount(),
      makeAccount({ id: 'acc-2', name: 'Cash Wallet', type: 'CASH', balance: 200 }),
    ]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Main Bank')
    expect(wrapper.text()).toContain('Cash Wallet')
  })

  it('shows Total Balance card when accounts exist', async () => {
    _mockIsLoading.value = false
    _mockAccounts.value = [makeAccount({ balance: 5000 })]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Total Balance')
  })

  it('shows "Add Account" button when accounts exist', async () => {
    _mockIsLoading.value = false
    _mockAccounts.value = [makeAccount()]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Add Account')
  })

  it('opens add sheet when "Add Account" button is clicked', async () => {
    _mockIsLoading.value = false
    _mockAccounts.value = [makeAccount()]
    const wrapper = mountPage()
    await flushPromises()

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Account'))
    await addBtn?.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

})
