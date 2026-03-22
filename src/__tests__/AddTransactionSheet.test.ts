import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, reactive } from 'vue'
import AddTransactionSheet from '@/components/transactions/AddTransactionSheet.vue'
import type { Account, Category } from '@/types'

// ── Infrastructure mocks ─────────────────────────────────────
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

// ── Store mocks ───────────────────────────────────────────────
const _mockCreateTransaction = vi.fn()
const _mockLastUsedAccountId = ref<string | null>(null)
const _mockLastUsedCategoryId = ref<string | null>(null)

vi.mock('@/stores/transactions', () => ({
  useTransactionsStore: () =>
    reactive({
      get lastUsedAccountId() { return _mockLastUsedAccountId.value },
      get lastUsedCategoryId() { return _mockLastUsedCategoryId.value },
      createTransaction: _mockCreateTransaction,
    }),
}))

const _mockActiveAccounts = ref<Account[]>([])
const _mockDefaultAccount = ref<Account | null>(null)
const _mockLoadAccounts = vi.fn()

vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      get activeAccounts() { return _mockActiveAccounts.value },
      get accounts() { return _mockActiveAccounts.value },
      get defaultAccount() { return _mockDefaultAccount.value },
      loadAccounts: _mockLoadAccounts,
    }),
}))

const _mockCategories = ref<Category[]>([])
const _mockLoadCategories = vi.fn()

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      get categories() { return _mockCategories.value },
      loadCategories: _mockLoadCategories,
    }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => reactive({ defaultCurrency: 'USD' }),
}))

// ── Child component stubs ─────────────────────────────────────
vi.mock('@/components/common/NumPad.vue', () => ({
  default: {
    name: 'NumPad',
    template: '<div data-testid="numpad" />',
    emits: ['digit', 'decimal', 'backspace'],
  },
}))

vi.mock('@/components/common/AmountDisplay.vue', () => ({
  default: {
    name: 'AmountDisplay',
    props: ['amount', 'currency', 'transactionType'],
    template: '<div data-testid="amount-display">{{ amount }}</div>',
  },
}))

vi.mock('@/components/common/TransactionTypeToggle.vue', () => ({
  default: {
    name: 'TransactionTypeToggle',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div data-testid="type-toggle" />',
  },
}))

vi.mock('@/components/common/AccountSelector.vue', () => ({
  default: {
    name: 'AccountSelector',
    props: ['modelValue', 'accounts', 'label'],
    emits: ['update:modelValue'],
    template: '<div data-testid="account-selector" />',
  },
}))

vi.mock('@/components/common/DateSelector.vue', () => ({
  default: {
    name: 'DateSelector',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div data-testid="date-selector" />',
  },
}))

vi.mock('@/components/common/CategoryPicker.vue', () => ({
  default: {
    name: 'CategoryPicker',
    props: ['modelValue', 'transactionType'],
    emits: ['update:modelValue'],
    template: '<div data-testid="category-picker" />',
  },
}))

vi.mock('lucide-vue-next', () => ({
  Loader2: { template: '<span data-testid="loader2" />' },
}))

// ── Helpers ───────────────────────────────────────────────────
const defaultAccount: Account = {
  id: 'acc-1',
  name: 'Checking',
  type: 'BANK',
  currency: 'USD',
  balance: 1000,
  icon: null,
  isDefault: true,
  isArchived: false,
}

const defaultCategory: Category = {
  id: 'cat-1',
  name: 'Food',
  icon: '🍽️',
  color: '#FF9800',
  parentId: null,
  isDefault: true,
  sortOrder: 0,
}

