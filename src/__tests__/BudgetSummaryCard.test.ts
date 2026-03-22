import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BudgetSummaryCard from '@/components/budgets/BudgetSummaryCard.vue'

function mountCard(totalBudgeted: number, totalSpent: number, currency = 'USD') {
  return mount(BudgetSummaryCard, {
    props: { totalBudgeted, totalSpent, currency },
  })
}

describe('BudgetSummaryCard', () => {
  it('renders without errors', () => {
    const wrapper = mountCard(500, 200)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders total budgeted amount', () => {
    const wrapper = mountCard(500, 200)
    expect(wrapper.find('[data-testid="total-budgeted"]').text()).toContain('$500.00')
  })

  it('renders total spent amount', () => {
    const wrapper = mountCard(500, 200)
    expect(wrapper.find('[data-testid="total-spent"]').text()).toContain('$200.00')
  })

  it('renders percentage label correctly', () => {
    const wrapper = mountCard(500, 250)
    // 50% of budget used
    expect(wrapper.find('[data-testid="summary-percent-label"]').text()).toContain('50%')
    expect(wrapper.find('[data-testid="summary-percent-label"]').text()).toContain('of budget used')
  })

  it('shows 0% when totalBudgeted is 0', () => {
    const wrapper = mountCard(0, 0)
    expect(wrapper.find('[data-testid="summary-percent-label"]').text()).toContain('0%')
  })

  it('applies text-danger to total spent when over budget', () => {
    const wrapper = mountCard(200, 250)
    expect(wrapper.find('[data-testid="total-spent"]').classes()).toContain('text-danger')
  })

  it('applies text-text-primary to total spent when under budget', () => {
    const wrapper = mountCard(300, 100)
    expect(wrapper.find('[data-testid="total-spent"]').classes()).toContain('text-text-primary')
  })

  it('renders a progress bar', () => {
    const wrapper = mountCard(200, 100)
    expect(wrapper.find('[data-testid="progress-fill"]').exists()).toBe(true)
  })

  it('renders the summary card element', () => {
    const wrapper = mountCard(300, 150)
    expect(wrapper.find('[data-testid="budget-summary-card"]').exists()).toBe(true)
  })
})
