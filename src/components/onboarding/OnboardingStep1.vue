<script setup lang="ts">
import { Wallet, Banknote, FolderOpen, Target } from 'lucide-vue-next'

defineProps<{
  displayName: string
}>()
</script>

<template>
  <div class="flex flex-col items-center px-6 py-8 text-center" data-testid="onboarding-step-1">
    <!-- App icon -->
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
      <Wallet :size="32" class="text-primary" aria-hidden="true" />
    </div>

    <!-- Greeting -->
    <h1 class="mt-6 text-xl font-bold text-text-primary" data-testid="step1-greeting">
      Welcome, {{ displayName }}!
    </h1>
    <p class="mt-2 text-body leading-relaxed text-text-secondary">
      You're all set to start tracking your finances.
    </p>

    <p class="mt-4 text-body text-text-secondary">We've created a few things to get you going:</p>

    <!-- Setup summary card -->
    <div
      class="mt-4 w-full rounded-xl bg-surface p-4 text-left"
      :style="{ boxShadow: 'var(--shadow-card)' }"
      data-testid="setup-summary-card"
    >
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <Banknote :size="20" class="flex-shrink-0 text-primary" aria-hidden="true" />
          <span class="text-body text-text-secondary">1 Cash account</span>
        </div>
        <div class="flex items-center gap-3">
          <FolderOpen :size="20" class="flex-shrink-0 text-primary" aria-hidden="true" />
          <span class="text-body text-text-secondary">10 spending categories</span>
        </div>
        <div class="flex items-center gap-3">
          <Target :size="20" class="flex-shrink-0 text-primary" aria-hidden="true" />
          <span class="text-body text-text-secondary">Ready for your first transaction</span>
        </div>
      </div>
    </div>
  </div>
</template>
