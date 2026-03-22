import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionList from '@/components/transactions/TransactionList.vue'
import type { Transaction, Account, Category } from '@/types'

function makeTx(id: string, date: string, type: Transaction['type'] = 'EXPENSE'): Transaction {
  return {
    id,
    type,
    amount: 10,
    date,
    accountId: 'acc-1',
    toAccountId: null,
    categoryId: 'cat-1',
    description: null,
    notes: null,
    tags: [],
    receiptUrl: null,
    createdAt: date,
    updatedAt: date,
  }
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function yesterdayIso() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const accounts: Account[] = [
  { id: 'acc-1', name: 'Cash', type: 'CASH', currency: 'USD', balance: 100, icon: null, isDefault: true, isArchived: false },
]
const categories: Category[] = [
  { id: 'cat-1', name: 'Food', icon: '🍽️', color: '#FF9800', parentId: null, isDefault: true, sortOrder: 0 },
]

describe('TransactionList', () => {
  function mountList(props: {
    transactions: Transaction[]
    isLoading?: boolean
    hasMore?: boolean
  }) {
    return mount(TransactionList, {
      props: {
        transactions: props.transactions,
        isLoading: props.isLoading ?? false,
        hasMore: props.hasMore ?? false,
        accounts,
        categories,
      },
    })
  }

  it('shows empty state when no transactions and not loading', () => {
    const wrapper = mountList({ transactions: [] })
    expect(wrapper.text()).toContain('No transactions found')
  })

  it('shows skeleton rows while loading with no existing transactions', () => {
    const wrapper = mountList({ transactions: [], isLoading: true })
    // Skeletons are divs with animate-pulse
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('does not show empty state while loading', () => {
    const wrapper = mountList({ transactions: [], isLoading: true })
    expect(wrapper.text()).not.toContain('No transactions found')
  })

  it('renders transactions grouped with date headers', () => {
    const today = todayIso()
    const yesterday = yesterdayIso()
    const txs = [
      makeTx('t1', today),
      makeTx('t2', yesterday),
    ]
    const wrapper = mountList({ transactions: txs })
    expect(wrapper.text()).toContain('Today')
    expect(wrapper.text()).toContain('Yesterday')
  })

  it('shows "Today" header for today\'s transactions', () => {
    const today = todayIso()
    const wrapper = mountList({ transactions: [makeTx('t1', today)] })
    expect(wrapper.text().toUpperCase()).toContain('TODAY')
  })

  it('shows "Yesterday" header for yesterday\'s transactions', () => {
    const yesterday = yesterdayIso()
    const wrapper = mountList({ transactions: [makeTx('t1', yesterday)] })
    expect(wrapper.text().toUpperCase()).toContain('YESTERDAY')
  })

  it('shows Load More button when hasMore is true', () => {
    const today = todayIso()
    const wrapper = mountList({ transactions: [makeTx('t1', today)], hasMore: true })
    expect(wrapper.text()).toContain('Load more')
  })

  it('does not show Load More button when hasMore is false', () => {
    const today = todayIso()
    const wrapper = mountList({ transactions: [makeTx('t1', today)], hasMore: false })
    expect(wrapper.text()).not.toContain('Load more')
  })

  it('emits loadMore when Load More button is clicked', async () => {
    const today = todayIso()
    const wrapper = mountList({ transactions: [makeTx('t1', today)], hasMore: true })
    const loadMoreBtn = wrapper.findAll('button').find((b) => b.text().includes('Load more'))
    await loadMoreBtn?.trigger('click')
    expect(wrapper.emitted('loadMore')).toBeTruthy()
  })

  it('emits select when a transaction item is clicked', async () => {
    const today = todayIso()
    const tx = makeTx('t1', today)
    const wrapper = mountList({ transactions: [tx] })
    // Click the transaction item button (inside TransactionListItem)
    const txButton = wrapper.find('button[type="button"]')
    await txButton.trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
  })

  it('groups multiple transactions from same date in single section', () => {
    const today = todayIso()
    const txs = [
      makeTx('t1', today),
      makeTx('t2', today),
      makeTx('t3', today),
    ]
    const wrapper = mountList({ transactions: txs })
    // "Today" should appear exactly once in the date header area
    const todayHeaders = wrapper.findAll('p').filter(
      (p) => p.text().toUpperCase() === 'TODAY',
    )
    expect(todayHeaders).toHaveLength(1)
  })
})
