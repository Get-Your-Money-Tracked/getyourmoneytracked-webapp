import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimeRangeSelector, { presetToRange } from '@/components/reports/TimeRangeSelector.vue'

describe('TimeRangeSelector', () => {
  function mountSelector() {
    return mount(TimeRangeSelector)
  }

  it('renders all preset buttons', () => {
    const wrapper = mountSelector()
    expect(wrapper.find('[data-testid="preset-3m"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="preset-6m"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="preset-12m"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="preset-ytd"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="preset-custom"]').exists()).toBe(true)
  })

  it('3M is selected by default', () => {
    const wrapper = mountSelector()
    expect(wrapper.find('[data-testid="preset-3m"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-testid="preset-6m"]').attributes('aria-pressed')).toBe('false')
  })

  it('emits change with a date range when a preset is clicked', async () => {
    const wrapper = mountSelector()
    await wrapper.find('[data-testid="preset-6m"]').trigger('click')
    expect(wrapper.emitted('change')).toBeTruthy()
    const [range] = wrapper.emitted('change')![0] as [{ startMonth: string; endMonth: string }][]
    expect(range).toHaveProperty('startMonth')
    expect(range).toHaveProperty('endMonth')
  })

  it('clicking 3M emits a change event', async () => {
    const wrapper = mountSelector()
    await wrapper.find('[data-testid="preset-3m"]').trigger('click')
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('clicking YTD emits a change event', async () => {
    const wrapper = mountSelector()
    await wrapper.find('[data-testid="preset-ytd"]').trigger('click')
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('clicking Custom emits open-custom instead of change', async () => {
    const wrapper = mountSelector()
    await wrapper.find('[data-testid="preset-custom"]').trigger('click')
    expect(wrapper.emitted('open-custom')).toBeTruthy()
    expect(wrapper.emitted('change')).toBeFalsy()
  })

  it('marks selected preset with aria-pressed=true', async () => {
    const wrapper = mountSelector()
    await wrapper.find('[data-testid="preset-12m"]').trigger('click')
    expect(wrapper.find('[data-testid="preset-12m"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-testid="preset-3m"]').attributes('aria-pressed')).toBe('false')
  })

  it('setCustomActive() marks Custom as active without emitting change', async () => {
    const wrapper = mountSelector()
    const vm = wrapper.vm as InstanceType<typeof TimeRangeSelector>
    vm.setCustomActive()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="preset-custom"]').attributes('aria-pressed')).toBe('true')
    // No change event should have been emitted by setCustomActive
    expect(wrapper.emitted('change')).toBeFalsy()
  })

  it('renders time-range-selector container', () => {
    const wrapper = mountSelector()
    expect(wrapper.find('[data-testid="time-range-selector"]').exists()).toBe(true)
  })
})

// ── presetToRange utility ─────────────────────────────────────────────────────

describe('presetToRange', () => {
  it('returns null for Custom preset', () => {
    expect(presetToRange('Custom')).toBeNull()
  })

  it('returns an object with startMonth and endMonth for 3M', () => {
    const range = presetToRange('3M')
    expect(range).not.toBeNull()
    expect(range!.startMonth).toMatch(/^\d{4}-\d{2}$/)
    expect(range!.endMonth).toMatch(/^\d{4}-\d{2}$/)
  })

  it('returns a startMonth before endMonth for 6M', () => {
    const range = presetToRange('6M')!
    expect(range.startMonth <= range.endMonth).toBe(true)
  })

  it('returns a startMonth before endMonth for 12M', () => {
    const range = presetToRange('12M')!
    expect(range.startMonth <= range.endMonth).toBe(true)
  })

  it('YTD start is January of the current year', () => {
    const range = presetToRange('YTD')!
    const year = new Date().getFullYear()
    expect(range.startMonth).toBe(`${year}-01`)
  })
})
