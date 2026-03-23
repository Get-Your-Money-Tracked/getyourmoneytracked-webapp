<script setup lang="ts">
import type { Component } from 'vue'

const props = defineProps<{
  /** Lucide icon component to display */
  icon: Component
  /** Bold headline */
  title: string
  /** Descriptive body text */
  description: string
  /** Label for the action button (omit to hide button) */
  actionLabel?: string
  /** Secondary link label (omit to hide) */
  secondaryLabel?: string
  /** Optional data-testid for the action button */
  actionTestId?: string
}>()

const emit = defineEmits<{
  action: []
  secondary: []
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center px-8 py-16 text-center"
    data-testid="empty-state"
  >
    <!-- Icon -->
    <component
      :is="props.icon"
      :size="48"
      class="text-text-muted opacity-60"
      aria-hidden="true"
      data-testid="empty-state-icon"
    />

    <!-- Title -->
    <h2
      class="mt-4 text-section-title font-semibold text-text-primary"
      data-testid="empty-state-title"
    >
      {{ title }}
    </h2>

    <!-- Description -->
    <p
      class="mt-2 max-w-xs text-body leading-relaxed text-text-secondary"
      data-testid="empty-state-description"
    >
      {{ description }}
    </p>

    <!-- Action button -->
    <button
      v-if="actionLabel"
      type="button"
      class="mt-6 h-11 rounded-xl px-6 font-medium text-white"
      :style="{ backgroundColor: 'var(--color-primary)' }"
      :data-testid="actionTestId ?? 'empty-state-action'"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>

    <!-- Secondary link -->
    <button
      v-if="secondaryLabel"
      type="button"
      class="mt-3 text-caption font-medium text-primary"
      data-testid="empty-state-secondary"
      @click="emit('secondary')"
    >
      {{ secondaryLabel }}
    </button>
  </div>
</template>
