import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import SearchFilterSheet from '@/components/search/SearchFilterSheet.vue'
import type { SearchFilters } from '@/composables/useSearch'
import { createEmptyFilters } from '@/composables/useSearch'
import type { Category, Account } from '@/types'

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

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => reactive({ isDesktop: false }),
}))

const categories: Category[] = [
  { id: 'cat-1', name: 'Food', icon: '🍕', color: '#10b981', parentId: null, isDefault: false, sortOrder: 0 },
  { id: 'cat-2', name: 'Transport', icon: '🚕', color: '#3b82f6', parentId: null, isDefault: false, sortOrder: 1 },
]

const accounts: Account[] = [
  { id: 'acc-1', name: 'Main Account', type: 'BANK', currency: 'USD', balance: 0, icon: null, isDefault: true, includeInTotal: true },
]

function makeFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
  return { ...createEmptyFilters(), ...overrides }
}

function mountSheet(open = true, filters = makeFilters(), availableTags = ['food', 'travel']) {
  return mount(SearchFilterSheet, {
    props: { open, modelValue: filters, categories, accounts, availableTags },
    attachTo: document.body,
  })
}

describe('SearchFilterSheet', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders when open', async () => {
    const wrapper = mountSheet(true)
    await flushPromises()
    expect(wrapper.find('[data-testid="search-filter-sheet"]').exists()).toBe(true)
  })

  it('does not render body when closed', async () => {
    const wrapper = mountSheet(false)
    await flushPromises()
    expect(wrapper.find('[data-testid="search-filter-sheet"]').exists()).toBe(false)
  })

  it('renders date range inputs', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    expect(wrapper.find('[data-testid="filter-start-date"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="filter-end-date"]').exists()).toBe(true)
  })

  it('renders category selector with options', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    const select = wrapper.find('[data-testid="filter-category"]')
    expect(select.exists()).toBe(true)
    expect(select.text()).toContain('Food')
    expect(select.text()).toContain('Transport')
  })

  it('renders account selector with options', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    const select = wrapper.find('[data-testid="filter-account"]')
    expect(select.exists()).toBe(true)
    expect(select.text()).toContain('Main Account')
  })

  it('renders type toggle with all options', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    const toggle = wrapper.find('[data-testid="filter-type-toggle"]')
    expect(toggle.text()).toContain('All')
    expect(toggle.text()).toContain('Expense')
    expect(toggle.text()).toContain('Income')
    expect(toggle.text()).toContain('Transfer')
  })

  it('renders amount range inputs', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    expect(wrapper.find('[data-testid="filter-min-amount"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="filter-max-amount"]').exists()).toBe(true)
  })

  it('renders available tag chips', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    expect(wrapper.find('[data-testid="filter-tag-food"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="filter-tag-travel"]').exists()).toBe(true)
  })

  it('emits apply with current draft when Apply is clicked', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="filter-apply-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('apply')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('clear button resets draft and apply emits empty filters', async () => {
    const wrapper = mountSheet(true, makeFilters({ categoryId: 'cat-1', type: 'EXPENSE' }))
    await flushPromises()

    // Clear the draft
    await wrapper.find('[data-testid="filter-clear-btn"]').trigger('click')
    await flushPromises()

    // Then apply and check emitted value has null categoryId
    await wrapper.find('[data-testid="filter-apply-btn"]').trigger('click')
    await flushPromises()

    const emittedApply = wrapper.emitted('apply')
    expect(emittedApply).toBeTruthy()
    const appliedFilters = (emittedApply![0] as SearchFilters[])[0]
    expect(appliedFilters.categoryId).toBeNull()
    expect(appliedFilters.type).toBeNull()
  })

  it('clicking a tag chip toggles selection', async () => {
    const wrapper = mountSheet()
    await flushPromises()

    const foodChip = wrapper.find('[data-testid="filter-tag-food"]')
    expect(foodChip.classes()).not.toContain('bg-primary')

    await foodChip.trigger('click')
    await flushPromises()

    expect(foodChip.classes()).toContain('bg-primary')

    // Click again to deselect
    await foodChip.trigger('click')
    await flushPromises()
    expect(foodChip.classes()).not.toContain('bg-primary')
  })

  it('emits close when sheet is dismissed', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    // Click backdrop
    const backdrop = document.body.querySelector('[aria-hidden="true"]') as HTMLElement
    if (backdrop) backdrop.click()
    await flushPromises()
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
