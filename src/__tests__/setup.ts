import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, vi } from 'vitest'

// ── Mock window.matchMedia (not implemented in jsdom) ─────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ── Force en-US locale in tests ──────────────────────────────────────────────
// Production code uses `undefined` (browser default locale) for Intl formatting,
// which is correct for real users. In CI / dev environments the system locale
// may differ (e.g. pt-BR), so we pin en-US here for deterministic test output.

const OriginalNumberFormat = Intl.NumberFormat
vi.stubGlobal(
  'Intl',
  new Proxy(Intl, {
    get(target, prop, receiver) {
      if (prop === 'NumberFormat') {
        return function (locales?: string | string[], options?: Intl.NumberFormatOptions) {
          return new OriginalNumberFormat(locales ?? 'en-US', options)
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  }),
)

const origToLocaleDateString = Date.prototype.toLocaleDateString
Date.prototype.toLocaleDateString = function (
  locales?: string | string[] | Intl.Locale,
  options?: Intl.DateTimeFormatOptions,
) {
  return origToLocaleDateString.call(this, (locales as string) ?? 'en-US', options)
}

// Set up a fresh Pinia before each test
beforeEach(() => {
  setActivePinia(createPinia())
})

// Global Vue Test Utils config
config.global.plugins = []
