import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import UpcomingBills from '@/components/dashboard/UpcomingBills.vue'
import type { UpcomingBill } from '@/types'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

function makeBill(id: string, name: string, dueDate: string): UpcomingBill {
  return {
    id,
    name,
    type: 'EXPENSE' as const,
    amount: 15.99,
    currency: 'USD',
    categoryId: null,
    accountId: 'acc-1',
    nextDueDate: dueDate,
    isActive: true,
  }
}

function mountBills(bills: UpcomingBill[]) {
  return mount(UpcomingBills, {
    props: { bills },
    global: { plugins: [router] },
  })
}

describe('UpcomingBills', () => {
  it('renders without errors when bills exist', () => {
    const wrapper = mountBills([makeBill('b1', 'Netflix', '2026-03-25')])
    expect(wrapper.exists()).toBe(true)
  })

  it('renders section header "Upcoming Recurring" when bills exist', () => {
    const wrapper = mountBills([makeBill('b1', 'Netflix', '2026-03-25')])
    expect(wrapper.find('[data-testid="upcoming-bills"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Upcoming Recurring')
  })

  it('renders bill items', () => {
    const wrapper = mountBills([
      makeBill('b1', 'Netflix', '2026-03-25'),
      makeBill('b2', 'Spotify', '2026-03-28'),
    ])
    expect(wrapper.find('[data-testid="bill-item-b1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="bill-item-b2"]').exists()).toBe(true)
  })

  it('hides the entire section when bills array is empty', () => {
    const wrapper = mountBills([])
    expect(wrapper.find('[data-testid="upcoming-bills"]').exists()).toBe(false)
  })

  it('renders today due bills with "Due today!" label', () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const wrapper = mountBills([makeBill('b1', 'Netflix', todayStr)])
    expect(wrapper.text()).toContain('Due today!')
  })
})
