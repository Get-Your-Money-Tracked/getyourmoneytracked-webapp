import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SpendingTrendsChart from '@/components/reports/SpendingTrendsChart.vue'
import type { MonthlyTrend } from '@/graphql/queries/reports'

// Mock vue-chartjs Line — Chart.js requires a canvas that jsdom doesn't support
vi.mock('vue-chartjs', () => ({
  Line: {
    name: 'Line',
    template: '<canvas data-testid="line-chart" />',
    props: ['data', 'options'],
  },
}))

// Mock chart.js registration to be a no-op
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Filler: {},
  BarElement: {},
  ArcElement: {},
  Legend: {},
}))

// Mock useChartTheme composable
vi.mock('@/composables/useChartTheme', () => ({
  useChartTheme: () => ({
    baseOptions: { value: { plugins: {} } },
    primaryColor: { value: '#10b981' },
    dangerColor: { value: '#ef4444' },
    categoryPalette: { value: [] },
  }),
}))

function makeMonth(month: string, income: number, expenses: number): MonthlyTrend {
  return { month, totalIncome: income, totalExpenses: expenses }
}

const sampleMonths = [
  makeMonth('2026-01-01', 5000, 3000),
  makeMonth('2026-02-01', 4500, 2800),
  makeMonth('2026-03-01', 5200, 3100),
]

describe('SpendingTrendsChart', () => {
  it('renders without errors', () => {
    const wrapper = mount(SpendingTrendsChart, { props: { months: sampleMonths } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the chart wrapper', () => {
    const wrapper = mount(SpendingTrendsChart, { props: { months: sampleMonths } })
    expect(wrapper.find('[data-testid="spending-trends-chart"]').exists()).toBe(true)
  })

  it('renders the line chart canvas when data is present', () => {
    const wrapper = mount(SpendingTrendsChart, { props: { months: sampleMonths } })
    expect(wrapper.find('[data-testid="line-chart"]').exists()).toBe(true)
  })

  it('shows the canvas wrapper when months are provided', () => {
    const wrapper = mount(SpendingTrendsChart, { props: { months: sampleMonths } })
    expect(wrapper.find('[data-testid="spending-trends-canvas-wrapper"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="spending-trends-empty"]').exists()).toBe(false)
  })

  it('shows empty state when months is empty', () => {
    const wrapper = mount(SpendingTrendsChart, { props: { months: [] } })
    expect(wrapper.find('[data-testid="spending-trends-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="spending-trends-canvas-wrapper"]').exists()).toBe(false)
  })

  it('renders the income overlay toggle button', () => {
    const wrapper = mount(SpendingTrendsChart, { props: { months: sampleMonths } })
    expect(wrapper.find('[data-testid="income-overlay-toggle"]').exists()).toBe(true)
  })

  it('shows "Show Income" text by default', () => {
    const wrapper = mount(SpendingTrendsChart, { props: { months: sampleMonths } })
    expect(wrapper.find('[data-testid="income-overlay-toggle"]').text()).toBe('Show Income')
  })

  it('toggles income overlay text when toggle is clicked', async () => {
    const wrapper = mount(SpendingTrendsChart, { props: { months: sampleMonths } })
    await wrapper.find('[data-testid="income-overlay-toggle"]').trigger('click')
    expect(wrapper.find('[data-testid="income-overlay-toggle"]').text()).toBe('Hide Income')
  })

  it('renders "Spending Trends" heading', () => {
    const wrapper = mount(SpendingTrendsChart, { props: { months: sampleMonths } })
    expect(wrapper.text()).toContain('Spending Trends')
  })
})
