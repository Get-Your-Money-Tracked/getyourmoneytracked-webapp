<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, Lightbulb } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'
import MonthlyProgressBar from '@/components/dashboard/MonthlyProgressBar.vue'

const CALLOUT_KEY = 'callout_dismissed'

const props = defineProps<{
  totalIncome: number
  totalExpenses: number
  remainingBudget: number
  percentSpent: number
  currency: string
  isLoading: boolean
}>()

const calloutDismissed = ref(
  typeof localStorage !== 'undefined' && localStorage.getItem(CALLOUT_KEY) === 'true',
)

function dismissCallout() {
  calloutDismissed.value = true
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CALLOUT_KEY, 'true')
  }
}

const isFirstTime = computed(
  () => props.totalIncome === 0 && props.totalExpenses === 0,
)

const showCallout = computed(() => isFirstTime.value && !calloutDismissed.value)

const amountColorClass = computed(() => {
  if (props.remainingBudget > 0) return 'text-primary'
  if (props.remainingBudget < 0) return 'text-danger'
  return 'text-text-muted'
})

const formattedRemaining = computed(() => {
  const abs = Math.abs(props.remainingBudget)
  const formatted = formatCurrency(abs, props.currency)
  return props.remainingBudget < 0 ? `-${formatted}` : formatted
})

const formattedIncome = computed(() => formatCurrency(props.totalIncome, props.currency))
const formattedExpenses = computed(() => formatCurrency(props.totalExpenses, props.currency))

const noIncome = computed(() => props.totalIncome === 0)
</script>

<template>
  <div>
    <!-- Hero Card -->
    <div
      class="mx-4 rounded-2xl bg-surface p-6 text-center shadow-card"
      data-testid="hero-section"
    >
      <!-- Loading skeleton -->
      <template v-if="isLoading">
        <div class="mx-auto mb-2 h-3 w-24 animate-pulse rounded bg-surface-muted" />
        <div class="mx-auto mb-3 h-8 w-40 animate-pulse rounded bg-surface-muted" />
        <div class="mx-auto h-3 w-48 animate-pulse rounded bg-surface-muted" />
      </template>

      <!-- Loaded content -->
      <template v-else>
        <!-- Label -->
        <p class="text-caption font-medium uppercase tracking-wider text-text-muted">
          Safe to Spend
        </p>

        <!-- Hero amount -->
        <p
          class="mt-1 text-hero-amount font-bold tabular-nums"
          :class="amountColorClass"
          data-testid="hero-amount"
        >
          {{ formattedRemaining }}
        </p>

        <!-- Sub-text: In · Out -->
        <p class="mt-2 text-caption text-text-secondary" data-testid="hero-subtext">
          <span class="text-primary font-medium">In:</span>
          <span class="ml-1">{{ formattedIncome }}</span>
          <span class="mx-2 text-border">·</span>
          <span class="text-danger font-medium">Out:</span>
          <span class="ml-1">{{ formattedExpenses }}</span>
        </p>

        <!-- Monthly progress bar -->
        <MonthlyProgressBar :percent-spent="percentSpent" :no-income="noIncome" />
      </template>
    </div>

    <!-- First-time callout -->
    <div
      v-if="showCallout"
      class="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"
      data-testid="first-time-callout"
    >
      <Lightbulb class="mt-0.5 shrink-0 text-primary" :size="16" />
      <p class="text-caption flex-1 text-text-secondary">Tap + to log your first transaction.</p>
      <button
        type="button"
        class="shrink-0 text-text-muted transition-colors hover:text-text-primary"
        aria-label="Dismiss"
        data-testid="callout-dismiss"
        @click="dismissCallout"
      >
        <X :size="14" />
      </button>
    </div>
  </div>
</template>
