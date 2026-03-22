import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn() })),
    mutation: vi.fn(() => ({ toPromise: vi.fn() })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

// ── Helpers ───────────────────────────────────────────────────
let mediaQueryDark = false

function setupMediaQuery(isDark: boolean) {
  mediaQueryDark = isDark
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? mediaQueryDark : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('useThemeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    setupMediaQuery(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to light theme when no localStorage and OS is light', async () => {
    setupMediaQuery(false)
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    expect(store.theme).toBe('light')
    expect(store.isDark).toBe(false)
  })

  it('reads dark theme from localStorage', async () => {
    localStorage.setItem('gymt-theme', 'dark')
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    expect(store.theme).toBe('dark')
    expect(store.isDark).toBe(true)
  })

  it('reads light theme from localStorage', async () => {
    localStorage.setItem('gymt-theme', 'light')
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    expect(store.theme).toBe('light')
    expect(store.isDark).toBe(false)
  })

  it('falls back to prefers-color-scheme: dark when no localStorage', async () => {
    setupMediaQuery(true)
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    expect(store.theme).toBe('dark')
  })

  it('toggle() switches from light to dark', async () => {
    localStorage.setItem('gymt-theme', 'light')
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    store.toggle()
    expect(store.theme).toBe('dark')
    expect(store.isDark).toBe(true)
  })

  it('toggle() switches from dark to light', async () => {
    localStorage.setItem('gymt-theme', 'dark')
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    store.toggle()
    expect(store.theme).toBe('light')
    expect(store.isDark).toBe(false)
  })

  it('toggle() persists preference to localStorage', async () => {
    localStorage.setItem('gymt-theme', 'light')
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    store.toggle()
    expect(localStorage.getItem('gymt-theme')).toBe('dark')
  })

  it('init() adds .dark class to <html> when theme is dark', async () => {
    localStorage.setItem('gymt-theme', 'dark')
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    store.init()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('init() removes .dark class from <html> when theme is light', async () => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('gymt-theme', 'light')
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    store.init()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggle() adds .dark class to <html> when switching to dark', async () => {
    localStorage.setItem('gymt-theme', 'light')
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    store.toggle()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggle() removes .dark class from <html> when switching to light', async () => {
    localStorage.setItem('gymt-theme', 'dark')
    document.documentElement.classList.add('dark')
    const { useThemeStore } = await import('@/stores/theme')
    const store = useThemeStore()
    store.toggle()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
