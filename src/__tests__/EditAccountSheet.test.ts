import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, reactive } from 'vue'
import EditAccountSheet from '@/components/accounts/EditAccountSheet.vue'
import type { Account } from '@/types'

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

// ── Mutable state for accounts store mock ─────────────────────────────────────
const _accounts = ref<Account[]>([])
const _updateAccount = vi.fn()
const _archiveAccount = vi.fn()

vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      get accounts() {
        return _accounts.value
      },
      updateAccount: _updateAccount,
      archiveAccount: _archiveAccount,
      clearError: vi.fn(),
    }),
}))

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    name: 'Main Bank',
    type: 'BANK',
    currency: 'USD',
    balance: 5000,
    icon: null,
    isDefault: false,
    includeInTotal: true,
    ...overrides,
  }
}

function mountSheet(account: Account | null = makeAccount(), open = true) {
  return mount(EditAccountSheet, {
    props: { open, account },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('EditAccountSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Default: 2 active accounts so archive is enabled
    _accounts.value = [makeAccount(), makeAccount({ id: 'acc-2', name: 'Cash' })]
  })

  it('renders edit sheet when open', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('pre-fills name field with account name', async () => {
    const wrapper = mountSheet(makeAccount({ name: 'Savings Account' }))
    await flushPromises()
    const nameInput = wrapper.find('#edit-account-name')
    expect((nameInput.element as HTMLInputElement).value).toBe('Savings Account')
  })

  it('shows type as read-only (in a non-editable display)', () => {
    const wrapper = mountSheet(makeAccount({ type: 'CREDIT_CARD' }))
    expect(wrapper.text()).toContain('Credit Card')
    // No radio group for type editing
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(false)
  })

  it('shows currency as read-only', () => {
    const wrapper = mountSheet(makeAccount({ currency: 'EUR' }))
    expect(wrapper.text()).toContain('EUR')
  })

  it('shows balance as read-only', () => {
    const wrapper = mountSheet(makeAccount({ balance: 5000 }))
    expect(wrapper.text()).toContain('5,000.00')
    expect(wrapper.text()).toContain('Balance can only be changed through transactions.')
  })

  it('renders "Set as Default" toggle', () => {
    const wrapper = mountSheet()
    expect(wrapper.text()).toContain('Set as Default')
    expect(wrapper.find('[role="switch"]').exists()).toBe(true)
  })

  it('toggle reflects isDefault state when account is default', async () => {
    const wrapper = mountSheet(makeAccount({ isDefault: true }))
    await flushPromises()
    const toggle = wrapper.find('[role="switch"]')
    expect(toggle.attributes('aria-checked')).toBe('true')
  })

  it('shows name validation error when saving with empty name', async () => {
    const wrapper = mountSheet()
    await wrapper.find('#edit-account-name').setValue('')
    await wrapper.find('#edit-account-name').trigger('blur')
    await flushPromises()
    expect(wrapper.text()).toContain('Account name is required.')
  })

  it('calls updateAccount on save with valid name', async () => {
    _updateAccount.mockResolvedValueOnce(makeAccount({ name: 'Updated Name' }))
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('#edit-account-name').setValue('Updated Name')
    const saveBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Save')
    await saveBtn?.trigger('click')
    await flushPromises()
    expect(_updateAccount).toHaveBeenCalledOnce()
  })

  it('archive button is enabled when more than 1 active account', async () => {
    _accounts.value = [makeAccount(), makeAccount({ id: 'acc-2' })]
    const wrapper = mountSheet()
    await flushPromises()
    const archiveBtn = wrapper.findAll('button').find((b) => b.text().includes('Archive Account'))
    // When not disabled, the :disabled binding should be false/absent
    const disabledAttr = archiveBtn?.attributes('disabled')
    expect(disabledAttr).toBeUndefined()
  })

  it('archive button is disabled when only 1 active account', async () => {
    _accounts.value = [makeAccount()]
    const wrapper = mountSheet()
    await flushPromises()
    const archiveBtn = wrapper.findAll('button').find((b) => b.text().includes('Archive Account'))
    expect(archiveBtn?.attributes('disabled')).toBeDefined()
  })

  it('shows helper text when archive is disabled', async () => {
    _accounts.value = [makeAccount()]
    const wrapper = mountSheet()
    await flushPromises()
    expect(wrapper.text()).toContain('Cannot archive your only active account.')
  })

  it('shows archive confirmation dialog when archive button is clicked', async () => {
    _accounts.value = [makeAccount(), makeAccount({ id: 'acc-2' })]
    const wrapper = mountSheet()
    await flushPromises()
    const archiveBtn = wrapper.findAll('button').find((b) => b.text().includes('Archive Account'))
    await archiveBtn?.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Archive Main Bank?')
  })

  it('calls archiveAccount on confirmation', async () => {
    _accounts.value = [makeAccount(), makeAccount({ id: 'acc-2' })]
    _archiveAccount.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet()
    await flushPromises()
    const archiveBtn = wrapper.findAll('button').find((b) => b.text().includes('Archive Account'))
    await archiveBtn?.trigger('click')
    await flushPromises()
    // Confirm in dialog — last button in alertdialog
    const confirmBtn = wrapper.find('[role="alertdialog"]').findAll('button').at(-1)
    await confirmBtn?.trigger('click')
    await flushPromises()
    expect(_archiveAccount).toHaveBeenCalledWith('acc-1')
  })

  it('emits archived event after successful archive', async () => {
    _accounts.value = [makeAccount(), makeAccount({ id: 'acc-2' })]
    _archiveAccount.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet()
    await flushPromises()
    const archiveBtn = wrapper.findAll('button').find((b) => b.text().includes('Archive Account'))
    await archiveBtn?.trigger('click')
    await flushPromises()
    const confirmBtn = wrapper.find('[role="alertdialog"]').findAll('button').at(-1)
    await confirmBtn?.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('archived')).toBeTruthy()
  })
})
