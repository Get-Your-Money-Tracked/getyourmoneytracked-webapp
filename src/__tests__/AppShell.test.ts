import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'

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

// ── Auth store mock ───────────────────────────────────────────
const _mockIsAuthenticated = ref(false)
const _mockIsLoading = ref(false)

vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      get isAuthenticated() { return _mockIsAuthenticated.value },
      get isLoading() { return _mockIsLoading.value },
      logout: vi.fn(),
    }),
}))

// ── Theme store mock ──────────────────────────────────────────
vi.mock('@/stores/theme', () => ({
  useThemeStore: () =>
    reactive({
      isDark: false,
      toggle: vi.fn(),
      init: vi.fn(),
    }),
}))

// ── Transaction store mock (needed by AddTransactionSheet) ────
vi.mock('@/stores/transactions', () => ({
  useTransactionsStore: () =>
    reactive({
      transactions: [],
      isLoading: false,
      error: null,
      lastUsedAccountId: null,
      lastUsedCategoryId: null,
      createTransaction: vi.fn(),
    }),
}))

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      categories: [],
      isLoading: false,
      loadCategories: vi.fn(),
    }),
}))

vi.mock('@/stores/accounts', () =>({
  useAccountsStore: () =>
    reactive({
      accounts: [],
      activeAccounts: [],
      isLoading: false,
      loadAccounts: vi.fn(),
    }),
}))

function createTestRouter(initialPath = '/dashboard') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', component: { template: '<div data-testid="login-page">Login</div>' }, meta: { requiresAuth: false } },
      { path: '/dashboard', component: { template: '<div data-testid="dashboard-page">Dashboard</div>' }, meta: { requiresAuth: true } },
      { path: '/settings', component: { template: '<div>Settings</div>' }, meta: { requiresAuth: true } },
    ],
  })
  router.push(initialPath)
  return router
}

describe('AppShell (App.vue)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _mockIsAuthenticated.value = false
    _mockIsLoading.value = false
    document.body.innerHTML = ''
  })

  it('renders AppLoader while auth is loading', async () => {
    _mockIsLoading.value = true
    const router = createTestRouter('/dashboard')
    await router.isReady()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
      attachTo: document.body,
    })
    // AppLoader should be present while loading
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('renders app-shell for authenticated users', async () => {
    _mockIsAuthenticated.value = true
    _mockIsLoading.value = false
    const router = createTestRouter('/dashboard')
    await router.isReady()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="app-shell"]').exists()).toBe(true)
  })

  it('renders BottomNav for authenticated users', async () => {
    _mockIsAuthenticated.value = true
    _mockIsLoading.value = false
    const router = createTestRouter('/dashboard')
    await router.isReady()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('nav[aria-label="Main navigation"]').exists()).toBe(true)
  })

  it('renders Add Transaction button for authenticated users (in BottomNav)', async () => {
    _mockIsAuthenticated.value = true
    _mockIsLoading.value = false
    const router = createTestRouter('/dashboard')
    await router.isReady()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('button[aria-label="Add transaction"]').exists()).toBe(true)
  })

  it('does NOT render app-shell for unauthenticated users on login page', async () => {
    _mockIsAuthenticated.value = false
    _mockIsLoading.value = false
    const router = createTestRouter('/login')
    await router.isReady()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="app-shell"]').exists()).toBe(false)
  })

  it('does NOT render BottomNav for unauthenticated users', async () => {
    _mockIsAuthenticated.value = false
    _mockIsLoading.value = false
    const router = createTestRouter('/login')
    await router.isReady()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('nav[aria-label="Main navigation"]').exists()).toBe(false)
  })
})
