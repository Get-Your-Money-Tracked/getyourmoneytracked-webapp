import { describe, it, expect } from 'vitest'
import { getGreeting } from '@/utils/greeting'

describe('getGreeting', () => {
  it('returns "Good morning" at hour 5 (boundary)', () => {
    expect(getGreeting(5)).toBe('Good morning')
  })

  it('returns "Good morning" at hour 8', () => {
    expect(getGreeting(8)).toBe('Good morning')
  })

  it('returns "Good morning" at hour 11 (boundary)', () => {
    expect(getGreeting(11)).toBe('Good morning')
  })

  it('returns "Good afternoon" at hour 12 (boundary)', () => {
    expect(getGreeting(12)).toBe('Good afternoon')
  })

  it('returns "Good afternoon" at hour 15', () => {
    expect(getGreeting(15)).toBe('Good afternoon')
  })

  it('returns "Good afternoon" at hour 17 (boundary)', () => {
    expect(getGreeting(17)).toBe('Good afternoon')
  })

  it('returns "Good evening" at hour 18 (boundary)', () => {
    expect(getGreeting(18)).toBe('Good evening')
  })

  it('returns "Good evening" at hour 22', () => {
    expect(getGreeting(22)).toBe('Good evening')
  })

  it('returns "Good evening" at hour 0 (midnight)', () => {
    expect(getGreeting(0)).toBe('Good evening')
  })

  it('returns "Good evening" at hour 4 (boundary before morning)', () => {
    expect(getGreeting(4)).toBe('Good evening')
  })

  it('uses current time when no argument is passed', () => {
    const hour = new Date().getHours()
    const expected =
      hour >= 5 && hour < 12
        ? 'Good morning'
        : hour >= 12 && hour < 18
          ? 'Good afternoon'
          : 'Good evening'
    expect(getGreeting()).toBe(expected)
  })
})
