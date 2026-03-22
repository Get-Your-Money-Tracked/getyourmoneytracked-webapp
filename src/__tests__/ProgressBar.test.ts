import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from '@/components/common/ProgressBar.vue'

describe('ProgressBar', () => {
  function mountBar(percent: number) {
    return mount(ProgressBar, { props: { percent } })
  }

  it('renders without errors', () => {
    const wrapper = mountBar(50)
    expect(wrapper.exists()).toBe(true)
  })

  it('applies bg-primary class for 0%', () => {
    const wrapper = mountBar(0)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.classes()).toContain('bg-primary')
  })

  it('applies bg-primary class for 50% (boundary)', () => {
    const wrapper = mountBar(50)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.classes()).toContain('bg-primary')
  })

  it('applies bg-warning class for 51% (boundary)', () => {
    const wrapper = mountBar(51)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.classes()).toContain('bg-warning')
  })

  it('applies bg-warning class for 75%', () => {
    const wrapper = mountBar(75)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.classes()).toContain('bg-warning')
  })

  it('applies bg-warning class for 85% (boundary)', () => {
    const wrapper = mountBar(85)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.classes()).toContain('bg-warning')
  })

  it('applies bg-danger class for 86% (boundary)', () => {
    const wrapper = mountBar(86)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.classes()).toContain('bg-danger')
  })

  it('applies bg-danger class for 100%', () => {
    const wrapper = mountBar(100)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.classes()).toContain('bg-danger')
  })

  it('applies bg-danger class and caps width at 100% for >100%', () => {
    const wrapper = mountBar(150)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.classes()).toContain('bg-danger')
    // Width should be capped at 100%
    expect(fill.attributes('style')).toContain('100%')
  })

  it('sets width to 0% when percent is 0', () => {
    const wrapper = mountBar(0)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.attributes('style')).toContain('0%')
  })

  it('sets width based on percent', () => {
    const wrapper = mountBar(42)
    const fill = wrapper.find('[data-testid="progress-fill"]')
    expect(fill.attributes('style')).toContain('42%')
  })
})
