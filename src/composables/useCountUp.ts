import { ref, watch, onUnmounted } from 'vue'

/**
 * Animates a number from its current value to a new target using requestAnimationFrame
 * with ease-out cubic timing.
 *
 * On initial mount the value is set immediately (no animation) so that SSR / test
 * environments that never tick rAF still render the correct number.  Subsequent
 * changes trigger the animated transition.
 *
 * @param targetValue - Getter function returning the target number (reactive-compatible)
 * @param duration    - Animation duration in ms (default 500)
 * @returns `displayValue` — reactive ref that tracks the animated value
 */
export function useCountUp(targetValue: () => number, duration = 500) {
  // Initialise synchronously so the first render shows the real value
  const displayValue = ref(targetValue())
  let rafId: number | null = null
  let isFirstRun = true

  function animate(from: number, to: number, startTime: number, now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    // Ease-out cubic: 1 - (1 - t)^3
    const eased = 1 - Math.pow(1 - progress, 3)
    displayValue.value = from + (to - from) * eased

    if (progress < 1) {
      rafId = requestAnimationFrame((ts) => animate(from, to, startTime, ts))
    } else {
      displayValue.value = to
      rafId = null
    }
  }

  function startAnimation(to: number) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    const from = displayValue.value
    const startTime = performance.now()
    rafId = requestAnimationFrame((ts) => animate(from, to, startTime, ts))
  }

  watch(
    targetValue,
    (newVal) => {
      if (isFirstRun) {
        // Skip animation on mount — value already set synchronously above
        isFirstRun = false
        displayValue.value = newVal
        return
      }
      startAnimation(newVal)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
  })

  return { displayValue }
}
