import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PercentBadge from '@/components/common/PercentBadge.vue'

function mountBadge(percent: number) {
  return mount(PercentBadge, { props: { percent } })
}

describe('PercentBadge', () => {
  it('renders the percentage value', () => {
    const wrapper = mountBadge(40)
    expect(wrapper.find('[data-testid="percent-badge"]').text()).toBe('40%')
  })

  it('rounds the percentage', () => {
    const wrapper = mountBadge(40.6)
    expect(wrapper.find('[data-testid="percent-badge"]').text()).toBe('41%')
  })

  // ── Green (0–70%) ──────────────────────────────────────────────────────────

  it('applies green classes for 0%', () => {
    const wrapper = mountBadge(0)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-primary')
    expect(badge.classes()).not.toContain('text-warning')
    expect(badge.classes()).not.toContain('text-danger')
  })

  it('applies green classes for 70%', () => {
    const wrapper = mountBadge(70)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-primary')
    expect(badge.classes()).not.toContain('text-warning')
  })

  // ── Yellow (71–90%) ───────────────────────────────────────────────────────

  it('applies yellow/warning classes for 71%', () => {
    const wrapper = mountBadge(71)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-warning')
    expect(badge.classes()).not.toContain('text-primary')
    expect(badge.classes()).not.toContain('text-danger')
  })

  it('applies yellow/warning classes for 89%', () => {
    const wrapper = mountBadge(89)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-warning')
  })

  it('applies yellow/warning classes for 90%', () => {
    const wrapper = mountBadge(90)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-warning')
  })

  // ── Red (91–100%) ─────────────────────────────────────────────────────────

  it('applies danger classes for 91%', () => {
    const wrapper = mountBadge(91)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-danger')
    expect(badge.classes()).not.toContain('text-warning')
    expect(badge.classes()).not.toContain('animate-pulse')
  })

  it('applies danger classes for 100%', () => {
    const wrapper = mountBadge(100)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-danger')
    expect(badge.classes()).not.toContain('animate-pulse')
  })

  // ── Dark red / pulsing (>100%) ────────────────────────────────────────────

  it('applies solid danger + animate-pulse for 101%', () => {
    const wrapper = mountBadge(101)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('bg-danger')
    expect(badge.classes()).toContain('text-white')
    expect(badge.classes()).toContain('animate-pulse')
  })

  it('applies solid danger + animate-pulse for 200%', () => {
    const wrapper = mountBadge(200)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('animate-pulse')
    expect(badge.classes()).toContain('text-white')
  })
})
