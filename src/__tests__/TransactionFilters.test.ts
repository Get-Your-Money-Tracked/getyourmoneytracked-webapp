import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionFilters from '@/components/transactions/TransactionFilters.vue'
import type { Account, Category } from '@/types'
import type { TransactionFilter } from '@/graphql/queries/transactions'

vi.mock('lucide-vue-next', () => ({
  Search: { template: '<span>search</span>' },
  Tag: { template: '<span>tag</span>' },
  X: { template: '<span>x</span>' },
}))

const accounts: Account[] = [
  { id: 'acc-1', name: 'Cash', type: 'CASH', currency: 'USD', balance: 100, icon: null, isDefault: true, includeInTotal: true },
  { id: 'acc-2', name: 'Bank', type: 'BANK', currency: 'USD', balance: 1000, icon: null, isDefault: false, includeInTotal: true },
]

const categories: Category[] = [
  { id: 'cat-1', name: 'Food', icon: '🍽️', color: '#FF9800', parentId: null, isDefault: true, sortOrder: 0 },
  { id: 'cat-2', name: 'Transport', icon: '🚗', color: '#2196F3', parentId: null, isDefault: false, sortOrder: 1 },
]

const defaultFilter: TransactionFilter = {
  type: null,
  categoryId: null,
  accountId: null,
  search: null,
  tags: null,
}

describe('TransactionFilters', () => {
  function mountFilters(filter: TransactionFilter = defaultFilter) {
    return mount(TransactionFilters, {
      props: { modelValue: filter, accounts, categories },
    })
  }

  it('renders All, Expenses, Income, Transfers type filter chips', () => {
    const wrapper = mountFilters()
    expect(wrapper.text()).toContain('All')
    expect(wrapper.text()).toContain('Expenses')
    expect(wrapper.text()).toContain('Income')
    expect(wrapper.text()).toContain('Transfers')
  })

  it('renders category filter dropdown', () => {
    const wrapper = mountFilters()
    expect(wrapper.find('select[aria-label="Filter by category"]').exists()).toBe(true)
  })

  it('renders account filter dropdown', () => {
    const wrapper = mountFilters()
    expect(wrapper.find('select[aria-label="Filter by account"]').exists()).toBe(true)
  })

  it('renders search input', () => {
    const wrapper = mountFilters()
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('marks All chip as active when no type filter', () => {
    const wrapper = mountFilters({ ...defaultFilter, type: null })
    const allBtn = wrapper.findAll('button').find((b) => b.text() === 'All')
    expect(allBtn?.classes().join(' ')).toContain('bg-primary')
  })

  it('marks Expenses chip as active when type is EXPENSE', () => {
    const wrapper = mountFilters({ ...defaultFilter, type: 'EXPENSE' })
    const expenseBtn = wrapper.findAll('button').find((b) => b.text() === 'Expenses')
    expect(expenseBtn?.classes().join(' ')).toContain('bg-primary')
  })

  it('emits update:modelValue with EXPENSE type when Expenses chip is clicked', async () => {
    const wrapper = mountFilters()
    const expenseBtn = wrapper.findAll('button').find((b) => b.text() === 'Expenses')
    await expenseBtn?.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')![0][0] as TransactionFilter
    expect(emitted.type).toBe('EXPENSE')
  })

  it('emits update:modelValue with null type when All chip is clicked', async () => {
    const wrapper = mountFilters({ ...defaultFilter, type: 'EXPENSE' })
    const allBtn = wrapper.findAll('button').find((b) => b.text() === 'All')
    await allBtn?.trigger('click')
    const emitted = wrapper.emitted('update:modelValue')![0][0] as TransactionFilter
    expect(emitted.type).toBeNull()
  })

  it('emits filter change when category is selected', async () => {
    const wrapper = mountFilters()
    const categorySelect = wrapper.find('select[aria-label="Filter by category"]')
    await categorySelect.setValue('cat-1')
    await categorySelect.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')![0][0] as TransactionFilter
    expect(emitted.categoryId).toBe('cat-1')
  })

  it('emits filter change when account is selected', async () => {
    const wrapper = mountFilters()
    const accountSelect = wrapper.find('select[aria-label="Filter by account"]')
    await accountSelect.setValue('acc-1')
    await accountSelect.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')![0][0] as TransactionFilter
    expect(emitted.accountId).toBe('acc-1')
  })

  it('populates category options from categories prop', () => {
    const wrapper = mountFilters()
    expect(wrapper.text()).toContain('Food')
    expect(wrapper.text()).toContain('Transport')
  })

  it('populates account options from accounts prop', () => {
    const wrapper = mountFilters()
    expect(wrapper.text()).toContain('Cash')
    expect(wrapper.text()).toContain('Bank')
  })

  it('renders tag filter input', () => {
    const wrapper = mountFilters()
    expect(wrapper.find('input[aria-label="Filter by tag"]').exists()).toBe(true)
  })

  it('emits filter with tags array when tag is typed', async () => {
    const wrapper = mountFilters()
    const tagInput = wrapper.find('input[aria-label="Filter by tag"]')
    await tagInput.setValue('vacation')
    await tagInput.trigger('input')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')!
    const lastFilter = emitted[emitted.length - 1][0] as TransactionFilter
    expect(lastFilter.tags).toEqual(['vacation'])
  })

  it('sanitizes tag input to lowercase alphanumeric', async () => {
    const wrapper = mountFilters()
    const tagInput = wrapper.find('input[aria-label="Filter by tag"]')
    await tagInput.setValue('My Tag!')
    await tagInput.trigger('input')
    const emitted = wrapper.emitted('update:modelValue')!
    const lastFilter = emitted[emitted.length - 1][0] as TransactionFilter
    expect(lastFilter.tags).toEqual(['mytag'])
  })

  it('emits null tags when tag input is cleared', async () => {
    const wrapper = mountFilters({ ...defaultFilter, tags: ['food'] })
    const clearBtn = wrapper.find('[aria-label="Clear tag filter"]')
    await clearBtn.trigger('click')
    const emitted = wrapper.emitted('update:modelValue')!
    const lastFilter = emitted[emitted.length - 1][0] as TransactionFilter
    expect(lastFilter.tags).toBeNull()
  })

  it('shows active styling when tag filter is set', () => {
    const wrapper = mountFilters({ ...defaultFilter, tags: ['food'] })
    const tagInput = wrapper.find('input[aria-label="Filter by tag"]')
    expect(tagInput.classes().join(' ')).toContain('bg-primary')
  })
})
