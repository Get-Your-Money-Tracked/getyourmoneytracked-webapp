import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import EditSubscriptionSheet from '@/components/subscriptions/EditSubscriptionSheet.vue'
import type { SubscriptionEntry, Category, Account } from '@/types'

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
const _mockUpdateSubscription = vi.fn()
const _mockDeleteSubscription = vi.fn()
const _mockCreateSubscription = vi.fn()

vi.mock('@/stores/subscriptions', () => ({
  useSubscriptionsStore: () =>
    reactive({
      updateSubscription: _mockUpdateSubscription,
      deleteSubscription: _mockDeleteSubscription,
      createSubscription: _mockCreateSubscription,
    }),
}))

// ── Toast store mock ──────────────────────────────────────────
const _mockToastShow = vi.fn()

vi.mock('@/stores/toast', () => ({
  useToastStore: () => reactive({ show: _mockToastShow }),
}))

// ── Fixtures ──────────────────────────────────────────────────
const defaultCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Entertainment',
    icon: '📺',
    color: '#FF5722',
    parentId: null,
    isDefault: false,
    sortOrder: 0,
  },
  {
    id: 'cat-2',
    name: 'Food',
    icon: '🍽️',
    color: '#FF9800',
    parentId: null,
    isDefault: false,
    sortOrder: 1,
  },
]

const defaultAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Cash Wallet',
    type: 'CASH',
    currency: 'USD',
    balance: 500,
    icon: null,
    isDefault: true,
    includeInTotal: true,
  },
]

function makeSub(overrides: Partial<SubscriptionEntry> = {}): SubscriptionEntry {
  return {
    id: 'sub-1',
    name: 'Netflix',
    type: 'EXPENSE',
    amount: 15.99,
    frequency: 'MONTHLY',
    dayOfMonth: 25,
    nextDueDate: '2026-03-25',
    isActive: true,
    autoLog: false,
    category: defaultCategories[0],
    account: defaultAccounts[0],
    ...overrides,
  }
}

