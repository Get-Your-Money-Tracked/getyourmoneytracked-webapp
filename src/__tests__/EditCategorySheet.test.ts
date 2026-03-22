import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, reactive } from 'vue'
import EditCategorySheet from '@/components/categories/EditCategorySheet.vue'
import type { Category, Transaction } from '@/types'

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
const _updateCategory = vi.fn()
const _deleteCategory = vi.fn()
const _mockStoreCategories = ref<Category[]>([])

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      get categories() { return _mockStoreCategories.value },
      updateCategory: _updateCategory,
      deleteCategory: _deleteCategory,
      clearError: vi.fn(),
    }),
}))

const _mockTransactions = ref<Transaction[]>([])

vi.mock('@/stores/transactions', () => ({
  useTransactionsStore: () =>
    reactive({
      get transactions() { return _mockTransactions.value },
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

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    type: 'EXPENSE',
    amount: 1000,
    date: '2026-03-15',
    accountId: 'acc-1',
    toAccountId: null,
    categoryId: 'cat-1',
    description: 'Lunch',
    notes: null,
    tags: [],
    receiptUrl: null,
    createdAt: '2026-03-15T12:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
    ...overrides,
  }
}

function mountSheet(category: Category | null = makeCategory(), open = true) {
  return mount(EditCategorySheet, {
    props: { open, category },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('EditCategorySheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _mockTransactions.value = []
    _mockStoreCategories.value = []
  })

  it('renders edit sheet when open', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('pre-fills name field with category name', async () => {
    const wrapper = mountSheet(makeCategory({ name: 'Transport' }))
    await flushPromises()
    const nameInput = wrapper.find('#edit-category-name')
    expect((nameInput.element as HTMLInputElement).value).toBe('Transport')
  })

  it('shows name validation error when saving with empty name', async () => {
    const wrapper = mountSheet()
    await wrapper.find('#edit-category-name').setValue('')
    await wrapper.find('#edit-category-name').trigger('blur')
    await flushPromises()
    expect(wrapper.text()).toContain('Category name is required.')
  })

  it('calls updateCategory on save with valid name', async () => {
    _updateCategory.mockResolvedValueOnce(makeCategory({ name: 'Updated Food' }))
    const wrapper = mountSheet()
    await flushPromises()
    await wrapper.find('#edit-category-name').setValue('Updated Food')
    const saveBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Save')
    await saveBtn?.trigger('click')
    await flushPromises()
    expect(_updateCategory).toHaveBeenCalledWith('cat-1', expect.objectContaining({ name: 'Updated Food' }))
  })

  it('shows Delete button for non-default categories', () => {
    const wrapper = mountSheet(makeCategory({ isDefault: false }))
    expect(wrapper.text()).toContain('Delete Category')
  })

  it('does NOT show Delete button for default categories', () => {
    const wrapper = mountSheet(makeCategory({ isDefault: true }))
    expect(wrapper.text()).not.toContain('Delete Category')
  })

  it('shows confirmation dialog when Delete button is clicked', async () => {
    const wrapper = mountSheet(makeCategory({ isDefault: false }))
    const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Delete Category'))
    await deleteBtn?.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Delete Food?')
  })

  it('calls deleteCategory on confirmation', async () => {
    _deleteCategory.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet(makeCategory({ isDefault: false }))
    const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Delete Category'))
    await deleteBtn?.trigger('click')
    await flushPromises()
    const confirmBtn = wrapper.find('[role="alertdialog"]').findAll('button').at(-1)
    await confirmBtn?.trigger('click')
    await flushPromises()
    expect(_deleteCategory).toHaveBeenCalledWith('cat-1')
  })

  it('emits deleted event after successful delete', async () => {
    _deleteCategory.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet(makeCategory({ isDefault: false }))
    const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Delete Category'))
    await deleteBtn?.trigger('click')
    await flushPromises()
    const confirmBtn = wrapper.find('[role="alertdialog"]').findAll('button').at(-1)
    await confirmBtn?.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('deleted')).toBeTruthy()
  })

  it('shows sub-category read-only indicator when parentId is set', () => {
    const wrapper = mountSheet(makeCategory({ parentId: 'parent-1' }))
    expect(wrapper.text()).toContain('Sub-category')
  })

  it('disables Delete button when category has transactions', () => {
    _mockTransactions.value = [makeTransaction({ categoryId: 'cat-1' })]
    const wrapper = mountSheet(makeCategory({ id: 'cat-1', isDefault: false }))
    const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Delete Category'))
    expect(deleteBtn?.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Cannot delete a category that has transactions')
  })

  it('enables Delete button when category has no transactions', () => {
    _mockTransactions.value = [makeTransaction({ categoryId: 'cat-other' })]
    const wrapper = mountSheet(makeCategory({ id: 'cat-1', isDefault: false }))
    const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Delete Category'))
    expect(deleteBtn?.attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).not.toContain('Cannot delete a category that has transactions')
  })

  it('does not open delete dialog when delete button is disabled', async () => {
    _mockTransactions.value = [makeTransaction({ categoryId: 'cat-1' })]
    const wrapper = mountSheet(makeCategory({ id: 'cat-1', isDefault: false }))
    const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Delete Category'))
    await deleteBtn?.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
  })

  it('shows duplicate name warning when renaming to existing category name', async () => {
    _mockStoreCategories.value = [
      makeCategory({ id: 'cat-1', name: 'Food' }),
      makeCategory({ id: 'cat-2', name: 'Transport' }),
    ]
    const wrapper = mountSheet(makeCategory({ id: 'cat-1', name: 'Food' }))
    await flushPromises()
    await wrapper.find('#edit-category-name').setValue('Transport')
    await wrapper.find('#edit-category-name').trigger('blur')
    await flushPromises()
    expect(wrapper.text()).toContain('A category with this name already exists.')
  })

  it('does not show duplicate warning when keeping same name', async () => {
    _mockStoreCategories.value = [
      makeCategory({ id: 'cat-1', name: 'Food' }),
      makeCategory({ id: 'cat-2', name: 'Transport' }),
    ]
    const wrapper = mountSheet(makeCategory({ id: 'cat-1', name: 'Food' }))
    await flushPromises()
    await wrapper.find('#edit-category-name').trigger('blur')
    await flushPromises()
    expect(wrapper.text()).not.toContain('A category with this name already exists.')
  })
})
