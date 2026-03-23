import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import OnboardingPage from '@/pages/OnboardingPage.vue'
import { ONBOARDING_COMPLETED_KEY } from '@/utils/constants'

// ── Mock stores ───────────────────────────────────────────────
vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      displayName: 'Alice',
      defaultCurrency: 'USD',
      isAuthenticated: true,
    }),
}))

vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      accounts: [
        { id: '1', name: 'Cash', type: 'CASH', currency: 'USD', balance: 0, icon: null, isDefault: true, includeInTotal: true },
      ],
      isLoading: false,
      loadAccounts: vi.fn(),
    }),
}))

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      categories: [
        { id: 'c1', name: 'Food', icon: '🍽️', color: '#ff0000', parentId: null, isDefault: true, sortOrder: 0 },
        { id: 'c2', name: 'Transport', icon: '🚗', color: '#00ff00', parentId: null, isDefault: true, sortOrder: 1 },
      ],
      isLoading: false,
      loadCategories: vi.fn(),
    }),
}))

// ── Router ────────────────────────────────────────────────────
function createTestRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/onboarding',
        name: 'onboarding',
        component: OnboardingPage,
        meta: { requiresAuth: true, isOnboarding: true },
      },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/accounts', name: 'accounts', component: { template: '<div>Accounts</div>' } },
    ],
  })
  router.push('/onboarding')
  return router
}

function mountPage() {
  const router = createTestRouter()
  return { wrapper: mount(OnboardingPage, { global: { plugins: [createPinia(), router] } }), router }
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ── Renders ───────────────────────────────────────────────────────────────────

  it('renders the onboarding page', () => {
    const { wrapper } = mountPage()
    expect(wrapper.find('[data-testid="onboarding-page"]').exists()).toBe(true)
  })

  it('renders Step 1 content initially', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="onboarding-step-1"]').exists()).toBe(true)
  })

  it('shows the user display name on Step 1', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="step1-greeting"]').text()).toContain('Alice')
  })

  it('renders progress dots indicator', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    // StepIndicator renders 3 spans
    const dots = wrapper.findAll('[role="tablist"] [role="tab"]')
    expect(dots.length).toBe(3)
  })

  it('shows Skip button', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="skip-btn"]').exists()).toBe(true)
  })

  it('shows Next button on Step 1', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="next-btn"]').exists()).toBe(true)
  })

  it('does NOT show Back button on Step 1', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="back-btn"]').exists()).toBe(false)
  })

  // ── Navigation ────────────────────────────────────────────────────────────────

  it('advances to Step 2 when Next is clicked', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="onboarding-step-2"]').exists()).toBe(true)
  })

  it('shows Back button on Step 2', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="back-btn"]').exists()).toBe(true)
  })

  it('advances to Step 3 from Step 2', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="onboarding-step-3"]').exists()).toBe(true)
  })

  it('hides Next button on Step 3', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="next-btn"]').exists()).toBe(false)
  })

  it('shows Log transaction CTA on Step 3', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="log-transaction-btn"]').exists()).toBe(true)
  })

  it('goes back to Step 1 when Back is clicked from Step 2', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="onboarding-step-1"]').exists()).toBe(true)
  })

  // ── Skip ──────────────────────────────────────────────────────────────────────

  it('sets onboarding_completed in localStorage when Skip is clicked', async () => {
    const { wrapper, router } = mountPage()
    await router.isReady()
    await flushPromises()
    await wrapper.find('[data-testid="skip-btn"]').trigger('click')
    expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe('true')
  })

  it('navigates to /dashboard when Skip is clicked', async () => {
    const { wrapper, router } = mountPage()
    await router.isReady()
    await flushPromises()
    await wrapper.find('[data-testid="skip-btn"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  // ── Log first transaction CTA ─────────────────────────────────────────────────

  it('sets onboarding_completed when Log transaction CTA is clicked', async () => {
    const { wrapper, router } = mountPage()
    await router.isReady()
    await flushPromises()
    // Navigate to Step 3
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="log-transaction-btn"]').trigger('click')
    expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe('true')
  })

  it('navigates to dashboard after Log transaction CTA', async () => {
    const { wrapper, router } = mountPage()
    await router.isReady()
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="log-transaction-btn"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('dashboard')
    expect(router.currentRoute.value.query.action).toBe('add-transaction')
  })

  // ── Returning user redirect (route guard) ─────────────────────────────────────

  it('redirects returning users (onboarding_completed=true) away from /onboarding', async () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')

    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/onboarding',
          name: 'onboarding',
          component: OnboardingPage,
          meta: { requiresAuth: true, isOnboarding: true },
        },
        { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      ],
    })

    // Simulate the guard from main.ts
    router.beforeEach((to) => {
      const isAuthenticated = true
      const isOnboardingRoute = to.name === 'onboarding'
      const onboardingCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
      if (isOnboardingRoute && isAuthenticated && onboardingCompleted) {
        return { name: 'dashboard' }
      }
    })

    await router.push({ name: 'onboarding' })
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})
