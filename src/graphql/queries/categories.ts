import { urqlClient } from '@/lib/urql'
import type { Category } from '@/types'

// ── Queries ───────────────────────────────────────────────────────────────────

const CATEGORIES_QUERY = `
  query Categories {
    categories {
      id
      name
      icon
      color
      parentId
      isDefault
      sortOrder
    }
  }
`

// ── Mutations ─────────────────────────────────────────────────────────────────

const CREATE_CATEGORY_MUTATION = `
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      icon
      color
      parentId
      isDefault
      sortOrder
    }
  }
`

const UPDATE_CATEGORY_MUTATION = `
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      icon
      color
      parentId
      isDefault
      sortOrder
    }
  }
`

const DELETE_CATEGORY_MUTATION = `
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`

const REORDER_CATEGORIES_MUTATION = `
  mutation ReorderCategories($ids: [ID!]!) {
    reorderCategories(ids: $ids)
  }
`

// ── Typed call functions ──────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const result = await urqlClient.query(CATEGORIES_QUERY, {}).toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch categories.')
  }
  return (result.data?.categories as Category[]) ?? []
}

export interface CreateCategoryInput {
  name: string
  icon?: string | null
  color?: string | null
  parentId?: string | null
}

export async function callCreateCategory(input: CreateCategoryInput): Promise<Category> {
  const result = await urqlClient
    .mutation(CREATE_CATEGORY_MUTATION, { input })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to create category.')
  }
  if (!result.data?.createCategory) {
    throw new Error('No data returned from createCategory.')
  }
  return result.data.createCategory as Category
}

export interface UpdateCategoryInput {
  name?: string
  icon?: string | null
  color?: string | null
}

export async function callUpdateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const result = await urqlClient
    .mutation(UPDATE_CATEGORY_MUTATION, { id, input })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to update category.')
  }
  if (!result.data?.updateCategory) {
    throw new Error('No data returned from updateCategory.')
  }
  return result.data.updateCategory as Category
}

export async function callDeleteCategory(id: string): Promise<void> {
  const result = await urqlClient
    .mutation(DELETE_CATEGORY_MUTATION, { id })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to delete category.')
  }
}

export async function callReorderCategories(ids: string[]): Promise<void> {
  const result = await urqlClient
    .mutation(REORDER_CATEGORIES_MUTATION, { ids })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to reorder categories.')
  }
}
