import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import { DESKTOP_BREAKPOINT } from '@/utils/constants'

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  const mql = {
    matches,
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.push(cb)
    }),
    removeEventListener: vi.fn(),
    _listeners: listeners,
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mql))
  return mql
}

// Wrapper component so we can test the composable lifecycle
function makeWrapper() {
  return defineComponent({
    setup() {
      return useResponsive()
    },
    template: `<div :data-is-mobile="isMobile" :data-is-desktop="isDesktop" />`,
  })
}

describe('DESKTOP_BREAKPOINT constant', () => {
  it('equals 768', () => {
    expect(DESKTOP_BREAKPOINT).toBe(768)
  })
})

describe('useResponsive', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns isMobile=true, isDesktop=false on narrow viewport', async () => {
    mockMatchMedia(false) // viewport < 768px
    const wrapper = mount(makeWrapper())
    await nextTick()
    expect(wrapper.attributes('data-is-mobile')).toBe('true')
    expect(wrapper.attributes('data-is-desktop')).toBe('false')
  })

  it('returns isMobile=false, isDesktop=true on wide viewport', async () => {
    mockMatchMedia(true) // viewport >= 768px
    const wrapper = mount(makeWrapper())
    await nextTick()
    expect(wrapper.attributes('data-is-mobile')).toBe('false')
    expect(wrapper.attributes('data-is-desktop')).toBe('true')
  })

  it('registers a change listener on matchMedia', async () => {
    const mql = mockMatchMedia(false)
    mount(makeWrapper())
    await nextTick()
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes the change listener on unmount', async () => {
    const mql = mockMatchMedia(false)
    const wrapper = mount(makeWrapper())
    await nextTick()
    wrapper.unmount()
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
