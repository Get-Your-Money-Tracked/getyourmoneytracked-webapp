import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, reactive } from 'vue'
import CategoriesPage from '@/pages/CategoriesPage.vue'
import type { Category } from '@/types'
import type { CategoryWithChildren } from '@/stores/categories'

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

vi.mock('vue-router', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}))

// ── Store mock ────────────────────────────────────────────────
const _isLoading = ref(false)
const _nestedCategories = ref<CategoryWithChildren[]>([])
const _error = ref<string | null>(null)
const _loadCategories = vi.fn()

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      get isLoading() {
        return _isLoading.value
      },
      get nestedCategories() {
        return _nestedCategories.value
      },
      get error() {
        return _error.value
      },
      loadCategories: _loadCategories,
      reorderCategories: vi.fn(),
      clearError: vi.fn(),
    }),
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

function makeNested(category: Category, children: Category[] = []): CategoryWithChildren {
  return { ...category, children }
}

function mountPage() {
  return mount(CategoriesPage, {
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _isLoading.value = false
    _nestedCategories.value = []
    _error.value = null
  })

  it('calls loadCategories on mount', () => {
    mountPage()
    expect(_loadCategories).toHaveBeenCalledOnce()
  })

  it('renders loading skeleton while isLoading is true', async () => {
    _isLoading.value = true
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
  })

  it('renders empty state when no categories exist', async () => {
    _isLoading.value = false
    _nestedCategories.value = []
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('No categories yet')
  })

  it('renders category names when categories are loaded', async () => {
    _isLoading.value = false
    _nestedCategories.value = [
      makeNested(makeCategory({ name: 'Food' })),
      makeNested(makeCategory({ id: 'cat-2', name: 'Transport', icon: '🚗', sortOrder: 1 })),
    ]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Food')
    expect(wrapper.text()).toContain('Transport')
  })

  it('shows sub-categories nested under parents', async () => {
    _isLoading.value = false
    _nestedCategories.value = [
      makeNested(makeCategory({ name: 'Housing' }), [
        makeCategory({ id: 'sub-1', name: 'Rent', parentId: 'cat-1' }),
      ]),
    ]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Housing')
    expect(wrapper.text()).toContain('Rent')
  })

  it('shows "Add Category" button', async () => {
    _isLoading.value = false
    _nestedCategories.value = [makeNested(makeCategory())]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Add Category')
  })

  it('page title is "Manage Categories"', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Manage Categories')
  })

  it('shows error banner when there is an error', async () => {
    _error.value = 'Failed to load categories.'
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Failed to load categories.')
  })
})
