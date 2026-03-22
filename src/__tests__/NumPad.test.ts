import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NumPad from '@/components/common/NumPad.vue'

// NumPad uses lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  Delete: { template: '<span>delete</span>' },
}))

describe('NumPad', () => {
  function mountNumPad() {
    return mount(NumPad)
  }

  it('renders all digit buttons 0-9', () => {
    const wrapper = mountNumPad()
    for (const d of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      const btn = wrapper.find(`button[aria-label="${d}"]`)
      expect(btn.exists(), `Button for ${d} should exist`).toBe(true)
    }
  })

  it('renders decimal button', () => {
    const wrapper = mountNumPad()
    expect(wrapper.find('button[aria-label="decimal point"]').exists()).toBe(true)
  })

  it('renders backspace button', () => {
    const wrapper = mountNumPad()
    expect(wrapper.find('button[aria-label="backspace"]').exists()).toBe(true)
  })

  it('emits digit event when a digit button is clicked', async () => {
    const wrapper = mountNumPad()
    await wrapper.find('button[aria-label="5"]').trigger('click')
    expect(wrapper.emitted('digit')).toBeTruthy()
    expect(wrapper.emitted('digit')![0]).toEqual(['5'])
  })

  it('emits digit event for each digit 1-9', async () => {
    for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      const wrapper = mountNumPad()
      await wrapper.find(`button[aria-label="${d}"]`).trigger('click')
      expect(wrapper.emitted('digit')![0]).toEqual([d])
    }
  })

  it('emits digit event for 0', async () => {
    const wrapper = mountNumPad()
    await wrapper.find('button[aria-label="0"]').trigger('click')
    expect(wrapper.emitted('digit')![0]).toEqual(['0'])
  })

  it('emits decimal event when decimal button is clicked', async () => {
    const wrapper = mountNumPad()
    await wrapper.find('button[aria-label="decimal point"]').trigger('click')
    expect(wrapper.emitted('decimal')).toBeTruthy()
  })

  it('emits backspace event when backspace button is clicked', async () => {
    const wrapper = mountNumPad()
    await wrapper.find('button[aria-label="backspace"]').trigger('click')
    expect(wrapper.emitted('backspace')).toBeTruthy()
  })

  it('renders 12 buttons total (10 digits + decimal + backspace)', () => {
    const wrapper = mountNumPad()
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(12)
  })
})
