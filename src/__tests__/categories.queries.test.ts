import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Firebase ────────────────────────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

// ── Mock urql client ─────────────────────────────────────────────────────────
const mockToPromise = vi.fn()
const mockQuery = vi.fn((..._args: unknown[]) => ({ toPromise: mockToPromise }))
const mockMutation = vi.fn((..._args: unknown[]) => ({ toPromise: mockToPromise }))

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: (...args: unknown[]) => mockQuery(...args),
    mutation: (...args: unknown[]) => mockMutation(...args),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

import {
  fetchCategories,
  callUpdateCategory,
  callDeleteCategory,
  callReorderCategories,
} from '@/graphql/queries/categories'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_CATEGORY = {
  id: 'cat-1',
  name: 'Food',
  icon: 'utensils',
  color: '#FF5733',
  parentId: null,
  isDefault: false,
  sortOrder: 1,
}

// ── fetchCategories ──────────────────────────────────────────────────────────

describe('fetchCategories', () => {
  it('returns categories from response', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { categories: [RAW_CATEGORY] },
      error: undefined,
    })

    const categories = await fetchCategories()
    expect(categories).toHaveLength(1)
    expect(categories[0].name).toBe('Food')
  })

  it('throws on error', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: null,
      error: { message: 'Auth required' },
    })

    await expect(fetchCategories()).rejects.toThrow('Auth required')
  })
})

// ── callUpdateCategory ───────────────────────────────────────────────────────

describe('callUpdateCategory', () => {
  it('sends id inside the input object (not as separate variable)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateCategory: RAW_CATEGORY },
      error: undefined,
    })

    await callUpdateCategory('cat-1', { name: 'Groceries' })

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    expect(variables).not.toHaveProperty('id')
    expect(variables.input).toEqual({
      id: 'cat-1',
      name: 'Groceries',
    })
  })

  it('uses UpdateCategoryInput! type (single input arg)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { updateCategory: RAW_CATEGORY },
      error: undefined,
    })

    await callUpdateCategory('cat-1', { name: 'Test' })

    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    expect(mutationString).toContain('$input: UpdateCategoryInput!')
    expect(mutationString).not.toContain('$id: ID!')
  })
})

// ── callDeleteCategory ───────────────────────────────────────────────────────

describe('callDeleteCategory', () => {
  it('has a selection set on returned Category (not scalar)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { deleteCategory: { id: 'cat-1' } },
      error: undefined,
    })

    await callDeleteCategory('cat-1')

    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    // Should have `deleteCategory(id: $id) { id }` not just `deleteCategory(id: $id)`
    expect(mutationString).toMatch(/deleteCategory\(id: \$id\)\s*\{/)
  })
})

// ── callReorderCategories ────────────────────────────────────────────────────

describe('callReorderCategories', () => {
  it('wraps ids in ReorderCategoriesInput (not bare ids arg)', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { reorderCategories: [RAW_CATEGORY] },
      error: undefined,
    })

    await callReorderCategories(['cat-1', 'cat-2', 'cat-3'])

    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    // Should be { input: { ids: [...] } } not { ids: [...] }
    expect(variables).toHaveProperty('input')
    expect(variables.input).toEqual({ ids: ['cat-1', 'cat-2', 'cat-3'] })
  })

  it('uses ReorderCategoriesInput! type', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { reorderCategories: [] },
      error: undefined,
    })

    await callReorderCategories([])

    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    expect(mutationString).toContain('$input: ReorderCategoriesInput!')
  })

  it('has a selection set on returned categories', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { reorderCategories: [] },
      error: undefined,
    })

    await callReorderCategories([])

    const mutationString = (mockMutation.mock.calls[0] as unknown[])[0] as string
    expect(mutationString).toMatch(/reorderCategories\(input: \$input\)\s*\{/)
  })
})
