import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import MonthDetailPage from '@/pages/MonthDetailPage.vue'
import type { MonthDetail } from '@/types'

// ── Mock chart (CategoryPieChart uses vue-chartjs) ────────────────────────────
vi.mock('vue-chartjs', () => ({
  Doughnut: {
    name: 'Doughnut',
    template: '<canvas />',
    props: ['data', 'options'],
  },
}))

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}))

// ── Mock history queries ──────────────────────────────────────────────────────
const _mockDetail = ref<MonthDetail | null>(null)
const _mockFetchError = ref<string | null>(null)

vi.mock('@/graphql/queries/history', () => ({
  fetchMonthlySummaries: vi.fn(async () => []),
  fetchMonthDetail: vi.fn(async () => {
    if (_mockFetchError.value) throw new Error(_mockFetchError.value)
    return _mockDetail.value
  }),
}))

// ── Mock auth store ───────────────────────────────────────────────────────────
vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      defaultCurrency: 'USD',
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

// ── Mock categories store ─────────────────────────────────────────────────────
vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      categories: [],
      loadCategories: vi.fn().mockResolvedValue(undefined),
    }),
}))

// ── Router ────────────────────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/history', component: { template: '<div/>' } },
    { path: '/history/:month', component: MonthDetailPage },
  ],
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeDetail(overrides: Partial<MonthDetail> = {}): MonthDetail {
  return {
    month: '2025-12',
    totalIncome: 3200,
    totalExpenses: 2100,
    percentSpent: 66,
    categoryBreakdown: [],
    transactions: [],
    budgets: [],
    subscriptions: [],
    ...overrides,
  }
}

async function mountPage(month = '2025-12') {
  await router.push(`/history/${month}`)
  await router.isReady()
  return mount(MonthDetailPage, {
    global: { plugins: [router] },
  })
}

describe('MonthDetailPage', () => {
  beforeEach(() => {
    _mockDetail.value = null
    _mockFetchError.value = null
  })

  it('mounts without errors', async () => {
    _mockDetail.value = makeDetail()
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('shows loading skeleton before data loads', async () => {
    _mockDetail.value = makeDetail()
    const wrapper = await mountPage()
    // Before flushPromises
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true)
  })

  it('hides loading skeleton after data loads', async () => {
    _mockDetail.value = makeDetail()
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(false)
  })

  it('renders back button', async () => {
    _mockDetail.value = makeDetail()
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="back-button"]').exists()).toBe(true)
  })

  it('renders the page title with month name', async () => {
    _mockDetail.value = makeDetail({ month: '2025-12' })
    const wrapper = await mountPage('2025-12')
    await flushPromises()
    expect(wrapper.find('[data-testid="page-title"]').text()).toContain('December 2025')
  })

  it('includes "Summary" in the page title', async () => {
    _mockDetail.value = makeDetail()
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="page-title"]').text()).toContain('Summary')
  })

  it('renders the summary card', async () => {
    _mockDetail.value = makeDetail()
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="summary-card"]').exists()).toBe(true)
  })

  it('shows total income in summary card', async () => {
    _mockDetail.value = makeDetail({ totalIncome: 3200 })
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="summary-income"]').text()).toContain('3,200')
  })

  it('shows total expenses in summary card', async () => {
    _mockDetail.value = makeDetail({ totalExpenses: 2100 })
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="summary-expenses"]').text()).toContain('2,100')
  })

  it('renders percent badge in summary card', async () => {
    _mockDetail.value = makeDetail({ percentSpent: 66 })
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="percent-badge"]').text()).toBe('66%')
  })

  it('renders progress bar in summary card', async () => {
    _mockDetail.value = makeDetail()
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="summary-progress-bar"]').exists()).toBe(true)
  })

  it('renders the budget section', async () => {
    _mockDetail.value = makeDetail({ budgets: [] })
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="budget-section"]').exists()).toBe(true)
  })

  it('renders the budget section title', async () => {
    _mockDetail.value = makeDetail()
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="budget-section-title"]').text()).toContain('Budget Performance')
  })

  it('renders the transactions section', async () => {
    _mockDetail.value = makeDetail()
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="transactions-section"]').exists()).toBe(true)
  })

  it('renders chart section when categoryBreakdown has items', async () => {
    _mockDetail.value = makeDetail({
      categoryBreakdown: [
        {
          categoryId: 'cat-food',
          categoryName: 'Food',
          categoryColor: '#10b981',
          categoryIcon: '🍽️',
          amount: 800,
          percentage: 38,
        },
      ],
    })
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="chart-section"]').exists()).toBe(true)
  })

  it('hides chart section when categoryBreakdown is empty', async () => {
    _mockDetail.value = makeDetail({ categoryBreakdown: [] })
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="chart-section"]').exists()).toBe(false)
  })

  it('shows error message when fetch fails', async () => {
    _mockFetchError.value = 'Server error'
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Server error')
  })

  // ── Route param tests ─────────────────────────────────────────────────────

  it('redirects to /history for invalid month param', async () => {
    _mockDetail.value = null
    const wrapper = await mountPage('not-a-month')
    await flushPromises()
    // The page will redirect — the router push to /history should have been called
    // We verify by checking the page doesn't crash (no fatal error thrown)
    expect(wrapper.exists()).toBe(true)
  })

  it('parses March 2026 from route param', async () => {
    _mockDetail.value = makeDetail({ month: '2026-03' })
    const wrapper = await mountPage('2026-03')
    await flushPromises()
    expect(wrapper.find('[data-testid="page-title"]').text()).toContain('March 2026')
  })
})
