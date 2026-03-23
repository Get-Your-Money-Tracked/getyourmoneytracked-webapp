import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'

// Mock the greeting utility so we can control the greeting text without
// manipulating Date (which is difficult to mock as a constructor in Vitest).
vi.mock('@/utils/greeting', () => ({
  getGreeting: vi.fn(() => 'Good morning'),
}))

import { getGreeting } from '@/utils/greeting'

const mockGetGreeting = vi.mocked(getGreeting)

describe('DashboardHeader', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  function mountHeader(month = '2026-03', displayName = 'Alex') {
    return mount(DashboardHeader, { props: { month, displayName, canGoForward: false } })
  }

  it('renders the greeting with display name', () => {
    mockGetGreeting.mockReturnValue('Good morning')
    const wrapper = mountHeader('2026-03', 'Alex')
    expect(wrapper.find('[data-testid="greeting"]').text()).toContain('Alex')
  })

  it('renders "Good morning" greeting', () => {
    mockGetGreeting.mockReturnValue('Good morning')
    const wrapper = mountHeader()
    expect(wrapper.find('[data-testid="greeting"]').text()).toContain('Good morning')
  })

  it('renders "Good afternoon" greeting', () => {
    mockGetGreeting.mockReturnValue('Good afternoon')
    const wrapper = mountHeader()
    expect(wrapper.find('[data-testid="greeting"]').text()).toContain('Good afternoon')
  })

  it('renders "Good evening" greeting', () => {
    mockGetGreeting.mockReturnValue('Good evening')
    const wrapper = mountHeader()
    expect(wrapper.find('[data-testid="greeting"]').text()).toContain('Good evening')
  })

  it('renders "March 2026" for month "2026-03"', () => {
    const wrapper = mountHeader('2026-03')
    expect(wrapper.find('[data-testid="month-label"]').text()).toContain('2026')
    expect(wrapper.find('[data-testid="month-label"]').text().toLowerCase()).toContain('march')
  })

  it('renders "January 2025" for month "2025-01"', () => {
    const wrapper = mountHeader('2025-01')
    expect(wrapper.find('[data-testid="month-label"]').text()).toContain('2025')
    expect(wrapper.find('[data-testid="month-label"]').text().toLowerCase()).toContain('jan')
  })

  it('renders "December 2024" for month "2024-12"', () => {
    const wrapper = mountHeader('2024-12')
    expect(wrapper.find('[data-testid="month-label"]').text()).toContain('2024')
    expect(wrapper.find('[data-testid="month-label"]').text().toLowerCase()).toContain('dec')
  })

  it('renders "there" as display name when no name is set', () => {
    const wrapper = mountHeader('2026-03', 'there')
    expect(wrapper.find('[data-testid="greeting"]').text()).toContain('there')
  })
})
