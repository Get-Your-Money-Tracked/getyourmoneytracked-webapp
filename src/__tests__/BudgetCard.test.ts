import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import BudgetCard from '@/components/budgets/BudgetCard.vue'
import type { Budget } from '@/types'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    name: '',
    month: '2026-03-01',
    amount: 200,
    spent: 80,
    remaining: 120,
    percentUsed: 40,
    category: {
      id: 'cat-1',
      name: 'Food',
      icon: '🍽️',
      color: '#FF9800',
      parentId: null,
      isDefault: false,
      sortOrder: 0,
    },
    ...overrides,
  }
}

function mountCard(budget: Budget, currency = 'USD') {
  return mount(BudgetCard, {
    props: { budget, currency },
    global: { plugins: [router] },
  })
}

describe('BudgetCard', () => {
  it('renders without errors', () => {
    const wrapper = mountCard(makeBudget())
    expect(wrapper.exists()).toBe(true)
  })

  it('renders category name', () => {
    const wrapper = mountCard(makeBudget({ category: { id: 'c1', name: 'Transport', icon: '🚗', color: null, parentId: null, isDefault: false, sortOrder: 0 } }))
    expect(wrapper.find('[data-testid="budget-category-name"]').text()).toBe('Transport')
  })

  it('renders category icon', () => {
    const wrapper = mountCard(makeBudget())
    expect(wrapper.text()).toContain('🍽️')
  })

  it('renders fallback icon when category icon is null', () => {
    const wrapper = mountCard(makeBudget({ category: { id: 'c1', name: 'Other', icon: null, color: null, parentId: null, isDefault: false, sortOrder: 0 } }))
    expect(wrapper.text()).toContain('💰')
  })

  it('renders percentage', () => {
    const wrapper = mountCard(makeBudget({ percentUsed: 40 }))
    expect(wrapper.find('[data-testid="budget-percent"]').text()).toBe('40%')
  })

  it('renders spent and amount', () => {
    const wrapper = mountCard(makeBudget({ spent: 80, amount: 200 }))
    const amounts = wrapper.find('[data-testid="budget-amounts"]').text()
    expect(amounts).toContain('$80.00')
    expect(amounts).toContain('$200.00')
  })

  it('shows "Over!" badge when percentUsed > 100', () => {
    const wrapper = mountCard(makeBudget({ percentUsed: 120, spent: 240, amount: 200 }))
    expect(wrapper.find('[data-testid="over-budget-badge"]').exists()).toBe(true)
  })

  it('does not show "Over!" badge when percentUsed <= 100', () => {
    const wrapper = mountCard(makeBudget({ percentUsed: 80 }))
    expect(wrapper.find('[data-testid="over-budget-badge"]').exists()).toBe(false)
  })

  it('applies text-danger class to percent when exceeded', () => {
    const wrapper = mountCard(makeBudget({ percentUsed: 120 }))
    const pct = wrapper.find('[data-testid="budget-percent"]')
    expect(pct.classes()).toContain('text-danger')
  })

  it('applies text-warning class to percent when warning (51-100%)', () => {
    const wrapper = mountCard(makeBudget({ percentUsed: 75 }))
    const pct = wrapper.find('[data-testid="budget-percent"]')
    expect(pct.classes()).toContain('text-warning')
  })

  it('applies text-primary class to percent when on-track (<=50%)', () => {
    const wrapper = mountCard(makeBudget({ percentUsed: 40 }))
    const pct = wrapper.find('[data-testid="budget-percent"]')
    expect(pct.classes()).toContain('text-primary')
  })

  it('renders a ProgressBar component', () => {
    const wrapper = mountCard(makeBudget())
    expect(wrapper.find('[data-testid="progress-fill"]').exists()).toBe(true)
  })

  it('emits edit event with budget when clicked', async () => {
    const budget = makeBudget()
    const wrapper = mountCard(budget)
    await wrapper.find(`[data-testid="budget-card-${budget.id}"]`).trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([budget])
  })
})
