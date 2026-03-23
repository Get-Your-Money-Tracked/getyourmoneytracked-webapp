import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GoalCard from '@/components/goals/GoalCard.vue'
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

function mountCard(goal: Goal, currency = 'USD') {
  return mount(GoalCard, {
    props: { goal, currency },
    attachTo: document.body,
  })
}

describe('GoalCard', () => {
  // ── Rendering ────────────────────────────────────────────────
  it('renders goal name', () => {
    const wrapper = mountCard(makeGoal({ name: 'Vacation' }))
    expect(wrapper.find('[data-testid="goal-name"]').text()).toBe('Vacation')
  })

  it('does not render target date when null', () => {
    const wrapper = mountCard(makeGoal({ targetDate: null }))
    expect(wrapper.find('[data-testid="goal-target-date"]').exists()).toBe(false)
  })

  it('renders formatted target date when provided', () => {
    const wrapper = mountCard(makeGoal({ targetDate: '2027-06-01' }))
    const el = wrapper.find('[data-testid="goal-target-date"]')
    expect(el.exists()).toBe(true)
    expect(el.text()).toContain('June 2027')
  })

  it('renders icon when provided', () => {
    const wrapper = mountCard(makeGoal({ icon: '✈️' }))
    expect(wrapper.text()).toContain('✈️')
  })

  it('renders default pig emoji when no icon', () => {
    const wrapper = mountCard(makeGoal({ icon: null }))
    expect(wrapper.text()).toContain('🐷')
  })

  // ── Progress bar ─────────────────────────────────────────────
  it('renders progress bar at 0% when no current amount', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 0, targetAmount: 1000 }))
    const fill = wrapper.find('[data-testid="goal-progress-fill"]')
    expect(fill.attributes('style')).toContain('width: 0%')
  })

  it('renders progress bar at 50% when half-way', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 500, targetAmount: 1000 }))
    const fill = wrapper.find('[data-testid="goal-progress-fill"]')
    expect(fill.attributes('style')).toContain('width: 50%')
  })

  it('caps progress bar at 100%', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 1500, targetAmount: 1000 }))
    const fill = wrapper.find('[data-testid="goal-progress-fill"]')
    expect(fill.attributes('style')).toContain('width: 100%')
  })

  // ── Progress bar color tiers ─────────────────────────────────
  it('uses bg-info when progress < 50%', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 400, targetAmount: 1000 }))
    expect(wrapper.find('[data-testid="goal-progress-fill"]').classes()).toContain('bg-info')
  })

  it('uses bg-primary when progress 50–79%', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 600, targetAmount: 1000 }))
    expect(wrapper.find('[data-testid="goal-progress-fill"]').classes()).toContain('bg-primary')
  })

  it('uses bg-warning when progress 80–99%', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 850, targetAmount: 1000 }))
    expect(wrapper.find('[data-testid="goal-progress-fill"]').classes()).toContain('bg-warning')
  })

  it('uses bg-primary when goal is reached (100%)', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 1000, targetAmount: 1000 }))
    expect(wrapper.find('[data-testid="goal-progress-fill"]').classes()).toContain('bg-primary')
  })

  // ── Reached state ────────────────────────────────────────────
  it('shows reached badge when goal is met', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 1000, targetAmount: 1000 }))
    expect(wrapper.find('[data-testid="goal-reached-badge"]').exists()).toBe(true)
  })

  it('hides reached badge when goal is not met', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 500, targetAmount: 1000 }))
    expect(wrapper.find('[data-testid="goal-reached-badge"]').exists()).toBe(false)
  })

  it('shows "Goal reached!" label when reached', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 1000, targetAmount: 1000 }))
    expect(wrapper.find('[data-testid="goal-progress-label"]').text()).toBe('Goal reached!')
  })

  it('shows percentage label when not reached', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 500, targetAmount: 1000 }))
    expect(wrapper.find('[data-testid="goal-progress-label"]').text()).toBe('50%')
  })

  // ── Amount display ───────────────────────────────────────────
  it('renders formatted amounts', () => {
    const wrapper = mountCard(makeGoal({ currentAmount: 250, targetAmount: 1000 }), 'USD')
    expect(wrapper.find('[data-testid="goal-amounts"]').text()).toContain('250')
    expect(wrapper.find('[data-testid="goal-amounts"]').text()).toContain('1,000')
  })

  // ── Click event ───────────────────────────────────────────────
  it('emits click event with goal when card is clicked', async () => {
    const goal = makeGoal()
    const wrapper = mountCard(goal)
    await wrapper.find('[data-testid="goal-card"]').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual([goal])
  })
})
