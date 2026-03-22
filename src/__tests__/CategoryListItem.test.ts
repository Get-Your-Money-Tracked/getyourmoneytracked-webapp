import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CategoryListItem from '@/components/categories/CategoryListItem.vue'
import type { Category } from '@/types'

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

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Food',
    icon: '🍽️',
    color: '#FF9800',
    parentId: null,
    isDefault: true,
    sortOrder: 0,
    ...overrides,
  }
}

function mountItem(category: Category, isSubCategory = false) {
  return mount(CategoryListItem, {
    props: { category, isSubCategory },
    global: { plugins: [createPinia()] },
  })
}

describe('CategoryListItem', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders category name', () => {
    const wrapper = mountItem(makeCategory({ name: 'Transport' }))
    expect(wrapper.text()).toContain('Transport')
  })

  it('renders category icon', () => {
    const wrapper = mountItem(makeCategory({ icon: '🚗' }))
    expect(wrapper.text()).toContain('🚗')
  })

  it('renders color dot with correct background color', () => {
    const wrapper = mountItem(makeCategory({ color: '#2196F3' }))
    const dot = wrapper.find('.rounded-full')
    // jsdom normalizes hex colors to rgb() in inline styles
    const style = dot.attributes('style') ?? ''
    expect(style).toMatch(/background-color:\s*(#2196F3|rgb\(33,\s*150,\s*243\))/i)
  })

  it('shows "Default" badge for default categories', () => {
    const wrapper = mountItem(makeCategory({ isDefault: true }))
    expect(wrapper.text()).toContain('Default')
  })

  it('does not show "Default" badge for non-default categories', () => {
    const wrapper = mountItem(makeCategory({ isDefault: false }))
    expect(wrapper.text()).not.toContain('Default')
  })

  it('applies sub-category indentation when isSubCategory is true', () => {
    const wrapper = mountItem(makeCategory(), true)
    const container = wrapper.find('div')
    expect(container.classes()).toContain('pl-10')
  })

  it('does not apply sub-category indentation for top-level categories', () => {
    const wrapper = mountItem(makeCategory(), false)
    const container = wrapper.find('div')
    expect(container.classes()).not.toContain('pl-10')
  })

  it('emits edit event when edit button is clicked', async () => {
    const category = makeCategory()
    const wrapper = mountItem(category)
    await wrapper.find('[aria-label="Edit category"]').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([category])
  })

  it('emits moveUp event when move up button is clicked', async () => {
    const category = makeCategory()
    const wrapper = mountItem(category)
    await wrapper.find('[aria-label="Move up"]').trigger('click')
    expect(wrapper.emitted('moveUp')).toBeTruthy()
  })

  it('emits moveDown event when move down button is clicked', async () => {
    const category = makeCategory()
    const wrapper = mountItem(category)
    await wrapper.find('[aria-label="Move down"]').trigger('click')
    expect(wrapper.emitted('moveDown')).toBeTruthy()
  })

  it('uses fallback icon when icon is null', () => {
    const wrapper = mountItem(makeCategory({ icon: null }))
    expect(wrapper.text()).toContain('📂')
  })
})
