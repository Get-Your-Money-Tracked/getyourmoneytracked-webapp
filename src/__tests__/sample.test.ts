import { describe, it, expect } from 'vitest'

describe('sanity check', () => {
  it('true is true', () => {
    expect(true).toBe(true)
  })

  it('can do basic arithmetic', () => {
    expect(2 + 2).toBe(4)
  })

  it('formats currency correctly', () => {
    const amount = 1234.56
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
    expect(formatted).toBe('$1,234.56')
  })
})
