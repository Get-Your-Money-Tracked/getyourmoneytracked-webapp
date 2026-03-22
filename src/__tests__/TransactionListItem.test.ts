import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionListItem from '@/components/transactions/TransactionListItem.vue'
import type { Transaction, Account, Category } from '@/types'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'EXPENSE',
    amount: 12.5,
    date: '2024-03-18',
    accountId: 'acc-1',
    toAccountId: null,
    categoryId: 'cat-1',
    description: null,
    notes: null,
    tags: [],
    receiptUrl: null,
    createdAt: '2024-03-18T10:00:00Z',
    updatedAt: '2024-03-18T10:00:00Z',
    ...overrides,
  }
}

const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Cash Wallet',
    type: 'CASH',
    currency: 'USD',
    balance: 100,
    icon: '💵',
    isDefault: true,
    includeInTotal: true,
  },
  {
    id: 'acc-2',
    name: 'Main Bank',
    type: 'BANK',
    currency: 'USD',
    balance: 2000,
    icon: '🏦',
    isDefault: false,
    includeInTotal: true,
  },
]

const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Food',
    icon: '🍽️',
    color: '#FF9800',
    parentId: null,
    isDefault: true,
    sortOrder: 0,
  },
  {
    id: 'cat-2',
    name: 'Transport',
    icon: '🚗',
    color: '#2196F3',
    parentId: null,
    isDefault: false,
    sortOrder: 1,
  },
]

describe('TransactionListItem', () => {
  function mountItem(tx: Transaction) {
    return mount(TransactionListItem, {
      props: { transaction: tx, accounts, categories },
    })
  }

  it('renders the category name when no description', () => {
    const tx = makeTransaction({ description: null, categoryId: 'cat-1' })
    const wrapper = mountItem(tx)
    expect(wrapper.text()).toContain('Food')
  })

  it('renders description when it exists', () => {
    const tx = makeTransaction({ description: 'Lunch at Chipotle' })
    const wrapper = mountItem(tx)
    expect(wrapper.text()).toContain('Lunch at Chipotle')
  })

  it('renders account name in sub-line for expense', () => {
    const tx = makeTransaction({ type: 'EXPENSE', accountId: 'acc-1' })
    const wrapper = mountItem(tx)
    expect(wrapper.text()).toContain('Cash Wallet')
  })

  it('renders formatted amount with minus prefix for expense', () => {
    const tx = makeTransaction({ type: 'EXPENSE', amount: 12.5 })
    const wrapper = mountItem(tx)
    expect(wrapper.text()).toContain('-$12.50')
  })

  it('renders formatted amount with plus prefix for income', () => {
    const tx = makeTransaction({ type: 'INCOME', amount: 3000 })
    const wrapper = mountItem(tx)
    expect(wrapper.text()).toContain('+$3,000.00')
  })

  it('renders formatted amount without sign for transfer', () => {
    const tx = makeTransaction({
      type: 'TRANSFER',
      amount: 500,
      toAccountId: 'acc-2',
      categoryId: null,
    })
    const wrapper = mountItem(tx)
    expect(wrapper.text()).toContain('$500.00')
    expect(wrapper.text()).not.toContain('-$500')
    expect(wrapper.text()).not.toContain('+$500')
  })

  it('applies danger text class for expense amount', () => {
    const tx = makeTransaction({ type: 'EXPENSE' })
    const wrapper = mountItem(tx)
    const amountSpan = wrapper.find('span.text-danger')
    expect(amountSpan.exists()).toBe(true)
  })

  it('applies primary text class for income amount', () => {
    const tx = makeTransaction({ type: 'INCOME' })
    const wrapper = mountItem(tx)
    const amountSpan = wrapper.find('span.text-primary')
    expect(amountSpan.exists()).toBe(true)
  })

  it('applies info text class for transfer amount', () => {
    const tx = makeTransaction({ type: 'TRANSFER', categoryId: null, toAccountId: 'acc-2' })
    const wrapper = mountItem(tx)
    const amountSpan = wrapper.find('span.text-info')
    expect(amountSpan.exists()).toBe(true)
  })

  it('shows "From → To" sub-line for transfer', () => {
    const tx = makeTransaction({
      type: 'TRANSFER',
      accountId: 'acc-1',
      toAccountId: 'acc-2',
      categoryId: null,
    })
    const wrapper = mountItem(tx)
    expect(wrapper.text()).toContain('Cash Wallet')
    expect(wrapper.text()).toContain('Main Bank')
    expect(wrapper.text()).toContain('→')
  })

  it('shows tag chips when transaction has tags', () => {
    const tx = makeTransaction({ tags: ['food', 'vacation'] })
    const wrapper = mountItem(tx)
    expect(wrapper.text()).toContain('food')
    expect(wrapper.text()).toContain('vacation')
  })

  it('does not show tag chips when transaction has no tags', () => {
    const tx = makeTransaction({ tags: [] })
    const wrapper = mountItem(tx)
    // No tag chip divs visible
    expect(wrapper.find('.flex.flex-wrap').exists()).toBe(false)
  })

  it('shows max 3 tags and "+N more" overflow indicator', () => {
    const tx = makeTransaction({ tags: ['aa', 'bb', 'cc', 'dd', 'ee'] })
    const wrapper = mountItem(tx)
    // Only first 3 tags should be visible as chip spans
    const tagChips = wrapper.findAll('.flex.flex-wrap span')
    const tagTexts = tagChips.map((s) => s.text())
    expect(tagTexts).toContain('aa')
    expect(tagTexts).toContain('bb')
    expect(tagTexts).toContain('cc')
    expect(tagTexts).toContain('+2 more')
    expect(tagTexts).not.toContain('dd')
    expect(tagTexts).not.toContain('ee')
  })

  it('emits select event with transaction when clicked', async () => {
    const tx = makeTransaction()
    const wrapper = mountItem(tx)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([tx])
  })
})
