<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import type { SubscriptionEntry } from '@/types'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  subscriptions: SubscriptionEntry[]
  currency: string
}>()

const router = useRouter()

function navigateToAll() {
  router.push('/subscriptions')
}

const hasSubscriptions = computed(() => props.subscriptions.length > 0)

function frequencyLabel(freq: string): string {
  switch (freq) {
    case 'DAILY': return '/day'
    case 'WEEKLY': return '/wk'
    case 'MONTHLY': return '/mo'
    case 'YEARLY': return '/yr'
    default: return '/mo'
  }
}

function isIncome(sub: SubscriptionEntry): boolean {
  return sub.type === 'INCOME'
}

function amountColorClass(sub: SubscriptionEntry): string {
  return isIncome(sub) ? 'text-primary' : 'text-danger'
}

function amountPrefix(sub: SubscriptionEntry): string {
  return isIncome(sub) ? '+' : '-'
}

function categoryColor(sub: SubscriptionEntry): string {
  return sub.category?.color ?? '#10b981'
}
</script>

<template>
  <!-- Hidden entirely when no subscriptions -->
  <section v-if="hasSubscriptions" class="mt-6" data-testid="recent-recurring">
    <!-- Section header -->
    <div class="mb-2 flex items-center justify-between px-4">
      <h2 class="text-card-title font-semibold text-text-primary">Recent Recurring</h2>
      <button
        type="button"
        class="text-caption flex items-center gap-0.5 font-medium text-primary"
        data-testid="see-all-recurring-link"
        @click="navigateToAll"
      >
        See all
        <ArrowRight :size="14" />
      </button>
    </div>

    <!-- Card -->
    <div class="mx-4 divide-y divide-border rounded-xl bg-surface shadow-card">
      <button
        v-for="sub in subscriptions"
        :key="sub.id"
        type="button"
        class="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-surface-muted active:scale-[0.98]"
        :data-testid="`recent-recurring-item-${sub.id}`"
        @click="navigateToAll"
      >
        <!-- Category icon -->
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
          :style="{ backgroundColor: `${categoryColor(sub)}1a` }"
        >
          {{ sub.category?.icon ?? '📋' }}
        </div>

        <!-- Name + category -->
        <div class="min-w-0 flex-1">
          <p class="text-card-title truncate font-medium text-text-primary">{{ sub.name }}</p>
          <p class="text-caption text-text-secondary">
            {{ sub.category?.name ?? '—' }}
            <span v-if="!sub.isActive" class="ml-1 italic text-text-muted">· Paused</span>
          </p>
        </div>

        <!-- Amount + frequency -->
        <div class="shrink-0 text-right">
          <span class="text-body font-medium tabular-nums" :class="amountColorClass(sub)">
            {{ amountPrefix(sub) }}{{ formatCurrency(sub.amount, currency) }}<span class="text-caption text-text-muted">{{ frequencyLabel(sub.frequency) }}</span>
          </span>
        </div>
      </button>
    </div>
  </section>
</template>
