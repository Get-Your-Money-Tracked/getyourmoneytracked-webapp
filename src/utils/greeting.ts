/**
 * Returns a time-of-day greeting string based on the current hour.
 *
 * - "Good morning"   → 05:00–11:59
 * - "Good afternoon" → 12:00–17:59
 * - "Good evening"   → 18:00–04:59
 */
export function getGreeting(hour?: number): string {
  const h = hour ?? new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  return 'Good evening'
}
