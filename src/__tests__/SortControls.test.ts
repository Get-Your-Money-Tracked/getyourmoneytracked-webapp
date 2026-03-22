import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SortControls from '@/components/history/SortControls.vue'
import type { MonthlySortOption } from '@/graphql/queries/history'

function mountControls(modelValue: MonthlySortOption = 'CHRONOLOGICAL_DESC') {
  return mount(SortControls, { props: { modelValue } })
}

describe('SortControls', () => {
  it('renders without errors', () => {
    const wrapper = mountControls()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the sort select element', () => {
    const wrapper = mountControls()
    expect(wrapper.find('[data-testid="sort-select"]').exists()).toBe(true)
  })

  it('shows the current sort value as selected', () => {
    const wrapper = mountControls('HIGHEST_EXPENSES')
    const select = wrapper.find<HTMLSelectElement>('[data-testid="sort-select"]')
    expect(select.element.value).toBe('HIGHEST_EXPENSES')
  })

  it('emits update:modelValue when sort changes', async () => {
    const wrapper = mountControls('CHRONOLOGICAL_DESC')
    const select = wrapper.find('[data-testid="sort-select"]')
    await select.setValue('CHRONOLOGICAL_ASC')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['CHRONOLOGICAL_ASC'])
  })

  it('emits HIGHEST_EXPENSES when that option is selected', async () => {
    const wrapper = mountControls('CHRONOLOGICAL_DESC')
    const select = wrapper.find('[data-testid="sort-select"]')
    await select.setValue('HIGHEST_EXPENSES')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['HIGHEST_EXPENSES'])
  })

  it('emits LOWEST_EXPENSES when that option is selected', async () => {
    const wrapper = mountControls('CHRONOLOGICAL_DESC')
    await wrapper.find('[data-testid="sort-select"]').setValue('LOWEST_EXPENSES')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['LOWEST_EXPENSES'])
  })

  it('emits HIGHEST_PERCENT_SPENT when that option is selected', async () => {
    const wrapper = mountControls('CHRONOLOGICAL_DESC')
    await wrapper.find('[data-testid="sort-select"]').setValue('HIGHEST_PERCENT_SPENT')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['HIGHEST_PERCENT_SPENT'])
  })

  it('emits LOWEST_PERCENT_SPENT when that option is selected', async () => {
    const wrapper = mountControls('CHRONOLOGICAL_DESC')
    await wrapper.find('[data-testid="sort-select"]').setValue('LOWEST_PERCENT_SPENT')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['LOWEST_PERCENT_SPENT'])
  })

  it('renders 6 sort options', () => {
    const wrapper = mountControls()
    const options = wrapper.findAll('option')
    expect(options.length).toBe(6)
  })

  it('renders "Most Recent" as first option', () => {
    const wrapper = mountControls()
    const options = wrapper.findAll('option')
    expect(options[0].text()).toBe('Most Recent')
  })

  it('renders all 6 option labels', () => {
    const wrapper = mountControls()
    const text = wrapper.text()
    expect(text).toContain('Most Recent')
    expect(text).toContain('Oldest First')
    expect(text).toContain('Highest Expenses')
    expect(text).toContain('Lowest Expenses')
    expect(text).toContain('Highest % Spent')
    expect(text).toContain('Lowest % Spent')
  })
})
