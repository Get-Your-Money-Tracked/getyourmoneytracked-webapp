import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, reactive } from 'vue'
import AddCategorySheet from '@/components/categories/AddCategorySheet.vue'
import type { Category } from '@/types'

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
const _topLevelCategories = ref<Category[]>([])
const _mockCategories = ref<Category[]>([])
const _createCategory = vi.fn()

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      get topLevelCategories() {
        return _topLevelCategories.value
      },
      get categories() {
        return _mockCategories.value
      },
      createCategory: _createCategory,
      clearError: vi.fn(),
    }),
}))

function mountSheet(open = true) {
  return mount(AddCategorySheet, {
    props: { open },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('AddCategorySheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _topLevelCategories.value = []
    _mockCategories.value = []
  })

  it('renders sheet when open is true', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open is false', () => {
    const wrapper = mountSheet(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "New Category" title when open', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.text()).toContain('New Category')
  })

  it('renders name input', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('#add-category-name').exists()).toBe(true)
  })

  it('Save button is disabled when name is empty', () => {
    const wrapper = mountSheet(true)
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Category'))
    expect(saveBtn?.attributes('disabled')).toBeDefined()
  })

  it('Save button is enabled when name is filled', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('#add-category-name').setValue('Coffee')
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Category'))
    expect(saveBtn?.attributes('disabled')).toBeUndefined()
  })

  it('shows validation error when submitting with empty name', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('#add-category-name').trigger('blur')
    await flushPromises()
    expect(wrapper.text()).toContain('Category name is required.')
  })

  it('calls createCategory when form is valid and submitted', async () => {
    _createCategory.mockResolvedValueOnce({ id: 'cat-new', name: 'Coffee' })
    const wrapper = mountSheet(true)
    await wrapper.find('#add-category-name').setValue('Coffee')
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Category'))
    await saveBtn?.trigger('click')
    await flushPromises()
    expect(_createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Coffee' }),
    )
  })

  it('renders parent category dropdown', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('#add-category-parent').exists()).toBe(true)
  })

  it('populates parent dropdown with top-level categories', async () => {
    _topLevelCategories.value = [
      { id: 'cat-1', name: 'Food', icon: '🍽️', color: '#FF9800', parentId: null, isDefault: true, sortOrder: 0 },
    ]
    const wrapper = mountSheet(true)
    await flushPromises()
    expect(wrapper.text()).toContain('Food')
  })

  it('renders icon grid options', () => {
    const wrapper = mountSheet(true)
    // Should have multiple icon buttons
    const iconBtns = wrapper.findAll('[aria-label^="Select icon"]')
    expect(iconBtns.length).toBeGreaterThan(0)
  })

  it('renders color swatch options', () => {
    const wrapper = mountSheet(true)
    const colorBtns = wrapper.findAll('[aria-label^="Select color"]')
    expect(colorBtns.length).toBeGreaterThan(0)
  })

  it('shows duplicate name warning when category name already exists', async () => {
    _mockCategories.value = [
      { id: 'cat-1', name: 'Food', icon: '🍽️', color: '#FF9800', parentId: null, isDefault: false, sortOrder: 0 },
    ]
    const wrapper = mountSheet(true)
    await wrapper.find('#add-category-name').setValue('Food')
    await wrapper.find('#add-category-name').trigger('blur')
    await flushPromises()
    expect(wrapper.text()).toContain('A category with this name already exists.')
  })

  it('does not show duplicate warning for unique names', async () => {
    _mockCategories.value = [
      { id: 'cat-1', name: 'Food', icon: '🍽️', color: '#FF9800', parentId: null, isDefault: false, sortOrder: 0 },
    ]
    const wrapper = mountSheet(true)
    await wrapper.find('#add-category-name').setValue('Transport')
    await wrapper.find('#add-category-name').trigger('blur')
    await flushPromises()
    expect(wrapper.text()).not.toContain('A category with this name already exists.')
  })
})
