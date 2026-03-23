<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{
  message?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div
    class="mx-4 mt-6 rounded-2xl bg-surface p-8 text-center"
    :style="{ boxShadow: 'var(--shadow-card)' }"
    data-testid="dashboard-error"
  >
    <AlertTriangle
      :size="40"
      class="mx-auto opacity-60"
      style="color: var(--color-warning)"
      aria-hidden="true"
    />
    <h2
      class="mt-4 text-lg font-semibold"
      style="color: var(--color-text-primary)"
      data-testid="dashboard-error-title"
    >
      Couldn't load your dashboard
    </h2>
    <p
      class="mt-2 text-sm"
      style="color: var(--color-text-secondary)"
      data-testid="dashboard-error-message"
    >
      {{ message ?? 'Check your connection and try again.' }}
    </p>
    <button
      type="button"
      class="mt-6 h-11 rounded-xl px-6 font-medium text-white"
      :style="{ backgroundColor: 'var(--color-primary)' }"
      data-testid="dashboard-retry-btn"
      @click="emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
