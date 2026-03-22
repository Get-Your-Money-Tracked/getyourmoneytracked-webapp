import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TotalBalanceCard from '@/components/accounts/TotalBalanceCard.vue'

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn().mockResolvedValue({ data: { accounts: [] } }) })),
    mutation: vi.fn(() => ({ toPromise: vi.fn().mockResolvedValue({ data: {} }) })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

describe('TotalBalanceCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays formatted total balance for USD', () => {
    const wrapper = mount(TotalBalanceCard, {
      props: { totalBalance: 12450, accountCount: 3, currency: 'USD' },
    })
    expect(wrapper.text()).toContain('12,450.00')
  })

  it('displays "across 3 accounts" for 3 accounts', () => {
    const wrapper = mount(TotalBalanceCard, {
      props: { totalBalance: 1000, accountCount: 3, currency: 'USD' },
    })
    expect(wrapper.text()).toContain('across 3 accounts')
  })

  it('displays "across 1 account" for 1 account (singular)', () => {
    const wrapper = mount(TotalBalanceCard, {
      props: { totalBalance: 500, accountCount: 1, currency: 'USD' },
    })
    expect(wrapper.text()).toContain('across 1 account')
  })

  it('shows total balance with danger color when negative', () => {
    const wrapper = mount(TotalBalanceCard, {
      props: { totalBalance: -500, accountCount: 2, currency: 'USD' },
    })
    const amountEl = wrapper.find('.text-danger')
    expect(amountEl.exists()).toBe(true)
    expect(amountEl.text()).toContain('500')
  })

  it('shows total balance in primary text color when positive', () => {
    const wrapper = mount(TotalBalanceCard, {
      props: { totalBalance: 1000, accountCount: 2, currency: 'USD' },
    })
    const amountEl = wrapper.find('.text-text-primary')
    expect(amountEl.exists()).toBe(true)
  })

  it('renders loading skeleton when loading prop is true', () => {
    const wrapper = mount(TotalBalanceCard, {
      props: { totalBalance: 0, accountCount: 0, currency: 'USD', loading: true },
    })
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
  })

  it('displays "Total Balance" label', () => {
    const wrapper = mount(TotalBalanceCard, {
      props: { totalBalance: 0, accountCount: 0, currency: 'USD' },
    })
    expect(wrapper.text()).toContain('Total Balance')
  })

  it('formats zero balance as $0.00', () => {
    const wrapper = mount(TotalBalanceCard, {
      props: { totalBalance: 0, accountCount: 0, currency: 'USD' },
    })
    expect(wrapper.text()).toContain('$0.00')
  })
})
