import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TagInput from '@/components/common/TagInput.vue'

vi.mock('lucide-vue-next', () => ({
  X: { template: '<span class="x-icon" />' },
}))

function mountTagInput(modelValue: string[] = [], suggestions: string[] = []) {
  return mount(TagInput, {
    props: { modelValue, suggestions },
    attachTo: document.body,
  })
}

describe('TagInput', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the tag input container', () => {
    const wrapper = mountTagInput()
    expect(wrapper.find('[data-testid="tag-input"]').exists()).toBe(true)
  })

  it('renders existing tags as chips', () => {
    const wrapper = mountTagInput(['food', 'travel'])
    expect(wrapper.find('[data-testid="tag-chip-food"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tag-chip-travel"]').exists()).toBe(true)
  })

  it('renders text input when under max tags', () => {
    const wrapper = mountTagInput(['food'])
    expect(wrapper.find('[data-testid="tag-text-input"]').exists()).toBe(true)
  })

  it('hides text input and shows limit message at max (10) tags', () => {
    const maxTags = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    const wrapper = mountTagInput(maxTags)
    expect(wrapper.find('[data-testid="tag-text-input"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="tag-limit-message"]').exists()).toBe(true)
  })

  it('emits update:modelValue when Enter is pressed with text', async () => {
    const wrapper = mountTagInput(['food'])
    const input = wrapper.find('[data-testid="tag-text-input"]')
    await input.setValue('travel')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    const emitted = wrapper.emitted('update:modelValue') as string[][]
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0]).toContain('travel')
  })

  it('emits update:modelValue when comma is pressed with text', async () => {
    const wrapper = mountTagInput([])
    const input = wrapper.find('[data-testid="tag-text-input"]')
    await input.setValue('trip')
    await input.trigger('keydown', { key: ',' })
    await flushPromises()
    const emitted = wrapper.emitted('update:modelValue') as string[][]
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0]).toContain('trip')
  })

  it('sanitizes tag text (lowercases, replaces spaces with hyphens)', async () => {
    const wrapper = mountTagInput([])
    const input = wrapper.find('[data-testid="tag-text-input"]')
    await input.setValue('My Tag')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    const emitted = wrapper.emitted('update:modelValue') as string[][]
    expect(emitted[0][0]).toContain('my-tag')
  })

  it('does not add duplicate tags', async () => {
    const wrapper = mountTagInput(['food'])
    const input = wrapper.find('[data-testid="tag-text-input"]')
    await input.setValue('food')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    // Should not emit if tag already exists
    const emitted = wrapper.emitted('update:modelValue')
    if (emitted) {
      const lastEmit = (emitted[emitted.length - 1] as string[][])[0]
      const foodCount = (lastEmit as unknown as string[]).filter((t: string) => t === 'food').length
      expect(foodCount).toBe(1)
    }
  })

  it('emits update:modelValue when remove button is clicked', async () => {
    const wrapper = mountTagInput(['food', 'travel'])
    await wrapper.find('[data-testid="tag-remove-food"]').trigger('click')
    await flushPromises()
    const emitted = wrapper.emitted('update:modelValue') as string[][]
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).not.toContain('food')
    expect(emitted[0][0]).toContain('travel')
  })

  it('removes last tag on Backspace when input is empty', async () => {
    const wrapper = mountTagInput(['food', 'travel'])
    const input = wrapper.find('[data-testid="tag-text-input"]')
    await input.setValue('')
    await input.trigger('keydown', { key: 'Backspace' })
    await flushPromises()
    const emitted = wrapper.emitted('update:modelValue') as string[][]
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).not.toContain('travel')
    expect(emitted[0][0]).toContain('food')
  })

  it('does not add tag when input is empty on Enter', async () => {
    const wrapper = mountTagInput([])
    const input = wrapper.find('[data-testid="tag-text-input"]')
    await input.setValue('')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('shows autocomplete suggestions when typing matches', async () => {
    const wrapper = mountTagInput([], ['food', 'football', 'travel'])
    const input = wrapper.find('[data-testid="tag-text-input"]')
    await input.setValue('foo')
    await input.trigger('input')
    await flushPromises()
    expect(wrapper.find('[data-testid="tag-suggestions"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tag-suggestion-food"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tag-suggestion-football"]').exists()).toBe(true)
  })

  it('autocomplete does not suggest already-added tags', async () => {
    const wrapper = mountTagInput(['food'], ['food', 'football'])
    const input = wrapper.find('[data-testid="tag-text-input"]')
    await input.setValue('foo')
    await input.trigger('input')
    await flushPromises()
    expect(wrapper.find('[data-testid="tag-suggestion-food"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="tag-suggestion-football"]').exists()).toBe(true)
  })
})
