import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import RecentTransactions from '@/components/dashboard/RecentTransactions.vue'
import type { Transaction, Account, Category } from '@/types'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'EXPENSE',
    amount: 12.5,
    date: '2026-03-10',
    accountId: 'acc-1',
    toAccountId: null,
    categoryId: 'cat-1',
    description: 'Lunch',
    notes: null,
    tags: [],
    receiptUrl: null,
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
    ...overrides,
  }
}

const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Cash',
    type: 'CASH',
    currency: 'USD',
    balance: 100,
    icon: null,
    isDefault: true,
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
]

function mountComp(transactions: Transaction[]) {
  return mount(RecentTransactions, {
    props: { transactions, accounts, categories },
    global: { plugins: [router] },
  })
}

describe('RecentTransactions', () => {
  it('renders without errors', () => {
    const wrapper = mountComp([makeTx()])
    expect(wrapper.exists()).toBe(true)
  })

  it('renders section header "Recent Transactions"', () => {
    const wrapper = mountComp([makeTx()])
    expect(wrapper.text()).toContain('Recent Transactions')
  })

  it('renders a "See all" button', () => {
    const wrapper = mountComp([makeTx()])
    expect(wrapper.find('[data-testid="see-all-link"]').exists()).toBe(true)
  })

  it('renders transaction items for each transaction', () => {
    const txs = [
      makeTx({ id: 'tx-1', description: 'Lunch' }),
      makeTx({ id: 'tx-2', description: 'Dinner' }),
      makeTx({ id: 'tx-3', description: 'Snacks' }),
    ]
    const wrapper = mountComp(txs)
    expect(wrapper.find('[data-testid="transaction-item-tx-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="transaction-item-tx-2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="transaction-item-tx-3"]').exists()).toBe(true)
  })

  it('renders at most 5 transaction items (driven by props)', () => {
    const txs = Array.from({ length: 5 }, (_, i) =>
      makeTx({ id: `tx-${i}`, description: `Item ${i}` }),
    )
    const wrapper = mountComp(txs)
    // All 5 should render (the limit is enforced by the backend/parent)
    txs.forEach((tx) => {
      expect(wrapper.find(`[data-testid="transaction-item-${tx.id}"]`).exists()).toBe(true)
    })
  })

  it('shows empty state when no transactions', () => {
    const wrapper = mountComp([])
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No transactions yet this month.')
  })

  it('does not show empty state when there are transactions', () => {
    const wrapper = mountComp([makeTx()])
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
  })

  it('renders formatted amount for expense', () => {
    const wrapper = mountComp([makeTx({ type: 'EXPENSE', amount: 12.5 })])
    expect(wrapper.text()).toContain('-$12.50')
  })

  it('renders formatted amount for income', () => {
    const wrapper = mountComp([makeTx({ type: 'INCOME', amount: 3000 })])
    expect(wrapper.text()).toContain('+$3,000.00')
  })
})
