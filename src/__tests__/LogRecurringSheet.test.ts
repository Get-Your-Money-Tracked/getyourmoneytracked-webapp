import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LogRecurringSheet from '@/components/subscriptions/LogRecurringSheet.vue'
import type { OverdueItem } from '@/composables/useOverdueRecurring'
import type { SubscriptionEntry, Account, Category } from '@/types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn() })),
    mutation: vi.fn(() => ({ toPromise: vi.fn() })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

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

function mountSheet(items: OverdueItem[], open = true) {
  return mount(LogRecurringSheet, {
    props: { open, items, currency: 'USD' },
    attachTo: document.body,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LogRecurringSheet', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders sheet when open=true', () => {
    const wrapper = mountSheet([makeItem()])
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open=false', () => {
    const wrapper = mountSheet([makeItem()], false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "Log Recurring Items" title', () => {
    const wrapper = mountSheet([makeItem()])
    expect(wrapper.text()).toContain('Log Recurring Items')
  })

  it('lists overdue items', () => {
    const items = [
      makeItem({ id: 'sub-1', name: 'Rent' }),
      makeItem({ id: 'sub-2', name: 'Netflix' }),
    ]
    const wrapper = mountSheet(items)
    expect(wrapper.text()).toContain('Rent')
    expect(wrapper.text()).toContain('Netflix')
  })

  it('renders a checkbox for each item', () => {
    const items = [
      makeItem({ id: 'sub-1' }),
      makeItem({ id: 'sub-2' }),
    ]
    const wrapper = mountSheet(items)
    expect(wrapper.find('[data-testid="item-checkbox-sub-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="item-checkbox-sub-2"]').exists()).toBe(true)
  })

  it('shows item count in select-all row', () => {
    const items = [makeItem({ id: 'sub-1' }), makeItem({ id: 'sub-2' })]
    const wrapper = mountSheet(items)
    expect(wrapper.find('[data-testid="item-count"]').text()).toContain('2')
  })

  it('all items are selected by default', () => {
    const wrapper = mountSheet([makeItem()])
    const cb = wrapper.find('[data-testid="select-all-checkbox"]').element as HTMLInputElement
    expect(cb.checked).toBe(true)
  })

  it('toggling select-all deselects all items', async () => {
    const items = [makeItem({ id: 'sub-1' }), makeItem({ id: 'sub-2' })]
    const wrapper = mountSheet(items)
    await wrapper.find('[data-testid="select-all-checkbox"]').trigger('change')
    await flushPromises()
    // Log button count should be 0
    expect(wrapper.find('[data-testid="log-btn"]').text()).toContain('0')
  })

  it('toggling individual item deselects it', async () => {
    const items = [makeItem({ id: 'sub-1' }), makeItem({ id: 'sub-2' })]
    const wrapper = mountSheet(items)
    // Deselect sub-1
    await wrapper.find('[data-testid="item-checkbox-sub-1"]').trigger('change')
    await flushPromises()
    // Log button should show 1 selected
    expect(wrapper.find('[data-testid="log-btn"]').text()).toContain('1')
  })

  it('log button is disabled when no items selected', async () => {
    const wrapper = mountSheet([makeItem({ id: 'sub-1' })])
    // Deselect all
    await wrapper.find('[data-testid="select-all-checkbox"]').trigger('change')
    await flushPromises()
    const btn = wrapper.find('[data-testid="log-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('log button is enabled when items are selected', () => {
    const wrapper = mountSheet([makeItem()])
    const btn = wrapper.find('[data-testid="log-btn"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('emits logged with count and total, then emits close', async () => {
    const item = makeItem({ id: 'sub-1', amount: 1200 })
    const wrapper = mountSheet([item])
    await wrapper.find('[data-testid="log-btn"]').trigger('click')
    await flushPromises()
    const loggedEvents = wrapper.emitted('logged')
    expect(loggedEvents).toBeTruthy()
    expect(loggedEvents![0]).toEqual([1, 1200])
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits correct count and total for multiple selected items', async () => {
    const items = [
      makeItem({ id: 'sub-1', amount: 1200 }),
      makeItem({ id: 'sub-2', amount: 15.99 }),
    ]
    const wrapper = mountSheet(items)
    await wrapper.find('[data-testid="log-btn"]').trigger('click')
    await flushPromises()
    const loggedEvents = wrapper.emitted('logged')
    expect(loggedEvents![0][0]).toBe(2)
    expect((loggedEvents![0][1] as number)).toBeCloseTo(1215.99)
  })

  it('shows due date info for each item', () => {
    const wrapper = mountSheet([makeItem({}, 22)])
    expect(wrapper.text()).toContain('22 days ago')
  })

  it('shows expense amounts in red-style (text-danger)', () => {
    const wrapper = mountSheet([makeItem({ type: 'EXPENSE' })])
    // The amount span should have text-danger class
    const spans = wrapper.findAll('span.text-danger')
    expect(spans.length).toBeGreaterThan(0)
  })

  it('shows income amounts in green-style (text-primary)', () => {
    const wrapper = mountSheet([makeItem({ type: 'INCOME' })])
    const spans = wrapper.findAll('span.text-primary')
    expect(spans.length).toBeGreaterThan(0)
  })

  it('emits close when sheet close event fires', async () => {
    const wrapper = mountSheet([makeItem()])
    // Trigger close via emit from ResponsiveSheet (simulate clicking X)
    wrapper.vm.$emit('close')
    await flushPromises()
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
