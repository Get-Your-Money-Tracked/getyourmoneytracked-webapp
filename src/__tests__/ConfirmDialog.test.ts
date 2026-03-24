import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(ConfirmDialog, {
    props: {
      open: true,
      title: 'Delete transaction?',
      description: 'This action cannot be undone.',
      ...props,
    },
    attachTo: document.body,
  })
}

describe('ConfirmDialog', () => {
  it('renders when open is true', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('[data-testid="confirm-dialog"]').exists()).toBe(true)
  })

  it('does not render when open is false', () => {
    const wrapper = mountDialog({ open: false })
    expect(wrapper.find('[data-testid="confirm-dialog"]').exists()).toBe(false)
  })

  it('renders the title', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('[data-testid="confirm-dialog-title"]').text()).toBe('Delete transaction?')
  })

  it('renders the description', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('[data-testid="confirm-dialog-description"]').text()).toBe(
      'This action cannot be undone.',
    )
  })

  it('renders Cancel and confirm buttons', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('[data-testid="confirm-dialog-cancel-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="confirm-dialog-confirm-btn"]').exists()).toBe(true)
  })

  it('uses "Delete" as default confirm label', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('[data-testid="confirm-dialog-confirm-btn"]').text()).toBe('Delete')
  })

  it('uses custom confirmLabel when provided', () => {
    const wrapper = mountDialog({ confirmLabel: 'Archive' })
    expect(wrapper.find('[data-testid="confirm-dialog-confirm-btn"]').text()).toBe('Archive')
  })

  it('emits "cancel" when Cancel button is clicked', async () => {
    const wrapper = mountDialog()
    await wrapper.find('[data-testid="confirm-dialog-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits "confirm" when confirm button is clicked', async () => {
    const wrapper = mountDialog()
    await wrapper.find('[data-testid="confirm-dialog-confirm-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('emits "cancel" when backdrop is clicked', async () => {
    const wrapper = mountDialog()
    await wrapper.find('[data-testid="confirm-dialog-backdrop"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
