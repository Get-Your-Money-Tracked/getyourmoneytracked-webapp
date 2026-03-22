import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AccountSelector from '@/components/common/AccountSelector.vue'
import type { Account } from '@/types'

vi.mock('lucide-vue-next', () => ({
  ChevronDown: { template: '<span>chevron</span>' },
  Check: { template: '<span>check</span>' },
}))

function makeAccount(id: string, name: string, isDefault = false): Account {
  return {
    id,
    name,
    type: 'BANK',
    currency: 'USD',
    balance: 100,
    icon: null,
    isDefault,
    isArchived: false,
  }
}

const accounts = [
  makeAccount('acc-1', 'Cash Wallet', true),
  makeAccount('acc-2', 'Main Bank'),
  makeAccount('acc-3', 'Savings'),
]

describe('AccountSelector', () => {
  function mountSelector(modelValue: string | null = 'acc-1', label?: string) {
    return mount(AccountSelector, {
      props: { modelValue, accounts, label },
      attachTo: document.body,
    })
  }

  it('renders the selected account name', () => {
    const wrapper = mountSelector('acc-1')
    expect(wrapper.text()).toContain('Cash Wallet')
  })

  it('renders label above chip when label prop is provided', () => {
    const wrapper = mountSelector('acc-1', 'From')
    expect(wrapper.text()).toContain('From')
  })

  it('shows "Select account" when modelValue is null and no accounts', () => {
    const wrapper = mount(AccountSelector, {
      props: { modelValue: null, accounts: [] },
    })
    expect(wrapper.text()).toContain('Select account')
  })

  it('opens dropdown when chip button is clicked', async () => {
    const wrapper = mountSelector('acc-1')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    await wrapper.find('button[aria-haspopup="listbox"]').trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
  })

  it('shows all accounts in the dropdown', async () => {
    const wrapper = mountSelector('acc-1')
    await wrapper.find('button[aria-haspopup="listbox"]').trigger('click')
    const options = wrapper.findAll('[role="option"]')
    expect(options).toHaveLength(3)
  })

  it('emits update:modelValue with account id when an account is selected', async () => {
    const wrapper = mountSelector('acc-1')
    await wrapper.find('button[aria-haspopup="listbox"]').trigger('click')
    const options = wrapper.findAll('[role="option"]')
    await options[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['acc-2'])
  })

  it('closes dropdown after selecting an account', async () => {
    const wrapper = mountSelector('acc-1')
    await wrapper.find('button[aria-haspopup="listbox"]').trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
    const options = wrapper.findAll('[role="option"]')
    await options[0].trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('marks selected account option with aria-selected="true"', async () => {
    const wrapper = mountSelector('acc-2')
    await wrapper.find('button[aria-haspopup="listbox"]').trigger('click')
    const options = wrapper.findAll('[role="option"]')
    expect(options[1].attributes('aria-selected')).toBe('true')
    expect(options[0].attributes('aria-selected')).toBe('false')
  })
})
