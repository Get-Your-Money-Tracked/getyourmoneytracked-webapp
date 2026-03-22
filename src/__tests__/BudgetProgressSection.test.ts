import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import BudgetProgressSection from '@/components/dashboard/BudgetProgressSection.vue'
import type { BudgetProgress } from '@/types'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

function makeBudget(id: string, name: string, percentUsed: number, status: BudgetProgress['status']): BudgetProgress {
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

function mountSection(budgets: BudgetProgress[], currency = 'USD') {
  return mount(BudgetProgressSection, {
    props: { budgets, currency },
    global: { plugins: [router] },
  })
}

describe('BudgetProgressSection', () => {
  it('renders without errors', () => {
    const wrapper = mountSection([makeBudget('b1', 'Food', 40, 'ON_TRACK')])
    expect(wrapper.exists()).toBe(true)
  })

  it('renders section header "Budget Tracking"', () => {
    const wrapper = mountSection([makeBudget('b1', 'Food', 40, 'ON_TRACK')])
    expect(wrapper.text()).toContain('Budget Tracking')
  })

  it('renders "View all" link when budgets exist', () => {
    const wrapper = mountSection([makeBudget('b1', 'Food', 40, 'ON_TRACK')])
    expect(wrapper.find('[data-testid="view-all-link"]').exists()).toBe(true)
  })

  it('renders at most 3 budgets', () => {
    const budgets = [
      makeBudget('b1', 'Food', 90, 'EXCEEDED'),
      makeBudget('b2', 'Transport', 70, 'WARNING'),
      makeBudget('b3', 'Entertainment', 30, 'ON_TRACK'),
      makeBudget('b4', 'Health', 20, 'ON_TRACK'),
    ]
    const wrapper = mountSection(budgets)
    expect(wrapper.find('[data-testid="budget-card-b1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="budget-card-b2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="budget-card-b3"]').exists()).toBe(true)
    // 4th budget not rendered
    expect(wrapper.find('[data-testid="budget-card-b4"]').exists()).toBe(false)
  })

  it('sorts budgets by percentUsed DESC (worst performing first)', () => {
    const budgets = [
      makeBudget('b1', 'Food', 30, 'ON_TRACK'),
      makeBudget('b2', 'Transport', 90, 'EXCEEDED'),
      makeBudget('b3', 'Entertainment', 65, 'WARNING'),
    ]
    const wrapper = mountSection(budgets)
    const cards = wrapper.findAll('[data-testid^="budget-card-"]')
    expect(cards[0].attributes('data-testid')).toBe('budget-card-b2') // 90% first
    expect(cards[1].attributes('data-testid')).toBe('budget-card-b3') // 65% second
    expect(cards[2].attributes('data-testid')).toBe('budget-card-b1') // 30% third
  })

  it('shows empty state when no budgets', () => {
    const wrapper = mountSection([])
    expect(wrapper.find('[data-testid="budget-empty-state"]').exists()).toBe(true)
  })

  it('shows "No budgets set." text in empty state', () => {
    const wrapper = mountSection([])
    expect(wrapper.text()).toContain('No budgets set.')
  })

  it('shows "Create budget" CTA in empty state', () => {
    const wrapper = mountSection([])
    expect(wrapper.find('[data-testid="create-budget-link"]').exists()).toBe(true)
  })

  it('does not show "View all" link when no budgets', () => {
    const wrapper = mountSection([])
    expect(wrapper.find('[data-testid="view-all-link"]').exists()).toBe(false)
  })

  it('does not show empty state when budgets exist', () => {
    const wrapper = mountSection([makeBudget('b1', 'Food', 40, 'ON_TRACK')])
    expect(wrapper.find('[data-testid="budget-empty-state"]').exists()).toBe(false)
  })
})
