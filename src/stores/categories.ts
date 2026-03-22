import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Category } from '@/types'
import {
  fetchCategories,
  callCreateCategory,
  callUpdateCategory,
  callDeleteCategory,
  callReorderCategories,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/graphql/queries/categories'

/** A category with its children resolved */
export interface CategoryWithChildren extends Category {
  children: Category[]
}

export const useCategoriesStore = defineStore('categories', () => {
  // ── State ────────────────────────────────────────────────────
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ─────────────────────────────────────────────────

  /** All top-level categories (no parent), sorted by sortOrder */
  const topLevelCategories = computed(() =>
    categories.value
      .filter((c) => c.parentId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  )

  /** All sub-categories (have a parentId) */
  const subCategories = computed(() =>
    categories.value.filter((c) => c.parentId !== null),
  )

  /**
   * Nested view: top-level categories each with their children array.
   * Children are sorted by sortOrder.
   */
  const nestedCategories = computed<CategoryWithChildren[]>(() =>
    topLevelCategories.value.map((parent) => ({
      ...parent,
      children: categories.value
        .filter((c) => c.parentId === parent.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })),
  )

  // ── Actions ──────────────────────────────────────────────────

  async function loadCategories(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const data = await fetchCategories()
      categories.value = data
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to load categories.'
    } finally {
      isLoading.value = false
    }
  }

  async function createCategory(input: CreateCategoryInput): Promise<Category> {
    error.value = null
    try {
      const newCategory = await callCreateCategory(input)
      categories.value = [...categories.value, newCategory]
      return newCategory
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to create category.'
      throw e
    }
  }

  async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    error.value = null
    try {
      const updated = await callUpdateCategory(id, input)
      categories.value = categories.value.map((c) => (c.id === id ? { ...c, ...updated } : c))
      return updated
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to update category.'
      throw e
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    error.value = null
    try {
      await callDeleteCategory(id)
      categories.value = categories.value.filter((c) => c.id !== id)
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to delete category.'
      throw e
    }
  }

  async function reorderCategories(ids: string[]): Promise<void> {
    error.value = null
    const previous = categories.value
    // Optimistic update: reassign sortOrder by index
    const updated = categories.value.map((c) => {
      const idx = ids.indexOf(c.id)
      return idx !== -1 ? { ...c, sortOrder: idx } : c
    })
    categories.value = updated
    try {
      await callReorderCategories(ids)
    } catch (e: unknown) {
      // Rollback on failure
      categories.value = previous
      error.value = (e as Error).message ?? 'Failed to reorder categories.'
      throw e
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    categories,
    isLoading,
    error,
    topLevelCategories,
    subCategories,
    nestedCategories,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    clearError,
  }
})
