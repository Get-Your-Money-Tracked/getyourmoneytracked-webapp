import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      displayName: 'Alex Johnson',
      email: 'alex@example.com',
      logout: vi.fn(),
    }),
}))

function makeRouter(initialPath = '/dashboard') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/dashboard', component: { template: '<div />' } },
      { path: '/history', component: { template: '<div />' } },
      { path: '/budgets', component: { template: '<div />' } },
      { path: '/accounts', component: { template: '<div />' } },
      { path: '/subscriptions', component: { template: '<div />' } },
      { path: '/categories', component: { template: '<div />' } },
      { path: '/settings', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  })
  router.push(initialPath)
  return router
}

async function mountSidebar(initialPath = '/dashboard') {
  const router = makeRouter(initialPath)
  await router.isReady()
  return mount(Sidebar, { global: { plugins: [router] } })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Sidebar', () => {
  it('renders the sidebar element', async () => {
    const wrapper = await mountSidebar()
    expect(wrapper.find('[data-testid="sidebar"]').exists()).toBe(true)
  })

  it('renders all nav links', async () => {
    const wrapper = await mountSidebar()
    const links = ['dashboard', 'history', 'budgets', 'accounts', 'recurring', 'categories', 'settings']
    for (const label of links) {
      expect(wrapper.find(`[data-testid="sidebar-nav-${label}"]`).exists()).toBe(true)
    }
  })

  it('highlights active route with aria-current=page', async () => {
    const wrapper = await mountSidebar('/budgets')
    const budgetsLink = wrapper.find('[data-testid="sidebar-nav-budgets"]')
    expect(budgetsLink.attributes('aria-current')).toBe('page')
  })

  it('does not mark inactive routes as current', async () => {
    const wrapper = await mountSidebar('/dashboard')
    const historyLink = wrapper.find('[data-testid="sidebar-nav-history"]')
    expect(historyLink.attributes('aria-current')).toBeUndefined()
  })

  it('renders "New Transaction" button', async () => {
    const wrapper = await mountSidebar()
    expect(wrapper.find('[data-testid="sidebar-new-transaction"]').exists()).toBe(true)
  })

  it('emits new-transaction when button is clicked', async () => {
    const wrapper = await mountSidebar()
    await wrapper.find('[data-testid="sidebar-new-transaction"]').trigger('click')
    expect(wrapper.emitted('new-transaction')).toHaveLength(1)
  })

  it('renders user initials in avatar', async () => {
    const wrapper = await mountSidebar()
    expect(wrapper.text()).toContain('AJ')
  })

  it('renders logout button', async () => {
    const wrapper = await mountSidebar()
    expect(wrapper.find('[data-testid="sidebar-logout"]').exists()).toBe(true)
  })
})
