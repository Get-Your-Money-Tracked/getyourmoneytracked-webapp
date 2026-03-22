import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCategoriesStore } from '@/stores/categories'
import type { Category } from '@/types'

// ── Mock urql client ──────────────────────────────────────────────────────────
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

// ── Mock graphql queries ──────────────────────────────────────────────────────
const mockFetchCategories = vi.fn()
const mockCallCreateCategory = vi.fn()
const mockCallUpdateCategory = vi.fn()
const mockCallDeleteCategory = vi.fn()
const mockCallReorderCategories = vi.fn()

vi.mock('@/graphql/queries/categories', () => ({
  fetchCategories: (...args: unknown[]) => mockFetchCategories(...args),
  callCreateCategory: (...args: unknown[]) => mockCallCreateCategory(...args),
  callUpdateCategory: (...args: unknown[]) => mockCallUpdateCategory(...args),
  callDeleteCategory: (...args: unknown[]) => mockCallDeleteCategory(...args),
  callReorderCategories: (...args: unknown[]) => mockCallReorderCategories(...args),
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

describe('useCategoriesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Initial state ───────────────────────────────────────────────────────────
  it('starts with empty categories and isLoading = false', () => {
    const store = useCategoriesStore()
    expect(store.categories).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  // ── loadCategories ──────────────────────────────────────────────────────────
  it('loadCategories populates state from API', async () => {
    const cats = [makeCategory({ id: 'cat-1', name: 'Food' }), makeCategory({ id: 'cat-2', name: 'Transport' })]
    mockFetchCategories.mockResolvedValueOnce(cats)

    const store = useCategoriesStore()
    await store.loadCategories()

    expect(store.categories).toEqual(cats)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('loadCategories sets error on failure', async () => {
    mockFetchCategories.mockRejectedValueOnce(new Error('Network error'))

    const store = useCategoriesStore()
    await store.loadCategories()

    expect(store.categories).toEqual([])
    expect(store.error).toBe('Network error')
    expect(store.isLoading).toBe(false)
  })

  it('loadCategories sets isLoading to true while fetching', async () => {
    let resolvePromise!: (value: Category[]) => void
    mockFetchCategories.mockReturnValueOnce(new Promise<Category[]>((r) => { resolvePromise = r }))

    const store = useCategoriesStore()
    const loadPromise = store.loadCategories()
    expect(store.isLoading).toBe(true)

    resolvePromise([])
    await loadPromise
    expect(store.isLoading).toBe(false)
  })

  // ── topLevelCategories ──────────────────────────────────────────────────────
  it('topLevelCategories filters out sub-categories', async () => {
    mockFetchCategories.mockResolvedValueOnce([
      makeCategory({ id: 'cat-1', parentId: null, sortOrder: 0 }),
      makeCategory({ id: 'cat-2', parentId: 'cat-1', sortOrder: 0 }),
    ])
    const store = useCategoriesStore()
    await store.loadCategories()

    expect(store.topLevelCategories).toHaveLength(1)
    expect(store.topLevelCategories[0].id).toBe('cat-1')
  })

  it('topLevelCategories sorts by sortOrder', async () => {
    mockFetchCategories.mockResolvedValueOnce([
      makeCategory({ id: 'cat-b', name: 'B', parentId: null, sortOrder: 2 }),
      makeCategory({ id: 'cat-a', name: 'A', parentId: null, sortOrder: 0 }),
      makeCategory({ id: 'cat-c', name: 'C', parentId: null, sortOrder: 1 }),
    ])
    const store = useCategoriesStore()
    await store.loadCategories()

    expect(store.topLevelCategories.map((c) => c.id)).toEqual(['cat-a', 'cat-c', 'cat-b'])
  })

  // ── subCategories ───────────────────────────────────────────────────────────
  it('subCategories returns only categories with a parentId', async () => {
    mockFetchCategories.mockResolvedValueOnce([
      makeCategory({ id: 'cat-1', parentId: null }),
      makeCategory({ id: 'sub-1', parentId: 'cat-1' }),
      makeCategory({ id: 'sub-2', parentId: 'cat-1' }),
    ])
    const store = useCategoriesStore()
    await store.loadCategories()

    expect(store.subCategories).toHaveLength(2)
    expect(store.subCategories.every((c) => c.parentId !== null)).toBe(true)
  })

  // ── nestedCategories ────────────────────────────────────────────────────────
  it('nestedCategories nests children under parents', async () => {
    mockFetchCategories.mockResolvedValueOnce([
      makeCategory({ id: 'cat-1', name: 'Housing', parentId: null, sortOrder: 0 }),
      makeCategory({ id: 'sub-1', name: 'Rent', parentId: 'cat-1', sortOrder: 0 }),
      makeCategory({ id: 'sub-2', name: 'Utilities', parentId: 'cat-1', sortOrder: 1 }),
    ])
    const store = useCategoriesStore()
    await store.loadCategories()

    expect(store.nestedCategories).toHaveLength(1)
    expect(store.nestedCategories[0].children).toHaveLength(2)
    expect(store.nestedCategories[0].children[0].name).toBe('Rent')
    expect(store.nestedCategories[0].children[1].name).toBe('Utilities')
  })

  // ── createCategory ──────────────────────────────────────────────────────────
  it('createCategory appends the new category to state', async () => {
    const existing = makeCategory({ id: 'cat-1', name: 'Food' })
    mockFetchCategories.mockResolvedValueOnce([existing])
    const newCat = makeCategory({ id: 'cat-2', name: 'Transport' })
    mockCallCreateCategory.mockResolvedValueOnce(newCat)

    const store = useCategoriesStore()
    await store.loadCategories()
    const result = await store.createCategory({ name: 'Transport' })

    expect(result).toEqual(newCat)
    expect(store.categories).toHaveLength(2)
    expect(store.categories.find((c) => c.id === 'cat-2')).toBeDefined()
  })

  // ── updateCategory ──────────────────────────────────────────────────────────
  it('updateCategory replaces the category in state', async () => {
    const original = makeCategory({ id: 'cat-1', name: 'Food' })
    mockFetchCategories.mockResolvedValueOnce([original])
    const updated = { ...original, name: 'Groceries' }
    mockCallUpdateCategory.mockResolvedValueOnce(updated)

    const store = useCategoriesStore()
    await store.loadCategories()
    await store.updateCategory('cat-1', { name: 'Groceries' })

    expect(store.categories.find((c) => c.id === 'cat-1')?.name).toBe('Groceries')
  })

  // ── deleteCategory ──────────────────────────────────────────────────────────
  it('deleteCategory removes the category from state', async () => {
    const cats = [
      makeCategory({ id: 'cat-1', name: 'Food' }),
      makeCategory({ id: 'cat-2', name: 'Transport' }),
    ]
    mockFetchCategories.mockResolvedValueOnce(cats)
    mockCallDeleteCategory.mockResolvedValueOnce(undefined)

    const store = useCategoriesStore()
    await store.loadCategories()
    await store.deleteCategory('cat-1')

    expect(store.categories).toHaveLength(1)
    expect(store.categories.find((c) => c.id === 'cat-1')).toBeUndefined()
  })

  // ── reorderCategories ───────────────────────────────────────────────────────
  it('reorderCategories updates sortOrder optimistically', async () => {
    const cats = [
      makeCategory({ id: 'cat-a', name: 'A', sortOrder: 0 }),
      makeCategory({ id: 'cat-b', name: 'B', sortOrder: 1 }),
      makeCategory({ id: 'cat-c', name: 'C', sortOrder: 2 }),
    ]
    mockFetchCategories.mockResolvedValueOnce(cats)
    mockCallReorderCategories.mockResolvedValueOnce(undefined)

    const store = useCategoriesStore()
    await store.loadCategories()
    await store.reorderCategories(['cat-c', 'cat-a', 'cat-b'])

    expect(store.categories.find((c) => c.id === 'cat-c')?.sortOrder).toBe(0)
    expect(store.categories.find((c) => c.id === 'cat-a')?.sortOrder).toBe(1)
    expect(store.categories.find((c) => c.id === 'cat-b')?.sortOrder).toBe(2)
    expect(mockCallReorderCategories).toHaveBeenCalledWith(['cat-c', 'cat-a', 'cat-b'])
  })

  // ── clearError ──────────────────────────────────────────────────────────────
  it('clearError resets the error state', async () => {
    mockFetchCategories.mockRejectedValueOnce(new Error('Oops'))
    const store = useCategoriesStore()
    await store.loadCategories()
    expect(store.error).not.toBeNull()
    store.clearError()
    expect(store.error).toBeNull()
  })
})
