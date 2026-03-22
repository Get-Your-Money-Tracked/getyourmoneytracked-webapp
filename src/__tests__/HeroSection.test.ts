import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroSection from '@/components/dashboard/HeroSection.vue'

function mountHero(overrides: {
  totalIncome?: number
  totalExpenses?: number
  remainingBudget?: number
  percentSpent?: number
  currency?: string
  isLoading?: boolean
} = {}) {
  return mount(HeroSection, {
    props: {
      totalIncome: overrides.totalIncome ?? 3000,
      totalExpenses: overrides.totalExpenses ?? 1200,
      remainingBudget: overrides.remainingBudget ?? 1800,
      percentSpent: overrides.percentSpent ?? 40,
      currency: overrides.currency ?? 'USD',
      isLoading: overrides.isLoading ?? false,
    },
    attachTo: document.body,
  })
}

describe('HeroSection', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders without errors', () => {
    const wrapper = mountHero()
    expect(wrapper.exists()).toBe(true)
  })

  it('shows "Safe to Spend" label', () => {
    const wrapper = mountHero()
    expect(wrapper.text()).toContain('Safe to Spend')
  })

  it('renders the remaining budget amount', () => {
    const wrapper = mountHero({ remainingBudget: 1800, currency: 'USD' })
    expect(wrapper.find('[data-testid="hero-amount"]').text()).toContain('1,800')
  })

  it('applies text-primary class for positive amount', () => {
    const wrapper = mountHero({ remainingBudget: 1800 })
    const amount = wrapper.find('[data-testid="hero-amount"]')
    expect(amount.classes()).toContain('text-primary')
  })

  it('applies text-danger class for negative amount', () => {
    const wrapper = mountHero({ remainingBudget: -200 })
    const amount = wrapper.find('[data-testid="hero-amount"]')
    expect(amount.classes()).toContain('text-danger')
  })

  it('applies text-text-muted class for zero amount', () => {
    const wrapper = mountHero({ remainingBudget: 0 })
    const amount = wrapper.find('[data-testid="hero-amount"]')
    expect(amount.classes()).toContain('text-text-muted')
  })

  it('renders income and expense in subtext', () => {
    const wrapper = mountHero({ totalIncome: 3000, totalExpenses: 1200 })
    const subtext = wrapper.find('[data-testid="hero-subtext"]').text()
    expect(subtext).toContain('3,000')
    expect(subtext).toContain('1,200')
  })

  it('shows loading skeleton when isLoading is true', () => {
    const wrapper = mountHero({ isLoading: true })
    // Skeleton elements present (pulsing divs)
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    // Hero amount not rendered
    expect(wrapper.find('[data-testid="hero-amount"]').exists()).toBe(false)
  })

  it('shows first-time callout when income and expenses are both 0', async () => {
    localStorage.removeItem('callout_dismissed')
    const wrapper = mountHero({ totalIncome: 0, totalExpenses: 0, remainingBudget: 0 })
    expect(wrapper.find('[data-testid="first-time-callout"]').exists()).toBe(true)
  })

  it('hides first-time callout when there is income', () => {
    localStorage.removeItem('callout_dismissed')
    const wrapper = mountHero({ totalIncome: 1000, totalExpenses: 0, remainingBudget: 1000 })
    expect(wrapper.find('[data-testid="first-time-callout"]').exists()).toBe(false)
  })

  it('dismisses callout when X button is clicked', async () => {
    localStorage.removeItem('callout_dismissed')
    const wrapper = mountHero({ totalIncome: 0, totalExpenses: 0, remainingBudget: 0 })
    const dismissBtn = wrapper.find('[data-testid="callout-dismiss"]')
    expect(dismissBtn.exists()).toBe(true)
    await dismissBtn.trigger('click')
    expect(wrapper.find('[data-testid="first-time-callout"]').exists()).toBe(false)
    expect(localStorage.getItem('callout_dismissed')).toBe('true')
    localStorage.removeItem('callout_dismissed')
  })

  it('shows $0.00 as the remaining amount in first-time state', () => {
    localStorage.removeItem('callout_dismissed')
    const wrapper = mountHero({ totalIncome: 0, totalExpenses: 0, remainingBudget: 0 })
    expect(wrapper.find('[data-testid="hero-amount"]').text()).toContain('0.00')
  })
})
