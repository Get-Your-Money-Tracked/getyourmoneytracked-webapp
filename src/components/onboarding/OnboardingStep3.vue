<script setup lang="ts">
import { Lightbulb } from 'lucide-vue-next'

const emit = defineEmits<{
  logTransaction: []
}>()
</script>

<template>
  <div class="flex flex-col px-6 py-8 text-center" data-testid="onboarding-step-3">
    <!-- Title -->
    <h1 class="text-xl font-bold text-text-primary">You're Ready!</h1>
    <p class="mt-2 text-body leading-relaxed text-text-secondary">
      Start by logging your first expense or income.
    </p>

    <!-- Tips card -->
    <div
      class="mt-6 rounded-xl bg-surface p-5 text-left"
      :style="{ boxShadow: 'var(--shadow-card)' }"
      data-testid="tips-card"
    >
      <div class="flex items-center gap-2">
        <Lightbulb :size="18" class="flex-shrink-0 text-primary" aria-hidden="true" />
        <span class="text-card-title font-semibold text-text-primary">Quick Tips</span>
      </div>
      <ul class="mt-3 space-y-2">
        <li class="flex items-start gap-2">
          <span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <span class="text-caption text-text-secondary">Tap + to add transactions anytime</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <span class="text-caption text-text-secondary">Set budgets to track spending limits</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <span class="text-caption text-text-secondary">Check your dashboard daily for a financial overview</span>
        </li>
      </ul>
    </div>

    <!-- CTA button -->
    <button
      type="button"
      class="mt-8 h-12 w-full rounded-xl font-medium text-white"
      :style="{ backgroundColor: 'var(--color-primary)' }"
      data-testid="log-transaction-btn"
      @click="emit('logTransaction')"
    >
      Log my first transaction →
    </button>
  </div>
</template>
