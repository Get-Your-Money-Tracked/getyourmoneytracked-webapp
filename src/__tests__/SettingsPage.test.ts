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
const _mockUpdateProfile = vi.fn()
const _mockDeleteAccount = vi.fn()

vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({
      get displayName() { return _mockDisplayName.value },
      get email() { return _mockEmail.value },
      get initials() { return _mockInitials.value },
      get defaultCurrency() { return _mockCurrency.value },
      logout: _mockLogout,
      updateProfile: _mockUpdateProfile,
      deleteAccount: _mockDeleteAccount,
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

// ── Toast store mock ──────────────────────────────────────────
vi.mock('@/stores/toast', () => ({
  useToastStore: () => reactive({ show: vi.fn() }),
}))

// ── Router ────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/settings', component: SettingsPage },
    { path: '/categories', component: { template: '<div>Categories</div>' } },
    { path: '/subscriptions', component: { template: '<div>Subscriptions</div>' } },
    { path: '/accounts', component: { template: '<div>Accounts</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/tags', component: { template: '<div>Tags</div>' } },
    { path: '/privacy', component: { template: '<div>Privacy</div>' } },
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
    _mockUpdateProfile.mockResolvedValue(undefined)
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

  // ── Edit profile expansion ────────────────────────────────────
  it('does NOT show edit profile form initially', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="edit-profile-form"]').exists()).toBe(false)
  })

  it('shows edit profile form when profile card is clicked', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="user-profile-card"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="edit-profile-form"]').exists()).toBe(true)
  })

  it('edit profile form shows display name input', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="user-profile-card"]').trigger('click')
    await flushPromises()
    const input = wrapper.find('[data-testid="display-name-input"]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('Alex Johnson')
  })

  it('edit profile form shows currency selector with available currencies', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="user-profile-card"]').trigger('click')
    await flushPromises()
    const select = wrapper.find('[data-testid="currency-select"]')
    expect(select.exists()).toBe(true)
    const options = select.findAll('option')
    expect(options.length).toBeGreaterThanOrEqual(10)
    const optionTexts = options.map((o) => o.text())
    expect(optionTexts.some((t) => t.includes('USD'))).toBe(true)
    expect(optionTexts.some((t) => t.includes('EUR'))).toBe(true)
    expect(optionTexts.some((t) => t.includes('GBP'))).toBe(true)
    expect(optionTexts.some((t) => t.includes('BRL'))).toBe(true)
  })

  it('shows validation error when name is too short', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="user-profile-card"]').trigger('click')
    await flushPromises()
    const input = wrapper.find('[data-testid="display-name-input"]')
    await input.setValue('A')
    await wrapper.find('[data-testid="edit-profile-save-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="name-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="name-error"]').text()).toContain('2 characters')
    expect(_mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('calls updateProfile with valid name and currency on save', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="user-profile-card"]').trigger('click')
    await flushPromises()
    const input = wrapper.find('[data-testid="display-name-input"]')
    await input.setValue('Jane Doe')
    const select = wrapper.find('[data-testid="currency-select"]')
    await select.setValue('EUR')
    await wrapper.find('[data-testid="edit-profile-save-btn"]').trigger('click')
    await flushPromises()
    expect(_mockUpdateProfile).toHaveBeenCalledWith('Jane Doe', 'EUR')
  })

  it('closes edit profile form on cancel', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="user-profile-card"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="edit-profile-form"]').exists()).toBe(true)
    await wrapper.find('[data-testid="edit-profile-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="edit-profile-form"]').exists()).toBe(false)
  })

  // ── Menu items ────────────────────────────────────────────────
  it('renders Manage Categories button', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="manage-categories-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="manage-categories-btn"]').text()).toContain('Manage Categories')
  })

  it('renders Manage Accounts button', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="manage-accounts-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="manage-accounts-btn"]').text()).toContain('Manage Accounts')
  })

  it('renders Manage Subscriptions button', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="manage-subscriptions-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="manage-subscriptions-btn"]').text()).toContain('Manage Subscriptions')
  })

  it('renders Manage Tags button', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="manage-tags-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="manage-tags-btn"]').text()).toContain('Manage Tags')
  })

  it('navigates to /tags when Manage Tags is clicked', async () => {
    await router.push('/settings')
    await router.isReady()
    const wrapper = mount(SettingsPage, {
      global: { plugins: [createPinia(), router] },
      attachTo: document.body,
    })
    await wrapper.find('[data-testid="manage-tags-btn"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/tags')
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

  it('renders app footer with bug report link', () => {
    const wrapper = mountPage()
    const footer = wrapper.find('[data-testid="app-footer"]')
    expect(footer.text()).toContain('GetYourMoneyTracked')
    expect(footer.text()).toContain('Version 1.0.0')
    expect(footer.find('[data-testid="report-bug-link"]').exists()).toBe(true)
    expect(footer.find('[data-testid="report-bug-link"]').text()).toContain('Report a bug')
  })

  // ── Dark mode toggle ──────────────────────────────────────────
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
    expect(wrapper.find('[data-testid="theme-icon"]').exists()).toBe(true)
  })

  it('calls themeStore.toggle() when dark mode toggle is clicked', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="dark-mode-toggle"]').trigger('click')
    expect(_mockToggle).toHaveBeenCalledOnce()
  })

  // ── Logout flow ───────────────────────────────────────────────
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

  // ── Delete account flow ─────────────────────────────────────
  it('renders Danger Zone section with Delete Account button', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Danger Zone')
    expect(wrapper.find('[data-testid="delete-account-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="delete-account-btn"]').text()).toContain('Delete Account')
  })

  it('does NOT show delete dialog initially', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').exists()).toBe(false)
  })

  it('shows delete confirmation dialog when Delete Account is clicked', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="delete-account-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').text()).toContain('Delete Account')
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').text()).toContain('cannot be undone')
  })

  it('delete confirm button is disabled until "DELETE" is typed', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="delete-account-btn"]').trigger('click')
    await flushPromises()
    const confirmBtn = wrapper.find('[data-testid="delete-confirm-btn"]')
    expect((confirmBtn.element as HTMLButtonElement).disabled).toBe(true)

    // Type partial text — still disabled
    await wrapper.find('[data-testid="delete-confirm-input"]').setValue('DEL')
    expect((confirmBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('delete confirm button becomes enabled when "DELETE" is typed', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="delete-account-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-confirm-input"]').setValue('DELETE')
    const confirmBtn = wrapper.find('[data-testid="delete-confirm-btn"]')
    expect((confirmBtn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls authStore.deleteAccount() when delete is confirmed', async () => {
    _mockDeleteAccount.mockResolvedValue(undefined)
    const wrapper = mountPage()
    await wrapper.find('[data-testid="delete-account-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-confirm-input"]').setValue('DELETE')
    await wrapper.find('[data-testid="delete-confirm-btn"]').trigger('click')
    await flushPromises()
    expect(_mockDeleteAccount).toHaveBeenCalledOnce()
  })

  it('hides delete dialog when Cancel is clicked', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-testid="delete-account-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').exists()).toBe(true)
    await wrapper.find('[data-testid="delete-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="delete-confirm-dialog"]').exists()).toBe(false)
    expect(_mockDeleteAccount).not.toHaveBeenCalled()
  })

  it('clears confirm input when delete dialog is reopened', async () => {
    const wrapper = mountPage()
    // Open, type, cancel
    await wrapper.find('[data-testid="delete-account-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="delete-confirm-input"]').setValue('DELETE')
    await wrapper.find('[data-testid="delete-cancel-btn"]').trigger('click')
    await flushPromises()
    // Reopen
    await wrapper.find('[data-testid="delete-account-btn"]').trigger('click')
    await flushPromises()
    const input = wrapper.find('[data-testid="delete-confirm-input"]')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  // ── Privacy policy link ─────────────────────────────────────
  it('renders Privacy Policy link in footer', () => {
    const wrapper = mountPage()
    const link = wrapper.find('[data-testid="privacy-policy-link"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Privacy Policy')
  })

  it('navigates to /privacy when Privacy Policy link is clicked', async () => {
    await router.push('/settings')
    await router.isReady()
    const wrapper = mount(SettingsPage, {
      global: { plugins: [createPinia(), router] },
      attachTo: document.body,
    })
    await wrapper.find('[data-testid="privacy-policy-link"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/privacy')
  })
})
