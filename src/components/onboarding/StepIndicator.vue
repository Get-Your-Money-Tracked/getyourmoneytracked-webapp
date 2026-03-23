<script setup lang="ts">
defineProps<{
  /** Total number of steps */
  total: number
  /** 0-based current step index */
  current: number
}>()
</script>

<template>
  <div class="flex items-center justify-center gap-2" role="tablist" aria-label="Onboarding progress">
    <span
      v-for="n in total"
      :key="n"
      role="tab"
      :aria-selected="n - 1 === current"
      :aria-label="`Step ${n} of ${total}`"
      class="h-2 rounded-full transition-all duration-200"
      :class="n - 1 === current ? 'w-6 bg-primary' : 'w-2 bg-surface-muted'"
    />
  </div>
</template>
