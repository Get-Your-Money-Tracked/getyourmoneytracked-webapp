import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import LoginPage from '@/pages/LoginPage.vue'

// ── Minimal router ────────────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
  ],
})

// ── Mock auth store ───────────────────────────────────────────────────────────
const mockLogin = vi.fn()
const mockSignup = vi.fn()
const mockSendPasswordReset = vi.fn()
const mockClearError = vi.fn()

import { ref } from 'vue'
const mockError = ref<string | null>(null)
const mockIsLoading = ref(false)

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isLoading: mockIsLoading.value,
    isSubmitting: mockIsLoading.value,
    error: mockError.value,
    isAuthenticated: false,
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

function mountLoginPage() {
  return mount(LoginPage, {
    global: {
      plugins: [createPinia(), router],
    },
  })
}

describe('LoginPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockError.value = null
    mockIsLoading.value = false
  })

  it('renders email and password inputs in login mode', () => {
    const wrapper = mountLoginPage()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('renders Log In button in login mode', () => {
    const wrapper = mountLoginPage()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Log In')
  })

  it('submit button is disabled while loading', async () => {
    mockIsLoading.value = true
    const wrapper = mountLoginPage()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('displays inline error message when auth fails', async () => {
    mockError.value = 'Incorrect email or password.'
    const wrapper = mountLoginPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Incorrect email or password.')
  })

  it('shows email validation error when invalid email is submitted', async () => {
    const wrapper = mountLoginPage()
    await wrapper.find('input[type="email"]').setValue('not-an-email')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Enter a valid email address.')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('switches to signup view when Sign Up is clicked', async () => {
    const wrapper = mountLoginPage()
    const signUpBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign Up')
    await signUpBtn?.trigger('click')
    expect(wrapper.text()).toContain('Create Account')
  })

  it('switches to forgot password view when Forgot Password is clicked', async () => {
    const wrapper = mountLoginPage()
    const forgotBtn = wrapper.findAll('button').find((b) => b.text().includes('Forgot Password'))
    await forgotBtn?.trigger('click')
    expect(wrapper.text()).toContain('Reset Password')
  })

  it('does not submit login when fields are empty', async () => {
    const wrapper = mountLoginPage()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockLogin).not.toHaveBeenCalled()
  })
})
