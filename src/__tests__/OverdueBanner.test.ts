import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OverdueBanner from '@/components/dashboard/OverdueBanner.vue'
import type { OverdueItem } from '@/composables/useOverdueRecurring'
import type { SubscriptionEntry, Account, Category } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeAccount(): Account {
  return {
    id: 'acc-1',
    name: 'Main Account',
    type: 'BANK',
    currency: 'USD',
    balance: 1000,
    icon: null,
    isDefault: true,
    includeInTotal: true,
  }
}

function makeCategory(): Category {
  return {
    id: 'cat-1',
    name: 'Housing',
    icon: null,
    color: null,
    parentId: null,
    isDefault: false,
    sortOrder: 0,
  }
}

function makeSub(overrides: Partial<SubscriptionEntry> = {}): SubscriptionEntry {
  return {
    id: 'sub-1',
    name: 'Rent',
    type: 'EXPENSE',
    amount: 1200,
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    nextDueDate: '2026-03-01',
    isActive: true,
    autoLog: true,
    pendingAmount: null,
    pendingEffectiveDate: null,
    category: makeCategory(),
    account: makeAccount(),
    ...overrides,
  }
}

function makeItem(overrides: Partial<SubscriptionEntry> = {}, daysOverdue = 22): OverdueItem {
  return { subscription: makeSub(overrides), daysOverdue }
}

function mountBanner(items: OverdueItem[], currency = 'USD') {
  return mount(OverdueBanner, {
    props: { items, currency },
    attachTo: document.body,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OverdueBanner', () => {
  it('renders with correct count (1 item)', () => {
    const wrapper = mountBanner([makeItem()])
    expect(wrapper.find('[data-testid="overdue-title"]').text()).toContain('1 overdue recurring item')
  })

  it('renders with correct count (3 items)', () => {
    const items = [
      makeItem({ id: 'sub-1' }),
      makeItem({ id: 'sub-2' }),
      makeItem({ id: 'sub-3' }),
    ]
    const wrapper = mountBanner(items)
    expect(wrapper.find('[data-testid="overdue-title"]').text()).toContain('3 overdue recurring items')
  })

  it('shows total for single expense item', () => {
    const wrapper = mountBanner([makeItem({ amount: 1200, type: 'EXPENSE' })])
    const total = wrapper.find('[data-testid="overdue-total"]').text()
    expect(total).toMatch(/1[,.]?200/)
  })

  it('shows total for income item', () => {
    const wrapper = mountBanner([makeItem({ amount: 3000, type: 'INCOME' })])
    const total = wrapper.find('[data-testid="overdue-total"]').text()
    expect(total).toMatch(/3[,.]?000/)
  })

  it('shows combined total when both expenses and income', () => {
    const items = [
      makeItem({ id: 'sub-1', amount: 1200, type: 'EXPENSE' }),
      makeItem({ id: 'sub-2', amount: 3000, type: 'INCOME' }),
    ]
    const wrapper = mountBanner(items)
    const total = wrapper.find('[data-testid="overdue-total"]').text()
    // Both amounts should appear somewhere in the label
    expect(total).toMatch(/1[,.]?200/)
    expect(total).toMatch(/3[,.]?000/)
  })

  it('emits dismiss when Dismiss button is clicked', async () => {
    const wrapper = mountBanner([makeItem()])
    await wrapper.find('[data-testid="overdue-dismiss-btn"]').trigger('click')
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  it('emits review when Review button is clicked', async () => {
    const wrapper = mountBanner([makeItem()])
    await wrapper.find('[data-testid="overdue-review-btn"]').trigger('click')
    expect(wrapper.emitted('review')).toBeTruthy()
  })

  it('renders the banner container', () => {
    const wrapper = mountBanner([makeItem()])
    expect(wrapper.find('[data-testid="overdue-banner"]').exists()).toBe(true)
  })
})
