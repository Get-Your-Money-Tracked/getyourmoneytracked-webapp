import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/DashboardPage.vue'
import type { Dashboard } from '@/types'

// ── Mock dashboard query ──────────────────────────────────────────────────────
const _mockDashboard = ref<Dashboard | null>(null)
const _mockFetchError = ref<string | null>(null)

vi.mock('@/graphql/queries/dashboard', () => ({
  fetchDashboard: vi.fn(async () => {
    if (_mockFetchError.value) throw new Error(_mockFetchError.value)
    return _mockDashboard.value
  }),
}))

// ── Mock auth store ───────────────────────────────────────────────────────────
vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      displayName: 'Alex',
      defaultCurrency: 'USD',
    }),
}))

// ── Mock categories store ─────────────────────────────────────────────────────
vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      categories: [],
      loadCategories: vi.fn().mockResolvedValue(undefined),
    }),
}))

// ── Mock accounts store ───────────────────────────────────────────────────────
vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      accounts: [],
      loadAccounts: vi.fn().mockResolvedValue(undefined),
    }),
}))

// ── Router ────────────────────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: DashboardPage }],
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    month: '2026-03',
    totalIncome: 3000,
    totalExpenses: 1200,
    remainingBudget: 1800,
    percentSpent: 40,
    recentTransactions: [],
    upcomingBills: [],
    budgetProgress: [],
    ...overrides,
  }
}

function mountPage() {
  return mount(DashboardPage, { global: { plugins: [router] } })
}

describe('DashboardPage', () => {
  beforeEach(() => {
    _mockDashboard.value = null
    _mockFetchError.value = null
    localStorage.removeItem('callout_dismissed')
  })

  it('mounts without errors', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('shows loading skeleton (animate-pulse) before data loads', () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    // Before flushPromises the query hasn't resolved
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('renders DashboardHeader with greeting after load', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="greeting"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="greeting"]').text()).toContain('Alex')
  })

  it('renders month label after load', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="month-label"]').exists()).toBe(true)
  })

  it('renders HeroSection with remaining budget after load', async () => {
    _mockDashboard.value = makeDashboard({ remainingBudget: 1800 })
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="hero-amount"]').text()).toContain('1,800')
  })

  it('renders RecentTransactions section after load', async () => {
    _mockDashboard.value = makeDashboard({ recentTransactions: [] })
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="recent-transactions"]').exists()).toBe(true)
  })

  it('renders BudgetProgressSection after load', async () => {
    _mockDashboard.value = makeDashboard({ budgetProgress: [] })
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="budget-progress-section"]').exists()).toBe(true)
  })

  it('hides UpcomingBills section when no bills', async () => {
    _mockDashboard.value = makeDashboard({ upcomingBills: [] })
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="upcoming-bills"]').exists()).toBe(false)
  })

  it('shows first-time callout when income and expenses are zero', async () => {
    localStorage.removeItem('callout_dismissed')
    _mockDashboard.value = makeDashboard({ totalIncome: 0, totalExpenses: 0, remainingBudget: 0 })
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="first-time-callout"]').exists()).toBe(true)
  })

  it('shows error message when fetch fails', async () => {
    _mockFetchError.value = 'Network error'
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Network error')
  })
})
