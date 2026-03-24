import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import UpcomingBillItem from '@/components/dashboard/UpcomingBillItem.vue'
import type { UpcomingBill } from '@/types'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

function makeBill(overrides: Partial<UpcomingBill> = {}): UpcomingBill {
  return {
    id: 'bill-1',
    name: 'Netflix',
    type: 'EXPENSE' as const,
    amount: 15.99,
    currency: 'USD',
    categoryId: null,
    accountId: 'acc-1',
    frequency: 'MONTHLY',
    nextDueDate: '2026-03-25',
    isActive: true,
    autoLog: false,
    ...overrides,
  }
}

function mountBill(bill: UpcomingBill) {
  return mount(UpcomingBillItem, {
    props: { bill },
    global: { plugins: [router] },
  })
}

describe('UpcomingBillItem', () => {
  it('renders without errors', () => {
    const wrapper = mountBill(makeBill())
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the bill name', () => {
    const wrapper = mountBill(makeBill({ name: 'Netflix' }))
    expect(wrapper.text()).toContain('Netflix')
  })

  it('renders the bill amount', () => {
    const wrapper = mountBill(makeBill({ amount: 15.99, currency: 'USD' }))
    expect(wrapper.text()).toContain('15.99')
  })

  it('renders "Due Mar 25" for a future date', () => {
    const wrapper = mountBill(makeBill({ nextDueDate: '2026-03-25' }))
    expect(wrapper.find('[data-testid="due-date-label"]').text()).toContain('Due')
    expect(wrapper.find('[data-testid="due-date-label"]').text()).toContain('Mar 25')
  })

  it('renders "Due today!" for today\'s date', () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`

    const wrapper = mountBill(makeBill({ nextDueDate: todayStr }))
    expect(wrapper.find('[data-testid="due-date-label"]').text()).toBe('Due today!')
  })

  it('applies text-warning class for "Due today!"', () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`

    const wrapper = mountBill(makeBill({ nextDueDate: todayStr }))
    expect(wrapper.find('[data-testid="due-date-label"]').classes()).toContain('text-warning')
  })

  it('shows pulsing amber dot for "Due today!"', () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`

    const wrapper = mountBill(makeBill({ nextDueDate: todayStr }))
    expect(wrapper.find('[data-testid="due-today-dot"]').exists()).toBe(true)
  })

  it('does not show pulsing dot for a future date', () => {
    const wrapper = mountBill(makeBill({ nextDueDate: '2099-12-31' }))
    expect(wrapper.find('[data-testid="due-today-dot"]').exists()).toBe(false)
  })

  it('applies text-text-muted class for a non-today date', () => {
    const wrapper = mountBill(makeBill({ nextDueDate: '2099-12-31' }))
    expect(wrapper.find('[data-testid="due-date-label"]').classes()).toContain('text-text-muted')
  })
})
