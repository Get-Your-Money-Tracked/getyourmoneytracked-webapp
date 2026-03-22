/**
 * Tag parsing and validation utilities for transaction tags.
 * Tags are comma-separated, trimmed, lowercased, deduplicated, and sanitized.
 */

const MAX_TAGS = 10
const MAX_TAG_LENGTH = 30

/**
 * Sanitize a single tag: lowercase, replace spaces with hyphens,
 * remove characters that are not alphanumeric, hyphens, or underscores.
 */
function sanitizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')
}

/**
 * Parse a comma-separated tag string into a clean array of tags.
 * - Splits by comma
 * - Trims whitespace
 * - Lowercases
 * - Sanitizes (only [a-z0-9-_] allowed, spaces → hyphens)
 * - Removes empty strings
 * - Deduplicates
 * - Truncates each tag to MAX_TAG_LENGTH chars
 * - Returns at most MAX_TAGS tags
 */
export function parseTags(input: string): string[] {
  if (!input || input.trim() === '') return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of input.split(',')) {
    const tag = sanitizeTag(raw.trim()).slice(0, MAX_TAG_LENGTH)
    if (!tag) continue
    if (seen.has(tag)) continue
    seen.add(tag)
    result.push(tag)
    if (result.length >= MAX_TAGS) break
  }

  return result
}

/**
 * Convert a tags array back to a comma-separated display string.
 */
export function tagsToString(tags: string[]): string {
  return tags.join(', ')
}

/**
 * Validate a tags array.
 * Returns an error message string, or null if valid.
 */
export function validateTags(tags: string[]): string | null {
  if (tags.length > MAX_TAGS) {
    return `Maximum ${MAX_TAGS} tags allowed.`
  }
  for (const tag of tags) {
    if (tag.length > MAX_TAG_LENGTH) {
      return `Each tag must be ${MAX_TAG_LENGTH} characters or less.`
    }
  }
  return null
}
