import { ref, onMounted, onUnmounted } from 'vue'
import { DESKTOP_BREAKPOINT } from '@/utils/constants'

const QUERY = `(min-width: ${DESKTOP_BREAKPOINT}px)`

/**
 * Reactive breakpoint composable.
 * Uses `matchMedia` with a change listener (debounced 100ms) to keep
 * `isMobile` / `isDesktop` in sync with viewport width.
 */
export function useResponsive() {
  // SSR-safe: default to false (mobile-first) until we can check the viewport
  const isDesktop = ref(false)
  const isMobile = ref(true)

  let mql: MediaQueryList | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function update(e: MediaQueryListEvent | MediaQueryList) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      isDesktop.value = e.matches
      isMobile.value = !e.matches
    }, 100)
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    mql = window.matchMedia(QUERY)
    // Set initial value immediately (no debounce on mount)
    isDesktop.value = mql.matches
    isMobile.value = !mql.matches
    mql.addEventListener('change', update)
  })

  onUnmounted(() => {
    if (mql) mql.removeEventListener('change', update)
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return { isMobile, isDesktop }
}
