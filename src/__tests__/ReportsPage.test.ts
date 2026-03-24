import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callSpendingTrends } from '@/graphql/queries/reports'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ReportsPage from '@/pages/ReportsPage.vue'
import type { SpendingTrendsResult } from '@/graphql/queries/reports'

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

// Mock child chart components to avoid canvas issues
vi.mock('@/components/reports/SpendingTrendsChart.vue', () => ({
  default: {
    name: 'SpendingTrendsChart',
    template: '<div data-testid="spending-trends-chart" />',
    props: ['months'],
  },
}))

vi.mock('@/components/reports/IncomeExpensesChart.vue', () => ({
  default: {
    name: 'IncomeExpensesChart',
    template: '<div data-testid="income-expenses-chart" />',
    props: ['months'],
  },
}))

vi.mock('@/components/reports/CategoryBreakdownChart.vue', () => ({
  default: {
    name: 'CategoryBreakdownChart',
    template: '<div data-testid="category-breakdown-chart" />',
    props: ['categories'],
  },
}))

vi.mock('@/components/reports/TrendsSummaryCards.vue', () => ({
  default: {
    name: 'TrendsSummaryCards',
    template: '<div data-testid="trends-summary-cards" />',
    props: ['months'],
  },
}))

vi.mock('@/components/reports/CustomDateRangeSheet.vue', () => ({
  default: {
    name: 'CustomDateRangeSheet',
    template: '<div data-testid="custom-date-range-sheet" />',
    props: ['open', 'initialRange'],
    emits: ['close', 'apply'],
  },
}))

// Control callSpendingTrends
let _mockResult: SpendingTrendsResult = { months: [], categoryBreakdown: [] }
let _mockError: string | null = null

vi.mock('@/graphql/queries/reports', () => ({
  callSpendingTrends: vi.fn(async () => {
    if (_mockError) throw new Error(_mockError)
    return _mockResult
  }),
  presetToRange: vi.fn((preset: string) => {
    if (preset === 'Custom') return null
    return { startMonth: '2026-01', endMonth: '2026-03' }
  }),
}))

// Mock TimeRangeSelector
vi.mock('@/components/reports/TimeRangeSelector.vue', () => ({
  default: {
    name: 'TimeRangeSelector',
    template: '<div data-testid="time-range-selector" />',
    props: [],
    emits: ['change', 'open-custom'],
    methods: {
      setCustomActive() {},
    },
  },
  presetToRange: (preset: string) => {
    if (preset === 'Custom') return null
    return { startMonth: '2026-01', endMonth: '2026-03' }
  },
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/reports', component: ReportsPage },
    { path: '/dashboard', component: { template: '<div />' } },
  ],
})

async function mountPage() {
  await router.push('/reports')
  await router.isReady()
  return mount(ReportsPage, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
}

describe('ReportsPage', () => {
  beforeEach(() => {
    _mockResult = { months: [], categoryBreakdown: [] }
    _mockError = null
    document.body.innerHTML = ''
  })

  it('renders the page container', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="reports-page"]').exists()).toBe(true)
  })

  it('renders the Reports heading', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="reports-heading"]').text()).toBe('Reports')
  })

  it('renders the time range selector', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="time-range-selector"]').exists()).toBe(true)
  })

  it('shows loading state while fetching', async () => {
    vi.mocked(callSpendingTrends).mockReturnValueOnce(new Promise(() => {})) // never resolves

    const wrapper = await mountPage()
    // Don't flushPromises — still in loading state
    expect(wrapper.find('[data-testid="reports-loading"]').exists()).toBe(true)
  })

  it('shows content after successful fetch', async () => {
    _mockResult = {
      months: [{ month: '2026-01-01', totalIncome: 5000, totalExpenses: 3000 }],
      categoryBreakdown: [],
    }
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="reports-content"]').exists()).toBe(true)
  })

  it('shows error message when fetch fails', async () => {
    _mockError = 'Failed to load'
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="reports-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="reports-error"]').text()).toContain('Failed to load')
  })

  it('renders summary cards section in content', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="trends-summary-cards"]').exists()).toBe(true)
  })

  it('renders spending trends chart section', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="reports-trends-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="spending-trends-chart"]').exists()).toBe(true)
  })

  it('renders income vs expenses section', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="reports-income-expenses-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="income-expenses-chart"]').exists()).toBe(true)
  })

  it('renders category breakdown section', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="reports-category-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="category-breakdown-chart"]').exists()).toBe(true)
  })

  it('does not show error when fetch succeeds', async () => {
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="reports-error"]').exists()).toBe(false)
  })
})
