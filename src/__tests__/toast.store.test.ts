import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useToastStore } from '@/stores/toast'

describe('Toast store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('starts with an empty toasts array', () => {
    const store = useToastStore()
    expect(store.toasts).toEqual([])
  })

  it('show() adds a toast to the list', () => {
    const store = useToastStore()
    store.show('Success!', 'success')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].message).toBe('Success!')
    expect(store.toasts[0].variant).toBe('success')
  })

  it('show() defaults to success variant', () => {
    const store = useToastStore()
    store.show('Done')
    expect(store.toasts[0].variant).toBe('success')
  })

  it('show() auto-dismisses after default duration (3000ms)', () => {
    const store = useToastStore()
    store.show('Temporary')
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(3000)
    expect(store.toasts).toHaveLength(0)
  })

  it('show() respects custom duration', () => {
    const store = useToastStore()
    store.show('Quick', 'info', 1000)
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(999)
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(store.toasts).toHaveLength(0)
  })

  it('dismiss() removes a specific toast by id', () => {
    const store = useToastStore()
    store.show('First', 'success', 99999)
    store.show('Second', 'error', 99999)
    expect(store.toasts).toHaveLength(2)
    const firstId = store.toasts[0].id
    store.dismiss(firstId)
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].message).toBe('Second')
  })

  it('supports multiple concurrent toasts', () => {
    const store = useToastStore()
    store.show('A', 'success', 99999)
    store.show('B', 'error', 99999)
    store.show('C', 'info', 99999)
    expect(store.toasts).toHaveLength(3)
  })

  it('assigns unique ids to each toast', () => {
    const store = useToastStore()
    store.show('A', 'success', 99999)
    store.show('B', 'success', 99999)
    const ids = store.toasts.map((t) => t.id)
    expect(ids[0]).not.toBe(ids[1])
  })
})
