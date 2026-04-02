import { urqlClient } from '@/lib/urql'

// ── Queries ───────────────────────────────────────────────────────────────────

const USED_TAGS_QUERY = `
  query UsedTags {
    usedTags {
      name
    }
  }
`

const TAG_USAGE_COUNTS_QUERY = `
  query TagUsageCounts {
    tagUsageCounts {
      name
      count
    }
  }
`

// ── Mutations ─────────────────────────────────────────────────────────────────

const RENAME_TAG_MUTATION = `
  mutation RenameTag($oldName: String!, $newName: String!) {
    renameTag(oldName: $oldName, newName: $newName)
  }
`

const DELETE_TAG_MUTATION = `
  mutation DeleteTag($name: String!) {
    deleteTag(name: $name)
  }
`

// ── Typed interfaces ──────────────────────────────────────────────────────────

export interface TagUsage {
  name: string
  count: number
}

// ── Typed call functions ──────────────────────────────────────────────────────

/** Returns all distinct tag strings used across the user's transactions. */
export async function callUsedTags(): Promise<string[]> {
  const result = await urqlClient.query(USED_TAGS_QUERY, {}).toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch tags.')
  }
  return (result.data?.usedTags as { name: string }[])?.map((t) => t.name) ?? []
}

/** Returns all distinct tags with transaction counts. */
export async function callTagUsageCounts(): Promise<TagUsage[]> {
  const result = await urqlClient.query(TAG_USAGE_COUNTS_QUERY, {}).toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to fetch tag usage counts.')
  }
  return (result.data?.tagUsageCounts as TagUsage[]) ?? []
}

/** Renames a tag across all transactions. Returns number of updated transactions. */
export async function callRenameTag(oldName: string, newName: string): Promise<number> {
  const result = await urqlClient
    .mutation(RENAME_TAG_MUTATION, { oldName, newName })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to rename tag.')
  }
  return (result.data?.renameTag as number) ?? 0
}

/** Deletes a tag from all transactions. Returns number of updated transactions. */
export async function callDeleteTag(name: string): Promise<number> {
  const result = await urqlClient
    .mutation(DELETE_TAG_MUTATION, { name })
    .toPromise()
  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to delete tag.')
  }
  return (result.data?.deleteTag as number) ?? 0
}
