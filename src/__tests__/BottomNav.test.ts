import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import BottomNav from '@/components/layout/BottomNav.vue'

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

function createTestRouter(initialRoute = '/dashboard') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/dashboard', component: { template: '<div />' } },
      { path: '/history', component: { template: '<div />' } },
      { path: '/history/:month', component: { template: '<div />' } },
      { path: '/budgets', component: { template: '<div />' } },
      { path: '/accounts', component: { template: '<div />' } },
      { path: '/settings', component: { template: '<div />' } },
    ],
  })
  router.push(initialRoute)
  return router
}

async function mountNav(initialRoute = '/dashboard') {
  const router = createTestRouter(initialRoute)
  await router.isReady()
  return mount(BottomNav, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
}

describe('BottomNav', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  // ── Rendering ────────────────────────────────────────────────
  it('renders the nav element', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('nav[aria-label="Main navigation"]').exists()).toBe(true)
  })

  it('renders Home tab', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('[data-testid="nav-home"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-home"]').text()).toContain('Home')
  })

  it('renders History tab', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('[data-testid="nav-history"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-history"]').text()).toContain('History')
  })

  it('renders Budgets tab', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('[data-testid="nav-budgets"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-budgets"]').text()).toContain('Budgets')
  })

  it('renders More button', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('[data-testid="nav-more"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-more"]').text()).toContain('More')
  })

  // ── Active tab highlighting ───────────────────────────────────
  it('highlights Home tab when on /dashboard', async () => {
    const wrapper = await mountNav('/dashboard')
    expect(wrapper.find('[data-testid="nav-home"]').attributes('aria-current')).toBe('page')
  })

  it('does not mark Home as active on /budgets', async () => {
    const wrapper = await mountNav('/budgets')
    expect(wrapper.find('[data-testid="nav-home"]').attributes('aria-current')).toBeUndefined()
  })

  it('highlights History tab when on /history', async () => {
    const wrapper = await mountNav('/history')
    expect(wrapper.find('[data-testid="nav-history"]').attributes('aria-current')).toBe('page')
  })

  it('highlights History tab when on /history/:month', async () => {
    const wrapper = await mountNav('/history/2026-03')
    expect(wrapper.find('[data-testid="nav-history"]').attributes('aria-current')).toBe('page')
  })

  it('highlights Budgets tab when on /budgets', async () => {
    const wrapper = await mountNav('/budgets')
    expect(wrapper.find('[data-testid="nav-budgets"]').attributes('aria-current')).toBe('page')
  })

  // ── RouterLink hrefs ──────────────────────────────────────────
  it('Home tab links to /dashboard', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('[data-testid="nav-home"]').attributes('href')).toBe('/dashboard')
  })

  it('History tab links to /history', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('[data-testid="nav-history"]').attributes('href')).toBe('/history')
  })

  it('Budgets tab links to /budgets', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('[data-testid="nav-budgets"]').attributes('href')).toBe('/budgets')
  })

  // ── "More" menu ───────────────────────────────────────────────
  it('More menu is hidden by default', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('[data-testid="more-menu"]').exists()).toBe(false)
  })

  it('More menu opens when More button is clicked', async () => {
    const wrapper = await mountNav()
    await wrapper.find('[data-testid="nav-more"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="more-menu"]').exists()).toBe(true)
  })

  it('More menu contains Accounts link', async () => {
    const wrapper = await mountNav()
    await wrapper.find('[data-testid="nav-more"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="more-accounts-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="more-accounts-btn"]').text()).toContain('Accounts')
  })

  it('More menu contains Settings link', async () => {
    const wrapper = await mountNav()
    await wrapper.find('[data-testid="nav-more"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="more-settings-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="more-settings-btn"]').text()).toContain('Settings')
  })

  it('More menu closes when More button clicked again (toggle)', async () => {
    const wrapper = await mountNav()
    await wrapper.find('[data-testid="nav-more"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="nav-more"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="more-menu"]').exists()).toBe(false)
  })

  it('More menu closes when backdrop is clicked', async () => {
    const wrapper = await mountNav()
    await wrapper.find('[data-testid="nav-more"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="more-menu-backdrop"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="more-menu"]').exists()).toBe(false)
  })

  it('More button has aria-expanded=true when menu is open', async () => {
    const wrapper = await mountNav()
    await wrapper.find('[data-testid="nav-more"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="nav-more"]').attributes('aria-expanded')).toBe('true')
  })

  it('More button has aria-expanded=false when menu is closed', async () => {
    const wrapper = await mountNav()
    expect(wrapper.find('[data-testid="nav-more"]').attributes('aria-expanded')).toBe('false')
  })
})
