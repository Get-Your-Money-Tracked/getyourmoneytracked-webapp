import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionTypeToggle from '@/components/common/TransactionTypeToggle.vue'
import type { TransactionType } from '@/types'

describe('TransactionTypeToggle', () => {
  function mountToggle(modelValue: TransactionType = 'EXPENSE') {
    return mount(TransactionTypeToggle, {
      props: { modelValue },
    })
  }

  it('renders three segment buttons', () => {
    const wrapper = mountToggle()
    const buttons = wrapper.findAll('button[role="radio"]')
    expect(buttons).toHaveLength(3)
  })

  it('renders Expense, Income, and Transfer labels', () => {
    const wrapper = mountToggle()
    expect(wrapper.text()).toContain('Expense')
    expect(wrapper.text()).toContain('Income')
    expect(wrapper.text()).toContain('Transfer')
  })

  it('marks Expense button as checked when modelValue is EXPENSE', () => {
    const wrapper = mountToggle('EXPENSE')
    const expenseBtn = wrapper.findAll('button[role="radio"]').find(
      (b) => b.text() === 'Expense',
    )
    expect(expenseBtn?.attributes('aria-checked')).toBe('true')
  })

  it('marks Income button as checked when modelValue is INCOME', () => {
    const wrapper = mountToggle('INCOME')
    const incomeBtn = wrapper.findAll('button[role="radio"]').find(
      (b) => b.text() === 'Income',
    )
    expect(incomeBtn?.attributes('aria-checked')).toBe('true')
  })

  it('marks Transfer button as checked when modelValue is TRANSFER', () => {
    const wrapper = mountToggle('TRANSFER')
    const transferBtn = wrapper.findAll('button[role="radio"]').find(
      (b) => b.text() === 'Transfer',
    )
    expect(transferBtn?.attributes('aria-checked')).toBe('true')
  })

  it('emits update:modelValue with EXPENSE when Expense is clicked', async () => {
    const wrapper = mountToggle('INCOME')
    const expenseBtn = wrapper.findAll('button[role="radio"]').find(
      (b) => b.text() === 'Expense',
    )
    await expenseBtn?.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['EXPENSE'])
  })

  it('emits update:modelValue with INCOME when Income is clicked', async () => {
    const wrapper = mountToggle('EXPENSE')
    const incomeBtn = wrapper.findAll('button[role="radio"]').find(
      (b) => b.text() === 'Income',
    )
    await incomeBtn?.trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['INCOME'])
  })

  it('emits update:modelValue with TRANSFER when Transfer is clicked', async () => {
    const wrapper = mountToggle('EXPENSE')
    const transferBtn = wrapper.findAll('button[role="radio"]').find(
      (b) => b.text() === 'Transfer',
    )
    await transferBtn?.trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['TRANSFER'])
  })

  it('marks non-selected buttons as aria-checked="false"', () => {
    const wrapper = mountToggle('EXPENSE')
    const buttons = wrapper.findAll('button[role="radio"]')
    const unchecked = buttons.filter((b) => b.attributes('aria-checked') === 'false')
    expect(unchecked).toHaveLength(2)
  })

  it('has role="radiogroup" on the container', () => {
    const wrapper = mountToggle()
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
  })
})
