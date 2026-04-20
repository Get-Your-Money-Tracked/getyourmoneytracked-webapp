import { auth } from '@/lib/firebase'

/**
 * Build the export URL with query params and trigger a download.
 */
export async function exportTransactionsCSV(params: {
  startDate?: string // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD
  categoryId?: string
  accountId?: string
  type?: string
  search?: string
  tags?: string[]
}) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const token = await user.getIdToken()

  const baseUrl = import.meta.env.VITE_GRAPHQL_URL ?? '/graphql'
  // Derive API base from graphql URL (e.g. "https://api.example.com/graphql" → "https://api.example.com")
  const apiBase = baseUrl.replace(/\/graphql$/, '')

  const url = new URL(`${apiBase}/api/export/transactions`, window.location.origin)

  if (params.startDate) url.searchParams.set('start_date', params.startDate)
  if (params.endDate) url.searchParams.set('end_date', params.endDate)
  if (params.categoryId) url.searchParams.set('category_id', params.categoryId)
  if (params.accountId) url.searchParams.set('account_id', params.accountId)
  if (params.type) url.searchParams.set('type', params.type)
  if (params.search) url.searchParams.set('search', params.search)
  if (params.tags?.length) url.searchParams.set('tags', params.tags.join(','))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Export failed: ${body}`)
  }

  const blob = await res.blob()
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = getFilenameFromResponse(res) ?? 'transactions.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(downloadUrl)
}

function getFilenameFromResponse(res: Response): string | null {
  const disposition = res.headers.get('Content-Disposition')
  if (!disposition) return null
  const match = disposition.match(/filename="?([^"]+)"?/)
  return match?.[1] ?? null
}
