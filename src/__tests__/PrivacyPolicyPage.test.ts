import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage.vue'

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/privacy', component: PrivacyPolicyPage },
    { path: '/settings', component: { template: '<div>Settings</div>' } },
  ],
})

function mountPage() {
  return mount(PrivacyPolicyPage, {
    global: { plugins: [createPinia(), router] },
    attachTo: document.body,
  })
}

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the page title', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Privacy Policy')
  })

  it('renders the back button', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="back-btn"]').exists()).toBe(true)
  })

  it('renders "Your data, your control" heading', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Your data, your control')
  })

  it('renders all privacy sections', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('What we collect')
    expect(wrapper.text()).toContain("What we don't collect")
    expect(wrapper.text()).toContain('How your data is stored')
    expect(wrapper.text()).toContain('Who can access your data')
    expect(wrapper.text()).toContain('Delete your data')
    expect(wrapper.text()).toContain('Third-party services')
    expect(wrapper.text()).toContain('Questions?')
  })

  it('mentions no bank credentials are collected', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('No bank credentials or account numbers')
  })

  it('mentions no data sold to third parties', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('No data sold to third parties')
  })

  it('mentions Firebase Auth for authentication', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Firebase Auth')
  })

  it('contains a link to Settings for data deletion', () => {
    const wrapper = mountPage()
    const section = wrapper.text()
    expect(section).toContain('Settings')
    expect(section).toContain('permanently delete')
  })

  it('navigates to /settings when Settings link is clicked', async () => {
    await router.push('/privacy')
    await router.isReady()
    const wrapper = mount(PrivacyPolicyPage, {
      global: { plugins: [createPinia(), router] },
      attachTo: document.body,
    })
    // Find the settings button within the delete section
    const buttons = wrapper.findAll('button')
    const settingsBtn = buttons.find((b) => b.text() === 'Settings')
    expect(settingsBtn).toBeDefined()
    await settingsBtn!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/settings')
  })
})
