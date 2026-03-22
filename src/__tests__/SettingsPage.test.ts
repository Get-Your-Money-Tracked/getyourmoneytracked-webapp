import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SettingsPage from '@/pages/SettingsPage.vue'

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

// ── Auth store mock ───────────────────────────────────────────
const _mockDisplayName = ref('Alex Johnson')
const _mockEmail = ref('alex@example.com')
const _mockInitials = ref('AJ')
const _mockCurrency = ref('USD')
const _mockLogout = vi.fn()

vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      get displayName() { return _mockDisplayName.value },
      get email() { return _mockEmail.value },
      get initials() { return _mockInitials.value },
      get defaultCurrency() { return _mockCurrency.value },
      logout: _mockLogout,
    }),
}))

// ── Theme store mock ──────────────────────────────────────────
const _mockIsDark = ref(false)
const _mockToggle = vi.fn()

vi.mock('@/stores/theme', () => ({
  useThemeStore: () =>
    reactive({
      get isDark() { return _mockIsDark.value },
      toggle: _mockToggle,
    }),
}))

// ── Router ────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/settings', component: SettingsPage },
    { path: '/categories', component: { template: '<div>Categories</div>' } },
    { path: '/subscriptions', component: { template: '<div>Subscriptions</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
  ],
})

function mountPage() {
  return mount(SettingsPage, {
    global: { plugins: [createPinia(), router] },
    attachTo: document.body,
  })
}

describe('SettingsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _mockDisplayName.value = 'Alex Johnson'
    _mockEmail.value = 'alex@example.com'
    _mockInitials.value = 'AJ'
    _mockCurrency.value = 'USD'
    _mockIsDark.value = false
    _mockLogout.mockResolvedValue(undefined)
    document.body.innerHTML = ''
  })

  // ── Profile card ──────────────────────────────────────────────
  it('renders the user profile card', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="user-profile-card"]').exists()).toBe(true)
  })

  it('displays user display name', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="user-display-name"]').text()).toContain('Alex Johnson')
  })

  it('displays user email', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="user-email"]').text()).toContain('alex@example.com')
  })

  it('displays user initials in avatar', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="user-initials"]').text().trim()).toBe('AJ')
  })

  it('displays default currency badge', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="user-currency"]').text()).toContain('USD')
  })

  it('displays different currency when set', () => {
    _mockCurrency.value = 'EUR'
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="user-currency"]').text()).toContain('EUR')
  })

  // ── Menu items ────────────────────────────────────────────────
  it('renders Manage Categories button', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="manage-categories-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="manage-categories-btn"]').text()).toContain('Manage Categories')
  })

  it('renders Manage Subscriptions button', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="manage-subscriptions-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="manage-subscriptions-btn"]').text()).toContain('Manage Subscriptions')
  })

  it('renders Dark Mode toggle', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="dark-mode-toggle"]').exists()).toBe(true)
  })

  it('renders Log Out button', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="logout-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="logout-btn"]').text()).toContain('Log Out')
  })

  it('renders page title "Settings"', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Settings')
  })

  it('renders app footer', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="app-footer"]').text()).toContain('GetYourMoneyTracked')
    expect(wrapper.find('[data-testid="app-footer"]').text()).toContain('Version 1.0.0')
  })

  // ── Dark mode toggle (Story 10.2) ─────────────────────────────
  it('dark mode toggle has aria-checked=false in light mode', () => {
    _mockIsDark.value = false
    const wrapper = mountPage()
    const toggle = wrapper.find('[data-testid="dark-mode-toggle"]')
    expect(toggle.attributes('aria-checked')).toBe('false')
  })

  it('dark mode toggle has aria-checked=true in dark mode', () => {
    _mockIsDark.value = true
    const wrapper = mountPage()
    const toggle = wrapper.find('[data-testid="dark-mode-toggle"]')
    expect(toggle.attributes('aria-checked')).toBe('true')
  })

  it('shows Moon icon in light mode', () => {
    _mockIsDark.value = false
    const wrapper = mountPage()
    // Moon icon has data-testid="theme-icon" and should be present
    expect(wrapper.find('[data-testid="theme-icon"]').exists()).toBe(true)
  })

  it('calls themeStore.toggle() when dark mode toggle is clicked', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="dark-mode-toggle"]').trigger('click')
    expect(_mockToggle).toHaveBeenCalledOnce()
  })

  // ── Logout flow (Story 10.1 AC4, AC5) ────────────────────────
  it('does NOT show logout dialog initially', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="logout-confirm-dialog"]').exists()).toBe(false)
  })

  it('shows logout confirmation dialog when Log Out is clicked', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="logout-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="logout-confirm-dialog"]').exists()).toBe(true)
  })

  it('dialog text confirms logout action', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="logout-btn"]').trigger('click')
    await flushPromises()
    const dialog = wrapper.find('[data-testid="logout-confirm-dialog"]')
    expect(dialog.text()).toContain('Log out?')
    expect(dialog.text()).toContain('log out')
  })

  it('hides dialog and does NOT call logout when Cancel is clicked', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="logout-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="logout-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(_mockLogout).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="logout-confirm-dialog"]').exists()).toBe(false)
  })

  it('calls authStore.logout() when Log Out is confirmed', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="logout-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="logout-confirm-btn"]').trigger('click')
    await flushPromises()
    expect(_mockLogout).toHaveBeenCalledOnce()
  })

  it('renders cancel and confirm buttons in dialog', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="logout-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="logout-cancel-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="logout-confirm-btn"]').exists()).toBe(true)
  })
})
