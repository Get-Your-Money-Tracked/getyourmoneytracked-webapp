<script setup lang="ts">
import { DollarSign } from 'lucide-vue-next'
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-surface-elevated)]"
    aria-label="Loading"
    role="status"
  >
    <!-- App icon -->
    <div class="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
      <DollarSign :size="28" />
    </div>

    <!-- 3-dot pulse animation -->
    <div class="flex items-center gap-2" aria-hidden="true">
      <span
        class="h-2 w-2 animate-pulse rounded-full bg-primary opacity-60"
        style="animation-delay: 0ms; animation-duration: 1.5s"
      />
      <span
        class="h-2 w-2 animate-pulse rounded-full bg-primary opacity-60"
        style="animation-delay: 300ms; animation-duration: 1.5s"
      />
      <span
        class="h-2 w-2 animate-pulse rounded-full bg-primary opacity-60"
        style="animation-delay: 600ms; animation-duration: 1.5s"
      />
    </div>

    <span class="sr-only">Loading…</span>
  </div>
</template>
