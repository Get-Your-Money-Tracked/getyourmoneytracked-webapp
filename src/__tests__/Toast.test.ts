import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, reactive } from 'vue'
import Toast from '@/components/common/Toast.vue'
import type { ToastMessage } from '@/stores/toast'

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

// ── Store mock ────────────────────────────────────────────────
const _mockToasts = ref<ToastMessage[]>([])
const _mockDismiss = vi.fn()

vi.mock('@/stores/toast', () => ({
  useToastStore: () =>
    reactive({
      get toasts() { return _mockToasts.value },
      dismiss: _mockDismiss,
    }),
}))

function mountToast() {
  return mount(Toast, {
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('Toast component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _mockToasts.value = []
  })

  afterEach(() => {
    // Clean up any teleported content
    document.body.innerHTML = ''
  })

  it('renders nothing when there are no toasts', () => {
    mountToast()
    const statuses = document.body.querySelectorAll('[role="status"]')
    expect(statuses).toHaveLength(0)
  })

  it('renders a success toast with message text', async () => {
    _mockToasts.value = [{ id: 1, message: 'Transaction saved!', variant: 'success', duration: 3000 }]
    mountToast()
    await flushPromises()
    expect(document.body.textContent).toContain('Transaction saved!')
    const toast = document.body.querySelector('[role="status"]')
    expect(toast).not.toBeNull()
  })

  it('renders an error toast', async () => {
    _mockToasts.value = [{ id: 2, message: 'Something went wrong', variant: 'error', duration: 3000 }]
    mountToast()
    await flushPromises()
    expect(document.body.textContent).toContain('Something went wrong')
  })

  it('renders an info toast', async () => {
    _mockToasts.value = [{ id: 3, message: 'Tip: swipe to dismiss', variant: 'info', duration: 3000 }]
    mountToast()
    await flushPromises()
    expect(document.body.textContent).toContain('Tip: swipe to dismiss')
  })

  it('renders multiple toasts simultaneously', async () => {
    _mockToasts.value = [
      { id: 1, message: 'First', variant: 'success', duration: 3000 },
      { id: 2, message: 'Second', variant: 'error', duration: 3000 },
    ]
    mountToast()
    await flushPromises()
    const statuses = document.body.querySelectorAll('[role="status"]')
    expect(statuses).toHaveLength(2)
  })

  it('dismiss button calls dismiss with the correct toast id', async () => {
    _mockToasts.value = [{ id: 42, message: 'Dismissable', variant: 'success', duration: 3000 }]
    mountToast()
    await flushPromises()
    const dismissBtn = document.body.querySelector('button[aria-label="Dismiss"]') as HTMLElement
    expect(dismissBtn).not.toBeNull()
    dismissBtn.click()
    await flushPromises()
    expect(_mockDismiss).toHaveBeenCalledWith(42)
  })

  it('has aria-live="polite" for accessibility', () => {
    mountToast()
    const container = document.body.querySelector('[aria-live="polite"]')
    expect(container).not.toBeNull()
  })
})
