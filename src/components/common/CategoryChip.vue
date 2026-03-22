<script setup lang="ts">
import type { Category } from '@/types'
import { CATEGORY_CHIP_MAX_LENGTH } from '@/utils/constants'

const props = defineProps<{
  category: Category
  selected?: boolean
  hasChildren?: boolean
}>()

const emit = defineEmits<{
  select: [category: Category]
}>()

function handleSelect() {
  emit('select', props.category)
}
</script>

<template>
  <button
    type="button"
    class="flex w-14 flex-shrink-0 flex-col items-center gap-1 rounded-2xl p-2 transition-all duration-150"
    :class="[
      selected
        ? 'ring-2 ring-primary scale-105'
        : 'hover:bg-surface-muted',
    ]"
    :style="selected ? { backgroundColor: `color-mix(in srgb, ${category.color ?? 'var(--color-primary)'} 10%, transparent)` } : {}"
    :aria-pressed="selected"
    :aria-label="category.name"
    @click="handleSelect"
  >
    <!-- Icon circle -->
    <div
      class="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
      :style="{
        backgroundColor: `color-mix(in srgb, ${category.color ?? 'var(--color-primary)'} 15%, transparent)`,
      }"
    >
      {{ category.icon ?? '📂' }}
    </div>

    <!-- Label -->
    <span
      class="text-badge w-full truncate text-center font-medium"
      :class="selected ? 'text-primary' : 'text-text-secondary'"
    >
      {{ category.name.length > CATEGORY_CHIP_MAX_LENGTH ? category.name.slice(0, CATEGORY_CHIP_MAX_LENGTH - 1) + '…' : category.name }}
    </span>

    <!-- Sub-category indicator -->
    <span
      v-if="hasChildren"
      class="text-badge text-text-muted"
      aria-hidden="true"
    >
      ›
    </span>
  </button>
</template>
