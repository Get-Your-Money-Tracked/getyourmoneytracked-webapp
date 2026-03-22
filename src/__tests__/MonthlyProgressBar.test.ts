import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MonthlyProgressBar from '@/components/dashboard/MonthlyProgressBar.vue'

function mountBar(percentSpent: number, noIncome: boolean) {
  return mount(MonthlyProgressBar, { props: { percentSpent, noIncome } })
}

describe('MonthlyProgressBar', () => {
  it('renders without errors', () => {
    const wrapper = mountBar(42, false)
    expect(wrapper.exists()).toBe(true)
  })

  it('shows "No income logged yet" when noIncome is true', () => {
    const wrapper = mountBar(0, true)
    expect(wrapper.find('[data-testid="progress-label"]').text()).toBe('No income logged yet')
  })

  it('shows percentage label when income exists', () => {
    const wrapper = mountBar(42, false)
    expect(wrapper.find('[data-testid="progress-label"]').text()).toContain('42%')
    expect(wrapper.find('[data-testid="progress-label"]').text()).toContain('of income spent')
  })

  it('shows "Over budget!" text when percentSpent > 100', () => {
    const wrapper = mountBar(115, false)
    const label = wrapper.find('[data-testid="progress-label"]')
    expect(label.text()).toContain('115%')
    expect(label.text()).toContain('Over budget!')
  })

  it('applies text-danger class for over-budget label', () => {
    const wrapper = mountBar(120, false)
    const label = wrapper.find('[data-testid="progress-label"]')
    expect(label.classes()).toContain('text-danger')
  })

  it('applies italic text-text-muted class for no-income label', () => {
    const wrapper = mountBar(0, true)
    const label = wrapper.find('[data-testid="progress-label"]')
    expect(label.classes()).toContain('italic')
    expect(label.classes()).toContain('text-text-muted')
  })

  it('shows normal text class for on-track label', () => {
    const wrapper = mountBar(40, false)
    const label = wrapper.find('[data-testid="progress-label"]')
    expect(label.classes()).toContain('text-text-secondary')
  })

  it('renders the ProgressBar component', () => {
    const wrapper = mountBar(60, false)
    expect(wrapper.find('[data-testid="progress-fill"]').exists()).toBe(true)
  })
})