function mountSheet(open = true) {
  return mount(AddTransactionSheet, {
    props: { open },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

// ── Tests ─────────────────────────────────────────────────────
describe('AddTransactionSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _mockCreateTransaction.mockReset()
    _mockLoadAccounts.mockReset()
    _mockLoadCategories.mockReset()
    _mockActiveAccounts.value = [defaultAccount]
    _mockDefaultAccount.value = defaultAccount
    _mockCategories.value = [defaultCategory]
    _mockLastUsedAccountId.value = null
    _mockLastUsedCategoryId.value = null
  })

  it('renders sheet when open is true', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open is false', () => {
    const wrapper = mountSheet(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "Add Transaction" aria-label when open', () => {
    const wrapper = mountSheet(true)
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.attributes('aria-label')).toBe('Add Transaction')
  })

  it('renders NumPad component', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="numpad"]').exists()).toBe(true)
  })

  it('renders AmountDisplay with initial amount 0', () => {
    const wrapper = mountSheet(true)
    const display = wrapper.find('[data-testid="amount-display"]')
    expect(display.exists()).toBe(true)
    expect(display.text()).toBe('0')
  })

  it('renders TransactionTypeToggle', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="type-toggle"]').exists()).toBe(true)
  })

  it('renders CategoryPicker when type is not TRANSFER', () => {
    const wrapper = mountSheet(true)
    // Default type is EXPENSE, so category picker should be visible
    expect(wrapper.find('[data-testid="category-picker"]').exists()).toBe(true)
  })

  it('Save button is disabled when amount is "0"', () => {
    const wrapper = mountSheet(true)
    const saveBtn = wrapper.findAll('button').find((b) =>
      b.text().includes('Save'),
    )
    expect(saveBtn?.attributes('disabled')).toBeDefined()
  })

  it('Save button text reflects transaction type', () => {
    const wrapper = mountSheet(true)
    // Default type is EXPENSE
    const text = wrapper.text()
    expect(text).toContain('Save Expense')
  })

  it('shows backdrop when open is true', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true)
  })

  it('emits close when backdrop is clicked with clean state', async () => {
    const wrapper = mountSheet(true)
    // amount is still "0" → not dirty → should emit close directly
    const backdrop = wrapper.find('[aria-hidden="true"]')
    await backdrop.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows discard dialog when backdrop clicked after entering data', async () => {
    const wrapper = mountSheet(true)

    // Directly manipulate the internal state by triggering digit emission
    // from the NumPad stub. We need to get the component instance.
    // Instead, find the NumPad and emit digit event
    const numpad = wrapper.findComponent({ name: 'NumPad' })
    await numpad.vm.$emit('digit', '5')
    await flushPromises()

    // Now backdrop click should show discard dialog
    const backdrop = wrapper.find('[aria-hidden="true"]')
    await backdrop.trigger('click')

    // Check discard dialog appears
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Discard this entry?')
  })

  it('does not show discard dialog when no data entered and backdrop clicked', async () => {
    const wrapper = mountSheet(true)
    const backdrop = wrapper.find('[aria-hidden="true"]')
    await backdrop.trigger('click')
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
  })

  it('Keep editing button hides discard dialog', async () => {
    const wrapper = mountSheet(true)
    const numpad = wrapper.findComponent({ name: 'NumPad' })
    await numpad.vm.$emit('digit', '5')
    await flushPromises()

    await wrapper.find('[aria-hidden="true"]').trigger('click')
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)

    const keepBtn = wrapper.findAll('button').find((b) => b.text().includes('Keep editing'))
    await keepBtn?.trigger('click')
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
  })

  it('Discard button emits close', async () => {
    const wrapper = mountSheet(true)
    const numpad = wrapper.findComponent({ name: 'NumPad' })
    await numpad.vm.$emit('digit', '5')
    await flushPromises()

    await wrapper.find('[aria-hidden="true"]').trigger('click')

    const discardBtn = wrapper.findAll('button').find((b) => b.text() === 'Discard')
    await discardBtn?.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('calls createTransaction with correct data on valid submit', async () => {
    const mockTx = {
      id: 'tx-1',
      type: 'EXPENSE' as const,
      amount: 5,
      date: '2026-03-21',
      accountId: 'acc-1',
      toAccountId: null,
      categoryId: 'cat-1',
      description: null,
      notes: null,
      tags: [],
      receiptUrl: null,
      createdAt: '',
      updatedAt: '',
    }
    _mockCreateTransaction.mockResolvedValueOnce(mockTx)

    // Mount closed then open so the open-watcher fires and sets accountId
    const wrapper = mount(AddTransactionSheet, {
      props: { open: false },
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
    await wrapper.setProps({ open: true })
    await flushPromises()

    // Simulate digit entry to set amount > 0
    const numpad = wrapper.findComponent({ name: 'NumPad' })
    await numpad.vm.$emit('digit', '5')
    await flushPromises()

    // Set categoryId via CategoryPicker emit
    const categoryPicker = wrapper.findComponent({ name: 'CategoryPicker' })
    await categoryPicker.vm.$emit('update:modelValue', 'cat-1')
    await flushPromises()

    // Click save button (should now be enabled)
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save'))
    await saveBtn?.trigger('click')
    await flushPromises()

    expect(_mockCreateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'EXPENSE',
        amount: 5,
        categoryId: 'cat-1',
        accountId: 'acc-1',
      }),
    )
  })

  it('emits created and close on successful submit', async () => {
    const mockTx = {
      id: 'tx-1',
      type: 'EXPENSE' as const,
      amount: 5,
      date: '2026-03-21',
      accountId: 'acc-1',
      toAccountId: null,
      categoryId: 'cat-1',
      description: null,
      notes: null,
      tags: [],
      receiptUrl: null,
      createdAt: '',
      updatedAt: '',
    }
    _mockCreateTransaction.mockResolvedValueOnce(mockTx)

    const wrapper = mount(AddTransactionSheet, {
      props: { open: false },
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
    await wrapper.setProps({ open: true })
    await flushPromises()

    const numpad = wrapper.findComponent({ name: 'NumPad' })
    await numpad.vm.$emit('digit', '5')
    await flushPromises()

    const categoryPicker = wrapper.findComponent({ name: 'CategoryPicker' })
    await categoryPicker.vm.$emit('update:modelValue', 'cat-1')
    await flushPromises()

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save'))
    await saveBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('created')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows inline error when createTransaction throws', async () => {
    _mockCreateTransaction.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mount(AddTransactionSheet, {
      props: { open: false },
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
    await wrapper.setProps({ open: true })
    await flushPromises()

    const numpad = wrapper.findComponent({ name: 'NumPad' })
    await numpad.vm.$emit('digit', '5')
    await flushPromises()

    const categoryPicker = wrapper.findComponent({ name: 'CategoryPicker' })
    await categoryPicker.vm.$emit('update:modelValue', 'cat-1')
    await flushPromises()

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save'))
    await saveBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Network error')
  })

  it('renders More details toggle button', () => {
    const wrapper = mountSheet(true)
    const moreBtn = wrapper.findAll('button').find((b) => b.text().includes('More details'))
    expect(moreBtn).toBeDefined()
  })

  it('shows description/notes/tags inputs when More details is expanded', async () => {
    const wrapper = mountSheet(true)
    const moreBtn = wrapper.findAll('button').find((b) => b.text().includes('More details'))
    await moreBtn?.trigger('click')
    await flushPromises()
    expect(wrapper.find('input[placeholder="Description"]').exists()).toBe(true)
    expect(wrapper.find('textarea[placeholder="Notes"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Tags (e.g. vacation, food)"]').exists()).toBe(true)
  })

  it('shows drag handle', () => {
    const wrapper = mountSheet(true)
    // Drag handle is an aria-hidden div
    const handles = wrapper.findAll('[aria-hidden="true"]')
    expect(handles.length).toBeGreaterThan(0)
  })

  it('loads accounts when accounts list is empty on open', async () => {
    _mockActiveAccounts.value = []
    _mockDefaultAccount.value = null

    // Remount with open=false then update to true
    const wrapper = mount(AddTransactionSheet, {
      props: { open: false },
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })

    // Set accounts to empty to trigger load
    _mockActiveAccounts.value = []
    await wrapper.setProps({ open: true })
    await flushPromises()

    expect(_mockLoadAccounts).toHaveBeenCalled()
  })
})
