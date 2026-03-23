import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Wallet } from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'

describe('EmptyState', () => {
  it('renders the icon', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: Wallet,
        title: 'No accounts',
        description: 'Add an account to get started.',
      },
    })
    expect(wrapper.find('[data-testid="empty-state-icon"]').exists()).toBe(true)
  })

  it('renders the title', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: Wallet,
        title: 'No accounts',
        description: 'Add an account to get started.',
      },
    })
    expect(wrapper.find('[data-testid="empty-state-title"]').text()).toBe('No accounts')
  })

  it('renders the description', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: Wallet,
        title: 'No accounts',
        description: 'Add an account to get started.',
      },
    })
    expect(wrapper.find('[data-testid="empty-state-description"]').text()).toBe(
      'Add an account to get started.',
    )
  })

  it('renders action button when actionLabel is provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: Wallet,
        title: 'No accounts',
        description: 'Add an account to get started.',
        actionLabel: 'Add Account',
      },
    })
    expect(wrapper.find('[data-testid="empty-state-action"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="empty-state-action"]').text()).toBe('Add Account')
  })

  it('does NOT render action button when actionLabel is omitted', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: Wallet,
        title: 'No accounts',
        description: 'Add an account to get started.',
      },
    })
    expect(wrapper.find('[data-testid="empty-state-action"]').exists()).toBe(false)
  })

  it('emits action event when action button is clicked', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: Wallet,
        title: 'No accounts',
        description: 'Add an account to get started.',
        actionLabel: 'Add Account',
      },
    })
    await wrapper.find('[data-testid="empty-state-action"]').trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
  })

  it('renders secondary link when secondaryLabel is provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: Wallet,
        title: 'No accounts',
        description: 'Add an account.',
        secondaryLabel: 'Learn more',
      },
    })
    expect(wrapper.find('[data-testid="empty-state-secondary"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="empty-state-secondary"]').text()).toBe('Learn more')
  })

  it('does NOT render secondary link when secondaryLabel is omitted', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: Wallet,
        title: 'No accounts',
        description: 'Add an account.',
      },
    })
    expect(wrapper.find('[data-testid="empty-state-secondary"]').exists()).toBe(false)
  })

  it('emits secondary event when secondary link is clicked', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: Wallet,
        title: 'No accounts',
        description: 'Add an account.',
        secondaryLabel: 'Learn more',
      },
    })
    await wrapper.find('[data-testid="empty-state-secondary"]').trigger('click')
    expect(wrapper.emitted('secondary')).toBeTruthy()
  })
})
