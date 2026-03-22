import { describe, it, expect } from 'vitest'
import { parseTags, tagsToString, validateTags } from '@/utils/tags'

describe('parseTags', () => {
  it('returns empty array for empty string', () => {
    expect(parseTags('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(parseTags('   ')).toEqual([])
  })

  it('splits by comma', () => {
    expect(parseTags('food,travel')).toEqual(['food', 'travel'])
  })

  it('trims whitespace from tags', () => {
    expect(parseTags('  food , travel  ')).toEqual(['food', 'travel'])
  })

  it('lowercases tags', () => {
    expect(parseTags('Food,Travel,WORK')).toEqual(['food', 'travel', 'work'])
  })

  it('removes duplicate tags', () => {
    expect(parseTags('food,food,travel')).toEqual(['food', 'travel'])
  })

  it('removes duplicate tags case-insensitively', () => {
    expect(parseTags('Food,food,FOOD')).toEqual(['food'])
  })

  it('sanitizes: replaces spaces within tag with hyphens', () => {
    expect(parseTags('my vacation')).toEqual(['my-vacation'])
  })

  it('sanitizes: removes special characters', () => {
    expect(parseTags('food@home')).toEqual(['foodhome'])
  })

  it('sanitizes: allows hyphens and underscores', () => {
    expect(parseTags('my-tag,my_tag')).toEqual(['my-tag', 'my_tag'])
  })

  it('removes empty tags after sanitization', () => {
    expect(parseTags('food,,travel')).toEqual(['food', 'travel'])
  })

  it('limits to max 10 tags', () => {
    const input = Array.from({ length: 15 }, (_, i) => `tag${i}`).join(',')
    const result = parseTags(input)
    expect(result.length).toBe(10)
  })

  it('truncates tags to 30 characters', () => {
    const longTag = 'a'.repeat(35)
    const result = parseTags(longTag)
    expect(result[0].length).toBe(30)
  })

  it('handles tags with multiple commas gracefully', () => {
    expect(parseTags(',,,')).toEqual([])
  })
})

describe('tagsToString', () => {
  it('joins tags with comma and space', () => {
    expect(tagsToString(['food', 'travel'])).toBe('food, travel')
  })

  it('returns empty string for empty array', () => {
    expect(tagsToString([])).toBe('')
  })

  it('returns single tag without trailing comma', () => {
    expect(tagsToString(['food'])).toBe('food')
  })
})

describe('validateTags', () => {
  it('returns null for valid tags', () => {
    expect(validateTags(['food', 'travel'])).toBeNull()
  })

  it('returns null for empty array', () => {
    expect(validateTags([])).toBeNull()
  })

  it('returns null for exactly 10 tags', () => {
    const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`)
    expect(validateTags(tags)).toBeNull()
  })

  it('returns error message for more than 10 tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`)
    const result = validateTags(tags)
    expect(result).toContain('10')
  })

  it('returns null for tag exactly 30 chars long', () => {
    expect(validateTags(['a'.repeat(30)])).toBeNull()
  })

  it('returns error message for tag longer than 30 chars', () => {
    const result = validateTags(['a'.repeat(31)])
    expect(result).toContain('30')
  })
})
