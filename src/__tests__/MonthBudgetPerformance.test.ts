import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import MonthBudgetPerformance from '@/components/history/MonthBudgetPerformance.vue'
import type { BudgetProgress } from '@/types'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

function makeBudget(
  id: string,
  name: string,
  percentUsed: number,
  status: BudgetProgress['status'],
): BudgetProgress {
  return {
    budgetId: id,
    categoryId: id,
    categoryName: name,
    categoryIcon: '💰',
    limit: 100,
    spent: percentUsed,
    remaining: 100 - percentUsed,
    percentUsed,
    status,
  }
}

function mountSection(budgets: BudgetProgress[], currency = 'USD', monthLabel = 'March 2026') {
  return mount(MonthBudgetPerformance, {
    props: { budgets, currency, monthLabel },
    global: { plugins: [router] },
  })
}

describe('MonthBudgetPerformance', () => {
  it('renders without errors', () => {
    const wrapper = mountSection([makeBudget('b1', 'Food', 40, 'ON_TRACK')])
    expect(wrapper.exists()).toBe(true)
  })

  it('renders a budget card for each budget', () => {
    const budgets = [
      makeBudget('b1', 'Food', 40, 'ON_TRACK'),
      makeBudget('b2', 'Transport', 70, 'WARNING'),
      makeBudget('b3', 'Entertainment', 90, 'EXCEEDED'),
    ]
    const wrapper = mountSection(budgets)
    expect(wrapper.find('[data-testid="budget-card-b1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="budget-card-b2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="budget-card-b3"]').exists()).toBe(true)
  })

  it('renders MORE than 3 budgets (unlike BudgetProgressSection)', () => {
    const budgets = [
      makeBudget('b1', 'Food', 40, 'ON_TRACK'),
      makeBudget('b2', 'Transport', 70, 'WARNING'),
      makeBudget('b3', 'Entertainment', 90, 'EXCEEDED'),
      makeBudget('b4', 'Health', 20, 'ON_TRACK'),
      makeBudget('b5', 'Utilities', 55, 'WARNING'),
    ]
    const wrapper = mountSection(budgets)
    // All 5 should appear
    expect(wrapper.find('[data-testid="budget-card-b1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="budget-card-b4"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="budget-card-b5"]').exists()).toBe(true)
  })

  it('shows empty state when no budgets', () => {
    const wrapper = mountSection([])
    expect(wrapper.find('[data-testid="budget-empty-state"]').exists()).toBe(true)
  })

  it('shows the month name in the empty state', () => {
    const wrapper = mountSection([], 'USD', 'March 2026')
    expect(wrapper.text()).toContain('March 2026')
  })

  it('shows correct empty state message', () => {
    const wrapper = mountSection([], 'USD', 'December 2025')
    expect(wrapper.text()).toContain('No budgets were set for December 2025')
  })

  it('does not show empty state when budgets exist', () => {
    const wrapper = mountSection([makeBudget('b1', 'Food', 40, 'ON_TRACK')])
    expect(wrapper.find('[data-testid="budget-empty-state"]').exists()).toBe(false)
  })

  it('renders budget list when budgets exist', () => {
    const wrapper = mountSection([makeBudget('b1', 'Food', 40, 'ON_TRACK')])
    expect(wrapper.find('[data-testid="budget-list"]').exists()).toBe(true)
  })

  it('does not limit to 3 budgets — shows all 6', () => {
    const budgets = Array.from({ length: 6 }, (_, i) =>
      makeBudget(`b${i + 1}`, `Cat ${i + 1}`, i * 10, 'ON_TRACK'),
    )
    const wrapper = mountSection(budgets)
    const cards = wrapper.findAll('[data-testid^="budget-card-"]')
    expect(cards.length).toBe(6)
  })
})
