<script setup lang="ts">
import { Delete } from 'lucide-vue-next'

const emit = defineEmits<{
  digit: [value: string]
  decimal: []
  backspace: []
}>()
</script>

<template>
  <div class="grid grid-cols-3 gap-2" role="group" aria-label="Number pad">
    <!-- Row 1: 1 2 3 -->
    <button
      v-for="d in ['1', '2', '3']"
      :key="d"
      type="button"
      class="flex h-14 items-center justify-center rounded-lg bg-surface-muted text-xl font-medium text-text-primary transition-colors duration-150 active:bg-surface-elevated"
      :aria-label="d"
      @click="emit('digit', d)"
    >
      {{ d }}
    </button>

    <!-- Row 2: 4 5 6 -->
    <button
      v-for="d in ['4', '5', '6']"
      :key="d"
      type="button"
      class="flex h-14 items-center justify-center rounded-lg bg-surface-muted text-xl font-medium text-text-primary transition-colors duration-150 active:bg-surface-elevated"
      :aria-label="d"
      @click="emit('digit', d)"
    >
      {{ d }}
    </button>

    <!-- Row 3: 7 8 9 -->
    <button
      v-for="d in ['7', '8', '9']"
      :key="d"
      type="button"
      class="flex h-14 items-center justify-center rounded-lg bg-surface-muted text-xl font-medium text-text-primary transition-colors duration-150 active:bg-surface-elevated"
      :aria-label="d"
      @click="emit('digit', d)"
    >
      {{ d }}
    </button>

    <!-- Row 4: . 0 ⌫ -->
    <button
      type="button"
      class="flex h-14 items-center justify-center rounded-lg bg-surface-muted text-xl font-medium text-text-secondary transition-colors duration-150 active:bg-surface-elevated"
      aria-label="decimal point"
      @click="emit('decimal')"
    >
      .
    </button>
    <button
      type="button"
      class="flex h-14 items-center justify-center rounded-lg bg-surface-muted text-xl font-medium text-text-primary transition-colors duration-150 active:bg-surface-elevated"
      aria-label="0"
      @click="emit('digit', '0')"
    >
      0
    </button>
    <button
      type="button"
      class="flex h-14 items-center justify-center rounded-lg bg-surface-muted text-xl font-medium text-text-secondary transition-colors duration-150 active:bg-surface-elevated"
      aria-label="backspace"
      @click="emit('backspace')"
    >
      <Delete :size="22" />
    </button>
  </div>
</template>
