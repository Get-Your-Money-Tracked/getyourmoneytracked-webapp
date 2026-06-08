import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import AddSubscriptionSheet from '@/components/subscriptions/AddSubscriptionSheet.vue'
import type { Category, Account } from '@/types'

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

// ── Store mock ────────────────────────────────────────────────
const _mockCreateSubscription = vi.fn()

vi.mock('@/stores/subscriptions', () => ({
  useSubscriptionsStore: () =>
    reactive({
      createSubscription: _mockCreateSubscription,
    }),
}))

// ── Fixtures ──────────────────────────────────────────────────
function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Entertainment',
    icon: '📺',
    color: '#FF5722',
    parentId: null,
    isDefault: false,
    sortOrder: 0,
    ...overrides,
  }
}

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    name: 'Cash Wallet',
    type: 'CASH',
    currency: 'USD',
    balance: 500,
    icon: null,
    isDefault: true,
    includeInTotal: true,
    ...overrides,
  }
}

const defaultCategories: Category[] = [
  makeCategory({ id: 'cat-1', name: 'Entertainment', icon: '📺' }),
  makeCategory({ id: 'cat-2', name: 'Food', icon: '🍽️' }),
]

const defaultAccounts: Account[] = [
  makeAccount({ id: 'acc-1', name: 'Cash Wallet', isDefault: true }),
  makeAccount({ id: 'acc-2', name: 'Bank Account', isDefault: false }),
]

