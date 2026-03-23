import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PageTip from '@/components/common/PageTip.vue'
import { SIGNUP_TIMESTAMP_KEY, PAGE_TIPS, TIP_VISIBLE_DAYS } from '@/utils/constants'

const DISMISS_KEY = 'tip_dismissed_dashboard'

function recentSignupTimestamp(): string {
  return new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
}

function oldSignupTimestamp(): string {
  // More than TIP_VISIBLE_DAYS ago
  return new Date(Date.now() - (TIP_VISIBLE_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString()
}

describe('PageTip', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('does not render when signup_timestamp is missing', () => {
    // No timestamp in localStorage => not a "new user"
    const wrapper = mount(PageTip, { props: { pageKey: 'dashboard' } })
    expect(wrapper.find('[data-testid="page-tip-dashboard"]').exists()).toBe(false)
  })

  it('renders for a recent signup', () => {
    localStorage.setItem(SIGNUP_TIMESTAMP_KEY, recentSignupTimestamp())
    const wrapper = mount(PageTip, { props: { pageKey: 'dashboard' } })
    expect(wrapper.find('[data-testid="page-tip-dashboard"]').exists()).toBe(true)
  })

  it('shows the correct message for the dashboard page', () => {
    localStorage.setItem(SIGNUP_TIMESTAMP_KEY, recentSignupTimestamp())
    const wrapper = mount(PageTip, { props: { pageKey: 'dashboard' } })
    expect(wrapper.text()).toContain(PAGE_TIPS['dashboard'])
  })

  it('shows the correct message for the budgets page', () => {
    localStorage.setItem(SIGNUP_TIMESTAMP_KEY, recentSignupTimestamp())
    const wrapper = mount(PageTip, { props: { pageKey: 'budgets' } })
    expect(wrapper.find('[data-testid="page-tip-budgets"]').exists()).toBe(true)
    expect(wrapper.text()).toContain(PAGE_TIPS['budgets'])
  })

  it('does not render if already dismissed', () => {
    localStorage.setItem(SIGNUP_TIMESTAMP_KEY, recentSignupTimestamp())
    localStorage.setItem(DISMISS_KEY, 'true')
    const wrapper = mount(PageTip, { props: { pageKey: 'dashboard' } })
    expect(wrapper.find('[data-testid="page-tip-dashboard"]').exists()).toBe(false)
  })

  it('does not render if user signed up more than 7 days ago', () => {
    localStorage.setItem(SIGNUP_TIMESTAMP_KEY, oldSignupTimestamp())
    const wrapper = mount(PageTip, { props: { pageKey: 'dashboard' } })
    expect(wrapper.find('[data-testid="page-tip-dashboard"]').exists()).toBe(false)
  })

  it('sets localStorage dismiss key and hides when dismiss button is clicked', async () => {
    localStorage.setItem(SIGNUP_TIMESTAMP_KEY, recentSignupTimestamp())
    const wrapper = mount(PageTip, { props: { pageKey: 'dashboard' } })
    expect(wrapper.find('[data-testid="page-tip-dashboard"]').exists()).toBe(true)

    await wrapper.find('[data-testid="page-tip-dismiss"]').trigger('click')

    // localStorage key should be set
    expect(localStorage.getItem(DISMISS_KEY)).toBe('true')
    // Banner should be hidden after dismiss
    expect(wrapper.find('[data-testid="page-tip-dashboard"]').exists()).toBe(false)
  })
})
