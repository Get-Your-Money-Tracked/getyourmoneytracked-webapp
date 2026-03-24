import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendsSummaryCards from '@/components/reports/TrendsSummaryCards.vue'
import type { MonthlyTrend } from '@/graphql/queries/reports'

function makeMonth(income: number, expenses: number, month = '2026-01-01'): MonthlyTrend {
  return { month, totalIncome: income, totalExpenses: expenses }
}

describe('TrendsSummaryCards', () => {
  it('renders without errors', () => {
    const wrapper = mount(TrendsSummaryCards, { props: { months: [] } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the summary container', () => {
    const wrapper = mount(TrendsSummaryCards, { props: { months: [] } })
    expect(wrapper.find('[data-testid="trends-summary-cards"]').exists()).toBe(true)
  })

  it('shows zero values when months is empty', () => {
    const wrapper = mount(TrendsSummaryCards, { props: { months: [] } })
    expect(wrapper.find('[data-testid="summary-income"]').text()).toContain('0')
    expect(wrapper.find('[data-testid="summary-expenses"]').text()).toContain('0')
    expect(wrapper.find('[data-testid="summary-net"]').text()).toContain('0')
    expect(wrapper.find('[data-testid="summary-avg-spend"]').text()).toContain('0')
  })

  it('totals income correctly across months', () => {
    const months = [
      makeMonth(5000, 3000, '2026-01-01'),
      makeMonth(4500, 2800, '2026-02-01'),
    ]
    const wrapper = mount(TrendsSummaryCards, { props: { months } })
    // 5000 + 4500 = 9500
    expect(wrapper.find('[data-testid="summary-income"]').text()).toContain('9,500')
  })

  it('totals expenses correctly across months', () => {
    const months = [
      makeMonth(5000, 3000, '2026-01-01'),
      makeMonth(4500, 2800, '2026-02-01'),
    ]
    const wrapper = mount(TrendsSummaryCards, { props: { months } })
    // 3000 + 2800 = 5800
    expect(wrapper.find('[data-testid="summary-expenses"]').text()).toContain('5,800')
  })

  it('computes net (income - expenses) correctly', () => {
    const months = [makeMonth(5000, 3000)]
    const wrapper = mount(TrendsSummaryCards, { props: { months } })
    // net = 5000 - 3000 = 2000
    expect(wrapper.find('[data-testid="summary-net"]').text()).toContain('2,000')
  })

  it('shows positive sign for net when income > expenses', () => {
    const months = [makeMonth(5000, 3000)]
    const wrapper = mount(TrendsSummaryCards, { props: { months } })
    expect(wrapper.find('[data-testid="summary-net"]').text()).toContain('+')
  })

  it('computes average monthly spend correctly', () => {
    const months = [
      makeMonth(5000, 3000, '2026-01-01'),
      makeMonth(4500, 2000, '2026-02-01'),
    ]
    const wrapper = mount(TrendsSummaryCards, { props: { months } })
    // avg = (3000 + 2000) / 2 = 2500
    expect(wrapper.find('[data-testid="summary-avg-spend"]').text()).toContain('2,500')
  })

  it('renders income label', () => {
    const wrapper = mount(TrendsSummaryCards, { props: { months: [] } })
    expect(wrapper.find('[data-testid="summary-income"]').text()).toContain('Income')
  })

  it('renders expenses label', () => {
    const wrapper = mount(TrendsSummaryCards, { props: { months: [] } })
    expect(wrapper.find('[data-testid="summary-expenses"]').text()).toContain('Expenses')
  })

  it('renders net label', () => {
    const wrapper = mount(TrendsSummaryCards, { props: { months: [] } })
    expect(wrapper.find('[data-testid="summary-net"]').text()).toContain('Net')
  })

  it('renders average monthly spend label', () => {
    const wrapper = mount(TrendsSummaryCards, { props: { months: [] } })
    expect(wrapper.find('[data-testid="summary-avg-spend"]').text()).toContain('Avg Monthly Spend')
  })
})
