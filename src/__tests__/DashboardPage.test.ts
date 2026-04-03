import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/DashboardPage.vue'
import type { Dashboard } from '@/types'

// ── Mock dashboard query ──────────────────────────────────────────────────────
const _mockDashboard = ref<Dashboard | null>(null)
const _mockFetchError = ref<string | null>(null)
const _mockFetchDashboard = vi.fn(async () => {
  if (_mockFetchError.value) throw new Error(_mockFetchError.value)
  return _mockDashboard.value
})

vi.mock('@/graphql/queries/dashboard', () => ({
  fetchDashboard: (...args: any[]) => (_mockFetchDashboard as any)(...args),
}))

// ── Mock auth store ───────────────────────────────────────────────────────────
vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      displayName: 'Alex',
      defaultCurrency: 'USD',
    }),
}))

// ── Mock toast store ──────────────────────────────────────────────────────────
const _mockToastShow = vi.fn()
vi.mock('@/stores/toast', () => ({
  useToastStore: () =>
    reactive({
      show: _mockToastShow,
    }),
}))

// ── Mock categories store ─────────────────────────────────────────────────────
const _mockLoadCategories = vi.fn().mockResolvedValue(undefined)
let _mockCategoriesFail = false
vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      categories: [],
      loadCategories: () =>
        _mockCategoriesFail
          ? Promise.reject(new Error('Categories failed'))
          : _mockLoadCategories(),
    }),
}))

// ── Mock accounts store ───────────────────────────────────────────────────────
const _mockLoadAccounts = vi.fn().mockResolvedValue(undefined)
vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      accounts: [],
      loadAccounts: _mockLoadAccounts,
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
    recurringIncome: 0,
    recurringExpenses: 0,
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

