import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AmountDisplay from '@/components/common/AmountDisplay.vue'
import type { TransactionType } from '@/types'

// Mock currency utils (real implementation is fine but mock to avoid Intl issues)
vi.mock('@/utils/currency', () => ({
  getCurrencySymbol: (code: string) => {
    if (code === 'EUR') return '€'
    if (code === 'GBP') return '£'
    return '$'
  },
}))

describe('AmountDisplay', () => {
  function mountDisplay(amount: string, transactionType: TransactionType = 'EXPENSE', currency = 'USD') {
    return mount(AmountDisplay, {
      props: { amount, currency, transactionType },
    })
  }

  it('renders the formatted amount with currency symbol', () => {
    const wrapper = mountDisplay('12.5')
    expect(wrapper.text()).toContain('$12.50')
  })

  it('formats "0" as "$0.00"', () => {
    const wrapper = mountDisplay('0')
    expect(wrapper.text()).toContain('$0.00')
  })

  it('formats integer amount with decimal places', () => {
    const wrapper = mountDisplay('100')
    expect(wrapper.text()).toContain('$100.00')
  })

  it('formats large amount with thousands separator', () => {
    const wrapper = mountDisplay('1500')
    expect(wrapper.text()).toContain('$1,500.00')
  })

  it('uses correct currency symbol for EUR', () => {
    const wrapper = mountDisplay('50', 'EXPENSE', 'EUR')
    expect(wrapper.text()).toContain('€')
  })

  it('applies danger color class for EXPENSE type with amount > 0', () => {
    const wrapper = mountDisplay('10', 'EXPENSE')
    expect(wrapper.find('span').classes().join(' ')).toContain('text-danger')
  })

  it('applies primary color class for INCOME type with amount > 0', () => {
    const wrapper = mountDisplay('10', 'INCOME')
    expect(wrapper.find('span').classes().join(' ')).toContain('text-primary')
  })

  it('applies info color class for TRANSFER type with amount > 0', () => {
    const wrapper = mountDisplay('10', 'TRANSFER')
    expect(wrapper.find('span').classes().join(' ')).toContain('text-info')
  })

  it('applies muted color class when amount is 0', () => {
    const wrapper = mountDisplay('0', 'EXPENSE')
    expect(wrapper.find('span').classes().join(' ')).toContain('text-text-muted')
  })

  it('has aria-live="polite" for accessibility', () => {
    const wrapper = mountDisplay('0')
    expect(wrapper.find('span[aria-live]').attributes('aria-live')).toBe('polite')
  })
})
