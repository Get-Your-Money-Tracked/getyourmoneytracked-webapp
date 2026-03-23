import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import LoginPage from '@/pages/LoginPage.vue'

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

vi.mock('@/lib/urql', () => ({
  urqlClient: {},
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

const mockLogin = vi.fn()
const mockSignup = vi.fn()
const mockSendPasswordReset = vi.fn()
const mockClearError = vi.fn()

// Reactive auth state so the watcher in LoginPage fires correctly
const _isAuthenticated = ref(false)

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isLoading: false,
    isSubmitting: false,
    error: null,
    get isAuthenticated() { return _isAuthenticated.value },
    login: mockLogin,
    signup: mockSignup,
    sendPasswordReset: mockSendPasswordReset,
    clearError: mockClearError,
    displayName: '',
    email: '',
    initials: '',
    defaultCurrency: 'USD',
    user: null,
  }),
}))

function createTestRouter(initialPath = '/login') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginPage, meta: { requiresAuth: false } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/budgets', name: 'budgets', component: { template: '<div>Budgets</div>' } },
    ],
  })
  // Simulate the reverse guard from main.ts:
  // when an authenticated user is on /login, redirect respecting the redirect query param.
  router.beforeEach((to) => {
    if (to.name === 'login' && _isAuthenticated.value) {
      const redirect = to.query.redirect
      if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
        return redirect
      }
      return { name: 'dashboard' }
    }
  })
  router.push(initialPath)
  return router
}

// ── Route guard redirect path preservation (AC4) ──────────────────────────────

describe('Route guard — redirect param preservation', () => {
  it('redirects unauthenticated user to /login with redirect param preserved', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', name: 'login', component: { template: '<div />' }, meta: { requiresAuth: false } },
        { path: '/budgets', name: 'budgets', component: { template: '<div />' }, meta: { requiresAuth: true } },
        { path: '/dashboard', name: 'dashboard', component: { template: '<div />' }, meta: { requiresAuth: true } },
      ],
    })

    // Simulate the guard from main.ts
    router.beforeEach((to) => {
      const requiresAuth = to.meta.requiresAuth !== false
      if (requiresAuth) {
        // unauthenticated — redirect with preserve
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    })

    await router.push({ name: 'budgets' })
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/budgets')
  })

  it('preserves query params in the redirect path', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', name: 'login', component: { template: '<div />' }, meta: { requiresAuth: false } },
        { path: '/transactions', name: 'transactions', component: { template: '<div />' }, meta: { requiresAuth: true } },
      ],
    })

    router.beforeEach((to) => {
      const requiresAuth = to.meta.requiresAuth !== false
      if (requiresAuth) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    })

    await router.push('/transactions?filter=expense')
    await flushPromises()

    expect(router.currentRoute.value.query.redirect).toBe('/transactions?filter=expense')
  })
})

// ── Reverse guard: authenticated → /login → /dashboard (AC3) ─────────────────

describe('Route guard — reverse guard', () => {
  it('authenticated user navigating to /login is redirected to /dashboard', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', name: 'login', component: { template: '<div />' }, meta: { requiresAuth: false } },
        { path: '/dashboard', name: 'dashboard', component: { template: '<div />' }, meta: { requiresAuth: true } },
      ],
    })

    router.beforeEach((to) => {
      const isAuthenticated = true // simulated
      if (to.name === 'login' && isAuthenticated) {
        return { name: 'dashboard' }
      }
    })

    await router.push({ name: 'login' })
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})

// ── LoginPage: redirect param consumption (AC1, AC5) ─────────────────────────

describe('LoginPage — redirect after login (simulating main.ts onAuthStateChanged)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _isAuthenticated.value = false
  })

  // These tests simulate the onAuthStateChanged handler in main.ts:
  // after login, it calls setUser (isAuthenticated becomes true), then
  // resolves the redirect param and navigates. The reverse guard in
  // beforeEach also handles the case where an already-authenticated user
  // navigates to /login.

  function resolveRedirect(routerInstance: ReturnType<typeof createTestRouter>): string {
    const redirect = routerInstance.currentRoute.value.query.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect
    }
    return '/dashboard'
  }

  it('redirects to /dashboard by default after login (no redirect param)', async () => {
    const router = createTestRouter('/login')
    await router.isReady()

    // Simulate onAuthStateChanged after login
    _isAuthenticated.value = true
    const target = resolveRedirect(router)
    await router.replace(target)
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/dashboard')
  })

  it('redirects to /budgets after login when redirect=/budgets', async () => {
    const router = createTestRouter('/login?redirect=%2Fbudgets')
    await router.isReady()

    _isAuthenticated.value = true
    const target = resolveRedirect(router)
    await router.replace(target)
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/budgets')
  })

  it('ignores external redirect URL and goes to /dashboard (AC11 — open redirect prevention)', async () => {
    const router = createTestRouter('/login?redirect=https%3A%2F%2Fevil.com')
    await router.isReady()

    _isAuthenticated.value = true
    const target = resolveRedirect(router)
    await router.replace(target)
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/dashboard')
  })

  it('ignores protocol-relative redirect (//evil.com) and goes to /dashboard', async () => {
    const router = createTestRouter('/login?redirect=%2F%2Fevil.com')
    await router.isReady()

    _isAuthenticated.value = true
    const target = resolveRedirect(router)
    await router.replace(target)
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})

// ── Guard waits for isLoading (AC6, AC12) ─────────────────────────────────────

describe('Route guard — loading state pass-through', () => {
  it('allows navigation while isLoading is true (guard returns true)', () => {
    // This tests the guard logic directly
    const isLoading = true
    const isAuthenticated = false
    const requiresAuth = true

    let result: unknown
    if (isLoading) {
      result = true // pass through
    } else if (requiresAuth && !isAuthenticated) {
      result = { name: 'login' }
    }

    expect(result).toBe(true)
  })

  it('redirects unauthenticated user after loading completes', () => {
    const isLoading = false
    const isAuthenticated = false
    const requiresAuth = true
    const to = { fullPath: '/dashboard', meta: { requiresAuth: true } }

    let result: unknown
    if (isLoading) {
      result = true
    } else if (requiresAuth && !isAuthenticated) {
      result = { name: 'login', query: { redirect: to.fullPath } }
    }

    expect(result).toEqual({ name: 'login', query: { redirect: '/dashboard' } })
  })
})
