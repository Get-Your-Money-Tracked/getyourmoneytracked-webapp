import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import HistoryPage from '@/pages/HistoryPage.vue'
import type { MonthlySummary } from '@/types'

// ── Mock monthlySummaries query ───────────────────────────────────────────────
const _mockSummaries = ref<MonthlySummary[]>([])
const _mockFetchError = ref<string | null>(null)

vi.mock('@/graphql/queries/history', () => ({
  fetchMonthlySummaries: vi.fn(async () => {
    if (_mockFetchError.value) throw new Error(_mockFetchError.value)
    return _mockSummaries.value
  }),
  fetchMonthDetail: vi.fn(async () => null),
}))

// ── Mock auth store ───────────────────────────────────────────────────────────
vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      defaultCurrency: 'USD',
    }),
}))

// ── Router ────────────────────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/history', component: HistoryPage },
    { path: '/history/:month', component: { template: '<div/>' } },
  ],
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeSummary(month: string, percentSpent = 40): MonthlySummary {
  return {
    month,
    totalIncome: 3000,
    totalExpenses: 1200,
    percentSpent,
  }
}

function mountPage() {
  return mount(HistoryPage, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
}

describe('HistoryPage', () => {
  beforeEach(() => {
    _mockSummaries.value = []
    _mockFetchError.value = null
  })

  it('mounts without errors', async () => {
    _mockSummaries.value = [makeSummary('2026-03')]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders page title "History"', async () => {
    _mockSummaries.value = []
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('History')
  })

  it('shows loading skeleton before data loads', () => {
    _mockSummaries.value = [makeSummary('2026-03')]
    const wrapper = mountPage()
    // Before flushPromises the fetch hasn't resolved
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true)
  })

  it('hides loading skeleton after data loads', async () => {
    _mockSummaries.value = [makeSummary('2026-03')]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(false)
  })

  it('renders month list when data loads', async () => {
    _mockSummaries.value = [
      makeSummary('2026-03'),
      makeSummary('2026-02'),
    ]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="month-list"]').exists()).toBe(true)
  })

  it('renders one MonthSummaryRow per summary', async () => {
    _mockSummaries.value = [
      makeSummary('2026-03'),
      makeSummary('2026-02'),
      makeSummary('2026-01'),
    ]
    const wrapper = mountPage()
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="month-summary-row"]')
    expect(rows.length).toBe(3)
  })

  it('shows empty state when no data', async () => {
    _mockSummaries.value = []
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  })

  it('shows correct empty state message', async () => {
    _mockSummaries.value = []
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('No history yet')
  })

  it('does not show empty state when data exists', async () => {
    _mockSummaries.value = [makeSummary('2026-03')]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
  })

  it('renders sort controls', async () => {
    _mockSummaries.value = []
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="sort-controls"]').exists()).toBe(true)
  })

  it('shows error message when fetch fails', async () => {
    _mockFetchError.value = 'Network error'
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Network error')
  })

  it('does not show error when fetch succeeds', async () => {
    _mockSummaries.value = [makeSummary('2026-03')]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(false)
  })

  it('refetches when sort changes', async () => {
    const { fetchMonthlySummaries } = await import('@/graphql/queries/history')
    _mockSummaries.value = [makeSummary('2026-03')]
    const wrapper = mountPage()
    await flushPromises()

    const callsBefore = vi.mocked(fetchMonthlySummaries).mock.calls.length

    // Change sort
    await wrapper.find('[data-testid="sort-select"]').setValue('HIGHEST_EXPENSES')
    await flushPromises()

    expect(vi.mocked(fetchMonthlySummaries).mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('passes sort value to fetchMonthlySummaries', async () => {
    const { fetchMonthlySummaries } = await import('@/graphql/queries/history')
    _mockSummaries.value = []
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('[data-testid="sort-select"]').setValue('CHRONOLOGICAL_ASC')
    await flushPromises()

    const calls = vi.mocked(fetchMonthlySummaries).mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall[0]).toBe('CHRONOLOGICAL_ASC')
  })
})
