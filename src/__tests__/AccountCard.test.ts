import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AccountCard from '@/components/accounts/AccountCard.vue'
import type { Account } from '@/types'

// Mock the urql client (imported transitively via stores)
vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn().mockResolvedValue({ data: { accounts: [] } }) })),
    mutation: vi.fn(() => ({ toPromise: vi.fn().mockResolvedValue({ data: {} }) })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  auth: {
    onIdTokenChanged: vi.fn(),
  },
}))

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    name: 'Main Bank',
    type: 'BANK',
    currency: 'USD',
    balance: 1000,
    icon: null,
    isDefault: false,
    includeInTotal: true,
    ...overrides,
  }
}

describe('AccountCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the account name', () => {
    const wrapper = mount(AccountCard, { props: { account: makeAccount() } })
    expect(wrapper.text()).toContain('Main Bank')
  })

  it('renders "Bank Account" type badge for BANK type', () => {
    const wrapper = mount(AccountCard, { props: { account: makeAccount({ type: 'BANK' }) } })
    expect(wrapper.text()).toContain('Bank Account')
  })

  it('renders "Cash" type badge for CASH type', () => {
    const wrapper = mount(AccountCard, {
      props: { account: makeAccount({ type: 'CASH', name: 'Cash Wallet' }) },
    })
    expect(wrapper.text()).toContain('Cash')
  })

  it('renders "Credit Card" type badge for CREDIT_CARD type', () => {
    const wrapper = mount(AccountCard, {
      props: { account: makeAccount({ type: 'CREDIT_CARD', name: 'My Card' }) },
    })
    expect(wrapper.text()).toContain('Credit Card')
  })

  it('renders formatted positive balance in primary (green) color', () => {
    const wrapper = mount(AccountCard, {
      props: { account: makeAccount({ balance: 12450.0 }) },
    })
    const balanceEl = wrapper.find('.text-primary')
    expect(balanceEl.exists()).toBe(true)
    expect(balanceEl.text()).toContain('12,450.00')
  })

  it('renders negative balance in danger (red) color', () => {
    const wrapper = mount(AccountCard, {
      props: { account: makeAccount({ balance: -1000, type: 'CREDIT_CARD' }) },
    })
    const balanceEl = wrapper.find('.text-danger')
    expect(balanceEl.exists()).toBe(true)
    expect(balanceEl.text()).toContain('1,000.00')
  })

  it('shows "Default" badge when account isDefault is true', () => {
    const wrapper = mount(AccountCard, {
      props: { account: makeAccount({ isDefault: true }) },
    })
    expect(wrapper.text()).toContain('Default')
  })

  it('does not show "Default" badge when isDefault is false', () => {
    const wrapper = mount(AccountCard, {
      props: { account: makeAccount({ isDefault: false }) },
    })
    expect(wrapper.text()).not.toContain('Default')
  })

  it('emits click event with account when card is clicked', async () => {
    const account = makeAccount()
    const wrapper = mount(AccountCard, { props: { account } })
    await wrapper.find('button').trigger('click')
    const emitted = wrapper.emitted('click')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(account)
  })

  it('renders loading skeleton when loading prop is true', () => {
    const wrapper = mount(AccountCard, {
      props: {
        account: makeAccount(),
        loading: true,
      },
    })
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('renders default icon emoji when no icon is set for BANK type', () => {
    const wrapper = mount(AccountCard, {
      props: { account: makeAccount({ icon: null, type: 'BANK' }) },
    })
    expect(wrapper.text()).toContain('🏦')
  })

  it('renders custom icon emoji when icon is set', () => {
    const wrapper = mount(AccountCard, {
      props: { account: makeAccount({ icon: '🏠' }) },
    })
    expect(wrapper.text()).toContain('🏠')
  })
})
