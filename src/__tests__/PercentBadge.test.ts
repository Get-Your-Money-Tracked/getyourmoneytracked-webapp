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

  // ── Green / ON_TRACK (0–50%) ────────────────────────────────────────────────
  // Backend thresholds: 0–50% ON_TRACK, 51–85% WARNING, 86%+ EXCEEDED

  it('applies green classes for 0%', () => {
    const wrapper = mountBadge(0)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-primary')
    expect(badge.classes()).not.toContain('text-warning')
    expect(badge.classes()).not.toContain('text-danger')
  })

  it('applies green classes for 50%', () => {
    const wrapper = mountBadge(50)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-primary')
    expect(badge.classes()).not.toContain('text-warning')
  })

  // ── Yellow / WARNING (51–85%) ──────────────────────────────────────────────

  it('applies yellow/warning classes for 51%', () => {
    const wrapper = mountBadge(51)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-warning')
    expect(badge.classes()).not.toContain('text-primary')
    expect(badge.classes()).not.toContain('text-danger')
  })

  it('applies yellow/warning classes for 70%', () => {
    const wrapper = mountBadge(70)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-warning')
  })

  it('applies yellow/warning classes for 85%', () => {
    const wrapper = mountBadge(85)
    const badge = wrapper.find('[data-testid="percent-badge"]')
    expect(badge.classes()).toContain('text-warning')
  })

  // ── Red / EXCEEDED (86–100%) ───────────────────────────────────────────────

  it('applies danger classes for 86%', () => {
    const wrapper = mountBadge(86)
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
