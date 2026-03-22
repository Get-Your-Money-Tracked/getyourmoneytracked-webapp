<script setup lang="ts">
import type { Category } from '@/types'

const props = defineProps<{
  category: Category
  isSubCategory?: boolean
}>()

const emit = defineEmits<{
  edit: [category: Category]
  moveUp: [category: Category]
  moveDown: [category: Category]
}>()

function handleEdit() {
  emit('edit', props.category)
}

function handleMoveUp() {
  emit('moveUp', props.category)
}

function handleMoveDown() {
  emit('moveDown', props.category)
}
</script>

<template>
  <div
    class="flex items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-surface-muted"
    :class="{ 'pl-10': isSubCategory }"
  >
    <!-- Sub-category indent connector (visual tree line) -->
    <span v-if="isSubCategory" class="mr-1 text-text-muted opacity-50" aria-hidden="true">
      └
    </span>

    <!-- Color dot -->
    <span
      class="h-3 w-3 flex-shrink-0 rounded-full"
      :style="{ backgroundColor: category.color ?? 'var(--color-text-muted)' }"
      aria-hidden="true"
    />

    <!-- Icon -->
    <span class="text-lg leading-none" aria-hidden="true">
      {{ category.icon ?? '📂' }}
    </span>

    <!-- Name -->
    <span class="text-card-title flex-1 text-text-primary">{{ category.name }}</span>

    <!-- Default badge -->
    <span
      v-if="category.isDefault"
      class="text-badge flex-shrink-0 rounded-full px-2 py-0.5 font-medium"
      :style="{
        backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
        color: 'var(--color-primary)',
      }"
    >
      Default
    </span>

    <!-- Reorder buttons -->
    <div class="flex flex-shrink-0 gap-0.5" aria-label="Reorder">
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-secondary"
        aria-label="Move up"
        @click.stop="handleMoveUp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-secondary"
        aria-label="Move down"
        @click.stop="handleMoveDown"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Edit button -->
    <button
      type="button"
      class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-secondary"
      aria-label="Edit category"
      @click="handleEdit"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </button>
  </div>
</template>
