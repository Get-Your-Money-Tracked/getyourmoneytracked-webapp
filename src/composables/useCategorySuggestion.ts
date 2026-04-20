const STORAGE_KEY = 'gymt-category-mappings'

interface CategoryMapping {
  [keyword: string]: string // keyword -> categoryId
}

function loadMappings(): CategoryMapping {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveMappings(mappings: CategoryMapping) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings))
}

/**
 * Learn from a saved transaction: associate description keywords with the chosen category.
 */
export function learnCategoryMapping(description: string | null, categoryId: string | null) {
  if (!description || !categoryId) return
  const keywords = extractKeywords(description)
  if (keywords.length === 0) return

  const mappings = loadMappings()
  for (const keyword of keywords) {
    mappings[keyword] = categoryId
  }
  saveMappings(mappings)
}

/**
 * Suggest a category ID based on the description text.
 * Returns null if no suggestion is found.
 */
export function suggestCategory(description: string): string | null {
  if (!description || description.trim().length < 2) return null

  const mappings = loadMappings()
  const keywords = extractKeywords(description)

  // Try exact keyword matches (longest first for specificity)
  const sorted = keywords.sort((a, b) => b.length - a.length)
  for (const keyword of sorted) {
    if (mappings[keyword]) return mappings[keyword]
  }

  // Try partial matches against stored keywords
  const storedKeys = Object.keys(mappings)
  for (const keyword of sorted) {
    for (const stored of storedKeys) {
      if (stored.includes(keyword) || keyword.includes(stored)) {
        return mappings[stored]
      }
    }
  }

  return null
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
}