function mountSheet(open = true, categories = defaultCategories, accounts = defaultAccounts) {
  return mount(AddSubscriptionSheet, {
    props: { open, categories, accounts, currency: 'USD' },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('AddSubscriptionSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  // ── Rendering ────────────────────────────────────────────────
  it('renders sheet when open is true', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open is false', () => {
    const wrapper = mountSheet(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "Add Subscription" title when open', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.text()).toContain('Add Subscription')
  })

  it('renders name input', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="name-input"]').exists()).toBe(true)
  })

  it('renders type segmented control with Expense and Income buttons', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="type-expense-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="type-income-btn"]').exists()).toBe(true)
  })

  it('defaults to Expense type', () => {
    const wrapper = mountSheet(true)
    const expenseBtn = wrapper.find('[data-testid="type-expense-btn"]')
    expect(expenseBtn.attributes('style') ?? '').toContain('background-color')
  })

  it('renders amount input', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="amount-input"]').exists()).toBe(true)
  })

  it('renders category select', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="category-select"]').exists()).toBe(true)
  })

  it('renders account select', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="account-select"]').exists()).toBe(true)
  })

  it('renders monthly info note', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="monthly-info"]').exists()).toBe(true)
  })

  it('does not render any frequency toggle (monthly-only)', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="freq-monthly-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="freq-weekly-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="freq-yearly-btn"]').exists()).toBe(false)
  })

  it('does not render day-of-month input (always 1st of month)', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="day-of-month-section"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="day-of-month-input"]').exists()).toBe(false)
  })

  it('does not render include-current-month toggle (always includes current month)', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="include-current-month-section"]').exists()).toBe(false)
  })

  // ── Submit button disabled state ──────────────────────────────
  it('submit button is disabled when form is empty', () => {
    const wrapper = mountSheet(true)
    const btn = wrapper.find('[data-testid="add-submit-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('submit button is disabled when name filled but no amount', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Netflix')
    const btn = wrapper.find('[data-testid="add-submit-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('submit button is enabled when all required fields filled', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Netflix')
    await wrapper.find('[data-testid="amount-input"]').setValue('15.99')
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="account-select"]').setValue('acc-1')
    const btn = wrapper.find('[data-testid="add-submit-btn"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  // ── Validation errors ─────────────────────────────────────────
  it('shows name error when blurring with empty name', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="name-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Name is required.')
  })

  it('shows amount error when blurring with 0 amount', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="amount-input"]').setValue('0')
    await wrapper.find('[data-testid="amount-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="amount-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Amount must be greater than 0.')
  })

  // ── Type toggle ───────────────────────────────────────────────
  it('switches to Income type when Income button clicked', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="type-income-btn"]').trigger('click')
    const incomeBtn = wrapper.find('[data-testid="type-income-btn"]')
    expect(incomeBtn.attributes('style') ?? '').toContain('background-color')
  })

  it('switches back to Expense type when Expense button clicked', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="type-income-btn"]').trigger('click')
    await wrapper.find('[data-testid="type-expense-btn"]').trigger('click')
    const expenseBtn = wrapper.find('[data-testid="type-expense-btn"]')
    expect(expenseBtn.attributes('style') ?? '').toContain('background-color')
  })

  // ── Category / Account options ────────────────────────────────
  it('renders category options', () => {
    const wrapper = mountSheet(true)
    const options = wrapper.findAll('[data-testid="category-select"] option')
    const labels = options.map((o) => o.text())
    expect(labels.some((l) => l.includes('Entertainment'))).toBe(true)
    expect(labels.some((l) => l.includes('Food'))).toBe(true)
  })

  it('renders account options', () => {
    const wrapper = mountSheet(true)
    const options = wrapper.findAll('[data-testid="account-select"] option')
    const labels = options.map((o) => o.text())
    expect(labels.some((l) => l.includes('Cash Wallet'))).toBe(true)
    expect(labels.some((l) => l.includes('Bank Account'))).toBe(true)
  })

  it('marks default account with "(default)" label', () => {
    const wrapper = mountSheet(true)
    const options = wrapper.findAll('[data-testid="account-select"] option')
    const defaultOption = options.find((o) => o.text().includes('(default)'))
    expect(defaultOption).toBeDefined()
  })

  // ── Submit ────────────────────────────────────────────────────
  it('calls createSubscription with correct payload on submit', async () => {
    _mockCreateSubscription.mockResolvedValueOnce({ id: 'sub-new' })
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Netflix')
    await wrapper.find('[data-testid="amount-input"]').setValue('15.99')
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="account-select"]').setValue('acc-1')
    await wrapper.find('[data-testid="add-submit-btn"]').trigger('click')
    await flushPromises()
    expect(_mockCreateSubscription).toHaveBeenCalledWith({
      name: 'Netflix',
      type: 'EXPENSE',
      amount: 15.99,
      categoryId: 'cat-1',
      accountId: 'acc-1',
    })
  })

  it('does not send any frequency, dayOfMonth, or includeCurrentMonth fields', async () => {
    _mockCreateSubscription.mockResolvedValueOnce({ id: 'sub-new' })
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Netflix')
    await wrapper.find('[data-testid="amount-input"]').setValue('15.99')
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="account-select"]').setValue('acc-1')
    await wrapper.find('[data-testid="add-submit-btn"]').trigger('click')
    await flushPromises()
    const payload = _mockCreateSubscription.mock.calls[0][0]
    expect(payload).not.toHaveProperty('frequency')
    expect(payload).not.toHaveProperty('dayOfMonth')
    expect(payload).not.toHaveProperty('autoLog')
    expect(payload).not.toHaveProperty('startDate')
    expect(payload).not.toHaveProperty('includeCurrentMonth')
  })

  it('emits created and close after successful creation', async () => {
    _mockCreateSubscription.mockResolvedValueOnce({ id: 'sub-new' })
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Netflix')
    await wrapper.find('[data-testid="amount-input"]').setValue('15.99')
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="account-select"]').setValue('acc-1')
    await wrapper.find('[data-testid="add-submit-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('created')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows submit error when API call fails', async () => {
    _mockCreateSubscription.mockRejectedValueOnce(new Error('Duplicate subscription'))
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Netflix')
    await wrapper.find('[data-testid="amount-input"]').setValue('15.99')
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="account-select"]').setValue('acc-1')
    await wrapper.find('[data-testid="add-submit-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="submit-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Duplicate subscription')
  })

  it('resets form when sheet reopens', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Netflix')
    await wrapper.find('[data-testid="amount-input"]').setValue('15.99')
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect((wrapper.find('[data-testid="name-input"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('[data-testid="amount-input"]').element as HTMLInputElement).value).toBe('')
  })
})
