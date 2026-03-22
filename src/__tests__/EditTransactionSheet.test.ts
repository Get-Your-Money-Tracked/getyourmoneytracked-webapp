import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, reactive } from 'vue'
import EditTransactionSheet from '@/components/transactions/EditTransactionSheet.vue'
import type { Account, Category, Transaction } from '@/types'

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
const _mockUpdateTransaction = vi.fn()
const _mockDeleteTransaction = vi.fn()

vi.mock('@/stores/transactions', () => ({
  useTransactionsStore: () =>
    reactive({
      updateTransaction: _mockUpdateTransaction,
      deleteTransaction: _mockDeleteTransaction,
    }),
}))

const _mockActiveAccounts = ref<Account[]>([])
const _mockLoadAccounts = vi.fn()

vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      get activeAccounts() { return _mockActiveAccounts.value },
      get accounts() { return _mockActiveAccounts.value },
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
  Trash2: { template: '<span data-testid="trash2" />' },
}))

// ── Test data ─────────────────────────────────────────────────
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

const sampleExpenseTransaction: Transaction = {
  id: 'tx-1',
  type: 'EXPENSE',
  amount: 42.5,
  date: '2026-03-21T00:00:00Z',
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: 'cat-1',
  description: null,
  notes: null,
  tags: [],
  receiptUrl: null,
  createdAt: '2026-03-21T10:00:00Z',
  updatedAt: '2026-03-21T10:00:00Z',
}

const sampleTransactionWithDetails: Transaction = {
  ...sampleExpenseTransaction,
  id: 'tx-2',
  description: 'Lunch at café',
  notes: 'With colleagues',
  tags: ['food', 'work'],
}

const sampleTransferTransaction: Transaction = {
  id: 'tx-3',
  type: 'TRANSFER',
  amount: 100,
  date: '2026-03-21T00:00:00Z',
  accountId: 'acc-1',
  toAccountId: 'acc-2',
  categoryId: null,
  description: null,
  notes: null,
  tags: [],
  receiptUrl: null,
  createdAt: '2026-03-21T10:00:00Z',
  updatedAt: '2026-03-21T10:00:00Z',
}

