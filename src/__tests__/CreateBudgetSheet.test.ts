import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import CreateBudgetSheet from '@/components/budgets/CreateBudgetSheet.vue'
import type { Category, Budget } from '@/types'

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
const _mockBudgetedCategoryIds = ref<Set<string>>(new Set())
const _mockCreateBudget = vi.fn()

vi.mock('@/stores/budgets', () => ({
  useBudgetsStore: () =>
    reactive({
      get budgetedCategoryIds() { return _mockBudgetedCategoryIds.value },
      createBudget: _mockCreateBudget,
    }),
}))

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Food',
    icon: '🍽️',
    color: '#FF9800',
    parentId: null,
    isDefault: false,
    sortOrder: 0,
    ...overrides,
  }
}

const defaultCategories: Category[] = [
  makeCategory({ id: 'cat-1', name: 'Food', icon: '🍽️' }),
  makeCategory({ id: 'cat-2', name: 'Transport', icon: '🚗' }),
]

function mountSheet(open = true, categories = defaultCategories) {
  return mount(CreateBudgetSheet, {
    props: { open, categories, currency: 'USD' },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('CreateBudgetSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _mockBudgetedCategoryIds.value = new Set()
  })

  it('renders sheet when open is true', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open is false', () => {
    const wrapper = mountSheet(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "Create Budget" title when open', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.text()).toContain('Create Budget')
  })

  it('renders category select dropdown', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="category-select"]').exists()).toBe(true)
  })

  it('renders amount input', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="amount-input"]').exists()).toBe(true)
  })

  it('Create button is disabled when no category selected and no amount', () => {
    const wrapper = mountSheet(true)
    const btn = wrapper.find('[data-testid="create-submit-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('Create button is disabled when category selected but amount is 0', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="amount-input"]').setValue('0')
    const btn = wrapper.find('[data-testid="create-submit-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('Create button is enabled when category and valid amount are set', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="amount-input"]').setValue('150')
    const btn = wrapper.find('[data-testid="create-submit-btn"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('shows amount validation error when blurring with 0 amount', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="amount-input"]').setValue('0')
    await wrapper.find('[data-testid="amount-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="amount-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Amount must be greater than 0')
  })

  it('calls createBudget when form is valid and submitted', async () => {
    _mockCreateBudget.mockResolvedValueOnce({ id: 'new-budget' } as Budget)
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="amount-input"]').setValue('200')
    await wrapper.find('[data-testid="create-submit-btn"]').trigger('click')
    await flushPromises()
    expect(_mockCreateBudget).toHaveBeenCalledWith({ categoryId: 'cat-1', amount: 200 })
  })

  it('emits created and close after successful creation', async () => {
    _mockCreateBudget.mockResolvedValueOnce({ id: 'new-budget' } as Budget)
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="amount-input"]').setValue('200')
    await wrapper.find('[data-testid="create-submit-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('created')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('excludes already-budgeted categories from enabled options', async () => {
    _mockBudgetedCategoryIds.value = new Set(['cat-1'])
    const wrapper = mountSheet(true)
    await flushPromises()
    // cat-1 should appear as disabled with "(budgeted)" suffix
    const options = wrapper.findAll('[data-testid="category-select"] option')
    const budgetedOption = options.find((o) => o.text().includes('(budgeted)'))
    expect(budgetedOption).toBeDefined()
    expect(budgetedOption?.attributes('disabled')).toBeDefined()
  })

  it('shows available (non-budgeted) categories as enabled options', async () => {
    _mockBudgetedCategoryIds.value = new Set(['cat-1'])
    const wrapper = mountSheet(true)
    await flushPromises()
    // cat-2 (Transport) should be an enabled option
    const options = wrapper.findAll('[data-testid="category-select"] option')
    const transportOption = options.find((o) => o.text().includes('Transport') && !o.text().includes('budgeted'))
    expect(transportOption).toBeDefined()
    expect(transportOption?.attributes('disabled')).toBeUndefined()
  })

  it('shows submit error when API call fails', async () => {
    _mockCreateBudget.mockRejectedValueOnce(new Error('Duplicate budget'))
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="amount-input"]').setValue('200')
    await wrapper.find('[data-testid="create-submit-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="submit-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Duplicate budget')
  })

  it('resets form fields when sheet reopens', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="category-select"]').setValue('cat-1')
    await wrapper.find('[data-testid="amount-input"]').setValue('200')
    // Close and reopen
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect((wrapper.find('[data-testid="amount-input"]').element as HTMLInputElement).value).toBe('')
  })
})
