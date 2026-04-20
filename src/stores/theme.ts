import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type Theme = 'light' | 'dark'

export type AccentColor = 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan' | 'orange' | 'indigo'

const ACCENT_COLORS: Record<AccentColor, { primary: string; primaryHover: string; primaryDark: string; primaryHoverDark: string }> = {
  emerald: { primary: '#10b981', primaryHover: '#059669', primaryDark: '#34d399', primaryHoverDark: '#6ee7b7' },
  blue: { primary: '#3b82f6', primaryHover: '#2563eb', primaryDark: '#60a5fa', primaryHoverDark: '#93bbfd' },
  violet: { primary: '#8b5cf6', primaryHover: '#7c3aed', primaryDark: '#a78bfa', primaryHoverDark: '#c4b5fd' },
  rose: { primary: '#f43f5e', primaryHover: '#e11d48', primaryDark: '#fb7185', primaryHoverDark: '#fda4af' },
  amber: { primary: '#f59e0b', primaryHover: '#d97706', primaryDark: '#fbbf24', primaryHoverDark: '#fcd34d' },
  cyan: { primary: '#06b6d4', primaryHover: '#0891b2', primaryDark: '#22d3ee', primaryHoverDark: '#67e8f9' },
  orange: { primary: '#f97316', primaryHover: '#ea580c', primaryDark: '#fb923c', primaryHoverDark: '#fdba74' },
  indigo: { primary: '#6366f1', primaryHover: '#4f46e5', primaryDark: '#818cf8', primaryHoverDark: '#a5b4fc' },
}

export const ACCENT_COLOR_OPTIONS = Object.keys(ACCENT_COLORS) as AccentColor[]

export const useThemeStore = defineStore('theme', () => {
  const STORAGE_KEY = 'gymt-theme'
  const ACCENT_KEY = 'gymt-accent'
  const AMOLED_KEY = 'gymt-amoled'

  function getInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  }

  function getInitialAccent(): AccentColor {
    const stored = localStorage.getItem(ACCENT_KEY) as AccentColor | null
    if (stored && stored in ACCENT_COLORS) return stored
    return 'emerald'
  }

  function getInitialAmoled(): boolean {
    return localStorage.getItem(AMOLED_KEY) === 'true'
  }

  const theme = ref<Theme>(getInitialTheme())
  const accentColor = ref<AccentColor>(getInitialAccent())
  const amoledMode = ref(getInitialAmoled())
  const isDark = computed(() => theme.value === 'dark')

  function applyTheme(t: Theme) {
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    applyAmoled()
  }

  function applyAccent() {
    const colors = ACCENT_COLORS[accentColor.value]
    const root = document.documentElement
    if (isDark.value) {
      root.style.setProperty('--color-primary', colors.primaryDark)
      root.style.setProperty('--color-primary-hover', colors.primaryHoverDark)
    } else {
      root.style.setProperty('--color-primary', colors.primary)
      root.style.setProperty('--color-primary-hover', colors.primaryHover)
    }
  }

  function applyAmoled() {
    if (amoledMode.value && isDark.value) {
      document.documentElement.classList.add('amoled')
    } else {
      document.documentElement.classList.remove('amoled')
    }
  }

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, theme.value)
    applyTheme(theme.value)
    applyAccent()
  }

  function setAccent(color: AccentColor) {
    accentColor.value = color
    localStorage.setItem(ACCENT_KEY, color)
    applyAccent()
  }

  function toggleAmoled() {
    amoledMode.value = !amoledMode.value
    localStorage.setItem(AMOLED_KEY, String(amoledMode.value))
    applyAmoled()
  }

  function init() {
    applyTheme(theme.value)
    applyAccent()
    // Listen for OS theme changes (only when no user preference is stored)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        theme.value = e.matches ? 'dark' : 'light'
        applyTheme(theme.value)
        applyAccent()
      }
    })
  }

  return { theme, isDark, accentColor, amoledMode, toggle, setAccent, toggleAmoled, init }
})
