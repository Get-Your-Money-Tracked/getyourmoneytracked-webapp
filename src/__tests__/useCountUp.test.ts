import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useCountUp } from '@/composables/useCountUp'

type FlushFrames = (advanceMs: number) => void

// We need to mock requestAnimationFrame to control animation frames in tests
describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    let frameCallbacks: FrameRequestCallback[] = []
    let currentTime = 0

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frameCallbacks.push(cb)
      return frameCallbacks.length - 1
    })

    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frameCallbacks[id] = () => {}
    })

    vi.stubGlobal('performance', {
      now: () => currentTime,
    })

    // Helper to advance animation by flushing all pending frames
    ;(globalThis as Record<string, unknown>).__flushFrames = (advanceMs: number) => {
      currentTime += advanceMs
      const toFlush = [...frameCallbacks]
      frameCallbacks = []
      toFlush.forEach((cb) => cb(currentTime))
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function flush(advanceMs: number) {
    ;(globalThis as unknown as Record<string, FlushFrames>).__flushFrames(advanceMs)
  }

  it('initialises synchronously to the target value (no rAF needed)', () => {
    const { displayValue } = useCountUp(() => 100)
    // The initial value is set synchronously so SSR / test environments render correctly
    expect(displayValue.value).toBe(100)
  })

  it('reaches target value after animation completes', async () => {
    const { displayValue } = useCountUp(() => 200, 500)

    // Advance past full duration
    flush(600)
    flush(0)

    expect(displayValue.value).toBe(200)
  })

  it('updates when target value changes', async () => {
    const target = ref(100)
    const { displayValue } = useCountUp(() => target.value, 500)

    // Complete first animation
    flush(600)
    flush(0)
    expect(displayValue.value).toBe(100)

    // Change target
    target.value = 300
    await nextTick()

    // Complete second animation
    flush(600)
    flush(0)
    expect(displayValue.value).toBe(300)
  })

  it('is between start and target during animation after a value change', async () => {
    const target = ref(0)
    const { displayValue } = useCountUp(() => target.value, 500)
    // Initial value set synchronously to 0
    expect(displayValue.value).toBe(0)

    // Trigger a subsequent change to kick off animation
    target.value = 100
    await nextTick()

    // Advance halfway — value should be partway between 0 and 100
    flush(250)
    flush(0)

    expect(displayValue.value).toBeGreaterThan(0)
    expect(displayValue.value).toBeLessThan(100)
  })
})