function mountSheet(
  subscription: SubscriptionEntry | null = makeSub(),
  open = true,
  categories = defaultCategories,
  accounts = defaultAccounts,
) {
  return mount(EditSubscriptionSheet, {
    props: { open, subscription, categories, accounts, currency: 'USD' },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('EditSubscriptionSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  // ── Rendering ────────────────────────────────────────────────
  it('renders sheet when open is true', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open is false', () => {
    const wrapper = mountSheet(makeSub(), false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "Edit Subscription" title', () => {
    const wrapper = mountSheet()
    expect(wrapper.text()).toContain('Edit Subscription')
  })

  // ── Pre-fill ──────────────────────────────────────────────────
  it('pre-fills name input with subscription name', async () => {
    const wrapper = mountSheet(makeSub({ name: 'Spotify' }))
    await flushPromises()
    const input = wrapper.find('[data-testid="edit-name-input"]').element as HTMLInputElement
    expect(input.value).toBe('Spotify')
  })

  it('pre-fills amount input with subscription amount', async () => {
    const wrapper = mountSheet(makeSub({ amount: 9.99 }))
    await flushPromises()
    const input = wrapper.find('[data-testid="edit-amount-input"]').element as HTMLInputElement
    expect(parseFloat(input.value)).toBe(9.99)
  })

  it('pre-fills category select with subscription category', async () => {
    const wrapper = mountSheet(makeSub({ category: defaultCategories[0] }))
    await flushPromises()
    const select = wrapper.find('[data-testid="category-select"]').element as HTMLSelectElement
    expect(select.value).toBe('cat-1')
  })

  it('pre-fills account select with subscription account', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    const select = wrapper.find('[data-testid="account-select"]').element as HTMLSelectElement
    expect(select.value).toBe('acc-1')
  })

  it('shows active status as selected for active subscription', async () => {
    const wrapper = mountSheet(makeSub({ isActive: true }))
    await flushPromises()
    const activeBtn = wrapper.find('[data-testid="status-active-btn"]')
    expect(activeBtn.attributes('style') ?? '').toContain('background-color')
  })

  it('shows inactive status as selected for inactive subscription', async () => {
    const wrapper = mountSheet(makeSub({ isActive: false }))
    await flushPromises()
    const inactiveBtn = wrapper.find('[data-testid="status-inactive-btn"]')
    expect(inactiveBtn.attributes('style') ?? '').toContain('background-color')
  })

  // ── Day-of-month visibility ───────────────────────────────────
  it('shows day-of-month section when frequency is MONTHLY', async () => {
    const wrapper = mountSheet(makeSub({ frequency: 'MONTHLY' }))
    await flushPromises()
    expect(wrapper.find('[data-testid="day-of-month-section"]').exists()).toBe(true)
  })

  it('hides day-of-month section when frequency is WEEKLY', async () => {
    const wrapper = mountSheet(makeSub({ frequency: 'WEEKLY', dayOfMonth: null }))
    await flushPromises()
    expect(wrapper.find('[data-testid="day-of-month-section"]').exists()).toBe(false)
  })

  it('hides day-of-month section when user switches to Weekly', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="freq-weekly-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="day-of-month-section"]').exists()).toBe(false)
  })

  // ── Validation ────────────────────────────────────────────────
  it('shows name error when blurring with empty name', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="edit-name-input"]').setValue('')
    await wrapper.find('[data-testid="edit-name-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="name-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Name is required.')
  })

  it('shows amount error when blurring with 0 amount', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('0')
    await wrapper.find('[data-testid="edit-amount-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="amount-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Amount must be greater than 0.')
  })

  it('shows day-of-month error for invalid day', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="day-of-month-input"]').setValue('99')
    await wrapper.find('[data-testid="day-of-month-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="day-of-month-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Day must be between 1 and 31.')
  })

  // ── Update button state ───────────────────────────────────────
  it('Update button is enabled with valid pre-filled data', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    const btn = wrapper.find('[data-testid="update-btn"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('Update button is disabled when amount is cleared to 0', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('0')
    const btn = wrapper.find('[data-testid="update-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('Update button is disabled when name is cleared', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="edit-name-input"]').setValue('')
    const btn = wrapper.find('[data-testid="update-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  // ── Update submit ─────────────────────────────────────────────
  it('calls updateSubscription with correct payload', async () => {
    _mockUpdateSubscription.mockResolvedValueOnce(makeSub({ amount: 19.99 }))
    const wrapper = mountSheet(makeSub({ amount: 15.99 }))
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('19.99')
    await wrapper.find('[data-testid="update-btn"]').trigger('click')
    await flushPromises()
    expect(_mockUpdateSubscription).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ amount: 19.99, name: 'Netflix' }),
    )
  })

  it('emits saved and close after successful update', async () => {
    _mockUpdateSubscription.mockResolvedValueOnce(makeSub())
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="update-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('saved')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows update error when API call fails', async () => {
    _mockUpdateSubscription.mockRejectedValueOnce(new Error('Server error'))
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="update-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="update-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Server error')
  })

  // ── Status toggle ─────────────────────────────────────────────
  it('can toggle status from Active to Inactive', async () => {
    const wrapper = mountSheet(makeSub({ isActive: true }))
    await flushPromises()
    await wrapper.find('[data-testid="status-inactive-btn"]').trigger('click')
    const inactiveBtn = wrapper.find('[data-testid="status-inactive-btn"]')
    expect(inactiveBtn.attributes('style') ?? '').toContain('background-color')
  })

  it('passes isActive=false in payload when toggled to Inactive', async () => {
    _mockUpdateSubscription.mockResolvedValueOnce(makeSub({ isActive: false }))
    const wrapper = mountSheet(makeSub({ isActive: true }))
    await flushPromises()
    await wrapper.find('[data-testid="status-inactive-btn"]').trigger('click')
    await wrapper.find('[data-testid="update-btn"]').trigger('click')
    await flushPromises()
    expect(_mockUpdateSubscription).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ isActive: false }),
    )
  })

  // ── autoLog toggle ────────────────────────────────────────────
  it('renders auto-log section', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    expect(wrapper.find('[data-testid="autolog-section"]').exists()).toBe(true)
  })

  it('pre-fills autoLog=false when subscription has autoLog=false', async () => {
    const wrapper = mountSheet(makeSub({ autoLog: false }))
    await flushPromises()
    const cb = wrapper.find('[data-testid="autolog-toggle"]').element as HTMLInputElement
    expect(cb.checked).toBe(false)
  })

  it('pre-fills autoLog=true when subscription has autoLog=true', async () => {
    const wrapper = mountSheet(makeSub({ autoLog: true }))
    await flushPromises()
    const cb = wrapper.find('[data-testid="autolog-toggle"]').element as HTMLInputElement
    expect(cb.checked).toBe(true)
  })

  it('submits with autoLog=true when toggled on', async () => {
    _mockUpdateSubscription.mockResolvedValueOnce(makeSub({ autoLog: true }))
    const wrapper = mountSheet(makeSub({ autoLog: false }))
    await flushPromises()
    await wrapper.find('[data-testid="autolog-toggle"]').setValue(true)
    await wrapper.find('[data-testid="update-btn"]').trigger('click')
    await flushPromises()
    expect(_mockUpdateSubscription).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ autoLog: true }),
    )
  })

  it('submits with autoLog=false when toggled off', async () => {
    _mockUpdateSubscription.mockResolvedValueOnce(makeSub({ autoLog: false }))
    const wrapper = mountSheet(makeSub({ autoLog: true }))
    await flushPromises()
    await wrapper.find('[data-testid="autolog-toggle"]').setValue(false)
    await wrapper.find('[data-testid="update-btn"]').trigger('click')
    await flushPromises()
    expect(_mockUpdateSubscription).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ autoLog: false }),
    )
  })

  // ── Delete flow ───────────────────────────────────────────────
  it('renders Delete Subscription button', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[data-testid="delete-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="delete-btn"]').text()).toContain('Delete Subscription')
  })

  it('shows confirmation dialog when Delete button clicked', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').exists()).toBe(true)
  })

  it('confirmation dialog contains subscription name', async () => {
    const wrapper = mountSheet(makeSub({ name: 'Netflix' }))
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    const dialog = wrapper.find('[data-testid="delete-confirm-dialog"]')
    expect(dialog.text()).toContain('Netflix')
  })

  it('calls deleteSubscription on confirming delete', async () => {
    _mockDeleteSubscription.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-confirm-btn"]').trigger('click')
    await flushPromises()
    expect(_mockDeleteSubscription).toHaveBeenCalledWith('sub-1')
  })

  it('emits deleted and close after successful delete', async () => {
    _mockDeleteSubscription.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-confirm-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('deleted')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does NOT call deleteSubscription when Cancel clicked', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(_mockDeleteSubscription).not.toHaveBeenCalled()
  })

  it('hides confirmation dialog after Cancel', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').exists()).toBe(false)
  })

  it('fires exactly one toast (with Undo) when delete is confirmed', async () => {
    _mockDeleteSubscription.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-confirm-btn"]').trigger('click')
    await flushPromises()
    expect(_mockToastShow).toHaveBeenCalledTimes(1)
    expect(_mockToastShow).toHaveBeenCalledWith(
      'Recurring item deleted',
      'success',
      5000,
      expect.objectContaining({ label: 'Undo' }),
    )
  })
})
