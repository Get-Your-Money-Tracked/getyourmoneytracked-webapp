import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import EditBudgetSheet from '@/components/budgets/EditBudgetSheet.vue'
import type { Budget } from '@/types'

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
const _mockUpdateBudget = vi.fn()
const _mockDeleteBudget = vi.fn()

vi.mock('@/stores/budgets', () => ({
  useBudgetsStore: () =>
    reactive({
      updateBudget: _mockUpdateBudget,
      deleteBudget: _mockDeleteBudget,
    }),
}))

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    month: '2026-03-01',
    amount: 150,
    spent: 80,
    remaining: 70,
    percentUsed: 53,
    category: {
      id: 'cat-1',
      name: 'Food',
      icon: '🍽️',
      color: '#FF9800',
      parentId: null,
      isDefault: false,
      sortOrder: 0,
    },
    ...overrides,
  }
}

function mountSheet(budget: Budget | null = makeBudget(), open = true) {
  return mount(EditBudgetSheet, {
    props: { open, budget, currency: 'USD' },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('EditBudgetSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders sheet when open is true', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open is false', () => {
    const wrapper = mountSheet(makeBudget(), false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "Edit Budget" title', () => {
    const wrapper = mountSheet()
    expect(wrapper.text()).toContain('Edit Budget')
  })

  it('renders read-only category field', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[data-testid="readonly-category"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="readonly-category"]').text()).toContain('Food')
  })

  it('renders read-only month field', () => {
    const wrapper = mountSheet(makeBudget({ month: '2026-03-01' }))
    expect(wrapper.find('[data-testid="readonly-month"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="readonly-month"]').text()).toContain('March 2026')
  })

  it('pre-fills amount input with current budget amount', async () => {
    const wrapper = mountSheet(makeBudget({ amount: 150 }))
    await flushPromises()
    const input = wrapper.find('[data-testid="edit-amount-input"]').element as HTMLInputElement
    expect(parseFloat(input.value)).toBe(150)
  })

  it('renders current spending info', () => {
    const wrapper = mountSheet(makeBudget({ spent: 80, amount: 150 }))
    expect(wrapper.find('[data-testid="current-spending"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="current-spending"]').text()).toContain('$80.00')
  })

  it('Update button is disabled when amount unchanged', async () => {
    const wrapper = mountSheet(makeBudget({ amount: 150 }))
    await flushPromises()
    const btn = wrapper.find('[data-testid="update-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('Update button is enabled when amount changed to valid value', async () => {
    const wrapper = mountSheet(makeBudget({ amount: 150 }))
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('200')
    const btn = wrapper.find('[data-testid="update-btn"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('Update button is disabled when amount is 0', async () => {
    const wrapper = mountSheet(makeBudget({ amount: 150 }))
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('0')
    const btn = wrapper.find('[data-testid="update-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('shows amount validation error when blurring with 0 amount', async () => {
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('0')
    await wrapper.find('[data-testid="edit-amount-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="amount-error"]').exists()).toBe(true)
  })

  it('shows over-budget warning when new amount < current spent', async () => {
    const wrapper = mountSheet(makeBudget({ spent: 80, amount: 150 }))
    await flushPromises()
    // Set new amount less than spent (80)
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('50')
    await flushPromises()
    expect(wrapper.find('[data-testid="over-budget-warning"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('This limit is already exceeded.')
  })

  it('does not show over-budget warning when new amount >= spent', async () => {
    const wrapper = mountSheet(makeBudget({ spent: 80, amount: 150 }))
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('200')
    await flushPromises()
    expect(wrapper.find('[data-testid="over-budget-warning"]').exists()).toBe(false)
  })

  it('calls updateBudget on clicking Update with valid changed amount', async () => {
    _mockUpdateBudget.mockResolvedValueOnce(makeBudget({ amount: 200 }))
    const wrapper = mountSheet(makeBudget({ amount: 150 }))
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('200')
    await wrapper.find('[data-testid="update-btn"]').trigger('click')
    await flushPromises()
    expect(_mockUpdateBudget).toHaveBeenCalledWith('budget-1', { amount: 200 })
  })

  it('emits saved and close after successful update', async () => {
    _mockUpdateBudget.mockResolvedValueOnce(makeBudget({ amount: 200 }))
    const wrapper = mountSheet(makeBudget({ amount: 150 }))
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('200')
    await wrapper.find('[data-testid="update-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('saved')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('renders Delete Budget button', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[data-testid="delete-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="delete-btn"]').text()).toContain('Delete Budget')
  })

  it('shows confirmation dialog when Delete Budget clicked', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').exists()).toBe(true)
  })

  it('confirmation dialog shows category name and amount', async () => {
    const wrapper = mountSheet(makeBudget({ amount: 150, category: { id: 'c1', name: 'Food', icon: '🍽️', color: null, parentId: null, isDefault: false, sortOrder: 0 } }))
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    const dialog = wrapper.find('[data-testid="delete-confirm-dialog"]')
    expect(dialog.text()).toContain('Food')
    expect(dialog.text()).toContain('$150.00')
  })

  it('calls deleteBudget on confirming delete', async () => {
    _mockDeleteBudget.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-confirm-btn"]').trigger('click')
    await flushPromises()
    expect(_mockDeleteBudget).toHaveBeenCalledWith('budget-1')
  })

  it('emits deleted and close after successful delete', async () => {
    _mockDeleteBudget.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-confirm-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('deleted')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does NOT call deleteBudget when Cancel is clicked in dialog', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(_mockDeleteBudget).not.toHaveBeenCalled()
  })

  it('hides confirmation dialog after Cancel', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').exists()).toBe(false)
  })

  it('shows update error when API call fails', async () => {
    _mockUpdateBudget.mockRejectedValueOnce(new Error('Server error'))
    const wrapper = mountSheet(makeBudget({ amount: 150 }))
    await flushPromises()
    await wrapper.find('[data-testid="edit-amount-input"]').setValue('200')
    await wrapper.find('[data-testid="update-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="update-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Server error')
  })
})
