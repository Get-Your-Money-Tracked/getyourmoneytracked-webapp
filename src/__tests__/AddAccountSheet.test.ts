import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'
import AddAccountSheet from '@/components/accounts/AddAccountSheet.vue'

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

const mockCreateAccount = vi.fn()

vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      createAccount: mockCreateAccount,
      activeAccounts: [],
      clearError: vi.fn(),
    }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      defaultCurrency: 'USD',
    }),
}))

function mountSheet(open = true) {
  return mount(AddAccountSheet, {
    props: { open },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('AddAccountSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the sheet when open is true', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render the sheet when open is false', () => {
    const wrapper = mountSheet(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "New Account" title when open', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.text()).toContain('New Account')
  })

  it('renders name, balance inputs and type selector', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('#account-name').exists()).toBe(true)
    expect(wrapper.find('#starting-balance').exists()).toBe(true)
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
  })

  it('Create Account button is disabled when name is empty', async () => {
    const wrapper = mountSheet(true)
    // Find the submit button specifically
    const submitBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Create Account'))
    expect(submitBtn?.attributes('disabled')).toBeDefined()
  })

  it('Create Account button is enabled when name is filled', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('#account-name').setValue('My Account')
    const submitBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Create Account'))
    expect(submitBtn?.attributes('disabled')).toBeUndefined()
  })

  it('shows name validation error when submitting with empty name', async () => {
    const wrapper = mountSheet(true)
    // Try to submit with empty name (force validation)
    await wrapper.find('#account-name').trigger('blur')
    await flushPromises()
    expect(wrapper.text()).toContain('Account name is required.')
  })

  it('calls createAccount when form is valid and submitted', async () => {
    mockCreateAccount.mockResolvedValueOnce({
      id: 'new-acc',
      name: 'Test',
      type: 'BANK',
      currency: 'USD',
      balance: 0,
      icon: null,
      isDefault: false,
      isArchived: false,
    })
    const wrapper = mountSheet(true)
    await wrapper.find('#account-name').setValue('Test Account')
    const submitBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Create Account'))
    await submitBtn?.trigger('click')
    await flushPromises()
    expect(mockCreateAccount).toHaveBeenCalledOnce()
    expect(mockCreateAccount).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Account', type: 'BANK' }),
    )
  })

  it('emits close event when backdrop is clicked', async () => {
    const wrapper = mountSheet(true)
    // Click the backdrop (first fixed div)
    const backdrop = wrapper.find('.bg-black\\/40')
    await backdrop.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows all 3 account type options', () => {
    const wrapper = mountSheet(true)
    const radioGroup = wrapper.find('[role="radiogroup"]')
    expect(radioGroup.text()).toContain('Cash')
    expect(radioGroup.text()).toContain('Bank')
    expect(radioGroup.text()).toContain('Credit Card')
  })
})
