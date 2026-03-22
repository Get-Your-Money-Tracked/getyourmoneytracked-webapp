<script setup lang="ts">
/**
 * MonthSummarySkeletonRow — loading placeholder for MonthSummaryRow.
 * Renders pulsing rectangles matching the real row layout.
 */
</script>

<template>
  <div class="animate-pulse px-4 py-4" data-testid="month-summary-skeleton">
    <!-- Top row: month name + badge -->
    <div class="flex items-center justify-between gap-2">
      <div class="h-4 w-32 rounded bg-surface-muted" />
      <div class="h-5 w-12 rounded-full bg-surface-muted" />
    </div>

    <!-- Bottom row: income + expenses -->
    <div class="mt-2 flex gap-8">
      <div>
        <div class="h-2.5 w-16 rounded bg-surface-muted" />
        <div class="mt-1.5 h-4 w-24 rounded bg-surface-muted" />
      </div>
      <div>
        <div class="h-2.5 w-16 rounded bg-surface-muted" />
        <div class="mt-1.5 h-4 w-24 rounded bg-surface-muted" />
      </div>
    </div>
  </div>
</template>
