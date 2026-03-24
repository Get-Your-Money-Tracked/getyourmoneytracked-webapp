import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RenameTagDialog from '@/components/tags/RenameTagDialog.vue'

vi.mock('lucide-vue-next', () => ({}))

function mountDialog(open: boolean, tagName = 'vacation', tagCount = 5) {
  return mount(RenameTagDialog, {
    props: { open, tagName, tagCount },
    attachTo: document.body,
  })
}

describe('RenameTagDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('does not render when closed', () => {
    const wrapper = mountDialog(false)
    expect(wrapper.find('[data-testid="rename-tag-dialog"]').exists()).toBe(false)
  })

  it('renders dialog when open', () => {
    const wrapper = mountDialog(true)
    expect(wrapper.find('[data-testid="rename-tag-dialog"]').exists()).toBe(true)
  })

  it('pre-fills input with current tag name', () => {
    const wrapper = mountDialog(true, 'vacation', 3)
    const input = wrapper.find('[data-testid="rename-tag-input"]')
    expect((input.element as HTMLInputElement).value).toBe('vacation')
  })

  it('shows transaction count in warning text', () => {
    const wrapper = mountDialog(true, 'vacation', 12)
    expect(wrapper.find('[data-testid="rename-tag-dialog"]').text()).toContain('12 transactions')
  })

  it('shows singular "transaction" for count of 1', () => {
    const wrapper = mountDialog(true, 'vacation', 1)
    expect(wrapper.find('[data-testid="rename-tag-dialog"]').text()).toContain('1 transaction')
    expect(wrapper.find('[data-testid="rename-tag-dialog"]').text()).not.toContain('1 transactions')
  })

  it('emits rename event with new name when confirm is clicked', async () => {
    const wrapper = mountDialog(true, 'vacation', 5)
    const input = wrapper.find('[data-testid="rename-tag-input"]')
    await input.setValue('holiday')
    await wrapper.find('[data-testid="rename-tag-confirm-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('rename')).toBeTruthy()
    expect((wrapper.emitted('rename') as string[][])[0][0]).toBe('holiday')
  })

  it('emits close event when cancel is clicked', async () => {
    const wrapper = mountDialog(true)
    await wrapper.find('[data-testid="rename-tag-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('confirm button is disabled when name is unchanged', () => {
    const wrapper = mountDialog(true, 'vacation', 5)
    const btn = wrapper.find('[data-testid="rename-tag-confirm-btn"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('confirm button is disabled when name is empty', async () => {
    const wrapper = mountDialog(true, 'vacation', 5)
    const input = wrapper.find('[data-testid="rename-tag-input"]')
    await input.setValue('')
    const btn = wrapper.find('[data-testid="rename-tag-confirm-btn"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('confirm button is enabled when name is changed', async () => {
    const wrapper = mountDialog(true, 'vacation', 5)
    const input = wrapper.find('[data-testid="rename-tag-input"]')
    await input.setValue('holiday')
    const btn = wrapper.find('[data-testid="rename-tag-confirm-btn"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('emits rename when Enter key is pressed', async () => {
    const wrapper = mountDialog(true, 'vacation', 5)
    const input = wrapper.find('[data-testid="rename-tag-input"]')
    await input.setValue('holiday')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.emitted('rename')).toBeTruthy()
  })

  it('emits close when backdrop is clicked', async () => {
    const wrapper = mountDialog(true)
    await wrapper.find('[data-testid="rename-tag-dialog-backdrop"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
