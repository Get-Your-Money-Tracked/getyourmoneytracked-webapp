import { describe, it, expect } from 'vitest'
import { groupTransactionsByDate, formatDateLabel } from '@/utils/dateGrouping'
import type { Transaction } from '@/types'

function makeTransaction(id: string, date: string): Transaction {
  return {
    id,
    type: 'EXPENSE',
    amount: 10,
    date,
    accountId: 'acc-1',
    toAccountId: null,
    categoryId: 'cat-1',
    description: null,
    notes: null,
    tags: [],
    receiptUrl: null,
    createdAt: date,
    updatedAt: date,
  }
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function yesterdayIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('formatDateLabel', () => {
  it('returns "Today" for today\'s date', () => {
    expect(formatDateLabel(todayIso())).toBe('Today')
  })

  it('returns "Yesterday" for yesterday\'s date', () => {
    expect(formatDateLabel(yesterdayIso())).toBe('Yesterday')
  })

  it('returns a formatted date string for older dates', () => {
    const label = formatDateLabel('2024-03-18')
    expect(label).toMatch(/Mar\s+18/)
  })

  it('returns a formatted date string for January', () => {
    const label = formatDateLabel('2024-01-05')
    expect(label).toMatch(/Jan\s+5/)
  })
})

describe('groupTransactionsByDate', () => {
  it('returns empty array for no transactions', () => {
    expect(groupTransactionsByDate([])).toEqual([])
  })

  it('groups transactions by date', () => {
    const today = todayIso()
    const txs = [
      makeTransaction('t1', today),
      makeTransaction('t2', today),
    ]
    const groups = groupTransactionsByDate(txs)
    expect(groups).toHaveLength(1)
    expect(groups[0].transactions).toHaveLength(2)
    expect(groups[0].label).toBe('Today')
  })

  it('creates separate groups for different dates', () => {
    const today = todayIso()
    const yesterday = yesterdayIso()
    const txs = [
      makeTransaction('t1', today),
      makeTransaction('t2', yesterday),
    ]
    const groups = groupTransactionsByDate(txs)
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe('Today')
    expect(groups[1].label).toBe('Yesterday')
  })

  it('preserves order of transactions within a group', () => {
    const today = todayIso()
    const txs = [
      makeTransaction('t1', today),
      makeTransaction('t2', today),
      makeTransaction('t3', today),
    ]
    const groups = groupTransactionsByDate(txs)
    const ids = groups[0].transactions.map((t) => t.id)
    expect(ids).toEqual(['t1', 't2', 't3'])
  })

  it('labels old transactions with formatted date', () => {
    const txs = [makeTransaction('t1', '2024-03-18')]
    const groups = groupTransactionsByDate(txs)
    expect(groups[0].label).toMatch(/Mar\s+18/)
  })

  it('strips time portion from ISO date strings', () => {
    const today = todayIso()
    const txs = [
      makeTransaction('t1', `${today}T10:00:00Z`),
      makeTransaction('t2', `${today}T15:00:00Z`),
    ]
    const groups = groupTransactionsByDate(txs)
    expect(groups).toHaveLength(1)
    expect(groups[0].transactions).toHaveLength(2)
  })

  it('sets date property on each group', () => {
    const today = todayIso()
    const txs = [makeTransaction('t1', today)]
    const groups = groupTransactionsByDate(txs)
    expect(groups[0].date).toBe(today)
  })
})
