import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, reactive } from 'vue'
import CategoryChip from '@/components/common/CategoryChip.vue'
import CategoryPicker from '@/components/common/CategoryPicker.vue'
import type { Category, TransactionType } from '@/types'
import type { CategoryWithChildren } from '@/stores/categories'

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn() })),
    mutation: vi.fn(() => ({ toPromise: vi.fn() })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

// ── Store mock ────────────────────────────────────────────────────────────────
const _nestedCategories = ref<CategoryWithChildren[]>([])

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      get nestedCategories() {
        return _nestedCategories.value
      },
    }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function makeNested(cat: Category, children: Category[] = []): CategoryWithChildren {
  return { ...cat, children }
}

// ─────────────────────────────────────────────────────────────────────────────
// CategoryChip tests
// ─────────────────────────────────────────────────────────────────────────────
describe('CategoryChip', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders category icon', () => {
    const cat = makeCategory({ icon: '🚗' })
    const wrapper = mount(CategoryChip, { props: { category: cat } })
    expect(wrapper.text()).toContain('🚗')
  })

  it('renders truncated label (≤8 chars shown in full)', () => {
    const cat = makeCategory({ name: 'Food' })
    const wrapper = mount(CategoryChip, { props: { category: cat } })
    expect(wrapper.text()).toContain('Food')
  })

  it('truncates label longer than 8 characters', () => {
    const cat = makeCategory({ name: 'Restaurant' }) // 10 chars → slice(0,7) + '…' = 'Restaur…'
    const wrapper = mount(CategoryChip, { props: { category: cat } })
    expect(wrapper.text()).toContain('Restaur…')
  })

  it('sets aria-pressed="true" when selected', () => {
    const cat = makeCategory()
    const wrapper = mount(CategoryChip, { props: { category: cat, selected: true } })
    expect(wrapper.find('button').attributes('aria-pressed')).toBe('true')
  })

  it('sets aria-pressed="false" when not selected', () => {
    const cat = makeCategory()
    const wrapper = mount(CategoryChip, { props: { category: cat, selected: false } })
    expect(wrapper.find('button').attributes('aria-pressed')).toBe('false')
  })

  it('emits select with the category when clicked', async () => {
    const cat = makeCategory()
    const wrapper = mount(CategoryChip, { props: { category: cat } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([cat])
  })

  it('shows › indicator when hasChildren is true', () => {
    const cat = makeCategory()
    const wrapper = mount(CategoryChip, { props: { category: cat, hasChildren: true } })
    expect(wrapper.text()).toContain('›')
  })

  it('does not show › indicator when hasChildren is false', () => {
    const cat = makeCategory()
    const wrapper = mount(CategoryChip, { props: { category: cat, hasChildren: false } })
    expect(wrapper.text()).not.toContain('›')
  })

  it('uses fallback icon when icon is null', () => {
    const cat = makeCategory({ icon: null })
    const wrapper = mount(CategoryChip, { props: { category: cat } })
    expect(wrapper.text()).toContain('📂')
  })

  it('sets aria-label to category name', () => {
    const cat = makeCategory({ name: 'Transport' })
    const wrapper = mount(CategoryChip, { props: { category: cat } })
    expect(wrapper.find('button').attributes('aria-label')).toBe('Transport')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CategoryPicker tests
// ─────────────────────────────────────────────────────────────────────────────
describe('CategoryPicker', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _nestedCategories.value = []
  })

  function mountPicker(props: {
    modelValue: string | null
    transactionType?: TransactionType
  }) {
    return mount(CategoryPicker, {
      props,
      global: { plugins: [createPinia()] },
    })
  }

  it('renders category chips for each top-level category', () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Food' })),
      makeNested(makeCategory({ id: 'cat-2', name: 'Travel' })), // 6 chars — fits without truncation
    ]
    const wrapper = mountPicker({ modelValue: null })
    expect(wrapper.text()).toContain('Food')
    expect(wrapper.text()).toContain('Travel')
  })

  it('marks the selected chip with aria-pressed="true"', () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Food' })),
    ]
    const wrapper = mountPicker({ modelValue: 'cat-1' })
    const btn = wrapper.find('button[aria-label="Food"]')
    expect(btn.attributes('aria-pressed')).toBe('true')
  })

  it('marks non-selected chips with aria-pressed="false"', () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Food' })),
      makeNested(makeCategory({ id: 'cat-2', name: 'Transport' })),
    ]
    const wrapper = mountPicker({ modelValue: 'cat-1' })
    const btn = wrapper.find('button[aria-label="Transport"]')
    expect(btn.attributes('aria-pressed')).toBe('false')
  })

  it('emits update:modelValue with category id when a chip is clicked', async () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Food' })),
    ]
    const wrapper = mountPicker({ modelValue: null })
    await wrapper.find('button[aria-label="Food"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['cat-1'])
  })

  it('emits update:modelValue with null when already-selected chip is clicked (deselect)', async () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Food' })),
    ]
    const wrapper = mountPicker({ modelValue: 'cat-1' })
    await wrapper.find('button[aria-label="Food"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
  })

  it('is hidden when transactionType is TRANSFER', () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Food' })),
    ]
    const wrapper = mountPicker({ modelValue: null, transactionType: 'TRANSFER' })
    // The outer div has v-if="isVisible", so it should not render
    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('is visible when transactionType is EXPENSE', () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Food' })),
    ]
    const wrapper = mountPicker({ modelValue: null, transactionType: 'EXPENSE' })
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('expands to show sub-categories when a parent with children is clicked', async () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Housing' }), [
        makeCategory({ id: 'sub-1', name: 'Rent', parentId: 'cat-1' }),
        makeCategory({ id: 'sub-2', name: 'Bills', parentId: 'cat-1' }), // 5 chars — no truncation
      ]),
    ]
    const wrapper = mountPicker({ modelValue: null })
    // Click the parent chip
    await wrapper.find('button[aria-label="Housing"]').trigger('click')
    // Should now show sub-categories
    expect(wrapper.text()).toContain('Rent')
    expect(wrapper.text()).toContain('Bills')
  })

  it('shows Back button when in sub-category view', async () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Housing' }), [
        makeCategory({ id: 'sub-1', name: 'Rent', parentId: 'cat-1' }),
      ]),
    ]
    const wrapper = mountPicker({ modelValue: null })
    await wrapper.find('button[aria-label="Housing"]').trigger('click')
    expect(wrapper.find('button[aria-label="Back to categories"]').exists()).toBe(true)
  })

  it('returns to top-level view when Back button is clicked', async () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Housing' }), [
        makeCategory({ id: 'sub-1', name: 'Rent', parentId: 'cat-1' }),
      ]),
    ]
    const wrapper = mountPicker({ modelValue: null })
    // Expand
    await wrapper.find('button[aria-label="Housing"]').trigger('click')
    expect(wrapper.text()).toContain('Rent')
    // Go back
    await wrapper.find('button[aria-label="Back to categories"]').trigger('click')
    expect(wrapper.text()).toContain('Housing')
    expect(wrapper.find('button[aria-label="Back to categories"]').exists()).toBe(false)
  })

  it('selects a sub-category and emits update:modelValue', async () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Housing' }), [
        makeCategory({ id: 'sub-1', name: 'Rent', parentId: 'cat-1' }),
      ]),
    ]
    const wrapper = mountPicker({ modelValue: null })
    // Expand to sub-categories
    await wrapper.find('button[aria-label="Housing"]').trigger('click')
    // Select sub-category
    await wrapper.find('button[aria-label="Rent"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['sub-1'])
  })

  it('shows expanded parent label when in sub-category view', async () => {
    _nestedCategories.value = [
      makeNested(makeCategory({ id: 'cat-1', name: 'Housing' }), [
        makeCategory({ id: 'sub-1', name: 'Rent', parentId: 'cat-1' }),
      ]),
    ]
    const wrapper = mountPicker({ modelValue: null })
    await wrapper.find('button[aria-label="Housing"]').trigger('click')
    // The expanded parent label appears in a <p> tag
    expect(wrapper.find('p').text()).toBe('Housing')
  })
})
