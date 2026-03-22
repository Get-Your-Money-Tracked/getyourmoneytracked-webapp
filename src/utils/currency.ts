/**
 * Currency formatting utilities
 * Formats numbers as locale-aware currency strings with proper symbols,
 * thousand separators, and 2 decimal places.
 */

// Map of currency codes to their symbols (common ones for performance)
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BRL: 'R$',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  MXN: 'MX$',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  NOK: 'kr',
  SEK: 'kr',
  DKK: 'kr',
  NZD: 'NZ$',
  ZAR: 'R',
  ARS: 'AR$',
}

/**
 * Format a number as a currency string.
 * Always shows 2 decimal places, with thousand separators.
 *
 * @param amount - The numeric amount (can be negative for credit card debt)
 * @param currencyCode - ISO 4217 currency code (e.g. "USD", "EUR")
 * @returns Formatted string like "$12,450.00" or "-$1,000.00" or "R$500.00"
 *
 * @example
 * formatCurrency(12450, 'USD')  // "$12,450.00"
 * formatCurrency(-1000, 'USD')  // "-$1,000.00"
 * formatCurrency(500, 'BRL')   // "R$500.00"
 * formatCurrency(0, 'EUR')     // "€0.00"
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  try {
    // Use Intl.NumberFormat with browser's default locale
    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)

    return formatted
  } catch {
    // Fallback for unknown currency codes
    const symbol = CURRENCY_SYMBOLS[currencyCode.toUpperCase()] ?? currencyCode
    const isNegative = amount < 0
    const abs = Math.abs(amount)
    const parts = abs.toFixed(2).split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const numberStr = parts.join('.')
    return isNegative ? `-${symbol}${numberStr}` : `${symbol}${numberStr}`
  }
}

/**
 * Get the currency symbol for a given currency code.
 * Falls back to the code itself if not found.
 *
 * @param currencyCode - ISO 4217 currency code
 * @returns The currency symbol string
 *
 * @example
 * getCurrencySymbol('USD') // "$"
 * getCurrencySymbol('EUR') // "€"
 * getCurrencySymbol('BRL') // "R$"
 */
export function getCurrencySymbol(currencyCode: string): string {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0)

    const symbolPart = parts.find((p) => p.type === 'currency')
    return symbolPart?.value ?? currencyCode
  } catch {
    return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] ?? currencyCode
  }
}

/**
 * Returns true if the amount should be displayed in danger (red) color.
 * Negative balances are "danger" (e.g. credit card debt).
 */
export function isNegativeBalance(amount: number): boolean {
  return amount < 0
}

/**
 * Parse a balance string to a number, handling empty/undefined gracefully.
 * Returns 0 for empty/invalid input.
 */
export function parseBalanceInput(value: string): number {
  if (!value || value.trim() === '') return 0
  const parsed = parseFloat(value.replace(/,/g, ''))
  return isNaN(parsed) ? 0 : parsed
}