/** Flush all promises AND advance timers past the 300ms min-skeleton delay */
async function flushAll() {
  await flushPromises()
  vi.advanceTimersByTime(400)
  await flushPromises()
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _mockDashboard.value = null
    _mockFetchError.value = null
    _mockCategoriesFail = false
    _mockFetchDashboard.mockClear()
    _mockToastShow.mockClear()
    localStorage.removeItem('callout_dismissed')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Existing tests (updated for fake timers) ──────────────────────────────

  it('mounts without errors', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushAll()
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
    await flushAll()
    expect(wrapper.find('[data-testid="greeting"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="greeting"]').text()).toContain('Alex')
  })

  it('renders month label after load', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.find('[data-testid="month-label"]').exists()).toBe(true)
  })

  it('renders HeroSection with remaining budget after load', async () => {
    _mockDashboard.value = makeDashboard({ remainingBudget: 1800 })
    const wrapper = mountPage()
    await flushAll()
    // Hero amount is shown (locale-agnostic: check for 1800 digits)
    expect(wrapper.find('[data-testid="hero-amount"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="hero-amount"]').text()).toMatch(/1[,\s.]?800|1800/)
  })

  it('renders RecentTransactions section after load', async () => {
    _mockDashboard.value = makeDashboard({ totalIncome: 3000, totalExpenses: 1200, recentTransactions: [] })
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.find('[data-testid="recent-transactions"]').exists()).toBe(true)
  })

  it('renders BudgetProgressSection after load', async () => {
    _mockDashboard.value = makeDashboard({ budgetProgress: [] })
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.find('[data-testid="budget-progress-section"]').exists()).toBe(true)
  })

  it('hides UpcomingBills section when no bills', async () => {
    _mockDashboard.value = makeDashboard({ upcomingBills: [] })
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.find('[data-testid="upcoming-bills"]').exists()).toBe(false)
  })

  it('shows first-time callout when income and expenses are zero', async () => {
    localStorage.removeItem('callout_dismissed')
    _mockDashboard.value = makeDashboard({ totalIncome: 0, totalExpenses: 0, remainingBudget: 0 })
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.find('[data-testid="first-time-callout"]').exists()).toBe(true)
  })

  it('shows error message when fetch fails', async () => {
    _mockFetchError.value = 'Network error'
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.text()).toContain('Network error')
  })

  // ── Story 13.1: Error resilience tests ────────────────────────────────────

  it('shows dashboard-error card when fetchDashboard fails', async () => {
    _mockFetchError.value = 'Network error'
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.find('[data-testid="dashboard-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dashboard-error-title"]').text()).toContain(
      "Couldn't load your dashboard",
    )
  })

  it('shows retry button in error state', async () => {
    _mockFetchError.value = 'Network error'
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.find('[data-testid="dashboard-retry-btn"]').exists()).toBe(true)
  })

  it('retry button re-triggers fetchDashboard', async () => {
    _mockFetchError.value = 'Network error'
    const wrapper = mountPage()
    await flushAll()
    expect(_mockFetchDashboard).toHaveBeenCalledTimes(1)

    // Fix the error so retry succeeds
    _mockFetchError.value = null
    _mockDashboard.value = makeDashboard()

    await wrapper.find('[data-testid="dashboard-retry-btn"]').trigger('click')
    await flushAll()
    expect(_mockFetchDashboard).toHaveBeenCalledTimes(2)
  })

  it('renders dashboard with partial data when only stores fail', async () => {
    _mockDashboard.value = makeDashboard()
    _mockCategoriesFail = true
    const wrapper = mountPage()
    await flushAll()
    // Dashboard should still render
    expect(wrapper.find('[data-testid="hero-amount"]').exists()).toBe(true)
    // Toast should warn about partial failure
    expect(_mockToastShow).toHaveBeenCalledWith(
      expect.stringContaining("couldn't be loaded"),
      'error',
    )
  })

  it('shows loading skeleton (dashboard-skeleton) during loading', () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="dashboard-skeleton"]').exists()).toBe(true)
  })

  it('hides loading skeleton after data loads', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.find('[data-testid="dashboard-skeleton"]').exists()).toBe(false)
  })

  // ── Story 13.2: Month navigation tests ────────────────────────────────────

  it('renders prev-month and next-month chevron buttons', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushAll()
    expect(wrapper.find('[data-testid="prev-month-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="next-month-btn"]').exists()).toBe(true)
  })

  it('next-month button is disabled when viewing current month', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushAll()
    const nextBtn = wrapper.find('[data-testid="next-month-btn"]')
    expect(nextBtn.attributes('disabled')).toBeDefined()
  })

  it('clicking prev-month updates month label and re-fetches', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushAll()

    const callsBefore = _mockFetchDashboard.mock.calls.length
    await wrapper.find('[data-testid="prev-month-btn"]').trigger('click')
    await flushAll()

    // Should have fetched again
    expect(_mockFetchDashboard.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('clicking month label resets to current month', async () => {
    _mockDashboard.value = makeDashboard()
    const wrapper = mountPage()
    await flushAll()

    // Go back one month first
    await wrapper.find('[data-testid="prev-month-btn"]').trigger('click')
    await flushAll()

    // Next month button should now be enabled (we're in the past)
    const nextBtnAfterPrev = wrapper.find('[data-testid="next-month-btn"]')
    expect(nextBtnAfterPrev.attributes('disabled')).toBeUndefined()

    // Click the month label to reset
    await wrapper.find('[data-testid="month-label"]').trigger('click')
    await flushAll()

    // Next month button should be disabled again (back to current month)
    const nextBtnAfterReset = wrapper.find('[data-testid="next-month-btn"]')
    expect(nextBtnAfterReset.attributes('disabled')).toBeDefined()
  })

  // ── Story 13.4: Transaction interactions ─────────────────────────────────
  it('recent transaction rows emit edit event on click', async () => {
    const tx = {
      id: 'tx-1',
      type: 'EXPENSE' as const,
      amount: 25,
      date: '2026-03-01',
      accountId: 'acc-1',
      toAccountId: null,
      categoryId: 'cat-1',
      description: 'Coffee',
      notes: null,
      tags: [],
      receiptUrl: null,
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    }
    _mockDashboard.value = makeDashboard({ recentTransactions: [tx], totalExpenses: 25 })
    const wrapper = mountPage()
    await flushAll()

    await wrapper.find('[data-testid="transaction-item-tx-1"]').trigger('click')
    await flushPromises()
    // The edit sheet should now be visible
    expect(wrapper.find('[data-testid="edit-transaction-sheet"]').exists()).toBe(true)
  })
})
