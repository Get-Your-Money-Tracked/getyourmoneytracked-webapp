import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

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

import { callUsedTags, callTagUsageCounts, callRenameTag, callDeleteTag } from '@/graphql/queries/tags'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── callUsedTags ─────────────────────────────────────────────────────────────

describe('callUsedTags', () => {
  it('returns array of tag strings', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { usedTags: ['food', 'travel', 'gift'] },
      error: undefined,
    })

    const tags = await callUsedTags()
    expect(tags).toEqual(['food', 'travel', 'gift'])
  })

  it('returns empty array when no tags exist', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: { usedTags: [] },
      error: undefined,
    })

    const tags = await callUsedTags()
    expect(tags).toEqual([])
  })

  it('throws on error', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: null,
      error: { message: 'Unauthorized' },
    })

    await expect(callUsedTags()).rejects.toThrow('Unauthorized')
  })

  it('uses usedTags query name', async () => {
    mockToPromise.mockResolvedValueOnce({ data: { usedTags: [] }, error: undefined })
    await callUsedTags()
    const queryStr = (mockQuery.mock.calls[0] as unknown[])[0] as string
    expect(queryStr).toContain('usedTags')
  })
})

// ── callTagUsageCounts ───────────────────────────────────────────────────────

describe('callTagUsageCounts', () => {
  it('returns TagUsage array with name and count', async () => {
    mockToPromise.mockResolvedValueOnce({
      data: {
        tagUsageCounts: [
          { name: 'food', count: 5 },
          { name: 'travel', count: 2 },
        ],
      },
      error: undefined,
    })

    const result = await callTagUsageCounts()
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'food', count: 5 })
    expect(result[1]).toEqual({ name: 'travel', count: 2 })
  })

  it('throws on error', async () => {
    mockToPromise.mockResolvedValueOnce({ data: null, error: { message: 'Failed' } })
    await expect(callTagUsageCounts()).rejects.toThrow('Failed')
  })
})

// ── callRenameTag ────────────────────────────────────────────────────────────

describe('callRenameTag', () => {
  it('sends oldName and newName as variables', async () => {
    mockToPromise.mockResolvedValueOnce({ data: { renameTag: 3 }, error: undefined })

    const count = await callRenameTag('vacation', 'travel')

    expect(count).toBe(3)
    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, string>
    expect(variables.oldName).toBe('vacation')
    expect(variables.newName).toBe('travel')
  })

  it('throws on error', async () => {
    mockToPromise.mockResolvedValueOnce({ data: null, error: { message: 'Rename failed' } })
    await expect(callRenameTag('a', 'b')).rejects.toThrow('Rename failed')
  })

  it('uses renameTag mutation name', async () => {
    mockToPromise.mockResolvedValueOnce({ data: { renameTag: 0 }, error: undefined })
    await callRenameTag('a', 'b')
    const mutStr = (mockMutation.mock.calls[0] as unknown[])[0] as string
    expect(mutStr).toContain('renameTag')
  })
})

// ── callDeleteTag ────────────────────────────────────────────────────────────

describe('callDeleteTag', () => {
  it('sends name as variable and returns count', async () => {
    mockToPromise.mockResolvedValueOnce({ data: { deleteTag: 4 }, error: undefined })

    const count = await callDeleteTag('food')

    expect(count).toBe(4)
    const variables = (mockMutation.mock.calls[0] as unknown[])[1] as Record<string, string>
    expect(variables.name).toBe('food')
  })

  it('throws on error', async () => {
    mockToPromise.mockResolvedValueOnce({ data: null, error: { message: 'Delete failed' } })
    await expect(callDeleteTag('food')).rejects.toThrow('Delete failed')
  })
})
