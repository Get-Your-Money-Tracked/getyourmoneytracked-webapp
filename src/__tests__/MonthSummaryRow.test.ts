import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import MonthSummaryRow from '@/components/history/MonthSummaryRow.vue'
import type { MonthlySummary } from '@/types'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/history/:month', component: { template: '<div/>' } },
  ],
})

function makeSummary(overrides: Partial<MonthlySummary> = {}): MonthlySummary {
  return {
    month: '2026-03',
    totalIncome: 3000,
    totalExpenses: 1200,
    percentSpent: 40,
    ...overrides,
  }
}

function mountRow(summary: MonthlySummary, currency = 'USD') {
  return mount(MonthSummaryRow, {
    props: { summary, currency },
    global: { plugins: [router] },
  })
}

describe('MonthSummaryRow', () => {
  it('renders without errors', () => {
    const wrapper = mountRow(makeSummary())
    expect(wrapper.exists()).toBe(true)
  })

  it('displays the formatted month name', () => {
    const wrapper = mountRow(makeSummary({ month: '2026-03' }))
    expect(wrapper.find('[data-testid="month-name"]').text()).toBe('March 2026')
  })

  it('displays month name for December 2025', () => {
    const wrapper = mountRow(makeSummary({ month: '2025-12' }))
    expect(wrapper.find('[data-testid="month-name"]').text()).toBe('December 2025')
  })

  it('displays month name for January 2024', () => {
    const wrapper = mountRow(makeSummary({ month: '2024-01' }))
    expect(wrapper.find('[data-testid="month-name"]').text()).toBe('January 2024')
  })

  it('displays formatted income amount', () => {
    const wrapper = mountRow(makeSummary({ totalIncome: 3000 }))
    expect(wrapper.find('[data-testid="income-amount"]').text()).toContain('3,000')
  })

  it('displays formatted expenses amount', () => {
    const wrapper = mountRow(makeSummary({ totalExpenses: 1200 }))
    expect(wrapper.find('[data-testid="expenses-amount"]').text()).toContain('1,200')
  })

  it('renders a PercentBadge with the correct percent', () => {
    const wrapper = mountRow(makeSummary({ percentSpent: 40 }))
    expect(wrapper.find('[data-testid="percent-badge"]').text()).toBe('40%')
  })

  it('renders warning percent badge for 70%', () => {
    const wrapper = mountRow(makeSummary({ percentSpent: 70 }))
    expect(wrapper.find('[data-testid="percent-badge"]').classes()).toContain('text-warning')
  })

  it('renders danger percent badge for 89%', () => {
    const wrapper = mountRow(makeSummary({ percentSpent: 89 }))
    expect(wrapper.find('[data-testid="percent-badge"]').classes()).toContain('text-danger')
  })

  it('renders danger percent badge for 95%', () => {
    const wrapper = mountRow(makeSummary({ percentSpent: 95 }))
    expect(wrapper.find('[data-testid="percent-badge"]').classes()).toContain('text-danger')
  })

  it('renders pulsing badge for overspent (106%)', () => {
    const wrapper = mountRow(makeSummary({ percentSpent: 106 }))
    expect(wrapper.find('[data-testid="percent-badge"]').classes()).toContain('animate-pulse')
  })

  it('navigates to /history/YYYY-MM on click', async () => {
    const wrapper = mountRow(makeSummary({ month: '2026-03' }))
    const pushSpy = vi.spyOn(router, 'push')
    await wrapper.find('[data-testid="month-summary-row"]').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/history/2026-03')
  })

  it('shows income in green (text-primary class)', () => {
    const wrapper = mountRow(makeSummary())
    expect(wrapper.find('[data-testid="income-amount"]').classes()).toContain('text-primary')
  })

  it('shows expenses in red (text-danger class)', () => {
    const wrapper = mountRow(makeSummary())
    expect(wrapper.find('[data-testid="expenses-amount"]').classes()).toContain('text-danger')
  })
})
