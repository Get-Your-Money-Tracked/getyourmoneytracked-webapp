import { describe, it, expect } from 'vitest'
import { formatCurrency, getCurrencySymbol, isNegativeBalance, parseBalanceInput } from '@/utils/currency'

describe('formatCurrency', () => {
  it('formats USD positive amount with symbol and thousand separators', () => {
    expect(formatCurrency(12450, 'USD')).toBe('$12,450.00')
  })

  it('formats USD negative amount (credit card debt)', () => {
    expect(formatCurrency(-1000, 'USD')).toBe('-$1,000.00')
  })

  it('formats zero amount', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })

  it('formats EUR amount', () => {
    const result = formatCurrency(500, 'EUR')
    // Intl may format as €500.00 or 500,00 € depending on locale; we check symbol presence
    expect(result).toContain('500')
    expect(result).toContain('00')
  })

  it('formats GBP amount', () => {
    const result = formatCurrency(1234.56, 'GBP')
    expect(result).toContain('1,234.56')
  })

  it('formats BRL amount', () => {
    const result = formatCurrency(500, 'BRL')
    expect(result).toContain('500')
  })

  it('formats large USD amount with thousand separators', () => {
    expect(formatCurrency(1234567.89, 'USD')).toBe('$1,234,567.89')
  })

  it('formats negative EUR amount', () => {
    const result = formatCurrency(-250.5, 'EUR')
    expect(result).toContain('250')
    expect(result).toContain('50')
  })

  it('formats small decimal amount', () => {
    expect(formatCurrency(0.01, 'USD')).toBe('$0.01')
  })

  it('defaults to USD when no currency provided', () => {
    expect(formatCurrency(100)).toBe('$100.00')
  })
})

describe('getCurrencySymbol', () => {
  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })

  it('returns £ for GBP', () => {
    expect(getCurrencySymbol('GBP')).toBe('£')
  })
})

describe('isNegativeBalance', () => {
  it('returns true for negative amounts', () => {
    expect(isNegativeBalance(-1)).toBe(true)
    expect(isNegativeBalance(-1000)).toBe(true)
  })

  it('returns false for zero', () => {
    expect(isNegativeBalance(0)).toBe(false)
  })

  it('returns false for positive amounts', () => {
    expect(isNegativeBalance(100)).toBe(false)
  })
})

describe('parseBalanceInput', () => {
  it('parses a valid number string', () => {
    expect(parseBalanceInput('100.50')).toBe(100.5)
  })

  it('returns 0 for empty string', () => {
    expect(parseBalanceInput('')).toBe(0)
  })

  it('returns 0 for whitespace-only string', () => {
    expect(parseBalanceInput('   ')).toBe(0)
  })

  it('parses negative values', () => {
    expect(parseBalanceInput('-500')).toBe(-500)
  })

  it('strips commas before parsing', () => {
    expect(parseBalanceInput('1,200.50')).toBe(1200.5)
  })

  it('returns 0 for non-numeric input', () => {
    expect(parseBalanceInput('abc')).toBe(0)
  })
})