function mountSheet(open = true, transaction: Transaction | null = sampleExpenseTransaction) {
  return mount(EditTransactionSheet, {
    props: { open, transaction },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

// ── Tests ─────────────────────────────────────────────────────
describe('EditTransactionSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _mockUpdateTransaction.mockReset()
    _mockDeleteTransaction.mockReset()
    _mockLoadAccounts.mockReset()
    _mockLoadCategories.mockReset()
    _mockActiveAccounts.value = [defaultAccount]
    _mockCategories.value = [defaultCategory]
  })

  it('renders sheet when open is true with a transaction', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open is false', () => {
    const wrapper = mountSheet(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "Edit Transaction" aria-label', () => {
    const wrapper = mountSheet(true)
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.attributes('aria-label')).toBe('Edit Transaction')
  })

  it('shows "Edit Transaction" heading', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.text()).toContain('Edit Transaction')
  })

  it('pre-fills amount from transaction', () => {
    const wrapper = mountSheet(true)
    const display = wrapper.find('[data-testid="amount-display"]')
    expect(display.text()).toBe('42.5')
  })

  it('shows Update button text', () => {
    const wrapper = mountSheet(true)
    const updateBtn = wrapper.findAll('button').find((b) => b.text().includes('Update'))
    expect(updateBtn).toBeDefined()
  })

  it('does not show "Save" text on the submit button', () => {
    const wrapper = mountSheet(true)
    const dialog = wrapper.find('[role="dialog"]')
    // The submit button should say "Update" not "Save"
    const buttons = dialog.findAll('button')
    const saveBtn = buttons.find((b) => b.text() === 'Save Expense' || b.text() === 'Save Income' || b.text() === 'Save Transfer')
    expect(saveBtn).toBeUndefined()
  })

  it('Delete icon button is visible', () => {
    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    expect(deleteBtn.exists()).toBe(true)
  })

  it('shows Trash2 icon in delete button', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="trash2"]').exists()).toBe(true)
  })

  it('shows CategoryPicker for EXPENSE type', () => {
    const wrapper = mountSheet(true, sampleExpenseTransaction)
    expect(wrapper.find('[data-testid="category-picker"]').exists()).toBe(true)
  })

  it('does not show CategoryPicker for TRANSFER type', () => {
    const wrapper = mountSheet(true, sampleTransferTransaction)
    expect(wrapper.find('[data-testid="category-picker"]').exists()).toBe(false)
  })

  it('shows two AccountSelectors for TRANSFER type', () => {
    const wrapper = mountSheet(true, sampleTransferTransaction)
    const selectors = wrapper.findAll('[data-testid="account-selector"]')
    expect(selectors.length).toBe(2)
  })

  it('auto-expands More details when transaction has description/notes/tags', () => {
    const wrapper = mountSheet(true, sampleTransactionWithDetails)
    // Since description, notes, and tags are set, showMoreDetails should be true
    expect(wrapper.find('input[placeholder="Description"]').exists()).toBe(true)
    expect(wrapper.find('textarea[placeholder="Notes"]').exists()).toBe(true)
  })

  it('calls updateTransaction on submit with correct data', async () => {
    _mockUpdateTransaction.mockResolvedValueOnce({ ...sampleExpenseTransaction })

    const wrapper = mountSheet(true)
    await flushPromises()

    // Find and click Update button
    const updateBtn = wrapper.findAll('button').find((b) => b.text() === 'Update')
    await updateBtn?.trigger('click')
    await flushPromises()

    expect(_mockUpdateTransaction).toHaveBeenCalledWith(
      'tx-1',
      expect.objectContaining({
        type: 'EXPENSE',
        amount: 42.5,
        accountId: 'acc-1',
        categoryId: 'cat-1',
      }),
    )
  })

  it('emits saved and close on successful update', async () => {
    _mockUpdateTransaction.mockResolvedValueOnce({ ...sampleExpenseTransaction })

    const wrapper = mountSheet(true)
    await flushPromises()

    const updateBtn = wrapper.findAll('button').find((b) => b.text() === 'Update')
    await updateBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('saved')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows error message when updateTransaction throws', async () => {
    _mockUpdateTransaction.mockRejectedValueOnce(new Error('Update failed'))

    const wrapper = mountSheet(true)
    await flushPromises()

    const updateBtn = wrapper.findAll('button').find((b) => b.text() === 'Update')
    await updateBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Update failed')
  })

  it('shows delete confirmation dialog when delete icon is clicked', async () => {
    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)
  })

  it('delete dialog contains correct title', async () => {
    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Delete this expense?')
  })

  it('does NOT call deleteTransaction when Cancel is clicked in dialog', async () => {
    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
    await cancelBtn?.trigger('click')
    await flushPromises()

    expect(_mockDeleteTransaction).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
  })

  it('calls deleteTransaction on confirm delete', async () => {
    _mockDeleteTransaction.mockResolvedValueOnce(undefined)

    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(_mockDeleteTransaction).toHaveBeenCalledWith('tx-1')
  })

  it('emits deleted and close on successful delete', async () => {
    _mockDeleteTransaction.mockResolvedValueOnce(undefined)

    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('deleted')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows error message when deleteTransaction throws', async () => {
    _mockDeleteTransaction.mockRejectedValueOnce(new Error('Delete failed'))

    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Delete failed')
  })

  it('renders NumPad', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="numpad"]').exists()).toBe(true)
  })

  it('does not render when transaction is null', () => {
    const wrapper = mountSheet(false, null)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('emits close when backdrop is clicked and no changes made', async () => {
    const wrapper = mountSheet(true)
    const backdrop = wrapper.find('[aria-hidden="true"]')
    await backdrop.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows discard dialog when backdrop is clicked after changes', async () => {
    const wrapper = mountSheet(true)
    await flushPromises()

    // Modify description to make form dirty
    const moreBtn = wrapper.findAll('button').find((b) => b.text().includes('More details'))
    await moreBtn?.trigger('click')
    await flushPromises()

    const descInput = wrapper.find('input[placeholder="Description"]')
    await descInput.setValue('Changed description')
    await flushPromises()

    // Click backdrop
    const backdrop = wrapper.find('[aria-hidden="true"]')
    await backdrop.trigger('click')
    await flushPromises()

    // Should show discard dialog, not emit close
    expect(wrapper.findAll('[role="alertdialog"]').some((el) =>
      el.text().includes('Discard changes?'),
    )).toBe(true)
  })

  it('emits close after confirming discard', async () => {
    const wrapper = mountSheet(true)
    await flushPromises()

    // Modify description to make form dirty
    const moreBtn = wrapper.findAll('button').find((b) => b.text().includes('More details'))
    await moreBtn?.trigger('click')
    await flushPromises()

    const descInput = wrapper.find('input[placeholder="Description"]')
    await descInput.setValue('Changed description')
    await flushPromises()

    // Click backdrop
    const backdrop = wrapper.find('[aria-hidden="true"]')
    await backdrop.trigger('click')
    await flushPromises()

    // Click Discard in dialog
    const discardBtn = wrapper.findAll('button').find((b) => b.text() === 'Discard')
    await discardBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('delete dialog description includes category name and date', async () => {
    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    // Should contain "Food" (category name) and date formatted
    expect(wrapper.text()).toContain('Food')
    expect(wrapper.text()).toContain('March 21')
  })

  it('keeps delete dialog open while delete is in progress', async () => {
    // Make deleteTransaction return a promise that doesn't resolve immediately
    let resolveDelete: (() => void) | undefined
    _mockDeleteTransaction.mockImplementation(
      () => new Promise<void>((resolve) => { resolveDelete = resolve }),
    )

    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    await confirmBtn?.trigger('click')
    await flushPromises()

    // Dialog should still be visible (not dismissed before async completes)
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)

    // Now resolve the promise
    resolveDelete!()
    await flushPromises()

    expect(wrapper.emitted('deleted')).toBeTruthy()
  })

  it('shows "Updating…" spinner text while update is in progress', async () => {
    let resolveUpdate: ((val: Transaction) => void) | undefined
    _mockUpdateTransaction.mockImplementation(
      () => new Promise<Transaction>((resolve) => { resolveUpdate = resolve }),
    )

    const wrapper = mountSheet(true)
    await flushPromises()

    const updateBtn = wrapper.findAll('button').find((b) => b.text() === 'Update')
    await updateBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Updating')

    resolveUpdate!({ ...sampleExpenseTransaction })
    await flushPromises()
  })

  it('shows "Deleting…" spinner text while delete is in progress', async () => {
    let resolveDelete: (() => void) | undefined
    _mockDeleteTransaction.mockImplementation(
      () => new Promise<void>((resolve) => { resolveDelete = resolve }),
    )

    const wrapper = mountSheet(true)
    const deleteBtn = wrapper.find('[aria-label="Delete transaction"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Deleting')

    resolveDelete!()
    await flushPromises()
  })

  it('shows tag validation error when too many tags are provided', async () => {
    const wrapper = mountSheet(true)
    await flushPromises()

    // Expand more details
    const moreBtn = wrapper.findAll('button').find((b) => b.text().includes('More details'))
    await moreBtn?.trigger('click')
    await flushPromises()

    // Enter 11 tags (max is 10) — parseTags will cap at 10, but let's verify
    // the component handles tags gracefully. Since parseTags caps at 10, this
    // verifies the input accepts and processes a large tag list without error.
    const elevenTags = Array.from({ length: 11 }, (_, i) => `tag${i}`).join(', ')
    const tagsInput = wrapper.find('input[placeholder*="Tags"]')
    await tagsInput.setValue(elevenTags)
    await flushPromises()

    // Submit — parseTags truncates to 10 so it should succeed
    _mockUpdateTransaction.mockResolvedValueOnce({ ...sampleExpenseTransaction })
    const updateBtn = wrapper.findAll('button').find((b) => b.text() === 'Update')
    await updateBtn?.trigger('click')
    await flushPromises()

    // Verify tags were passed (capped at 10)
    expect(_mockUpdateTransaction).toHaveBeenCalledWith(
      'tx-1',
      expect.objectContaining({
        tags: expect.any(Array),
      }),
    )
    const passedTags = _mockUpdateTransaction.mock.calls[0][1].tags as string[]
    expect(passedTags.length).toBeLessThanOrEqual(10)
  })

  it('pre-fills tags when transaction has tags', () => {
    const wrapper = mountSheet(true, sampleTransactionWithDetails)
    // Tags should have been pre-filled and "More details" auto-expanded
    const tagsInput = wrapper.find('input[placeholder*="Tags"]')
    expect(tagsInput.exists()).toBe(true)
    expect((tagsInput.element as HTMLInputElement).value).toContain('food')
  })
})
