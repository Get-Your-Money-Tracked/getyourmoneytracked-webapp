import { computed, ref } from 'vue'
import type { SubscriptionEntry } from '@/types'
import { callCreateTransaction } from '@/graphql/queries/transactions'
import { callUpdateSubscription } from '@/graphql/queries/subscriptions'

// ── Session dismiss ────────────────────────────────────────────────────────────

const SESSION_KEY = 'overdue_recurring_dismissed'

function isSessionDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

function setSessionDismissed(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true')
  } catch {
    // ignore
  }
}

// ── Next due date computation ──────────────────────────────────────────────────

/**
 * Given the current overdue due date, frequency, and optional dayOfMonth,
 * compute the next occurrence date (as "YYYY-MM-DD") that is on or after today.
 *
 * Mirrors the backend CalcNextDueDate logic from internal/domain/subscription.go.
 */
export function getNextDueDate(
  currentDueDate: string,
  frequency: SubscriptionEntry['frequency'],
  dayOfMonth: number | null,
): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (frequency) {
    case 'DAILY': {
      // next = today + 1
      const d = new Date(today)
      d.setDate(d.getDate() + 1)
      return toDateString(d)
    }

    case 'WEEKLY': {
      // next = today + 7
      const d = new Date(today)
      d.setDate(d.getDate() + 7)
      return toDateString(d)
    }

    case 'MONTHLY': {
      const dom = dayOfMonth ?? 1
      return toDateString(calcNextMonthly(dom, today))
    }

    case 'YEARLY': {
      // Use current due date's month+day as the anchor (mirrors startDate in Go)
      const anchor = parseDateUTC(currentDueDate)
      return toDateString(calcNextYearly(anchor, today))
    }

    default:
      // Fallback
      return toDateString(calcNextMonthly(dayOfMonth ?? 1, today))
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a "YYYY-MM-DD" string as UTC midnight. */
function parseDateUTC(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Last valid day in the given year/month (0-indexed month). */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function clampDay(year: number, month: number, day: number): Date {
  const clamped = Math.min(day, lastDayOfMonth(year, month))
  return new Date(year, month, clamped)
}

function calcNextMonthly(dayOfMonth: number, today: Date): Date {
  const candidate = clampDay(today.getFullYear(), today.getMonth(), dayOfMonth)
  if (candidate <= today) {
    let y = today.getFullYear()
    let m = today.getMonth() + 1
    if (m > 11) {
      m = 0
      y++
    }
    return clampDay(y, m, dayOfMonth)
  }
  return candidate
}

function calcNextYearly(anchor: Date, today: Date): Date {
  const month = anchor.getUTCMonth()
  const day = anchor.getUTCDate()
  const candidate = clampDay(today.getFullYear(), month, day)
  if (candidate <= today) {
    return clampDay(today.getFullYear() + 1, month, day)
  }
  return candidate
}

// ── Composable ─────────────────────────────────────────────────────────────────

export interface OverdueItem {
  subscription: SubscriptionEntry
  daysOverdue: number
}

export function useOverdueRecurring(subscriptions: () => SubscriptionEntry[]) {
  const dismissed = ref(isSessionDismissed())

  /** Overdue items: active, autoLog=true, nextDueDate < today */
  const overdueItems = computed<OverdueItem[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return subscriptions()
      .filter((s) => {
        if (!s.isActive) return false
        if (!s.autoLog) return false
        if (!s.nextDueDate) return false
        const due = new Date(s.nextDueDate)
        due.setHours(0, 0, 0, 0)
        return due <= today
      })
      .map((s) => {
        const due = new Date(s.nextDueDate!)
        due.setHours(0, 0, 0, 0)
        const diffMs = today.getTime() - due.getTime()
        const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        return { subscription: s, daysOverdue }
      })
  })

  const isVisible = computed(() => !dismissed.value && overdueItems.value.length > 0)

  function dismiss() {
    dismissed.value = true
    setSessionDismissed()
  }

  /**
   * Log the given overdue items as transactions and advance their nextDueDate.
   * Returns early if the array is empty.
   */
  async function logItems(items: OverdueItem[]): Promise<void> {
    if (items.length === 0) return

    await Promise.all(
      items.map(async ({ subscription }) => {
        if (!subscription.nextDueDate) {
          throw new Error(`Subscription "${subscription.name}" has no next due date and cannot be logged.`)
        }

        // 1. Create transaction
        await callCreateTransaction({
          type: subscription.type as 'EXPENSE' | 'INCOME',
          amount: subscription.amount,
          date: subscription.nextDueDate,
          accountId: subscription.account.id,
          categoryId: subscription.category?.id ?? null,
          description: subscription.name,
        })

        // 2. Advance nextDueDate
        const nextDate = getNextDueDate(
          subscription.nextDueDate,
          subscription.frequency,
          subscription.dayOfMonth,
        )

        // 3. Check if pending amount should be applied
        const updatePayload: Record<string, unknown> = { nextDueDate: nextDate }
        if (
          subscription.pendingAmount != null &&
          subscription.pendingEffectiveDate != null
        ) {
          const effectiveDate = new Date(subscription.pendingEffectiveDate)
          effectiveDate.setHours(0, 0, 0, 0)
          const nextDueObj = new Date(nextDate)
          nextDueObj.setHours(0, 0, 0, 0)
          if (nextDueObj >= effectiveDate) {
            // Swap pending amount into the main amount and clear pending fields
            updatePayload.amount = subscription.pendingAmount
            updatePayload.clearPendingAmount = true
          }
        }

        await callUpdateSubscription(subscription.id, updatePayload as any)
      }),
    )
  }

  return {
    overdueItems,
    isVisible,
    dismiss,
    logItems,
  }
}
