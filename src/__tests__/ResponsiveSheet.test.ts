import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

// ── Mock useResponsive ────────────────────────────────────────────────────────

const mockIsDesktop = { value: false }

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => ({
    get isDesktop() { return mockIsDesktop.value },
    get isMobile() { return !mockIsDesktop.value },
  }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function mountSheet(props: { open: boolean; title: string; testId?: string }, isDesktop = false) {
  mockIsDesktop.value = isDesktop
  return mount(ResponsiveSheet, {
    props,
    slots: { default: '<div data-testid="slot-content">Sheet body</div>' },
    attachTo: document.body,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ResponsiveSheet — mobile (bottom sheet)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    mockIsDesktop.value = false
  })

  it('renders nothing when open=false', async () => {
    const wrapper = mountSheet({ open: false, title: 'Test' }, false)
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renders sheet when open=true', async () => {
    const wrapper = mountSheet({ open: true, title: 'Test Sheet' }, false)
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('sets aria-label to title', async () => {
    const wrapper = mountSheet({ open: true, title: 'My Sheet' }, false)
    await nextTick()
    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('My Sheet')
  })

  it('sets aria-modal=true', async () => {
    const wrapper = mountSheet({ open: true, title: 'My Sheet' }, false)
    await nextTick()
    expect(wrapper.find('[role="dialog"]').attributes('aria-modal')).toBe('true')
  })

  it('forwards testId to the dialog element', async () => {
    const wrapper = mountSheet({ open: true, title: 'Test', testId: 'my-sheet' }, false)
    await nextTick()
    expect(wrapper.find('[data-testid="my-sheet"]').exists()).toBe(true)
  })

  it('renders slot content', async () => {
    const wrapper = mountSheet({ open: true, title: 'Test' }, false)
    await nextTick()
    expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true)
  })

  it('emits close when backdrop is clicked', async () => {
    const wrapper = mountSheet({ open: true, title: 'Test' }, false)
    await nextTick()
    const backdrop = wrapper.find('[aria-hidden="true"]')
    await backdrop.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('ResponsiveSheet — desktop (centered modal)', () => {
  afterEach(() => {
    mockIsDesktop.value = false
  })

  it('renders nothing when open=false', async () => {
    const wrapper = mountSheet({ open: false, title: 'Test' }, true)
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renders dialog when open=true', async () => {
    const wrapper = mountSheet({ open: true, title: 'Desktop Modal' }, true)
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('sets aria-label to title on desktop', async () => {
    const wrapper = mountSheet({ open: true, title: 'Desktop Modal' }, true)
    await nextTick()
    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('Desktop Modal')
  })

  it('renders title text in header', async () => {
    const wrapper = mountSheet({ open: true, title: 'Budget Form' }, true)
    await nextTick()
    expect(wrapper.text()).toContain('Budget Form')
  })

  it('renders X close button', async () => {
    const wrapper = mountSheet({ open: true, title: 'Test' }, true)
    await nextTick()
    const closeBtn = wrapper.find(`button[aria-label="Close Test"]`)
    expect(closeBtn.exists()).toBe(true)
  })

  it('emits close when X button is clicked', async () => {
    const wrapper = mountSheet({ open: true, title: 'Test' }, true)
    await nextTick()
    const closeBtn = wrapper.find(`button[aria-label="Close Test"]`)
    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('renders slot content on desktop', async () => {
    const wrapper = mountSheet({ open: true, title: 'Test' }, true)
    await nextTick()
    expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true)
  })
})

describe('ResponsiveSheet — Escape key', () => {
  afterEach(() => {
    mockIsDesktop.value = false
  })

  it('emits close on Escape when open', async () => {
    const wrapper = mountSheet({ open: true, title: 'Test' }, false)
    await nextTick()
    await wrapper.trigger('keydown', { key: 'Escape' })
    // Escape is listened on document, so fire via document
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not emit close on Escape when closed', async () => {
    const wrapper = mountSheet({ open: false, title: 'Test' }, false)
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('close')).toBeFalsy()
  })
})
