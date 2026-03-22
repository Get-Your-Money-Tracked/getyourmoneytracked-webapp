import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppLoader from '@/components/common/AppLoader.vue'

describe('AppLoader', () => {
  it('renders without errors', () => {
    const wrapper = mount(AppLoader)
    expect(wrapper.exists()).toBe(true)
  })

  it('has role="status" for accessibility', () => {
    const wrapper = mount(AppLoader)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('renders a loading indicator (dots)', () => {
    const wrapper = mount(AppLoader)
    // 3 pulse dots
    const dots = wrapper.findAll('.animate-pulse')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })

  it('has sr-only text for screen readers', () => {
    const wrapper = mount(AppLoader)
    expect(wrapper.find('.sr-only').exists()).toBe(true)
  })
})

// ── Route guard logic tests ───────────────────────────────────────────────────
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' }, meta: { requiresAuth: false } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' }, meta: { requiresAuth: true } },
    ],
  })
}

describe('Route guard logic', () => {
  it('unauthenticated user navigating to dashboard is redirected to login', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    const authStore = useAuthStore()
    authStore.setUser(null) // unauthenticated

    router.beforeEach((to, _from, next) => {
      if (authStore.isLoading) return next()
      const requiresAuth = to.meta.requiresAuth !== false
      if (requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' })
      } else if (to.name === 'login' && authStore.isAuthenticated) {
        next({ name: 'dashboard' })
      } else {
        next()
      }
    })

    await router.push({ name: 'dashboard' })
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('authenticated user navigating to login is redirected to dashboard', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    const authStore = useAuthStore()
    authStore.setUser({ uid: 'abc', email: 'a@b.com', displayName: 'A' } as never)

    router.beforeEach((to, _from, next) => {
      if (authStore.isLoading) return next()
      const requiresAuth = to.meta.requiresAuth !== false
      if (requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' })
      } else if (to.name === 'login' && authStore.isAuthenticated) {
        next({ name: 'dashboard' })
      } else {
        next()
      }
    })

    await router.push({ name: 'login' })
    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})
