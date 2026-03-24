<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import type { SubscriptionEntry } from '@/types'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  subscription: SubscriptionEntry
  currency: string
}>()

const emit = defineEmits<{
  edit: [subscription: SubscriptionEntry]
}>()

// ── Frequency label ───────────────────────────────────────────
const frequencyLabel = computed(() => {
  switch (props.subscription.frequency) {
    case 'DAILY': return '/day'
    case 'WEEKLY': return '/wk'
    case 'MONTHLY': return '/mo'
    case 'YEARLY': return '/yr'
    default: return '/mo'
  }
})

const frequencyFullLabel = computed(() => {
  switch (props.subscription.frequency) {
    case 'DAILY': return 'Daily'
    case 'WEEKLY': return 'Weekly'
    case 'MONTHLY': return 'Monthly'
    case 'YEARLY': return 'Yearly'
    default: return 'Monthly'
  }
})

// ── Due date display ──────────────────────────────────────────
const dueDateDisplay = computed(() => {
  if (!props.subscription.isActive) return 'Paused'
  if (!props.subscription.nextDueDate) return null

  const due = new Date(props.subscription.nextDueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  if (due.getTime() === today.getTime()) return 'Due today!'

  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})

const isDueToday = computed(() => dueDateDisplay.value === 'Due today!')
const isPaused = computed(() => !props.subscription.isActive)

// ── Amount display ────────────────────────────────────────────
const formattedAmount = computed(() =>
  formatCurrency(props.subscription.amount, props.currency),
)

const isIncome = computed(() => props.subscription.type === 'INCOME')
const amountColorClass = computed(() => isIncome.value ? 'text-primary' : 'text-danger')
const amountPrefix = computed(() => isIncome.value ? '+' : '-')

// ── Category color ────────────────────────────────────────────
const categoryColor = computed(() => props.subscription.category?.color ?? '#10b981')
</script>

<template>
  <div
    class="flex cursor-pointer items-center gap-3 px-4 py-3 transition-all duration-150 hover:bg-surface-elevated active:scale-[0.98]"
    :data-testid="`subscription-item-${subscription.id}`"
    role="button"
    tabindex="0"
    @click="emit('edit', subscription)"
    @keydown.enter="emit('edit', subscription)"
  >
    <!-- Category icon -->
    <div
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
      :style="{ backgroundColor: `${categoryColor}1a` }"
      aria-hidden="true"
    >
      {{ subscription.category?.icon ?? '📋' }}
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <!-- Row 1: Name + Amount -->
      <div class="flex items-center justify-between">
        <span class="text-card-title truncate font-medium text-text-primary">
          {{ subscription.name }}
        </span>
        <span class="ml-2 shrink-0 text-body font-medium tabular-nums" :class="amountColorClass">
          {{ amountPrefix }}{{ formattedAmount }}<span class="text-caption text-text-muted">{{ frequencyLabel }}</span>
        </span>
      </div>

      <!-- Row 2: Category + Due date + Status -->
      <div class="mt-0.5 flex items-center justify-between">
        <span class="text-caption text-text-secondary">
          {{ subscription.category?.name ?? '—' }} · {{ frequencyFullLabel }}
        </span>

        <div class="ml-2 flex shrink-0 items-center gap-2">
          <!-- Due date -->
          <span
            v-if="dueDateDisplay"
            class="text-caption"
            :class="isDueToday ? 'font-medium text-warning' : isPaused ? 'italic text-text-muted' : 'text-text-muted'"
            :data-testid="`due-date-${subscription.id}`"
          >
            <span v-if="isDueToday" class="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-warning align-middle" aria-hidden="true" />
            {{ isDueToday ? 'Due today!' : isPaused ? 'Paused' : `Due ${dueDateDisplay}` }}
          </span>

          <!-- Status badge -->
          <div class="flex items-center gap-1" :data-testid="`status-badge-${subscription.id}`">
            <div
              class="h-1.5 w-1.5 rounded-full"
              :class="subscription.isActive ? 'bg-primary' : 'border border-text-muted'"
              aria-hidden="true"
            />
            <span
              class="text-caption"
              :class="subscription.isActive ? 'text-primary' : 'text-text-muted'"
            >
              {{ subscription.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chevron -->
    <ChevronRight :size="16" class="shrink-0 text-text-muted" aria-hidden="true" />
  </div>
</template>
