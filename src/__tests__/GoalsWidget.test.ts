import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import GoalsWidget from '@/components/dashboard/GoalsWidget.vue'
import type { Goal } from '@/types'

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    name: 'Emergency Fund',
    targetAmount: 1000,
    currentAmount: 0,
    targetDate: null,
    icon: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/goals', component: { template: '<div/>' } },
    ],
  })
}

function mountWidget(goals: Goal[], currency = 'USD') {
  return mount(GoalsWidget, {
    props: { goals, currency },
    global: { plugins: [makeRouter()] },
    attachTo: document.body,
  })
}

describe('GoalsWidget', () => {
  // ── Visibility ───────────────────────────────────────────────
  it('does not render when goals array is empty', () => {
    const wrapper = mountWidget([])
    expect(wrapper.find('[data-testid="goals-widget"]').exists()).toBe(false)
  })

  it('renders when goals array has items', () => {
    const wrapper = mountWidget([makeGoal()])
    expect(wrapper.find('[data-testid="goals-widget"]').exists()).toBe(true)
  })

  // ── Content ──────────────────────────────────────────────────
  it('renders "Savings Goals" header', () => {
    const wrapper = mountWidget([makeGoal()])
    expect(wrapper.text()).toContain('Savings Goals')
  })

  it('renders "See all →" button', () => {
    const wrapper = mountWidget([makeGoal()])
    expect(wrapper.find('[data-testid="see-all-goals-link"]').exists()).toBe(true)
  })

  it('renders a row for each goal up to 3', () => {
    const goals = [
      makeGoal({ id: 'g1', name: 'A' }),
      makeGoal({ id: 'g2', name: 'B' }),
      makeGoal({ id: 'g3', name: 'C' }),
    ]
    const wrapper = mountWidget(goals)
    expect(wrapper.find('[data-testid="goals-widget-item-g1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="goals-widget-item-g2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="goals-widget-item-g3"]').exists()).toBe(true)
  })

  it('shows only first 3 goals when more than 3 provided', () => {
    const goals = [
      makeGoal({ id: 'g1' }),
      makeGoal({ id: 'g2' }),
      makeGoal({ id: 'g3' }),
      makeGoal({ id: 'g4' }),
    ]
    const wrapper = mountWidget(goals)
    expect(wrapper.find('[data-testid="goals-widget-item-g4"]').exists()).toBe(false)
  })

  it('renders goal name in each row', () => {
    const wrapper = mountWidget([makeGoal({ name: 'Vacation Fund' })])
    expect(wrapper.text()).toContain('Vacation Fund')
  })

  it('renders goal icon when present', () => {
    const wrapper = mountWidget([makeGoal({ icon: '✈️' })])
    expect(wrapper.text()).toContain('✈️')
  })

  it('renders mini progress bar for each goal', () => {
    const wrapper = mountWidget([makeGoal({ id: 'g1' })])
    const item = wrapper.find('[data-testid="goals-widget-item-g1"]')
    expect(item.find('.h-1').exists()).toBe(true)
  })

  // ── Navigation ───────────────────────────────────────────────
  it('navigates to /goals when "See all →" is clicked', async () => {
    const router = makeRouter()
    const wrapper = mount(GoalsWidget, {
      props: { goals: [makeGoal()], currency: 'USD' },
      global: { plugins: [router] },
      attachTo: document.body,
    })
    await wrapper.find('[data-testid="see-all-goals-link"]').trigger('click')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/goals')
  })
})
