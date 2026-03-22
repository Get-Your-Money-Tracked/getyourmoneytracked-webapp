import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import BudgetProgressCard from '@/components/dashboard/BudgetProgressCard.vue'
import type { BudgetProgress } from '@/types'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

function makeBudget(overrides: Partial<BudgetProgress> = {}): BudgetProgress {
  return {
    budgetId: 'budget-1',
    categoryId: 'cat-1',
    categoryName: 'Food',
    categoryIcon: '🍽️',
    limit: 150,
    spent: 80,
    remaining: 70,
    percentUsed: 53,
    status: 'WARNING',
    ...overrides,
  }
}

function mountCard(budget: BudgetProgress, currency = 'USD') {
  return mount(BudgetProgressCard, {
    props: { budget, currency },
    global: { plugins: [router] },
  })
}

describe('BudgetProgressCard', () => {
  it('renders without errors', () => {
    const wrapper = mountCard(makeBudget())
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the category name', () => {
    const wrapper = mountCard(makeBudget({ categoryName: 'Food' }))
    expect(wrapper.text()).toContain('Food')
  })

  it('renders the category icon', () => {
    const wrapper = mountCard(makeBudget({ categoryIcon: '🍽️' }))
    expect(wrapper.text()).toContain('🍽️')
  })

  it('renders the percentage', () => {
    const wrapper = mountCard(makeBudget({ percentUsed: 53 }))
    expect(wrapper.find('[data-testid="budget-percentage"]').text()).toContain('53%')
  })

  it('renders spent and limit amounts', () => {
    const wrapper = mountCard(makeBudget({ spent: 80, limit: 150 }))
    const amounts = wrapper.find('[data-testid="budget-amounts"]').text()
    expect(amounts).toContain('80')
    expect(amounts).toContain('150')
  })

  it('shows "Over!" badge for EXCEEDED status', () => {
    const wrapper = mountCard(makeBudget({ status: 'EXCEEDED', percentUsed: 120 }))
    expect(wrapper.find('[data-testid="over-badge"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="over-badge"]').text()).toBe('Over!')
  })

  it('does not show "Over!" badge for WARNING status', () => {
    const wrapper = mountCard(makeBudget({ status: 'WARNING', percentUsed: 70 }))
    expect(wrapper.find('[data-testid="over-badge"]').exists()).toBe(false)
  })

  it('does not show "Over!" badge for ON_TRACK status', () => {
    const wrapper = mountCard(makeBudget({ status: 'ON_TRACK', percentUsed: 30 }))
    expect(wrapper.find('[data-testid="over-badge"]').exists()).toBe(false)
  })

  it('applies text-danger to percentage for EXCEEDED status', () => {
    const wrapper = mountCard(makeBudget({ status: 'EXCEEDED', percentUsed: 120 }))
    expect(wrapper.find('[data-testid="budget-percentage"]').classes()).toContain('text-danger')
  })

  it('applies text-warning to percentage for WARNING status', () => {
    const wrapper = mountCard(makeBudget({ status: 'WARNING', percentUsed: 70 }))
    expect(wrapper.find('[data-testid="budget-percentage"]').classes()).toContain('text-warning')
  })

  it('applies text-primary to percentage for ON_TRACK status', () => {
    const wrapper = mountCard(makeBudget({ status: 'ON_TRACK', percentUsed: 30 }))
    expect(wrapper.find('[data-testid="budget-percentage"]').classes()).toContain('text-primary')
  })

  it('renders a ProgressBar component', () => {
    const wrapper = mountCard(makeBudget())
    expect(wrapper.find('[data-testid="progress-fill"]').exists()).toBe(true)
  })

  it('renders fallback icon when categoryIcon is null', () => {
    const wrapper = mountCard(makeBudget({ categoryIcon: null }))
    expect(wrapper.text()).toContain('💰')
  })
})
