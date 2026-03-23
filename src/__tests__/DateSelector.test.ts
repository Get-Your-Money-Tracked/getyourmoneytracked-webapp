import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DateSelector from '@/components/common/DateSelector.vue'

describe('DateSelector', () => {
  // ── Rendering ─────────────────────────────────────────────────
  it('renders the container div', () => {
    const wrapper = mount(DateSelector, { props: { modelValue: '2026-03-22' } })
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('displays "Today" when modelValue matches today', () => {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const wrapper = mount(DateSelector, { props: { modelValue: today } })
    expect(wrapper.text()).toContain('Today')
  })

  it('displays formatted date when modelValue is not today', () => {
    const wrapper = mount(DateSelector, { props: { modelValue: '2026-01-15' } })
    // Should show something like "Jan 15"
    expect(wrapper.text()).toMatch(/Jan\s+15/)
  })

  it('displays "Today" when modelValue is empty string', () => {
    const wrapper = mount(DateSelector, { props: { modelValue: '' } })
    expect(wrapper.text()).toContain('Today')
  })

  // ── Hidden input attributes (AC3, AC4, AC10) ──────────────────
  it('hidden input has z-10 class (AC3)', () => {
    const wrapper = mount(DateSelector, { props: { modelValue: '2026-03-22' } })
    const input = wrapper.find('input[type="date"]')
    expect(input.classes()).toContain('z-10')
  })

  it('hidden input has w-full class (AC4)', () => {
    const wrapper = mount(DateSelector, { props: { modelValue: '2026-03-22' } })
    const input = wrapper.find('input[type="date"]')
    expect(input.classes()).toContain('w-full')
  })

  it('hidden input has h-full class (AC4)', () => {
    const wrapper = mount(DateSelector, { props: { modelValue: '2026-03-22' } })
    const input = wrapper.find('input[type="date"]')
    expect(input.classes()).toContain('h-full')
  })

  it('hidden input has opacity-0 (stays invisible)', () => {
    const wrapper = mount(DateSelector, { props: { modelValue: '2026-03-22' } })
    const input = wrapper.find('input[type="date"]')
    expect(input.classes()).toContain('opacity-0')
  })

  // ── Emit on change (AC8) ──────────────────────────────────────
  it('emits update:modelValue when input changes', async () => {
    const wrapper = mount(DateSelector, { props: { modelValue: '2026-03-22' } })
    const input = wrapper.find('input[type="date"]')
    await input.setValue('2026-04-10')
    await input.trigger('change')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(['2026-04-10'])
  })

  // ── Fallback click handler (AC6, AC9) ─────────────────────────
  it('clicking the container calls input click as fallback', async () => {
    const wrapper = mount(DateSelector, {
      props: { modelValue: '2026-03-22' },
      attachTo: document.body,
    })
    const input = wrapper.find('input[type="date"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')

    // Mock showPicker as undefined so fallback click() is used
    Object.defineProperty(input, 'showPicker', { value: undefined, writable: true })

    await wrapper.find('div').trigger('click')

    expect(clickSpy).toHaveBeenCalled()
    wrapper.unmount()
  })
})
