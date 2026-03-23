<script setup lang="ts">
// No props needed — this is a pure visual skeleton matching the dashboard layout
</script>

<template>
  <div data-testid="dashboard-skeleton">
    <!-- Header skeleton -->
    <div class="px-4 pt-6 pb-4">
      <div class="h-5 w-36 animate-pulse rounded-md bg-surface-muted" />
      <div class="mt-3 flex items-center justify-center gap-4">
        <div class="h-5 w-5 animate-pulse rounded-md bg-surface-muted" />
        <div class="h-6 w-36 animate-pulse rounded-md bg-surface-muted" />
        <div class="h-5 w-5 animate-pulse rounded-md bg-surface-muted" />
      </div>
    </div>

    <!-- Hero skeleton -->
    <div
      class="mx-4 overflow-hidden rounded-2xl bg-surface p-5"
      :style="{ boxShadow: 'var(--shadow-card)' }"
    >
      <div class="flex flex-col items-center gap-3">
        <div class="h-3 w-24 animate-pulse rounded-md bg-surface-muted" />
        <div class="h-8 w-40 animate-pulse rounded-md bg-surface-muted" />
        <div class="h-3 w-52 animate-pulse rounded-md bg-surface-muted" />
        <div class="mt-2 h-2.5 w-full animate-pulse rounded-full bg-surface-muted" />
      </div>
    </div>

    <!-- Quick actions skeleton -->
    <div class="mt-4 flex gap-3 px-4">
      <div
        v-for="i in 4"
        :key="i"
        class="flex min-w-[72px] flex-col items-center gap-2 rounded-xl bg-surface p-3"
        :style="{ boxShadow: 'var(--shadow-card)' }"
      >
        <div class="h-10 w-10 animate-pulse rounded-full bg-surface-muted" />
        <div class="h-3 w-10 animate-pulse rounded-md bg-surface-muted" />
      </div>
    </div>

    <!-- Section header skeleton -->
    <div class="mt-6 flex items-center justify-between px-4">
      <div class="h-4 w-40 animate-pulse rounded-md bg-surface-muted" />
      <div class="h-3 w-14 animate-pulse rounded-md bg-surface-muted" />
    </div>

    <!-- Transaction rows skeleton -->
    <div
      class="mx-4 mt-2 overflow-hidden rounded-2xl bg-surface"
      :style="{ boxShadow: 'var(--shadow-card)' }"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="flex items-center gap-3 px-4 py-3"
        :class="{ 'border-t border-border': i > 1 }"
      >
        <!-- Icon circle -->
        <div class="h-10 w-10 animate-pulse rounded-full bg-surface-muted flex-shrink-0" />
        <!-- Text bars -->
        <div class="flex flex-1 flex-col gap-1.5">
          <div class="h-4 w-28 animate-pulse rounded-md bg-surface-muted" />
          <div class="h-3 w-16 animate-pulse rounded-md bg-surface-muted" />
        </div>
        <!-- Amount bar -->
        <div class="h-4 w-16 animate-pulse rounded-md bg-surface-muted flex-shrink-0" />
      </div>
    </div>

    <!-- Budget section header skeleton -->
    <div class="mt-6 flex items-center justify-between px-4">
      <div class="h-4 w-32 animate-pulse rounded-md bg-surface-muted" />
      <div class="h-3 w-14 animate-pulse rounded-md bg-surface-muted" />
    </div>

    <!-- Budget rows skeleton -->
    <div
      class="mx-4 mt-2 overflow-hidden rounded-2xl bg-surface"
      :style="{ boxShadow: 'var(--shadow-card)' }"
    >
      <div
        v-for="i in 2"
        :key="i"
        class="px-4 py-3"
        :class="{ 'border-t border-border': i > 1 }"
      >
        <div class="flex items-center gap-2">
          <div class="h-5 w-5 animate-pulse rounded-full bg-surface-muted" />
          <div class="h-4 w-28 animate-pulse rounded-md bg-surface-muted" />
          <div class="ml-auto h-4 w-10 animate-pulse rounded-md bg-surface-muted" />
        </div>
        <div class="mt-2 h-2 w-full animate-pulse rounded-full bg-surface-muted" />
        <div class="mt-1.5 h-3 w-24 animate-pulse rounded-md bg-surface-muted" />
      </div>
    </div>
  </div>
</template>
