import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import IncomeExpensesChart from '@/components/reports/IncomeExpensesChart.vue'
import type { MonthlyTrend } from '@/graphql/queries/reports'

// Mock vue-chartjs Bar — Chart.js requires a canvas that jsdom doesn't support
vi.mock('vue-chartjs', () => ({
  Bar: {
    name: 'Bar',
    template: '<canvas data-testid="bar-chart" />',
    props: ['data', 'options'],
  },
}))

// Mock chart.js registration to be a no-op
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  PointElement: {},
  LineElement: {},
  Filler: {},
  ArcElement: {},
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
]

describe('IncomeExpensesChart', () => {
  it('renders without errors', () => {
    const wrapper = mount(IncomeExpensesChart, { props: { months: sampleMonths } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the chart wrapper', () => {
    const wrapper = mount(IncomeExpensesChart, { props: { months: sampleMonths } })
    expect(wrapper.find('[data-testid="income-expenses-chart"]').exists()).toBe(true)
  })

  it('renders the bar chart canvas when data is present', () => {
    const wrapper = mount(IncomeExpensesChart, { props: { months: sampleMonths } })
    expect(wrapper.find('[data-testid="bar-chart"]').exists()).toBe(true)
  })

  it('shows canvas wrapper when months are provided', () => {
    const wrapper = mount(IncomeExpensesChart, { props: { months: sampleMonths } })
    expect(wrapper.find('[data-testid="income-expenses-canvas-wrapper"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="income-expenses-empty"]').exists()).toBe(false)
  })

  it('shows empty state when months is empty', () => {
    const wrapper = mount(IncomeExpensesChart, { props: { months: [] } })
    expect(wrapper.find('[data-testid="income-expenses-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="income-expenses-canvas-wrapper"]').exists()).toBe(false)
  })

  it('renders "Income vs Expenses" heading', () => {
    const wrapper = mount(IncomeExpensesChart, { props: { months: sampleMonths } })
    expect(wrapper.text()).toContain('Income vs Expenses')
  })
})
