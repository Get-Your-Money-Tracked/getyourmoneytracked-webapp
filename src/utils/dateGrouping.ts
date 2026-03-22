/**
 * Date grouping utilities for transaction lists.
 * Groups transactions by date with human-friendly labels.
 */

import type { Transaction } from '@/types'

export interface TransactionGroup {
  label: string
  date: string
  transactions: Transaction[]
}

/**
 * Format a date string (YYYY-MM-DD) into a human-friendly label:
 * - "Today" if it's today
 * - "Yesterday" if it's yesterday
 * - Formatted date string (e.g., "Mar 18") otherwise
 */
export function formatDateLabel(dateStr: string): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const todayStr = formatDateKey(today)
  const yesterdayStr = formatDateKey(yesterday)

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'

  // Parse the date parts directly to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Format a Date object to a YYYY-MM-DD key string (local time).
 */
function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Group an array of transactions by date, preserving order.
 * Assumes transactions are already sorted (newest first).
 */
export function groupTransactionsByDate(transactions: Transaction[]): TransactionGroup[] {
  const groups: TransactionGroup[] = []
  const dateMap = new Map<string, TransactionGroup>()

  for (const transaction of transactions) {
    // Use just the date portion (YYYY-MM-DD)
    const dateKey = transaction.date.split('T')[0]

    if (!dateMap.has(dateKey)) {
      const group: TransactionGroup = {
        label: formatDateLabel(dateKey),
        date: dateKey,
        transactions: [],
      }
      groups.push(group)
      dateMap.set(dateKey, group)
    }

    dateMap.get(dateKey)!.transactions.push(transaction)
  }

  return groups
}
